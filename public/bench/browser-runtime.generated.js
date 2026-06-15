// PureScript ADT constructors compile to objects with stable `valueN` fields
// (part of the compiler's ABI). We dispatch on field presence rather than
// `constructor.name` so this code survives bundling/minification.
//
//   Html msg
//     = Text String                                          → { value0: str }
//     | Element String (Array (Attribute msg)) (Array Html)  → { value0, value1, value2 }
//     | Keyed { tag, attrs, children }                       → { value0: object }
//
//   Attribute msg
//     = Attribute String String                  → { value0: str, value1: str }
//     | OnClick (Effect Unit)                    → { value0: function }
//     | OnEvent String (Event -> Effect Unit)    → { value0: str, value1: function }
//     | OnEventOptions String EventOptions (...) → { value0: str, value1: obj, value2: function }
//
// Rendering does positional diffing in place rather than rebuilding the whole
// tree. Plain `Element` children are matched by index. `Keyed` children are
// matched by their string key across rerenders, so reordering preserves DOM
// identity (focus, scroll position, listener state) instead of being treated
// as a series of in-place mutations.

function isObject(value) {
  return value !== null && typeof value === "object";
}

function isTextHtml(node) {
  return isObject(node)
    && "value0" in node
    && !("value1" in node)
    && typeof node.value0 === "string";
}

function isKeyedHtml(node) {
  return isObject(node)
    && "value0" in node
    && !("value1" in node)
    && isObject(node.value0);
}

function isElementHtml(node) {
  return isObject(node) && "value2" in node;
}

var SVG_NS = "http://www.w3.org/2000/svg";
var MATH_NS = "http://www.w3.org/1998/Math/MathML";
var HTML_NS = "http://www.w3.org/1999/xhtml";

function namespaceForTag(tag, parentNamespace) {
  var lower = String(tag).toLowerCase();
  if (lower === "svg") return SVG_NS;
  if (lower === "math") return MATH_NS;
  return parentNamespace || null;
}

function childNamespaceForTag(tag, namespace) {
  var lower = String(tag).toLowerCase();
  if (namespace === SVG_NS && lower === "foreignobject") return null;
  return namespace;
}

function createElement(tag, namespace) {
  if (namespace) {
    return document.createElementNS(namespace, tag);
  }
  return document.createElement(tag);
}

function createNode(html, parentNamespace) {
  if (!isObject(html)) return document.createTextNode("");
  if (isTextHtml(html)) return document.createTextNode(html.value0);
  if (isElementHtml(html)) {
    var namespace = namespaceForTag(html.value0, parentNamespace);
    var element = createElement(html.value0, namespace);
    var childNamespace = childNamespaceForTag(html.value0, namespace);
    applyAttributes(element, [], html.value1);
    for (var i = 0; i < html.value2.length; i += 1) {
      element.appendChild(createNode(html.value2[i], childNamespace));
    }
    return element;
  }
  if (isKeyedHtml(html)) {
    var record = html.value0;
    var keyedNamespace = namespaceForTag(record.tag, parentNamespace);
    var keyedChildNamespace = childNamespaceForTag(record.tag, keyedNamespace);
    var keyedEl = createElement(record.tag, keyedNamespace);
    applyAttributes(keyedEl, [], record.attrs);
    var keyMap = {};
    for (var j = 0; j < record.children.length; j += 1) {
      var pair = record.children[j];
      var pairKey = pair.value0;
      // Duplicate keys are a user error; collapse to "last wins" to match the
      // re-render path's behaviour (where insertBefore detaches on collision).
      if (keyMap[pairKey] !== undefined) {
        keyedEl.removeChild(keyMap[pairKey]);
      }
      var childNode = createNode(pair.value1, keyedChildNamespace);
      keyedEl.appendChild(childNode);
      keyMap[pairKey] = childNode;
    }
    keyedEl._psSpaKeyMap = keyMap;
    return keyedEl;
  }
  return document.createTextNode("");
}

function reconcileChildren(parent, nextChildren, namespace) {
  var existing = [];
  for (var k = 0; k < parent.childNodes.length; k += 1) {
    existing.push(parent.childNodes[k]);
  }

  var max = existing.length > nextChildren.length ? existing.length : nextChildren.length;
  for (var i = 0; i < max; i += 1) {
    var domNode = existing[i];
    var nextHtml = nextChildren[i];

    if (nextHtml === undefined) {
      parent.removeChild(domNode);
    } else if (domNode === undefined) {
      parent.appendChild(createNode(nextHtml, namespace));
    } else {
      patchNode(parent, domNode, nextHtml, namespace);
    }
  }
}

function reconcileKeyedChildren(parent, nextPairs, namespace) {
  // Old key→DOM map from the previous render (may be undefined on the first
  // keyed render or after an Element→Keyed transition).
  var oldKeyMap = parent._psSpaKeyMap || {};
  var nextKeyMap = {};
  var nextKeySet = Object.create(null);

  for (var i = 0; i < nextPairs.length; i += 1) {
    nextKeySet[nextPairs[i].value0] = true;
  }

  // Detach old keyed nodes that aren't in the next render.
  for (var oldKey in oldKeyMap) {
    if (!nextKeySet[oldKey]) {
      var stale = oldKeyMap[oldKey];
      if (stale.parentNode === parent) {
        parent.removeChild(stale);
      }
    }
  }

  for (var j = 0; j < nextPairs.length; j += 1) {
    var pair = nextPairs[j];
    var key = pair.value0;
    var nextHtml = pair.value1;
    var existing = oldKeyMap[key];
    var resolved;

    if (existing && existing.parentNode === parent) {
      // Patch in place; patchNode may replace the node if the tag changed,
      // in which case it returns the freshly created replacement.
      resolved = patchNode(parent, existing, nextHtml, namespace) || existing;
    } else {
      resolved = createNode(nextHtml, namespace);
    }

    nextKeyMap[key] = resolved;

    var currentAtJ = parent.childNodes[j];
    if (currentAtJ !== resolved) {
      parent.insertBefore(resolved, currentAtJ || null);
    }
  }

  // Trim leftover non-keyed children (from an Element→Keyed transition).
  while (parent.childNodes.length > nextPairs.length) {
    parent.removeChild(parent.childNodes[parent.childNodes.length - 1]);
  }

  parent._psSpaKeyMap = nextKeyMap;
}

function sameElementTag(domNode, tag, namespace) {
  if (domNode.nodeType !== 1) return false;
  if (normalizeNamespace(domNode.namespaceURI) !== normalizeNamespace(namespace)) return false;
  return domNode.nodeName.toLowerCase() === String(tag).toLowerCase();
}

function normalizeNamespace(namespace) {
  return namespace === HTML_NS ? null : namespace || null;
}

function patchNode(parent, domNode, nextHtml, parentNamespace) {
  if (isTextHtml(nextHtml)) {
    if (domNode.nodeType === 3) {
      if (domNode.nodeValue !== nextHtml.value0) {
        domNode.nodeValue = nextHtml.value0;
      }
      return domNode;
    }
    var freshText = document.createTextNode(nextHtml.value0);
    parent.replaceChild(freshText, domNode);
    return freshText;
  }

  if (isKeyedHtml(nextHtml)) {
    var record = nextHtml.value0;
    var keyedNamespace = namespaceForTag(record.tag, parentNamespace);
    var keyedChildNamespace = childNamespaceForTag(record.tag, keyedNamespace);
    if (!sameElementTag(domNode, record.tag, keyedNamespace)) {
      var freshKeyed = createNode(nextHtml, parentNamespace);
      parent.replaceChild(freshKeyed, domNode);
      return freshKeyed;
    }
    var keyedScrollTop = domNode.scrollTop;
    var keyedScrollLeft = domNode.scrollLeft;
    var previousAttrsKeyed = domNode._psSpaAttrs || [];
    applyAttributes(domNode, previousAttrsKeyed, record.attrs);
    reconcileKeyedChildren(domNode, record.children, keyedChildNamespace);
    restoreScrollPosition(domNode, keyedScrollTop, keyedScrollLeft);
    return domNode;
  }

  if (!isElementHtml(nextHtml)) {
    var emptyText = document.createTextNode("");
    parent.replaceChild(emptyText, domNode);
    return emptyText;
  }

  var nextTag = nextHtml.value0;
  var namespace = namespaceForTag(nextTag, parentNamespace);
  var childNamespace = childNamespaceForTag(nextTag, namespace);
  if (!sameElementTag(domNode, nextTag, namespace)) {
    var freshEl = createNode(nextHtml, parentNamespace);
    parent.replaceChild(freshEl, domNode);
    return freshEl;
  }

  // Same tag — diff attrs and children in place. Preserves input focus,
  // scroll position, video playback state, etc.
  var previousScrollTop = domNode.scrollTop;
  var previousScrollLeft = domNode.scrollLeft;
  var previousAttrs = domNode._psSpaAttrs || [];
  applyAttributes(domNode, previousAttrs, nextHtml.value1);
  // Switching from Keyed to plain Element on the same tag: drop the stale map.
  if (domNode._psSpaKeyMap) {
    domNode._psSpaKeyMap = null;
  }
  reconcileChildren(domNode, nextHtml.value2, childNamespace);
  restoreScrollPosition(domNode, previousScrollTop, previousScrollLeft);
  return domNode;
}

function restoreScrollPosition(element, scrollTop, scrollLeft) {
  if (typeof scrollTop === "number" && element.scrollTop !== scrollTop) {
    element.scrollTop = scrollTop;
  }
  if (typeof scrollLeft === "number" && element.scrollLeft !== scrollLeft) {
    element.scrollLeft = scrollLeft;
  }
}

function setDomAttribute(element, name, value) {
  if (element.getAttribute(name) !== value) {
    element.setAttribute(name, value);
  }

  if (name === "value" || name === "checked" || name === "selected" || name === "muted") {
    syncDomProperty(element, name, value);
  }
}

function removeDomAttribute(element, name) {
  element.removeAttribute(name);

  if (name === "value") {
    element.value = "";
  } else if (name === "checked" || name === "selected" || name === "muted") {
    element[name] = false;
  }
}

function syncDomProperty(element, name, value) {
  if (name === "value") {
    if (element.value !== value) element.value = value;
  } else if (name === "checked" || name === "selected" || name === "muted") {
    element[name] = value !== "false" && value !== "";
  }
}

function applyAttributes(element, previousAttrs, nextAttrs) {
  var previousListeners = element._psSpaListeners || {};
  var nextListeners = {};
  var nextListenerCounts = {};
  var previousAttrNames = {};
  var nextAttrNames = {};

  for (var p = 0; p < previousAttrs.length; p += 1) {
    var prev = previousAttrs[p];
    if (isObject(prev) && !("value2" in prev) && "value1" in prev && typeof prev.value1 !== "function") {
      previousAttrNames[prev.value0] = true;
    }
  }

  for (var i = 0; i < nextAttrs.length; i += 1) {
    var attr = nextAttrs[i];
    if (!isObject(attr)) continue;

    if ("value2" in attr && typeof attr.value2 === "function") {
      // OnEventOptions name options handler
      var optionEventName = attr.value0;
      var options = attr.value1 || {};
      var optionHandler = attr.value2;
      var optionListenerKey = nextListenerKey(nextListenerCounts, optionEventName);
      nextListeners[optionListenerKey] = upsertEventListener(
        element,
        previousListeners[optionListenerKey],
        optionEventName,
        "options",
        options,
        (function (opts, h) {
        return function (event) {
          if (opts.preventDefault && event && typeof event.preventDefault === "function") {
            event.preventDefault();
          }
          if (opts.stopPropagation && event && typeof event.stopPropagation === "function") {
            event.stopPropagation();
          }
          h(event)();
        };
        })(options, optionHandler)
      );
    } else if ("value1" in attr && typeof attr.value1 === "function") {
      // OnEvent name handler
      var eventName = attr.value0;
      var handler = attr.value1;
      var listenerKey = nextListenerKey(nextListenerCounts, eventName);
      nextListeners[listenerKey] = upsertEventListener(
        element,
        previousListeners[listenerKey],
        eventName,
        "event",
        null,
        (function (h) {
          return function (event) { h(event)(); };
        })(handler)
      );
    } else if ("value1" in attr) {
      // regular Attribute name value
      var attrName = attr.value0;
      nextAttrNames[attrName] = true;
      setDomAttribute(element, attrName, attr.value1);
    } else if ("value0" in attr) {
      // legacy OnClick — value0 is an Effect Unit thunk
      var message = attr.value0;
      var clickListenerKey = nextListenerKey(nextListenerCounts, "click");
      nextListeners[clickListenerKey] = upsertEventListener(
        element,
        previousListeners[clickListenerKey],
        "click",
        "click",
        null,
        (function (m) {
          return function (_event) { m(); };
        })(message)
      );
    }
  }

  for (var name in previousAttrNames) {
    if (!nextAttrNames[name]) {
      removeDomAttribute(element, name);
    }
  }

  for (var listenerName in previousListeners) {
    if (!nextListeners[listenerName]) {
      removeStoredListener(element, listenerName, previousListeners[listenerName]);
    }
  }

  element._psSpaAttrs = nextAttrs;
  element._psSpaListeners = nextListeners;
}

function nextListenerKey(counts, eventName) {
  var index = counts[eventName] || 0;
  counts[eventName] = index + 1;
  return eventName + "#" + index;
}

function upsertEventListener(element, previous, eventName, kind, options, invoke) {
  if (
    previous
    && previous.eventName === eventName
    && previous.kind === kind
    && sameEventOptions(previous.options, options)
  ) {
    previous.invoke = invoke;
    return previous;
  }

  if (previous) {
    removeStoredListener(element, eventName, previous);
  }

  var record = {
    eventName: eventName,
    kind: kind,
    options: cloneEventOptions(options),
    invoke: invoke,
    listener: null
  };

  record.listener = function (event) {
    record.invoke(event);
  };

  element.addEventListener(eventName, record.listener);
  return record;
}

function removeStoredListener(element, listenerName, stored) {
  if (stored && stored.listener) {
    element.removeEventListener(stored.eventName, stored.listener);
  } else if (typeof stored === "function") {
    element.removeEventListener(listenerName, stored);
  }
}

function cloneEventOptions(options) {
  if (!options) return null;
  return {
    preventDefault: Boolean(options.preventDefault),
    stopPropagation: Boolean(options.stopPropagation)
  };
}

function sameEventOptions(left, right) {
  var a = cloneEventOptions(left);
  var b = cloneEventOptions(right);
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.preventDefault === b.preventDefault && a.stopPropagation === b.stopPropagation;
}

export const renderDocument = function (config) {
  return function () {
    var root = document.getElementById(config.rootId) || document.body;

    if (!root) {
      return;
    }

    document.title = config.document.title;
    reconcileChildren(root, config.document.body, null);
  };
};

export const currentPath = function () {
  return window.location.pathname + window.location.search + window.location.hash;
};

export const pushUrl = function (url) {
  return function () {
    window.history.pushState({}, "", url);
  };
};

export const replaceUrl = function (url) {
  return function () {
    window.history.replaceState({}, "", url);
  };
};

export const onPopState = function (handler) {
  return function () {
    var listener = function () {
      handler();
    };

    window.addEventListener("popstate", listener);

    return function () {
      window.removeEventListener("popstate", listener);
    };
  };
};

export const onInternalUrlRequest = function (handler) {
  return function () {
    var listener = function (event) {
      if (event.defaultPrevented) {
        return;
      }

      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      var node = event.target;

      while (node && node !== document.body) {
        if (node.tagName === "A") {
          var href = node.getAttribute("href");

          if (!href || href.charAt(0) === "#") {
            return;
          }

          if (node.getAttribute("target") || node.getAttribute("download") !== null) {
            return;
          }

          var url;
          try {
            url = new URL(href, window.location.href);
          } catch (_error) {
            return;
          }

          if (url.origin !== window.location.origin || (url.protocol !== "http:" && url.protocol !== "https:")) {
            return;
          }

          event.preventDefault();
          handler(url.pathname + url.search + url.hash)();
          return;
        }

        node = node.parentNode;
      }
    };

    document.addEventListener("click", listener);

    return function () {
      document.removeEventListener("click", listener);
    };
  };
};
