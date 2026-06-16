var Verdict = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all5) => {
    for (var name2 in all5)
      __defProp(target, name2, { get: all5[name2], enumerable: true });
  };
  var __copyProps = (to, from2, except, desc) => {
    if (from2 && typeof from2 === "object" || typeof from2 === "function") {
      for (let key of __getOwnPropNames(from2))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from2[key], enumerable: !(desc = __getOwnPropDesc(from2, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod5) => __copyProps(__defProp({}, "__esModule", { value: true }), mod5);

  // .tmp-verdict-build/output/Verdict.Compiler/index.js
  var index_exports = {};
  __export(index_exports, {
    compile: () => compile2,
    compileJS: () => compileJS,
    compileJson: () => compileJson,
    compileProgram: () => compileProgram,
    compileProject: () => compileProject,
    compileProjectJS: () => compileProjectJS,
    diagnosticsJS: () => diagnosticsJS,
    evalBindingsJS: () => evalBindingsJS,
    runJS: () => runJS,
    runProjectJS: () => runProjectJS,
    runProjectToJson: () => runProjectToJson,
    runToJson: () => runToJson,
    runWithLogsJS: () => runWithLogsJS,
    signaturesJS: () => signaturesJS
  });

  // .tmp-verdict-build/output/Control.Bind/foreign.js
  var arrayBind = typeof Array.prototype.flatMap === "function" ? function(arr) {
    return function(f) {
      return arr.flatMap(f);
    };
  } : function(arr) {
    return function(f) {
      var result = [];
      var l = arr.length;
      for (var i = 0; i < l; i++) {
        var xs = f(arr[i]);
        var k = xs.length;
        for (var j = 0; j < k; j++) {
          result.push(xs[j]);
        }
      }
      return result;
    };
  };

  // .tmp-verdict-build/output/Control.Apply/foreign.js
  var arrayApply = function(fs) {
    return function(xs) {
      var l = fs.length;
      var k = xs.length;
      var result = new Array(l * k);
      var n = 0;
      for (var i = 0; i < l; i++) {
        var f = fs[i];
        for (var j = 0; j < k; j++) {
          result[n++] = f(xs[j]);
        }
      }
      return result;
    };
  };

  // .tmp-verdict-build/output/Control.Semigroupoid/index.js
  var semigroupoidFn = {
    compose: function(f) {
      return function(g) {
        return function(x) {
          return f(g(x));
        };
      };
    }
  };

  // .tmp-verdict-build/output/Control.Category/index.js
  var identity = function(dict) {
    return dict.identity;
  };
  var categoryFn = {
    identity: function(x) {
      return x;
    },
    Semigroupoid0: function() {
      return semigroupoidFn;
    }
  };

  // .tmp-verdict-build/output/Data.Boolean/index.js
  var otherwise = true;

  // .tmp-verdict-build/output/Data.Function/index.js
  var flip = function(f) {
    return function(b) {
      return function(a) {
        return f(a)(b);
      };
    };
  };
  var $$const = function(a) {
    return function(v) {
      return a;
    };
  };

  // .tmp-verdict-build/output/Data.Functor/foreign.js
  var arrayMap = function(f) {
    return function(arr) {
      var l = arr.length;
      var result = new Array(l);
      for (var i = 0; i < l; i++) {
        result[i] = f(arr[i]);
      }
      return result;
    };
  };

  // .tmp-verdict-build/output/Data.Unit/foreign.js
  var unit = void 0;

  // .tmp-verdict-build/output/Type.Proxy/index.js
  var $$Proxy = /* @__PURE__ */ function() {
    function $$Proxy2() {
    }
    ;
    $$Proxy2.value = new $$Proxy2();
    return $$Proxy2;
  }();

  // .tmp-verdict-build/output/Data.Functor/index.js
  var map = function(dict) {
    return dict.map;
  };
  var $$void = function(dictFunctor) {
    return map(dictFunctor)($$const(unit));
  };
  var voidLeft = function(dictFunctor) {
    var map115 = map(dictFunctor);
    return function(f) {
      return function(x) {
        return map115($$const(x))(f);
      };
    };
  };
  var functorArray = {
    map: arrayMap
  };

  // .tmp-verdict-build/output/Control.Apply/index.js
  var identity2 = /* @__PURE__ */ identity(categoryFn);
  var applyArray = {
    apply: arrayApply,
    Functor0: function() {
      return functorArray;
    }
  };
  var apply = function(dict) {
    return dict.apply;
  };
  var applyFirst = function(dictApply) {
    var apply1 = apply(dictApply);
    var map33 = map(dictApply.Functor0());
    return function(a) {
      return function(b) {
        return apply1(map33($$const)(a))(b);
      };
    };
  };
  var applySecond = function(dictApply) {
    var apply1 = apply(dictApply);
    var map33 = map(dictApply.Functor0());
    return function(a) {
      return function(b) {
        return apply1(map33($$const(identity2))(a))(b);
      };
    };
  };
  var lift2 = function(dictApply) {
    var apply1 = apply(dictApply);
    var map33 = map(dictApply.Functor0());
    return function(f) {
      return function(a) {
        return function(b) {
          return apply1(map33(f)(a))(b);
        };
      };
    };
  };

  // .tmp-verdict-build/output/Control.Applicative/index.js
  var pure = function(dict) {
    return dict.pure;
  };
  var when = function(dictApplicative) {
    var pure12 = pure(dictApplicative);
    return function(v) {
      return function(v1) {
        if (v) {
          return v1;
        }
        ;
        if (!v) {
          return pure12(unit);
        }
        ;
        throw new Error("Failed pattern match at Control.Applicative (line 63, column 1 - line 63, column 63): " + [v.constructor.name, v1.constructor.name]);
      };
    };
  };

  // .tmp-verdict-build/output/Control.Bind/index.js
  var discard = function(dict) {
    return dict.discard;
  };
  var bindArray = {
    bind: arrayBind,
    Apply0: function() {
      return applyArray;
    }
  };
  var bind = function(dict) {
    return dict.bind;
  };
  var bindFlipped = function(dictBind) {
    return flip(bind(dictBind));
  };
  var discardUnit = {
    discard: function(dictBind) {
      return bind(dictBind);
    }
  };

  // .tmp-verdict-build/output/Data.Argonaut.Core/foreign.js
  function id(x) {
    return x;
  }
  var jsonNull = null;
  function stringify(j) {
    return JSON.stringify(j);
  }
  function stringifyWithIndent(i) {
    return function(j) {
      return JSON.stringify(j, null, i);
    };
  }
  function _caseJson(isNull, isBool, isNum, isStr, isArr, isObj, j) {
    if (j == null) return isNull();
    else if (typeof j === "boolean") return isBool(j);
    else if (typeof j === "number") return isNum(j);
    else if (typeof j === "string") return isStr(j);
    else if (Object.prototype.toString.call(j) === "[object Array]")
      return isArr(j);
    else return isObj(j);
  }

  // .tmp-verdict-build/output/Data.Eq/foreign.js
  var refEq = function(r1) {
    return function(r2) {
      return r1 === r2;
    };
  };
  var eqBooleanImpl = refEq;
  var eqIntImpl = refEq;
  var eqCharImpl = refEq;
  var eqStringImpl = refEq;
  var eqArrayImpl = function(f) {
    return function(xs) {
      return function(ys) {
        if (xs.length !== ys.length) return false;
        for (var i = 0; i < xs.length; i++) {
          if (!f(xs[i])(ys[i])) return false;
        }
        return true;
      };
    };
  };

  // .tmp-verdict-build/output/Data.Symbol/index.js
  var reflectSymbol = function(dict) {
    return dict.reflectSymbol;
  };

  // .tmp-verdict-build/output/Record.Unsafe/foreign.js
  var unsafeGet = function(label) {
    return function(rec) {
      return rec[label];
    };
  };

  // .tmp-verdict-build/output/Data.Eq/index.js
  var eqUnit = {
    eq: function(v) {
      return function(v1) {
        return true;
      };
    }
  };
  var eqString = {
    eq: eqStringImpl
  };
  var eqInt = {
    eq: eqIntImpl
  };
  var eqChar = {
    eq: eqCharImpl
  };
  var eqBoolean = {
    eq: eqBooleanImpl
  };
  var eq = function(dict) {
    return dict.eq;
  };
  var eq2 = /* @__PURE__ */ eq(eqBoolean);
  var eqArray = function(dictEq) {
    return {
      eq: eqArrayImpl(eq(dictEq))
    };
  };
  var notEq = function(dictEq) {
    var eq34 = eq(dictEq);
    return function(x) {
      return function(y) {
        return eq2(eq34(x)(y))(false);
      };
    };
  };

  // .tmp-verdict-build/output/Data.Semigroup/foreign.js
  var concatArray = function(xs) {
    return function(ys) {
      if (xs.length === 0) return ys;
      if (ys.length === 0) return xs;
      return xs.concat(ys);
    };
  };

  // .tmp-verdict-build/output/Data.Semigroup/index.js
  var semigroupArray = {
    append: concatArray
  };
  var append = function(dict) {
    return dict.append;
  };

  // .tmp-verdict-build/output/Control.Alt/index.js
  var alt = function(dict) {
    return dict.alt;
  };

  // .tmp-verdict-build/output/Data.Bounded/foreign.js
  var topInt = 2147483647;
  var bottomInt = -2147483648;
  var topChar = String.fromCharCode(65535);
  var bottomChar = String.fromCharCode(0);
  var topNumber = Number.POSITIVE_INFINITY;
  var bottomNumber = Number.NEGATIVE_INFINITY;

  // .tmp-verdict-build/output/Data.Ord/foreign.js
  var unsafeCompareImpl = function(lt) {
    return function(eq5) {
      return function(gt) {
        return function(x) {
          return function(y) {
            return x < y ? lt : x === y ? eq5 : gt;
          };
        };
      };
    };
  };
  var ordIntImpl = unsafeCompareImpl;
  var ordStringImpl = unsafeCompareImpl;
  var ordCharImpl = unsafeCompareImpl;

  // .tmp-verdict-build/output/Data.Ordering/index.js
  var LT = /* @__PURE__ */ function() {
    function LT2() {
    }
    ;
    LT2.value = new LT2();
    return LT2;
  }();
  var GT = /* @__PURE__ */ function() {
    function GT2() {
    }
    ;
    GT2.value = new GT2();
    return GT2;
  }();
  var EQ = /* @__PURE__ */ function() {
    function EQ2() {
    }
    ;
    EQ2.value = new EQ2();
    return EQ2;
  }();
  var eqOrdering = {
    eq: function(v) {
      return function(v1) {
        if (v instanceof LT && v1 instanceof LT) {
          return true;
        }
        ;
        if (v instanceof GT && v1 instanceof GT) {
          return true;
        }
        ;
        if (v instanceof EQ && v1 instanceof EQ) {
          return true;
        }
        ;
        return false;
      };
    }
  };

  // .tmp-verdict-build/output/Data.Ring/foreign.js
  var intSub = function(x) {
    return function(y) {
      return x - y | 0;
    };
  };
  var numSub = function(n1) {
    return function(n2) {
      return n1 - n2;
    };
  };

  // .tmp-verdict-build/output/Data.Semiring/foreign.js
  var intAdd = function(x) {
    return function(y) {
      return x + y | 0;
    };
  };
  var intMul = function(x) {
    return function(y) {
      return x * y | 0;
    };
  };
  var numAdd = function(n1) {
    return function(n2) {
      return n1 + n2;
    };
  };
  var numMul = function(n1) {
    return function(n2) {
      return n1 * n2;
    };
  };

  // .tmp-verdict-build/output/Data.Semiring/index.js
  var zero = function(dict) {
    return dict.zero;
  };
  var semiringNumber = {
    add: numAdd,
    zero: 0,
    mul: numMul,
    one: 1
  };
  var semiringInt = {
    add: intAdd,
    zero: 0,
    mul: intMul,
    one: 1
  };

  // .tmp-verdict-build/output/Data.Ring/index.js
  var sub = function(dict) {
    return dict.sub;
  };
  var ringNumber = {
    sub: numSub,
    Semiring0: function() {
      return semiringNumber;
    }
  };
  var ringInt = {
    sub: intSub,
    Semiring0: function() {
      return semiringInt;
    }
  };
  var negate = function(dictRing) {
    var sub1 = sub(dictRing);
    var zero2 = zero(dictRing.Semiring0());
    return function(a) {
      return sub1(zero2)(a);
    };
  };

  // .tmp-verdict-build/output/Data.Ord/index.js
  var ordString = /* @__PURE__ */ function() {
    return {
      compare: ordStringImpl(LT.value)(EQ.value)(GT.value),
      Eq0: function() {
        return eqString;
      }
    };
  }();
  var ordInt = /* @__PURE__ */ function() {
    return {
      compare: ordIntImpl(LT.value)(EQ.value)(GT.value),
      Eq0: function() {
        return eqInt;
      }
    };
  }();
  var ordChar = /* @__PURE__ */ function() {
    return {
      compare: ordCharImpl(LT.value)(EQ.value)(GT.value),
      Eq0: function() {
        return eqChar;
      }
    };
  }();
  var compare = function(dict) {
    return dict.compare;
  };
  var comparing = function(dictOrd) {
    var compare32 = compare(dictOrd);
    return function(f) {
      return function(x) {
        return function(y) {
          return compare32(f(x))(f(y));
        };
      };
    };
  };
  var max = function(dictOrd) {
    var compare32 = compare(dictOrd);
    return function(x) {
      return function(y) {
        var v = compare32(x)(y);
        if (v instanceof LT) {
          return y;
        }
        ;
        if (v instanceof EQ) {
          return x;
        }
        ;
        if (v instanceof GT) {
          return x;
        }
        ;
        throw new Error("Failed pattern match at Data.Ord (line 181, column 3 - line 184, column 12): " + [v.constructor.name]);
      };
    };
  };
  var min = function(dictOrd) {
    var compare32 = compare(dictOrd);
    return function(x) {
      return function(y) {
        var v = compare32(x)(y);
        if (v instanceof LT) {
          return x;
        }
        ;
        if (v instanceof EQ) {
          return x;
        }
        ;
        if (v instanceof GT) {
          return y;
        }
        ;
        throw new Error("Failed pattern match at Data.Ord (line 172, column 3 - line 175, column 12): " + [v.constructor.name]);
      };
    };
  };

  // .tmp-verdict-build/output/Data.Bounded/index.js
  var top = function(dict) {
    return dict.top;
  };
  var boundedInt = {
    top: topInt,
    bottom: bottomInt,
    Ord0: function() {
      return ordInt;
    }
  };
  var boundedChar = {
    top: topChar,
    bottom: bottomChar,
    Ord0: function() {
      return ordChar;
    }
  };
  var bottom = function(dict) {
    return dict.bottom;
  };

  // .tmp-verdict-build/output/Data.Show/foreign.js
  var showIntImpl = function(n) {
    return n.toString();
  };
  var showNumberImpl = function(n) {
    var str = n.toString();
    return isNaN(str + ".0") ? str : str + ".0";
  };
  var showCharImpl = function(c) {
    var code = c.charCodeAt(0);
    if (code < 32 || code === 127) {
      switch (c) {
        case "\x07":
          return "'\\a'";
        case "\b":
          return "'\\b'";
        case "\f":
          return "'\\f'";
        case "\n":
          return "'\\n'";
        case "\r":
          return "'\\r'";
        case "	":
          return "'\\t'";
        case "\v":
          return "'\\v'";
      }
      return "'\\" + code.toString(10) + "'";
    }
    return c === "'" || c === "\\" ? "'\\" + c + "'" : "'" + c + "'";
  };
  var showStringImpl = function(s) {
    var l = s.length;
    return '"' + s.replace(
      /[\0-\x1F\x7F"\\]/g,
      // eslint-disable-line no-control-regex
      function(c, i) {
        switch (c) {
          case '"':
          case "\\":
            return "\\" + c;
          case "\x07":
            return "\\a";
          case "\b":
            return "\\b";
          case "\f":
            return "\\f";
          case "\n":
            return "\\n";
          case "\r":
            return "\\r";
          case "	":
            return "\\t";
          case "\v":
            return "\\v";
        }
        var k = i + 1;
        var empty6 = k < l && s[k] >= "0" && s[k] <= "9" ? "\\&" : "";
        return "\\" + c.charCodeAt(0).toString(10) + empty6;
      }
    ) + '"';
  };
  var showArrayImpl = function(f) {
    return function(xs) {
      var ss = [];
      for (var i = 0, l = xs.length; i < l; i++) {
        ss[i] = f(xs[i]);
      }
      return "[" + ss.join(",") + "]";
    };
  };

  // .tmp-verdict-build/output/Data.Show/index.js
  var showString = {
    show: showStringImpl
  };
  var showRecordFields = function(dict) {
    return dict.showRecordFields;
  };
  var showRecord = function() {
    return function() {
      return function(dictShowRecordFields) {
        var showRecordFields1 = showRecordFields(dictShowRecordFields);
        return {
          show: function(record) {
            return "{" + (showRecordFields1($$Proxy.value)(record) + "}");
          }
        };
      };
    };
  };
  var showNumber = {
    show: showNumberImpl
  };
  var showInt = {
    show: showIntImpl
  };
  var showChar = {
    show: showCharImpl
  };
  var showBoolean = {
    show: function(v) {
      if (v) {
        return "true";
      }
      ;
      if (!v) {
        return "false";
      }
      ;
      throw new Error("Failed pattern match at Data.Show (line 29, column 1 - line 31, column 23): " + [v.constructor.name]);
    }
  };
  var show = function(dict) {
    return dict.show;
  };
  var showArray = function(dictShow) {
    return {
      show: showArrayImpl(show(dictShow))
    };
  };
  var showRecordFieldsCons = function(dictIsSymbol) {
    var reflectSymbol2 = reflectSymbol(dictIsSymbol);
    return function(dictShowRecordFields) {
      var showRecordFields1 = showRecordFields(dictShowRecordFields);
      return function(dictShow) {
        var show18 = show(dictShow);
        return {
          showRecordFields: function(v) {
            return function(record) {
              var tail2 = showRecordFields1($$Proxy.value)(record);
              var key = reflectSymbol2($$Proxy.value);
              var focus = unsafeGet(key)(record);
              return " " + (key + (": " + (show18(focus) + ("," + tail2))));
            };
          }
        };
      };
    };
  };
  var showRecordFieldsConsNil = function(dictIsSymbol) {
    var reflectSymbol2 = reflectSymbol(dictIsSymbol);
    return function(dictShow) {
      var show18 = show(dictShow);
      return {
        showRecordFields: function(v) {
          return function(record) {
            var key = reflectSymbol2($$Proxy.value);
            var focus = unsafeGet(key)(record);
            return " " + (key + (": " + (show18(focus) + " ")));
          };
        }
      };
    };
  };

  // .tmp-verdict-build/output/Data.Generic.Rep/index.js
  var from = function(dict) {
    return dict.from;
  };

  // .tmp-verdict-build/output/Data.Maybe/index.js
  var identity3 = /* @__PURE__ */ identity(categoryFn);
  var Nothing = /* @__PURE__ */ function() {
    function Nothing2() {
    }
    ;
    Nothing2.value = new Nothing2();
    return Nothing2;
  }();
  var Just = /* @__PURE__ */ function() {
    function Just2(value0) {
      this.value0 = value0;
    }
    ;
    Just2.create = function(value0) {
      return new Just2(value0);
    };
    return Just2;
  }();
  var maybe = function(v) {
    return function(v1) {
      return function(v2) {
        if (v2 instanceof Nothing) {
          return v;
        }
        ;
        if (v2 instanceof Just) {
          return v1(v2.value0);
        }
        ;
        throw new Error("Failed pattern match at Data.Maybe (line 237, column 1 - line 237, column 51): " + [v.constructor.name, v1.constructor.name, v2.constructor.name]);
      };
    };
  };
  var isNothing = /* @__PURE__ */ maybe(true)(/* @__PURE__ */ $$const(false));
  var isJust = /* @__PURE__ */ maybe(false)(/* @__PURE__ */ $$const(true));
  var functorMaybe = {
    map: function(v) {
      return function(v1) {
        if (v1 instanceof Just) {
          return new Just(v(v1.value0));
        }
        ;
        return Nothing.value;
      };
    }
  };
  var map2 = /* @__PURE__ */ map(functorMaybe);
  var fromMaybe = function(a) {
    return maybe(a)(identity3);
  };
  var fromJust = function() {
    return function(v) {
      if (v instanceof Just) {
        return v.value0;
      }
      ;
      throw new Error("Failed pattern match at Data.Maybe (line 288, column 1 - line 288, column 46): " + [v.constructor.name]);
    };
  };
  var eqMaybe = function(dictEq) {
    var eq5 = eq(dictEq);
    return {
      eq: function(x) {
        return function(y) {
          if (x instanceof Nothing && y instanceof Nothing) {
            return true;
          }
          ;
          if (x instanceof Just && y instanceof Just) {
            return eq5(x.value0)(y.value0);
          }
          ;
          return false;
        };
      }
    };
  };
  var applyMaybe = {
    apply: function(v) {
      return function(v1) {
        if (v instanceof Just) {
          return map2(v.value0)(v1);
        }
        ;
        if (v instanceof Nothing) {
          return Nothing.value;
        }
        ;
        throw new Error("Failed pattern match at Data.Maybe (line 67, column 1 - line 69, column 30): " + [v.constructor.name, v1.constructor.name]);
      };
    },
    Functor0: function() {
      return functorMaybe;
    }
  };
  var bindMaybe = {
    bind: function(v) {
      return function(v1) {
        if (v instanceof Just) {
          return v1(v.value0);
        }
        ;
        if (v instanceof Nothing) {
          return Nothing.value;
        }
        ;
        throw new Error("Failed pattern match at Data.Maybe (line 125, column 1 - line 127, column 28): " + [v.constructor.name, v1.constructor.name]);
      };
    },
    Apply0: function() {
      return applyMaybe;
    }
  };
  var applicativeMaybe = /* @__PURE__ */ function() {
    return {
      pure: Just.create,
      Apply0: function() {
        return applyMaybe;
      }
    };
  }();
  var altMaybe = {
    alt: function(v) {
      return function(v1) {
        if (v instanceof Nothing) {
          return v1;
        }
        ;
        return v;
      };
    },
    Functor0: function() {
      return functorMaybe;
    }
  };

  // .tmp-verdict-build/output/Foreign.Object/foreign.js
  function _copyST(m) {
    return function() {
      var r = {};
      for (var k in m) {
        if (hasOwnProperty.call(m, k)) {
          r[k] = m[k];
        }
      }
      return r;
    };
  }
  var empty = {};
  function runST(f) {
    return f();
  }
  function _fmapObject(m0, f) {
    var m = {};
    for (var k in m0) {
      if (hasOwnProperty.call(m0, k)) {
        m[k] = f(m0[k]);
      }
    }
    return m;
  }
  function _lookup(no, yes, k, m) {
    return k in m ? yes(m[k]) : no;
  }
  function toArrayWithKey(f) {
    return function(m) {
      var r = [];
      for (var k in m) {
        if (hasOwnProperty.call(m, k)) {
          r.push(f(k)(m[k]));
        }
      }
      return r;
    };
  }
  var keys = Object.keys || toArrayWithKey(function(k) {
    return function() {
      return k;
    };
  });

  // .tmp-verdict-build/output/Control.Monad.ST.Internal/foreign.js
  var map_ = function(f) {
    return function(a) {
      return function() {
        return f(a());
      };
    };
  };
  var pure_ = function(a) {
    return function() {
      return a;
    };
  };
  var bind_ = function(a) {
    return function(f) {
      return function() {
        return f(a())();
      };
    };
  };
  var foreach = function(as) {
    return function(f) {
      return function() {
        for (var i = 0, l = as.length; i < l; i++) {
          f(as[i])();
        }
      };
    };
  };

  // .tmp-verdict-build/output/Control.Monad/index.js
  var ap = function(dictMonad) {
    var bind13 = bind(dictMonad.Bind1());
    var pure10 = pure(dictMonad.Applicative0());
    return function(f) {
      return function(a) {
        return bind13(f)(function(f$prime) {
          return bind13(a)(function(a$prime) {
            return pure10(f$prime(a$prime));
          });
        });
      };
    };
  };

  // .tmp-verdict-build/output/Data.Either/index.js
  var Left = /* @__PURE__ */ function() {
    function Left2(value0) {
      this.value0 = value0;
    }
    ;
    Left2.create = function(value0) {
      return new Left2(value0);
    };
    return Left2;
  }();
  var Right = /* @__PURE__ */ function() {
    function Right2(value0) {
      this.value0 = value0;
    }
    ;
    Right2.create = function(value0) {
      return new Right2(value0);
    };
    return Right2;
  }();
  var functorEither = {
    map: function(f) {
      return function(m) {
        if (m instanceof Left) {
          return new Left(m.value0);
        }
        ;
        if (m instanceof Right) {
          return new Right(f(m.value0));
        }
        ;
        throw new Error("Failed pattern match at Data.Either (line 0, column 0 - line 0, column 0): " + [m.constructor.name]);
      };
    }
  };
  var map3 = /* @__PURE__ */ map(functorEither);
  var either = function(v) {
    return function(v1) {
      return function(v2) {
        if (v2 instanceof Left) {
          return v(v2.value0);
        }
        ;
        if (v2 instanceof Right) {
          return v1(v2.value0);
        }
        ;
        throw new Error("Failed pattern match at Data.Either (line 208, column 1 - line 208, column 64): " + [v.constructor.name, v1.constructor.name, v2.constructor.name]);
      };
    };
  };
  var applyEither = {
    apply: function(v) {
      return function(v1) {
        if (v instanceof Left) {
          return new Left(v.value0);
        }
        ;
        if (v instanceof Right) {
          return map3(v.value0)(v1);
        }
        ;
        throw new Error("Failed pattern match at Data.Either (line 70, column 1 - line 72, column 30): " + [v.constructor.name, v1.constructor.name]);
      };
    },
    Functor0: function() {
      return functorEither;
    }
  };
  var bindEither = {
    bind: /* @__PURE__ */ either(function(e) {
      return function(v) {
        return new Left(e);
      };
    })(function(a) {
      return function(f) {
        return f(a);
      };
    }),
    Apply0: function() {
      return applyEither;
    }
  };
  var applicativeEither = /* @__PURE__ */ function() {
    return {
      pure: Right.create,
      Apply0: function() {
        return applyEither;
      }
    };
  }();
  var monadEither = {
    Applicative0: function() {
      return applicativeEither;
    },
    Bind1: function() {
      return bindEither;
    }
  };

  // .tmp-verdict-build/output/Data.Identity/index.js
  var Identity = function(x) {
    return x;
  };
  var functorIdentity = {
    map: function(f) {
      return function(m) {
        return f(m);
      };
    }
  };
  var applyIdentity = {
    apply: function(v) {
      return function(v1) {
        return v(v1);
      };
    },
    Functor0: function() {
      return functorIdentity;
    }
  };
  var bindIdentity = {
    bind: function(v) {
      return function(f) {
        return f(v);
      };
    },
    Apply0: function() {
      return applyIdentity;
    }
  };
  var applicativeIdentity = {
    pure: Identity,
    Apply0: function() {
      return applyIdentity;
    }
  };
  var monadIdentity = {
    Applicative0: function() {
      return applicativeIdentity;
    },
    Bind1: function() {
      return bindIdentity;
    }
  };

  // .tmp-verdict-build/output/Data.EuclideanRing/foreign.js
  var intDegree = function(x) {
    return Math.min(Math.abs(x), 2147483647);
  };
  var intDiv = function(x) {
    return function(y) {
      if (y === 0) return 0;
      return y > 0 ? Math.floor(x / y) : -Math.floor(x / -y);
    };
  };
  var intMod = function(x) {
    return function(y) {
      if (y === 0) return 0;
      var yy = Math.abs(y);
      return (x % yy + yy) % yy;
    };
  };

  // .tmp-verdict-build/output/Data.CommutativeRing/index.js
  var commutativeRingInt = {
    Ring0: function() {
      return ringInt;
    }
  };

  // .tmp-verdict-build/output/Data.EuclideanRing/index.js
  var mod = function(dict) {
    return dict.mod;
  };
  var euclideanRingInt = {
    degree: intDegree,
    div: intDiv,
    mod: intMod,
    CommutativeRing0: function() {
      return commutativeRingInt;
    }
  };
  var div = function(dict) {
    return dict.div;
  };

  // .tmp-verdict-build/output/Data.Monoid/index.js
  var mempty = function(dict) {
    return dict.mempty;
  };

  // .tmp-verdict-build/output/Control.Monad.Rec.Class/index.js
  var Loop = /* @__PURE__ */ function() {
    function Loop2(value0) {
      this.value0 = value0;
    }
    ;
    Loop2.create = function(value0) {
      return new Loop2(value0);
    };
    return Loop2;
  }();
  var Done = /* @__PURE__ */ function() {
    function Done2(value0) {
      this.value0 = value0;
    }
    ;
    Done2.create = function(value0) {
      return new Done2(value0);
    };
    return Done2;
  }();
  var tailRecM = function(dict) {
    return dict.tailRecM;
  };
  var tailRec = function(f) {
    var go = function($copy_v) {
      var $tco_done = false;
      var $tco_result;
      function $tco_loop(v) {
        if (v instanceof Loop) {
          $copy_v = f(v.value0);
          return;
        }
        ;
        if (v instanceof Done) {
          $tco_done = true;
          return v.value0;
        }
        ;
        throw new Error("Failed pattern match at Control.Monad.Rec.Class (line 103, column 3 - line 103, column 25): " + [v.constructor.name]);
      }
      ;
      while (!$tco_done) {
        $tco_result = $tco_loop($copy_v);
      }
      ;
      return $tco_result;
    };
    return function($85) {
      return go(f($85));
    };
  };
  var monadRecIdentity = {
    tailRecM: function(f) {
      var runIdentity = function(v) {
        return v;
      };
      var $86 = tailRec(function($88) {
        return runIdentity(f($88));
      });
      return function($87) {
        return Identity($86($87));
      };
    },
    Monad0: function() {
      return monadIdentity;
    }
  };
  var monadRecEither = {
    tailRecM: function(f) {
      return function(a0) {
        var g = function(v) {
          if (v instanceof Left) {
            return new Done(new Left(v.value0));
          }
          ;
          if (v instanceof Right && v.value0 instanceof Loop) {
            return new Loop(f(v.value0.value0));
          }
          ;
          if (v instanceof Right && v.value0 instanceof Done) {
            return new Done(new Right(v.value0.value0));
          }
          ;
          throw new Error("Failed pattern match at Control.Monad.Rec.Class (line 145, column 7 - line 145, column 33): " + [v.constructor.name]);
        };
        return tailRec(g)(f(a0));
      };
    },
    Monad0: function() {
      return monadEither;
    }
  };
  var bifunctorStep = {
    bimap: function(v) {
      return function(v1) {
        return function(v2) {
          if (v2 instanceof Loop) {
            return new Loop(v(v2.value0));
          }
          ;
          if (v2 instanceof Done) {
            return new Done(v1(v2.value0));
          }
          ;
          throw new Error("Failed pattern match at Control.Monad.Rec.Class (line 33, column 1 - line 35, column 34): " + [v.constructor.name, v1.constructor.name, v2.constructor.name]);
        };
      };
    }
  };

  // .tmp-verdict-build/output/Control.Monad.ST.Internal/index.js
  var $runtime_lazy = function(name2, moduleName2, init3) {
    var state2 = 0;
    var val;
    return function(lineNumber) {
      if (state2 === 2) return val;
      if (state2 === 1) throw new ReferenceError(name2 + " was needed before it finished initializing (module " + moduleName2 + ", line " + lineNumber + ")", moduleName2, lineNumber);
      state2 = 1;
      val = init3();
      state2 = 2;
      return val;
    };
  };
  var functorST = {
    map: map_
  };
  var monadST = {
    Applicative0: function() {
      return applicativeST;
    },
    Bind1: function() {
      return bindST;
    }
  };
  var bindST = {
    bind: bind_,
    Apply0: function() {
      return $lazy_applyST(0);
    }
  };
  var applicativeST = {
    pure: pure_,
    Apply0: function() {
      return $lazy_applyST(0);
    }
  };
  var $lazy_applyST = /* @__PURE__ */ $runtime_lazy("applyST", "Control.Monad.ST.Internal", function() {
    return {
      apply: ap(monadST),
      Functor0: function() {
        return functorST;
      }
    };
  });

  // .tmp-verdict-build/output/Data.Array/foreign.js
  var replicateFill = function(count, value) {
    if (count < 1) {
      return [];
    }
    var result = new Array(count);
    return result.fill(value);
  };
  var replicatePolyfill = function(count, value) {
    var result = [];
    var n = 0;
    for (var i = 0; i < count; i++) {
      result[n++] = value;
    }
    return result;
  };
  var replicateImpl = typeof Array.prototype.fill === "function" ? replicateFill : replicatePolyfill;
  var fromFoldableImpl = /* @__PURE__ */ function() {
    function Cons3(head4, tail2) {
      this.head = head4;
      this.tail = tail2;
    }
    var emptyList = {};
    function curryCons(head4) {
      return function(tail2) {
        return new Cons3(head4, tail2);
      };
    }
    function listToArray(list) {
      var result = [];
      var count = 0;
      var xs = list;
      while (xs !== emptyList) {
        result[count++] = xs.head;
        xs = xs.tail;
      }
      return result;
    }
    return function(foldr7, xs) {
      return listToArray(foldr7(curryCons)(emptyList)(xs));
    };
  }();
  var length = function(xs) {
    return xs.length;
  };
  var unconsImpl = function(empty6, next, xs) {
    return xs.length === 0 ? empty6({}) : next(xs[0])(xs.slice(1));
  };
  var indexImpl = function(just, nothing, xs, i) {
    return i < 0 || i >= xs.length ? nothing : just(xs[i]);
  };
  var findIndexImpl = function(just, nothing, f, xs) {
    for (var i = 0, l = xs.length; i < l; i++) {
      if (f(xs[i])) return just(i);
    }
    return nothing;
  };
  var reverse = function(l) {
    return l.slice().reverse();
  };
  var filterImpl = function(f, xs) {
    return xs.filter(f);
  };
  var sortByImpl = /* @__PURE__ */ function() {
    function mergeFromTo(compare4, fromOrdering, xs1, xs2, from2, to) {
      var mid;
      var i;
      var j;
      var k;
      var x;
      var y;
      var c;
      mid = from2 + (to - from2 >> 1);
      if (mid - from2 > 1) mergeFromTo(compare4, fromOrdering, xs2, xs1, from2, mid);
      if (to - mid > 1) mergeFromTo(compare4, fromOrdering, xs2, xs1, mid, to);
      i = from2;
      j = mid;
      k = from2;
      while (i < mid && j < to) {
        x = xs2[i];
        y = xs2[j];
        c = fromOrdering(compare4(x)(y));
        if (c > 0) {
          xs1[k++] = y;
          ++j;
        } else {
          xs1[k++] = x;
          ++i;
        }
      }
      while (i < mid) {
        xs1[k++] = xs2[i++];
      }
      while (j < to) {
        xs1[k++] = xs2[j++];
      }
    }
    return function(compare4, fromOrdering, xs) {
      var out2;
      if (xs.length < 2) return xs;
      out2 = xs.slice(0);
      mergeFromTo(compare4, fromOrdering, out2, xs.slice(0), 0, xs.length);
      return out2;
    };
  }();
  var sliceImpl = function(s, e, l) {
    return l.slice(s, e);
  };
  var zipWithImpl = function(f, xs, ys) {
    var l = xs.length < ys.length ? xs.length : ys.length;
    var result = new Array(l);
    for (var i = 0; i < l; i++) {
      result[i] = f(xs[i])(ys[i]);
    }
    return result;
  };
  var anyImpl = function(p, xs) {
    var len = xs.length;
    for (var i = 0; i < len; i++) {
      if (p(xs[i])) return true;
    }
    return false;
  };
  var allImpl = function(p, xs) {
    var len = xs.length;
    for (var i = 0; i < len; i++) {
      if (!p(xs[i])) return false;
    }
    return true;
  };
  var unsafeIndexImpl = function(xs, n) {
    return xs[n];
  };

  // .tmp-verdict-build/output/Control.Lazy/index.js
  var $runtime_lazy2 = function(name2, moduleName2, init3) {
    var state2 = 0;
    var val;
    return function(lineNumber) {
      if (state2 === 2) return val;
      if (state2 === 1) throw new ReferenceError(name2 + " was needed before it finished initializing (module " + moduleName2 + ", line " + lineNumber + ")", moduleName2, lineNumber);
      state2 = 1;
      val = init3();
      state2 = 2;
      return val;
    };
  };
  var defer = function(dict) {
    return dict.defer;
  };
  var fix = function(dictLazy) {
    var defer1 = defer(dictLazy);
    return function(f) {
      var $lazy_go = $runtime_lazy2("go", "Control.Lazy", function() {
        return defer1(function(v) {
          return f($lazy_go(25));
        });
      });
      var go = $lazy_go(25);
      return go;
    };
  };

  // .tmp-verdict-build/output/Data.Array.ST/foreign.js
  function unsafeFreezeThawImpl(xs) {
    return xs;
  }
  var unsafeFreezeImpl = unsafeFreezeThawImpl;
  var unsafeThawImpl = unsafeFreezeThawImpl;
  function copyImpl(xs) {
    return xs.slice();
  }
  var thawImpl = copyImpl;
  var pushImpl = function(a, xs) {
    return xs.push(a);
  };

  // .tmp-verdict-build/output/Control.Monad.ST.Uncurried/foreign.js
  var runSTFn1 = function runSTFn12(fn) {
    return function(a) {
      return function() {
        return fn(a);
      };
    };
  };
  var runSTFn2 = function runSTFn22(fn) {
    return function(a) {
      return function(b) {
        return function() {
          return fn(a, b);
        };
      };
    };
  };

  // .tmp-verdict-build/output/Data.Array.ST/index.js
  var unsafeThaw = /* @__PURE__ */ runSTFn1(unsafeThawImpl);
  var unsafeFreeze = /* @__PURE__ */ runSTFn1(unsafeFreezeImpl);
  var thaw = /* @__PURE__ */ runSTFn1(thawImpl);
  var withArray = function(f) {
    return function(xs) {
      return function __do() {
        var result = thaw(xs)();
        f(result)();
        return unsafeFreeze(result)();
      };
    };
  };
  var push = /* @__PURE__ */ runSTFn2(pushImpl);

  // .tmp-verdict-build/output/Data.HeytingAlgebra/foreign.js
  var boolConj = function(b1) {
    return function(b2) {
      return b1 && b2;
    };
  };
  var boolDisj = function(b1) {
    return function(b2) {
      return b1 || b2;
    };
  };
  var boolNot = function(b) {
    return !b;
  };

  // .tmp-verdict-build/output/Data.HeytingAlgebra/index.js
  var tt = function(dict) {
    return dict.tt;
  };
  var not = function(dict) {
    return dict.not;
  };
  var ff = function(dict) {
    return dict.ff;
  };
  var disj = function(dict) {
    return dict.disj;
  };
  var heytingAlgebraBoolean = {
    ff: false,
    tt: true,
    implies: function(a) {
      return function(b) {
        return disj(heytingAlgebraBoolean)(not(heytingAlgebraBoolean)(a))(b);
      };
    },
    conj: boolConj,
    disj: boolDisj,
    not: boolNot
  };
  var conj = function(dict) {
    return dict.conj;
  };

  // .tmp-verdict-build/output/Data.Foldable/foreign.js
  var foldrArray = function(f) {
    return function(init3) {
      return function(xs) {
        var acc = init3;
        var len = xs.length;
        for (var i = len - 1; i >= 0; i--) {
          acc = f(xs[i])(acc);
        }
        return acc;
      };
    };
  };
  var foldlArray = function(f) {
    return function(init3) {
      return function(xs) {
        var acc = init3;
        var len = xs.length;
        for (var i = 0; i < len; i++) {
          acc = f(acc)(xs[i]);
        }
        return acc;
      };
    };
  };

  // .tmp-verdict-build/output/Control.Plus/index.js
  var empty2 = function(dict) {
    return dict.empty;
  };

  // .tmp-verdict-build/output/Data.Tuple/index.js
  var Tuple = /* @__PURE__ */ function() {
    function Tuple2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    Tuple2.create = function(value0) {
      return function(value1) {
        return new Tuple2(value0, value1);
      };
    };
    return Tuple2;
  }();
  var snd = function(v) {
    return v.value1;
  };
  var showTuple = function(dictShow) {
    var show9 = show(dictShow);
    return function(dictShow1) {
      var show18 = show(dictShow1);
      return {
        show: function(v) {
          return "(Tuple " + (show9(v.value0) + (" " + (show18(v.value1) + ")")));
        }
      };
    };
  };
  var fst = function(v) {
    return v.value0;
  };
  var eqTuple = function(dictEq) {
    var eq5 = eq(dictEq);
    return function(dictEq1) {
      var eq15 = eq(dictEq1);
      return {
        eq: function(x) {
          return function(y) {
            return eq5(x.value0)(y.value0) && eq15(x.value1)(y.value1);
          };
        }
      };
    };
  };

  // .tmp-verdict-build/output/Data.Bifunctor/index.js
  var bimap = function(dict) {
    return dict.bimap;
  };

  // .tmp-verdict-build/output/Data.Monoid.Conj/index.js
  var Conj = function(x) {
    return x;
  };
  var semigroupConj = function(dictHeytingAlgebra) {
    var conj2 = conj(dictHeytingAlgebra);
    return {
      append: function(v) {
        return function(v1) {
          return conj2(v)(v1);
        };
      }
    };
  };
  var monoidConj = function(dictHeytingAlgebra) {
    var semigroupConj1 = semigroupConj(dictHeytingAlgebra);
    return {
      mempty: tt(dictHeytingAlgebra),
      Semigroup0: function() {
        return semigroupConj1;
      }
    };
  };

  // .tmp-verdict-build/output/Data.Monoid.Disj/index.js
  var Disj = function(x) {
    return x;
  };
  var semigroupDisj = function(dictHeytingAlgebra) {
    var disj2 = disj(dictHeytingAlgebra);
    return {
      append: function(v) {
        return function(v1) {
          return disj2(v)(v1);
        };
      }
    };
  };
  var monoidDisj = function(dictHeytingAlgebra) {
    var semigroupDisj1 = semigroupDisj(dictHeytingAlgebra);
    return {
      mempty: ff(dictHeytingAlgebra),
      Semigroup0: function() {
        return semigroupDisj1;
      }
    };
  };

  // .tmp-verdict-build/output/Unsafe.Coerce/foreign.js
  var unsafeCoerce2 = function(x) {
    return x;
  };

  // .tmp-verdict-build/output/Safe.Coerce/index.js
  var coerce = function() {
    return unsafeCoerce2;
  };

  // .tmp-verdict-build/output/Data.Newtype/index.js
  var coerce2 = /* @__PURE__ */ coerce();
  var unwrap = function() {
    return coerce2;
  };
  var alaF = function() {
    return function() {
      return function() {
        return function() {
          return function(v) {
            return coerce2;
          };
        };
      };
    };
  };

  // .tmp-verdict-build/output/Data.Foldable/index.js
  var alaF2 = /* @__PURE__ */ alaF()()()();
  var foldr = function(dict) {
    return dict.foldr;
  };
  var traverse_ = function(dictApplicative) {
    var applySecond6 = applySecond(dictApplicative.Apply0());
    var pure10 = pure(dictApplicative);
    return function(dictFoldable) {
      var foldr22 = foldr(dictFoldable);
      return function(f) {
        return foldr22(function($454) {
          return applySecond6(f($454));
        })(pure10(unit));
      };
    };
  };
  var foldl = function(dict) {
    return dict.foldl;
  };
  var foldMapDefaultR = function(dictFoldable) {
    var foldr22 = foldr(dictFoldable);
    return function(dictMonoid) {
      var append10 = append(dictMonoid.Semigroup0());
      var mempty2 = mempty(dictMonoid);
      return function(f) {
        return foldr22(function(x) {
          return function(acc) {
            return append10(f(x))(acc);
          };
        })(mempty2);
      };
    };
  };
  var foldableArray = {
    foldr: foldrArray,
    foldl: foldlArray,
    foldMap: function(dictMonoid) {
      return foldMapDefaultR(foldableArray)(dictMonoid);
    }
  };
  var foldMap = function(dict) {
    return dict.foldMap;
  };
  var any = function(dictFoldable) {
    var foldMap22 = foldMap(dictFoldable);
    return function(dictHeytingAlgebra) {
      return alaF2(Disj)(foldMap22(monoidDisj(dictHeytingAlgebra)));
    };
  };
  var all = function(dictFoldable) {
    var foldMap22 = foldMap(dictFoldable);
    return function(dictHeytingAlgebra) {
      return alaF2(Conj)(foldMap22(monoidConj(dictHeytingAlgebra)));
    };
  };

  // .tmp-verdict-build/output/Data.Function.Uncurried/foreign.js
  var mkFn5 = function(fn) {
    return function(a, b, c, d, e) {
      return fn(a)(b)(c)(d)(e);
    };
  };
  var runFn2 = function(fn) {
    return function(a) {
      return function(b) {
        return fn(a, b);
      };
    };
  };
  var runFn3 = function(fn) {
    return function(a) {
      return function(b) {
        return function(c) {
          return fn(a, b, c);
        };
      };
    };
  };
  var runFn4 = function(fn) {
    return function(a) {
      return function(b) {
        return function(c) {
          return function(d) {
            return fn(a, b, c, d);
          };
        };
      };
    };
  };

  // .tmp-verdict-build/output/Data.FunctorWithIndex/foreign.js
  var mapWithIndexArray = function(f) {
    return function(xs) {
      var l = xs.length;
      var result = Array(l);
      for (var i = 0; i < l; i++) {
        result[i] = f(i)(xs[i]);
      }
      return result;
    };
  };

  // .tmp-verdict-build/output/Data.FunctorWithIndex/index.js
  var mapWithIndex = function(dict) {
    return dict.mapWithIndex;
  };
  var functorWithIndexArray = {
    mapWithIndex: mapWithIndexArray,
    Functor0: function() {
      return functorArray;
    }
  };

  // .tmp-verdict-build/output/Data.Traversable/foreign.js
  var traverseArrayImpl = /* @__PURE__ */ function() {
    function array1(a) {
      return [a];
    }
    function array2(a) {
      return function(b) {
        return [a, b];
      };
    }
    function array3(a) {
      return function(b) {
        return function(c) {
          return [a, b, c];
        };
      };
    }
    function concat2(xs) {
      return function(ys) {
        return xs.concat(ys);
      };
    }
    return function(apply4) {
      return function(map33) {
        return function(pure10) {
          return function(f) {
            return function(array) {
              function go(bot, top3) {
                switch (top3 - bot) {
                  case 0:
                    return pure10([]);
                  case 1:
                    return map33(array1)(f(array[bot]));
                  case 2:
                    return apply4(map33(array2)(f(array[bot])))(f(array[bot + 1]));
                  case 3:
                    return apply4(apply4(map33(array3)(f(array[bot])))(f(array[bot + 1])))(f(array[bot + 2]));
                  default:
                    var pivot = bot + Math.floor((top3 - bot) / 4) * 2;
                    return apply4(map33(concat2)(go(bot, pivot)))(go(pivot, top3));
                }
              }
              return go(0, array.length);
            };
          };
        };
      };
    };
  }();

  // .tmp-verdict-build/output/Data.Traversable/index.js
  var identity4 = /* @__PURE__ */ identity(categoryFn);
  var traverse = function(dict) {
    return dict.traverse;
  };
  var sequenceDefault = function(dictTraversable) {
    var traverse22 = traverse(dictTraversable);
    return function(dictApplicative) {
      return traverse22(dictApplicative)(identity4);
    };
  };
  var traversableArray = {
    traverse: function(dictApplicative) {
      var Apply0 = dictApplicative.Apply0();
      return traverseArrayImpl(apply(Apply0))(map(Apply0.Functor0()))(pure(dictApplicative));
    },
    sequence: function(dictApplicative) {
      return sequenceDefault(traversableArray)(dictApplicative);
    },
    Functor0: function() {
      return functorArray;
    },
    Foldable1: function() {
      return foldableArray;
    }
  };

  // .tmp-verdict-build/output/Data.Unfoldable/foreign.js
  var unfoldrArrayImpl = function(isNothing2) {
    return function(fromJust6) {
      return function(fst2) {
        return function(snd2) {
          return function(f) {
            return function(b) {
              var result = [];
              var value = b;
              while (true) {
                var maybe2 = f(value);
                if (isNothing2(maybe2)) return result;
                var tuple = fromJust6(maybe2);
                result.push(fst2(tuple));
                value = snd2(tuple);
              }
            };
          };
        };
      };
    };
  };

  // .tmp-verdict-build/output/Data.Unfoldable1/foreign.js
  var unfoldr1ArrayImpl = function(isNothing2) {
    return function(fromJust6) {
      return function(fst2) {
        return function(snd2) {
          return function(f) {
            return function(b) {
              var result = [];
              var value = b;
              while (true) {
                var tuple = f(value);
                result.push(fst2(tuple));
                var maybe2 = snd2(tuple);
                if (isNothing2(maybe2)) return result;
                value = fromJust6(maybe2);
              }
            };
          };
        };
      };
    };
  };

  // .tmp-verdict-build/output/Data.Unfoldable1/index.js
  var fromJust2 = /* @__PURE__ */ fromJust();
  var unfoldable1Array = {
    unfoldr1: /* @__PURE__ */ unfoldr1ArrayImpl(isNothing)(fromJust2)(fst)(snd)
  };

  // .tmp-verdict-build/output/Data.Unfoldable/index.js
  var fromJust3 = /* @__PURE__ */ fromJust();
  var unfoldr = function(dict) {
    return dict.unfoldr;
  };
  var unfoldableArray = {
    unfoldr: /* @__PURE__ */ unfoldrArrayImpl(isNothing)(fromJust3)(fst)(snd),
    Unfoldable10: function() {
      return unfoldable1Array;
    }
  };

  // .tmp-verdict-build/output/Data.Array/index.js
  var $$void2 = /* @__PURE__ */ $$void(functorST);
  var apply2 = /* @__PURE__ */ apply(applyMaybe);
  var map4 = /* @__PURE__ */ map(functorMaybe);
  var map1 = /* @__PURE__ */ map(functorArray);
  var map22 = /* @__PURE__ */ map(functorST);
  var fromJust4 = /* @__PURE__ */ fromJust();
  var when2 = /* @__PURE__ */ when(applicativeST);
  var notEq2 = /* @__PURE__ */ notEq(eqOrdering);
  var append2 = /* @__PURE__ */ append(semigroupArray);
  var zipWith = /* @__PURE__ */ runFn3(zipWithImpl);
  var zip = /* @__PURE__ */ function() {
    return zipWith(Tuple.create);
  }();
  var unsafeIndex = function() {
    return runFn2(unsafeIndexImpl);
  };
  var unsafeIndex1 = /* @__PURE__ */ unsafeIndex();
  var uncons = /* @__PURE__ */ function() {
    return runFn3(unconsImpl)($$const(Nothing.value))(function(x) {
      return function(xs) {
        return new Just({
          head: x,
          tail: xs
        });
      };
    });
  }();
  var toUnfoldable = function(dictUnfoldable) {
    var unfoldr3 = unfoldr(dictUnfoldable);
    return function(xs) {
      var len = length(xs);
      var f = function(i) {
        if (i < len) {
          return new Just(new Tuple(unsafeIndex1(xs)(i), i + 1 | 0));
        }
        ;
        if (otherwise) {
          return Nothing.value;
        }
        ;
        throw new Error("Failed pattern match at Data.Array (line 163, column 3 - line 165, column 26): " + [i.constructor.name]);
      };
      return unfoldr3(f)(0);
    };
  };
  var sortBy = function(comp) {
    return runFn3(sortByImpl)(comp)(function(v) {
      if (v instanceof GT) {
        return 1;
      }
      ;
      if (v instanceof EQ) {
        return 0;
      }
      ;
      if (v instanceof LT) {
        return -1 | 0;
      }
      ;
      throw new Error("Failed pattern match at Data.Array (line 897, column 38 - line 900, column 11): " + [v.constructor.name]);
    });
  };
  var sortWith = function(dictOrd) {
    var comparing2 = comparing(dictOrd);
    return function(f) {
      return sortBy(comparing2(f));
    };
  };
  var sortWith1 = /* @__PURE__ */ sortWith(ordInt);
  var sort = function(dictOrd) {
    var compare4 = compare(dictOrd);
    return function(xs) {
      return sortBy(compare4)(xs);
    };
  };
  var snoc = function(xs) {
    return function(x) {
      return withArray(push(x))(xs)();
    };
  };
  var slice = /* @__PURE__ */ runFn3(sliceImpl);
  var singleton2 = function(a) {
    return [a];
  };
  var replicate = /* @__PURE__ */ runFn2(replicateImpl);
  var $$null = function(xs) {
    return length(xs) === 0;
  };
  var mapWithIndex2 = /* @__PURE__ */ mapWithIndex(functorWithIndexArray);
  var init = function(xs) {
    if ($$null(xs)) {
      return Nothing.value;
    }
    ;
    if (otherwise) {
      return new Just(slice(0)(length(xs) - 1 | 0)(xs));
    }
    ;
    throw new Error("Failed pattern match at Data.Array (line 351, column 1 - line 351, column 45): " + [xs.constructor.name]);
  };
  var index = /* @__PURE__ */ function() {
    return runFn4(indexImpl)(Just.create)(Nothing.value);
  }();
  var last = function(xs) {
    return index(xs)(length(xs) - 1 | 0);
  };
  var unsnoc = function(xs) {
    return apply2(map4(function(v) {
      return function(v1) {
        return {
          init: v,
          last: v1
        };
      };
    })(init(xs)))(last(xs));
  };
  var head = function(xs) {
    return index(xs)(0);
  };
  var nubBy = function(comp) {
    return function(xs) {
      var indexedAndSorted = sortBy(function(x) {
        return function(y) {
          return comp(snd(x))(snd(y));
        };
      })(mapWithIndex2(Tuple.create)(xs));
      var v = head(indexedAndSorted);
      if (v instanceof Nothing) {
        return [];
      }
      ;
      if (v instanceof Just) {
        return map1(snd)(sortWith1(fst)(function __do() {
          var result = unsafeThaw(singleton2(v.value0))();
          foreach(indexedAndSorted)(function(v1) {
            return function __do2() {
              var lst = map22(/* @__PURE__ */ function() {
                var $183 = function($185) {
                  return fromJust4(last($185));
                };
                return function($184) {
                  return snd($183($184));
                };
              }())(unsafeFreeze(result))();
              return when2(notEq2(comp(lst)(v1.value1))(EQ.value))($$void2(push(v1)(result)))();
            };
          })();
          return unsafeFreeze(result)();
        }()));
      }
      ;
      throw new Error("Failed pattern match at Data.Array (line 1115, column 17 - line 1123, column 28): " + [v.constructor.name]);
    };
  };
  var nub = function(dictOrd) {
    return nubBy(compare(dictOrd));
  };
  var fromFoldable = function(dictFoldable) {
    return runFn2(fromFoldableImpl)(foldr(dictFoldable));
  };
  var foldr2 = /* @__PURE__ */ foldr(foldableArray);
  var foldl2 = /* @__PURE__ */ foldl(foldableArray);
  var foldM = function(dictMonad) {
    var pure12 = pure(dictMonad.Applicative0());
    var bind13 = bind(dictMonad.Bind1());
    return function(f) {
      return function(b) {
        return runFn3(unconsImpl)(function(v) {
          return pure12(b);
        })(function(a) {
          return function(as) {
            return bind13(f(b)(a))(function(b$prime) {
              return foldM(dictMonad)(f)(b$prime)(as);
            });
          };
        });
      };
    };
  };
  var findIndex = /* @__PURE__ */ function() {
    return runFn4(findIndexImpl)(Just.create)(Nothing.value);
  }();
  var find2 = function(f) {
    return function(xs) {
      return map4(unsafeIndex1(xs))(findIndex(f)(xs));
    };
  };
  var filter = /* @__PURE__ */ runFn2(filterImpl);
  var elemIndex = function(dictEq) {
    var eq23 = eq(dictEq);
    return function(x) {
      return findIndex(function(v) {
        return eq23(v)(x);
      });
    };
  };
  var notElem2 = function(dictEq) {
    var elemIndex1 = elemIndex(dictEq);
    return function(a) {
      return function(arr) {
        return isNothing(elemIndex1(a)(arr));
      };
    };
  };
  var elem2 = function(dictEq) {
    var elemIndex1 = elemIndex(dictEq);
    return function(a) {
      return function(arr) {
        return isJust(elemIndex1(a)(arr));
      };
    };
  };
  var cons = function(x) {
    return function(xs) {
      return append2([x])(xs);
    };
  };
  var some = function(dictAlternative) {
    var apply1 = apply(dictAlternative.Applicative0().Apply0());
    var map33 = map(dictAlternative.Plus1().Alt0().Functor0());
    return function(dictLazy) {
      var defer5 = defer(dictLazy);
      return function(v) {
        return apply1(map33(cons)(v))(defer5(function(v1) {
          return many(dictAlternative)(dictLazy)(v);
        }));
      };
    };
  };
  var many = function(dictAlternative) {
    var alt8 = alt(dictAlternative.Plus1().Alt0());
    var pure12 = pure(dictAlternative.Applicative0());
    return function(dictLazy) {
      return function(v) {
        return alt8(some(dictAlternative)(dictLazy)(v))(pure12([]));
      };
    };
  };
  var concatMap = /* @__PURE__ */ flip(/* @__PURE__ */ bind(bindArray));
  var mapMaybe = function(f) {
    return concatMap(function() {
      var $189 = maybe([])(singleton2);
      return function($190) {
        return $189(f($190));
      };
    }());
  };
  var any2 = /* @__PURE__ */ runFn2(anyImpl);
  var all2 = /* @__PURE__ */ runFn2(allImpl);

  // .tmp-verdict-build/output/Data.FoldableWithIndex/index.js
  var foldr8 = /* @__PURE__ */ foldr(foldableArray);
  var mapWithIndex3 = /* @__PURE__ */ mapWithIndex(functorWithIndexArray);
  var foldl8 = /* @__PURE__ */ foldl(foldableArray);
  var foldrWithIndex = function(dict) {
    return dict.foldrWithIndex;
  };
  var foldlWithIndex = function(dict) {
    return dict.foldlWithIndex;
  };
  var foldMapWithIndexDefaultR = function(dictFoldableWithIndex) {
    var foldrWithIndex1 = foldrWithIndex(dictFoldableWithIndex);
    return function(dictMonoid) {
      var append10 = append(dictMonoid.Semigroup0());
      var mempty2 = mempty(dictMonoid);
      return function(f) {
        return foldrWithIndex1(function(i) {
          return function(x) {
            return function(acc) {
              return append10(f(i)(x))(acc);
            };
          };
        })(mempty2);
      };
    };
  };
  var foldableWithIndexArray = {
    foldrWithIndex: function(f) {
      return function(z) {
        var $291 = foldr8(function(v) {
          return function(y) {
            return f(v.value0)(v.value1)(y);
          };
        })(z);
        var $292 = mapWithIndex3(Tuple.create);
        return function($293) {
          return $291($292($293));
        };
      };
    },
    foldlWithIndex: function(f) {
      return function(z) {
        var $294 = foldl8(function(y) {
          return function(v) {
            return f(v.value0)(y)(v.value1);
          };
        })(z);
        var $295 = mapWithIndex3(Tuple.create);
        return function($296) {
          return $294($295($296));
        };
      };
    },
    foldMapWithIndex: function(dictMonoid) {
      return foldMapWithIndexDefaultR(foldableWithIndexArray)(dictMonoid);
    },
    Foldable0: function() {
      return foldableArray;
    }
  };

  // .tmp-verdict-build/output/Foreign.Object.ST/foreign.js
  var newImpl = function() {
    return {};
  };
  function poke2(k) {
    return function(v) {
      return function(m) {
        return function() {
          m[k] = v;
          return m;
        };
      };
    };
  }

  // .tmp-verdict-build/output/Foreign.Object/index.js
  var bindFlipped2 = /* @__PURE__ */ bindFlipped(bindST);
  var $$void3 = /* @__PURE__ */ $$void(functorST);
  var toUnfoldable2 = function(dictUnfoldable) {
    var $89 = toUnfoldable(dictUnfoldable);
    var $90 = toArrayWithKey(Tuple.create);
    return function($91) {
      return $89($90($91));
    };
  };
  var thawST = _copyST;
  var singleton3 = function(k) {
    return function(v) {
      return runST(bindFlipped2(poke2(k)(v))(newImpl));
    };
  };
  var mutate = function(f) {
    return function(m) {
      return runST(function __do() {
        var s = thawST(m)();
        f(s)();
        return s;
      });
    };
  };
  var member = /* @__PURE__ */ runFn4(_lookup)(false)(/* @__PURE__ */ $$const(true));
  var lookup = /* @__PURE__ */ function() {
    return runFn4(_lookup)(Nothing.value)(Just.create);
  }();
  var insert = function(k) {
    return function(v) {
      return mutate(poke2(k)(v));
    };
  };
  var functorObject = {
    map: function(f) {
      return function(m) {
        return _fmapObject(m, f);
      };
    }
  };
  var fromFoldable2 = function(dictFoldable) {
    var fromFoldable111 = fromFoldable(dictFoldable);
    return function(l) {
      return runST(function __do() {
        var s = newImpl();
        foreach(fromFoldable111(l))(function(v) {
          return $$void3(poke2(v.value0)(v.value1)(s));
        })();
        return s;
      });
    };
  };

  // .tmp-verdict-build/output/Data.Argonaut.Core/index.js
  var jsonSingletonObject = function(key) {
    return function(val) {
      return id(singleton3(key)(val));
    };
  };
  var jsonEmptyObject = /* @__PURE__ */ id(empty);
  var caseJsonObject = function(d) {
    return function(f) {
      return function(j) {
        return _caseJson($$const(d), $$const(d), $$const(d), $$const(d), $$const(d), f, j);
      };
    };
  };
  var caseJson = function(a) {
    return function(b) {
      return function(c) {
        return function(d) {
          return function(e) {
            return function(f) {
              return function(json) {
                return _caseJson(a, b, c, d, e, f, json);
              };
            };
          };
        };
      };
    };
  };

  // .tmp-verdict-build/output/Data.NonEmpty/index.js
  var NonEmpty = /* @__PURE__ */ function() {
    function NonEmpty2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    NonEmpty2.create = function(value0) {
      return function(value1) {
        return new NonEmpty2(value0, value1);
      };
    };
    return NonEmpty2;
  }();

  // .tmp-verdict-build/output/Data.List.Types/index.js
  var Nil = /* @__PURE__ */ function() {
    function Nil3() {
    }
    ;
    Nil3.value = new Nil3();
    return Nil3;
  }();
  var Cons = /* @__PURE__ */ function() {
    function Cons3(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    Cons3.create = function(value0) {
      return function(value1) {
        return new Cons3(value0, value1);
      };
    };
    return Cons3;
  }();
  var foldableList = {
    foldr: function(f) {
      return function(b) {
        var rev = function() {
          var go = function($copy_v) {
            return function($copy_v1) {
              var $tco_var_v = $copy_v;
              var $tco_done = false;
              var $tco_result;
              function $tco_loop(v, v1) {
                if (v1 instanceof Nil) {
                  $tco_done = true;
                  return v;
                }
                ;
                if (v1 instanceof Cons) {
                  $tco_var_v = new Cons(v1.value0, v);
                  $copy_v1 = v1.value1;
                  return;
                }
                ;
                throw new Error("Failed pattern match at Data.List.Types (line 107, column 7 - line 107, column 23): " + [v.constructor.name, v1.constructor.name]);
              }
              ;
              while (!$tco_done) {
                $tco_result = $tco_loop($tco_var_v, $copy_v1);
              }
              ;
              return $tco_result;
            };
          };
          return go(Nil.value);
        }();
        var $284 = foldl(foldableList)(flip(f))(b);
        return function($285) {
          return $284(rev($285));
        };
      };
    },
    foldl: function(f) {
      var go = function($copy_b) {
        return function($copy_v) {
          var $tco_var_b = $copy_b;
          var $tco_done1 = false;
          var $tco_result;
          function $tco_loop(b, v) {
            if (v instanceof Nil) {
              $tco_done1 = true;
              return b;
            }
            ;
            if (v instanceof Cons) {
              $tco_var_b = f(b)(v.value0);
              $copy_v = v.value1;
              return;
            }
            ;
            throw new Error("Failed pattern match at Data.List.Types (line 111, column 12 - line 113, column 30): " + [v.constructor.name]);
          }
          ;
          while (!$tco_done1) {
            $tco_result = $tco_loop($tco_var_b, $copy_v);
          }
          ;
          return $tco_result;
        };
      };
      return go;
    },
    foldMap: function(dictMonoid) {
      var append23 = append(dictMonoid.Semigroup0());
      var mempty2 = mempty(dictMonoid);
      return function(f) {
        return foldl(foldableList)(function(acc) {
          var $286 = append23(acc);
          return function($287) {
            return $286(f($287));
          };
        })(mempty2);
      };
    }
  };

  // .tmp-verdict-build/output/Data.Map.Internal/index.js
  var $runtime_lazy3 = function(name2, moduleName2, init3) {
    var state2 = 0;
    var val;
    return function(lineNumber) {
      if (state2 === 2) return val;
      if (state2 === 1) throw new ReferenceError(name2 + " was needed before it finished initializing (module " + moduleName2 + ", line " + lineNumber + ")", moduleName2, lineNumber);
      state2 = 1;
      val = init3();
      state2 = 2;
      return val;
    };
  };
  var Leaf = /* @__PURE__ */ function() {
    function Leaf2() {
    }
    ;
    Leaf2.value = new Leaf2();
    return Leaf2;
  }();
  var Node = /* @__PURE__ */ function() {
    function Node2(value0, value1, value2, value3, value4, value5) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
      this.value3 = value3;
      this.value4 = value4;
      this.value5 = value5;
    }
    ;
    Node2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return function(value3) {
            return function(value4) {
              return function(value5) {
                return new Node2(value0, value1, value2, value3, value4, value5);
              };
            };
          };
        };
      };
    };
    return Node2;
  }();
  var IterLeaf = /* @__PURE__ */ function() {
    function IterLeaf2() {
    }
    ;
    IterLeaf2.value = new IterLeaf2();
    return IterLeaf2;
  }();
  var IterEmit = /* @__PURE__ */ function() {
    function IterEmit2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    IterEmit2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new IterEmit2(value0, value1, value2);
        };
      };
    };
    return IterEmit2;
  }();
  var IterNode = /* @__PURE__ */ function() {
    function IterNode2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    IterNode2.create = function(value0) {
      return function(value1) {
        return new IterNode2(value0, value1);
      };
    };
    return IterNode2;
  }();
  var IterDone = /* @__PURE__ */ function() {
    function IterDone2() {
    }
    ;
    IterDone2.value = new IterDone2();
    return IterDone2;
  }();
  var IterNext = /* @__PURE__ */ function() {
    function IterNext2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    IterNext2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new IterNext2(value0, value1, value2);
        };
      };
    };
    return IterNext2;
  }();
  var Split = /* @__PURE__ */ function() {
    function Split2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    Split2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new Split2(value0, value1, value2);
        };
      };
    };
    return Split2;
  }();
  var SplitLast = /* @__PURE__ */ function() {
    function SplitLast2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    SplitLast2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new SplitLast2(value0, value1, value2);
        };
      };
    };
    return SplitLast2;
  }();
  var unsafeNode = function(k, v, l, r) {
    if (l instanceof Leaf) {
      if (r instanceof Leaf) {
        return new Node(1, 1, k, v, l, r);
      }
      ;
      if (r instanceof Node) {
        return new Node(1 + r.value0 | 0, 1 + r.value1 | 0, k, v, l, r);
      }
      ;
      throw new Error("Failed pattern match at Data.Map.Internal (line 702, column 5 - line 706, column 39): " + [r.constructor.name]);
    }
    ;
    if (l instanceof Node) {
      if (r instanceof Leaf) {
        return new Node(1 + l.value0 | 0, 1 + l.value1 | 0, k, v, l, r);
      }
      ;
      if (r instanceof Node) {
        return new Node(1 + function() {
          var $280 = l.value0 > r.value0;
          if ($280) {
            return l.value0;
          }
          ;
          return r.value0;
        }() | 0, (1 + l.value1 | 0) + r.value1 | 0, k, v, l, r);
      }
      ;
      throw new Error("Failed pattern match at Data.Map.Internal (line 708, column 5 - line 712, column 68): " + [r.constructor.name]);
    }
    ;
    throw new Error("Failed pattern match at Data.Map.Internal (line 700, column 32 - line 712, column 68): " + [l.constructor.name]);
  };
  var toMapIter = /* @__PURE__ */ function() {
    return flip(IterNode.create)(IterLeaf.value);
  }();
  var stepWith = function(f) {
    return function(next) {
      return function(done) {
        var go = function($copy_v) {
          var $tco_done = false;
          var $tco_result;
          function $tco_loop(v) {
            if (v instanceof IterLeaf) {
              $tco_done = true;
              return done(unit);
            }
            ;
            if (v instanceof IterEmit) {
              $tco_done = true;
              return next(v.value0, v.value1, v.value2);
            }
            ;
            if (v instanceof IterNode) {
              $copy_v = f(v.value1)(v.value0);
              return;
            }
            ;
            throw new Error("Failed pattern match at Data.Map.Internal (line 940, column 8 - line 946, column 20): " + [v.constructor.name]);
          }
          ;
          while (!$tco_done) {
            $tco_result = $tco_loop($copy_v);
          }
          ;
          return $tco_result;
        };
        return go;
      };
    };
  };
  var singleton5 = function(k) {
    return function(v) {
      return new Node(1, 1, k, v, Leaf.value, Leaf.value);
    };
  };
  var unsafeBalancedNode = /* @__PURE__ */ function() {
    var height = function(v) {
      if (v instanceof Leaf) {
        return 0;
      }
      ;
      if (v instanceof Node) {
        return v.value0;
      }
      ;
      throw new Error("Failed pattern match at Data.Map.Internal (line 757, column 12 - line 759, column 26): " + [v.constructor.name]);
    };
    var rotateLeft = function(k, v, l, rk, rv, rl, rr) {
      if (rl instanceof Node && rl.value0 > height(rr)) {
        return unsafeNode(rl.value2, rl.value3, unsafeNode(k, v, l, rl.value4), unsafeNode(rk, rv, rl.value5, rr));
      }
      ;
      return unsafeNode(rk, rv, unsafeNode(k, v, l, rl), rr);
    };
    var rotateRight = function(k, v, lk, lv, ll, lr, r) {
      if (lr instanceof Node && height(ll) <= lr.value0) {
        return unsafeNode(lr.value2, lr.value3, unsafeNode(lk, lv, ll, lr.value4), unsafeNode(k, v, lr.value5, r));
      }
      ;
      return unsafeNode(lk, lv, ll, unsafeNode(k, v, lr, r));
    };
    return function(k, v, l, r) {
      if (l instanceof Leaf) {
        if (r instanceof Leaf) {
          return singleton5(k)(v);
        }
        ;
        if (r instanceof Node && r.value0 > 1) {
          return rotateLeft(k, v, l, r.value2, r.value3, r.value4, r.value5);
        }
        ;
        return unsafeNode(k, v, l, r);
      }
      ;
      if (l instanceof Node) {
        if (r instanceof Node) {
          if (r.value0 > (l.value0 + 1 | 0)) {
            return rotateLeft(k, v, l, r.value2, r.value3, r.value4, r.value5);
          }
          ;
          if (l.value0 > (r.value0 + 1 | 0)) {
            return rotateRight(k, v, l.value2, l.value3, l.value4, l.value5, r);
          }
          ;
        }
        ;
        if (r instanceof Leaf && l.value0 > 1) {
          return rotateRight(k, v, l.value2, l.value3, l.value4, l.value5, r);
        }
        ;
        return unsafeNode(k, v, l, r);
      }
      ;
      throw new Error("Failed pattern match at Data.Map.Internal (line 717, column 40 - line 738, column 34): " + [l.constructor.name]);
    };
  }();
  var $lazy_unsafeSplit = /* @__PURE__ */ $runtime_lazy3("unsafeSplit", "Data.Map.Internal", function() {
    return function(comp, k, m) {
      if (m instanceof Leaf) {
        return new Split(Nothing.value, Leaf.value, Leaf.value);
      }
      ;
      if (m instanceof Node) {
        var v = comp(k)(m.value2);
        if (v instanceof LT) {
          var v1 = $lazy_unsafeSplit(793)(comp, k, m.value4);
          return new Split(v1.value0, v1.value1, unsafeBalancedNode(m.value2, m.value3, v1.value2, m.value5));
        }
        ;
        if (v instanceof GT) {
          var v1 = $lazy_unsafeSplit(796)(comp, k, m.value5);
          return new Split(v1.value0, unsafeBalancedNode(m.value2, m.value3, m.value4, v1.value1), v1.value2);
        }
        ;
        if (v instanceof EQ) {
          return new Split(new Just(m.value3), m.value4, m.value5);
        }
        ;
        throw new Error("Failed pattern match at Data.Map.Internal (line 791, column 5 - line 799, column 30): " + [v.constructor.name]);
      }
      ;
      throw new Error("Failed pattern match at Data.Map.Internal (line 787, column 34 - line 799, column 30): " + [m.constructor.name]);
    };
  });
  var unsafeSplit = /* @__PURE__ */ $lazy_unsafeSplit(786);
  var $lazy_unsafeSplitLast = /* @__PURE__ */ $runtime_lazy3("unsafeSplitLast", "Data.Map.Internal", function() {
    return function(k, v, l, r) {
      if (r instanceof Leaf) {
        return new SplitLast(k, v, l);
      }
      ;
      if (r instanceof Node) {
        var v1 = $lazy_unsafeSplitLast(779)(r.value2, r.value3, r.value4, r.value5);
        return new SplitLast(v1.value0, v1.value1, unsafeBalancedNode(k, v, l, v1.value2));
      }
      ;
      throw new Error("Failed pattern match at Data.Map.Internal (line 776, column 37 - line 780, column 57): " + [r.constructor.name]);
    };
  });
  var unsafeSplitLast = /* @__PURE__ */ $lazy_unsafeSplitLast(775);
  var unsafeJoinNodes = function(v, v1) {
    if (v instanceof Leaf) {
      return v1;
    }
    ;
    if (v instanceof Node) {
      var v2 = unsafeSplitLast(v.value2, v.value3, v.value4, v.value5);
      return unsafeBalancedNode(v2.value0, v2.value1, v2.value2, v1);
    }
    ;
    throw new Error("Failed pattern match at Data.Map.Internal (line 764, column 25 - line 768, column 38): " + [v.constructor.name, v1.constructor.name]);
  };
  var $lazy_unsafeUnionWith = /* @__PURE__ */ $runtime_lazy3("unsafeUnionWith", "Data.Map.Internal", function() {
    return function(comp, app, l, r) {
      if (l instanceof Leaf) {
        return r;
      }
      ;
      if (r instanceof Leaf) {
        return l;
      }
      ;
      if (r instanceof Node) {
        var v = unsafeSplit(comp, r.value2, l);
        var l$prime = $lazy_unsafeUnionWith(809)(comp, app, v.value1, r.value4);
        var r$prime = $lazy_unsafeUnionWith(810)(comp, app, v.value2, r.value5);
        if (v.value0 instanceof Just) {
          return unsafeBalancedNode(r.value2, app(v.value0.value0)(r.value3), l$prime, r$prime);
        }
        ;
        if (v.value0 instanceof Nothing) {
          return unsafeBalancedNode(r.value2, r.value3, l$prime, r$prime);
        }
        ;
        throw new Error("Failed pattern match at Data.Map.Internal (line 811, column 5 - line 815, column 46): " + [v.value0.constructor.name]);
      }
      ;
      throw new Error("Failed pattern match at Data.Map.Internal (line 804, column 42 - line 815, column 46): " + [l.constructor.name, r.constructor.name]);
    };
  });
  var unsafeUnionWith = /* @__PURE__ */ $lazy_unsafeUnionWith(803);
  var unionWith = function(dictOrd) {
    var compare4 = compare(dictOrd);
    return function(app) {
      return function(m1) {
        return function(m2) {
          return unsafeUnionWith(compare4, app, m1, m2);
        };
      };
    };
  };
  var union = function(dictOrd) {
    return unionWith(dictOrd)($$const);
  };
  var member2 = function(dictOrd) {
    var compare4 = compare(dictOrd);
    return function(k) {
      var go = function($copy_v) {
        var $tco_done = false;
        var $tco_result;
        function $tco_loop(v) {
          if (v instanceof Leaf) {
            $tco_done = true;
            return false;
          }
          ;
          if (v instanceof Node) {
            var v1 = compare4(k)(v.value2);
            if (v1 instanceof LT) {
              $copy_v = v.value4;
              return;
            }
            ;
            if (v1 instanceof GT) {
              $copy_v = v.value5;
              return;
            }
            ;
            if (v1 instanceof EQ) {
              $tco_done = true;
              return true;
            }
            ;
            throw new Error("Failed pattern match at Data.Map.Internal (line 459, column 7 - line 462, column 19): " + [v1.constructor.name]);
          }
          ;
          throw new Error("Failed pattern match at Data.Map.Internal (line 456, column 8 - line 462, column 19): " + [v.constructor.name]);
        }
        ;
        while (!$tco_done) {
          $tco_result = $tco_loop($copy_v);
        }
        ;
        return $tco_result;
      };
      return go;
    };
  };
  var lookup2 = function(dictOrd) {
    var compare4 = compare(dictOrd);
    return function(k) {
      var go = function($copy_v) {
        var $tco_done = false;
        var $tco_result;
        function $tco_loop(v) {
          if (v instanceof Leaf) {
            $tco_done = true;
            return Nothing.value;
          }
          ;
          if (v instanceof Node) {
            var v1 = compare4(k)(v.value2);
            if (v1 instanceof LT) {
              $copy_v = v.value4;
              return;
            }
            ;
            if (v1 instanceof GT) {
              $copy_v = v.value5;
              return;
            }
            ;
            if (v1 instanceof EQ) {
              $tco_done = true;
              return new Just(v.value3);
            }
            ;
            throw new Error("Failed pattern match at Data.Map.Internal (line 283, column 7 - line 286, column 22): " + [v1.constructor.name]);
          }
          ;
          throw new Error("Failed pattern match at Data.Map.Internal (line 280, column 8 - line 286, column 22): " + [v.constructor.name]);
        }
        ;
        while (!$tco_done) {
          $tco_result = $tco_loop($copy_v);
        }
        ;
        return $tco_result;
      };
      return go;
    };
  };
  var iterMapL = /* @__PURE__ */ function() {
    var go = function($copy_iter) {
      return function($copy_v) {
        var $tco_var_iter = $copy_iter;
        var $tco_done = false;
        var $tco_result;
        function $tco_loop(iter, v) {
          if (v instanceof Leaf) {
            $tco_done = true;
            return iter;
          }
          ;
          if (v instanceof Node) {
            if (v.value5 instanceof Leaf) {
              $tco_var_iter = new IterEmit(v.value2, v.value3, iter);
              $copy_v = v.value4;
              return;
            }
            ;
            $tco_var_iter = new IterEmit(v.value2, v.value3, new IterNode(v.value5, iter));
            $copy_v = v.value4;
            return;
          }
          ;
          throw new Error("Failed pattern match at Data.Map.Internal (line 951, column 13 - line 958, column 48): " + [v.constructor.name]);
        }
        ;
        while (!$tco_done) {
          $tco_result = $tco_loop($tco_var_iter, $copy_v);
        }
        ;
        return $tco_result;
      };
    };
    return go;
  }();
  var stepAscCps = /* @__PURE__ */ stepWith(iterMapL);
  var stepAsc = /* @__PURE__ */ function() {
    return stepAscCps(function(k, v, next) {
      return new IterNext(k, v, next);
    })($$const(IterDone.value));
  }();
  var eqMapIter = function(dictEq) {
    var eq15 = eq(dictEq);
    return function(dictEq1) {
      var eq23 = eq(dictEq1);
      return {
        eq: /* @__PURE__ */ function() {
          var go = function($copy_a) {
            return function($copy_b) {
              var $tco_var_a = $copy_a;
              var $tco_done = false;
              var $tco_result;
              function $tco_loop(a, b) {
                var v = stepAsc(a);
                if (v instanceof IterNext) {
                  var v2 = stepAsc(b);
                  if (v2 instanceof IterNext && (eq15(v.value0)(v2.value0) && eq23(v.value1)(v2.value1))) {
                    $tco_var_a = v.value2;
                    $copy_b = v2.value2;
                    return;
                  }
                  ;
                  $tco_done = true;
                  return false;
                }
                ;
                if (v instanceof IterDone) {
                  $tco_done = true;
                  return true;
                }
                ;
                throw new Error("Failed pattern match at Data.Map.Internal (line 859, column 14 - line 868, column 13): " + [v.constructor.name]);
              }
              ;
              while (!$tco_done) {
                $tco_result = $tco_loop($tco_var_a, $copy_b);
              }
              ;
              return $tco_result;
            };
          };
          return go;
        }()
      };
    };
  };
  var stepUnfoldr = /* @__PURE__ */ function() {
    var step3 = function(k, v, next) {
      return new Just(new Tuple(new Tuple(k, v), next));
    };
    return stepAscCps(step3)(function(v) {
      return Nothing.value;
    });
  }();
  var toUnfoldable3 = function(dictUnfoldable) {
    var $784 = unfoldr(dictUnfoldable)(stepUnfoldr);
    return function($785) {
      return $784(toMapIter($785));
    };
  };
  var insert2 = function(dictOrd) {
    var compare4 = compare(dictOrd);
    return function(k) {
      return function(v) {
        var go = function(v1) {
          if (v1 instanceof Leaf) {
            return singleton5(k)(v);
          }
          ;
          if (v1 instanceof Node) {
            var v2 = compare4(k)(v1.value2);
            if (v2 instanceof LT) {
              return unsafeBalancedNode(v1.value2, v1.value3, go(v1.value4), v1.value5);
            }
            ;
            if (v2 instanceof GT) {
              return unsafeBalancedNode(v1.value2, v1.value3, v1.value4, go(v1.value5));
            }
            ;
            if (v2 instanceof EQ) {
              return new Node(v1.value0, v1.value1, k, v, v1.value4, v1.value5);
            }
            ;
            throw new Error("Failed pattern match at Data.Map.Internal (line 471, column 7 - line 474, column 35): " + [v2.constructor.name]);
          }
          ;
          throw new Error("Failed pattern match at Data.Map.Internal (line 468, column 8 - line 474, column 35): " + [v1.constructor.name]);
        };
        return go;
      };
    };
  };
  var foldableMap = {
    foldr: function(f) {
      return function(z) {
        var $lazy_go = $runtime_lazy3("go", "Data.Map.Internal", function() {
          return function(m$prime, z$prime) {
            if (m$prime instanceof Leaf) {
              return z$prime;
            }
            ;
            if (m$prime instanceof Node) {
              return $lazy_go(172)(m$prime.value4, f(m$prime.value3)($lazy_go(172)(m$prime.value5, z$prime)));
            }
            ;
            throw new Error("Failed pattern match at Data.Map.Internal (line 169, column 26 - line 172, column 43): " + [m$prime.constructor.name]);
          };
        });
        var go = $lazy_go(169);
        return function(m) {
          return go(m, z);
        };
      };
    },
    foldl: function(f) {
      return function(z) {
        var $lazy_go = $runtime_lazy3("go", "Data.Map.Internal", function() {
          return function(z$prime, m$prime) {
            if (m$prime instanceof Leaf) {
              return z$prime;
            }
            ;
            if (m$prime instanceof Node) {
              return $lazy_go(178)(f($lazy_go(178)(z$prime, m$prime.value4))(m$prime.value3), m$prime.value5);
            }
            ;
            throw new Error("Failed pattern match at Data.Map.Internal (line 175, column 26 - line 178, column 43): " + [m$prime.constructor.name]);
          };
        });
        var go = $lazy_go(175);
        return function(m) {
          return go(z, m);
        };
      };
    },
    foldMap: function(dictMonoid) {
      var mempty2 = mempty(dictMonoid);
      var append16 = append(dictMonoid.Semigroup0());
      return function(f) {
        var go = function(v) {
          if (v instanceof Leaf) {
            return mempty2;
          }
          ;
          if (v instanceof Node) {
            return append16(go(v.value4))(append16(f(v.value3))(go(v.value5)));
          }
          ;
          throw new Error("Failed pattern match at Data.Map.Internal (line 181, column 10 - line 184, column 28): " + [v.constructor.name]);
        };
        return go;
      };
    }
  };
  var foldableWithIndexMap = {
    foldrWithIndex: function(f) {
      return function(z) {
        var $lazy_go = $runtime_lazy3("go", "Data.Map.Internal", function() {
          return function(m$prime, z$prime) {
            if (m$prime instanceof Leaf) {
              return z$prime;
            }
            ;
            if (m$prime instanceof Node) {
              return $lazy_go(192)(m$prime.value4, f(m$prime.value2)(m$prime.value3)($lazy_go(192)(m$prime.value5, z$prime)));
            }
            ;
            throw new Error("Failed pattern match at Data.Map.Internal (line 189, column 26 - line 192, column 45): " + [m$prime.constructor.name]);
          };
        });
        var go = $lazy_go(189);
        return function(m) {
          return go(m, z);
        };
      };
    },
    foldlWithIndex: function(f) {
      return function(z) {
        var $lazy_go = $runtime_lazy3("go", "Data.Map.Internal", function() {
          return function(z$prime, m$prime) {
            if (m$prime instanceof Leaf) {
              return z$prime;
            }
            ;
            if (m$prime instanceof Node) {
              return $lazy_go(198)(f(m$prime.value2)($lazy_go(198)(z$prime, m$prime.value4))(m$prime.value3), m$prime.value5);
            }
            ;
            throw new Error("Failed pattern match at Data.Map.Internal (line 195, column 26 - line 198, column 45): " + [m$prime.constructor.name]);
          };
        });
        var go = $lazy_go(195);
        return function(m) {
          return go(z, m);
        };
      };
    },
    foldMapWithIndex: function(dictMonoid) {
      var mempty2 = mempty(dictMonoid);
      var append16 = append(dictMonoid.Semigroup0());
      return function(f) {
        var go = function(v) {
          if (v instanceof Leaf) {
            return mempty2;
          }
          ;
          if (v instanceof Node) {
            return append16(go(v.value4))(append16(f(v.value2)(v.value3))(go(v.value5)));
          }
          ;
          throw new Error("Failed pattern match at Data.Map.Internal (line 201, column 10 - line 204, column 30): " + [v.constructor.name]);
        };
        return go;
      };
    },
    Foldable0: function() {
      return foldableMap;
    }
  };
  var keys2 = /* @__PURE__ */ function() {
    return foldrWithIndex(foldableWithIndexMap)(function(k) {
      return function(v) {
        return function(acc) {
          return new Cons(k, acc);
        };
      };
    })(Nil.value);
  }();
  var values = /* @__PURE__ */ function() {
    return foldr(foldableMap)(Cons.create)(Nil.value);
  }();
  var eqMap = function(dictEq) {
    var eqMapIter1 = eqMapIter(dictEq);
    return function(dictEq1) {
      var eq15 = eq(eqMapIter1(dictEq1));
      return {
        eq: function(xs) {
          return function(ys) {
            if (xs instanceof Leaf) {
              if (ys instanceof Leaf) {
                return true;
              }
              ;
              return false;
            }
            ;
            if (xs instanceof Node) {
              if (ys instanceof Node && xs.value1 === ys.value1) {
                return eq15(toMapIter(xs))(toMapIter(ys));
              }
              ;
              return false;
            }
            ;
            throw new Error("Failed pattern match at Data.Map.Internal (line 94, column 14 - line 105, column 16): " + [xs.constructor.name]);
          };
        }
      };
    };
  };
  var empty3 = /* @__PURE__ */ function() {
    return Leaf.value;
  }();
  var fromFoldable3 = function(dictOrd) {
    var insert15 = insert2(dictOrd);
    return function(dictFoldable) {
      return foldl(dictFoldable)(function(m) {
        return function(v) {
          return insert15(v.value0)(v.value1)(m);
        };
      })(empty3);
    };
  };
  var $$delete = function(dictOrd) {
    var compare4 = compare(dictOrd);
    return function(k) {
      var go = function(v) {
        if (v instanceof Leaf) {
          return Leaf.value;
        }
        ;
        if (v instanceof Node) {
          var v1 = compare4(k)(v.value2);
          if (v1 instanceof LT) {
            return unsafeBalancedNode(v.value2, v.value3, go(v.value4), v.value5);
          }
          ;
          if (v1 instanceof GT) {
            return unsafeBalancedNode(v.value2, v.value3, v.value4, go(v.value5));
          }
          ;
          if (v1 instanceof EQ) {
            return unsafeJoinNodes(v.value4, v.value5);
          }
          ;
          throw new Error("Failed pattern match at Data.Map.Internal (line 498, column 7 - line 501, column 43): " + [v1.constructor.name]);
        }
        ;
        throw new Error("Failed pattern match at Data.Map.Internal (line 495, column 8 - line 501, column 43): " + [v.constructor.name]);
      };
      return go;
    };
  };

  // .tmp-verdict-build/output/Control.Monad.Error.Class/index.js
  var throwError = function(dict) {
    return dict.throwError;
  };

  // .tmp-verdict-build/output/Control.Monad.State.Class/index.js
  var state = function(dict) {
    return dict.state;
  };
  var put = function(dictMonadState) {
    var state1 = state(dictMonadState);
    return function(s) {
      return state1(function(v) {
        return new Tuple(unit, s);
      });
    };
  };
  var modify_ = function(dictMonadState) {
    var state1 = state(dictMonadState);
    return function(f) {
      return state1(function(s) {
        return new Tuple(unit, f(s));
      });
    };
  };
  var get = function(dictMonadState) {
    return state(dictMonadState)(function(s) {
      return new Tuple(s, s);
    });
  };

  // .tmp-verdict-build/output/Control.Monad.Trans.Class/index.js
  var lift = function(dict) {
    return dict.lift;
  };

  // .tmp-verdict-build/output/Data.Lazy/foreign.js
  var defer2 = function(thunk) {
    var v = null;
    return function() {
      if (thunk === void 0) return v;
      v = thunk();
      thunk = void 0;
      return v;
    };
  };
  var force = function(l) {
    return l();
  };

  // .tmp-verdict-build/output/Data.Show.Generic/foreign.js
  var intercalate2 = function(separator) {
    return function(xs) {
      return xs.join(separator);
    };
  };

  // .tmp-verdict-build/output/Data.Show.Generic/index.js
  var append3 = /* @__PURE__ */ append(semigroupArray);
  var genericShowArgsArgument = function(dictShow) {
    var show9 = show(dictShow);
    return {
      genericShowArgs: function(v) {
        return [show9(v)];
      }
    };
  };
  var genericShowArgs = function(dict) {
    return dict.genericShowArgs;
  };
  var genericShowConstructor = function(dictGenericShowArgs) {
    var genericShowArgs1 = genericShowArgs(dictGenericShowArgs);
    return function(dictIsSymbol) {
      var reflectSymbol2 = reflectSymbol(dictIsSymbol);
      return {
        "genericShow'": function(v) {
          var ctor = reflectSymbol2($$Proxy.value);
          var v1 = genericShowArgs1(v);
          if (v1.length === 0) {
            return ctor;
          }
          ;
          return "(" + (intercalate2(" ")(append3([ctor])(v1)) + ")");
        }
      };
    };
  };
  var genericShow$prime = function(dict) {
    return dict["genericShow'"];
  };
  var genericShow = function(dictGeneric) {
    var from2 = from(dictGeneric);
    return function(dictGenericShow) {
      var genericShow$prime1 = genericShow$prime(dictGenericShow);
      return function(x) {
        return genericShow$prime1(from2(x));
      };
    };
  };

  // .tmp-verdict-build/output/Parsing/index.js
  var $runtime_lazy4 = function(name2, moduleName2, init3) {
    var state2 = 0;
    var val;
    return function(lineNumber) {
      if (state2 === 2) return val;
      if (state2 === 1) throw new ReferenceError(name2 + " was needed before it finished initializing (module " + moduleName2 + ", line " + lineNumber + ")", moduleName2, lineNumber);
      state2 = 1;
      val = init3();
      state2 = 2;
      return val;
    };
  };
  var show2 = /* @__PURE__ */ show(showString);
  var unwrap2 = /* @__PURE__ */ unwrap();
  var ParseState = /* @__PURE__ */ function() {
    function ParseState2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    ParseState2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new ParseState2(value0, value1, value2);
        };
      };
    };
    return ParseState2;
  }();
  var ParseError = /* @__PURE__ */ function() {
    function ParseError2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    ParseError2.create = function(value0) {
      return function(value1) {
        return new ParseError2(value0, value1);
      };
    };
    return ParseError2;
  }();
  var More = /* @__PURE__ */ function() {
    function More2(value0) {
      this.value0 = value0;
    }
    ;
    More2.create = function(value0) {
      return new More2(value0);
    };
    return More2;
  }();
  var Lift = /* @__PURE__ */ function() {
    function Lift2(value0) {
      this.value0 = value0;
    }
    ;
    Lift2.create = function(value0) {
      return new Lift2(value0);
    };
    return Lift2;
  }();
  var Stop = /* @__PURE__ */ function() {
    function Stop2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    Stop2.create = function(value0) {
      return function(value1) {
        return new Stop2(value0, value1);
      };
    };
    return Stop2;
  }();
  var lazyParserT = {
    defer: function(f) {
      var m = defer2(f);
      return function(state1, more, lift1, $$throw, done) {
        var v = force(m);
        return v(state1, more, lift1, $$throw, done);
      };
    }
  };
  var genericPosition_ = {
    to: function(x) {
      return x;
    },
    from: function(x) {
      return x;
    }
  };
  var genericShow2 = /* @__PURE__ */ genericShow(genericPosition_)(/* @__PURE__ */ genericShowConstructor(/* @__PURE__ */ genericShowArgsArgument(/* @__PURE__ */ showRecord()()(/* @__PURE__ */ showRecordFieldsCons({
    reflectSymbol: function() {
      return "column";
    }
  })(/* @__PURE__ */ showRecordFieldsCons({
    reflectSymbol: function() {
      return "index";
    }
  })(/* @__PURE__ */ showRecordFieldsConsNil({
    reflectSymbol: function() {
      return "line";
    }
  })(showInt))(showInt))(showInt))))({
    reflectSymbol: function() {
      return "Position";
    }
  }));
  var showPosition = {
    show: function(x) {
      return genericShow2(x);
    }
  };
  var show1 = /* @__PURE__ */ show(showPosition);
  var functorParserT = {
    map: function(f) {
      return function(v) {
        return function(state1, more, lift1, $$throw, done) {
          return more(function(v1) {
            return v(state1, more, lift1, $$throw, function(state2, a) {
              return more(function(v2) {
                return done(state2, f(a));
              });
            });
          });
        };
      };
    }
  };
  var altParserT = {
    alt: function(v) {
      return function(v1) {
        return function(v2, more, lift1, $$throw, done) {
          return more(function(v3) {
            return v(new ParseState(v2.value0, v2.value1, false), more, lift1, function(v4, err2) {
              return more(function(v5) {
                if (v4.value2) {
                  return $$throw(v4, err2);
                }
                ;
                return v1(v2, more, lift1, $$throw, done);
              });
            }, done);
          });
        };
      };
    },
    Functor0: function() {
      return functorParserT;
    }
  };
  var stateParserT = function(k) {
    return function(state1, v, v1, v2, done) {
      var v3 = k(state1);
      return done(v3.value1, v3.value0);
    };
  };
  var showParseError = {
    show: function(v) {
      return "(ParseError " + (show2(v.value0) + (" " + (show1(v.value1) + ")")));
    }
  };
  var runParserT$prime = function(dictMonadRec) {
    var Monad0 = dictMonadRec.Monad0();
    var map33 = map(Monad0.Bind1().Apply0().Functor0());
    var pure12 = pure(Monad0.Applicative0());
    var tailRecM6 = tailRecM(dictMonadRec);
    return function(state1) {
      return function(v) {
        var go = function($copy_step) {
          var $tco_done = false;
          var $tco_result;
          function $tco_loop(step3) {
            var v1 = step3(unit);
            if (v1 instanceof More) {
              $copy_step = v1.value0;
              return;
            }
            ;
            if (v1 instanceof Lift) {
              $tco_done = true;
              return map33(Loop.create)(v1.value0);
            }
            ;
            if (v1 instanceof Stop) {
              $tco_done = true;
              return pure12(new Done(new Tuple(v1.value1, v1.value0)));
            }
            ;
            throw new Error("Failed pattern match at Parsing (line 160, column 13 - line 166, column 32): " + [v1.constructor.name]);
          }
          ;
          while (!$tco_done) {
            $tco_result = $tco_loop($copy_step);
          }
          ;
          return $tco_result;
        };
        return tailRecM6(go)(function(v1) {
          return v(state1, More.create, Lift.create, function(state2, err2) {
            return new Stop(state2, new Left(err2));
          }, function(state2, res) {
            return new Stop(state2, new Right(res));
          });
        });
      };
    };
  };
  var position = /* @__PURE__ */ stateParserT(function(v) {
    return new Tuple(v.value1, v);
  });
  var parseErrorPosition = function(v) {
    return v.value1;
  };
  var parseErrorMessage = function(v) {
    return v.value0;
  };
  var initialPos = {
    index: 0,
    line: 1,
    column: 1
  };
  var runParserT = function(dictMonadRec) {
    var map33 = map(dictMonadRec.Monad0().Bind1().Apply0().Functor0());
    var runParserT$prime1 = runParserT$prime(dictMonadRec);
    return function(s) {
      return function(p) {
        var initialState = new ParseState(s, initialPos, false);
        return map33(fst)(runParserT$prime1(initialState)(p));
      };
    };
  };
  var runParserT1 = /* @__PURE__ */ runParserT(monadRecIdentity);
  var runParser = function(s) {
    var $295 = runParserT1(s);
    return function($296) {
      return unwrap2($295($296));
    };
  };
  var appendConsumed = function(v) {
    return function(v1) {
      if (v.value2 && !v1.value2) {
        return new ParseState(v1.value0, v1.value1, true);
      }
      ;
      return v1;
    };
  };
  var applyParserT = {
    apply: function(v) {
      return function(v1) {
        return function(state1, more, lift1, $$throw, done) {
          return more(function(v2) {
            return v(state1, more, lift1, $$throw, function(state2, f) {
              return more(function(v3) {
                var state2$prime = appendConsumed(state1)(state2);
                return v1(state2$prime, more, lift1, $$throw, function(state3, a) {
                  return more(function(v4) {
                    return done(appendConsumed(state2$prime)(state3), f(a));
                  });
                });
              });
            });
          });
        };
      };
    },
    Functor0: function() {
      return functorParserT;
    }
  };
  var applicativeParserT = {
    pure: function(a) {
      return function(state1, v, v1, v2, done) {
        return done(state1, a);
      };
    },
    Apply0: function() {
      return applyParserT;
    }
  };
  var bindParserT = {
    bind: function(v) {
      return function(next) {
        return function(state1, more, lift1, $$throw, done) {
          return more(function(v1) {
            return v(state1, more, lift1, $$throw, function(state2, a) {
              return more(function(v2) {
                var v3 = next(a);
                return v3(appendConsumed(state1)(state2), more, lift1, $$throw, done);
              });
            });
          });
        };
      };
    },
    Apply0: function() {
      return applyParserT;
    }
  };
  var bindFlipped3 = /* @__PURE__ */ bindFlipped(bindParserT);
  var monadParserT = {
    Applicative0: function() {
      return applicativeParserT;
    },
    Bind1: function() {
      return bindParserT;
    }
  };
  var monadThrowParseErrorParse = {
    throwError: function(err2) {
      return function(state1, v, v1, $$throw, v2) {
        return $$throw(state1, err2);
      };
    },
    Monad0: function() {
      return monadParserT;
    }
  };
  var throwError2 = /* @__PURE__ */ throwError(monadThrowParseErrorParse);
  var failWithPosition = function(message2) {
    return function(pos) {
      return throwError2(new ParseError(message2, pos));
    };
  };
  var fail = function(message2) {
    return bindFlipped3(failWithPosition(message2))(position);
  };
  var plusParserT = {
    empty: /* @__PURE__ */ fail("No alternative"),
    Alt0: function() {
      return altParserT;
    }
  };
  var alternativeParserT = {
    Applicative0: function() {
      return applicativeParserT;
    },
    Plus1: function() {
      return plusParserT;
    }
  };
  var monadRecParserT = {
    tailRecM: function(next) {
      return function(initArg) {
        return function(state1, more, lift1, $$throw, done) {
          var $lazy_loop = $runtime_lazy4("loop", "Parsing", function() {
            return function(state2, arg, gas) {
              var v = next(arg);
              return v(state2, more, lift1, $$throw, function(state3, step3) {
                var state3$prime = appendConsumed(state2)(state3);
                if (step3 instanceof Loop) {
                  var $292 = gas === 0;
                  if ($292) {
                    return more(function(v1) {
                      return $lazy_loop(288)(state3$prime, step3.value0, 30);
                    });
                  }
                  ;
                  return $lazy_loop(290)(state3$prime, step3.value0, gas - 1 | 0);
                }
                ;
                if (step3 instanceof Done) {
                  return done(state3$prime, step3.value0);
                }
                ;
                throw new Error("Failed pattern match at Parsing (line 284, column 19 - line 292, column 46): " + [step3.constructor.name]);
              });
            };
          });
          var loop = $lazy_loop(279);
          return loop(state1, initArg, 30);
        };
      };
    },
    Monad0: function() {
      return monadParserT;
    }
  };

  // .tmp-verdict-build/output/Control.Monad.State.Trans/index.js
  var runStateT = function(v) {
    return v;
  };
  var monadTransStateT = {
    lift: function(dictMonad) {
      var bind13 = bind(dictMonad.Bind1());
      var pure10 = pure(dictMonad.Applicative0());
      return function(m) {
        return function(s) {
          return bind13(m)(function(x) {
            return pure10(new Tuple(x, s));
          });
        };
      };
    }
  };
  var functorStateT = function(dictFunctor) {
    var map33 = map(dictFunctor);
    return {
      map: function(f) {
        return function(v) {
          return function(s) {
            return map33(function(v1) {
              return new Tuple(f(v1.value0), v1.value1);
            })(v(s));
          };
        };
      }
    };
  };
  var monadStateT = function(dictMonad) {
    return {
      Applicative0: function() {
        return applicativeStateT(dictMonad);
      },
      Bind1: function() {
        return bindStateT(dictMonad);
      }
    };
  };
  var bindStateT = function(dictMonad) {
    var bind13 = bind(dictMonad.Bind1());
    return {
      bind: function(v) {
        return function(f) {
          return function(s) {
            return bind13(v(s))(function(v1) {
              var v3 = f(v1.value0);
              return v3(v1.value1);
            });
          };
        };
      },
      Apply0: function() {
        return applyStateT(dictMonad);
      }
    };
  };
  var applyStateT = function(dictMonad) {
    var functorStateT1 = functorStateT(dictMonad.Bind1().Apply0().Functor0());
    return {
      apply: ap(monadStateT(dictMonad)),
      Functor0: function() {
        return functorStateT1;
      }
    };
  };
  var applicativeStateT = function(dictMonad) {
    var pure10 = pure(dictMonad.Applicative0());
    return {
      pure: function(a) {
        return function(s) {
          return pure10(new Tuple(a, s));
        };
      },
      Apply0: function() {
        return applyStateT(dictMonad);
      }
    };
  };
  var monadRecStateT = function(dictMonadRec) {
    var Monad0 = dictMonadRec.Monad0();
    var bind13 = bind(Monad0.Bind1());
    var pure10 = pure(Monad0.Applicative0());
    var tailRecM6 = tailRecM(dictMonadRec);
    var monadStateT1 = monadStateT(Monad0);
    return {
      tailRecM: function(f) {
        return function(a) {
          var f$prime = function(v) {
            var v1 = f(v.value0);
            return bind13(v1(v.value1))(function(v2) {
              return pure10(function() {
                if (v2.value0 instanceof Loop) {
                  return new Loop(new Tuple(v2.value0.value0, v2.value1));
                }
                ;
                if (v2.value0 instanceof Done) {
                  return new Done(new Tuple(v2.value0.value0, v2.value1));
                }
                ;
                throw new Error("Failed pattern match at Control.Monad.State.Trans (line 88, column 16 - line 90, column 40): " + [v2.value0.constructor.name]);
              }());
            });
          };
          return function(s) {
            return tailRecM6(f$prime)(new Tuple(a, s));
          };
        };
      },
      Monad0: function() {
        return monadStateT1;
      }
    };
  };
  var monadStateStateT = function(dictMonad) {
    var pure10 = pure(dictMonad.Applicative0());
    var monadStateT1 = monadStateT(dictMonad);
    return {
      state: function(f) {
        return function($206) {
          return pure10(f($206));
        };
      },
      Monad0: function() {
        return monadStateT1;
      }
    };
  };

  // .tmp-verdict-build/output/Control.Monad.State/index.js
  var unwrap3 = /* @__PURE__ */ unwrap();
  var runState = function(v) {
    return function($18) {
      return unwrap3(v($18));
    };
  };
  var evalState = function(v) {
    return function(s) {
      var v1 = v(s);
      return v1.value0;
    };
  };

  // .tmp-verdict-build/output/Data.String.CodeUnits/foreign.js
  var fromCharArray = function(a) {
    return a.join("");
  };
  var toCharArray = function(s) {
    return s.split("");
  };
  var singleton6 = function(c) {
    return c;
  };
  var _toChar = function(just) {
    return function(nothing) {
      return function(s) {
        return s.length === 1 ? just(s) : nothing;
      };
    };
  };
  var length2 = function(s) {
    return s.length;
  };
  var countPrefix = function(p) {
    return function(s) {
      var i = 0;
      while (i < s.length && p(s.charAt(i))) i++;
      return i;
    };
  };
  var _indexOf = function(just) {
    return function(nothing) {
      return function(x) {
        return function(s) {
          var i = s.indexOf(x);
          return i === -1 ? nothing : just(i);
        };
      };
    };
  };
  var take = function(n) {
    return function(s) {
      return s.substr(0, n);
    };
  };
  var drop = function(n) {
    return function(s) {
      return s.substring(n);
    };
  };
  var splitAt = function(i) {
    return function(s) {
      return { before: s.substring(0, i), after: s.substring(i) };
    };
  };

  // .tmp-verdict-build/output/Data.String.Unsafe/foreign.js
  var charAt = function(i) {
    return function(s) {
      if (i >= 0 && i < s.length) return s.charAt(i);
      throw new Error("Data.String.Unsafe.charAt: Invalid index.");
    };
  };

  // .tmp-verdict-build/output/Data.String.CodeUnits/index.js
  var uncons2 = function(v) {
    if (v === "") {
      return Nothing.value;
    }
    ;
    return new Just({
      head: charAt(0)(v),
      tail: drop(1)(v)
    });
  };
  var toChar = /* @__PURE__ */ function() {
    return _toChar(Just.create)(Nothing.value);
  }();
  var takeWhile = function(p) {
    return function(s) {
      return take(countPrefix(p)(s))(s);
    };
  };
  var stripPrefix = function(v) {
    return function(str) {
      var v1 = splitAt(length2(v))(str);
      var $20 = v1.before === v;
      if ($20) {
        return new Just(v1.after);
      }
      ;
      return Nothing.value;
    };
  };
  var indexOf = /* @__PURE__ */ function() {
    return _indexOf(Just.create)(Nothing.value);
  }();

  // .tmp-verdict-build/output/Verdict.Core.MIR/index.js
  var map5 = /* @__PURE__ */ map(functorArray);
  var MLoad = /* @__PURE__ */ function() {
    function MLoad2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    MLoad2.create = function(value0) {
      return function(value1) {
        return new MLoad2(value0, value1);
      };
    };
    return MLoad2;
  }();
  var MMove = /* @__PURE__ */ function() {
    function MMove2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    MMove2.create = function(value0) {
      return function(value1) {
        return new MMove2(value0, value1);
      };
    };
    return MMove2;
  }();
  var MBin = /* @__PURE__ */ function() {
    function MBin2(value0, value1, value2, value3) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
      this.value3 = value3;
    }
    ;
    MBin2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return function(value3) {
            return new MBin2(value0, value1, value2, value3);
          };
        };
      };
    };
    return MBin2;
  }();
  var MCmp = /* @__PURE__ */ function() {
    function MCmp2(value0, value1, value2, value3) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
      this.value3 = value3;
    }
    ;
    MCmp2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return function(value3) {
            return new MCmp2(value0, value1, value2, value3);
          };
        };
      };
    };
    return MCmp2;
  }();
  var MCall = /* @__PURE__ */ function() {
    function MCall2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    MCall2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new MCall2(value0, value1, value2);
        };
      };
    };
    return MCall2;
  }();
  var MSpawn = /* @__PURE__ */ function() {
    function MSpawn2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    MSpawn2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new MSpawn2(value0, value1, value2);
        };
      };
    };
    return MSpawn2;
  }();
  var MSend = /* @__PURE__ */ function() {
    function MSend2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    MSend2.create = function(value0) {
      return function(value1) {
        return new MSend2(value0, value1);
      };
    };
    return MSend2;
  }();
  var MRecv = /* @__PURE__ */ function() {
    function MRecv2(value0) {
      this.value0 = value0;
    }
    ;
    MRecv2.create = function(value0) {
      return new MRecv2(value0);
    };
    return MRecv2;
  }();
  var MYield = /* @__PURE__ */ function() {
    function MYield2() {
    }
    ;
    MYield2.value = new MYield2();
    return MYield2;
  }();
  var MSelf = /* @__PURE__ */ function() {
    function MSelf2(value0) {
      this.value0 = value0;
    }
    ;
    MSelf2.create = function(value0) {
      return new MSelf2(value0);
    };
    return MSelf2;
  }();
  var MTailCall = /* @__PURE__ */ function() {
    function MTailCall2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    MTailCall2.create = function(value0) {
      return function(value1) {
        return new MTailCall2(value0, value1);
      };
    };
    return MTailCall2;
  }();
  var MBuiltin = /* @__PURE__ */ function() {
    function MBuiltin2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    MBuiltin2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new MBuiltin2(value0, value1, value2);
        };
      };
    };
    return MBuiltin2;
  }();
  var MLoadInput = /* @__PURE__ */ function() {
    function MLoadInput2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    MLoadInput2.create = function(value0) {
      return function(value1) {
        return new MLoadInput2(value0, value1);
      };
    };
    return MLoadInput2;
  }();
  var MEffectNew = /* @__PURE__ */ function() {
    function MEffectNew2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    MEffectNew2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new MEffectNew2(value0, value1, value2);
        };
      };
    };
    return MEffectNew2;
  }();
  var MEffectRequest = /* @__PURE__ */ function() {
    function MEffectRequest2(value0) {
      this.value0 = value0;
    }
    ;
    MEffectRequest2.create = function(value0) {
      return new MEffectRequest2(value0);
    };
    return MEffectRequest2;
  }();
  var MEffectBatchNew = /* @__PURE__ */ function() {
    function MEffectBatchNew2(value0) {
      this.value0 = value0;
    }
    ;
    MEffectBatchNew2.create = function(value0) {
      return new MEffectBatchNew2(value0);
    };
    return MEffectBatchNew2;
  }();
  var MEffectBatchAppend = /* @__PURE__ */ function() {
    function MEffectBatchAppend2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    MEffectBatchAppend2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new MEffectBatchAppend2(value0, value1, value2);
        };
      };
    };
    return MEffectBatchAppend2;
  }();
  var MEffectAwait = /* @__PURE__ */ function() {
    function MEffectAwait2(value0) {
      this.value0 = value0;
    }
    ;
    MEffectAwait2.create = function(value0) {
      return new MEffectAwait2(value0);
    };
    return MEffectAwait2;
  }();
  var MVariantPayload = /* @__PURE__ */ function() {
    function MVariantPayload2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    MVariantPayload2.create = function(value0) {
      return function(value1) {
        return new MVariantPayload2(value0, value1);
      };
    };
    return MVariantPayload2;
  }();
  var MRecordNew = /* @__PURE__ */ function() {
    function MRecordNew2(value0) {
      this.value0 = value0;
    }
    ;
    MRecordNew2.create = function(value0) {
      return new MRecordNew2(value0);
    };
    return MRecordNew2;
  }();
  var MRecordSet = /* @__PURE__ */ function() {
    function MRecordSet2(value0, value1, value2, value3) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
      this.value3 = value3;
    }
    ;
    MRecordSet2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return function(value3) {
            return new MRecordSet2(value0, value1, value2, value3);
          };
        };
      };
    };
    return MRecordSet2;
  }();
  var MRecordGet = /* @__PURE__ */ function() {
    function MRecordGet2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    MRecordGet2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new MRecordGet2(value0, value1, value2);
        };
      };
    };
    return MRecordGet2;
  }();
  var MListNew = /* @__PURE__ */ function() {
    function MListNew2(value0) {
      this.value0 = value0;
    }
    ;
    MListNew2.create = function(value0) {
      return new MListNew2(value0);
    };
    return MListNew2;
  }();
  var MListAppend = /* @__PURE__ */ function() {
    function MListAppend2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    MListAppend2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new MListAppend2(value0, value1, value2);
        };
      };
    };
    return MListAppend2;
  }();
  var MListGet = /* @__PURE__ */ function() {
    function MListGet2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    MListGet2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new MListGet2(value0, value1, value2);
        };
      };
    };
    return MListGet2;
  }();
  var MListLength = /* @__PURE__ */ function() {
    function MListLength2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    MListLength2.create = function(value0) {
      return function(value1) {
        return new MListLength2(value0, value1);
      };
    };
    return MListLength2;
  }();
  var MLabel = /* @__PURE__ */ function() {
    function MLabel2(value0) {
      this.value0 = value0;
    }
    ;
    MLabel2.create = function(value0) {
      return new MLabel2(value0);
    };
    return MLabel2;
  }();
  var MJump = /* @__PURE__ */ function() {
    function MJump2(value0) {
      this.value0 = value0;
    }
    ;
    MJump2.create = function(value0) {
      return new MJump2(value0);
    };
    return MJump2;
  }();
  var MJumpIfFalse = /* @__PURE__ */ function() {
    function MJumpIfFalse2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    MJumpIfFalse2.create = function(value0) {
      return function(value1) {
        return new MJumpIfFalse2(value0, value1);
      };
    };
    return MJumpIfFalse2;
  }();
  var MRet = /* @__PURE__ */ function() {
    function MRet2(value0) {
      this.value0 = value0;
    }
    ;
    MRet2.create = function(value0) {
      return new MRet2(value0);
    };
    return MRet2;
  }();
  var MHalt = /* @__PURE__ */ function() {
    function MHalt2(value0) {
      this.value0 = value0;
    }
    ;
    MHalt2.create = function(value0) {
      return new MHalt2(value0);
    };
    return MHalt2;
  }();
  var usesOf = function(v) {
    if (v instanceof MMove) {
      return [v.value1];
    }
    ;
    if (v instanceof MBin) {
      return [v.value2, v.value3];
    }
    ;
    if (v instanceof MCmp) {
      return [v.value2, v.value3];
    }
    ;
    if (v instanceof MCall) {
      return v.value2;
    }
    ;
    if (v instanceof MSpawn) {
      return v.value2;
    }
    ;
    if (v instanceof MSend) {
      return [v.value0, v.value1];
    }
    ;
    if (v instanceof MTailCall) {
      return v.value1;
    }
    ;
    if (v instanceof MBuiltin) {
      return v.value2;
    }
    ;
    if (v instanceof MEffectNew) {
      return [v.value2];
    }
    ;
    if (v instanceof MEffectRequest) {
      return [v.value0];
    }
    ;
    if (v instanceof MEffectAwait) {
      return [v.value0];
    }
    ;
    if (v instanceof MVariantPayload) {
      return [v.value1];
    }
    ;
    if (v instanceof MEffectBatchAppend) {
      return [v.value1, v.value2];
    }
    ;
    if (v instanceof MRecordSet) {
      return [v.value1, v.value3];
    }
    ;
    if (v instanceof MRecordGet) {
      return [v.value1];
    }
    ;
    if (v instanceof MListAppend) {
      return [v.value1, v.value2];
    }
    ;
    if (v instanceof MListGet) {
      return [v.value1, v.value2];
    }
    ;
    if (v instanceof MListLength) {
      return [v.value1];
    }
    ;
    if (v instanceof MJumpIfFalse) {
      return [v.value0];
    }
    ;
    if (v instanceof MRet) {
      return [v.value0];
    }
    ;
    if (v instanceof MHalt) {
      return [v.value0];
    }
    ;
    return [];
  };
  var mapVRegs = function(f) {
    return function(v) {
      if (v instanceof MLoad) {
        return new MLoad(f(v.value0), v.value1);
      }
      ;
      if (v instanceof MMove) {
        return new MMove(f(v.value0), f(v.value1));
      }
      ;
      if (v instanceof MBin) {
        return new MBin(v.value0, f(v.value1), f(v.value2), f(v.value3));
      }
      ;
      if (v instanceof MCmp) {
        return new MCmp(v.value0, f(v.value1), f(v.value2), f(v.value3));
      }
      ;
      if (v instanceof MCall) {
        return new MCall(f(v.value0), v.value1, map5(f)(v.value2));
      }
      ;
      if (v instanceof MSpawn) {
        return new MSpawn(f(v.value0), v.value1, map5(f)(v.value2));
      }
      ;
      if (v instanceof MSend) {
        return new MSend(f(v.value0), f(v.value1));
      }
      ;
      if (v instanceof MRecv) {
        return new MRecv(f(v.value0));
      }
      ;
      if (v instanceof MYield) {
        return MYield.value;
      }
      ;
      if (v instanceof MSelf) {
        return new MSelf(f(v.value0));
      }
      ;
      if (v instanceof MTailCall) {
        return new MTailCall(v.value0, map5(f)(v.value1));
      }
      ;
      if (v instanceof MBuiltin) {
        return new MBuiltin(f(v.value0), v.value1, map5(f)(v.value2));
      }
      ;
      if (v instanceof MLoadInput) {
        return new MLoadInput(f(v.value0), v.value1);
      }
      ;
      if (v instanceof MEffectNew) {
        return new MEffectNew(f(v.value0), v.value1, f(v.value2));
      }
      ;
      if (v instanceof MEffectRequest) {
        return new MEffectRequest(f(v.value0));
      }
      ;
      if (v instanceof MEffectAwait) {
        return new MEffectAwait(f(v.value0));
      }
      ;
      if (v instanceof MVariantPayload) {
        return new MVariantPayload(f(v.value0), f(v.value1));
      }
      ;
      if (v instanceof MEffectBatchNew) {
        return new MEffectBatchNew(f(v.value0));
      }
      ;
      if (v instanceof MEffectBatchAppend) {
        return new MEffectBatchAppend(f(v.value0), f(v.value1), f(v.value2));
      }
      ;
      if (v instanceof MRecordNew) {
        return new MRecordNew(f(v.value0));
      }
      ;
      if (v instanceof MRecordSet) {
        return new MRecordSet(f(v.value0), f(v.value1), v.value2, f(v.value3));
      }
      ;
      if (v instanceof MRecordGet) {
        return new MRecordGet(f(v.value0), f(v.value1), v.value2);
      }
      ;
      if (v instanceof MListNew) {
        return new MListNew(f(v.value0));
      }
      ;
      if (v instanceof MListAppend) {
        return new MListAppend(f(v.value0), f(v.value1), f(v.value2));
      }
      ;
      if (v instanceof MListGet) {
        return new MListGet(f(v.value0), f(v.value1), f(v.value2));
      }
      ;
      if (v instanceof MListLength) {
        return new MListLength(f(v.value0), f(v.value1));
      }
      ;
      if (v instanceof MJumpIfFalse) {
        return new MJumpIfFalse(f(v.value0), v.value1);
      }
      ;
      if (v instanceof MRet) {
        return new MRet(f(v.value0));
      }
      ;
      if (v instanceof MHalt) {
        return new MHalt(f(v.value0));
      }
      ;
      return v;
    };
  };
  var isPure = function(v) {
    if (v instanceof MLoad) {
      return true;
    }
    ;
    if (v instanceof MMove) {
      return true;
    }
    ;
    if (v instanceof MBin) {
      return true;
    }
    ;
    if (v instanceof MCmp) {
      return true;
    }
    ;
    if (v instanceof MRecordGet) {
      return true;
    }
    ;
    if (v instanceof MListGet) {
      return true;
    }
    ;
    if (v instanceof MListLength) {
      return true;
    }
    ;
    return false;
  };
  var defOf = function(v) {
    if (v instanceof MLoad) {
      return new Just(v.value0);
    }
    ;
    if (v instanceof MMove) {
      return new Just(v.value0);
    }
    ;
    if (v instanceof MBin) {
      return new Just(v.value1);
    }
    ;
    if (v instanceof MCmp) {
      return new Just(v.value1);
    }
    ;
    if (v instanceof MCall) {
      return new Just(v.value0);
    }
    ;
    if (v instanceof MSpawn) {
      return new Just(v.value0);
    }
    ;
    if (v instanceof MRecv) {
      return new Just(v.value0);
    }
    ;
    if (v instanceof MSelf) {
      return new Just(v.value0);
    }
    ;
    if (v instanceof MBuiltin) {
      return new Just(v.value0);
    }
    ;
    if (v instanceof MLoadInput) {
      return new Just(v.value0);
    }
    ;
    if (v instanceof MEffectNew) {
      return new Just(v.value0);
    }
    ;
    if (v instanceof MVariantPayload) {
      return new Just(v.value0);
    }
    ;
    if (v instanceof MEffectBatchNew) {
      return new Just(v.value0);
    }
    ;
    if (v instanceof MEffectBatchAppend) {
      return new Just(v.value0);
    }
    ;
    if (v instanceof MRecordNew) {
      return new Just(v.value0);
    }
    ;
    if (v instanceof MRecordSet) {
      return new Just(v.value0);
    }
    ;
    if (v instanceof MRecordGet) {
      return new Just(v.value0);
    }
    ;
    if (v instanceof MListNew) {
      return new Just(v.value0);
    }
    ;
    if (v instanceof MListAppend) {
      return new Just(v.value0);
    }
    ;
    if (v instanceof MListGet) {
      return new Just(v.value0);
    }
    ;
    if (v instanceof MListLength) {
      return new Just(v.value0);
    }
    ;
    return Nothing.value;
  };
  var regsOf = function(i) {
    var v = defOf(i);
    if (v instanceof Just) {
      return cons(v.value0)(usesOf(i));
    }
    ;
    if (v instanceof Nothing) {
      return usesOf(i);
    }
    ;
    throw new Error("Failed pattern match at Verdict.Core.MIR (line 169, column 12 - line 171, column 22): " + [v.constructor.name]);
  };

  // .tmp-verdict-build/output/Verdict.Syntax.AST/index.js
  var append4 = /* @__PURE__ */ append(semigroupArray);
  var foldl3 = /* @__PURE__ */ foldl(foldableArray);
  var showTuple2 = /* @__PURE__ */ showTuple(showString);
  var eqTuple2 = /* @__PURE__ */ eqTuple(eqString);
  var eq12 = /* @__PURE__ */ eq(/* @__PURE__ */ eqArray(eqString));
  var PCtor = /* @__PURE__ */ function() {
    function PCtor2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    PCtor2.create = function(value0) {
      return function(value1) {
        return new PCtor2(value0, value1);
      };
    };
    return PCtor2;
  }();
  var PWild = /* @__PURE__ */ function() {
    function PWild2() {
    }
    ;
    PWild2.value = new PWild2();
    return PWild2;
  }();
  var TInt = /* @__PURE__ */ function() {
    function TInt2() {
    }
    ;
    TInt2.value = new TInt2();
    return TInt2;
  }();
  var TFixed = /* @__PURE__ */ function() {
    function TFixed2() {
    }
    ;
    TFixed2.value = new TFixed2();
    return TFixed2;
  }();
  var TRational = /* @__PURE__ */ function() {
    function TRational2() {
    }
    ;
    TRational2.value = new TRational2();
    return TRational2;
  }();
  var TVar = /* @__PURE__ */ function() {
    function TVar2(value0) {
      this.value0 = value0;
    }
    ;
    TVar2.create = function(value0) {
      return new TVar2(value0);
    };
    return TVar2;
  }();
  var TData = /* @__PURE__ */ function() {
    function TData2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    TData2.create = function(value0) {
      return function(value1) {
        return new TData2(value0, value1);
      };
    };
    return TData2;
  }();
  var TBool = /* @__PURE__ */ function() {
    function TBool2() {
    }
    ;
    TBool2.value = new TBool2();
    return TBool2;
  }();
  var TString = /* @__PURE__ */ function() {
    function TString2() {
    }
    ;
    TString2.value = new TString2();
    return TString2;
  }();
  var TUnit = /* @__PURE__ */ function() {
    function TUnit2() {
    }
    ;
    TUnit2.value = new TUnit2();
    return TUnit2;
  }();
  var TPid = /* @__PURE__ */ function() {
    function TPid2() {
    }
    ;
    TPid2.value = new TPid2();
    return TPid2;
  }();
  var TList = /* @__PURE__ */ function() {
    function TList2(value0) {
      this.value0 = value0;
    }
    ;
    TList2.create = function(value0) {
      return new TList2(value0);
    };
    return TList2;
  }();
  var TRecord = /* @__PURE__ */ function() {
    function TRecord2(value0) {
      this.value0 = value0;
    }
    ;
    TRecord2.create = function(value0) {
      return new TRecord2(value0);
    };
    return TRecord2;
  }();
  var TArrow = /* @__PURE__ */ function() {
    function TArrow2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    TArrow2.create = function(value0) {
      return function(value1) {
        return new TArrow2(value0, value1);
      };
    };
    return TArrow2;
  }();
  var TUnknown = /* @__PURE__ */ function() {
    function TUnknown2() {
    }
    ;
    TUnknown2.value = new TUnknown2();
    return TUnknown2;
  }();
  var LInt = /* @__PURE__ */ function() {
    function LInt2(value0) {
      this.value0 = value0;
    }
    ;
    LInt2.create = function(value0) {
      return new LInt2(value0);
    };
    return LInt2;
  }();
  var LFixed = /* @__PURE__ */ function() {
    function LFixed2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    LFixed2.create = function(value0) {
      return function(value1) {
        return new LFixed2(value0, value1);
      };
    };
    return LFixed2;
  }();
  var LRational = /* @__PURE__ */ function() {
    function LRational2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    LRational2.create = function(value0) {
      return function(value1) {
        return new LRational2(value0, value1);
      };
    };
    return LRational2;
  }();
  var LUnit = /* @__PURE__ */ function() {
    function LUnit2() {
    }
    ;
    LUnit2.value = new LUnit2();
    return LUnit2;
  }();
  var LBool = /* @__PURE__ */ function() {
    function LBool2(value0) {
      this.value0 = value0;
    }
    ;
    LBool2.create = function(value0) {
      return new LBool2(value0);
    };
    return LBool2;
  }();
  var LStr = /* @__PURE__ */ function() {
    function LStr2(value0) {
      this.value0 = value0;
    }
    ;
    LStr2.create = function(value0) {
      return new LStr2(value0);
    };
    return LStr2;
  }();
  var ExposeAll = /* @__PURE__ */ function() {
    function ExposeAll2() {
    }
    ;
    ExposeAll2.value = new ExposeAll2();
    return ExposeAll2;
  }();
  var ExposeNames = /* @__PURE__ */ function() {
    function ExposeNames2(value0) {
      this.value0 = value0;
    }
    ;
    ExposeNames2.create = function(value0) {
      return new ExposeNames2(value0);
    };
    return ExposeNames2;
  }();
  var TypeDecl = /* @__PURE__ */ function() {
    function TypeDecl2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    TypeDecl2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new TypeDecl2(value0, value1, value2);
        };
      };
    };
    return TypeDecl2;
  }();
  var CmpEq = /* @__PURE__ */ function() {
    function CmpEq2() {
    }
    ;
    CmpEq2.value = new CmpEq2();
    return CmpEq2;
  }();
  var CmpLt = /* @__PURE__ */ function() {
    function CmpLt2() {
    }
    ;
    CmpLt2.value = new CmpLt2();
    return CmpLt2;
  }();
  var CmpGt = /* @__PURE__ */ function() {
    function CmpGt2() {
    }
    ;
    CmpGt2.value = new CmpGt2();
    return CmpGt2;
  }();
  var OpAdd = /* @__PURE__ */ function() {
    function OpAdd2() {
    }
    ;
    OpAdd2.value = new OpAdd2();
    return OpAdd2;
  }();
  var OpSub = /* @__PURE__ */ function() {
    function OpSub2() {
    }
    ;
    OpSub2.value = new OpSub2();
    return OpSub2;
  }();
  var OpMul = /* @__PURE__ */ function() {
    function OpMul2() {
    }
    ;
    OpMul2.value = new OpMul2();
    return OpMul2;
  }();
  var OpDiv = /* @__PURE__ */ function() {
    function OpDiv2() {
    }
    ;
    OpDiv2.value = new OpDiv2();
    return OpDiv2;
  }();
  var OpMod = /* @__PURE__ */ function() {
    function OpMod2() {
    }
    ;
    OpMod2.value = new OpMod2();
    return OpMod2;
  }();
  var ELit = /* @__PURE__ */ function() {
    function ELit2(value0) {
      this.value0 = value0;
    }
    ;
    ELit2.create = function(value0) {
      return new ELit2(value0);
    };
    return ELit2;
  }();
  var EAt = /* @__PURE__ */ function() {
    function EAt2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    EAt2.create = function(value0) {
      return function(value1) {
        return new EAt2(value0, value1);
      };
    };
    return EAt2;
  }();
  var EVar = /* @__PURE__ */ function() {
    function EVar2(value0) {
      this.value0 = value0;
    }
    ;
    EVar2.create = function(value0) {
      return new EVar2(value0);
    };
    return EVar2;
  }();
  var EBin = /* @__PURE__ */ function() {
    function EBin2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    EBin2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new EBin2(value0, value1, value2);
        };
      };
    };
    return EBin2;
  }();
  var ECmp = /* @__PURE__ */ function() {
    function ECmp2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    ECmp2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new ECmp2(value0, value1, value2);
        };
      };
    };
    return ECmp2;
  }();
  var EIf = /* @__PURE__ */ function() {
    function EIf2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    EIf2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new EIf2(value0, value1, value2);
        };
      };
    };
    return EIf2;
  }();
  var ELet = /* @__PURE__ */ function() {
    function ELet2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    ELet2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new ELet2(value0, value1, value2);
        };
      };
    };
    return ELet2;
  }();
  var ECall = /* @__PURE__ */ function() {
    function ECall2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    ECall2.create = function(value0) {
      return function(value1) {
        return new ECall2(value0, value1);
      };
    };
    return ECall2;
  }();
  var EBuiltin = /* @__PURE__ */ function() {
    function EBuiltin2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    EBuiltin2.create = function(value0) {
      return function(value1) {
        return new EBuiltin2(value0, value1);
      };
    };
    return EBuiltin2;
  }();
  var EEffect = /* @__PURE__ */ function() {
    function EEffect2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    EEffect2.create = function(value0) {
      return function(value1) {
        return new EEffect2(value0, value1);
      };
    };
    return EEffect2;
  }();
  var EList = /* @__PURE__ */ function() {
    function EList2(value0) {
      this.value0 = value0;
    }
    ;
    EList2.create = function(value0) {
      return new EList2(value0);
    };
    return EList2;
  }();
  var ERecord = /* @__PURE__ */ function() {
    function ERecord2(value0) {
      this.value0 = value0;
    }
    ;
    ERecord2.create = function(value0) {
      return new ERecord2(value0);
    };
    return ERecord2;
  }();
  var EField = /* @__PURE__ */ function() {
    function EField2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    EField2.create = function(value0) {
      return function(value1) {
        return new EField2(value0, value1);
      };
    };
    return EField2;
  }();
  var ESwitch = /* @__PURE__ */ function() {
    function ESwitch2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    ESwitch2.create = function(value0) {
      return function(value1) {
        return new ESwitch2(value0, value1);
      };
    };
    return ESwitch2;
  }();
  var EMatch = /* @__PURE__ */ function() {
    function EMatch2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    EMatch2.create = function(value0) {
      return function(value1) {
        return new EMatch2(value0, value1);
      };
    };
    return EMatch2;
  }();
  var Module = /* @__PURE__ */ function() {
    function Module2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    Module2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new Module2(value0, value1, value2);
        };
      };
    };
    return Module2;
  }();
  var typeArity = function(v) {
    if (v instanceof TArrow) {
      return 1 + typeArity(v.value1) | 0;
    }
    ;
    return 0;
  };
  var stripAt = function($copy_v) {
    var $tco_done = false;
    var $tco_result;
    function $tco_loop(v) {
      if (v instanceof EAt) {
        $copy_v = v.value1;
        return;
      }
      ;
      $tco_done = true;
      return v;
    }
    ;
    while (!$tco_done) {
      $tco_result = $tco_loop($copy_v);
    }
    ;
    return $tco_result;
  };
  var splitArrow = function(n) {
    return function(t) {
      if (n <= 0) {
        return {
          params: [],
          result: t
        };
      }
      ;
      if (otherwise) {
        if (t instanceof TArrow) {
          var rest = splitArrow(n - 1 | 0)(t.value1);
          return {
            params: append4([t.value0])(rest.params),
            result: rest.result
          };
        }
        ;
        return {
          params: [],
          result: t
        };
      }
      ;
      throw new Error("Failed pattern match at Verdict.Syntax.AST (line 59, column 1 - line 59, column 64): " + [n.constructor.name, t.constructor.name]);
    };
  };
  var showTy = {
    show: function(v) {
      if (v instanceof TInt) {
        return "Int";
      }
      ;
      if (v instanceof TFixed) {
        return "Fixed";
      }
      ;
      if (v instanceof TRational) {
        return "Rational";
      }
      ;
      if (v instanceof TVar) {
        return v.value0;
      }
      ;
      if (v instanceof TData) {
        return foldl3(function(acc) {
          return function(t) {
            return acc + (" " + show(showTy)(t));
          };
        })(v.value0)(v.value1);
      }
      ;
      if (v instanceof TBool) {
        return "Bool";
      }
      ;
      if (v instanceof TString) {
        return "String";
      }
      ;
      if (v instanceof TUnit) {
        return "Unit";
      }
      ;
      if (v instanceof TPid) {
        return "Pid";
      }
      ;
      if (v instanceof TList) {
        return "(List " + (show(showTy)(v.value0) + ")");
      }
      ;
      if (v instanceof TRecord) {
        return "{" + (show(showArray(showTuple2(showTy)))(v.value0) + "}");
      }
      ;
      if (v instanceof TArrow) {
        return "(" + (show(showTy)(v.value0) + (" -> " + (show(showTy)(v.value1) + ")")));
      }
      ;
      if (v instanceof TUnknown) {
        return "?";
      }
      ;
      throw new Error("Failed pattern match at Verdict.Syntax.AST (line 37, column 1 - line 50, column 22): " + [v.constructor.name]);
    }
  };
  var showCmpOp = {
    show: function(v) {
      if (v instanceof CmpEq) {
        return "==";
      }
      ;
      if (v instanceof CmpLt) {
        return "<";
      }
      ;
      if (v instanceof CmpGt) {
        return ">";
      }
      ;
      throw new Error("Failed pattern match at Verdict.Syntax.AST (line 85, column 1 - line 88, column 19): " + [v.constructor.name]);
    }
  };
  var showBinOp = {
    show: function(v) {
      if (v instanceof OpAdd) {
        return "+";
      }
      ;
      if (v instanceof OpSub) {
        return "-";
      }
      ;
      if (v instanceof OpMul) {
        return "*";
      }
      ;
      if (v instanceof OpDiv) {
        return "/";
      }
      ;
      if (v instanceof OpMod) {
        return "mod";
      }
      ;
      throw new Error("Failed pattern match at Verdict.Syntax.AST (line 75, column 1 - line 80, column 21): " + [v.constructor.name]);
    }
  };
  var moduleTypes = function(v) {
    return v.value1;
  };
  var moduleName = function(v) {
    return v.value0;
  };
  var moduleDecls = function(v) {
    return v.value2;
  };
  var eqTy = {
    eq: function(x) {
      return function(y) {
        if (x instanceof TInt && y instanceof TInt) {
          return true;
        }
        ;
        if (x instanceof TFixed && y instanceof TFixed) {
          return true;
        }
        ;
        if (x instanceof TRational && y instanceof TRational) {
          return true;
        }
        ;
        if (x instanceof TVar && y instanceof TVar) {
          return x.value0 === y.value0;
        }
        ;
        if (x instanceof TData && y instanceof TData) {
          return x.value0 === y.value0 && eq(eqArray(eqTy))(x.value1)(y.value1);
        }
        ;
        if (x instanceof TBool && y instanceof TBool) {
          return true;
        }
        ;
        if (x instanceof TString && y instanceof TString) {
          return true;
        }
        ;
        if (x instanceof TUnit && y instanceof TUnit) {
          return true;
        }
        ;
        if (x instanceof TPid && y instanceof TPid) {
          return true;
        }
        ;
        if (x instanceof TList && y instanceof TList) {
          return eq(eqTy)(x.value0)(y.value0);
        }
        ;
        if (x instanceof TRecord && y instanceof TRecord) {
          return eq(eqArray(eqTuple2(eqTy)))(x.value0)(y.value0);
        }
        ;
        if (x instanceof TArrow && y instanceof TArrow) {
          return eq(eqTy)(x.value0)(y.value0) && eq(eqTy)(x.value1)(y.value1);
        }
        ;
        if (x instanceof TUnknown && y instanceof TUnknown) {
          return true;
        }
        ;
        return false;
      };
    }
  };
  var eqPattern = {
    eq: function(x) {
      return function(y) {
        if (x instanceof PCtor && y instanceof PCtor) {
          return x.value0 === y.value0 && eq12(x.value1)(y.value1);
        }
        ;
        if (x instanceof PWild && y instanceof PWild) {
          return true;
        }
        ;
        return false;
      };
    }
  };
  var declName = function(v) {
    return v.name;
  };

  // .tmp-verdict-build/output/Verdict.Core.Lower/index.js
  var bindStateT2 = /* @__PURE__ */ bindStateT(monadIdentity);
  var bind2 = /* @__PURE__ */ bind(bindStateT2);
  var monadStateStateT2 = /* @__PURE__ */ monadStateStateT(monadIdentity);
  var get2 = /* @__PURE__ */ get(monadStateStateT2);
  var discard2 = /* @__PURE__ */ discard(discardUnit)(bindStateT2);
  var modify_2 = /* @__PURE__ */ modify_(monadStateStateT2);
  var applicativeStateT2 = /* @__PURE__ */ applicativeStateT(monadIdentity);
  var pure2 = /* @__PURE__ */ pure(applicativeStateT2);
  var show3 = /* @__PURE__ */ show(showInt);
  var traverse_2 = /* @__PURE__ */ traverse_(applicativeStateT2)(foldableArray);
  var map6 = /* @__PURE__ */ map(functorArray);
  var fromFoldable4 = /* @__PURE__ */ fromFoldable3(ordString)(foldableArray);
  var traverse2 = /* @__PURE__ */ traverse(traversableArray)(applicativeStateT2);
  var union2 = /* @__PURE__ */ union(ordString);
  var lookup3 = /* @__PURE__ */ lookup2(ordString);
  var insert3 = /* @__PURE__ */ insert2(ordString);
  var alt2 = /* @__PURE__ */ alt(altMaybe);
  var map12 = /* @__PURE__ */ map(functorMaybe);
  var payloadFields = function(bid) {
    return function(args) {
      if (bid === "http.get@1" && args.length === 1) {
        return new Just([new Tuple("url", args[0])]);
      }
      ;
      if (bid === "http.post@1" && args.length === 2) {
        return new Just([new Tuple("url", args[0]), new Tuple("body", args[1])]);
      }
      ;
      if (bid === "db.insert@1" && args.length === 2) {
        return new Just([new Tuple("table", args[0]), new Tuple("record", args[1])]);
      }
      ;
      if (bid === "db.get@1" && args.length === 2) {
        return new Just([new Tuple("table", args[0]), new Tuple("id", args[1])]);
      }
      ;
      if (bid === "db.update@1" && args.length === 3) {
        return new Just([new Tuple("table", args[0]), new Tuple("id", args[1]), new Tuple("record", args[2])]);
      }
      ;
      if (bid === "db.delete@1" && args.length === 2) {
        return new Just([new Tuple("table", args[0]), new Tuple("id", args[1])]);
      }
      ;
      if (bid === "db.query@1" && args.length === 3) {
        return new Just([new Tuple("table", args[0]), new Tuple("query", args[1]), new Tuple("options", args[2])]);
      }
      ;
      if (bid === "db.createIndex@1" && args.length === 2) {
        return new Just([new Tuple("table", args[0]), new Tuple("field", args[1])]);
      }
      ;
      if (bid === "db.hash@1" && args.length === 1) {
        return new Just([new Tuple("table", args[0])]);
      }
      ;
      if (bid === "cache.set@1" && args.length === 3) {
        return new Just([new Tuple("ns", args[0]), new Tuple("cacheKey", args[1]), new Tuple("value", args[2])]);
      }
      ;
      if (bid === "cache.get@1" && args.length === 2) {
        return new Just([new Tuple("ns", args[0]), new Tuple("cacheKey", args[1])]);
      }
      ;
      if (bid === "cache.delete@1" && args.length === 2) {
        return new Just([new Tuple("ns", args[0]), new Tuple("cacheKey", args[1])]);
      }
      ;
      if (bid === "sys.log@1" && args.length === 1) {
        return new Just([new Tuple("message", args[0])]);
      }
      ;
      if (bid === "sys.cwd@1" && args.length === 0) {
        return new Just([]);
      }
      ;
      if (bid === "sys.readText@1" && args.length === 1) {
        return new Just([new Tuple("path", args[0])]);
      }
      ;
      if (bid === "sys.writeText@1" && args.length === 2) {
        return new Just([new Tuple("path", args[0]), new Tuple("contents", args[1])]);
      }
      ;
      if (bid === "sys.env@1" && args.length === 1) {
        return new Just([new Tuple("name", args[0])]);
      }
      ;
      return Nothing.value;
    };
  };
  var namespace = /* @__PURE__ */ takeWhile(function(v) {
    return v !== ".";
  });
  var isEffectfulBuiltin = function(bid) {
    var v = namespace(bid);
    if (v === "http") {
      return true;
    }
    ;
    if (v === "db") {
      return true;
    }
    ;
    if (v === "cache") {
      return true;
    }
    ;
    if (v === "sys") {
      return true;
    }
    ;
    if (v === "ws") {
      return true;
    }
    ;
    if (v === "time") {
      return true;
    }
    ;
    if (v === "random") {
      return true;
    }
    ;
    return false;
  };
  var freshReg = /* @__PURE__ */ bind2(get2)(function(s) {
    return discard2(modify_2(function(v) {
      var $86 = {};
      for (var $87 in v) {
        if ({}.hasOwnProperty.call(v, $87)) {
          $86[$87] = v[$87];
        }
        ;
      }
      ;
      $86.nextReg = s.nextReg + 1 | 0;
      return $86;
    }))(function() {
      return pure2(s.nextReg);
    });
  });
  var freshLabel = function(pfx) {
    return bind2(get2)(function(s) {
      return discard2(modify_2(function(v) {
        var $89 = {};
        for (var $90 in v) {
          if ({}.hasOwnProperty.call(v, $90)) {
            $89[$90] = v[$90];
          }
          ;
        }
        ;
        $89.nextLabel = s.nextLabel + 1 | 0;
        return $89;
      }))(function() {
        return pure2(pfx + ("_" + show3(s.nextLabel)));
      });
    });
  };
  var freshEffectId = /* @__PURE__ */ bind2(get2)(function(s) {
    return discard2(modify_2(function(v) {
      var $92 = {};
      for (var $93 in v) {
        if ({}.hasOwnProperty.call(v, $93)) {
          $92[$93] = v[$93];
        }
        ;
      }
      ;
      $92.nextEffect = s.nextEffect + 1 | 0;
      return $92;
    }))(function() {
      return pure2(s.nextEffect);
    });
  });
  var emit = function(i) {
    return modify_2(function(s) {
      var $95 = {};
      for (var $96 in s) {
        if ({}.hasOwnProperty.call(s, $96)) {
          $95[$96] = s[$96];
        }
        ;
      }
      ;
      $95.instrs = snoc(s.instrs)(i);
      return $95;
    });
  };
  var recordPayload = function(fields) {
    return bind2(freshReg)(function(r) {
      return discard2(emit(new MRecordNew(r)))(function() {
        return discard2(traverse_2(function(v) {
          return emit(new MRecordSet(r, r, v.value0, v.value1));
        })(fields))(function() {
          return pure2(r);
        });
      });
    });
  };
  var effectType = /* @__PURE__ */ takeWhile(function(v) {
    return v !== "@";
  });
  var effectResultKey = function(fn) {
    return function(ix) {
      return "__effect.result." + (fn + ("." + show3(ix)));
    };
  };
  var ctorMap = function(typeDecls) {
    var entries = function(v) {
      return map6(function(c) {
        return new Tuple(c.name, c);
      })(v.value2);
    };
    return fromFoldable4(concatMap(entries)(typeDecls));
  };
  var argsPayload = function(args) {
    if (args.length === 0) {
      return bind2(freshReg)(function(r) {
        return discard2(emit(new MLoad(r, LUnit.value)))(function() {
          return pure2(r);
        });
      });
    }
    ;
    if (args.length === 1) {
      return pure2(args[0]);
    }
    ;
    return bind2(freshReg)(function(r) {
      return discard2(emit(new MListNew(r)))(function() {
        return discard2(traverse_2(function(arg) {
          return emit(new MListAppend(r, r, arg));
        })(args))(function() {
          return pure2(r);
        });
      });
    });
  };
  var effectPayload = function(key) {
    return function(bid) {
      return function(args) {
        return bind2(freshReg)(function(keyReg) {
          return discard2(emit(new MLoad(keyReg, new LStr(key))))(function() {
            var v = payloadFields(bid)(args);
            if (v instanceof Just) {
              return recordPayload(cons(new Tuple("key", keyReg))(v.value0));
            }
            ;
            if (v instanceof Nothing) {
              return bind2(argsPayload(args))(function(argsReg) {
                return recordPayload([new Tuple("key", keyReg), new Tuple("args", argsReg)]);
              });
            }
            ;
            throw new Error("Failed pattern match at Verdict.Core.Lower (line 322, column 3 - line 326, column 65): " + [v.constructor.name]);
          });
        });
      };
    };
  };
  var lowerEffectBuiltin = function(bid) {
    return function(args) {
      return bind2(freshEffectId)(function(effectId) {
        return bind2(get2)(function(s) {
          var key = effectResultKey(s.currentFunc)(effectId);
          return bind2(effectPayload(key)(bid)(args))(function(payload) {
            return bind2(freshReg)(function(intent) {
              return discard2(emit(new MEffectNew(intent, effectType(bid), payload)))(function() {
                return discard2(emit(new MEffectAwait(intent)))(function() {
                  return bind2(freshReg)(function(reply) {
                    return discard2(emit(new MRecv(reply)))(function() {
                      return bind2(freshReg)(function(replyRec) {
                        return discard2(emit(new MVariantPayload(replyRec, reply)))(function() {
                          return bind2(freshReg)(function(r) {
                            return discard2(emit(new MRecordGet(r, replyRec, "value")))(function() {
                              return pure2(r);
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    };
  };
  var lowerSwitchArm = function(ctors) {
    return function(env) {
      return function(rs) {
        return function(dst) {
          return function(endL) {
            return function(v) {
              if (v.value0 instanceof Just) {
                return bind2(freshReg)(function(rl) {
                  return discard2(emit(new MLoad(rl, v.value0.value0)))(function() {
                    return bind2(freshReg)(function(rc) {
                      return discard2(emit(new MCmp(CmpEq.value, rc, rs, rl)))(function() {
                        return bind2(freshLabel("swnext"))(function(nextL) {
                          return discard2(emit(new MJumpIfFalse(rc, nextL)))(function() {
                            return bind2(lowerExpr(ctors)(env)(v.value1))(function(rb) {
                              return discard2(emit(new MMove(dst, rb)))(function() {
                                return discard2(emit(new MJump(endL)))(function() {
                                  return emit(new MLabel(nextL));
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              }
              ;
              if (v.value0 instanceof Nothing) {
                return bind2(lowerExpr(ctors)(env)(v.value1))(function(rb) {
                  return discard2(emit(new MMove(dst, rb)))(function() {
                    return emit(new MJump(endL));
                  });
                });
              }
              ;
              throw new Error("Failed pattern match at Verdict.Core.Lower (line 372, column 57 - line 387, column 22): " + [v.value0.constructor.name]);
            };
          };
        };
      };
    };
  };
  var lowerMatchArm = function(ctors) {
    return function(env) {
      return function(scrut) {
        return function(tag) {
          return function(dst) {
            return function(endL) {
              return function(v) {
                if (v.value0 instanceof PWild) {
                  return bind2(lowerExpr(ctors)(env)(v.value1))(function(rb) {
                    return discard2(emit(new MMove(dst, rb)))(function() {
                      return emit(new MJump(endL));
                    });
                  });
                }
                ;
                if (v.value0 instanceof PCtor) {
                  return bind2(freshReg)(function(expected) {
                    return bind2(freshReg)(function(ok) {
                      return bind2(freshLabel("matchnext"))(function(nextL) {
                        return discard2(emit(new MLoad(expected, new LStr(v.value0.value0))))(function() {
                          return discard2(emit(new MCmp(CmpEq.value, ok, tag, expected)))(function() {
                            return discard2(emit(new MJumpIfFalse(ok, nextL)))(function() {
                              return bind2(traverse2(function(v1) {
                                return bind2(freshReg)(function(r) {
                                  return discard2(emit(new MRecordGet(r, scrut, "$" + show3(v1.value0))))(function() {
                                    return pure2(new Tuple(v1.value1, r));
                                  });
                                });
                              })(mapWithIndex2(Tuple.create)(v.value0.value1)))(function(payloads) {
                                return bind2(lowerExpr(ctors)(union2(fromFoldable4(payloads))(env))(v.value1))(function(rb) {
                                  return discard2(emit(new MMove(dst, rb)))(function() {
                                    return discard2(emit(new MJump(endL)))(function() {
                                      return emit(new MLabel(nextL));
                                    });
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                }
                ;
                throw new Error("Failed pattern match at Verdict.Core.Lower (line 390, column 63 - line 412, column 24): " + [v.value0.constructor.name]);
              };
            };
          };
        };
      };
    };
  };
  var lowerExpr = function(ctors) {
    return function(env) {
      var lowerCtor = function(name2) {
        return function(args) {
          return bind2(freshReg)(function(r) {
            return bind2(freshReg)(function(tag) {
              return discard2(emit(new MRecordNew(r)))(function() {
                return discard2(emit(new MLoad(tag, new LStr(name2))))(function() {
                  return discard2(emit(new MRecordSet(r, r, "$tag", tag)))(function() {
                    return discard2(traverse_2(function(v) {
                      return emit(new MRecordSet(r, r, "$" + show3(v.value0), v.value1));
                    })(mapWithIndex2(Tuple.create)(args)))(function() {
                      return pure2(r);
                    });
                  });
                });
              });
            });
          });
        };
      };
      return function(v) {
        if (v instanceof EAt) {
          return lowerExpr(ctors)(env)(v.value1);
        }
        ;
        if (v instanceof ELit) {
          return bind2(freshReg)(function(r) {
            return discard2(emit(new MLoad(r, v.value0)))(function() {
              return pure2(r);
            });
          });
        }
        ;
        if (v instanceof EVar) {
          var v1 = lookup3(v.value0)(env);
          if (v1 instanceof Just) {
            return pure2(v1.value0);
          }
          ;
          if (v1 instanceof Nothing) {
            var v2 = lookup3(v.value0)(ctors);
            if (v2 instanceof Just && $$null(v2.value0.fields)) {
              return lowerCtor(v.value0)([]);
            }
            ;
            return bind2(freshReg)(function(r) {
              return discard2(emit(new MCall(r, v.value0, [])))(function() {
                return pure2(r);
              });
            });
          }
          ;
          throw new Error("Failed pattern match at Verdict.Core.Lower (line 68, column 13 - line 76, column 15): " + [v1.constructor.name]);
        }
        ;
        if (v instanceof EBin) {
          return bind2(lowerExpr(ctors)(env)(v.value1))(function(ra) {
            return bind2(lowerExpr(ctors)(env)(v.value2))(function(rb) {
              return bind2(freshReg)(function(r) {
                return discard2(emit(new MBin(v.value0, r, ra, rb)))(function() {
                  return pure2(r);
                });
              });
            });
          });
        }
        ;
        if (v instanceof ECmp) {
          return bind2(lowerExpr(ctors)(env)(v.value1))(function(ra) {
            return bind2(lowerExpr(ctors)(env)(v.value2))(function(rb) {
              return bind2(freshReg)(function(r) {
                return discard2(emit(new MCmp(v.value0, r, ra, rb)))(function() {
                  return pure2(r);
                });
              });
            });
          });
        }
        ;
        if (v instanceof EIf) {
          return bind2(lowerExpr(ctors)(env)(v.value0))(function(rc) {
            return bind2(freshReg)(function(dst) {
              return bind2(freshLabel("else"))(function(elseL) {
                return bind2(freshLabel("end"))(function(endL) {
                  return discard2(emit(new MJumpIfFalse(rc, elseL)))(function() {
                    return bind2(lowerExpr(ctors)(env)(v.value1))(function(rt) {
                      return discard2(emit(new MMove(dst, rt)))(function() {
                        return discard2(emit(new MJump(endL)))(function() {
                          return discard2(emit(new MLabel(elseL)))(function() {
                            return bind2(lowerExpr(ctors)(env)(v.value2))(function(re) {
                              return discard2(emit(new MMove(dst, re)))(function() {
                                return discard2(emit(new MLabel(endL)))(function() {
                                  return pure2(dst);
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        }
        ;
        if (v instanceof ELet) {
          return bind2(lowerExpr(ctors)(env)(v.value1))(function(re) {
            return lowerExpr(ctors)(insert3(v.value0)(re)(env))(v.value2);
          });
        }
        ;
        if (v instanceof ECall && v.value0 === "spawn") {
          var v1 = uncons(v.value1);
          if (v1 instanceof Just) {
            var v2 = stripAt(v1.value0.head);
            if (v2 instanceof EVar) {
              return bind2(traverse2(lowerExpr(ctors)(env))(v1.value0.tail))(function(rs) {
                return bind2(freshReg)(function(r) {
                  return discard2(emit(new MSpawn(r, v2.value0, rs)))(function() {
                    return pure2(r);
                  });
                });
              });
            }
            ;
            return bind2(freshReg)(function(r) {
              return discard2(emit(new MSpawn(r, "__invalid_spawn__", [])))(function() {
                return pure2(r);
              });
            });
          }
          ;
          if (v1 instanceof Nothing) {
            return bind2(freshReg)(function(r) {
              return discard2(emit(new MSpawn(r, "__invalid_spawn__", [])))(function() {
                return pure2(r);
              });
            });
          }
          ;
          throw new Error("Failed pattern match at Verdict.Core.Lower (line 111, column 25 - line 125, column 13): " + [v1.constructor.name]);
        }
        ;
        if (v instanceof ECall && v.value0 === "actorStart") {
          var v1 = uncons(v.value1);
          if (v1 instanceof Just) {
            var v2 = stripAt(v1.value0.head);
            if (v2 instanceof EVar) {
              return bind2(traverse2(lowerExpr(ctors)(env))(v1.value0.tail))(function(rs) {
                return bind2(freshReg)(function(pid) {
                  return discard2(emit(new MSpawn(pid, v2.value0, rs)))(function() {
                    return lowerCtor("MkActorRef")([pid]);
                  });
                });
              });
            }
            ;
            return bind2(freshReg)(function(pid) {
              return discard2(emit(new MSpawn(pid, "__invalid_spawn__", [])))(function() {
                return lowerCtor("MkActorRef")([pid]);
              });
            });
          }
          ;
          if (v1 instanceof Nothing) {
            return bind2(freshReg)(function(pid) {
              return discard2(emit(new MSpawn(pid, "__invalid_spawn__", [])))(function() {
                return lowerCtor("MkActorRef")([pid]);
              });
            });
          }
          ;
          throw new Error("Failed pattern match at Verdict.Core.Lower (line 127, column 30 - line 141, column 37): " + [v1.constructor.name]);
        }
        ;
        if (v instanceof ECall && (v.value0 === "send" && v.value1.length === 2)) {
          return bind2(lowerExpr(ctors)(env)(v["value1"][0]))(function(rp) {
            return bind2(lowerExpr(ctors)(env)(v["value1"][1]))(function(rm) {
              return discard2(emit(new MSend(rp, rm)))(function() {
                return bind2(freshReg)(function(r) {
                  return discard2(emit(new MLoad(r, LUnit.value)))(function() {
                    return pure2(r);
                  });
                });
              });
            });
          });
        }
        ;
        if (v instanceof ECall && (v.value0 === "recv" && v.value1.length === 0)) {
          return bind2(freshReg)(function(r) {
            return discard2(emit(new MRecv(r)))(function() {
              return pure2(r);
            });
          });
        }
        ;
        if (v instanceof ECall && (v.value0 === "yield" && v.value1.length === 0)) {
          return discard2(emit(MYield.value))(function() {
            return bind2(freshReg)(function(r) {
              return discard2(emit(new MLoad(r, LUnit.value)))(function() {
                return pure2(r);
              });
            });
          });
        }
        ;
        if (v instanceof ECall && (v.value0 === "self" && v.value1.length === 0)) {
          return bind2(freshReg)(function(r) {
            return discard2(emit(new MSelf(r)))(function() {
              return pure2(r);
            });
          });
        }
        ;
        if (v instanceof ECall && (v.value0 === "length" && v.value1.length === 1)) {
          return bind2(lowerExpr(ctors)(env)(v["value1"][0]))(function(rxs) {
            return bind2(freshReg)(function(r) {
              return discard2(emit(new MListLength(r, rxs)))(function() {
                return pure2(r);
              });
            });
          });
        }
        ;
        if (v instanceof ECall && (v.value0 === "get" && v.value1.length === 2)) {
          return bind2(lowerExpr(ctors)(env)(v["value1"][0]))(function(rxs) {
            return bind2(lowerExpr(ctors)(env)(v["value1"][1]))(function(rix) {
              return bind2(freshReg)(function(r) {
                return discard2(emit(new MListGet(r, rxs, rix)))(function() {
                  return pure2(r);
                });
              });
            });
          });
        }
        ;
        if (v instanceof ECall && (v.value0 === "append" && v.value1.length === 2)) {
          return bind2(lowerExpr(ctors)(env)(v["value1"][0]))(function(rxs) {
            return bind2(lowerExpr(ctors)(env)(v["value1"][1]))(function(rx) {
              return bind2(freshReg)(function(r) {
                return discard2(emit(new MListAppend(r, rxs, rx)))(function() {
                  return pure2(r);
                });
              });
            });
          });
        }
        ;
        if (v instanceof ECall && (v.value0 === "mod" && v.value1.length === 2)) {
          return bind2(lowerExpr(ctors)(env)(v["value1"][0]))(function(ra) {
            return bind2(lowerExpr(ctors)(env)(v["value1"][1]))(function(rb) {
              return bind2(freshReg)(function(r) {
                return discard2(emit(new MBin(OpMod.value, r, ra, rb)))(function() {
                  return pure2(r);
                });
              });
            });
          });
        }
        ;
        if (v instanceof ECall) {
          return bind2(traverse2(lowerExpr(ctors)(env))(v.value1))(function(rs) {
            var v12 = lookup3(v.value0)(ctors);
            if (v12 instanceof Just) {
              return lowerCtor(v.value0)(rs);
            }
            ;
            if (v12 instanceof Nothing) {
              return bind2(freshReg)(function(r) {
                return discard2(emit(new MCall(r, v.value0, rs)))(function() {
                  return pure2(r);
                });
              });
            }
            ;
            throw new Error("Failed pattern match at Verdict.Core.Lower (line 196, column 5 - line 201, column 15): " + [v12.constructor.name]);
          });
        }
        ;
        if (v instanceof EBuiltin) {
          return bind2(traverse2(lowerExpr(ctors)(env))(v.value1))(function(rs) {
            var $203 = isEffectfulBuiltin(v.value0);
            if ($203) {
              return lowerEffectBuiltin(v.value0)(rs);
            }
            ;
            return bind2(freshReg)(function(r) {
              return discard2(emit(new MBuiltin(r, v.value0, rs)))(function() {
                return pure2(r);
              });
            });
          });
        }
        ;
        if (v instanceof EEffect) {
          return bind2(traverse2(lowerExpr(ctors)(env))(v.value1))(function(rs) {
            return lowerEffectBuiltin(v.value0)(rs);
          });
        }
        ;
        if (v instanceof EList) {
          return bind2(traverse2(lowerExpr(ctors)(env))(v.value0))(function(rs) {
            return bind2(freshReg)(function(r) {
              return discard2(emit(new MListNew(r)))(function() {
                return discard2(traverse_2(function(v12) {
                  return emit(new MListAppend(r, r, v12));
                })(rs))(function() {
                  return pure2(r);
                });
              });
            });
          });
        }
        ;
        if (v instanceof ERecord) {
          return bind2(freshReg)(function(r) {
            return discard2(emit(new MRecordNew(r)))(function() {
              return discard2(traverse_2(function(v12) {
                return bind2(lowerExpr(ctors)(env)(v12.value1))(function(rv) {
                  return emit(new MRecordSet(r, r, v12.value0, rv));
                });
              })(v.value0))(function() {
                return pure2(r);
              });
            });
          });
        }
        ;
        if (v instanceof EField) {
          return bind2(lowerExpr(ctors)(env)(v.value0))(function(re) {
            return bind2(freshReg)(function(r) {
              return discard2(emit(new MRecordGet(r, re, v.value1)))(function() {
                return pure2(r);
              });
            });
          });
        }
        ;
        if (v instanceof ESwitch) {
          return bind2(lowerExpr(ctors)(env)(v.value0))(function(rs) {
            return bind2(freshReg)(function(dst) {
              return bind2(freshLabel("swend"))(function(endL) {
                return discard2(traverse_2(lowerSwitchArm(ctors)(env)(rs)(dst)(endL))(v.value1))(function() {
                  return discard2(emit(new MLabel(endL)))(function() {
                    return pure2(dst);
                  });
                });
              });
            });
          });
        }
        ;
        if (v instanceof EMatch) {
          return bind2(lowerExpr(ctors)(env)(v.value0))(function(rs) {
            return bind2(freshReg)(function(dst) {
              return bind2(freshReg)(function(tag) {
                return bind2(freshLabel("matchend"))(function(endL) {
                  return discard2(emit(new MRecordGet(tag, rs, "$tag")))(function() {
                    return discard2(traverse_2(lowerMatchArm(ctors)(env)(rs)(tag)(dst)(endL))(v.value1))(function() {
                      return discard2(emit(new MLabel(endL)))(function() {
                        return pure2(dst);
                      });
                    });
                  });
                });
              });
            });
          });
        }
        ;
        throw new Error("Failed pattern match at Verdict.Core.Lower (line 60, column 23 - line 256, column 13): " + [v.constructor.name]);
      };
    };
  };
  var lowerDecl = function(ctors) {
    return function(isEntry) {
      return function(v) {
        var scheme = function() {
          if (v.sig instanceof Just) {
            return splitArrow(length(v.params))(v.sig.value0);
          }
          ;
          if (v.sig instanceof Nothing) {
            return {
              params: map6($$const(TUnknown.value))(v.params),
              result: TUnknown.value
            };
          }
          ;
          throw new Error("Failed pattern match at Verdict.Core.Lower (line 421, column 14 - line 423, column 77): " + [v.sig.constructor.name]);
        }();
        var ret = function() {
          if (isEntry) {
            return MHalt.create;
          }
          ;
          return MRet.create;
        }();
        var build = bind2(traverse2($$const(freshReg))(v.params))(function(paramRegs) {
          var env = fromFoldable4(zip(v.params)(paramRegs));
          return bind2(lowerExpr(ctors)(env)(v.body))(function(r) {
            return discard2(emit(ret(r)))(function() {
              return bind2(get2)(function(s) {
                return pure2({
                  name: v.name,
                  params: paramRegs,
                  paramTys: scheme.params,
                  retTy: scheme.result,
                  body: s.instrs,
                  isEntry
                });
              });
            });
          });
        });
        return evalState(build)({
          nextReg: 0,
          nextLabel: 0,
          nextEffect: 0,
          currentFunc: v.name,
          instrs: []
        });
      };
    };
  };
  var lowerModule = function(v) {
    var declNameOf = function(v1) {
      return v1.name;
    };
    var entry = fromMaybe("main")(alt2(map12(declNameOf)(find2(function(v1) {
      return v1.name === "main";
    })(v.value2)))(map12(declNameOf)(head(v.value2))));
    var ctors = ctorMap(v.value1);
    return {
      funcs: map6(function(d) {
        return lowerDecl(ctors)(declNameOf(d) === entry)(d);
      })(v.value2),
      entry
    };
  };

  // .tmp-verdict-build/output/Data.String.Common/foreign.js
  var replaceAll = function(s1) {
    return function(s2) {
      return function(s3) {
        return s3.replace(new RegExp(s1.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "g"), s2);
      };
    };
  };
  var split = function(sep) {
    return function(s) {
      return s.split(sep);
    };
  };
  var toLower = function(s) {
    return s.toLowerCase();
  };
  var toUpper = function(s) {
    return s.toUpperCase();
  };
  var trim = function(s) {
    return s.trim();
  };
  var joinWith = function(s) {
    return function(xs) {
      return xs.join(s);
    };
  };

  // .tmp-verdict-build/output/Data.String.Common/index.js
  var $$null2 = function(s) {
    return s === "";
  };

  // .tmp-verdict-build/output/Verdict.Core.Monomorph/index.js
  var identity5 = /* @__PURE__ */ identity(categoryFn);
  var $$delete2 = /* @__PURE__ */ $$delete(ordString);
  var lookup4 = /* @__PURE__ */ lookup2(ordString);
  var map7 = /* @__PURE__ */ map(functorArray);
  var map13 = /* @__PURE__ */ map(functorMaybe);
  var insert4 = /* @__PURE__ */ insert2(ordString);
  var fromFoldable5 = /* @__PURE__ */ fromFoldable3(ordString)(foldableArray);
  var foldr3 = /* @__PURE__ */ foldr(foldableArray);
  var append1 = /* @__PURE__ */ append(semigroupArray);
  var member3 = /* @__PURE__ */ member2(ordString);
  var toUnfoldable4 = /* @__PURE__ */ toUnfoldable3(unfoldableArray);
  var renameFns = function(subst) {
    var removePattern = function(v) {
      if (v instanceof PWild) {
        return identity5;
      }
      ;
      if (v instanceof PCtor) {
        return function(s) {
          return foldl2(flip($$delete2))(s)(v.value1);
        };
      }
      ;
      throw new Error("Failed pattern match at Verdict.Core.Monomorph (line 267, column 19 - line 269, column 65): " + [v.constructor.name]);
    };
    var go = function(s) {
      return function(v) {
        if (v instanceof EAt) {
          return go(s)(v.value1);
        }
        ;
        if (v instanceof ELit) {
          return new ELit(v.value0);
        }
        ;
        if (v instanceof EVar) {
          return new EVar(fromMaybe(v.value0)(lookup4(v.value0)(s)));
        }
        ;
        if (v instanceof EBin) {
          return new EBin(v.value0, go(s)(v.value1), go(s)(v.value2));
        }
        ;
        if (v instanceof ECmp) {
          return new ECmp(v.value0, go(s)(v.value1), go(s)(v.value2));
        }
        ;
        if (v instanceof EIf) {
          return new EIf(go(s)(v.value0), go(s)(v.value1), go(s)(v.value2));
        }
        ;
        if (v instanceof ELet) {
          return new ELet(v.value0, go(s)(v.value1), go($$delete2(v.value0)(s))(v.value2));
        }
        ;
        if (v instanceof ECall) {
          return new ECall(fromMaybe(v.value0)(lookup4(v.value0)(s)), map7(go(s))(v.value1));
        }
        ;
        if (v instanceof EBuiltin) {
          return new EBuiltin(v.value0, map7(go(s))(v.value1));
        }
        ;
        if (v instanceof EEffect) {
          return new EEffect(v.value0, map7(go(s))(v.value1));
        }
        ;
        if (v instanceof EList) {
          return new EList(map7(go(s))(v.value0));
        }
        ;
        if (v instanceof ERecord) {
          return new ERecord(map7(function(v1) {
            return new Tuple(v1.value0, go(s)(v1.value1));
          })(v.value0));
        }
        ;
        if (v instanceof EField) {
          return new EField(go(s)(v.value0), v.value1);
        }
        ;
        if (v instanceof ESwitch) {
          return new ESwitch(go(s)(v.value0), map7(function(v1) {
            return new Tuple(v1.value0, go(s)(v1.value1));
          })(v.value1));
        }
        ;
        if (v instanceof EMatch) {
          var renameArm = function(v1) {
            return new Tuple(v1.value0, go(removePattern(v1.value0)(s))(v1.value1));
          };
          return new EMatch(go(s)(v.value0), map7(renameArm)(v.value1));
        }
        ;
        throw new Error("Failed pattern match at Verdict.Core.Monomorph (line 248, column 10 - line 265, column 77): " + [v.constructor.name]);
      };
    };
    return go(subst);
  };
  var lookupField = function(name2) {
    return function(fields) {
      return map13(snd)(find2(function(v) {
        return v.value0 === name2;
      })(fields));
    };
  };
  var matchTypes = function(subst) {
    return function(pat) {
      return function(actual) {
        if (pat instanceof TVar) {
          var v = lookup4(pat.value0)(subst);
          if (v instanceof Just) {
            return subst;
          }
          ;
          if (v instanceof Nothing) {
            return insert4(pat.value0)(actual)(subst);
          }
          ;
          throw new Error("Failed pattern match at Verdict.Core.Monomorph (line 287, column 19 - line 289, column 44): " + [v.constructor.name]);
        }
        ;
        if (pat instanceof TArrow && actual instanceof TArrow) {
          return matchTypes(matchTypes(subst)(pat.value0)(actual.value0))(pat.value1)(actual.value1);
        }
        ;
        if (pat instanceof TList && actual instanceof TList) {
          return matchTypes(subst)(pat.value0)(actual.value0);
        }
        ;
        if (pat instanceof TData && (actual instanceof TData && pat.value0 === actual.value0)) {
          return foldl2(function(s) {
            return function(v2) {
              return matchTypes(s)(v2.value0)(v2.value1);
            };
          })(subst)(zip(pat.value1)(actual.value1));
        }
        ;
        if (pat instanceof TRecord && actual instanceof TRecord) {
          return foldl2(function(s) {
            return function(v2) {
              var v1 = lookupField(v2.value0)(actual.value0);
              if (v1 instanceof Just) {
                return matchTypes(s)(v2.value1)(v1.value0);
              }
              ;
              if (v1 instanceof Nothing) {
                return s;
              }
              ;
              throw new Error("Failed pattern match at Verdict.Core.Monomorph (line 295, column 27 - line 297, column 23): " + [v1.constructor.name]);
            };
          })(subst)(pat.value0);
        }
        ;
        return subst;
      };
    };
  };
  var isArrow = function(v) {
    if (v instanceof TArrow) {
      return true;
    }
    ;
    return false;
  };
  var declName2 = function(v) {
    return v.name;
  };
  var entryName = function(decls) {
    var v = find2(function(d) {
      return declName2(d) === "main";
    })(decls);
    if (v instanceof Just) {
      return declName2(v.value0);
    }
    ;
    if (v instanceof Nothing) {
      var v1 = head(decls);
      if (v1 instanceof Just) {
        return declName2(v1.value0);
      }
      ;
      if (v1 instanceof Nothing) {
        return "main";
      }
      ;
      throw new Error("Failed pattern match at Verdict.Core.Monomorph (line 309, column 14 - line 311, column 22): " + [v1.constructor.name]);
    }
    ;
    throw new Error("Failed pattern match at Verdict.Core.Monomorph (line 307, column 19 - line 311, column 22): " + [v.constructor.name]);
  };
  var applySubst = function(subst) {
    return function(v) {
      if (v instanceof TVar) {
        return fromMaybe(new TVar(v.value0))(lookup4(v.value0)(subst));
      }
      ;
      if (v instanceof TData) {
        return new TData(v.value0, map7(applySubst(subst))(v.value1));
      }
      ;
      if (v instanceof TList) {
        return new TList(applySubst(subst)(v.value0));
      }
      ;
      if (v instanceof TRecord) {
        return new TRecord(map7(function(v1) {
          return new Tuple(v1.value0, applySubst(subst)(v1.value1));
        })(v.value0));
      }
      ;
      if (v instanceof TArrow) {
        return new TArrow(applySubst(subst)(v.value0), applySubst(subst)(v.value1));
      }
      ;
      return v;
    };
  };
  var monomorphize = function(mod5) {
    var valueParamEntries = function(info) {
      return mapMaybe(function(v) {
        var $173 = isArrow(v.value1);
        if ($173) {
          return Nothing.value;
        }
        ;
        return new Just({
          name: v.value0,
          ty: v.value1
        });
      })(zip(info.paramNames)(info.paramTypes));
    };
    var valueArg = function(v) {
      var $177 = isArrow(v.value0);
      if ($177) {
        return Nothing.value;
      }
      ;
      return new Just(v.value1);
    };
    var infoOf = function(v) {
      if (v.sig instanceof Just) {
        var sp = splitArrow(length(v.params))(v.sig.value0);
        return new Just({
          name: v.name,
          paramNames: v.params,
          paramTypes: sp.params,
          resultTy: sp.result,
          body: v.body
        });
      }
      ;
      if (v.sig instanceof Nothing) {
        return Nothing.value;
      }
      ;
      throw new Error("Failed pattern match at Verdict.Core.Monomorph (line 233, column 21 - line 243, column 23): " + [v.sig.constructor.name]);
    };
    var infos = fromFoldable5(map7(function(info) {
      return new Tuple(info.name, info);
    })(mapMaybe(infoOf)(moduleDecls(mod5))));
    var isHOF = function(name2) {
      var v = lookup4(name2)(infos);
      if (v instanceof Just) {
        return any2(isArrow)(v.value0.paramTypes);
      }
      ;
      if (v instanceof Nothing) {
        return false;
      }
      ;
      throw new Error("Failed pattern match at Verdict.Core.Monomorph (line 218, column 16 - line 220, column 21): " + [v.constructor.name]);
    };
    var functionArg = function(v) {
      if (isArrow(v.value0)) {
        var v1 = stripAt(v.value1);
        if (v1 instanceof EVar) {
          return new Just({
            name: v1.value0,
            ty: v.value0
          });
        }
        ;
        return Nothing.value;
      }
      ;
      if (otherwise) {
        return Nothing.value;
      }
      ;
      throw new Error("Failed pattern match at Verdict.Core.Monomorph (line 189, column 3 - line 189, column 67): " + [v.constructor.name]);
    };
    var fullArrowType = function(name2) {
      var v = lookup4(name2)(infos);
      if (v instanceof Just && !$$null(v.value0.paramTypes)) {
        return new Just(foldr3(TArrow.create)(v.value0.resultTy)(v.value0.paramTypes));
      }
      ;
      return Nothing.value;
    };
    var baseRequest = function(name2) {
      return {
        srcName: name2,
        fnSubst: empty3,
        tySubst: empty3,
        outName: name2
      };
    };
    var arrowParamNames = function(info) {
      return mapMaybe(function(v) {
        var $193 = isArrow(v.value1);
        if ($193) {
          return new Just(v.value0);
        }
        ;
        return Nothing.value;
      })(zip(info.paramNames)(info.paramTypes));
    };
    var addFnTypeSubst = function(subst) {
      return function(v) {
        var v1 = fullArrowType(v.name);
        if (v1 instanceof Just) {
          return matchTypes(subst)(v.ty)(v1.value0);
        }
        ;
        if (v1 instanceof Nothing) {
          return subst;
        }
        ;
        throw new Error("Failed pattern match at Verdict.Core.Monomorph (line 200, column 39 - line 202, column 21): " + [v1.constructor.name]);
      };
    };
    var specializeCall = function(f) {
      return function(args) {
        var v = lookup4(f)(infos);
        if (v instanceof Nothing) {
          var rargs = map7(rewriteCalls)(args);
          return {
            expr: new ECall(f, map7(function(v1) {
              return v1.expr;
            })(rargs)),
            requests: concatMap(function(v1) {
              return v1.requests;
            })(rargs)
          };
        }
        ;
        if (v instanceof Just) {
          var pairs = zip(v.value0.paramTypes)(args);
          var valueArgs = mapMaybe(valueArg)(pairs);
          var rargs = map7(rewriteCalls)(valueArgs);
          var fnPairs = mapMaybe(functionArg)(pairs);
          var tySubst = foldl2(addFnTypeSubst)(empty3)(fnPairs);
          var fnArgs = map7(function(v1) {
            return v1.name;
          })(fnPairs);
          var fnSubst = fromFoldable5(zip(arrowParamNames(v.value0))(fnArgs));
          var outF = f + ("$" + joinWith("$")(fnArgs));
          var req = {
            srcName: f,
            fnSubst,
            tySubst,
            outName: outF
          };
          return {
            expr: new ECall(outF, map7(function(v1) {
              return v1.expr;
            })(rargs)),
            requests: append1(concatMap(function(v1) {
              return v1.requests;
            })(rargs))([req])
          };
        }
        ;
        throw new Error("Failed pattern match at Verdict.Core.Monomorph (line 164, column 27 - line 187, column 10): " + [v.constructor.name]);
      };
    };
    var rewriteCalls = function(v) {
      if (v instanceof EAt) {
        return rewriteCalls(v.value1);
      }
      ;
      if (v instanceof ELit) {
        return {
          expr: new ELit(v.value0),
          requests: []
        };
      }
      ;
      if (v instanceof EVar) {
        return {
          expr: new EVar(v.value0),
          requests: function() {
            var $208 = member3(v.value0)(infos) && !isHOF(v.value0);
            if ($208) {
              return [baseRequest(v.value0)];
            }
            ;
            return [];
          }()
        };
      }
      ;
      if (v instanceof EBin) {
        var rb = rewriteCalls(v.value2);
        var ra = rewriteCalls(v.value1);
        return {
          expr: new EBin(v.value0, ra.expr, rb.expr),
          requests: append1(ra.requests)(rb.requests)
        };
      }
      ;
      if (v instanceof ECmp) {
        var rb = rewriteCalls(v.value2);
        var ra = rewriteCalls(v.value1);
        return {
          expr: new ECmp(v.value0, ra.expr, rb.expr),
          requests: append1(ra.requests)(rb.requests)
        };
      }
      ;
      if (v instanceof EIf) {
        var rt = rewriteCalls(v.value1);
        var re = rewriteCalls(v.value2);
        var rc = rewriteCalls(v.value0);
        return {
          expr: new EIf(rc.expr, rt.expr, re.expr),
          requests: append1(rc.requests)(append1(rt.requests)(re.requests))
        };
      }
      ;
      if (v instanceof ELet) {
        var re = rewriteCalls(v.value1);
        var rb = rewriteCalls(v.value2);
        return {
          expr: new ELet(v.value0, re.expr, rb.expr),
          requests: append1(re.requests)(rb.requests)
        };
      }
      ;
      if (v instanceof ECall && (v.value0 === "spawn" || v.value0 === "actorStart")) {
        var v1 = uncons(v.value1);
        if (v1 instanceof Just) {
          var v2 = stripAt(v1.value0.head);
          if (v2 instanceof EVar) {
            var req = function() {
              var $224 = member3(v2.value0)(infos);
              if ($224) {
                return [baseRequest(v2.value0)];
              }
              ;
              return [];
            }();
            var rargs = map7(rewriteCalls)(v1.value0.tail);
            return {
              expr: new ECall(v.value0, cons(new EVar(v2.value0))(map7(function(v3) {
                return v3.expr;
              })(rargs))),
              requests: append1(concatMap(function(v3) {
                return v3.requests;
              })(rargs))(req)
            };
          }
          ;
          var rargs = map7(rewriteCalls)(v.value1);
          return {
            expr: new ECall(v.value0, map7(function(v3) {
              return v3.expr;
            })(rargs)),
            requests: concatMap(function(v3) {
              return v3.requests;
            })(rargs)
          };
        }
        ;
        if (v1 instanceof Nothing) {
          return {
            expr: new ECall(v.value0, []),
            requests: []
          };
        }
        ;
        throw new Error("Failed pattern match at Verdict.Core.Monomorph (line 113, column 57 - line 128, column 52): " + [v1.constructor.name]);
      }
      ;
      if (v instanceof ECall) {
        var $231 = isHOF(v.value0);
        if ($231) {
          return specializeCall(v.value0)(v.value1);
        }
        ;
        var req = function() {
          var $232 = member3(v.value0)(infos);
          if ($232) {
            return [baseRequest(v.value0)];
          }
          ;
          return [];
        }();
        var rargs = map7(rewriteCalls)(v.value1);
        var requests = concatMap(function(v12) {
          return v12.requests;
        })(rargs);
        return {
          expr: new ECall(v.value0, map7(function(v12) {
            return v12.expr;
          })(rargs)),
          requests: append1(requests)(req)
        };
      }
      ;
      if (v instanceof EBuiltin) {
        var rargs = map7(rewriteCalls)(v.value1);
        return {
          expr: new EBuiltin(v.value0, map7(function(v12) {
            return v12.expr;
          })(rargs)),
          requests: concatMap(function(v12) {
            return v12.requests;
          })(rargs)
        };
      }
      ;
      if (v instanceof EEffect) {
        var rargs = map7(rewriteCalls)(v.value1);
        return {
          expr: new EEffect(v.value0, map7(function(v12) {
            return v12.expr;
          })(rargs)),
          requests: concatMap(function(v12) {
            return v12.requests;
          })(rargs)
        };
      }
      ;
      if (v instanceof EList) {
        var rxs = map7(rewriteCalls)(v.value0);
        return {
          expr: new EList(map7(function(v12) {
            return v12.expr;
          })(rxs)),
          requests: concatMap(function(v12) {
            return v12.requests;
          })(rxs)
        };
      }
      ;
      if (v instanceof ERecord) {
        var rfields = map7(function(v12) {
          var r2 = rewriteCalls(v12.value1);
          return {
            field: new Tuple(v12.value0, r2.expr),
            requests: r2.requests
          };
        })(v.value0);
        return {
          expr: new ERecord(map7(function(v12) {
            return v12.field;
          })(rfields)),
          requests: concatMap(function(v12) {
            return v12.requests;
          })(rfields)
        };
      }
      ;
      if (v instanceof EField) {
        var r = rewriteCalls(v.value0);
        return {
          expr: new EField(r.expr, v.value1),
          requests: r.requests
        };
      }
      ;
      if (v instanceof ESwitch) {
        var rs = rewriteCalls(v.value0);
        var rarms = map7(function(v12) {
          var r2 = rewriteCalls(v12.value1);
          return {
            arm: new Tuple(v12.value0, r2.expr),
            requests: r2.requests
          };
        })(v.value1);
        return {
          expr: new ESwitch(rs.expr, map7(function(v12) {
            return v12.arm;
          })(rarms)),
          requests: append1(rs.requests)(concatMap(function(v12) {
            return v12.requests;
          })(rarms))
        };
      }
      ;
      if (v instanceof EMatch) {
        var rs = rewriteCalls(v.value0);
        var rarms = map7(function(v12) {
          var r2 = rewriteCalls(v12.value1);
          return {
            arm: new Tuple(v12.value0, r2.expr),
            requests: r2.requests
          };
        })(v.value1);
        return {
          expr: new EMatch(rs.expr, map7(function(v12) {
            return v12.arm;
          })(rarms)),
          requests: append1(rs.requests)(concatMap(function(v12) {
            return v12.requests;
          })(rarms))
        };
      }
      ;
      throw new Error("Failed pattern match at Verdict.Core.Monomorph (line 87, column 18 - line 161, column 111): " + [v.constructor.name]);
    };
    var processAll = function($copy_st) {
      var $tco_done = false;
      var $tco_result;
      function $tco_loop(st) {
        if (st.steps > 1e4) {
          $tco_done = true;
          return st;
        }
        ;
        if (otherwise) {
          var v = uncons(st.queue);
          if (v instanceof Nothing) {
            $tco_done = true;
            return st;
          }
          ;
          if (v instanceof Just) {
            var $258 = member3(v.value0.head.outName)(st.generated);
            if ($258) {
              $copy_st = {
                generated: st.generated,
                queue: v.value0.tail,
                steps: st.steps + 1 | 0
              };
              return;
            }
            ;
            var v1 = lookup4(v.value0.head.srcName)(infos);
            if (v1 instanceof Nothing) {
              $copy_st = {
                generated: st.generated,
                queue: v.value0.tail,
                steps: st.steps + 1 | 0
              };
              return;
            }
            ;
            if (v1 instanceof Just) {
              var valueParams = valueParamEntries(v1.value0);
              var sig = foldr3(TArrow.create)(applySubst(v.value0.head.tySubst)(v1.value0.resultTy))(map7(function() {
                var $264 = applySubst(v.value0.head.tySubst);
                return function($265) {
                  return $264(function(v2) {
                    return v2.ty;
                  }($265));
                };
              }())(valueParams));
              var body0 = renameFns(v.value0.head.fnSubst)(v1.value0.body);
              var rewritten = rewriteCalls(body0);
              var decl = {
                name: v.value0.head.outName,
                params: map7(function(v2) {
                  return v2.name;
                })(valueParams),
                sig: new Just(sig),
                body: rewritten.expr
              };
              var generated = insert4(v.value0.head.outName)(decl)(st.generated);
              $copy_st = {
                generated,
                queue: append1(v.value0.tail)(rewritten.requests),
                steps: st.steps + 1 | 0
              };
              return;
            }
            ;
            throw new Error("Failed pattern match at Verdict.Core.Monomorph (line 62, column 16 - line 84, column 20): " + [v1.constructor.name]);
          }
          ;
          throw new Error("Failed pattern match at Verdict.Core.Monomorph (line 57, column 19 - line 84, column 20): " + [v.constructor.name]);
        }
        ;
        throw new Error("Failed pattern match at Verdict.Core.Monomorph (line 54, column 3 - line 54, column 39): " + [st.constructor.name]);
      }
      ;
      while (!$tco_done) {
        $tco_result = $tco_loop($copy_st);
      }
      ;
      return $tco_result;
    };
    var decls = moduleDecls(mod5);
    var entry = entryName(decls);
    var initial = {
      srcName: entry,
      fnSubst: empty3,
      tySubst: empty3,
      outName: entry
    };
    var done = processAll({
      generated: empty3,
      queue: [initial],
      steps: 0
    });
    return new Module(moduleName(mod5), moduleTypes(mod5), map7(snd)(toUnfoldable4(done.generated)));
  };

  // .tmp-verdict-build/output/Data.List/index.js
  var map8 = /* @__PURE__ */ map(functorMaybe);
  var bimap2 = /* @__PURE__ */ bimap(bifunctorStep);
  var uncons3 = function(v) {
    if (v instanceof Nil) {
      return Nothing.value;
    }
    ;
    if (v instanceof Cons) {
      return new Just({
        head: v.value0,
        tail: v.value1
      });
    }
    ;
    throw new Error("Failed pattern match at Data.List (line 259, column 1 - line 259, column 66): " + [v.constructor.name]);
  };
  var toUnfoldable5 = function(dictUnfoldable) {
    return unfoldr(dictUnfoldable)(function(xs) {
      return map8(function(rec) {
        return new Tuple(rec.head, rec.tail);
      })(uncons3(xs));
    });
  };
  var reverse2 = /* @__PURE__ */ function() {
    var go = function($copy_v) {
      return function($copy_v1) {
        var $tco_var_v = $copy_v;
        var $tco_done = false;
        var $tco_result;
        function $tco_loop(v, v1) {
          if (v1 instanceof Nil) {
            $tco_done = true;
            return v;
          }
          ;
          if (v1 instanceof Cons) {
            $tco_var_v = new Cons(v1.value0, v);
            $copy_v1 = v1.value1;
            return;
          }
          ;
          throw new Error("Failed pattern match at Data.List (line 368, column 3 - line 368, column 19): " + [v.constructor.name, v1.constructor.name]);
        }
        ;
        while (!$tco_done) {
          $tco_result = $tco_loop($tco_var_v, $copy_v1);
        }
        ;
        return $tco_result;
      };
    };
    return go(Nil.value);
  }();
  var manyRec = function(dictMonadRec) {
    var bind13 = bind(dictMonadRec.Monad0().Bind1());
    var tailRecM6 = tailRecM(dictMonadRec);
    return function(dictAlternative) {
      var Alt0 = dictAlternative.Plus1().Alt0();
      var alt8 = alt(Alt0);
      var map115 = map(Alt0.Functor0());
      var pure10 = pure(dictAlternative.Applicative0());
      return function(p) {
        var go = function(acc) {
          return bind13(alt8(map115(Loop.create)(p))(pure10(new Done(unit))))(function(aa) {
            return pure10(bimap2(function(v) {
              return new Cons(v, acc);
            })(function(v) {
              return reverse2(acc);
            })(aa));
          });
        };
        return tailRecM6(go)(Nil.value);
      };
    };
  };
  var some2 = function(dictAlternative) {
    var apply4 = apply(dictAlternative.Applicative0().Apply0());
    var map115 = map(dictAlternative.Plus1().Alt0().Functor0());
    return function(dictLazy) {
      var defer5 = defer(dictLazy);
      return function(v) {
        return apply4(map115(Cons.create)(v))(defer5(function(v1) {
          return many2(dictAlternative)(dictLazy)(v);
        }));
      };
    };
  };
  var many2 = function(dictAlternative) {
    var alt8 = alt(dictAlternative.Plus1().Alt0());
    var pure10 = pure(dictAlternative.Applicative0());
    return function(dictLazy) {
      return function(v) {
        return alt8(some2(dictAlternative)(dictLazy)(v))(pure10(Nil.value));
      };
    };
  };

  // .tmp-verdict-build/output/Data.Set/index.js
  var coerce3 = /* @__PURE__ */ coerce();
  var foldMap2 = /* @__PURE__ */ foldMap(foldableList);
  var foldl4 = /* @__PURE__ */ foldl(foldableList);
  var foldr4 = /* @__PURE__ */ foldr(foldableList);
  var union3 = function(dictOrd) {
    return coerce3(union(dictOrd));
  };
  var toList = function(v) {
    return keys2(v);
  };
  var toUnfoldable6 = function(dictUnfoldable) {
    var $96 = toUnfoldable5(dictUnfoldable);
    return function($97) {
      return $96(toList($97));
    };
  };
  var singleton7 = function(a) {
    return singleton5(a)(unit);
  };
  var semigroupSet = function(dictOrd) {
    return {
      append: union3(dictOrd)
    };
  };
  var member4 = function(dictOrd) {
    return coerce3(member2(dictOrd));
  };
  var insert5 = function(dictOrd) {
    var insert15 = insert2(dictOrd);
    return function(a) {
      return function(v) {
        return insert15(a)(unit)(v);
      };
    };
  };
  var foldableSet = {
    foldMap: function(dictMonoid) {
      var foldMap12 = foldMap2(dictMonoid);
      return function(f) {
        var $98 = foldMap12(f);
        return function($99) {
          return $98(toList($99));
        };
      };
    },
    foldl: function(f) {
      return function(x) {
        var $100 = foldl4(f)(x);
        return function($101) {
          return $100(toList($101));
        };
      };
    },
    foldr: function(f) {
      return function(x) {
        var $102 = foldr4(f)(x);
        return function($103) {
          return $102(toList($103));
        };
      };
    }
  };
  var eqSet = function(dictEq) {
    var eq5 = eq(eqMap(dictEq)(eqUnit));
    return {
      eq: function(v) {
        return function(v1) {
          return eq5(v)(v1);
        };
      }
    };
  };
  var empty4 = empty3;
  var fromFoldable6 = function(dictFoldable) {
    var foldl22 = foldl(dictFoldable);
    return function(dictOrd) {
      var insert15 = insert5(dictOrd);
      return foldl22(function(m) {
        return function(a) {
          return insert15(a)(m);
        };
      })(empty4);
    };
  };
  var $$delete3 = function(dictOrd) {
    return coerce3($$delete(dictOrd));
  };

  // .tmp-verdict-build/output/Verdict.Eval.BigInt/foreign.js
  var addStr = (a) => (b) => (BigInt(a) + BigInt(b)).toString();
  var subStr = (a) => (b) => (BigInt(a) - BigInt(b)).toString();
  var mulStr = (a) => (b) => (BigInt(a) * BigInt(b)).toString();
  var cmpStr = (a) => (b) => {
    const x = BigInt(a), y = BigInt(b);
    return x < y ? -1 : x > y ? 1 : 0;
  };
  var normalizeStr = (a) => BigInt(a).toString();
  var divFloorStr = (a) => (b) => {
    const x = BigInt(a), y = BigInt(b);
    let q = x / y;
    const r = x % y;
    if (r !== 0n && r < 0n !== y < 0n) q -= 1n;
    return q.toString();
  };
  var modStr = (a) => (b) => {
    const x = BigInt(a), y = BigInt(b);
    let q = x / y;
    const r = x % y;
    if (r !== 0n && r < 0n !== y < 0n) q -= 1n;
    return (x - q * y).toString();
  };
  var gcdStr = (a) => (b) => {
    let x = BigInt(a);
    let y = BigInt(b);
    if (x < 0n) x = -x;
    if (y < 0n) y = -y;
    while (y !== 0n) {
      const r = x % y;
      x = y;
      y = r;
    }
    return x.toString();
  };
  var powStr = (a) => (b) => {
    const exp2 = BigInt(b);
    if (exp2 < 0n) throw new Error("pow exponent must be non-negative");
    return (BigInt(a) ** exp2).toString();
  };
  var sqrtFloorStr = (a) => {
    const n = BigInt(a);
    if (n < 0n) throw new Error("sqrtFloor input must be non-negative");
    if (n < 2n) return n.toString();
    let lo = 1n;
    let hi = n;
    let ans = 1n;
    while (lo <= hi) {
      const mid = lo + hi >> 1n;
      const sq = mid * mid;
      if (sq <= n) {
        ans = mid;
        lo = mid + 1n;
      } else {
        hi = mid - 1n;
      }
    }
    return ans.toString();
  };
  var modPowStr = (b) => (e) => (m) => {
    let mod5 = BigInt(m);
    if (mod5 === 1n) return "0";
    let base = (BigInt(b) % mod5 + mod5) % mod5;
    let exp2 = BigInt(e);
    let result = 1n;
    while (exp2 > 0n) {
      if (exp2 & 1n) result = result * base % mod5;
      exp2 >>= 1n;
      base = base * base % mod5;
    }
    return result.toString();
  };
  var modInvStr = (a) => (m) => {
    const mod5 = BigInt(m);
    if (mod5 === 0n) return "0";
    let t = 0n, newT = 1n;
    let r = mod5 < 0n ? -mod5 : mod5;
    let newR = (BigInt(a) % r + r) % r;
    while (newR !== 0n) {
      const q = r / newR;
      [t, newT] = [newT, t - q * newT];
      [r, newR] = [newR, r - q * newR];
    }
    if (r > 1n) return "0";
    if (t < 0n) t += mod5 < 0n ? -mod5 : mod5;
    return t.toString();
  };

  // .tmp-verdict-build/output/Verdict.Eval.BigInt/index.js
  var scale10 = function(v) {
    return function(k) {
      var pad = function(n) {
        var $3 = n <= 0;
        if ($3) {
          return "";
        }
        ;
        return "0" + pad(n - 1 | 0);
      };
      var $4 = k <= 0;
      if ($4) {
        return v;
      }
      ;
      return mulStr(v)("1" + pad(k));
    };
  };

  // .tmp-verdict-build/output/Verdict.Eval.Rational/index.js
  var negateStr = /* @__PURE__ */ subStr("0");
  var reduce = function(n0) {
    return function(d0) {
      var n = normalizeStr(n0);
      var d = normalizeStr(d0);
      var $3 = cmpStr(n)("0") === 0;
      if ($3) {
        return {
          num: "0",
          den: "1"
        };
      }
      ;
      var signed = function() {
        var $4 = cmpStr(d)("0") < 0;
        if ($4) {
          return {
            num: negateStr(n),
            den: negateStr(d)
          };
        }
        ;
        return {
          num: n,
          den: d
        };
      }();
      var g = gcdStr(signed.num)(signed.den);
      var $5 = cmpStr(g)("0") === 0;
      if ($5) {
        return signed;
      }
      ;
      return {
        num: divFloorStr(signed.num)(g),
        den: divFloorStr(signed.den)(g)
      };
    };
  };
  var render = function(r) {
    var rr = reduce(r.num)(r.den);
    return rr.num + ("/" + rr.den);
  };
  var sub2 = function(a) {
    return function(b) {
      return reduce(subStr(mulStr(a.num)(b.den))(mulStr(b.num)(a.den)))(mulStr(a.den)(b.den));
    };
  };
  var mul2 = function(a) {
    return function(b) {
      return reduce(mulStr(a.num)(b.num))(mulStr(a.den)(b.den));
    };
  };
  var divR = function(a) {
    return function(b) {
      return reduce(mulStr(a.num)(b.den))(mulStr(a.den)(b.num));
    };
  };
  var cmp = function(a) {
    return function(b) {
      var br = reduce(b.num)(b.den);
      var ar = reduce(a.num)(a.den);
      return cmpStr(mulStr(ar.num)(br.den))(mulStr(br.num)(ar.den));
    };
  };
  var add2 = function(a) {
    return function(b) {
      return reduce(addStr(mulStr(a.num)(b.den))(mulStr(b.num)(a.den)))(mulStr(a.den)(b.den));
    };
  };

  // .tmp-verdict-build/output/Verdict.Core.Opt/index.js
  var fromFoldable7 = /* @__PURE__ */ fromFoldable6(foldableArray);
  var show4 = /* @__PURE__ */ show(showBinOp);
  var show12 = /* @__PURE__ */ show(showInt);
  var show22 = /* @__PURE__ */ show(showCmpOp);
  var lookup5 = /* @__PURE__ */ lookup2(ordInt);
  var max2 = /* @__PURE__ */ max(ordInt);
  var insert6 = /* @__PURE__ */ insert2(ordString);
  var lookup1 = /* @__PURE__ */ lookup2(ordString);
  var eq13 = /* @__PURE__ */ eq(/* @__PURE__ */ eqMaybe(eqInt));
  var map9 = /* @__PURE__ */ map(functorArray);
  var append12 = /* @__PURE__ */ append(semigroupArray);
  var insert1 = /* @__PURE__ */ insert2(ordInt);
  var $$delete4 = /* @__PURE__ */ $$delete(ordInt);
  var member5 = /* @__PURE__ */ member4(ordString);
  var member1 = /* @__PURE__ */ member4(ordInt);
  var fromFoldable1 = /* @__PURE__ */ fromFoldable7(ordInt);
  var fromFoldable22 = /* @__PURE__ */ fromFoldable3(ordString)(foldableArray);
  var insert22 = /* @__PURE__ */ insert5(ordString);
  var trailingRet = function(body) {
    var v = unsnoc(body);
    if (v instanceof Just && v.value0.last instanceof MRet) {
      return new Just({
        init: v.value0.init,
        ret: v.value0.last.value0
      });
    }
    ;
    return Nothing.value;
  };
  var targetLabels = /* @__PURE__ */ function() {
    var $307 = fromFoldable7(ordString);
    var $308 = concatMap(function(v) {
      if (v instanceof MJump) {
        return [v.value0];
      }
      ;
      if (v instanceof MJumpIfFalse) {
        return [v.value1];
      }
      ;
      return [];
    });
    return function($309) {
      return $307($308($309));
    };
  }();
  var stableKey = function(v) {
    if (v instanceof MBin) {
      return new Just("bin:" + (show4(v.value0) + (":" + (show12(v.value2) + (":" + show12(v.value3))))));
    }
    ;
    if (v instanceof MCmp) {
      return new Just("cmp:" + (show22(v.value0) + (":" + (show12(v.value2) + (":" + show12(v.value3))))));
    }
    ;
    if (v instanceof MRecordGet) {
      return new Just("recordGet:" + (show12(v.value1) + (":" + v.value2)));
    }
    ;
    if (v instanceof MListGet) {
      return new Just("listGet:" + (show12(v.value1) + (":" + show12(v.value2))));
    }
    ;
    return Nothing.value;
  };
  var removeJumpsToNextLabel = function(instrs) {
    var v = uncons(instrs);
    if (v instanceof Nothing) {
      return [];
    }
    ;
    if (v instanceof Just) {
      var v1 = uncons(v.value0.tail);
      if (v.value0.head instanceof MJump && (v1 instanceof Just && (v1.value0.head instanceof MLabel && v.value0.head.value0 === v1.value0.head.value0))) {
        return removeJumpsToNextLabel(v.value0.tail);
      }
      ;
      return cons(v.value0.head)(removeJumpsToNextLabel(v.value0.tail));
    }
    ;
    throw new Error("Failed pattern match at Verdict.Core.Opt (line 387, column 33 - line 392, column 58): " + [v.constructor.name]);
  };
  var ratOf = function(known) {
    return function(r) {
      var v = lookup5(r)(known);
      if (v instanceof Just && v.value0 instanceof LRational) {
        return new Just(reduce(v.value0.value0)(v.value0.value1));
      }
      ;
      return Nothing.value;
    };
  };
  var maxVRegInBody = function(body) {
    return foldl2(max2)(-1 | 0)(concatMap(regsOf)(body));
  };
  var labelIndexMap = function(instrs) {
    var build = function($copy_i) {
      return function($copy_m) {
        var $tco_var_i = $copy_i;
        var $tco_done = false;
        var $tco_result;
        function $tco_loop(i, m) {
          var v = index(instrs)(i);
          if (v instanceof Nothing) {
            $tco_done = true;
            return m;
          }
          ;
          if (v instanceof Just && v.value0 instanceof MLabel) {
            $tco_var_i = i + 1 | 0;
            $copy_m = insert6(v.value0.value0)(i)(m);
            return;
          }
          ;
          if (v instanceof Just) {
            $tco_var_i = i + 1 | 0;
            $copy_m = m;
            return;
          }
          ;
          throw new Error("Failed pattern match at Verdict.Core.Opt (line 81, column 15 - line 84, column 30): " + [v.constructor.name]);
        }
        ;
        while (!$tco_done) {
          $tco_result = $tco_loop($tco_var_i, $copy_m);
        }
        ;
        return $tco_result;
      };
    };
    return build(0)(empty3);
  };
  var tailCalls = function(instrs) {
    var labelIx = labelIndexMap(instrs);
    var returnsAt = function($copy_fuel) {
      return function($copy_k) {
        var $tco_var_fuel = $copy_fuel;
        var $tco_done = false;
        var $tco_result;
        function $tco_loop(fuel2, k) {
          if (fuel2 <= 0) {
            $tco_done = true;
            return Nothing.value;
          }
          ;
          if (otherwise) {
            var v = index(instrs)(k);
            if (v instanceof Just && v.value0 instanceof MRet) {
              $tco_done = true;
              return new Just(v.value0.value0);
            }
            ;
            if (v instanceof Just && v.value0 instanceof MLabel) {
              $tco_var_fuel = fuel2 - 1 | 0;
              $copy_k = k + 1 | 0;
              return;
            }
            ;
            if (v instanceof Just && v.value0 instanceof MJump) {
              var v1 = lookup1(v.value0.value0)(labelIx);
              if (v1 instanceof Just) {
                $tco_var_fuel = fuel2 - 1 | 0;
                $copy_k = v1.value0;
                return;
              }
              ;
              if (v1 instanceof Nothing) {
                $tco_done = true;
                return Nothing.value;
              }
              ;
              throw new Error("Failed pattern match at Verdict.Core.Opt (line 55, column 27 - line 57, column 29): " + [v1.constructor.name]);
            }
            ;
            $tco_done = true;
            return Nothing.value;
          }
          ;
          throw new Error("Failed pattern match at Verdict.Core.Opt (line 49, column 3 - line 49, column 40): " + [fuel2.constructor.name, k.constructor.name]);
        }
        ;
        while (!$tco_done) {
          $tco_result = $tco_loop($tco_var_fuel, $copy_k);
        }
        ;
        return $tco_result;
      };
    };
    var returns = function(k) {
      return returnsAt(length(instrs))(k);
    };
    var go = function(i) {
      var v = index(instrs)(i);
      if (v instanceof Nothing) {
        return [];
      }
      ;
      if (v instanceof Just) {
        if (v.value0 instanceof MCall && eq13(returns(i + 1 | 0))(new Just(v.value0.value0))) {
          return cons(new MTailCall(v.value0.value1, v.value0.value2))(go(i + 1 | 0));
        }
        ;
        if (v.value0 instanceof MCall) {
          var v1 = index(instrs)(i + 1 | 0);
          var v2 = function(v3) {
            return cons(v.value0)(go(i + 1 | 0));
          };
          if (v1 instanceof Just && v1.value0 instanceof MMove) {
            var $152 = v1.value0.value1 === v.value0.value0;
            if ($152) {
              var $153 = eq13(returns(i + 2 | 0))(new Just(v1.value0.value0));
              if ($153) {
                return cons(new MTailCall(v.value0.value1, v.value0.value2))(go(i + 1 | 0));
              }
              ;
              return v2(true);
            }
            ;
            return v2(true);
          }
          ;
          return v2(true);
        }
        ;
        return cons(v.value0)(go(i + 1 | 0));
      }
      ;
      throw new Error("Failed pattern match at Verdict.Core.Opt (line 63, column 10 - line 75, column 41): " + [v.constructor.name]);
    };
    return go(0);
  };
  var intOf = function(known) {
    return function(r) {
      var v = lookup5(r)(known);
      if (v instanceof Just && v.value0 instanceof LInt) {
        return new Just(v.value0.value0);
      }
      ;
      return Nothing.value;
    };
  };
  var hasTrailingRet = function(body) {
    var v = trailingRet(body);
    if (v instanceof Just) {
      return true;
    }
    ;
    if (v instanceof Nothing) {
      return false;
    }
    ;
    throw new Error("Failed pattern match at Verdict.Core.Opt (line 123, column 23 - line 125, column 19): " + [v.constructor.name]);
  };
  var freshenLabels = function(suffix) {
    var rename = function(lbl) {
      return lbl + suffix;
    };
    return function(v) {
      if (v instanceof MLabel) {
        return new MLabel(rename(v.value0));
      }
      ;
      if (v instanceof MJump) {
        return new MJump(rename(v.value0));
      }
      ;
      if (v instanceof MJumpIfFalse) {
        return new MJumpIfFalse(v.value0, rename(v.value1));
      }
      ;
      return v;
    };
  };
  var inlineFunc = function(table) {
    return function(f) {
      var keep = function(st) {
        return function(instr) {
          return {
            callIx: st.callIx,
            nextReg: st.nextReg,
            instrs: snoc(st.instrs)(instr)
          };
        };
      };
      var step3 = function(st) {
        return function(instr) {
          if (instr instanceof MCall && $$null(instr.value2)) {
            var v = lookup1(instr.value1)(table);
            if (v instanceof Just) {
              var v1 = trailingRet(v.value0.body);
              if (v1 instanceof Just) {
                var width = max2(0)(maxVRegInBody(v.value0.body) + 1 | 0);
                var suffix = "__inl" + show12(st.callIx);
                var body$prime = map9(function() {
                  var $310 = freshenLabels(suffix);
                  var $311 = mapVRegs(function(r) {
                    return r + st.nextReg | 0;
                  });
                  return function($312) {
                    return $310($311($312));
                  };
                }())(v1.value0.init);
                var ret$prime = v1.value0.ret + st.nextReg | 0;
                return {
                  nextReg: st.nextReg + width | 0,
                  callIx: st.callIx + 1 | 0,
                  instrs: append12(st.instrs)(append12(body$prime)([new MMove(instr.value0, ret$prime)]))
                };
              }
              ;
              if (v1 instanceof Nothing) {
                return keep(st)(instr);
              }
              ;
              throw new Error("Failed pattern match at Verdict.Core.Opt (line 150, column 24 - line 164, column 35): " + [v1.constructor.name]);
            }
            ;
            if (v instanceof Nothing) {
              return keep(st)(instr);
            }
            ;
            throw new Error("Failed pattern match at Verdict.Core.Opt (line 149, column 7 - line 165, column 33): " + [v.constructor.name]);
          }
          ;
          return keep(st)(instr);
        };
      };
      var $$final = foldl2(step3)({
        nextReg: maxVRegInBody(f.body) + 1 | 0,
        callIx: 0,
        instrs: []
      })(f.body);
      return {
        name: f.name,
        params: f.params,
        paramTys: f.paramTys,
        retTy: f.retTy,
        isEntry: f.isEntry,
        body: $$final.instrs
      };
    };
  };
  var fixedOf = function(known) {
    return function(r) {
      var v = lookup5(r)(known);
      if (v instanceof Just && v.value0 instanceof LFixed) {
        return new Just({
          value: v.value0.value0,
          scale: v.value0.value1
        });
      }
      ;
      return Nothing.value;
    };
  };
  var foldBin = function(known) {
    return function(op) {
      return function(d) {
        return function(a) {
          return function(b) {
            var v = intOf(known)(b);
            var v1 = intOf(known)(a);
            if (v1 instanceof Just && v instanceof Just) {
              if (op instanceof OpAdd) {
                return new MLoad(d, new LInt(normalizeStr(addStr(v1.value0)(v.value0))));
              }
              ;
              if (op instanceof OpSub) {
                return new MLoad(d, new LInt(normalizeStr(subStr(v1.value0)(v.value0))));
              }
              ;
              if (op instanceof OpMul) {
                return new MLoad(d, new LInt(normalizeStr(mulStr(v1.value0)(v.value0))));
              }
              ;
              if (op instanceof OpDiv) {
                return new MBin(op, d, a, b);
              }
              ;
              if (op instanceof OpMod) {
                return new MLoad(d, new LInt(normalizeStr(modStr(v1.value0)(v.value0))));
              }
              ;
              throw new Error("Failed pattern match at Verdict.Core.Opt (line 266, column 23 - line 271, column 58): " + [op.constructor.name]);
            }
            ;
            if (v1 instanceof Just && v instanceof Nothing) {
              var v2 = normalizeStr(v1.value0);
              if (op instanceof OpAdd && v2 === "0") {
                return new MMove(d, b);
              }
              ;
              if (op instanceof OpMul && v2 === "1") {
                return new MMove(d, b);
              }
              ;
              if (op instanceof OpMul && v2 === "0") {
                return new MLoad(d, new LInt("0"));
              }
              ;
              return new MBin(op, d, a, b);
            }
            ;
            if (v1 instanceof Nothing && v instanceof Just) {
              var v2 = normalizeStr(v.value0);
              if (op instanceof OpAdd && v2 === "0") {
                return new MMove(d, a);
              }
              ;
              if (op instanceof OpSub && v2 === "0") {
                return new MMove(d, a);
              }
              ;
              if (op instanceof OpMul && v2 === "1") {
                return new MMove(d, a);
              }
              ;
              if (op instanceof OpMul && v2 === "0") {
                return new MLoad(d, new LInt("0"));
              }
              ;
              if (op instanceof OpDiv && v2 === "1") {
                return new MMove(d, a);
              }
              ;
              return new MBin(op, d, a, b);
            }
            ;
            var v2 = fixedOf(known)(b);
            var v3 = fixedOf(known)(a);
            if (v3 instanceof Just && v2 instanceof Just) {
              var s = max2(v3.value0.scale)(v2.value0.scale);
              var xa = scale10(v3.value0.value)(s - v3.value0.scale | 0);
              var ya = scale10(v2.value0.value)(s - v2.value0.scale | 0);
              if (op instanceof OpAdd) {
                return new MLoad(d, new LFixed(addStr(xa)(ya), s));
              }
              ;
              if (op instanceof OpSub) {
                return new MLoad(d, new LFixed(subStr(xa)(ya), s));
              }
              ;
              if (op instanceof OpMul) {
                return new MLoad(d, new LFixed(mulStr(v3.value0.value)(v2.value0.value), v3.value0.scale + v2.value0.scale | 0));
              }
              ;
              if (op instanceof OpDiv) {
                return new MBin(op, d, a, b);
              }
              ;
              if (op instanceof OpMod) {
                return new MBin(op, d, a, b);
              }
              ;
              throw new Error("Failed pattern match at Verdict.Core.Opt (line 292, column 11 - line 297, column 35): " + [op.constructor.name]);
            }
            ;
            var v4 = ratOf(known)(b);
            var v5 = ratOf(known)(a);
            if (v5 instanceof Just && v4 instanceof Just) {
              var r = function() {
                if (op instanceof OpAdd) {
                  return add2(v5.value0)(v4.value0);
                }
                ;
                if (op instanceof OpSub) {
                  return sub2(v5.value0)(v4.value0);
                }
                ;
                if (op instanceof OpMul) {
                  return mul2(v5.value0)(v4.value0);
                }
                ;
                if (op instanceof OpDiv) {
                  return divR(v5.value0)(v4.value0);
                }
                ;
                if (op instanceof OpMod) {
                  return v5.value0;
                }
                ;
                throw new Error("Failed pattern match at Verdict.Core.Opt (line 301, column 17 - line 306, column 25): " + [op.constructor.name]);
              }();
              if (op instanceof OpMod) {
                return new MBin(op, d, a, b);
              }
              ;
              return new MLoad(d, new LRational(r.num, r.den));
            }
            ;
            return new MBin(op, d, a, b);
          };
        };
      };
    };
  };
  var foldCmp = function(known) {
    return function(op) {
      return function(d) {
        return function(a) {
          return function(b) {
            var v = intOf(known)(b);
            var v1 = intOf(known)(a);
            if (v1 instanceof Just && v instanceof Just) {
              var c = cmpStr(v1.value0)(v.value0);
              return new MLoad(d, new LBool(function() {
                if (op instanceof CmpEq) {
                  return c === 0;
                }
                ;
                if (op instanceof CmpLt) {
                  return c < 0;
                }
                ;
                if (op instanceof CmpGt) {
                  return c > 0;
                }
                ;
                throw new Error("Failed pattern match at Verdict.Core.Opt (line 319, column 17 - line 322, column 27): " + [op.constructor.name]);
              }()));
            }
            ;
            var v2 = fixedOf(known)(b);
            var v3 = fixedOf(known)(a);
            if (v3 instanceof Just && v2 instanceof Just) {
              var s = max2(v3.value0.scale)(v2.value0.scale);
              var c = cmpStr(scale10(v3.value0.value)(s - v3.value0.scale | 0))(scale10(v2.value0.value)(s - v2.value0.scale | 0));
              return new MLoad(d, new LBool(function() {
                if (op instanceof CmpEq) {
                  return c === 0;
                }
                ;
                if (op instanceof CmpLt) {
                  return c < 0;
                }
                ;
                if (op instanceof CmpGt) {
                  return c > 0;
                }
                ;
                throw new Error("Failed pattern match at Verdict.Core.Opt (line 331, column 21 - line 334, column 31): " + [op.constructor.name]);
              }()));
            }
            ;
            var v4 = ratOf(known)(b);
            var v5 = ratOf(known)(a);
            if (v5 instanceof Just && v4 instanceof Just) {
              var c = cmp(v5.value0)(v4.value0);
              return new MLoad(d, new LBool(function() {
                if (op instanceof CmpEq) {
                  return c === 0;
                }
                ;
                if (op instanceof CmpLt) {
                  return c < 0;
                }
                ;
                if (op instanceof CmpGt) {
                  return c > 0;
                }
                ;
                throw new Error("Failed pattern match at Verdict.Core.Opt (line 341, column 23 - line 344, column 33): " + [op.constructor.name]);
              }()));
            }
            ;
            return new MCmp(op, d, a, b);
          };
        };
      };
    };
  };
  var foldPass = /* @__PURE__ */ function() {
    var rewrite = function(known) {
      return function(v) {
        if (v instanceof MBin) {
          return {
            instr: foldBin(known)(v.value0)(v.value1)(v.value2)(v.value3)
          };
        }
        ;
        if (v instanceof MCmp) {
          return {
            instr: foldCmp(known)(v.value0)(v.value1)(v.value2)(v.value3)
          };
        }
        ;
        return {
          instr: v
        };
      };
    };
    var record = function(known) {
      return function(v) {
        var v2 = defOf(v.instr);
        if (v2 instanceof Just && v.instr instanceof MLoad) {
          return insert1(v2.value0)(v.instr.value1)(known);
        }
        ;
        if (v2 instanceof Just) {
          return $$delete4(v2.value0)(known);
        }
        ;
        return known;
      };
    };
    var go = function(known) {
      return function(instrs) {
        var v = uncons(instrs);
        if (v instanceof Nothing) {
          return [];
        }
        ;
        if (v instanceof Just) {
          if (v.value0.head instanceof MLabel) {
            return cons(v.value0.head)(go(empty3)(v.value0.tail));
          }
          ;
          if (v.value0.head instanceof MJumpIfFalse) {
            var v1 = lookup5(v.value0.head.value0)(known);
            if (v1 instanceof Just && (v1.value0 instanceof LBool && v1.value0.value0)) {
              return go(known)(v.value0.tail);
            }
            ;
            if (v1 instanceof Just && (v1.value0 instanceof LBool && !v1.value0.value0)) {
              return cons(new MJump(v.value0.head.value1))(go(known)(v.value0.tail));
            }
            ;
            return cons(v.value0.head)(go(known)(v.value0.tail));
          }
          ;
          var r = rewrite(known)(v.value0.head);
          return cons(r.instr)(go(record(known)(r))(v.value0.tail));
        }
        ;
        throw new Error("Failed pattern match at Verdict.Core.Opt (line 223, column 21 - line 234, column 59): " + [v.constructor.name]);
      };
    };
    return go(empty3);
  }();
  var dropUnreachable = function(instrs) {
    var targets = targetLabels(instrs);
    var go = function(reachable2) {
      return function(rest) {
        var v = uncons(rest);
        if (v instanceof Nothing) {
          return [];
        }
        ;
        if (v instanceof Just) {
          if (v.value0.head instanceof MJump && reachable2) {
            return cons(v.value0.head)(go(false)(v.value0.tail));
          }
          ;
          if (v.value0.head instanceof MJump) {
            return go(false)(v.value0.tail);
          }
          ;
          if (v.value0.head instanceof MHalt && reachable2) {
            return cons(v.value0.head)(go(false)(v.value0.tail));
          }
          ;
          if (v.value0.head instanceof MHalt) {
            return go(false)(v.value0.tail);
          }
          ;
          if (v.value0.head instanceof MRet && reachable2) {
            return cons(v.value0.head)(go(false)(v.value0.tail));
          }
          ;
          if (v.value0.head instanceof MRet) {
            return go(false)(v.value0.tail);
          }
          ;
          if (v.value0.head instanceof MTailCall && reachable2) {
            return cons(v.value0.head)(go(false)(v.value0.tail));
          }
          ;
          if (v.value0.head instanceof MTailCall) {
            return go(false)(v.value0.tail);
          }
          ;
          if (v.value0.head instanceof MLabel) {
            var reachable$prime = reachable2 || member5(v.value0.head.value0)(targets);
            if (reachable$prime) {
              return cons(v.value0.head)(go(true)(v.value0.tail));
            }
            ;
            return go(false)(v.value0.tail);
          }
          ;
          if (reachable2) {
            return cons(v.value0.head)(go(true)(v.value0.tail));
          }
          ;
          return go(false)(v.value0.tail);
        }
        ;
        throw new Error("Failed pattern match at Verdict.Core.Opt (line 361, column 23 - line 378, column 27): " + [v.constructor.name]);
      };
    };
    return removeJumpsToNextLabel(go(true)(instrs));
  };
  var dce = function($copy_instrs) {
    var $tco_done = false;
    var $tco_result;
    function $tco_loop(instrs) {
      var keep = function(used2) {
        return function(i) {
          var v = defOf(i);
          if (v instanceof Just) {
            return !isPure(i) || member1(v.value0)(used2);
          }
          ;
          if (v instanceof Nothing) {
            return true;
          }
          ;
          throw new Error("Failed pattern match at Verdict.Core.Opt (line 436, column 17 - line 438, column 20): " + [v.constructor.name]);
        };
      };
      var used = fromFoldable1(concatMap(usesOf)(instrs));
      var kept = filter(keep(used))(instrs);
      var $273 = length(kept) === length(instrs);
      if ($273) {
        $tco_done = true;
        return instrs;
      }
      ;
      $copy_instrs = kept;
      return;
    }
    ;
    while (!$tco_done) {
      $tco_result = $tco_loop($copy_instrs);
    }
    ;
    return $tco_result;
  };
  var cse = /* @__PURE__ */ function() {
    var go = function(seen) {
      return function(instrs) {
        var v = uncons(instrs);
        if (v instanceof Nothing) {
          return [];
        }
        ;
        if (v instanceof Just) {
          if (v.value0.head instanceof MLabel) {
            return cons(v.value0.head)(go(empty3)(v.value0.tail));
          }
          ;
          var v1 = defOf(v.value0.head);
          var v2 = stableKey(v.value0.head);
          if (v2 instanceof Just && (v1 instanceof Just && isPure(v.value0.head))) {
            var v3 = lookup1(v2.value0)(seen);
            if (v3 instanceof Just) {
              return cons(new MMove(v1.value0, v3.value0))(go(seen)(v.value0.tail));
            }
            ;
            if (v3 instanceof Nothing) {
              return cons(v.value0.head)(go(insert6(v2.value0)(v1.value0)(seen))(v.value0.tail));
            }
            ;
            throw new Error("Failed pattern match at Verdict.Core.Opt (line 409, column 11 - line 411, column 73): " + [v3.constructor.name]);
          }
          ;
          return cons(v.value0.head)(go(seen)(v.value0.tail));
        }
        ;
        throw new Error("Failed pattern match at Verdict.Core.Opt (line 403, column 20 - line 412, column 47): " + [v.constructor.name]);
      };
    };
    return go(empty3);
  }();
  var optimize = function(f) {
    return {
      name: f.name,
      params: f.params,
      paramTys: f.paramTys,
      retTy: f.retTy,
      isEntry: f.isEntry,
      body: dropUnreachable(tailCalls(dce(cse(dropUnreachable(foldPass(f.body))))))
    };
  };
  var callsName = function(name2) {
    return function(v) {
      if (v instanceof MCall) {
        return v.value1 === name2;
      }
      ;
      return false;
    };
  };
  var isInlinable = function(entry) {
    return function(f) {
      return $$null(f.params) && (f.name !== entry && (!any2(callsName(f.name))(f.body) && hasTrailingRet(f.body)));
    };
  };
  var inlinableMap = function(entry) {
    return function(funcs) {
      return fromFoldable22(map9(function(f) {
        return new Tuple(f.name, f);
      })(filter(isInlinable(entry))(funcs)));
    };
  };
  var callRefs = /* @__PURE__ */ concatMap(function(v) {
    if (v instanceof MCall) {
      return [v.value1];
    }
    ;
    if (v instanceof MSpawn) {
      return [v.value1];
    }
    ;
    if (v instanceof MTailCall) {
      return [v.value0];
    }
    ;
    return [];
  });
  var reachableFrom = function(entry) {
    return function(funcs) {
      var funcMap = fromFoldable22(map9(function(f) {
        return new Tuple(f.name, f);
      })(funcs));
      var go = function($copy_seen) {
        return function($copy_frontier) {
          var $tco_var_seen = $copy_seen;
          var $tco_done = false;
          var $tco_result;
          function $tco_loop(seen, frontier) {
            var v = uncons(frontier);
            if (v instanceof Nothing) {
              $tco_done = true;
              return seen;
            }
            ;
            if (v instanceof Just) {
              if (member5(v.value0.head)(seen)) {
                $tco_var_seen = seen;
                $copy_frontier = v.value0.tail;
                return;
              }
              ;
              if (otherwise) {
                var seen$prime = insert22(v.value0.head)(seen);
                var outs = function() {
                  var v1 = lookup1(v.value0.head)(funcMap);
                  if (v1 instanceof Just) {
                    return callRefs(v1.value0.body);
                  }
                  ;
                  if (v1 instanceof Nothing) {
                    return [];
                  }
                  ;
                  throw new Error("Failed pattern match at Verdict.Core.Opt (line 200, column 20 - line 202, column 28): " + [v1.constructor.name]);
                }();
                $tco_var_seen = seen$prime;
                $copy_frontier = append12(v.value0.tail)(outs);
                return;
              }
              ;
            }
            ;
            throw new Error("Failed pattern match at Verdict.Core.Opt (line 193, column 22 - line 204, column 36): " + [v.constructor.name]);
          }
          ;
          while (!$tco_done) {
            $tco_result = $tco_loop($tco_var_seen, $copy_frontier);
          }
          ;
          return $tco_result;
        };
      };
      return go(empty4)([entry]);
    };
  };
  var dropDead = function(entry) {
    return function(funcs) {
      var keep = reachableFrom(entry)(funcs);
      return filter(function(f) {
        return member5(f.name)(keep);
      })(funcs);
    };
  };
  var inlineNullaries = function(funcs) {
    return function(entry) {
      var go = function($copy_v) {
        return function($copy_v1) {
          var $tco_var_v = $copy_v;
          var $tco_done = false;
          var $tco_result;
          function $tco_loop(v, v1) {
            if (v === 0) {
              $tco_done = true;
              return dropDead(entry)(v1);
            }
            ;
            var table = inlinableMap(entry)(v1);
            var fs$prime = map9(inlineFunc(table))(v1);
            $tco_var_v = v - 1 | 0;
            $copy_v1 = dropDead(entry)(fs$prime);
            return;
          }
          ;
          while (!$tco_done) {
            $tco_result = $tco_loop($tco_var_v, $copy_v1);
          }
          ;
          return $tco_result;
        };
      };
      return go(5)(funcs);
    };
  };

  // .tmp-verdict-build/output/Verdict.Core.Regalloc/index.js
  var foldlWithIndex2 = /* @__PURE__ */ foldlWithIndex(foldableWithIndexArray);
  var insert7 = /* @__PURE__ */ insert2(ordInt);
  var member6 = /* @__PURE__ */ member2(ordInt);
  var member12 = /* @__PURE__ */ member4(ordInt);
  var insert12 = /* @__PURE__ */ insert5(ordInt);
  var max3 = /* @__PURE__ */ max(ordInt);
  var lookup6 = /* @__PURE__ */ lookup2(ordInt);
  var toUnfoldable7 = /* @__PURE__ */ toUnfoldable6(unfoldableArray);
  var $$delete5 = /* @__PURE__ */ $$delete3(ordInt);
  var sort2 = /* @__PURE__ */ sort(ordInt);
  var append5 = /* @__PURE__ */ append(semigroupArray);
  var eq14 = /* @__PURE__ */ eq(/* @__PURE__ */ eqMaybe(eqInt));
  var fromFoldable8 = /* @__PURE__ */ fromFoldable6(foldableArray)(ordInt);
  var fromFoldable12 = /* @__PURE__ */ fromFoldable3(ordInt)(foldableArray);
  var map10 = /* @__PURE__ */ map(functorArray);
  var isSelfMove = function(v) {
    if (v instanceof MMove) {
      return v.value0 === v.value1;
    }
    ;
    return false;
  };
  var computeLastUse = /* @__PURE__ */ foldlWithIndex2(function(idx) {
    return function(m) {
      return function(i) {
        return foldl2(function(acc) {
          return function(r) {
            return insert7(r)(idx)(acc);
          };
        })(m)(regsOf(i));
      };
    };
  })(empty3);
  var allocDef = function(paramSet) {
    return function(d) {
      return function(s) {
        if (member6(d)(s.assign)) {
          return s;
        }
        ;
        if (member12(d)(paramSet)) {
          return s;
        }
        ;
        if (otherwise) {
          var v = uncons(s.free);
          if (v instanceof Just) {
            return {
              next: s.next,
              assign: insert7(d)(v.value0.head)(s.assign),
              live: insert12(d)(s.live),
              free: v.value0.tail,
              maxReg: max3(s.maxReg)(v.value0.head)
            };
          }
          ;
          if (v instanceof Nothing) {
            return {
              free: s.free,
              assign: insert7(d)(s.next)(s.assign),
              live: insert12(d)(s.live),
              next: s.next + 1 | 0,
              maxReg: max3(s.maxReg)(s.next)
            };
          }
          ;
          throw new Error("Failed pattern match at Verdict.Core.Regalloc (line 97, column 17 - line 109, column 10): " + [v.constructor.name]);
        }
        ;
        throw new Error("Failed pattern match at Verdict.Core.Regalloc (line 93, column 1 - line 93, column 45): " + [paramSet.constructor.name, d.constructor.name, s.constructor.name]);
      };
    };
  };
  var step = function(paramSet) {
    return function(lastUse) {
      return function(idx) {
        return function(s0) {
          return function(instr) {
            var diedAt = function(v2) {
              return fromMaybe(idx)(lookup6(v2)(lastUse)) < idx;
            };
            var died = filter(diedAt)(toUnfoldable7(s0.live));
            var releasedRegs = mapMaybe(function(v2) {
              return lookup6(v2)(s0.assign);
            })(died);
            var s1 = {
              assign: s0.assign,
              maxReg: s0.maxReg,
              next: s0.next,
              live: foldl2(flip($$delete5))(s0.live)(died),
              free: sort2(append5(s0.free)(releasedRegs))
            };
            var v = function(v12) {
              var v2 = defOf(instr);
              if (v2 instanceof Just) {
                return allocDef(paramSet)(v2.value0)(s1);
              }
              ;
              if (v2 instanceof Nothing) {
                return s1;
              }
              ;
              throw new Error("Failed pattern match at Verdict.Core.Regalloc (line 87, column 12 - line 89, column 22): " + [v2.constructor.name]);
            };
            if (instr instanceof MMove) {
              var $47 = !member6(instr.value0)(s1.assign);
              if ($47) {
                var $48 = !member12(instr.value1)(paramSet);
                if ($48) {
                  var $49 = member12(instr.value1)(s1.live);
                  if ($49) {
                    var $50 = eq14(lookup6(instr.value1)(lastUse))(new Just(idx));
                    if ($50) {
                      var v1 = lookup6(instr.value1)(s1.assign);
                      if (v1 instanceof Just) {
                        return {
                          free: s1.free,
                          next: s1.next,
                          maxReg: s1.maxReg,
                          assign: insert7(instr.value0)(v1.value0)(s1.assign),
                          live: insert12(instr.value0)($$delete5(instr.value1)(s1.live))
                        };
                      }
                      ;
                      if (v1 instanceof Nothing) {
                        return allocDef(paramSet)(instr.value0)(s1);
                      }
                      ;
                      throw new Error("Failed pattern match at Verdict.Core.Regalloc (line 81, column 13 - line 86, column 48): " + [v1.constructor.name]);
                    }
                    ;
                    return v(true);
                  }
                  ;
                  return v(true);
                }
                ;
                return v(true);
              }
              ;
              return v(true);
            }
            ;
            return v(true);
          };
        };
      };
    };
  };
  var allocate = function(f) {
    var paramSet = fromFoldable8(f.params);
    var lastUse = computeLastUse(f.body);
    var arity = length(f.params);
    var init3 = {
      assign: fromFoldable12(mapWithIndex2(function(i) {
        return function(p) {
          return new Tuple(p, i);
        };
      })(f.params)),
      live: empty4,
      free: [],
      next: arity,
      maxReg: arity - 1 | 0
    };
    var $$final = foldlWithIndex2(step(paramSet)(lastUse))(init3)(f.body);
    var remap = function(r) {
      return fromMaybe(r)(lookup6(r)($$final.assign));
    };
    var allocated = map10(mapVRegs(remap))(f.body);
    var cleaned = filter(function($55) {
      return !isSelfMove($55);
    })(allocated);
    return {
      body: cleaned,
      registerCount: max3(1)($$final.maxReg + 1 | 0)
    };
  };

  // .tmp-verdict-build/output/Data.Array.NonEmpty.Internal/index.js
  var NonEmptyArray = function(x) {
    return x;
  };

  // .tmp-verdict-build/output/Data.Array.NonEmpty/index.js
  var unsafeFromArray = NonEmptyArray;
  var toArray = function(v) {
    return v;
  };
  var fromArray = function(xs) {
    if (length(xs) > 0) {
      return new Just(unsafeFromArray(xs));
    }
    ;
    if (otherwise) {
      return Nothing.value;
    }
    ;
    throw new Error("Failed pattern match at Data.Array.NonEmpty (line 161, column 1 - line 161, column 58): " + [xs.constructor.name]);
  };

  // .tmp-verdict-build/output/Data.Int/foreign.js
  var fromNumberImpl = function(just) {
    return function(nothing) {
      return function(n) {
        return (n | 0) === n ? just(n) : nothing;
      };
    };
  };
  var toNumber = function(n) {
    return n;
  };
  var fromStringAsImpl = function(just) {
    return function(nothing) {
      return function(radix) {
        var digits2;
        if (radix < 11) {
          digits2 = "[0-" + (radix - 1).toString() + "]";
        } else if (radix === 11) {
          digits2 = "[0-9a]";
        } else {
          digits2 = "[0-9a-" + String.fromCharCode(86 + radix) + "]";
        }
        var pattern = new RegExp("^[\\+\\-]?" + digits2 + "+$", "i");
        return function(s) {
          if (pattern.test(s)) {
            var i = parseInt(s, radix);
            return (i | 0) === i ? just(i) : nothing;
          } else {
            return nothing;
          }
        };
      };
    };
  };

  // .tmp-verdict-build/output/Data.Number/foreign.js
  var isFiniteImpl = isFinite;
  var floor = Math.floor;
  var pow = function(n) {
    return function(p) {
      return Math.pow(n, p);
    };
  };

  // .tmp-verdict-build/output/Data.Int/index.js
  var top2 = /* @__PURE__ */ top(boundedInt);
  var bottom2 = /* @__PURE__ */ bottom(boundedInt);
  var fromStringAs = /* @__PURE__ */ function() {
    return fromStringAsImpl(Just.create)(Nothing.value);
  }();
  var fromString = /* @__PURE__ */ fromStringAs(10);
  var fromNumber = /* @__PURE__ */ function() {
    return fromNumberImpl(Just.create)(Nothing.value);
  }();
  var unsafeClamp = function(x) {
    if (!isFiniteImpl(x)) {
      return 0;
    }
    ;
    if (x >= toNumber(top2)) {
      return top2;
    }
    ;
    if (x <= toNumber(bottom2)) {
      return bottom2;
    }
    ;
    if (otherwise) {
      return fromMaybe(0)(fromNumber(x));
    }
    ;
    throw new Error("Failed pattern match at Data.Int (line 72, column 1 - line 72, column 29): " + [x.constructor.name]);
  };
  var floor2 = function($39) {
    return unsafeClamp(floor($39));
  };

  // .tmp-verdict-build/output/Data.List.NonEmpty/index.js
  var toList2 = function(v) {
    return new Cons(v.value0, v.value1);
  };
  var cons$prime = function(x) {
    return function(xs) {
      return new NonEmpty(x, xs);
    };
  };

  // .tmp-verdict-build/output/Data.String.CodePoints/foreign.js
  var hasArrayFrom = typeof Array.from === "function";
  var hasStringIterator = typeof Symbol !== "undefined" && Symbol != null && typeof Symbol.iterator !== "undefined" && typeof String.prototype[Symbol.iterator] === "function";
  var hasFromCodePoint = typeof String.prototype.fromCodePoint === "function";
  var hasCodePointAt = typeof String.prototype.codePointAt === "function";
  var _unsafeCodePointAt0 = function(fallback) {
    return hasCodePointAt ? function(str) {
      return str.codePointAt(0);
    } : fallback;
  };
  var _codePointAt = function(fallback) {
    return function(Just2) {
      return function(Nothing2) {
        return function(unsafeCodePointAt02) {
          return function(index3) {
            return function(str) {
              var length5 = str.length;
              if (index3 < 0 || index3 >= length5) return Nothing2;
              if (hasStringIterator) {
                var iter = str[Symbol.iterator]();
                for (var i = index3; ; --i) {
                  var o = iter.next();
                  if (o.done) return Nothing2;
                  if (i === 0) return Just2(unsafeCodePointAt02(o.value));
                }
              }
              return fallback(index3)(str);
            };
          };
        };
      };
    };
  };
  var _fromCodePointArray = function(singleton10) {
    return hasFromCodePoint ? function(cps) {
      if (cps.length < 1e4) {
        return String.fromCodePoint.apply(String, cps);
      }
      return cps.map(singleton10).join("");
    } : function(cps) {
      return cps.map(singleton10).join("");
    };
  };
  var _toCodePointArray = function(fallback) {
    return function(unsafeCodePointAt02) {
      if (hasArrayFrom) {
        return function(str) {
          return Array.from(str, unsafeCodePointAt02);
        };
      }
      return fallback;
    };
  };

  // .tmp-verdict-build/output/Data.Enum/foreign.js
  function toCharCode(c) {
    return c.charCodeAt(0);
  }
  function fromCharCode(c) {
    return String.fromCharCode(c);
  }

  // .tmp-verdict-build/output/Data.Enum/index.js
  var bottom1 = /* @__PURE__ */ bottom(boundedChar);
  var top1 = /* @__PURE__ */ top(boundedChar);
  var toEnum = function(dict) {
    return dict.toEnum;
  };
  var fromEnum = function(dict) {
    return dict.fromEnum;
  };
  var toEnumWithDefaults = function(dictBoundedEnum) {
    var toEnum1 = toEnum(dictBoundedEnum);
    var fromEnum1 = fromEnum(dictBoundedEnum);
    var bottom22 = bottom(dictBoundedEnum.Bounded0());
    return function(low) {
      return function(high) {
        return function(x) {
          var v = toEnum1(x);
          if (v instanceof Just) {
            return v.value0;
          }
          ;
          if (v instanceof Nothing) {
            var $140 = x < fromEnum1(bottom22);
            if ($140) {
              return low;
            }
            ;
            return high;
          }
          ;
          throw new Error("Failed pattern match at Data.Enum (line 158, column 33 - line 160, column 62): " + [v.constructor.name]);
        };
      };
    };
  };
  var defaultSucc = function(toEnum$prime) {
    return function(fromEnum$prime) {
      return function(a) {
        return toEnum$prime(fromEnum$prime(a) + 1 | 0);
      };
    };
  };
  var defaultPred = function(toEnum$prime) {
    return function(fromEnum$prime) {
      return function(a) {
        return toEnum$prime(fromEnum$prime(a) - 1 | 0);
      };
    };
  };
  var charToEnum = function(v) {
    if (v >= toCharCode(bottom1) && v <= toCharCode(top1)) {
      return new Just(fromCharCode(v));
    }
    ;
    return Nothing.value;
  };
  var enumChar = {
    succ: /* @__PURE__ */ defaultSucc(charToEnum)(toCharCode),
    pred: /* @__PURE__ */ defaultPred(charToEnum)(toCharCode),
    Ord0: function() {
      return ordChar;
    }
  };
  var boundedEnumChar = /* @__PURE__ */ function() {
    return {
      cardinality: toCharCode(top1) - toCharCode(bottom1) | 0,
      toEnum: charToEnum,
      fromEnum: toCharCode,
      Bounded0: function() {
        return boundedChar;
      },
      Enum1: function() {
        return enumChar;
      }
    };
  }();

  // .tmp-verdict-build/output/Data.String.CodePoints/index.js
  var $runtime_lazy5 = function(name2, moduleName2, init3) {
    var state2 = 0;
    var val;
    return function(lineNumber) {
      if (state2 === 2) return val;
      if (state2 === 1) throw new ReferenceError(name2 + " was needed before it finished initializing (module " + moduleName2 + ", line " + lineNumber + ")", moduleName2, lineNumber);
      state2 = 1;
      val = init3();
      state2 = 2;
      return val;
    };
  };
  var fromEnum2 = /* @__PURE__ */ fromEnum(boundedEnumChar);
  var map11 = /* @__PURE__ */ map(functorMaybe);
  var unfoldr2 = /* @__PURE__ */ unfoldr(unfoldableArray);
  var div2 = /* @__PURE__ */ div(euclideanRingInt);
  var mod2 = /* @__PURE__ */ mod(euclideanRingInt);
  var compare2 = /* @__PURE__ */ compare(ordInt);
  var CodePoint = function(x) {
    return x;
  };
  var unsurrogate = function(lead) {
    return function(trail) {
      return (((lead - 55296 | 0) * 1024 | 0) + (trail - 56320 | 0) | 0) + 65536 | 0;
    };
  };
  var isTrail = function(cu) {
    return 56320 <= cu && cu <= 57343;
  };
  var isLead = function(cu) {
    return 55296 <= cu && cu <= 56319;
  };
  var uncons4 = function(s) {
    var v = length2(s);
    if (v === 0) {
      return Nothing.value;
    }
    ;
    if (v === 1) {
      return new Just({
        head: fromEnum2(charAt(0)(s)),
        tail: ""
      });
    }
    ;
    var cu1 = fromEnum2(charAt(1)(s));
    var cu0 = fromEnum2(charAt(0)(s));
    var $43 = isLead(cu0) && isTrail(cu1);
    if ($43) {
      return new Just({
        head: unsurrogate(cu0)(cu1),
        tail: drop(2)(s)
      });
    }
    ;
    return new Just({
      head: cu0,
      tail: drop(1)(s)
    });
  };
  var unconsButWithTuple = function(s) {
    return map11(function(v) {
      return new Tuple(v.head, v.tail);
    })(uncons4(s));
  };
  var toCodePointArrayFallback = function(s) {
    return unfoldr2(unconsButWithTuple)(s);
  };
  var unsafeCodePointAt0Fallback = function(s) {
    var cu0 = fromEnum2(charAt(0)(s));
    var $47 = isLead(cu0) && length2(s) > 1;
    if ($47) {
      var cu1 = fromEnum2(charAt(1)(s));
      var $48 = isTrail(cu1);
      if ($48) {
        return unsurrogate(cu0)(cu1);
      }
      ;
      return cu0;
    }
    ;
    return cu0;
  };
  var unsafeCodePointAt0 = /* @__PURE__ */ _unsafeCodePointAt0(unsafeCodePointAt0Fallback);
  var toCodePointArray = /* @__PURE__ */ _toCodePointArray(toCodePointArrayFallback)(unsafeCodePointAt0);
  var fromCharCode2 = /* @__PURE__ */ function() {
    var $75 = toEnumWithDefaults(boundedEnumChar)(bottom(boundedChar))(top(boundedChar));
    return function($76) {
      return singleton6($75($76));
    };
  }();
  var singletonFallback = function(v) {
    if (v <= 65535) {
      return fromCharCode2(v);
    }
    ;
    var lead = div2(v - 65536 | 0)(1024) + 55296 | 0;
    var trail = mod2(v - 65536 | 0)(1024) + 56320 | 0;
    return fromCharCode2(lead) + fromCharCode2(trail);
  };
  var fromCodePointArray = /* @__PURE__ */ _fromCodePointArray(singletonFallback);
  var eqCodePoint = {
    eq: function(x) {
      return function(y) {
        return x === y;
      };
    }
  };
  var ordCodePoint = {
    compare: function(x) {
      return function(y) {
        return compare2(x)(y);
      };
    },
    Eq0: function() {
      return eqCodePoint;
    }
  };
  var codePointFromChar = function($77) {
    return CodePoint(fromEnum2($77));
  };
  var codePointAtFallback = function($copy_n) {
    return function($copy_s) {
      var $tco_var_n = $copy_n;
      var $tco_done = false;
      var $tco_result;
      function $tco_loop(n, s) {
        var v = uncons4(s);
        if (v instanceof Just) {
          var $66 = n === 0;
          if ($66) {
            $tco_done = true;
            return new Just(v.value0.head);
          }
          ;
          $tco_var_n = n - 1 | 0;
          $copy_s = v.value0.tail;
          return;
        }
        ;
        $tco_done = true;
        return Nothing.value;
      }
      ;
      while (!$tco_done) {
        $tco_result = $tco_loop($tco_var_n, $copy_s);
      }
      ;
      return $tco_result;
    };
  };
  var codePointAt = function(v) {
    return function(v1) {
      if (v < 0) {
        return Nothing.value;
      }
      ;
      if (v === 0 && v1 === "") {
        return Nothing.value;
      }
      ;
      if (v === 0) {
        return new Just(unsafeCodePointAt0(v1));
      }
      ;
      return _codePointAt(codePointAtFallback)(Just.create)(Nothing.value)(unsafeCodePointAt0)(v)(v1);
    };
  };
  var boundedCodePoint = {
    bottom: 0,
    top: 1114111,
    Ord0: function() {
      return ordCodePoint;
    }
  };
  var boundedEnumCodePoint = /* @__PURE__ */ function() {
    return {
      cardinality: 1114111 + 1 | 0,
      fromEnum: function(v) {
        return v;
      },
      toEnum: function(n) {
        if (n >= 0 && n <= 1114111) {
          return new Just(n);
        }
        ;
        if (otherwise) {
          return Nothing.value;
        }
        ;
        throw new Error("Failed pattern match at Data.String.CodePoints (line 63, column 1 - line 68, column 26): " + [n.constructor.name]);
      },
      Bounded0: function() {
        return boundedCodePoint;
      },
      Enum1: function() {
        return $lazy_enumCodePoint(0);
      }
    };
  }();
  var $lazy_enumCodePoint = /* @__PURE__ */ $runtime_lazy5("enumCodePoint", "Data.String.CodePoints", function() {
    return {
      succ: defaultSucc(toEnum(boundedEnumCodePoint))(fromEnum(boundedEnumCodePoint)),
      pred: defaultPred(toEnum(boundedEnumCodePoint))(fromEnum(boundedEnumCodePoint)),
      Ord0: function() {
        return ordCodePoint;
      }
    };
  });

  // .tmp-verdict-build/output/Data.Argonaut.Encode.Encoders/index.js
  var map14 = /* @__PURE__ */ map(functorArray);
  var map15 = /* @__PURE__ */ map(functorObject);
  var extend2 = function(encoder) {
    return function(v) {
      var $40 = caseJsonObject(jsonSingletonObject(v.value0)(v.value1))(function() {
        var $42 = insert(v.value0)(v.value1);
        return function($43) {
          return id($42($43));
        };
      }());
      return function($41) {
        return $40(encoder($41));
      };
    };
  };
  var encodeString = id;
  var encodeInt = function($53) {
    return id(toNumber($53));
  };
  var encodeForeignObject = function(encoder) {
    var $54 = map15(encoder);
    return function($55) {
      return id($54($55));
    };
  };
  var encodeBoolean = id;
  var encodeArray = function(encoder) {
    var $58 = map14(encoder);
    return function($59) {
      return id($58($59));
    };
  };
  var assoc = function(encoder) {
    return function(k) {
      var $64 = Tuple.create(k);
      return function($65) {
        return $64(encoder($65));
      };
    };
  };

  // .tmp-verdict-build/output/Record/index.js
  var get3 = function(dictIsSymbol) {
    var reflectSymbol2 = reflectSymbol(dictIsSymbol);
    return function() {
      return function(l) {
        return function(r) {
          return unsafeGet(reflectSymbol2(l))(r);
        };
      };
    };
  };

  // .tmp-verdict-build/output/Data.Argonaut.Encode.Class/index.js
  var gEncodeJsonNil = {
    gEncodeJson: function(v) {
      return function(v1) {
        return empty;
      };
    }
  };
  var gEncodeJson = function(dict) {
    return dict.gEncodeJson;
  };
  var encodeRecord = function(dictGEncodeJson) {
    var gEncodeJson1 = gEncodeJson(dictGEncodeJson);
    return function() {
      return {
        encodeJson: function(rec) {
          return id(gEncodeJson1(rec)($$Proxy.value));
        }
      };
    };
  };
  var encodeJsonJson = {
    encodeJson: /* @__PURE__ */ identity(categoryFn)
  };
  var encodeJsonJString = {
    encodeJson: encodeString
  };
  var encodeJsonJBoolean = {
    encodeJson: encodeBoolean
  };
  var encodeJsonInt = {
    encodeJson: encodeInt
  };
  var encodeJson = function(dict) {
    return dict.encodeJson;
  };
  var encodeJsonArray = function(dictEncodeJson) {
    return {
      encodeJson: encodeArray(encodeJson(dictEncodeJson))
    };
  };
  var gEncodeJsonCons = function(dictEncodeJson) {
    var encodeJson12 = encodeJson(dictEncodeJson);
    return function(dictGEncodeJson) {
      var gEncodeJson1 = gEncodeJson(dictGEncodeJson);
      return function(dictIsSymbol) {
        var reflectSymbol2 = reflectSymbol(dictIsSymbol);
        var get6 = get3(dictIsSymbol)();
        return function() {
          return {
            gEncodeJson: function(row) {
              return function(v) {
                return insert(reflectSymbol2($$Proxy.value))(encodeJson12(get6($$Proxy.value)(row)))(gEncodeJson1(row)($$Proxy.value));
              };
            }
          };
        };
      };
    };
  };
  var encodeForeignObject2 = function(dictEncodeJson) {
    return {
      encodeJson: encodeForeignObject(encodeJson(dictEncodeJson))
    };
  };

  // .tmp-verdict-build/output/Data.Argonaut.Encode.Combinators/index.js
  var extend3 = function(dictEncodeJson) {
    return extend2(encodeJson(dictEncodeJson));
  };
  var assoc2 = function(dictEncodeJson) {
    return assoc(encodeJson(dictEncodeJson));
  };

  // .tmp-verdict-build/output/Verdict.FinVM.Types/index.js
  var map16 = /* @__PURE__ */ map(functorArray);
  var encodeJson2 = /* @__PURE__ */ encodeJson(encodeJsonInt);
  var extend4 = /* @__PURE__ */ extend3(encodeJsonJson);
  var assoc3 = /* @__PURE__ */ assoc2(encodeJsonJString);
  var assoc1 = /* @__PURE__ */ assoc2(encodeJsonJson);
  var assoc22 = /* @__PURE__ */ assoc2(encodeJsonInt);
  var assoc32 = /* @__PURE__ */ assoc2(encodeJsonJBoolean);
  var encodeJson1 = /* @__PURE__ */ encodeJson(encodeJsonJString);
  var encodeJson22 = /* @__PURE__ */ encodeJson(/* @__PURE__ */ encodeJsonArray(encodeJsonInt));
  var assoc4 = /* @__PURE__ */ assoc2(/* @__PURE__ */ encodeRecord(/* @__PURE__ */ gEncodeJsonCons(encodeJsonJBoolean)(gEncodeJsonNil)({
    reflectSymbol: function() {
      return "isInvariant";
    }
  })())());
  var assoc5 = /* @__PURE__ */ assoc2(/* @__PURE__ */ encodeJsonArray(encodeJsonJString));
  var assoc6 = /* @__PURE__ */ assoc2(/* @__PURE__ */ encodeForeignObject2(encodeJsonJson));
  var map17 = /* @__PURE__ */ map(functorObject);
  var VUnitVM = /* @__PURE__ */ function() {
    function VUnitVM2() {
    }
    ;
    VUnitVM2.value = new VUnitVM2();
    return VUnitVM2;
  }();
  var VIntVM = /* @__PURE__ */ function() {
    function VIntVM2(value0) {
      this.value0 = value0;
    }
    ;
    VIntVM2.create = function(value0) {
      return new VIntVM2(value0);
    };
    return VIntVM2;
  }();
  var VFixedVM = /* @__PURE__ */ function() {
    function VFixedVM2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    VFixedVM2.create = function(value0) {
      return function(value1) {
        return new VFixedVM2(value0, value1);
      };
    };
    return VFixedVM2;
  }();
  var VRationalVM = /* @__PURE__ */ function() {
    function VRationalVM2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    VRationalVM2.create = function(value0) {
      return function(value1) {
        return new VRationalVM2(value0, value1);
      };
    };
    return VRationalVM2;
  }();
  var VBoolVM = /* @__PURE__ */ function() {
    function VBoolVM2(value0) {
      this.value0 = value0;
    }
    ;
    VBoolVM2.create = function(value0) {
      return new VBoolVM2(value0);
    };
    return VBoolVM2;
  }();
  var VStringVM = /* @__PURE__ */ function() {
    function VStringVM2(value0) {
      this.value0 = value0;
    }
    ;
    VStringVM2.create = function(value0) {
      return new VStringVM2(value0);
    };
    return VStringVM2;
  }();
  var TyInt = /* @__PURE__ */ function() {
    function TyInt2() {
    }
    ;
    TyInt2.value = new TyInt2();
    return TyInt2;
  }();
  var TyFixed = /* @__PURE__ */ function() {
    function TyFixed2() {
    }
    ;
    TyFixed2.value = new TyFixed2();
    return TyFixed2;
  }();
  var TyRational = /* @__PURE__ */ function() {
    function TyRational2() {
    }
    ;
    TyRational2.value = new TyRational2();
    return TyRational2;
  }();
  var TyBool = /* @__PURE__ */ function() {
    function TyBool2() {
    }
    ;
    TyBool2.value = new TyBool2();
    return TyBool2;
  }();
  var TyString = /* @__PURE__ */ function() {
    function TyString2() {
    }
    ;
    TyString2.value = new TyString2();
    return TyString2;
  }();
  var TyUnit = /* @__PURE__ */ function() {
    function TyUnit2() {
    }
    ;
    TyUnit2.value = new TyUnit2();
    return TyUnit2;
  }();
  var TyList = /* @__PURE__ */ function() {
    function TyList2() {
    }
    ;
    TyList2.value = new TyList2();
    return TyList2;
  }();
  var TyRecord = /* @__PURE__ */ function() {
    function TyRecord2() {
    }
    ;
    TyRecord2.value = new TyRecord2();
    return TyRecord2;
  }();
  var LoadConst = /* @__PURE__ */ function() {
    function LoadConst2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    LoadConst2.create = function(value0) {
      return function(value1) {
        return new LoadConst2(value0, value1);
      };
    };
    return LoadConst2;
  }();
  var Move = /* @__PURE__ */ function() {
    function Move2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    Move2.create = function(value0) {
      return function(value1) {
        return new Move2(value0, value1);
      };
    };
    return Move2;
  }();
  var Add = /* @__PURE__ */ function() {
    function Add2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    Add2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new Add2(value0, value1, value2);
        };
      };
    };
    return Add2;
  }();
  var Sub = /* @__PURE__ */ function() {
    function Sub2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    Sub2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new Sub2(value0, value1, value2);
        };
      };
    };
    return Sub2;
  }();
  var Mul = /* @__PURE__ */ function() {
    function Mul2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    Mul2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new Mul2(value0, value1, value2);
        };
      };
    };
    return Mul2;
  }();
  var Div = /* @__PURE__ */ function() {
    function Div2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    Div2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new Div2(value0, value1, value2);
        };
      };
    };
    return Div2;
  }();
  var Mod = /* @__PURE__ */ function() {
    function Mod2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    Mod2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new Mod2(value0, value1, value2);
        };
      };
    };
    return Mod2;
  }();
  var EqI = /* @__PURE__ */ function() {
    function EqI2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    EqI2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new EqI2(value0, value1, value2);
        };
      };
    };
    return EqI2;
  }();
  var LtI = /* @__PURE__ */ function() {
    function LtI2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    LtI2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new LtI2(value0, value1, value2);
        };
      };
    };
    return LtI2;
  }();
  var GtI = /* @__PURE__ */ function() {
    function GtI2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    GtI2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new GtI2(value0, value1, value2);
        };
      };
    };
    return GtI2;
  }();
  var Call = /* @__PURE__ */ function() {
    function Call2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    Call2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new Call2(value0, value1, value2);
        };
      };
    };
    return Call2;
  }();
  var TailCall = /* @__PURE__ */ function() {
    function TailCall2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    TailCall2.create = function(value0) {
      return function(value1) {
        return new TailCall2(value0, value1);
      };
    };
    return TailCall2;
  }();
  var CallBuiltin = /* @__PURE__ */ function() {
    function CallBuiltin2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    CallBuiltin2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new CallBuiltin2(value0, value1, value2);
        };
      };
    };
    return CallBuiltin2;
  }();
  var LoadInput = /* @__PURE__ */ function() {
    function LoadInput2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    LoadInput2.create = function(value0) {
      return function(value1) {
        return new LoadInput2(value0, value1);
      };
    };
    return LoadInput2;
  }();
  var EffectNew = /* @__PURE__ */ function() {
    function EffectNew2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    EffectNew2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new EffectNew2(value0, value1, value2);
        };
      };
    };
    return EffectNew2;
  }();
  var EffectRequest = /* @__PURE__ */ function() {
    function EffectRequest2(value0) {
      this.value0 = value0;
    }
    ;
    EffectRequest2.create = function(value0) {
      return new EffectRequest2(value0);
    };
    return EffectRequest2;
  }();
  var EffectBatchNew = /* @__PURE__ */ function() {
    function EffectBatchNew2(value0) {
      this.value0 = value0;
    }
    ;
    EffectBatchNew2.create = function(value0) {
      return new EffectBatchNew2(value0);
    };
    return EffectBatchNew2;
  }();
  var EffectBatchAppend = /* @__PURE__ */ function() {
    function EffectBatchAppend2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    EffectBatchAppend2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new EffectBatchAppend2(value0, value1, value2);
        };
      };
    };
    return EffectBatchAppend2;
  }();
  var EffectAwait = /* @__PURE__ */ function() {
    function EffectAwait2(value0) {
      this.value0 = value0;
    }
    ;
    EffectAwait2.create = function(value0) {
      return new EffectAwait2(value0);
    };
    return EffectAwait2;
  }();
  var VariantPayload = /* @__PURE__ */ function() {
    function VariantPayload2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    VariantPayload2.create = function(value0) {
      return function(value1) {
        return new VariantPayload2(value0, value1);
      };
    };
    return VariantPayload2;
  }();
  var Spawn = /* @__PURE__ */ function() {
    function Spawn2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    Spawn2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new Spawn2(value0, value1, value2);
        };
      };
    };
    return Spawn2;
  }();
  var Send = /* @__PURE__ */ function() {
    function Send2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    Send2.create = function(value0) {
      return function(value1) {
        return new Send2(value0, value1);
      };
    };
    return Send2;
  }();
  var Recv = /* @__PURE__ */ function() {
    function Recv2(value0) {
      this.value0 = value0;
    }
    ;
    Recv2.create = function(value0) {
      return new Recv2(value0);
    };
    return Recv2;
  }();
  var Yield = /* @__PURE__ */ function() {
    function Yield2() {
    }
    ;
    Yield2.value = new Yield2();
    return Yield2;
  }();
  var Self = /* @__PURE__ */ function() {
    function Self2(value0) {
      this.value0 = value0;
    }
    ;
    Self2.create = function(value0) {
      return new Self2(value0);
    };
    return Self2;
  }();
  var Jump = /* @__PURE__ */ function() {
    function Jump2(value0) {
      this.value0 = value0;
    }
    ;
    Jump2.create = function(value0) {
      return new Jump2(value0);
    };
    return Jump2;
  }();
  var JumpIfFalse = /* @__PURE__ */ function() {
    function JumpIfFalse2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    JumpIfFalse2.create = function(value0) {
      return function(value1) {
        return new JumpIfFalse2(value0, value1);
      };
    };
    return JumpIfFalse2;
  }();
  var Label = /* @__PURE__ */ function() {
    function Label2(value0) {
      this.value0 = value0;
    }
    ;
    Label2.create = function(value0) {
      return new Label2(value0);
    };
    return Label2;
  }();
  var Return = /* @__PURE__ */ function() {
    function Return2(value0) {
      this.value0 = value0;
    }
    ;
    Return2.create = function(value0) {
      return new Return2(value0);
    };
    return Return2;
  }();
  var Halt = /* @__PURE__ */ function() {
    function Halt2(value0) {
      this.value0 = value0;
    }
    ;
    Halt2.create = function(value0) {
      return new Halt2(value0);
    };
    return Halt2;
  }();
  var RecordNew = /* @__PURE__ */ function() {
    function RecordNew2(value0) {
      this.value0 = value0;
    }
    ;
    RecordNew2.create = function(value0) {
      return new RecordNew2(value0);
    };
    return RecordNew2;
  }();
  var RecordSet = /* @__PURE__ */ function() {
    function RecordSet2(value0, value1, value2, value3) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
      this.value3 = value3;
    }
    ;
    RecordSet2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return function(value3) {
            return new RecordSet2(value0, value1, value2, value3);
          };
        };
      };
    };
    return RecordSet2;
  }();
  var RecordGet = /* @__PURE__ */ function() {
    function RecordGet2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    RecordGet2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new RecordGet2(value0, value1, value2);
        };
      };
    };
    return RecordGet2;
  }();
  var ListNew = /* @__PURE__ */ function() {
    function ListNew2(value0) {
      this.value0 = value0;
    }
    ;
    ListNew2.create = function(value0) {
      return new ListNew2(value0);
    };
    return ListNew2;
  }();
  var ListAppend = /* @__PURE__ */ function() {
    function ListAppend2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    ListAppend2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new ListAppend2(value0, value1, value2);
        };
      };
    };
    return ListAppend2;
  }();
  var ListGet = /* @__PURE__ */ function() {
    function ListGet2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    ListGet2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new ListGet2(value0, value1, value2);
        };
      };
    };
    return ListGet2;
  }();
  var ListLength = /* @__PURE__ */ function() {
    function ListLength2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    ListLength2.create = function(value0) {
      return function(value1) {
        return new ListLength2(value0, value1);
      };
    };
    return ListLength2;
  }();
  var ints = function(op) {
    return function(contents) {
      return id(cons(id(op))(map16(encodeJson2)(contents)));
    };
  };
  var hetero = function(op) {
    return function(contents) {
      return id(cons(id(op))(contents));
    };
  };
  var eqValueVM = {
    eq: function(x) {
      return function(y) {
        if (x instanceof VUnitVM && y instanceof VUnitVM) {
          return true;
        }
        ;
        if (x instanceof VIntVM && y instanceof VIntVM) {
          return x.value0 === y.value0;
        }
        ;
        if (x instanceof VFixedVM && y instanceof VFixedVM) {
          return x.value0 === y.value0 && x.value1 === y.value1;
        }
        ;
        if (x instanceof VRationalVM && y instanceof VRationalVM) {
          return x.value0 === y.value0 && x.value1 === y.value1;
        }
        ;
        if (x instanceof VBoolVM && y instanceof VBoolVM) {
          return x.value0 === y.value0;
        }
        ;
        if (x instanceof VStringVM && y instanceof VStringVM) {
          return x.value0 === y.value0;
        }
        ;
        return false;
      };
    }
  };
  var encodeJsonValueVM = {
    encodeJson: function(v) {
      if (v instanceof VUnitVM) {
        return jsonNull;
      }
      ;
      if (v instanceof VIntVM) {
        return extend4(assoc3("int")(v.value0))(jsonEmptyObject);
      }
      ;
      if (v instanceof VFixedVM) {
        return extend4(assoc1("fixed")(extend4(assoc3("value")(v.value0))(extend4(assoc22("scale")(v.value1))(jsonEmptyObject))))(jsonEmptyObject);
      }
      ;
      if (v instanceof VRationalVM) {
        return extend4(assoc1("rational")(extend4(assoc3("numerator")(v.value0))(extend4(assoc3("denominator")(v.value1))(jsonEmptyObject))))(jsonEmptyObject);
      }
      ;
      if (v instanceof VBoolVM) {
        return extend4(assoc32("bool")(v.value0))(jsonEmptyObject);
      }
      ;
      if (v instanceof VStringVM) {
        return extend4(assoc3("string")(v.value0))(jsonEmptyObject);
      }
      ;
      throw new Error("Failed pattern match at Verdict.FinVM.Types (line 30, column 1 - line 44, column 39): " + [v.constructor.name]);
    }
  };
  var assoc7 = /* @__PURE__ */ assoc2(/* @__PURE__ */ encodeJsonArray(encodeJsonValueVM));
  var encodeJsonInstructionVM = {
    encodeJson: function(v) {
      if (v instanceof LoadConst) {
        return ints("LOAD_CONST")([v.value0, v.value1]);
      }
      ;
      if (v instanceof Move) {
        return ints("MOVE")([v.value0, v.value1]);
      }
      ;
      if (v instanceof Add) {
        return ints("ADD")([v.value0, v.value1, v.value2]);
      }
      ;
      if (v instanceof Sub) {
        return ints("SUB")([v.value0, v.value1, v.value2]);
      }
      ;
      if (v instanceof Mul) {
        return ints("MUL")([v.value0, v.value1, v.value2]);
      }
      ;
      if (v instanceof EqI) {
        return ints("EQ")([v.value0, v.value1, v.value2]);
      }
      ;
      if (v instanceof LtI) {
        return ints("LT")([v.value0, v.value1, v.value2]);
      }
      ;
      if (v instanceof GtI) {
        return ints("GT")([v.value0, v.value1, v.value2]);
      }
      ;
      if (v instanceof Return) {
        return ints("RETURN")([v.value0]);
      }
      ;
      if (v instanceof Halt) {
        return ints("HALT")([v.value0]);
      }
      ;
      if (v instanceof RecordNew) {
        return ints("RECORD_NEW")([v.value0]);
      }
      ;
      if (v instanceof ListNew) {
        return ints("LIST_NEW")([v.value0]);
      }
      ;
      if (v instanceof ListAppend) {
        return ints("LIST_APPEND")([v.value0, v.value1, v.value2]);
      }
      ;
      if (v instanceof ListGet) {
        return ints("LIST_GET")([v.value0, v.value1, v.value2]);
      }
      ;
      if (v instanceof ListLength) {
        return ints("LIST_LENGTH")([v.value0, v.value1]);
      }
      ;
      if (v instanceof Mod) {
        return ints("MOD")([v.value0, v.value1, v.value2]);
      }
      ;
      if (v instanceof Div) {
        return hetero("DIV")([encodeJson2(v.value0), encodeJson1("RoundDown"), encodeJson2(v.value1), encodeJson2(v.value2)]);
      }
      ;
      if (v instanceof Call) {
        return hetero("CALL")([encodeJson2(v.value0), encodeJson1(v.value1), encodeJson22(v.value2)]);
      }
      ;
      if (v instanceof TailCall) {
        return hetero("TAIL_CALL")([encodeJson1(v.value0), encodeJson22(v.value1)]);
      }
      ;
      if (v instanceof CallBuiltin) {
        return hetero("CALL_BUILTIN")([encodeJson2(v.value0), encodeJson1(v.value1), encodeJson22(v.value2)]);
      }
      ;
      if (v instanceof LoadInput) {
        return hetero("LOAD_INPUT")([encodeJson2(v.value0), encodeJson1(v.value1)]);
      }
      ;
      if (v instanceof EffectNew) {
        return hetero("EFFECT_NEW")([encodeJson2(v.value0), encodeJson1(v.value1), encodeJson2(v.value2)]);
      }
      ;
      if (v instanceof EffectRequest) {
        return ints("EFFECT_REQUEST")([v.value0]);
      }
      ;
      if (v instanceof EffectBatchNew) {
        return ints("EFFECT_BATCH_NEW")([v.value0]);
      }
      ;
      if (v instanceof EffectBatchAppend) {
        return ints("EFFECT_BATCH_APPEND")([v.value0, v.value1, v.value2]);
      }
      ;
      if (v instanceof EffectAwait) {
        return ints("EFFECT_AWAIT")([v.value0]);
      }
      ;
      if (v instanceof VariantPayload) {
        return ints("VARIANT_PAYLOAD")([v.value0, v.value1]);
      }
      ;
      if (v instanceof Spawn) {
        return hetero("PROC_SPAWN")([encodeJson2(v.value0), encodeJson1(v.value1), encodeJson22(v.value2)]);
      }
      ;
      if (v instanceof Send) {
        return ints("PROC_SEND")([v.value0, v.value1]);
      }
      ;
      if (v instanceof Recv) {
        return ints("PROC_RECEIVE")([v.value0]);
      }
      ;
      if (v instanceof Yield) {
        return ints("PROC_YIELD")([]);
      }
      ;
      if (v instanceof Self) {
        return ints("PROC_SELF")([v.value0]);
      }
      ;
      if (v instanceof Jump) {
        return hetero("JUMP")([encodeJson1(v.value0)]);
      }
      ;
      if (v instanceof JumpIfFalse) {
        return hetero("JUMP_IF_FALSE")([encodeJson2(v.value0), encodeJson1(v.value1)]);
      }
      ;
      if (v instanceof Label) {
        return hetero("LABEL")([encodeJson1(v.value0)]);
      }
      ;
      if (v instanceof RecordSet) {
        return hetero("RECORD_SET")([encodeJson2(v.value0), encodeJson2(v.value1), encodeJson1(v.value2), encodeJson2(v.value3)]);
      }
      ;
      if (v instanceof RecordGet) {
        return hetero("RECORD_GET")([encodeJson2(v.value0), encodeJson2(v.value1), encodeJson1(v.value2)]);
      }
      ;
      throw new Error("Failed pattern match at Verdict.FinVM.Types (line 121, column 16 - line 158, column 92): " + [v.constructor.name]);
    }
  };
  var assoc8 = /* @__PURE__ */ assoc2(/* @__PURE__ */ encodeJsonArray(encodeJsonInstructionVM));
  var encodeFunctionVM = function(f) {
    return extend4(assoc4("proof")(f.proof))(extend4(assoc8("instructions")(f.instructions))(extend4(assoc22("registerCount")(f.registerCount))(extend4(assoc22("arity")(f.arity))(jsonEmptyObject))));
  };
  var encodeProgramVM = function(p) {
    return extend4(assoc5("capabilities")(p.capabilities))(extend4(assoc1("limits")(extend4(assoc22("maxSteps")(p.limits.maxSteps))(jsonEmptyObject)))(extend4(assoc6("functions")(map17(encodeFunctionVM)(p.functions)))(extend4(assoc3("entrypoint")(p.entrypoint))(extend4(assoc7("constants")(p.constants))(extend4(assoc3("version")(p.version))(jsonEmptyObject))))));
  };

  // .tmp-verdict-build/output/Verdict.FinVM.Emit/index.js
  var nub3 = /* @__PURE__ */ nub(ordString);
  var sort3 = /* @__PURE__ */ sort(ordString);
  var bindStateT3 = /* @__PURE__ */ bindStateT(monadIdentity);
  var bind3 = /* @__PURE__ */ bind(bindStateT3);
  var monadStateStateT3 = /* @__PURE__ */ monadStateStateT(monadIdentity);
  var get4 = /* @__PURE__ */ get(monadStateStateT3);
  var eq3 = /* @__PURE__ */ eq(eqValueVM);
  var applicativeStateT3 = /* @__PURE__ */ applicativeStateT(monadIdentity);
  var pure3 = /* @__PURE__ */ pure(applicativeStateT3);
  var discard3 = /* @__PURE__ */ discard(discardUnit)(bindStateT3);
  var put2 = /* @__PURE__ */ put(monadStateStateT3);
  var traverse3 = /* @__PURE__ */ traverse(traversableArray)(applicativeStateT3);
  var map18 = /* @__PURE__ */ map(functorArray);
  var fromFoldable10 = /* @__PURE__ */ fromFoldable2(foldableArray);
  var tyToVM = function(v) {
    if (v instanceof TInt) {
      return TyInt.value;
    }
    ;
    if (v instanceof TFixed) {
      return TyFixed.value;
    }
    ;
    if (v instanceof TRational) {
      return TyRational.value;
    }
    ;
    if (v instanceof TBool) {
      return TyBool.value;
    }
    ;
    if (v instanceof TString) {
      return TyString.value;
    }
    ;
    if (v instanceof TUnit) {
      return TyUnit.value;
    }
    ;
    if (v instanceof TPid) {
      return TyUnit.value;
    }
    ;
    if (v instanceof TList) {
      return TyList.value;
    }
    ;
    if (v instanceof TRecord) {
      return TyRecord.value;
    }
    ;
    if (v instanceof TData) {
      return TyRecord.value;
    }
    ;
    if (v instanceof TVar) {
      return TyUnit.value;
    }
    ;
    if (v instanceof TArrow) {
      return TyUnit.value;
    }
    ;
    if (v instanceof TUnknown) {
      return TyUnit.value;
    }
    ;
    throw new Error("Failed pattern match at Verdict.FinVM.Emit (line 53, column 10 - line 66, column 21): " + [v.constructor.name]);
  };
  var litToValue = function(v) {
    if (v instanceof LUnit) {
      return VUnitVM.value;
    }
    ;
    if (v instanceof LInt) {
      return new VIntVM(v.value0);
    }
    ;
    if (v instanceof LFixed) {
      return new VFixedVM(v.value0, v.value1);
    }
    ;
    if (v instanceof LRational) {
      var r = reduce(v.value0)(v.value1);
      return new VRationalVM(r.num, r.den);
    }
    ;
    if (v instanceof LBool) {
      return new VBoolVM(v.value0);
    }
    ;
    if (v instanceof LStr) {
      return new VStringVM(v.value0);
    }
    ;
    throw new Error("Failed pattern match at Verdict.FinVM.Emit (line 42, column 14 - line 50, column 24): " + [v.constructor.name]);
  };
  var inferCapabilities = function(funcs) {
    var ns = function(v) {
      if (v instanceof MBuiltin) {
        return new Just(takeWhile(function(v1) {
          return v1 !== ".";
        })(v.value1));
      }
      ;
      if (v instanceof MEffectNew) {
        return new Just(takeWhile(function(v1) {
          return v1 !== ".";
        })(v.value1));
      }
      ;
      return Nothing.value;
    };
    return nub3(sort3(mapMaybe(ns)(concatMap(function(v) {
      return v.body;
    })(funcs))));
  };
  var addConst = function(v) {
    return bind3(get4)(function(pool) {
      var v1 = findIndex(function(v2) {
        return eq3(v2)(v);
      })(pool);
      if (v1 instanceof Just) {
        return pure3(v1.value0);
      }
      ;
      if (v1 instanceof Nothing) {
        return discard3(put2(snoc(pool)(v)))(function() {
          return pure3(length(pool));
        });
      }
      ;
      throw new Error("Failed pattern match at Verdict.FinVM.Emit (line 35, column 3 - line 39, column 31): " + [v1.constructor.name]);
    });
  };
  var convInstr = function(v) {
    if (v instanceof MLoad) {
      return bind3(addConst(litToValue(v.value1)))(function(i) {
        return pure3(new LoadConst(v.value0, i));
      });
    }
    ;
    if (v instanceof MMove) {
      return pure3(new Move(v.value0, v.value1));
    }
    ;
    if (v instanceof MBin) {
      return pure3(function() {
        if (v.value0 instanceof OpAdd) {
          return new Add(v.value1, v.value2, v.value3);
        }
        ;
        if (v.value0 instanceof OpSub) {
          return new Sub(v.value1, v.value2, v.value3);
        }
        ;
        if (v.value0 instanceof OpMul) {
          return new Mul(v.value1, v.value2, v.value3);
        }
        ;
        if (v.value0 instanceof OpDiv) {
          return new Div(v.value1, v.value2, v.value3);
        }
        ;
        if (v.value0 instanceof OpMod) {
          return new Mod(v.value1, v.value2, v.value3);
        }
        ;
        throw new Error("Failed pattern match at Verdict.FinVM.Emit (line 74, column 25 - line 79, column 23): " + [v.value0.constructor.name]);
      }());
    }
    ;
    if (v instanceof MCmp) {
      return pure3(function() {
        if (v.value0 instanceof CmpEq) {
          return new EqI(v.value1, v.value2, v.value3);
        }
        ;
        if (v.value0 instanceof CmpLt) {
          return new LtI(v.value1, v.value2, v.value3);
        }
        ;
        if (v.value0 instanceof CmpGt) {
          return new GtI(v.value1, v.value2, v.value3);
        }
        ;
        throw new Error("Failed pattern match at Verdict.FinVM.Emit (line 80, column 25 - line 83, column 23): " + [v.value0.constructor.name]);
      }());
    }
    ;
    if (v instanceof MCall) {
      return pure3(new Call(v.value0, v.value1, v.value2));
    }
    ;
    if (v instanceof MSpawn) {
      return pure3(new Spawn(v.value0, v.value1, v.value2));
    }
    ;
    if (v instanceof MSend) {
      return pure3(new Send(v.value0, v.value1));
    }
    ;
    if (v instanceof MRecv) {
      return pure3(new Recv(v.value0));
    }
    ;
    if (v instanceof MYield) {
      return pure3(Yield.value);
    }
    ;
    if (v instanceof MSelf) {
      return pure3(new Self(v.value0));
    }
    ;
    if (v instanceof MTailCall) {
      return pure3(new TailCall(v.value0, v.value1));
    }
    ;
    if (v instanceof MBuiltin) {
      return pure3(new CallBuiltin(v.value0, v.value1, v.value2));
    }
    ;
    if (v instanceof MLoadInput) {
      return pure3(new LoadInput(v.value0, v.value1));
    }
    ;
    if (v instanceof MEffectNew) {
      return pure3(new EffectNew(v.value0, v.value1, v.value2));
    }
    ;
    if (v instanceof MEffectRequest) {
      return pure3(new EffectRequest(v.value0));
    }
    ;
    if (v instanceof MEffectAwait) {
      return pure3(new EffectAwait(v.value0));
    }
    ;
    if (v instanceof MVariantPayload) {
      return pure3(new VariantPayload(v.value0, v.value1));
    }
    ;
    if (v instanceof MEffectBatchNew) {
      return pure3(new EffectBatchNew(v.value0));
    }
    ;
    if (v instanceof MEffectBatchAppend) {
      return pure3(new EffectBatchAppend(v.value0, v.value1, v.value2));
    }
    ;
    if (v instanceof MRecordNew) {
      return pure3(new RecordNew(v.value0));
    }
    ;
    if (v instanceof MRecordSet) {
      return pure3(new RecordSet(v.value0, v.value1, v.value2, v.value3));
    }
    ;
    if (v instanceof MRecordGet) {
      return pure3(new RecordGet(v.value0, v.value1, v.value2));
    }
    ;
    if (v instanceof MListNew) {
      return pure3(new ListNew(v.value0));
    }
    ;
    if (v instanceof MListAppend) {
      return pure3(new ListAppend(v.value0, v.value1, v.value2));
    }
    ;
    if (v instanceof MListGet) {
      return pure3(new ListGet(v.value0, v.value1, v.value2));
    }
    ;
    if (v instanceof MListLength) {
      return pure3(new ListLength(v.value0, v.value1));
    }
    ;
    if (v instanceof MJump) {
      return pure3(new Jump(v.value0));
    }
    ;
    if (v instanceof MJumpIfFalse) {
      return pure3(new JumpIfFalse(v.value0, v.value1));
    }
    ;
    if (v instanceof MLabel) {
      return pure3(new Label(v.value0));
    }
    ;
    if (v instanceof MRet) {
      return pure3(new Return(v.value0));
    }
    ;
    if (v instanceof MHalt) {
      return pure3(new Halt(v.value0));
    }
    ;
    throw new Error("Failed pattern match at Verdict.FinVM.Emit (line 69, column 13 - line 110, column 27): " + [v.constructor.name]);
  };
  var convFunc = function(f) {
    return bind3(traverse3(convInstr)(f.body))(function(instrs) {
      return pure3({
        id: f.name,
        arity: f.arity,
        registerCount: f.registerCount,
        parameterTypes: map18(tyToVM)(f.paramTys),
        returnType: tyToVM(f.retTy),
        instructions: instrs,
        debug: {
          name: f.name
        },
        proof: {
          isInvariant: false
        }
      });
    });
  };
  var assemble = function(funcs) {
    return function(entry) {
      var v = runState(traverse3(convFunc)(funcs))([]);
      return {
        version: "1.0",
        constants: v.value1,
        functions: fromFoldable10(map18(function(fn) {
          return new Tuple(fn.id, fn);
        })(v.value0)),
        stateMachines: empty,
        entrypoint: entry,
        exports: singleton3(entry)(entry),
        metadata: {
          description: "Compiled by Verdict (MIR pipeline)"
        },
        typeTable: empty,
        capabilities: inferCapabilities(funcs),
        verification: {
          verified: true
        },
        limits: {
          maxSteps: 1e8
        }
      };
    };
  };

  // .tmp-verdict-build/output/Parsing.Combinators/index.js
  var alt3 = /* @__PURE__ */ alt(altParserT);
  var defer3 = /* @__PURE__ */ defer(lazyParserT);
  var voidLeft2 = /* @__PURE__ */ voidLeft(functorParserT);
  var pure4 = /* @__PURE__ */ pure(applicativeParserT);
  var applySecond2 = /* @__PURE__ */ applySecond(applyParserT);
  var tailRecM3 = /* @__PURE__ */ tailRecM(monadRecParserT);
  var bind4 = /* @__PURE__ */ bind(bindParserT);
  var map19 = /* @__PURE__ */ map(functorParserT);
  var manyRec2 = /* @__PURE__ */ manyRec(monadRecParserT)(alternativeParserT);
  var applyFirst2 = /* @__PURE__ */ applyFirst(applyParserT);
  var empty5 = /* @__PURE__ */ empty2(plusParserT);
  var withLazyErrorMessage = function(p) {
    return function(msg) {
      return alt3(p)(defer3(function(v) {
        return fail("Expected " + msg(unit));
      }));
    };
  };
  var withErrorMessage = function(p) {
    return function(msg) {
      return alt3(p)(fail("Expected " + msg));
    };
  };
  var $$try = function(v) {
    return function(v1, more, lift3, $$throw, done) {
      return v(v1, more, lift3, function(v2, err2) {
        return $$throw(new ParseState(v2.value0, v2.value1, v1.value2), err2);
      }, done);
    };
  };
  var skipMany1 = function(p) {
    var go = function(v) {
      return alt3(voidLeft2(p)(new Loop(unit)))(pure4(new Done(unit)));
    };
    return applySecond2(p)(tailRecM3(go)(unit));
  };
  var skipMany = function(p) {
    return alt3(skipMany1(p))(pure4(unit));
  };
  var sepBy1 = function(p) {
    return function(sep) {
      return bind4(p)(function(a) {
        return bind4(manyRec2(applySecond2(sep)(p)))(function(as) {
          return pure4(cons$prime(a)(as));
        });
      });
    };
  };
  var sepBy = function(p) {
    return function(sep) {
      return alt3(map19(toList2)(sepBy1(p)(sep)))(pure4(Nil.value));
    };
  };
  var option = function(a) {
    return function(p) {
      return alt3(p)(pure4(a));
    };
  };
  var optionMaybe = function(p) {
    return option(Nothing.value)(map19(Just.create)(p));
  };
  var notFollowedBy = function(p) {
    return $$try(alt3(applySecond2($$try(p))(fail("Negated parser succeeded")))(pure4(unit)));
  };
  var choice = function(dictFoldable) {
    var go = function(p1) {
      return function(v) {
        if (v instanceof Nothing) {
          return new Just(p1);
        }
        ;
        if (v instanceof Just) {
          return new Just(alt3(p1)(v.value0));
        }
        ;
        throw new Error("Failed pattern match at Parsing.Combinators (line 362, column 11 - line 364, column 32): " + [v.constructor.name]);
      };
    };
    var $95 = fromMaybe(empty5);
    var $96 = foldr(dictFoldable)(go)(Nothing.value);
    return function($97) {
      return $95($96($97));
    };
  };
  var chainl1 = function(p) {
    return function(f) {
      var go = function(a) {
        return alt3(bind4(f)(function(op) {
          return bind4(p)(function(a$prime) {
            return pure4(new Loop(op(a)(a$prime)));
          });
        }))(pure4(new Done(a)));
      };
      return bind4(p)(function(a) {
        return tailRecM3(go)(a);
      });
    };
  };
  var between = function(open) {
    return function(close) {
      return function(p) {
        return applyFirst2(applySecond2(open)(p))(close);
      };
    };
  };
  var asErrorMessage = /* @__PURE__ */ flip(withErrorMessage);

  // .tmp-verdict-build/output/Parsing.Combinators.Array/index.js
  var bind5 = /* @__PURE__ */ bind(bindParserT);
  var tailRecM4 = /* @__PURE__ */ tailRecM(monadRecParserT);
  var alt4 = /* @__PURE__ */ alt(altParserT);
  var pure5 = /* @__PURE__ */ pure(applicativeParserT);
  var fromFoldable11 = /* @__PURE__ */ fromFoldable(foldableList);
  var many3 = function(p) {
    return bind5(flip(tailRecM4)(Nil.value)(function(xs) {
      return alt4(bind5(p)(function(x) {
        return pure5(new Loop(new Cons(x, xs)));
      }))(pure5(new Done(xs)));
    }))(function(rlist) {
      return pure5(reverse(fromFoldable11(rlist)));
    });
  };
  var many1 = function(p) {
    return bind5(many3(p))(function(xs) {
      var v = fromArray(xs);
      if (v instanceof Nothing) {
        return fail("Expected at least 1");
      }
      ;
      if (v instanceof Just) {
        return pure5(v.value0);
      }
      ;
      throw new Error("Failed pattern match at Parsing.Combinators.Array (line 55, column 3 - line 57, column 25): " + [v.constructor.name]);
    });
  };

  // .tmp-verdict-build/output/Parsing.String/index.js
  var fromEnum3 = /* @__PURE__ */ fromEnum(boundedEnumCodePoint);
  var mod3 = /* @__PURE__ */ mod(euclideanRingInt);
  var fromJust5 = /* @__PURE__ */ fromJust();
  var toEnum2 = /* @__PURE__ */ toEnum(boundedEnumChar);
  var show13 = /* @__PURE__ */ show(showString);
  var show23 = /* @__PURE__ */ show(showChar);
  var updatePosSingle = function(v) {
    return function(cp) {
      return function(after) {
        var v1 = fromEnum3(cp);
        if (v1 === 10) {
          return {
            index: v.index + 1 | 0,
            line: v.line + 1 | 0,
            column: 1
          };
        }
        ;
        if (v1 === 13) {
          var v2 = codePointAt(0)(after);
          if (v2 instanceof Just && fromEnum3(v2.value0) === 10) {
            return {
              index: v.index + 1 | 0,
              line: v.line,
              column: v.column
            };
          }
          ;
          return {
            index: v.index + 1 | 0,
            line: v.line + 1 | 0,
            column: 1
          };
        }
        ;
        if (v1 === 9) {
          return {
            index: v.index + 1 | 0,
            line: v.line,
            column: (v.column + 8 | 0) - mod3(v.column - 1 | 0)(8) | 0
          };
        }
        ;
        return {
          index: v.index + 1 | 0,
          line: v.line,
          column: v.column + 1 | 0
        };
      };
    };
  };
  var updatePosString = function($copy_pos) {
    return function($copy_before) {
      return function($copy_after) {
        var $tco_var_pos = $copy_pos;
        var $tco_var_before = $copy_before;
        var $tco_done = false;
        var $tco_result;
        function $tco_loop(pos, before, after) {
          var v = uncons4(before);
          if (v instanceof Nothing) {
            $tco_done = true;
            return pos;
          }
          ;
          if (v instanceof Just) {
            var newPos = function() {
              if ($$null2(v.value0.tail)) {
                return updatePosSingle(pos)(v.value0.head)(after);
              }
              ;
              if (otherwise) {
                return updatePosSingle(pos)(v.value0.head)(v.value0.tail);
              }
              ;
              throw new Error("Failed pattern match at Parsing.String (line 165, column 7 - line 167, column 52): ");
            }();
            $tco_var_pos = newPos;
            $tco_var_before = v.value0.tail;
            $copy_after = after;
            return;
          }
          ;
          throw new Error("Failed pattern match at Parsing.String (line 161, column 36 - line 168, column 38): " + [v.constructor.name]);
        }
        ;
        while (!$tco_done) {
          $tco_result = $tco_loop($tco_var_pos, $tco_var_before, $copy_after);
        }
        ;
        return $tco_result;
      };
    };
  };
  var satisfyCodePoint = function(f) {
    return mkFn5(function(v) {
      return function(v1) {
        return function(v2) {
          return function($$throw) {
            return function(done) {
              var v3 = uncons4(v.value0);
              if (v3 instanceof Nothing) {
                return $$throw(v, new ParseError("Unexpected EOF", v.value1));
              }
              ;
              if (v3 instanceof Just) {
                var $76 = f(v3.value0.head);
                if ($76) {
                  return done(new ParseState(v3.value0.tail, updatePosSingle(v.value1)(v3.value0.head)(v3.value0.tail), true), v3.value0.head);
                }
                ;
                return $$throw(v, new ParseError("Predicate unsatisfied", v.value1));
              }
              ;
              throw new Error("Failed pattern match at Parsing.String (line 136, column 7 - line 143, column 73): " + [v3.constructor.name]);
            };
          };
        };
      };
    });
  };
  var satisfy = function(f) {
    return mkFn5(function(v) {
      return function(v1) {
        return function(v2) {
          return function($$throw) {
            return function(done) {
              var v3 = uncons4(v.value0);
              if (v3 instanceof Nothing) {
                return $$throw(v, new ParseError("Unexpected EOF", v.value1));
              }
              ;
              if (v3 instanceof Just) {
                var cp = fromEnum3(v3.value0.head);
                var $85 = cp < 0 || cp > 65535;
                if ($85) {
                  return $$throw(v, new ParseError("Expected Char", v.value1));
                }
                ;
                var ch = fromJust5(toEnum2(cp));
                var $86 = f(ch);
                if ($86) {
                  return done(new ParseState(v3.value0.tail, updatePosSingle(v.value1)(v3.value0.head)(v3.value0.tail), true), ch);
                }
                ;
                return $$throw(v, new ParseError("Predicate unsatisfied", v.value1));
              }
              ;
              throw new Error("Failed pattern match at Parsing.String (line 114, column 7 - line 129, column 75): " + [v3.constructor.name]);
            };
          };
        };
      };
    });
  };
  var eof = /* @__PURE__ */ mkFn5(function(v) {
    return function(v1) {
      return function(v2) {
        return function($$throw) {
          return function(done) {
            var $133 = $$null2(v.value0);
            if ($133) {
              return done(new ParseState(v.value0, v.value1, true), unit);
            }
            ;
            return $$throw(v, new ParseError("Expected EOF", v.value1));
          };
        };
      };
    };
  });
  var consumeWith = function(f) {
    return mkFn5(function(v) {
      return function(v1) {
        return function(v2) {
          return function($$throw) {
            return function(done) {
              var v3 = f(v.value0);
              if (v3 instanceof Left) {
                return $$throw(v, new ParseError(v3.value0, v.value1));
              }
              ;
              if (v3 instanceof Right) {
                return done(new ParseState(v3.value0.remainder, updatePosString(v.value1)(v3.value0.consumed)(v3.value0.remainder), !$$null2(v3.value0.consumed)), v3.value0.value);
              }
              ;
              throw new Error("Failed pattern match at Parsing.String (line 286, column 7 - line 290, column 121): " + [v3.constructor.name]);
            };
          };
        };
      };
    });
  };
  var string = function(str) {
    return consumeWith(function(input) {
      var v = stripPrefix(str)(input);
      if (v instanceof Just) {
        return new Right({
          value: str,
          consumed: str,
          remainder: v.value0
        });
      }
      ;
      return new Left("Expected " + show13(str));
    });
  };
  var $$char = function(c) {
    return withErrorMessage(satisfy(function(v) {
      return v === c;
    }))(show23(c));
  };

  // .tmp-verdict-build/output/Data.Char/index.js
  var toCharCode2 = /* @__PURE__ */ fromEnum(boundedEnumChar);
  var fromCharCode3 = /* @__PURE__ */ toEnum(boundedEnumChar);

  // .tmp-verdict-build/output/Data.CodePoint.Unicode.Internal/index.js
  var unsafeIndex2 = /* @__PURE__ */ unsafeIndex();
  var elemIndex2 = /* @__PURE__ */ elemIndex(eqInt);
  var NUMCAT_LU = /* @__PURE__ */ function() {
    function NUMCAT_LU2() {
    }
    ;
    NUMCAT_LU2.value = new NUMCAT_LU2();
    return NUMCAT_LU2;
  }();
  var NUMCAT_LL = /* @__PURE__ */ function() {
    function NUMCAT_LL2() {
    }
    ;
    NUMCAT_LL2.value = new NUMCAT_LL2();
    return NUMCAT_LL2;
  }();
  var NUMCAT_LT = /* @__PURE__ */ function() {
    function NUMCAT_LT2() {
    }
    ;
    NUMCAT_LT2.value = new NUMCAT_LT2();
    return NUMCAT_LT2;
  }();
  var NUMCAT_LM = /* @__PURE__ */ function() {
    function NUMCAT_LM2() {
    }
    ;
    NUMCAT_LM2.value = new NUMCAT_LM2();
    return NUMCAT_LM2;
  }();
  var NUMCAT_LO = /* @__PURE__ */ function() {
    function NUMCAT_LO2() {
    }
    ;
    NUMCAT_LO2.value = new NUMCAT_LO2();
    return NUMCAT_LO2;
  }();
  var NUMCAT_MN = /* @__PURE__ */ function() {
    function NUMCAT_MN2() {
    }
    ;
    NUMCAT_MN2.value = new NUMCAT_MN2();
    return NUMCAT_MN2;
  }();
  var NUMCAT_MC = /* @__PURE__ */ function() {
    function NUMCAT_MC2() {
    }
    ;
    NUMCAT_MC2.value = new NUMCAT_MC2();
    return NUMCAT_MC2;
  }();
  var NUMCAT_ME = /* @__PURE__ */ function() {
    function NUMCAT_ME2() {
    }
    ;
    NUMCAT_ME2.value = new NUMCAT_ME2();
    return NUMCAT_ME2;
  }();
  var NUMCAT_ND = /* @__PURE__ */ function() {
    function NUMCAT_ND2() {
    }
    ;
    NUMCAT_ND2.value = new NUMCAT_ND2();
    return NUMCAT_ND2;
  }();
  var NUMCAT_NL = /* @__PURE__ */ function() {
    function NUMCAT_NL2() {
    }
    ;
    NUMCAT_NL2.value = new NUMCAT_NL2();
    return NUMCAT_NL2;
  }();
  var NUMCAT_NO = /* @__PURE__ */ function() {
    function NUMCAT_NO2() {
    }
    ;
    NUMCAT_NO2.value = new NUMCAT_NO2();
    return NUMCAT_NO2;
  }();
  var NUMCAT_PC = /* @__PURE__ */ function() {
    function NUMCAT_PC2() {
    }
    ;
    NUMCAT_PC2.value = new NUMCAT_PC2();
    return NUMCAT_PC2;
  }();
  var NUMCAT_PD = /* @__PURE__ */ function() {
    function NUMCAT_PD2() {
    }
    ;
    NUMCAT_PD2.value = new NUMCAT_PD2();
    return NUMCAT_PD2;
  }();
  var NUMCAT_PS = /* @__PURE__ */ function() {
    function NUMCAT_PS2() {
    }
    ;
    NUMCAT_PS2.value = new NUMCAT_PS2();
    return NUMCAT_PS2;
  }();
  var NUMCAT_PE = /* @__PURE__ */ function() {
    function NUMCAT_PE2() {
    }
    ;
    NUMCAT_PE2.value = new NUMCAT_PE2();
    return NUMCAT_PE2;
  }();
  var NUMCAT_PI = /* @__PURE__ */ function() {
    function NUMCAT_PI2() {
    }
    ;
    NUMCAT_PI2.value = new NUMCAT_PI2();
    return NUMCAT_PI2;
  }();
  var NUMCAT_PF = /* @__PURE__ */ function() {
    function NUMCAT_PF2() {
    }
    ;
    NUMCAT_PF2.value = new NUMCAT_PF2();
    return NUMCAT_PF2;
  }();
  var NUMCAT_PO = /* @__PURE__ */ function() {
    function NUMCAT_PO2() {
    }
    ;
    NUMCAT_PO2.value = new NUMCAT_PO2();
    return NUMCAT_PO2;
  }();
  var NUMCAT_SM = /* @__PURE__ */ function() {
    function NUMCAT_SM2() {
    }
    ;
    NUMCAT_SM2.value = new NUMCAT_SM2();
    return NUMCAT_SM2;
  }();
  var NUMCAT_SC = /* @__PURE__ */ function() {
    function NUMCAT_SC2() {
    }
    ;
    NUMCAT_SC2.value = new NUMCAT_SC2();
    return NUMCAT_SC2;
  }();
  var NUMCAT_SK = /* @__PURE__ */ function() {
    function NUMCAT_SK2() {
    }
    ;
    NUMCAT_SK2.value = new NUMCAT_SK2();
    return NUMCAT_SK2;
  }();
  var NUMCAT_SO = /* @__PURE__ */ function() {
    function NUMCAT_SO2() {
    }
    ;
    NUMCAT_SO2.value = new NUMCAT_SO2();
    return NUMCAT_SO2;
  }();
  var NUMCAT_ZS = /* @__PURE__ */ function() {
    function NUMCAT_ZS2() {
    }
    ;
    NUMCAT_ZS2.value = new NUMCAT_ZS2();
    return NUMCAT_ZS2;
  }();
  var NUMCAT_ZL = /* @__PURE__ */ function() {
    function NUMCAT_ZL2() {
    }
    ;
    NUMCAT_ZL2.value = new NUMCAT_ZL2();
    return NUMCAT_ZL2;
  }();
  var NUMCAT_ZP = /* @__PURE__ */ function() {
    function NUMCAT_ZP2() {
    }
    ;
    NUMCAT_ZP2.value = new NUMCAT_ZP2();
    return NUMCAT_ZP2;
  }();
  var NUMCAT_CC = /* @__PURE__ */ function() {
    function NUMCAT_CC2() {
    }
    ;
    NUMCAT_CC2.value = new NUMCAT_CC2();
    return NUMCAT_CC2;
  }();
  var NUMCAT_CF = /* @__PURE__ */ function() {
    function NUMCAT_CF2() {
    }
    ;
    NUMCAT_CF2.value = new NUMCAT_CF2();
    return NUMCAT_CF2;
  }();
  var NUMCAT_CS = /* @__PURE__ */ function() {
    function NUMCAT_CS2() {
    }
    ;
    NUMCAT_CS2.value = new NUMCAT_CS2();
    return NUMCAT_CS2;
  }();
  var NUMCAT_CO = /* @__PURE__ */ function() {
    function NUMCAT_CO2() {
    }
    ;
    NUMCAT_CO2.value = new NUMCAT_CO2();
    return NUMCAT_CO2;
  }();
  var NUMCAT_CN = /* @__PURE__ */ function() {
    function NUMCAT_CN2() {
    }
    ;
    NUMCAT_CN2.value = new NUMCAT_CN2();
    return NUMCAT_CN2;
  }();
  var numSpaceBlocks = 7;
  var numLat1Blocks = 63;
  var numConvBlocks = 1332;
  var numBlocks = 3396;
  var gencatZS = 2;
  var rule1 = /* @__PURE__ */ function() {
    return {
      category: gencatZS,
      unicodeCat: NUMCAT_ZS.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var spacechars = [{
    start: 32,
    length: 1,
    convRule: rule1
  }, {
    start: 160,
    length: 1,
    convRule: rule1
  }, {
    start: 5760,
    length: 1,
    convRule: rule1
  }, {
    start: 8192,
    length: 11,
    convRule: rule1
  }, {
    start: 8239,
    length: 1,
    convRule: rule1
  }, {
    start: 8287,
    length: 1,
    convRule: rule1
  }, {
    start: 12288,
    length: 1,
    convRule: rule1
  }];
  var gencatZP = 67108864;
  var rule162 = /* @__PURE__ */ function() {
    return {
      category: gencatZP,
      unicodeCat: NUMCAT_ZP.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var gencatZL = 33554432;
  var rule161 = /* @__PURE__ */ function() {
    return {
      category: gencatZL,
      unicodeCat: NUMCAT_ZL.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var gencatSO = 8192;
  var rule13 = /* @__PURE__ */ function() {
    return {
      category: gencatSO,
      unicodeCat: NUMCAT_SO.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var rule170 = /* @__PURE__ */ function() {
    return {
      category: gencatSO,
      unicodeCat: NUMCAT_SO.value,
      possible: 1,
      updist: 0,
      lowdist: 26,
      titledist: 0
    };
  }();
  var rule171 = /* @__PURE__ */ function() {
    return {
      category: gencatSO,
      unicodeCat: NUMCAT_SO.value,
      possible: 1,
      updist: -26 | 0,
      lowdist: 0,
      titledist: -26 | 0
    };
  }();
  var gencatSM = 64;
  var rule6 = /* @__PURE__ */ function() {
    return {
      category: gencatSM,
      unicodeCat: NUMCAT_SM.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var gencatSK = 1024;
  var rule10 = /* @__PURE__ */ function() {
    return {
      category: gencatSK,
      unicodeCat: NUMCAT_SK.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var gencatSC = 8;
  var rule3 = /* @__PURE__ */ function() {
    return {
      category: gencatSC,
      unicodeCat: NUMCAT_SC.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var gencatPS = 16;
  var rule4 = /* @__PURE__ */ function() {
    return {
      category: gencatPS,
      unicodeCat: NUMCAT_PS.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var gencatPO = 4;
  var rule2 = /* @__PURE__ */ function() {
    return {
      category: gencatPO,
      unicodeCat: NUMCAT_PO.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var gencatPI = 32768;
  var rule15 = /* @__PURE__ */ function() {
    return {
      category: gencatPI,
      unicodeCat: NUMCAT_PI.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var gencatPF = 262144;
  var rule19 = /* @__PURE__ */ function() {
    return {
      category: gencatPF,
      unicodeCat: NUMCAT_PF.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var gencatPE = 32;
  var rule5 = /* @__PURE__ */ function() {
    return {
      category: gencatPE,
      unicodeCat: NUMCAT_PE.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var gencatPD = 128;
  var rule7 = /* @__PURE__ */ function() {
    return {
      category: gencatPD,
      unicodeCat: NUMCAT_PD.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var gencatPC = 2048;
  var rule11 = /* @__PURE__ */ function() {
    return {
      category: gencatPC,
      unicodeCat: NUMCAT_PC.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var gencatNO = 131072;
  var rule17 = /* @__PURE__ */ function() {
    return {
      category: gencatNO,
      unicodeCat: NUMCAT_NO.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var gencatNL = 16777216;
  var rule128 = /* @__PURE__ */ function() {
    return {
      category: gencatNL,
      unicodeCat: NUMCAT_NL.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var rule168 = /* @__PURE__ */ function() {
    return {
      category: gencatNL,
      unicodeCat: NUMCAT_NL.value,
      possible: 1,
      updist: 0,
      lowdist: 16,
      titledist: 0
    };
  }();
  var rule169 = /* @__PURE__ */ function() {
    return {
      category: gencatNL,
      unicodeCat: NUMCAT_NL.value,
      possible: 1,
      updist: -16 | 0,
      lowdist: 0,
      titledist: -16 | 0
    };
  }();
  var gencatND = 256;
  var rule8 = /* @__PURE__ */ function() {
    return {
      category: gencatND,
      unicodeCat: NUMCAT_ND.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var gencatMN = 2097152;
  var rule92 = /* @__PURE__ */ function() {
    return {
      category: gencatMN,
      unicodeCat: NUMCAT_MN.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var rule93 = /* @__PURE__ */ function() {
    return {
      category: gencatMN,
      unicodeCat: NUMCAT_MN.value,
      possible: 1,
      updist: 84,
      lowdist: 0,
      titledist: 84
    };
  }();
  var gencatME = 4194304;
  var rule119 = /* @__PURE__ */ function() {
    return {
      category: gencatME,
      unicodeCat: NUMCAT_ME.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var gencatMC = 8388608;
  var rule124 = /* @__PURE__ */ function() {
    return {
      category: gencatMC,
      unicodeCat: NUMCAT_MC.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var gencatLU = 512;
  var nullrule = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_CN.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var rule104 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 8,
      titledist: 0
    };
  }();
  var rule107 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var rule115 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -60 | 0,
      titledist: 0
    };
  }();
  var rule117 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -7 | 0,
      titledist: 0
    };
  }();
  var rule118 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 80,
      titledist: 0
    };
  }();
  var rule120 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 15,
      titledist: 0
    };
  }();
  var rule122 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 48,
      titledist: 0
    };
  }();
  var rule125 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 7264,
      titledist: 0
    };
  }();
  var rule127 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 38864,
      titledist: 0
    };
  }();
  var rule137 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -3008 | 0,
      titledist: 0
    };
  }();
  var rule142 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -7615 | 0,
      titledist: 0
    };
  }();
  var rule144 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -8 | 0,
      titledist: 0
    };
  }();
  var rule153 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -74 | 0,
      titledist: 0
    };
  }();
  var rule156 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -86 | 0,
      titledist: 0
    };
  }();
  var rule157 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -100 | 0,
      titledist: 0
    };
  }();
  var rule158 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -112 | 0,
      titledist: 0
    };
  }();
  var rule159 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -128 | 0,
      titledist: 0
    };
  }();
  var rule160 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -126 | 0,
      titledist: 0
    };
  }();
  var rule163 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -7517 | 0,
      titledist: 0
    };
  }();
  var rule164 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -8383 | 0,
      titledist: 0
    };
  }();
  var rule165 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -8262 | 0,
      titledist: 0
    };
  }();
  var rule166 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 28,
      titledist: 0
    };
  }();
  var rule172 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -10743 | 0,
      titledist: 0
    };
  }();
  var rule173 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -3814 | 0,
      titledist: 0
    };
  }();
  var rule174 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -10727 | 0,
      titledist: 0
    };
  }();
  var rule177 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -10780 | 0,
      titledist: 0
    };
  }();
  var rule178 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -10749 | 0,
      titledist: 0
    };
  }();
  var rule179 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -10783 | 0,
      titledist: 0
    };
  }();
  var rule180 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -10782 | 0,
      titledist: 0
    };
  }();
  var rule181 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -10815 | 0,
      titledist: 0
    };
  }();
  var rule183 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -35332 | 0,
      titledist: 0
    };
  }();
  var rule184 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -42280 | 0,
      titledist: 0
    };
  }();
  var rule186 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -42308 | 0,
      titledist: 0
    };
  }();
  var rule187 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -42319 | 0,
      titledist: 0
    };
  }();
  var rule188 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -42315 | 0,
      titledist: 0
    };
  }();
  var rule189 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -42305 | 0,
      titledist: 0
    };
  }();
  var rule190 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -42258 | 0,
      titledist: 0
    };
  }();
  var rule191 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -42282 | 0,
      titledist: 0
    };
  }();
  var rule192 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -42261 | 0,
      titledist: 0
    };
  }();
  var rule193 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 928,
      titledist: 0
    };
  }();
  var rule194 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -48 | 0,
      titledist: 0
    };
  }();
  var rule195 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -42307 | 0,
      titledist: 0
    };
  }();
  var rule196 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -35384 | 0,
      titledist: 0
    };
  }();
  var rule201 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 40,
      titledist: 0
    };
  }();
  var rule203 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 34,
      titledist: 0
    };
  }();
  var rule22 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 1,
      titledist: 0
    };
  }();
  var rule24 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -199 | 0,
      titledist: 0
    };
  }();
  var rule26 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -121 | 0,
      titledist: 0
    };
  }();
  var rule29 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 210,
      titledist: 0
    };
  }();
  var rule30 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 206,
      titledist: 0
    };
  }();
  var rule31 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 205,
      titledist: 0
    };
  }();
  var rule32 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 79,
      titledist: 0
    };
  }();
  var rule33 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 202,
      titledist: 0
    };
  }();
  var rule34 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 203,
      titledist: 0
    };
  }();
  var rule35 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 207,
      titledist: 0
    };
  }();
  var rule37 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 211,
      titledist: 0
    };
  }();
  var rule38 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 209,
      titledist: 0
    };
  }();
  var rule40 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 213,
      titledist: 0
    };
  }();
  var rule42 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 214,
      titledist: 0
    };
  }();
  var rule43 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 218,
      titledist: 0
    };
  }();
  var rule44 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 217,
      titledist: 0
    };
  }();
  var rule45 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 219,
      titledist: 0
    };
  }();
  var rule47 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 2,
      titledist: 1
    };
  }();
  var rule51 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -97 | 0,
      titledist: 0
    };
  }();
  var rule52 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -56 | 0,
      titledist: 0
    };
  }();
  var rule53 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -130 | 0,
      titledist: 0
    };
  }();
  var rule54 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 10795,
      titledist: 0
    };
  }();
  var rule55 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -163 | 0,
      titledist: 0
    };
  }();
  var rule56 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 10792,
      titledist: 0
    };
  }();
  var rule58 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: -195 | 0,
      titledist: 0
    };
  }();
  var rule59 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 69,
      titledist: 0
    };
  }();
  var rule60 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 71,
      titledist: 0
    };
  }();
  var rule9 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 32,
      titledist: 0
    };
  }();
  var rule94 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 116,
      titledist: 0
    };
  }();
  var rule95 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 38,
      titledist: 0
    };
  }();
  var rule96 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 37,
      titledist: 0
    };
  }();
  var rule97 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 64,
      titledist: 0
    };
  }();
  var rule98 = /* @__PURE__ */ function() {
    return {
      category: gencatLU,
      unicodeCat: NUMCAT_LU.value,
      possible: 1,
      updist: 0,
      lowdist: 63,
      titledist: 0
    };
  }();
  var gencatLT = 524288;
  var rule151 = /* @__PURE__ */ function() {
    return {
      category: gencatLT,
      unicodeCat: NUMCAT_LT.value,
      possible: 1,
      updist: 0,
      lowdist: -8 | 0,
      titledist: 0
    };
  }();
  var rule154 = /* @__PURE__ */ function() {
    return {
      category: gencatLT,
      unicodeCat: NUMCAT_LT.value,
      possible: 1,
      updist: 0,
      lowdist: -9 | 0,
      titledist: 0
    };
  }();
  var rule48 = /* @__PURE__ */ function() {
    return {
      category: gencatLT,
      unicodeCat: NUMCAT_LT.value,
      possible: 1,
      updist: -1 | 0,
      lowdist: 1,
      titledist: 0
    };
  }();
  var gencatLO = 16384;
  var rule14 = /* @__PURE__ */ function() {
    return {
      category: gencatLO,
      unicodeCat: NUMCAT_LO.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var gencatLM = 1048576;
  var rule91 = /* @__PURE__ */ function() {
    return {
      category: gencatLM,
      unicodeCat: NUMCAT_LM.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var gencatLL = 4096;
  var rule100 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -37 | 0,
      lowdist: 0,
      titledist: -37 | 0
    };
  }();
  var rule101 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -31 | 0,
      lowdist: 0,
      titledist: -31 | 0
    };
  }();
  var rule102 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -64 | 0,
      lowdist: 0,
      titledist: -64 | 0
    };
  }();
  var rule103 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -63 | 0,
      lowdist: 0,
      titledist: -63 | 0
    };
  }();
  var rule105 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -62 | 0,
      lowdist: 0,
      titledist: -62 | 0
    };
  }();
  var rule106 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -57 | 0,
      lowdist: 0,
      titledist: -57 | 0
    };
  }();
  var rule108 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -47 | 0,
      lowdist: 0,
      titledist: -47 | 0
    };
  }();
  var rule109 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -54 | 0,
      lowdist: 0,
      titledist: -54 | 0
    };
  }();
  var rule110 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -8 | 0,
      lowdist: 0,
      titledist: -8 | 0
    };
  }();
  var rule111 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -86 | 0,
      lowdist: 0,
      titledist: -86 | 0
    };
  }();
  var rule112 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -80 | 0,
      lowdist: 0,
      titledist: -80 | 0
    };
  }();
  var rule113 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 7,
      lowdist: 0,
      titledist: 7
    };
  }();
  var rule114 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -116 | 0,
      lowdist: 0,
      titledist: -116 | 0
    };
  }();
  var rule116 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -96 | 0,
      lowdist: 0,
      titledist: -96 | 0
    };
  }();
  var rule12 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -32 | 0,
      lowdist: 0,
      titledist: -32 | 0
    };
  }();
  var rule121 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -15 | 0,
      lowdist: 0,
      titledist: -15 | 0
    };
  }();
  var rule123 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -48 | 0,
      lowdist: 0,
      titledist: -48 | 0
    };
  }();
  var rule126 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 3008,
      lowdist: 0,
      titledist: 0
    };
  }();
  var rule129 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -6254 | 0,
      lowdist: 0,
      titledist: -6254 | 0
    };
  }();
  var rule130 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -6253 | 0,
      lowdist: 0,
      titledist: -6253 | 0
    };
  }();
  var rule131 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -6244 | 0,
      lowdist: 0,
      titledist: -6244 | 0
    };
  }();
  var rule132 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -6242 | 0,
      lowdist: 0,
      titledist: -6242 | 0
    };
  }();
  var rule133 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -6243 | 0,
      lowdist: 0,
      titledist: -6243 | 0
    };
  }();
  var rule134 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -6236 | 0,
      lowdist: 0,
      titledist: -6236 | 0
    };
  }();
  var rule135 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -6181 | 0,
      lowdist: 0,
      titledist: -6181 | 0
    };
  }();
  var rule136 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 35266,
      lowdist: 0,
      titledist: 35266
    };
  }();
  var rule138 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 35332,
      lowdist: 0,
      titledist: 35332
    };
  }();
  var rule139 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 3814,
      lowdist: 0,
      titledist: 3814
    };
  }();
  var rule140 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 35384,
      lowdist: 0,
      titledist: 35384
    };
  }();
  var rule141 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -59 | 0,
      lowdist: 0,
      titledist: -59 | 0
    };
  }();
  var rule143 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 8,
      lowdist: 0,
      titledist: 8
    };
  }();
  var rule145 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 74,
      lowdist: 0,
      titledist: 74
    };
  }();
  var rule146 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 86,
      lowdist: 0,
      titledist: 86
    };
  }();
  var rule147 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 100,
      lowdist: 0,
      titledist: 100
    };
  }();
  var rule148 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 128,
      lowdist: 0,
      titledist: 128
    };
  }();
  var rule149 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 112,
      lowdist: 0,
      titledist: 112
    };
  }();
  var rule150 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 126,
      lowdist: 0,
      titledist: 126
    };
  }();
  var rule152 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 9,
      lowdist: 0,
      titledist: 9
    };
  }();
  var rule155 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -7205 | 0,
      lowdist: 0,
      titledist: -7205 | 0
    };
  }();
  var rule167 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -28 | 0,
      lowdist: 0,
      titledist: -28 | 0
    };
  }();
  var rule175 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -10795 | 0,
      lowdist: 0,
      titledist: -10795 | 0
    };
  }();
  var rule176 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -10792 | 0,
      lowdist: 0,
      titledist: -10792 | 0
    };
  }();
  var rule18 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 743,
      lowdist: 0,
      titledist: 743
    };
  }();
  var rule182 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -7264 | 0,
      lowdist: 0,
      titledist: -7264 | 0
    };
  }();
  var rule185 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 48,
      lowdist: 0,
      titledist: 48
    };
  }();
  var rule197 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -928 | 0,
      lowdist: 0,
      titledist: -928 | 0
    };
  }();
  var rule198 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -38864 | 0,
      lowdist: 0,
      titledist: -38864 | 0
    };
  }();
  var rule20 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var rule202 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -40 | 0,
      lowdist: 0,
      titledist: -40 | 0
    };
  }();
  var rule204 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -34 | 0,
      lowdist: 0,
      titledist: -34 | 0
    };
  }();
  var rule21 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 121,
      lowdist: 0,
      titledist: 121
    };
  }();
  var rule23 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -1 | 0,
      lowdist: 0,
      titledist: -1 | 0
    };
  }();
  var rule25 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -232 | 0,
      lowdist: 0,
      titledist: -232 | 0
    };
  }();
  var rule27 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -300 | 0,
      lowdist: 0,
      titledist: -300 | 0
    };
  }();
  var rule28 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 195,
      lowdist: 0,
      titledist: 195
    };
  }();
  var rule36 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 97,
      lowdist: 0,
      titledist: 97
    };
  }();
  var rule39 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 163,
      lowdist: 0,
      titledist: 163
    };
  }();
  var rule41 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 130,
      lowdist: 0,
      titledist: 130
    };
  }();
  var rule46 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 56,
      lowdist: 0,
      titledist: 56
    };
  }();
  var rule49 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -2 | 0,
      lowdist: 0,
      titledist: -1 | 0
    };
  }();
  var rule50 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -79 | 0,
      lowdist: 0,
      titledist: -79 | 0
    };
  }();
  var rule57 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 10815,
      lowdist: 0,
      titledist: 10815
    };
  }();
  var rule61 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 10783,
      lowdist: 0,
      titledist: 10783
    };
  }();
  var rule62 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 10780,
      lowdist: 0,
      titledist: 10780
    };
  }();
  var rule63 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 10782,
      lowdist: 0,
      titledist: 10782
    };
  }();
  var rule64 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -210 | 0,
      lowdist: 0,
      titledist: -210 | 0
    };
  }();
  var rule65 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -206 | 0,
      lowdist: 0,
      titledist: -206 | 0
    };
  }();
  var rule66 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -205 | 0,
      lowdist: 0,
      titledist: -205 | 0
    };
  }();
  var rule67 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -202 | 0,
      lowdist: 0,
      titledist: -202 | 0
    };
  }();
  var rule68 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -203 | 0,
      lowdist: 0,
      titledist: -203 | 0
    };
  }();
  var rule69 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 42319,
      lowdist: 0,
      titledist: 42319
    };
  }();
  var rule70 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 42315,
      lowdist: 0,
      titledist: 42315
    };
  }();
  var rule71 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -207 | 0,
      lowdist: 0,
      titledist: -207 | 0
    };
  }();
  var rule72 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 42280,
      lowdist: 0,
      titledist: 42280
    };
  }();
  var rule73 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 42308,
      lowdist: 0,
      titledist: 42308
    };
  }();
  var rule74 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -209 | 0,
      lowdist: 0,
      titledist: -209 | 0
    };
  }();
  var rule75 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -211 | 0,
      lowdist: 0,
      titledist: -211 | 0
    };
  }();
  var rule76 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 10743,
      lowdist: 0,
      titledist: 10743
    };
  }();
  var rule77 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 42305,
      lowdist: 0,
      titledist: 42305
    };
  }();
  var rule78 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 10749,
      lowdist: 0,
      titledist: 10749
    };
  }();
  var rule79 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -213 | 0,
      lowdist: 0,
      titledist: -213 | 0
    };
  }();
  var rule80 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -214 | 0,
      lowdist: 0,
      titledist: -214 | 0
    };
  }();
  var rule81 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 10727,
      lowdist: 0,
      titledist: 10727
    };
  }();
  var rule82 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -218 | 0,
      lowdist: 0,
      titledist: -218 | 0
    };
  }();
  var rule83 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 42307,
      lowdist: 0,
      titledist: 42307
    };
  }();
  var rule84 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 42282,
      lowdist: 0,
      titledist: 42282
    };
  }();
  var rule85 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -69 | 0,
      lowdist: 0,
      titledist: -69 | 0
    };
  }();
  var rule86 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -217 | 0,
      lowdist: 0,
      titledist: -217 | 0
    };
  }();
  var rule87 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -71 | 0,
      lowdist: 0,
      titledist: -71 | 0
    };
  }();
  var rule88 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -219 | 0,
      lowdist: 0,
      titledist: -219 | 0
    };
  }();
  var rule89 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 42261,
      lowdist: 0,
      titledist: 42261
    };
  }();
  var rule90 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: 42258,
      lowdist: 0,
      titledist: 42258
    };
  }();
  var rule99 = /* @__PURE__ */ function() {
    return {
      category: gencatLL,
      unicodeCat: NUMCAT_LL.value,
      possible: 1,
      updist: -38 | 0,
      lowdist: 0,
      titledist: -38 | 0
    };
  }();
  var gencatCS = 134217728;
  var rule199 = /* @__PURE__ */ function() {
    return {
      category: gencatCS,
      unicodeCat: NUMCAT_CS.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var gencatCO = 268435456;
  var rule200 = /* @__PURE__ */ function() {
    return {
      category: gencatCO,
      unicodeCat: NUMCAT_CO.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var gencatCF = 65536;
  var rule16 = /* @__PURE__ */ function() {
    return {
      category: gencatCF,
      unicodeCat: NUMCAT_CF.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var gencatCC = 1;
  var rule0 = /* @__PURE__ */ function() {
    return {
      category: gencatCC,
      unicodeCat: NUMCAT_CC.value,
      possible: 0,
      updist: 0,
      lowdist: 0,
      titledist: 0
    };
  }();
  var convchars = [{
    start: 65,
    length: 26,
    convRule: rule9
  }, {
    start: 97,
    length: 26,
    convRule: rule12
  }, {
    start: 181,
    length: 1,
    convRule: rule18
  }, {
    start: 192,
    length: 23,
    convRule: rule9
  }, {
    start: 216,
    length: 7,
    convRule: rule9
  }, {
    start: 224,
    length: 23,
    convRule: rule12
  }, {
    start: 248,
    length: 7,
    convRule: rule12
  }, {
    start: 255,
    length: 1,
    convRule: rule21
  }, {
    start: 256,
    length: 1,
    convRule: rule22
  }, {
    start: 257,
    length: 1,
    convRule: rule23
  }, {
    start: 258,
    length: 1,
    convRule: rule22
  }, {
    start: 259,
    length: 1,
    convRule: rule23
  }, {
    start: 260,
    length: 1,
    convRule: rule22
  }, {
    start: 261,
    length: 1,
    convRule: rule23
  }, {
    start: 262,
    length: 1,
    convRule: rule22
  }, {
    start: 263,
    length: 1,
    convRule: rule23
  }, {
    start: 264,
    length: 1,
    convRule: rule22
  }, {
    start: 265,
    length: 1,
    convRule: rule23
  }, {
    start: 266,
    length: 1,
    convRule: rule22
  }, {
    start: 267,
    length: 1,
    convRule: rule23
  }, {
    start: 268,
    length: 1,
    convRule: rule22
  }, {
    start: 269,
    length: 1,
    convRule: rule23
  }, {
    start: 270,
    length: 1,
    convRule: rule22
  }, {
    start: 271,
    length: 1,
    convRule: rule23
  }, {
    start: 272,
    length: 1,
    convRule: rule22
  }, {
    start: 273,
    length: 1,
    convRule: rule23
  }, {
    start: 274,
    length: 1,
    convRule: rule22
  }, {
    start: 275,
    length: 1,
    convRule: rule23
  }, {
    start: 276,
    length: 1,
    convRule: rule22
  }, {
    start: 277,
    length: 1,
    convRule: rule23
  }, {
    start: 278,
    length: 1,
    convRule: rule22
  }, {
    start: 279,
    length: 1,
    convRule: rule23
  }, {
    start: 280,
    length: 1,
    convRule: rule22
  }, {
    start: 281,
    length: 1,
    convRule: rule23
  }, {
    start: 282,
    length: 1,
    convRule: rule22
  }, {
    start: 283,
    length: 1,
    convRule: rule23
  }, {
    start: 284,
    length: 1,
    convRule: rule22
  }, {
    start: 285,
    length: 1,
    convRule: rule23
  }, {
    start: 286,
    length: 1,
    convRule: rule22
  }, {
    start: 287,
    length: 1,
    convRule: rule23
  }, {
    start: 288,
    length: 1,
    convRule: rule22
  }, {
    start: 289,
    length: 1,
    convRule: rule23
  }, {
    start: 290,
    length: 1,
    convRule: rule22
  }, {
    start: 291,
    length: 1,
    convRule: rule23
  }, {
    start: 292,
    length: 1,
    convRule: rule22
  }, {
    start: 293,
    length: 1,
    convRule: rule23
  }, {
    start: 294,
    length: 1,
    convRule: rule22
  }, {
    start: 295,
    length: 1,
    convRule: rule23
  }, {
    start: 296,
    length: 1,
    convRule: rule22
  }, {
    start: 297,
    length: 1,
    convRule: rule23
  }, {
    start: 298,
    length: 1,
    convRule: rule22
  }, {
    start: 299,
    length: 1,
    convRule: rule23
  }, {
    start: 300,
    length: 1,
    convRule: rule22
  }, {
    start: 301,
    length: 1,
    convRule: rule23
  }, {
    start: 302,
    length: 1,
    convRule: rule22
  }, {
    start: 303,
    length: 1,
    convRule: rule23
  }, {
    start: 304,
    length: 1,
    convRule: rule24
  }, {
    start: 305,
    length: 1,
    convRule: rule25
  }, {
    start: 306,
    length: 1,
    convRule: rule22
  }, {
    start: 307,
    length: 1,
    convRule: rule23
  }, {
    start: 308,
    length: 1,
    convRule: rule22
  }, {
    start: 309,
    length: 1,
    convRule: rule23
  }, {
    start: 310,
    length: 1,
    convRule: rule22
  }, {
    start: 311,
    length: 1,
    convRule: rule23
  }, {
    start: 313,
    length: 1,
    convRule: rule22
  }, {
    start: 314,
    length: 1,
    convRule: rule23
  }, {
    start: 315,
    length: 1,
    convRule: rule22
  }, {
    start: 316,
    length: 1,
    convRule: rule23
  }, {
    start: 317,
    length: 1,
    convRule: rule22
  }, {
    start: 318,
    length: 1,
    convRule: rule23
  }, {
    start: 319,
    length: 1,
    convRule: rule22
  }, {
    start: 320,
    length: 1,
    convRule: rule23
  }, {
    start: 321,
    length: 1,
    convRule: rule22
  }, {
    start: 322,
    length: 1,
    convRule: rule23
  }, {
    start: 323,
    length: 1,
    convRule: rule22
  }, {
    start: 324,
    length: 1,
    convRule: rule23
  }, {
    start: 325,
    length: 1,
    convRule: rule22
  }, {
    start: 326,
    length: 1,
    convRule: rule23
  }, {
    start: 327,
    length: 1,
    convRule: rule22
  }, {
    start: 328,
    length: 1,
    convRule: rule23
  }, {
    start: 330,
    length: 1,
    convRule: rule22
  }, {
    start: 331,
    length: 1,
    convRule: rule23
  }, {
    start: 332,
    length: 1,
    convRule: rule22
  }, {
    start: 333,
    length: 1,
    convRule: rule23
  }, {
    start: 334,
    length: 1,
    convRule: rule22
  }, {
    start: 335,
    length: 1,
    convRule: rule23
  }, {
    start: 336,
    length: 1,
    convRule: rule22
  }, {
    start: 337,
    length: 1,
    convRule: rule23
  }, {
    start: 338,
    length: 1,
    convRule: rule22
  }, {
    start: 339,
    length: 1,
    convRule: rule23
  }, {
    start: 340,
    length: 1,
    convRule: rule22
  }, {
    start: 341,
    length: 1,
    convRule: rule23
  }, {
    start: 342,
    length: 1,
    convRule: rule22
  }, {
    start: 343,
    length: 1,
    convRule: rule23
  }, {
    start: 344,
    length: 1,
    convRule: rule22
  }, {
    start: 345,
    length: 1,
    convRule: rule23
  }, {
    start: 346,
    length: 1,
    convRule: rule22
  }, {
    start: 347,
    length: 1,
    convRule: rule23
  }, {
    start: 348,
    length: 1,
    convRule: rule22
  }, {
    start: 349,
    length: 1,
    convRule: rule23
  }, {
    start: 350,
    length: 1,
    convRule: rule22
  }, {
    start: 351,
    length: 1,
    convRule: rule23
  }, {
    start: 352,
    length: 1,
    convRule: rule22
  }, {
    start: 353,
    length: 1,
    convRule: rule23
  }, {
    start: 354,
    length: 1,
    convRule: rule22
  }, {
    start: 355,
    length: 1,
    convRule: rule23
  }, {
    start: 356,
    length: 1,
    convRule: rule22
  }, {
    start: 357,
    length: 1,
    convRule: rule23
  }, {
    start: 358,
    length: 1,
    convRule: rule22
  }, {
    start: 359,
    length: 1,
    convRule: rule23
  }, {
    start: 360,
    length: 1,
    convRule: rule22
  }, {
    start: 361,
    length: 1,
    convRule: rule23
  }, {
    start: 362,
    length: 1,
    convRule: rule22
  }, {
    start: 363,
    length: 1,
    convRule: rule23
  }, {
    start: 364,
    length: 1,
    convRule: rule22
  }, {
    start: 365,
    length: 1,
    convRule: rule23
  }, {
    start: 366,
    length: 1,
    convRule: rule22
  }, {
    start: 367,
    length: 1,
    convRule: rule23
  }, {
    start: 368,
    length: 1,
    convRule: rule22
  }, {
    start: 369,
    length: 1,
    convRule: rule23
  }, {
    start: 370,
    length: 1,
    convRule: rule22
  }, {
    start: 371,
    length: 1,
    convRule: rule23
  }, {
    start: 372,
    length: 1,
    convRule: rule22
  }, {
    start: 373,
    length: 1,
    convRule: rule23
  }, {
    start: 374,
    length: 1,
    convRule: rule22
  }, {
    start: 375,
    length: 1,
    convRule: rule23
  }, {
    start: 376,
    length: 1,
    convRule: rule26
  }, {
    start: 377,
    length: 1,
    convRule: rule22
  }, {
    start: 378,
    length: 1,
    convRule: rule23
  }, {
    start: 379,
    length: 1,
    convRule: rule22
  }, {
    start: 380,
    length: 1,
    convRule: rule23
  }, {
    start: 381,
    length: 1,
    convRule: rule22
  }, {
    start: 382,
    length: 1,
    convRule: rule23
  }, {
    start: 383,
    length: 1,
    convRule: rule27
  }, {
    start: 384,
    length: 1,
    convRule: rule28
  }, {
    start: 385,
    length: 1,
    convRule: rule29
  }, {
    start: 386,
    length: 1,
    convRule: rule22
  }, {
    start: 387,
    length: 1,
    convRule: rule23
  }, {
    start: 388,
    length: 1,
    convRule: rule22
  }, {
    start: 389,
    length: 1,
    convRule: rule23
  }, {
    start: 390,
    length: 1,
    convRule: rule30
  }, {
    start: 391,
    length: 1,
    convRule: rule22
  }, {
    start: 392,
    length: 1,
    convRule: rule23
  }, {
    start: 393,
    length: 2,
    convRule: rule31
  }, {
    start: 395,
    length: 1,
    convRule: rule22
  }, {
    start: 396,
    length: 1,
    convRule: rule23
  }, {
    start: 398,
    length: 1,
    convRule: rule32
  }, {
    start: 399,
    length: 1,
    convRule: rule33
  }, {
    start: 400,
    length: 1,
    convRule: rule34
  }, {
    start: 401,
    length: 1,
    convRule: rule22
  }, {
    start: 402,
    length: 1,
    convRule: rule23
  }, {
    start: 403,
    length: 1,
    convRule: rule31
  }, {
    start: 404,
    length: 1,
    convRule: rule35
  }, {
    start: 405,
    length: 1,
    convRule: rule36
  }, {
    start: 406,
    length: 1,
    convRule: rule37
  }, {
    start: 407,
    length: 1,
    convRule: rule38
  }, {
    start: 408,
    length: 1,
    convRule: rule22
  }, {
    start: 409,
    length: 1,
    convRule: rule23
  }, {
    start: 410,
    length: 1,
    convRule: rule39
  }, {
    start: 412,
    length: 1,
    convRule: rule37
  }, {
    start: 413,
    length: 1,
    convRule: rule40
  }, {
    start: 414,
    length: 1,
    convRule: rule41
  }, {
    start: 415,
    length: 1,
    convRule: rule42
  }, {
    start: 416,
    length: 1,
    convRule: rule22
  }, {
    start: 417,
    length: 1,
    convRule: rule23
  }, {
    start: 418,
    length: 1,
    convRule: rule22
  }, {
    start: 419,
    length: 1,
    convRule: rule23
  }, {
    start: 420,
    length: 1,
    convRule: rule22
  }, {
    start: 421,
    length: 1,
    convRule: rule23
  }, {
    start: 422,
    length: 1,
    convRule: rule43
  }, {
    start: 423,
    length: 1,
    convRule: rule22
  }, {
    start: 424,
    length: 1,
    convRule: rule23
  }, {
    start: 425,
    length: 1,
    convRule: rule43
  }, {
    start: 428,
    length: 1,
    convRule: rule22
  }, {
    start: 429,
    length: 1,
    convRule: rule23
  }, {
    start: 430,
    length: 1,
    convRule: rule43
  }, {
    start: 431,
    length: 1,
    convRule: rule22
  }, {
    start: 432,
    length: 1,
    convRule: rule23
  }, {
    start: 433,
    length: 2,
    convRule: rule44
  }, {
    start: 435,
    length: 1,
    convRule: rule22
  }, {
    start: 436,
    length: 1,
    convRule: rule23
  }, {
    start: 437,
    length: 1,
    convRule: rule22
  }, {
    start: 438,
    length: 1,
    convRule: rule23
  }, {
    start: 439,
    length: 1,
    convRule: rule45
  }, {
    start: 440,
    length: 1,
    convRule: rule22
  }, {
    start: 441,
    length: 1,
    convRule: rule23
  }, {
    start: 444,
    length: 1,
    convRule: rule22
  }, {
    start: 445,
    length: 1,
    convRule: rule23
  }, {
    start: 447,
    length: 1,
    convRule: rule46
  }, {
    start: 452,
    length: 1,
    convRule: rule47
  }, {
    start: 453,
    length: 1,
    convRule: rule48
  }, {
    start: 454,
    length: 1,
    convRule: rule49
  }, {
    start: 455,
    length: 1,
    convRule: rule47
  }, {
    start: 456,
    length: 1,
    convRule: rule48
  }, {
    start: 457,
    length: 1,
    convRule: rule49
  }, {
    start: 458,
    length: 1,
    convRule: rule47
  }, {
    start: 459,
    length: 1,
    convRule: rule48
  }, {
    start: 460,
    length: 1,
    convRule: rule49
  }, {
    start: 461,
    length: 1,
    convRule: rule22
  }, {
    start: 462,
    length: 1,
    convRule: rule23
  }, {
    start: 463,
    length: 1,
    convRule: rule22
  }, {
    start: 464,
    length: 1,
    convRule: rule23
  }, {
    start: 465,
    length: 1,
    convRule: rule22
  }, {
    start: 466,
    length: 1,
    convRule: rule23
  }, {
    start: 467,
    length: 1,
    convRule: rule22
  }, {
    start: 468,
    length: 1,
    convRule: rule23
  }, {
    start: 469,
    length: 1,
    convRule: rule22
  }, {
    start: 470,
    length: 1,
    convRule: rule23
  }, {
    start: 471,
    length: 1,
    convRule: rule22
  }, {
    start: 472,
    length: 1,
    convRule: rule23
  }, {
    start: 473,
    length: 1,
    convRule: rule22
  }, {
    start: 474,
    length: 1,
    convRule: rule23
  }, {
    start: 475,
    length: 1,
    convRule: rule22
  }, {
    start: 476,
    length: 1,
    convRule: rule23
  }, {
    start: 477,
    length: 1,
    convRule: rule50
  }, {
    start: 478,
    length: 1,
    convRule: rule22
  }, {
    start: 479,
    length: 1,
    convRule: rule23
  }, {
    start: 480,
    length: 1,
    convRule: rule22
  }, {
    start: 481,
    length: 1,
    convRule: rule23
  }, {
    start: 482,
    length: 1,
    convRule: rule22
  }, {
    start: 483,
    length: 1,
    convRule: rule23
  }, {
    start: 484,
    length: 1,
    convRule: rule22
  }, {
    start: 485,
    length: 1,
    convRule: rule23
  }, {
    start: 486,
    length: 1,
    convRule: rule22
  }, {
    start: 487,
    length: 1,
    convRule: rule23
  }, {
    start: 488,
    length: 1,
    convRule: rule22
  }, {
    start: 489,
    length: 1,
    convRule: rule23
  }, {
    start: 490,
    length: 1,
    convRule: rule22
  }, {
    start: 491,
    length: 1,
    convRule: rule23
  }, {
    start: 492,
    length: 1,
    convRule: rule22
  }, {
    start: 493,
    length: 1,
    convRule: rule23
  }, {
    start: 494,
    length: 1,
    convRule: rule22
  }, {
    start: 495,
    length: 1,
    convRule: rule23
  }, {
    start: 497,
    length: 1,
    convRule: rule47
  }, {
    start: 498,
    length: 1,
    convRule: rule48
  }, {
    start: 499,
    length: 1,
    convRule: rule49
  }, {
    start: 500,
    length: 1,
    convRule: rule22
  }, {
    start: 501,
    length: 1,
    convRule: rule23
  }, {
    start: 502,
    length: 1,
    convRule: rule51
  }, {
    start: 503,
    length: 1,
    convRule: rule52
  }, {
    start: 504,
    length: 1,
    convRule: rule22
  }, {
    start: 505,
    length: 1,
    convRule: rule23
  }, {
    start: 506,
    length: 1,
    convRule: rule22
  }, {
    start: 507,
    length: 1,
    convRule: rule23
  }, {
    start: 508,
    length: 1,
    convRule: rule22
  }, {
    start: 509,
    length: 1,
    convRule: rule23
  }, {
    start: 510,
    length: 1,
    convRule: rule22
  }, {
    start: 511,
    length: 1,
    convRule: rule23
  }, {
    start: 512,
    length: 1,
    convRule: rule22
  }, {
    start: 513,
    length: 1,
    convRule: rule23
  }, {
    start: 514,
    length: 1,
    convRule: rule22
  }, {
    start: 515,
    length: 1,
    convRule: rule23
  }, {
    start: 516,
    length: 1,
    convRule: rule22
  }, {
    start: 517,
    length: 1,
    convRule: rule23
  }, {
    start: 518,
    length: 1,
    convRule: rule22
  }, {
    start: 519,
    length: 1,
    convRule: rule23
  }, {
    start: 520,
    length: 1,
    convRule: rule22
  }, {
    start: 521,
    length: 1,
    convRule: rule23
  }, {
    start: 522,
    length: 1,
    convRule: rule22
  }, {
    start: 523,
    length: 1,
    convRule: rule23
  }, {
    start: 524,
    length: 1,
    convRule: rule22
  }, {
    start: 525,
    length: 1,
    convRule: rule23
  }, {
    start: 526,
    length: 1,
    convRule: rule22
  }, {
    start: 527,
    length: 1,
    convRule: rule23
  }, {
    start: 528,
    length: 1,
    convRule: rule22
  }, {
    start: 529,
    length: 1,
    convRule: rule23
  }, {
    start: 530,
    length: 1,
    convRule: rule22
  }, {
    start: 531,
    length: 1,
    convRule: rule23
  }, {
    start: 532,
    length: 1,
    convRule: rule22
  }, {
    start: 533,
    length: 1,
    convRule: rule23
  }, {
    start: 534,
    length: 1,
    convRule: rule22
  }, {
    start: 535,
    length: 1,
    convRule: rule23
  }, {
    start: 536,
    length: 1,
    convRule: rule22
  }, {
    start: 537,
    length: 1,
    convRule: rule23
  }, {
    start: 538,
    length: 1,
    convRule: rule22
  }, {
    start: 539,
    length: 1,
    convRule: rule23
  }, {
    start: 540,
    length: 1,
    convRule: rule22
  }, {
    start: 541,
    length: 1,
    convRule: rule23
  }, {
    start: 542,
    length: 1,
    convRule: rule22
  }, {
    start: 543,
    length: 1,
    convRule: rule23
  }, {
    start: 544,
    length: 1,
    convRule: rule53
  }, {
    start: 546,
    length: 1,
    convRule: rule22
  }, {
    start: 547,
    length: 1,
    convRule: rule23
  }, {
    start: 548,
    length: 1,
    convRule: rule22
  }, {
    start: 549,
    length: 1,
    convRule: rule23
  }, {
    start: 550,
    length: 1,
    convRule: rule22
  }, {
    start: 551,
    length: 1,
    convRule: rule23
  }, {
    start: 552,
    length: 1,
    convRule: rule22
  }, {
    start: 553,
    length: 1,
    convRule: rule23
  }, {
    start: 554,
    length: 1,
    convRule: rule22
  }, {
    start: 555,
    length: 1,
    convRule: rule23
  }, {
    start: 556,
    length: 1,
    convRule: rule22
  }, {
    start: 557,
    length: 1,
    convRule: rule23
  }, {
    start: 558,
    length: 1,
    convRule: rule22
  }, {
    start: 559,
    length: 1,
    convRule: rule23
  }, {
    start: 560,
    length: 1,
    convRule: rule22
  }, {
    start: 561,
    length: 1,
    convRule: rule23
  }, {
    start: 562,
    length: 1,
    convRule: rule22
  }, {
    start: 563,
    length: 1,
    convRule: rule23
  }, {
    start: 570,
    length: 1,
    convRule: rule54
  }, {
    start: 571,
    length: 1,
    convRule: rule22
  }, {
    start: 572,
    length: 1,
    convRule: rule23
  }, {
    start: 573,
    length: 1,
    convRule: rule55
  }, {
    start: 574,
    length: 1,
    convRule: rule56
  }, {
    start: 575,
    length: 2,
    convRule: rule57
  }, {
    start: 577,
    length: 1,
    convRule: rule22
  }, {
    start: 578,
    length: 1,
    convRule: rule23
  }, {
    start: 579,
    length: 1,
    convRule: rule58
  }, {
    start: 580,
    length: 1,
    convRule: rule59
  }, {
    start: 581,
    length: 1,
    convRule: rule60
  }, {
    start: 582,
    length: 1,
    convRule: rule22
  }, {
    start: 583,
    length: 1,
    convRule: rule23
  }, {
    start: 584,
    length: 1,
    convRule: rule22
  }, {
    start: 585,
    length: 1,
    convRule: rule23
  }, {
    start: 586,
    length: 1,
    convRule: rule22
  }, {
    start: 587,
    length: 1,
    convRule: rule23
  }, {
    start: 588,
    length: 1,
    convRule: rule22
  }, {
    start: 589,
    length: 1,
    convRule: rule23
  }, {
    start: 590,
    length: 1,
    convRule: rule22
  }, {
    start: 591,
    length: 1,
    convRule: rule23
  }, {
    start: 592,
    length: 1,
    convRule: rule61
  }, {
    start: 593,
    length: 1,
    convRule: rule62
  }, {
    start: 594,
    length: 1,
    convRule: rule63
  }, {
    start: 595,
    length: 1,
    convRule: rule64
  }, {
    start: 596,
    length: 1,
    convRule: rule65
  }, {
    start: 598,
    length: 2,
    convRule: rule66
  }, {
    start: 601,
    length: 1,
    convRule: rule67
  }, {
    start: 603,
    length: 1,
    convRule: rule68
  }, {
    start: 604,
    length: 1,
    convRule: rule69
  }, {
    start: 608,
    length: 1,
    convRule: rule66
  }, {
    start: 609,
    length: 1,
    convRule: rule70
  }, {
    start: 611,
    length: 1,
    convRule: rule71
  }, {
    start: 613,
    length: 1,
    convRule: rule72
  }, {
    start: 614,
    length: 1,
    convRule: rule73
  }, {
    start: 616,
    length: 1,
    convRule: rule74
  }, {
    start: 617,
    length: 1,
    convRule: rule75
  }, {
    start: 618,
    length: 1,
    convRule: rule73
  }, {
    start: 619,
    length: 1,
    convRule: rule76
  }, {
    start: 620,
    length: 1,
    convRule: rule77
  }, {
    start: 623,
    length: 1,
    convRule: rule75
  }, {
    start: 625,
    length: 1,
    convRule: rule78
  }, {
    start: 626,
    length: 1,
    convRule: rule79
  }, {
    start: 629,
    length: 1,
    convRule: rule80
  }, {
    start: 637,
    length: 1,
    convRule: rule81
  }, {
    start: 640,
    length: 1,
    convRule: rule82
  }, {
    start: 642,
    length: 1,
    convRule: rule83
  }, {
    start: 643,
    length: 1,
    convRule: rule82
  }, {
    start: 647,
    length: 1,
    convRule: rule84
  }, {
    start: 648,
    length: 1,
    convRule: rule82
  }, {
    start: 649,
    length: 1,
    convRule: rule85
  }, {
    start: 650,
    length: 2,
    convRule: rule86
  }, {
    start: 652,
    length: 1,
    convRule: rule87
  }, {
    start: 658,
    length: 1,
    convRule: rule88
  }, {
    start: 669,
    length: 1,
    convRule: rule89
  }, {
    start: 670,
    length: 1,
    convRule: rule90
  }, {
    start: 837,
    length: 1,
    convRule: rule93
  }, {
    start: 880,
    length: 1,
    convRule: rule22
  }, {
    start: 881,
    length: 1,
    convRule: rule23
  }, {
    start: 882,
    length: 1,
    convRule: rule22
  }, {
    start: 883,
    length: 1,
    convRule: rule23
  }, {
    start: 886,
    length: 1,
    convRule: rule22
  }, {
    start: 887,
    length: 1,
    convRule: rule23
  }, {
    start: 891,
    length: 3,
    convRule: rule41
  }, {
    start: 895,
    length: 1,
    convRule: rule94
  }, {
    start: 902,
    length: 1,
    convRule: rule95
  }, {
    start: 904,
    length: 3,
    convRule: rule96
  }, {
    start: 908,
    length: 1,
    convRule: rule97
  }, {
    start: 910,
    length: 2,
    convRule: rule98
  }, {
    start: 913,
    length: 17,
    convRule: rule9
  }, {
    start: 931,
    length: 9,
    convRule: rule9
  }, {
    start: 940,
    length: 1,
    convRule: rule99
  }, {
    start: 941,
    length: 3,
    convRule: rule100
  }, {
    start: 945,
    length: 17,
    convRule: rule12
  }, {
    start: 962,
    length: 1,
    convRule: rule101
  }, {
    start: 963,
    length: 9,
    convRule: rule12
  }, {
    start: 972,
    length: 1,
    convRule: rule102
  }, {
    start: 973,
    length: 2,
    convRule: rule103
  }, {
    start: 975,
    length: 1,
    convRule: rule104
  }, {
    start: 976,
    length: 1,
    convRule: rule105
  }, {
    start: 977,
    length: 1,
    convRule: rule106
  }, {
    start: 981,
    length: 1,
    convRule: rule108
  }, {
    start: 982,
    length: 1,
    convRule: rule109
  }, {
    start: 983,
    length: 1,
    convRule: rule110
  }, {
    start: 984,
    length: 1,
    convRule: rule22
  }, {
    start: 985,
    length: 1,
    convRule: rule23
  }, {
    start: 986,
    length: 1,
    convRule: rule22
  }, {
    start: 987,
    length: 1,
    convRule: rule23
  }, {
    start: 988,
    length: 1,
    convRule: rule22
  }, {
    start: 989,
    length: 1,
    convRule: rule23
  }, {
    start: 990,
    length: 1,
    convRule: rule22
  }, {
    start: 991,
    length: 1,
    convRule: rule23
  }, {
    start: 992,
    length: 1,
    convRule: rule22
  }, {
    start: 993,
    length: 1,
    convRule: rule23
  }, {
    start: 994,
    length: 1,
    convRule: rule22
  }, {
    start: 995,
    length: 1,
    convRule: rule23
  }, {
    start: 996,
    length: 1,
    convRule: rule22
  }, {
    start: 997,
    length: 1,
    convRule: rule23
  }, {
    start: 998,
    length: 1,
    convRule: rule22
  }, {
    start: 999,
    length: 1,
    convRule: rule23
  }, {
    start: 1e3,
    length: 1,
    convRule: rule22
  }, {
    start: 1001,
    length: 1,
    convRule: rule23
  }, {
    start: 1002,
    length: 1,
    convRule: rule22
  }, {
    start: 1003,
    length: 1,
    convRule: rule23
  }, {
    start: 1004,
    length: 1,
    convRule: rule22
  }, {
    start: 1005,
    length: 1,
    convRule: rule23
  }, {
    start: 1006,
    length: 1,
    convRule: rule22
  }, {
    start: 1007,
    length: 1,
    convRule: rule23
  }, {
    start: 1008,
    length: 1,
    convRule: rule111
  }, {
    start: 1009,
    length: 1,
    convRule: rule112
  }, {
    start: 1010,
    length: 1,
    convRule: rule113
  }, {
    start: 1011,
    length: 1,
    convRule: rule114
  }, {
    start: 1012,
    length: 1,
    convRule: rule115
  }, {
    start: 1013,
    length: 1,
    convRule: rule116
  }, {
    start: 1015,
    length: 1,
    convRule: rule22
  }, {
    start: 1016,
    length: 1,
    convRule: rule23
  }, {
    start: 1017,
    length: 1,
    convRule: rule117
  }, {
    start: 1018,
    length: 1,
    convRule: rule22
  }, {
    start: 1019,
    length: 1,
    convRule: rule23
  }, {
    start: 1021,
    length: 3,
    convRule: rule53
  }, {
    start: 1024,
    length: 16,
    convRule: rule118
  }, {
    start: 1040,
    length: 32,
    convRule: rule9
  }, {
    start: 1072,
    length: 32,
    convRule: rule12
  }, {
    start: 1104,
    length: 16,
    convRule: rule112
  }, {
    start: 1120,
    length: 1,
    convRule: rule22
  }, {
    start: 1121,
    length: 1,
    convRule: rule23
  }, {
    start: 1122,
    length: 1,
    convRule: rule22
  }, {
    start: 1123,
    length: 1,
    convRule: rule23
  }, {
    start: 1124,
    length: 1,
    convRule: rule22
  }, {
    start: 1125,
    length: 1,
    convRule: rule23
  }, {
    start: 1126,
    length: 1,
    convRule: rule22
  }, {
    start: 1127,
    length: 1,
    convRule: rule23
  }, {
    start: 1128,
    length: 1,
    convRule: rule22
  }, {
    start: 1129,
    length: 1,
    convRule: rule23
  }, {
    start: 1130,
    length: 1,
    convRule: rule22
  }, {
    start: 1131,
    length: 1,
    convRule: rule23
  }, {
    start: 1132,
    length: 1,
    convRule: rule22
  }, {
    start: 1133,
    length: 1,
    convRule: rule23
  }, {
    start: 1134,
    length: 1,
    convRule: rule22
  }, {
    start: 1135,
    length: 1,
    convRule: rule23
  }, {
    start: 1136,
    length: 1,
    convRule: rule22
  }, {
    start: 1137,
    length: 1,
    convRule: rule23
  }, {
    start: 1138,
    length: 1,
    convRule: rule22
  }, {
    start: 1139,
    length: 1,
    convRule: rule23
  }, {
    start: 1140,
    length: 1,
    convRule: rule22
  }, {
    start: 1141,
    length: 1,
    convRule: rule23
  }, {
    start: 1142,
    length: 1,
    convRule: rule22
  }, {
    start: 1143,
    length: 1,
    convRule: rule23
  }, {
    start: 1144,
    length: 1,
    convRule: rule22
  }, {
    start: 1145,
    length: 1,
    convRule: rule23
  }, {
    start: 1146,
    length: 1,
    convRule: rule22
  }, {
    start: 1147,
    length: 1,
    convRule: rule23
  }, {
    start: 1148,
    length: 1,
    convRule: rule22
  }, {
    start: 1149,
    length: 1,
    convRule: rule23
  }, {
    start: 1150,
    length: 1,
    convRule: rule22
  }, {
    start: 1151,
    length: 1,
    convRule: rule23
  }, {
    start: 1152,
    length: 1,
    convRule: rule22
  }, {
    start: 1153,
    length: 1,
    convRule: rule23
  }, {
    start: 1162,
    length: 1,
    convRule: rule22
  }, {
    start: 1163,
    length: 1,
    convRule: rule23
  }, {
    start: 1164,
    length: 1,
    convRule: rule22
  }, {
    start: 1165,
    length: 1,
    convRule: rule23
  }, {
    start: 1166,
    length: 1,
    convRule: rule22
  }, {
    start: 1167,
    length: 1,
    convRule: rule23
  }, {
    start: 1168,
    length: 1,
    convRule: rule22
  }, {
    start: 1169,
    length: 1,
    convRule: rule23
  }, {
    start: 1170,
    length: 1,
    convRule: rule22
  }, {
    start: 1171,
    length: 1,
    convRule: rule23
  }, {
    start: 1172,
    length: 1,
    convRule: rule22
  }, {
    start: 1173,
    length: 1,
    convRule: rule23
  }, {
    start: 1174,
    length: 1,
    convRule: rule22
  }, {
    start: 1175,
    length: 1,
    convRule: rule23
  }, {
    start: 1176,
    length: 1,
    convRule: rule22
  }, {
    start: 1177,
    length: 1,
    convRule: rule23
  }, {
    start: 1178,
    length: 1,
    convRule: rule22
  }, {
    start: 1179,
    length: 1,
    convRule: rule23
  }, {
    start: 1180,
    length: 1,
    convRule: rule22
  }, {
    start: 1181,
    length: 1,
    convRule: rule23
  }, {
    start: 1182,
    length: 1,
    convRule: rule22
  }, {
    start: 1183,
    length: 1,
    convRule: rule23
  }, {
    start: 1184,
    length: 1,
    convRule: rule22
  }, {
    start: 1185,
    length: 1,
    convRule: rule23
  }, {
    start: 1186,
    length: 1,
    convRule: rule22
  }, {
    start: 1187,
    length: 1,
    convRule: rule23
  }, {
    start: 1188,
    length: 1,
    convRule: rule22
  }, {
    start: 1189,
    length: 1,
    convRule: rule23
  }, {
    start: 1190,
    length: 1,
    convRule: rule22
  }, {
    start: 1191,
    length: 1,
    convRule: rule23
  }, {
    start: 1192,
    length: 1,
    convRule: rule22
  }, {
    start: 1193,
    length: 1,
    convRule: rule23
  }, {
    start: 1194,
    length: 1,
    convRule: rule22
  }, {
    start: 1195,
    length: 1,
    convRule: rule23
  }, {
    start: 1196,
    length: 1,
    convRule: rule22
  }, {
    start: 1197,
    length: 1,
    convRule: rule23
  }, {
    start: 1198,
    length: 1,
    convRule: rule22
  }, {
    start: 1199,
    length: 1,
    convRule: rule23
  }, {
    start: 1200,
    length: 1,
    convRule: rule22
  }, {
    start: 1201,
    length: 1,
    convRule: rule23
  }, {
    start: 1202,
    length: 1,
    convRule: rule22
  }, {
    start: 1203,
    length: 1,
    convRule: rule23
  }, {
    start: 1204,
    length: 1,
    convRule: rule22
  }, {
    start: 1205,
    length: 1,
    convRule: rule23
  }, {
    start: 1206,
    length: 1,
    convRule: rule22
  }, {
    start: 1207,
    length: 1,
    convRule: rule23
  }, {
    start: 1208,
    length: 1,
    convRule: rule22
  }, {
    start: 1209,
    length: 1,
    convRule: rule23
  }, {
    start: 1210,
    length: 1,
    convRule: rule22
  }, {
    start: 1211,
    length: 1,
    convRule: rule23
  }, {
    start: 1212,
    length: 1,
    convRule: rule22
  }, {
    start: 1213,
    length: 1,
    convRule: rule23
  }, {
    start: 1214,
    length: 1,
    convRule: rule22
  }, {
    start: 1215,
    length: 1,
    convRule: rule23
  }, {
    start: 1216,
    length: 1,
    convRule: rule120
  }, {
    start: 1217,
    length: 1,
    convRule: rule22
  }, {
    start: 1218,
    length: 1,
    convRule: rule23
  }, {
    start: 1219,
    length: 1,
    convRule: rule22
  }, {
    start: 1220,
    length: 1,
    convRule: rule23
  }, {
    start: 1221,
    length: 1,
    convRule: rule22
  }, {
    start: 1222,
    length: 1,
    convRule: rule23
  }, {
    start: 1223,
    length: 1,
    convRule: rule22
  }, {
    start: 1224,
    length: 1,
    convRule: rule23
  }, {
    start: 1225,
    length: 1,
    convRule: rule22
  }, {
    start: 1226,
    length: 1,
    convRule: rule23
  }, {
    start: 1227,
    length: 1,
    convRule: rule22
  }, {
    start: 1228,
    length: 1,
    convRule: rule23
  }, {
    start: 1229,
    length: 1,
    convRule: rule22
  }, {
    start: 1230,
    length: 1,
    convRule: rule23
  }, {
    start: 1231,
    length: 1,
    convRule: rule121
  }, {
    start: 1232,
    length: 1,
    convRule: rule22
  }, {
    start: 1233,
    length: 1,
    convRule: rule23
  }, {
    start: 1234,
    length: 1,
    convRule: rule22
  }, {
    start: 1235,
    length: 1,
    convRule: rule23
  }, {
    start: 1236,
    length: 1,
    convRule: rule22
  }, {
    start: 1237,
    length: 1,
    convRule: rule23
  }, {
    start: 1238,
    length: 1,
    convRule: rule22
  }, {
    start: 1239,
    length: 1,
    convRule: rule23
  }, {
    start: 1240,
    length: 1,
    convRule: rule22
  }, {
    start: 1241,
    length: 1,
    convRule: rule23
  }, {
    start: 1242,
    length: 1,
    convRule: rule22
  }, {
    start: 1243,
    length: 1,
    convRule: rule23
  }, {
    start: 1244,
    length: 1,
    convRule: rule22
  }, {
    start: 1245,
    length: 1,
    convRule: rule23
  }, {
    start: 1246,
    length: 1,
    convRule: rule22
  }, {
    start: 1247,
    length: 1,
    convRule: rule23
  }, {
    start: 1248,
    length: 1,
    convRule: rule22
  }, {
    start: 1249,
    length: 1,
    convRule: rule23
  }, {
    start: 1250,
    length: 1,
    convRule: rule22
  }, {
    start: 1251,
    length: 1,
    convRule: rule23
  }, {
    start: 1252,
    length: 1,
    convRule: rule22
  }, {
    start: 1253,
    length: 1,
    convRule: rule23
  }, {
    start: 1254,
    length: 1,
    convRule: rule22
  }, {
    start: 1255,
    length: 1,
    convRule: rule23
  }, {
    start: 1256,
    length: 1,
    convRule: rule22
  }, {
    start: 1257,
    length: 1,
    convRule: rule23
  }, {
    start: 1258,
    length: 1,
    convRule: rule22
  }, {
    start: 1259,
    length: 1,
    convRule: rule23
  }, {
    start: 1260,
    length: 1,
    convRule: rule22
  }, {
    start: 1261,
    length: 1,
    convRule: rule23
  }, {
    start: 1262,
    length: 1,
    convRule: rule22
  }, {
    start: 1263,
    length: 1,
    convRule: rule23
  }, {
    start: 1264,
    length: 1,
    convRule: rule22
  }, {
    start: 1265,
    length: 1,
    convRule: rule23
  }, {
    start: 1266,
    length: 1,
    convRule: rule22
  }, {
    start: 1267,
    length: 1,
    convRule: rule23
  }, {
    start: 1268,
    length: 1,
    convRule: rule22
  }, {
    start: 1269,
    length: 1,
    convRule: rule23
  }, {
    start: 1270,
    length: 1,
    convRule: rule22
  }, {
    start: 1271,
    length: 1,
    convRule: rule23
  }, {
    start: 1272,
    length: 1,
    convRule: rule22
  }, {
    start: 1273,
    length: 1,
    convRule: rule23
  }, {
    start: 1274,
    length: 1,
    convRule: rule22
  }, {
    start: 1275,
    length: 1,
    convRule: rule23
  }, {
    start: 1276,
    length: 1,
    convRule: rule22
  }, {
    start: 1277,
    length: 1,
    convRule: rule23
  }, {
    start: 1278,
    length: 1,
    convRule: rule22
  }, {
    start: 1279,
    length: 1,
    convRule: rule23
  }, {
    start: 1280,
    length: 1,
    convRule: rule22
  }, {
    start: 1281,
    length: 1,
    convRule: rule23
  }, {
    start: 1282,
    length: 1,
    convRule: rule22
  }, {
    start: 1283,
    length: 1,
    convRule: rule23
  }, {
    start: 1284,
    length: 1,
    convRule: rule22
  }, {
    start: 1285,
    length: 1,
    convRule: rule23
  }, {
    start: 1286,
    length: 1,
    convRule: rule22
  }, {
    start: 1287,
    length: 1,
    convRule: rule23
  }, {
    start: 1288,
    length: 1,
    convRule: rule22
  }, {
    start: 1289,
    length: 1,
    convRule: rule23
  }, {
    start: 1290,
    length: 1,
    convRule: rule22
  }, {
    start: 1291,
    length: 1,
    convRule: rule23
  }, {
    start: 1292,
    length: 1,
    convRule: rule22
  }, {
    start: 1293,
    length: 1,
    convRule: rule23
  }, {
    start: 1294,
    length: 1,
    convRule: rule22
  }, {
    start: 1295,
    length: 1,
    convRule: rule23
  }, {
    start: 1296,
    length: 1,
    convRule: rule22
  }, {
    start: 1297,
    length: 1,
    convRule: rule23
  }, {
    start: 1298,
    length: 1,
    convRule: rule22
  }, {
    start: 1299,
    length: 1,
    convRule: rule23
  }, {
    start: 1300,
    length: 1,
    convRule: rule22
  }, {
    start: 1301,
    length: 1,
    convRule: rule23
  }, {
    start: 1302,
    length: 1,
    convRule: rule22
  }, {
    start: 1303,
    length: 1,
    convRule: rule23
  }, {
    start: 1304,
    length: 1,
    convRule: rule22
  }, {
    start: 1305,
    length: 1,
    convRule: rule23
  }, {
    start: 1306,
    length: 1,
    convRule: rule22
  }, {
    start: 1307,
    length: 1,
    convRule: rule23
  }, {
    start: 1308,
    length: 1,
    convRule: rule22
  }, {
    start: 1309,
    length: 1,
    convRule: rule23
  }, {
    start: 1310,
    length: 1,
    convRule: rule22
  }, {
    start: 1311,
    length: 1,
    convRule: rule23
  }, {
    start: 1312,
    length: 1,
    convRule: rule22
  }, {
    start: 1313,
    length: 1,
    convRule: rule23
  }, {
    start: 1314,
    length: 1,
    convRule: rule22
  }, {
    start: 1315,
    length: 1,
    convRule: rule23
  }, {
    start: 1316,
    length: 1,
    convRule: rule22
  }, {
    start: 1317,
    length: 1,
    convRule: rule23
  }, {
    start: 1318,
    length: 1,
    convRule: rule22
  }, {
    start: 1319,
    length: 1,
    convRule: rule23
  }, {
    start: 1320,
    length: 1,
    convRule: rule22
  }, {
    start: 1321,
    length: 1,
    convRule: rule23
  }, {
    start: 1322,
    length: 1,
    convRule: rule22
  }, {
    start: 1323,
    length: 1,
    convRule: rule23
  }, {
    start: 1324,
    length: 1,
    convRule: rule22
  }, {
    start: 1325,
    length: 1,
    convRule: rule23
  }, {
    start: 1326,
    length: 1,
    convRule: rule22
  }, {
    start: 1327,
    length: 1,
    convRule: rule23
  }, {
    start: 1329,
    length: 38,
    convRule: rule122
  }, {
    start: 1377,
    length: 38,
    convRule: rule123
  }, {
    start: 4256,
    length: 38,
    convRule: rule125
  }, {
    start: 4295,
    length: 1,
    convRule: rule125
  }, {
    start: 4301,
    length: 1,
    convRule: rule125
  }, {
    start: 4304,
    length: 43,
    convRule: rule126
  }, {
    start: 4349,
    length: 3,
    convRule: rule126
  }, {
    start: 5024,
    length: 80,
    convRule: rule127
  }, {
    start: 5104,
    length: 6,
    convRule: rule104
  }, {
    start: 5112,
    length: 6,
    convRule: rule110
  }, {
    start: 7296,
    length: 1,
    convRule: rule129
  }, {
    start: 7297,
    length: 1,
    convRule: rule130
  }, {
    start: 7298,
    length: 1,
    convRule: rule131
  }, {
    start: 7299,
    length: 2,
    convRule: rule132
  }, {
    start: 7301,
    length: 1,
    convRule: rule133
  }, {
    start: 7302,
    length: 1,
    convRule: rule134
  }, {
    start: 7303,
    length: 1,
    convRule: rule135
  }, {
    start: 7304,
    length: 1,
    convRule: rule136
  }, {
    start: 7312,
    length: 43,
    convRule: rule137
  }, {
    start: 7357,
    length: 3,
    convRule: rule137
  }, {
    start: 7545,
    length: 1,
    convRule: rule138
  }, {
    start: 7549,
    length: 1,
    convRule: rule139
  }, {
    start: 7566,
    length: 1,
    convRule: rule140
  }, {
    start: 7680,
    length: 1,
    convRule: rule22
  }, {
    start: 7681,
    length: 1,
    convRule: rule23
  }, {
    start: 7682,
    length: 1,
    convRule: rule22
  }, {
    start: 7683,
    length: 1,
    convRule: rule23
  }, {
    start: 7684,
    length: 1,
    convRule: rule22
  }, {
    start: 7685,
    length: 1,
    convRule: rule23
  }, {
    start: 7686,
    length: 1,
    convRule: rule22
  }, {
    start: 7687,
    length: 1,
    convRule: rule23
  }, {
    start: 7688,
    length: 1,
    convRule: rule22
  }, {
    start: 7689,
    length: 1,
    convRule: rule23
  }, {
    start: 7690,
    length: 1,
    convRule: rule22
  }, {
    start: 7691,
    length: 1,
    convRule: rule23
  }, {
    start: 7692,
    length: 1,
    convRule: rule22
  }, {
    start: 7693,
    length: 1,
    convRule: rule23
  }, {
    start: 7694,
    length: 1,
    convRule: rule22
  }, {
    start: 7695,
    length: 1,
    convRule: rule23
  }, {
    start: 7696,
    length: 1,
    convRule: rule22
  }, {
    start: 7697,
    length: 1,
    convRule: rule23
  }, {
    start: 7698,
    length: 1,
    convRule: rule22
  }, {
    start: 7699,
    length: 1,
    convRule: rule23
  }, {
    start: 7700,
    length: 1,
    convRule: rule22
  }, {
    start: 7701,
    length: 1,
    convRule: rule23
  }, {
    start: 7702,
    length: 1,
    convRule: rule22
  }, {
    start: 7703,
    length: 1,
    convRule: rule23
  }, {
    start: 7704,
    length: 1,
    convRule: rule22
  }, {
    start: 7705,
    length: 1,
    convRule: rule23
  }, {
    start: 7706,
    length: 1,
    convRule: rule22
  }, {
    start: 7707,
    length: 1,
    convRule: rule23
  }, {
    start: 7708,
    length: 1,
    convRule: rule22
  }, {
    start: 7709,
    length: 1,
    convRule: rule23
  }, {
    start: 7710,
    length: 1,
    convRule: rule22
  }, {
    start: 7711,
    length: 1,
    convRule: rule23
  }, {
    start: 7712,
    length: 1,
    convRule: rule22
  }, {
    start: 7713,
    length: 1,
    convRule: rule23
  }, {
    start: 7714,
    length: 1,
    convRule: rule22
  }, {
    start: 7715,
    length: 1,
    convRule: rule23
  }, {
    start: 7716,
    length: 1,
    convRule: rule22
  }, {
    start: 7717,
    length: 1,
    convRule: rule23
  }, {
    start: 7718,
    length: 1,
    convRule: rule22
  }, {
    start: 7719,
    length: 1,
    convRule: rule23
  }, {
    start: 7720,
    length: 1,
    convRule: rule22
  }, {
    start: 7721,
    length: 1,
    convRule: rule23
  }, {
    start: 7722,
    length: 1,
    convRule: rule22
  }, {
    start: 7723,
    length: 1,
    convRule: rule23
  }, {
    start: 7724,
    length: 1,
    convRule: rule22
  }, {
    start: 7725,
    length: 1,
    convRule: rule23
  }, {
    start: 7726,
    length: 1,
    convRule: rule22
  }, {
    start: 7727,
    length: 1,
    convRule: rule23
  }, {
    start: 7728,
    length: 1,
    convRule: rule22
  }, {
    start: 7729,
    length: 1,
    convRule: rule23
  }, {
    start: 7730,
    length: 1,
    convRule: rule22
  }, {
    start: 7731,
    length: 1,
    convRule: rule23
  }, {
    start: 7732,
    length: 1,
    convRule: rule22
  }, {
    start: 7733,
    length: 1,
    convRule: rule23
  }, {
    start: 7734,
    length: 1,
    convRule: rule22
  }, {
    start: 7735,
    length: 1,
    convRule: rule23
  }, {
    start: 7736,
    length: 1,
    convRule: rule22
  }, {
    start: 7737,
    length: 1,
    convRule: rule23
  }, {
    start: 7738,
    length: 1,
    convRule: rule22
  }, {
    start: 7739,
    length: 1,
    convRule: rule23
  }, {
    start: 7740,
    length: 1,
    convRule: rule22
  }, {
    start: 7741,
    length: 1,
    convRule: rule23
  }, {
    start: 7742,
    length: 1,
    convRule: rule22
  }, {
    start: 7743,
    length: 1,
    convRule: rule23
  }, {
    start: 7744,
    length: 1,
    convRule: rule22
  }, {
    start: 7745,
    length: 1,
    convRule: rule23
  }, {
    start: 7746,
    length: 1,
    convRule: rule22
  }, {
    start: 7747,
    length: 1,
    convRule: rule23
  }, {
    start: 7748,
    length: 1,
    convRule: rule22
  }, {
    start: 7749,
    length: 1,
    convRule: rule23
  }, {
    start: 7750,
    length: 1,
    convRule: rule22
  }, {
    start: 7751,
    length: 1,
    convRule: rule23
  }, {
    start: 7752,
    length: 1,
    convRule: rule22
  }, {
    start: 7753,
    length: 1,
    convRule: rule23
  }, {
    start: 7754,
    length: 1,
    convRule: rule22
  }, {
    start: 7755,
    length: 1,
    convRule: rule23
  }, {
    start: 7756,
    length: 1,
    convRule: rule22
  }, {
    start: 7757,
    length: 1,
    convRule: rule23
  }, {
    start: 7758,
    length: 1,
    convRule: rule22
  }, {
    start: 7759,
    length: 1,
    convRule: rule23
  }, {
    start: 7760,
    length: 1,
    convRule: rule22
  }, {
    start: 7761,
    length: 1,
    convRule: rule23
  }, {
    start: 7762,
    length: 1,
    convRule: rule22
  }, {
    start: 7763,
    length: 1,
    convRule: rule23
  }, {
    start: 7764,
    length: 1,
    convRule: rule22
  }, {
    start: 7765,
    length: 1,
    convRule: rule23
  }, {
    start: 7766,
    length: 1,
    convRule: rule22
  }, {
    start: 7767,
    length: 1,
    convRule: rule23
  }, {
    start: 7768,
    length: 1,
    convRule: rule22
  }, {
    start: 7769,
    length: 1,
    convRule: rule23
  }, {
    start: 7770,
    length: 1,
    convRule: rule22
  }, {
    start: 7771,
    length: 1,
    convRule: rule23
  }, {
    start: 7772,
    length: 1,
    convRule: rule22
  }, {
    start: 7773,
    length: 1,
    convRule: rule23
  }, {
    start: 7774,
    length: 1,
    convRule: rule22
  }, {
    start: 7775,
    length: 1,
    convRule: rule23
  }, {
    start: 7776,
    length: 1,
    convRule: rule22
  }, {
    start: 7777,
    length: 1,
    convRule: rule23
  }, {
    start: 7778,
    length: 1,
    convRule: rule22
  }, {
    start: 7779,
    length: 1,
    convRule: rule23
  }, {
    start: 7780,
    length: 1,
    convRule: rule22
  }, {
    start: 7781,
    length: 1,
    convRule: rule23
  }, {
    start: 7782,
    length: 1,
    convRule: rule22
  }, {
    start: 7783,
    length: 1,
    convRule: rule23
  }, {
    start: 7784,
    length: 1,
    convRule: rule22
  }, {
    start: 7785,
    length: 1,
    convRule: rule23
  }, {
    start: 7786,
    length: 1,
    convRule: rule22
  }, {
    start: 7787,
    length: 1,
    convRule: rule23
  }, {
    start: 7788,
    length: 1,
    convRule: rule22
  }, {
    start: 7789,
    length: 1,
    convRule: rule23
  }, {
    start: 7790,
    length: 1,
    convRule: rule22
  }, {
    start: 7791,
    length: 1,
    convRule: rule23
  }, {
    start: 7792,
    length: 1,
    convRule: rule22
  }, {
    start: 7793,
    length: 1,
    convRule: rule23
  }, {
    start: 7794,
    length: 1,
    convRule: rule22
  }, {
    start: 7795,
    length: 1,
    convRule: rule23
  }, {
    start: 7796,
    length: 1,
    convRule: rule22
  }, {
    start: 7797,
    length: 1,
    convRule: rule23
  }, {
    start: 7798,
    length: 1,
    convRule: rule22
  }, {
    start: 7799,
    length: 1,
    convRule: rule23
  }, {
    start: 7800,
    length: 1,
    convRule: rule22
  }, {
    start: 7801,
    length: 1,
    convRule: rule23
  }, {
    start: 7802,
    length: 1,
    convRule: rule22
  }, {
    start: 7803,
    length: 1,
    convRule: rule23
  }, {
    start: 7804,
    length: 1,
    convRule: rule22
  }, {
    start: 7805,
    length: 1,
    convRule: rule23
  }, {
    start: 7806,
    length: 1,
    convRule: rule22
  }, {
    start: 7807,
    length: 1,
    convRule: rule23
  }, {
    start: 7808,
    length: 1,
    convRule: rule22
  }, {
    start: 7809,
    length: 1,
    convRule: rule23
  }, {
    start: 7810,
    length: 1,
    convRule: rule22
  }, {
    start: 7811,
    length: 1,
    convRule: rule23
  }, {
    start: 7812,
    length: 1,
    convRule: rule22
  }, {
    start: 7813,
    length: 1,
    convRule: rule23
  }, {
    start: 7814,
    length: 1,
    convRule: rule22
  }, {
    start: 7815,
    length: 1,
    convRule: rule23
  }, {
    start: 7816,
    length: 1,
    convRule: rule22
  }, {
    start: 7817,
    length: 1,
    convRule: rule23
  }, {
    start: 7818,
    length: 1,
    convRule: rule22
  }, {
    start: 7819,
    length: 1,
    convRule: rule23
  }, {
    start: 7820,
    length: 1,
    convRule: rule22
  }, {
    start: 7821,
    length: 1,
    convRule: rule23
  }, {
    start: 7822,
    length: 1,
    convRule: rule22
  }, {
    start: 7823,
    length: 1,
    convRule: rule23
  }, {
    start: 7824,
    length: 1,
    convRule: rule22
  }, {
    start: 7825,
    length: 1,
    convRule: rule23
  }, {
    start: 7826,
    length: 1,
    convRule: rule22
  }, {
    start: 7827,
    length: 1,
    convRule: rule23
  }, {
    start: 7828,
    length: 1,
    convRule: rule22
  }, {
    start: 7829,
    length: 1,
    convRule: rule23
  }, {
    start: 7835,
    length: 1,
    convRule: rule141
  }, {
    start: 7838,
    length: 1,
    convRule: rule142
  }, {
    start: 7840,
    length: 1,
    convRule: rule22
  }, {
    start: 7841,
    length: 1,
    convRule: rule23
  }, {
    start: 7842,
    length: 1,
    convRule: rule22
  }, {
    start: 7843,
    length: 1,
    convRule: rule23
  }, {
    start: 7844,
    length: 1,
    convRule: rule22
  }, {
    start: 7845,
    length: 1,
    convRule: rule23
  }, {
    start: 7846,
    length: 1,
    convRule: rule22
  }, {
    start: 7847,
    length: 1,
    convRule: rule23
  }, {
    start: 7848,
    length: 1,
    convRule: rule22
  }, {
    start: 7849,
    length: 1,
    convRule: rule23
  }, {
    start: 7850,
    length: 1,
    convRule: rule22
  }, {
    start: 7851,
    length: 1,
    convRule: rule23
  }, {
    start: 7852,
    length: 1,
    convRule: rule22
  }, {
    start: 7853,
    length: 1,
    convRule: rule23
  }, {
    start: 7854,
    length: 1,
    convRule: rule22
  }, {
    start: 7855,
    length: 1,
    convRule: rule23
  }, {
    start: 7856,
    length: 1,
    convRule: rule22
  }, {
    start: 7857,
    length: 1,
    convRule: rule23
  }, {
    start: 7858,
    length: 1,
    convRule: rule22
  }, {
    start: 7859,
    length: 1,
    convRule: rule23
  }, {
    start: 7860,
    length: 1,
    convRule: rule22
  }, {
    start: 7861,
    length: 1,
    convRule: rule23
  }, {
    start: 7862,
    length: 1,
    convRule: rule22
  }, {
    start: 7863,
    length: 1,
    convRule: rule23
  }, {
    start: 7864,
    length: 1,
    convRule: rule22
  }, {
    start: 7865,
    length: 1,
    convRule: rule23
  }, {
    start: 7866,
    length: 1,
    convRule: rule22
  }, {
    start: 7867,
    length: 1,
    convRule: rule23
  }, {
    start: 7868,
    length: 1,
    convRule: rule22
  }, {
    start: 7869,
    length: 1,
    convRule: rule23
  }, {
    start: 7870,
    length: 1,
    convRule: rule22
  }, {
    start: 7871,
    length: 1,
    convRule: rule23
  }, {
    start: 7872,
    length: 1,
    convRule: rule22
  }, {
    start: 7873,
    length: 1,
    convRule: rule23
  }, {
    start: 7874,
    length: 1,
    convRule: rule22
  }, {
    start: 7875,
    length: 1,
    convRule: rule23
  }, {
    start: 7876,
    length: 1,
    convRule: rule22
  }, {
    start: 7877,
    length: 1,
    convRule: rule23
  }, {
    start: 7878,
    length: 1,
    convRule: rule22
  }, {
    start: 7879,
    length: 1,
    convRule: rule23
  }, {
    start: 7880,
    length: 1,
    convRule: rule22
  }, {
    start: 7881,
    length: 1,
    convRule: rule23
  }, {
    start: 7882,
    length: 1,
    convRule: rule22
  }, {
    start: 7883,
    length: 1,
    convRule: rule23
  }, {
    start: 7884,
    length: 1,
    convRule: rule22
  }, {
    start: 7885,
    length: 1,
    convRule: rule23
  }, {
    start: 7886,
    length: 1,
    convRule: rule22
  }, {
    start: 7887,
    length: 1,
    convRule: rule23
  }, {
    start: 7888,
    length: 1,
    convRule: rule22
  }, {
    start: 7889,
    length: 1,
    convRule: rule23
  }, {
    start: 7890,
    length: 1,
    convRule: rule22
  }, {
    start: 7891,
    length: 1,
    convRule: rule23
  }, {
    start: 7892,
    length: 1,
    convRule: rule22
  }, {
    start: 7893,
    length: 1,
    convRule: rule23
  }, {
    start: 7894,
    length: 1,
    convRule: rule22
  }, {
    start: 7895,
    length: 1,
    convRule: rule23
  }, {
    start: 7896,
    length: 1,
    convRule: rule22
  }, {
    start: 7897,
    length: 1,
    convRule: rule23
  }, {
    start: 7898,
    length: 1,
    convRule: rule22
  }, {
    start: 7899,
    length: 1,
    convRule: rule23
  }, {
    start: 7900,
    length: 1,
    convRule: rule22
  }, {
    start: 7901,
    length: 1,
    convRule: rule23
  }, {
    start: 7902,
    length: 1,
    convRule: rule22
  }, {
    start: 7903,
    length: 1,
    convRule: rule23
  }, {
    start: 7904,
    length: 1,
    convRule: rule22
  }, {
    start: 7905,
    length: 1,
    convRule: rule23
  }, {
    start: 7906,
    length: 1,
    convRule: rule22
  }, {
    start: 7907,
    length: 1,
    convRule: rule23
  }, {
    start: 7908,
    length: 1,
    convRule: rule22
  }, {
    start: 7909,
    length: 1,
    convRule: rule23
  }, {
    start: 7910,
    length: 1,
    convRule: rule22
  }, {
    start: 7911,
    length: 1,
    convRule: rule23
  }, {
    start: 7912,
    length: 1,
    convRule: rule22
  }, {
    start: 7913,
    length: 1,
    convRule: rule23
  }, {
    start: 7914,
    length: 1,
    convRule: rule22
  }, {
    start: 7915,
    length: 1,
    convRule: rule23
  }, {
    start: 7916,
    length: 1,
    convRule: rule22
  }, {
    start: 7917,
    length: 1,
    convRule: rule23
  }, {
    start: 7918,
    length: 1,
    convRule: rule22
  }, {
    start: 7919,
    length: 1,
    convRule: rule23
  }, {
    start: 7920,
    length: 1,
    convRule: rule22
  }, {
    start: 7921,
    length: 1,
    convRule: rule23
  }, {
    start: 7922,
    length: 1,
    convRule: rule22
  }, {
    start: 7923,
    length: 1,
    convRule: rule23
  }, {
    start: 7924,
    length: 1,
    convRule: rule22
  }, {
    start: 7925,
    length: 1,
    convRule: rule23
  }, {
    start: 7926,
    length: 1,
    convRule: rule22
  }, {
    start: 7927,
    length: 1,
    convRule: rule23
  }, {
    start: 7928,
    length: 1,
    convRule: rule22
  }, {
    start: 7929,
    length: 1,
    convRule: rule23
  }, {
    start: 7930,
    length: 1,
    convRule: rule22
  }, {
    start: 7931,
    length: 1,
    convRule: rule23
  }, {
    start: 7932,
    length: 1,
    convRule: rule22
  }, {
    start: 7933,
    length: 1,
    convRule: rule23
  }, {
    start: 7934,
    length: 1,
    convRule: rule22
  }, {
    start: 7935,
    length: 1,
    convRule: rule23
  }, {
    start: 7936,
    length: 8,
    convRule: rule143
  }, {
    start: 7944,
    length: 8,
    convRule: rule144
  }, {
    start: 7952,
    length: 6,
    convRule: rule143
  }, {
    start: 7960,
    length: 6,
    convRule: rule144
  }, {
    start: 7968,
    length: 8,
    convRule: rule143
  }, {
    start: 7976,
    length: 8,
    convRule: rule144
  }, {
    start: 7984,
    length: 8,
    convRule: rule143
  }, {
    start: 7992,
    length: 8,
    convRule: rule144
  }, {
    start: 8e3,
    length: 6,
    convRule: rule143
  }, {
    start: 8008,
    length: 6,
    convRule: rule144
  }, {
    start: 8017,
    length: 1,
    convRule: rule143
  }, {
    start: 8019,
    length: 1,
    convRule: rule143
  }, {
    start: 8021,
    length: 1,
    convRule: rule143
  }, {
    start: 8023,
    length: 1,
    convRule: rule143
  }, {
    start: 8025,
    length: 1,
    convRule: rule144
  }, {
    start: 8027,
    length: 1,
    convRule: rule144
  }, {
    start: 8029,
    length: 1,
    convRule: rule144
  }, {
    start: 8031,
    length: 1,
    convRule: rule144
  }, {
    start: 8032,
    length: 8,
    convRule: rule143
  }, {
    start: 8040,
    length: 8,
    convRule: rule144
  }, {
    start: 8048,
    length: 2,
    convRule: rule145
  }, {
    start: 8050,
    length: 4,
    convRule: rule146
  }, {
    start: 8054,
    length: 2,
    convRule: rule147
  }, {
    start: 8056,
    length: 2,
    convRule: rule148
  }, {
    start: 8058,
    length: 2,
    convRule: rule149
  }, {
    start: 8060,
    length: 2,
    convRule: rule150
  }, {
    start: 8064,
    length: 8,
    convRule: rule143
  }, {
    start: 8072,
    length: 8,
    convRule: rule151
  }, {
    start: 8080,
    length: 8,
    convRule: rule143
  }, {
    start: 8088,
    length: 8,
    convRule: rule151
  }, {
    start: 8096,
    length: 8,
    convRule: rule143
  }, {
    start: 8104,
    length: 8,
    convRule: rule151
  }, {
    start: 8112,
    length: 2,
    convRule: rule143
  }, {
    start: 8115,
    length: 1,
    convRule: rule152
  }, {
    start: 8120,
    length: 2,
    convRule: rule144
  }, {
    start: 8122,
    length: 2,
    convRule: rule153
  }, {
    start: 8124,
    length: 1,
    convRule: rule154
  }, {
    start: 8126,
    length: 1,
    convRule: rule155
  }, {
    start: 8131,
    length: 1,
    convRule: rule152
  }, {
    start: 8136,
    length: 4,
    convRule: rule156
  }, {
    start: 8140,
    length: 1,
    convRule: rule154
  }, {
    start: 8144,
    length: 2,
    convRule: rule143
  }, {
    start: 8152,
    length: 2,
    convRule: rule144
  }, {
    start: 8154,
    length: 2,
    convRule: rule157
  }, {
    start: 8160,
    length: 2,
    convRule: rule143
  }, {
    start: 8165,
    length: 1,
    convRule: rule113
  }, {
    start: 8168,
    length: 2,
    convRule: rule144
  }, {
    start: 8170,
    length: 2,
    convRule: rule158
  }, {
    start: 8172,
    length: 1,
    convRule: rule117
  }, {
    start: 8179,
    length: 1,
    convRule: rule152
  }, {
    start: 8184,
    length: 2,
    convRule: rule159
  }, {
    start: 8186,
    length: 2,
    convRule: rule160
  }, {
    start: 8188,
    length: 1,
    convRule: rule154
  }, {
    start: 8486,
    length: 1,
    convRule: rule163
  }, {
    start: 8490,
    length: 1,
    convRule: rule164
  }, {
    start: 8491,
    length: 1,
    convRule: rule165
  }, {
    start: 8498,
    length: 1,
    convRule: rule166
  }, {
    start: 8526,
    length: 1,
    convRule: rule167
  }, {
    start: 8544,
    length: 16,
    convRule: rule168
  }, {
    start: 8560,
    length: 16,
    convRule: rule169
  }, {
    start: 8579,
    length: 1,
    convRule: rule22
  }, {
    start: 8580,
    length: 1,
    convRule: rule23
  }, {
    start: 9398,
    length: 26,
    convRule: rule170
  }, {
    start: 9424,
    length: 26,
    convRule: rule171
  }, {
    start: 11264,
    length: 47,
    convRule: rule122
  }, {
    start: 11312,
    length: 47,
    convRule: rule123
  }, {
    start: 11360,
    length: 1,
    convRule: rule22
  }, {
    start: 11361,
    length: 1,
    convRule: rule23
  }, {
    start: 11362,
    length: 1,
    convRule: rule172
  }, {
    start: 11363,
    length: 1,
    convRule: rule173
  }, {
    start: 11364,
    length: 1,
    convRule: rule174
  }, {
    start: 11365,
    length: 1,
    convRule: rule175
  }, {
    start: 11366,
    length: 1,
    convRule: rule176
  }, {
    start: 11367,
    length: 1,
    convRule: rule22
  }, {
    start: 11368,
    length: 1,
    convRule: rule23
  }, {
    start: 11369,
    length: 1,
    convRule: rule22
  }, {
    start: 11370,
    length: 1,
    convRule: rule23
  }, {
    start: 11371,
    length: 1,
    convRule: rule22
  }, {
    start: 11372,
    length: 1,
    convRule: rule23
  }, {
    start: 11373,
    length: 1,
    convRule: rule177
  }, {
    start: 11374,
    length: 1,
    convRule: rule178
  }, {
    start: 11375,
    length: 1,
    convRule: rule179
  }, {
    start: 11376,
    length: 1,
    convRule: rule180
  }, {
    start: 11378,
    length: 1,
    convRule: rule22
  }, {
    start: 11379,
    length: 1,
    convRule: rule23
  }, {
    start: 11381,
    length: 1,
    convRule: rule22
  }, {
    start: 11382,
    length: 1,
    convRule: rule23
  }, {
    start: 11390,
    length: 2,
    convRule: rule181
  }, {
    start: 11392,
    length: 1,
    convRule: rule22
  }, {
    start: 11393,
    length: 1,
    convRule: rule23
  }, {
    start: 11394,
    length: 1,
    convRule: rule22
  }, {
    start: 11395,
    length: 1,
    convRule: rule23
  }, {
    start: 11396,
    length: 1,
    convRule: rule22
  }, {
    start: 11397,
    length: 1,
    convRule: rule23
  }, {
    start: 11398,
    length: 1,
    convRule: rule22
  }, {
    start: 11399,
    length: 1,
    convRule: rule23
  }, {
    start: 11400,
    length: 1,
    convRule: rule22
  }, {
    start: 11401,
    length: 1,
    convRule: rule23
  }, {
    start: 11402,
    length: 1,
    convRule: rule22
  }, {
    start: 11403,
    length: 1,
    convRule: rule23
  }, {
    start: 11404,
    length: 1,
    convRule: rule22
  }, {
    start: 11405,
    length: 1,
    convRule: rule23
  }, {
    start: 11406,
    length: 1,
    convRule: rule22
  }, {
    start: 11407,
    length: 1,
    convRule: rule23
  }, {
    start: 11408,
    length: 1,
    convRule: rule22
  }, {
    start: 11409,
    length: 1,
    convRule: rule23
  }, {
    start: 11410,
    length: 1,
    convRule: rule22
  }, {
    start: 11411,
    length: 1,
    convRule: rule23
  }, {
    start: 11412,
    length: 1,
    convRule: rule22
  }, {
    start: 11413,
    length: 1,
    convRule: rule23
  }, {
    start: 11414,
    length: 1,
    convRule: rule22
  }, {
    start: 11415,
    length: 1,
    convRule: rule23
  }, {
    start: 11416,
    length: 1,
    convRule: rule22
  }, {
    start: 11417,
    length: 1,
    convRule: rule23
  }, {
    start: 11418,
    length: 1,
    convRule: rule22
  }, {
    start: 11419,
    length: 1,
    convRule: rule23
  }, {
    start: 11420,
    length: 1,
    convRule: rule22
  }, {
    start: 11421,
    length: 1,
    convRule: rule23
  }, {
    start: 11422,
    length: 1,
    convRule: rule22
  }, {
    start: 11423,
    length: 1,
    convRule: rule23
  }, {
    start: 11424,
    length: 1,
    convRule: rule22
  }, {
    start: 11425,
    length: 1,
    convRule: rule23
  }, {
    start: 11426,
    length: 1,
    convRule: rule22
  }, {
    start: 11427,
    length: 1,
    convRule: rule23
  }, {
    start: 11428,
    length: 1,
    convRule: rule22
  }, {
    start: 11429,
    length: 1,
    convRule: rule23
  }, {
    start: 11430,
    length: 1,
    convRule: rule22
  }, {
    start: 11431,
    length: 1,
    convRule: rule23
  }, {
    start: 11432,
    length: 1,
    convRule: rule22
  }, {
    start: 11433,
    length: 1,
    convRule: rule23
  }, {
    start: 11434,
    length: 1,
    convRule: rule22
  }, {
    start: 11435,
    length: 1,
    convRule: rule23
  }, {
    start: 11436,
    length: 1,
    convRule: rule22
  }, {
    start: 11437,
    length: 1,
    convRule: rule23
  }, {
    start: 11438,
    length: 1,
    convRule: rule22
  }, {
    start: 11439,
    length: 1,
    convRule: rule23
  }, {
    start: 11440,
    length: 1,
    convRule: rule22
  }, {
    start: 11441,
    length: 1,
    convRule: rule23
  }, {
    start: 11442,
    length: 1,
    convRule: rule22
  }, {
    start: 11443,
    length: 1,
    convRule: rule23
  }, {
    start: 11444,
    length: 1,
    convRule: rule22
  }, {
    start: 11445,
    length: 1,
    convRule: rule23
  }, {
    start: 11446,
    length: 1,
    convRule: rule22
  }, {
    start: 11447,
    length: 1,
    convRule: rule23
  }, {
    start: 11448,
    length: 1,
    convRule: rule22
  }, {
    start: 11449,
    length: 1,
    convRule: rule23
  }, {
    start: 11450,
    length: 1,
    convRule: rule22
  }, {
    start: 11451,
    length: 1,
    convRule: rule23
  }, {
    start: 11452,
    length: 1,
    convRule: rule22
  }, {
    start: 11453,
    length: 1,
    convRule: rule23
  }, {
    start: 11454,
    length: 1,
    convRule: rule22
  }, {
    start: 11455,
    length: 1,
    convRule: rule23
  }, {
    start: 11456,
    length: 1,
    convRule: rule22
  }, {
    start: 11457,
    length: 1,
    convRule: rule23
  }, {
    start: 11458,
    length: 1,
    convRule: rule22
  }, {
    start: 11459,
    length: 1,
    convRule: rule23
  }, {
    start: 11460,
    length: 1,
    convRule: rule22
  }, {
    start: 11461,
    length: 1,
    convRule: rule23
  }, {
    start: 11462,
    length: 1,
    convRule: rule22
  }, {
    start: 11463,
    length: 1,
    convRule: rule23
  }, {
    start: 11464,
    length: 1,
    convRule: rule22
  }, {
    start: 11465,
    length: 1,
    convRule: rule23
  }, {
    start: 11466,
    length: 1,
    convRule: rule22
  }, {
    start: 11467,
    length: 1,
    convRule: rule23
  }, {
    start: 11468,
    length: 1,
    convRule: rule22
  }, {
    start: 11469,
    length: 1,
    convRule: rule23
  }, {
    start: 11470,
    length: 1,
    convRule: rule22
  }, {
    start: 11471,
    length: 1,
    convRule: rule23
  }, {
    start: 11472,
    length: 1,
    convRule: rule22
  }, {
    start: 11473,
    length: 1,
    convRule: rule23
  }, {
    start: 11474,
    length: 1,
    convRule: rule22
  }, {
    start: 11475,
    length: 1,
    convRule: rule23
  }, {
    start: 11476,
    length: 1,
    convRule: rule22
  }, {
    start: 11477,
    length: 1,
    convRule: rule23
  }, {
    start: 11478,
    length: 1,
    convRule: rule22
  }, {
    start: 11479,
    length: 1,
    convRule: rule23
  }, {
    start: 11480,
    length: 1,
    convRule: rule22
  }, {
    start: 11481,
    length: 1,
    convRule: rule23
  }, {
    start: 11482,
    length: 1,
    convRule: rule22
  }, {
    start: 11483,
    length: 1,
    convRule: rule23
  }, {
    start: 11484,
    length: 1,
    convRule: rule22
  }, {
    start: 11485,
    length: 1,
    convRule: rule23
  }, {
    start: 11486,
    length: 1,
    convRule: rule22
  }, {
    start: 11487,
    length: 1,
    convRule: rule23
  }, {
    start: 11488,
    length: 1,
    convRule: rule22
  }, {
    start: 11489,
    length: 1,
    convRule: rule23
  }, {
    start: 11490,
    length: 1,
    convRule: rule22
  }, {
    start: 11491,
    length: 1,
    convRule: rule23
  }, {
    start: 11499,
    length: 1,
    convRule: rule22
  }, {
    start: 11500,
    length: 1,
    convRule: rule23
  }, {
    start: 11501,
    length: 1,
    convRule: rule22
  }, {
    start: 11502,
    length: 1,
    convRule: rule23
  }, {
    start: 11506,
    length: 1,
    convRule: rule22
  }, {
    start: 11507,
    length: 1,
    convRule: rule23
  }, {
    start: 11520,
    length: 38,
    convRule: rule182
  }, {
    start: 11559,
    length: 1,
    convRule: rule182
  }, {
    start: 11565,
    length: 1,
    convRule: rule182
  }, {
    start: 42560,
    length: 1,
    convRule: rule22
  }, {
    start: 42561,
    length: 1,
    convRule: rule23
  }, {
    start: 42562,
    length: 1,
    convRule: rule22
  }, {
    start: 42563,
    length: 1,
    convRule: rule23
  }, {
    start: 42564,
    length: 1,
    convRule: rule22
  }, {
    start: 42565,
    length: 1,
    convRule: rule23
  }, {
    start: 42566,
    length: 1,
    convRule: rule22
  }, {
    start: 42567,
    length: 1,
    convRule: rule23
  }, {
    start: 42568,
    length: 1,
    convRule: rule22
  }, {
    start: 42569,
    length: 1,
    convRule: rule23
  }, {
    start: 42570,
    length: 1,
    convRule: rule22
  }, {
    start: 42571,
    length: 1,
    convRule: rule23
  }, {
    start: 42572,
    length: 1,
    convRule: rule22
  }, {
    start: 42573,
    length: 1,
    convRule: rule23
  }, {
    start: 42574,
    length: 1,
    convRule: rule22
  }, {
    start: 42575,
    length: 1,
    convRule: rule23
  }, {
    start: 42576,
    length: 1,
    convRule: rule22
  }, {
    start: 42577,
    length: 1,
    convRule: rule23
  }, {
    start: 42578,
    length: 1,
    convRule: rule22
  }, {
    start: 42579,
    length: 1,
    convRule: rule23
  }, {
    start: 42580,
    length: 1,
    convRule: rule22
  }, {
    start: 42581,
    length: 1,
    convRule: rule23
  }, {
    start: 42582,
    length: 1,
    convRule: rule22
  }, {
    start: 42583,
    length: 1,
    convRule: rule23
  }, {
    start: 42584,
    length: 1,
    convRule: rule22
  }, {
    start: 42585,
    length: 1,
    convRule: rule23
  }, {
    start: 42586,
    length: 1,
    convRule: rule22
  }, {
    start: 42587,
    length: 1,
    convRule: rule23
  }, {
    start: 42588,
    length: 1,
    convRule: rule22
  }, {
    start: 42589,
    length: 1,
    convRule: rule23
  }, {
    start: 42590,
    length: 1,
    convRule: rule22
  }, {
    start: 42591,
    length: 1,
    convRule: rule23
  }, {
    start: 42592,
    length: 1,
    convRule: rule22
  }, {
    start: 42593,
    length: 1,
    convRule: rule23
  }, {
    start: 42594,
    length: 1,
    convRule: rule22
  }, {
    start: 42595,
    length: 1,
    convRule: rule23
  }, {
    start: 42596,
    length: 1,
    convRule: rule22
  }, {
    start: 42597,
    length: 1,
    convRule: rule23
  }, {
    start: 42598,
    length: 1,
    convRule: rule22
  }, {
    start: 42599,
    length: 1,
    convRule: rule23
  }, {
    start: 42600,
    length: 1,
    convRule: rule22
  }, {
    start: 42601,
    length: 1,
    convRule: rule23
  }, {
    start: 42602,
    length: 1,
    convRule: rule22
  }, {
    start: 42603,
    length: 1,
    convRule: rule23
  }, {
    start: 42604,
    length: 1,
    convRule: rule22
  }, {
    start: 42605,
    length: 1,
    convRule: rule23
  }, {
    start: 42624,
    length: 1,
    convRule: rule22
  }, {
    start: 42625,
    length: 1,
    convRule: rule23
  }, {
    start: 42626,
    length: 1,
    convRule: rule22
  }, {
    start: 42627,
    length: 1,
    convRule: rule23
  }, {
    start: 42628,
    length: 1,
    convRule: rule22
  }, {
    start: 42629,
    length: 1,
    convRule: rule23
  }, {
    start: 42630,
    length: 1,
    convRule: rule22
  }, {
    start: 42631,
    length: 1,
    convRule: rule23
  }, {
    start: 42632,
    length: 1,
    convRule: rule22
  }, {
    start: 42633,
    length: 1,
    convRule: rule23
  }, {
    start: 42634,
    length: 1,
    convRule: rule22
  }, {
    start: 42635,
    length: 1,
    convRule: rule23
  }, {
    start: 42636,
    length: 1,
    convRule: rule22
  }, {
    start: 42637,
    length: 1,
    convRule: rule23
  }, {
    start: 42638,
    length: 1,
    convRule: rule22
  }, {
    start: 42639,
    length: 1,
    convRule: rule23
  }, {
    start: 42640,
    length: 1,
    convRule: rule22
  }, {
    start: 42641,
    length: 1,
    convRule: rule23
  }, {
    start: 42642,
    length: 1,
    convRule: rule22
  }, {
    start: 42643,
    length: 1,
    convRule: rule23
  }, {
    start: 42644,
    length: 1,
    convRule: rule22
  }, {
    start: 42645,
    length: 1,
    convRule: rule23
  }, {
    start: 42646,
    length: 1,
    convRule: rule22
  }, {
    start: 42647,
    length: 1,
    convRule: rule23
  }, {
    start: 42648,
    length: 1,
    convRule: rule22
  }, {
    start: 42649,
    length: 1,
    convRule: rule23
  }, {
    start: 42650,
    length: 1,
    convRule: rule22
  }, {
    start: 42651,
    length: 1,
    convRule: rule23
  }, {
    start: 42786,
    length: 1,
    convRule: rule22
  }, {
    start: 42787,
    length: 1,
    convRule: rule23
  }, {
    start: 42788,
    length: 1,
    convRule: rule22
  }, {
    start: 42789,
    length: 1,
    convRule: rule23
  }, {
    start: 42790,
    length: 1,
    convRule: rule22
  }, {
    start: 42791,
    length: 1,
    convRule: rule23
  }, {
    start: 42792,
    length: 1,
    convRule: rule22
  }, {
    start: 42793,
    length: 1,
    convRule: rule23
  }, {
    start: 42794,
    length: 1,
    convRule: rule22
  }, {
    start: 42795,
    length: 1,
    convRule: rule23
  }, {
    start: 42796,
    length: 1,
    convRule: rule22
  }, {
    start: 42797,
    length: 1,
    convRule: rule23
  }, {
    start: 42798,
    length: 1,
    convRule: rule22
  }, {
    start: 42799,
    length: 1,
    convRule: rule23
  }, {
    start: 42802,
    length: 1,
    convRule: rule22
  }, {
    start: 42803,
    length: 1,
    convRule: rule23
  }, {
    start: 42804,
    length: 1,
    convRule: rule22
  }, {
    start: 42805,
    length: 1,
    convRule: rule23
  }, {
    start: 42806,
    length: 1,
    convRule: rule22
  }, {
    start: 42807,
    length: 1,
    convRule: rule23
  }, {
    start: 42808,
    length: 1,
    convRule: rule22
  }, {
    start: 42809,
    length: 1,
    convRule: rule23
  }, {
    start: 42810,
    length: 1,
    convRule: rule22
  }, {
    start: 42811,
    length: 1,
    convRule: rule23
  }, {
    start: 42812,
    length: 1,
    convRule: rule22
  }, {
    start: 42813,
    length: 1,
    convRule: rule23
  }, {
    start: 42814,
    length: 1,
    convRule: rule22
  }, {
    start: 42815,
    length: 1,
    convRule: rule23
  }, {
    start: 42816,
    length: 1,
    convRule: rule22
  }, {
    start: 42817,
    length: 1,
    convRule: rule23
  }, {
    start: 42818,
    length: 1,
    convRule: rule22
  }, {
    start: 42819,
    length: 1,
    convRule: rule23
  }, {
    start: 42820,
    length: 1,
    convRule: rule22
  }, {
    start: 42821,
    length: 1,
    convRule: rule23
  }, {
    start: 42822,
    length: 1,
    convRule: rule22
  }, {
    start: 42823,
    length: 1,
    convRule: rule23
  }, {
    start: 42824,
    length: 1,
    convRule: rule22
  }, {
    start: 42825,
    length: 1,
    convRule: rule23
  }, {
    start: 42826,
    length: 1,
    convRule: rule22
  }, {
    start: 42827,
    length: 1,
    convRule: rule23
  }, {
    start: 42828,
    length: 1,
    convRule: rule22
  }, {
    start: 42829,
    length: 1,
    convRule: rule23
  }, {
    start: 42830,
    length: 1,
    convRule: rule22
  }, {
    start: 42831,
    length: 1,
    convRule: rule23
  }, {
    start: 42832,
    length: 1,
    convRule: rule22
  }, {
    start: 42833,
    length: 1,
    convRule: rule23
  }, {
    start: 42834,
    length: 1,
    convRule: rule22
  }, {
    start: 42835,
    length: 1,
    convRule: rule23
  }, {
    start: 42836,
    length: 1,
    convRule: rule22
  }, {
    start: 42837,
    length: 1,
    convRule: rule23
  }, {
    start: 42838,
    length: 1,
    convRule: rule22
  }, {
    start: 42839,
    length: 1,
    convRule: rule23
  }, {
    start: 42840,
    length: 1,
    convRule: rule22
  }, {
    start: 42841,
    length: 1,
    convRule: rule23
  }, {
    start: 42842,
    length: 1,
    convRule: rule22
  }, {
    start: 42843,
    length: 1,
    convRule: rule23
  }, {
    start: 42844,
    length: 1,
    convRule: rule22
  }, {
    start: 42845,
    length: 1,
    convRule: rule23
  }, {
    start: 42846,
    length: 1,
    convRule: rule22
  }, {
    start: 42847,
    length: 1,
    convRule: rule23
  }, {
    start: 42848,
    length: 1,
    convRule: rule22
  }, {
    start: 42849,
    length: 1,
    convRule: rule23
  }, {
    start: 42850,
    length: 1,
    convRule: rule22
  }, {
    start: 42851,
    length: 1,
    convRule: rule23
  }, {
    start: 42852,
    length: 1,
    convRule: rule22
  }, {
    start: 42853,
    length: 1,
    convRule: rule23
  }, {
    start: 42854,
    length: 1,
    convRule: rule22
  }, {
    start: 42855,
    length: 1,
    convRule: rule23
  }, {
    start: 42856,
    length: 1,
    convRule: rule22
  }, {
    start: 42857,
    length: 1,
    convRule: rule23
  }, {
    start: 42858,
    length: 1,
    convRule: rule22
  }, {
    start: 42859,
    length: 1,
    convRule: rule23
  }, {
    start: 42860,
    length: 1,
    convRule: rule22
  }, {
    start: 42861,
    length: 1,
    convRule: rule23
  }, {
    start: 42862,
    length: 1,
    convRule: rule22
  }, {
    start: 42863,
    length: 1,
    convRule: rule23
  }, {
    start: 42873,
    length: 1,
    convRule: rule22
  }, {
    start: 42874,
    length: 1,
    convRule: rule23
  }, {
    start: 42875,
    length: 1,
    convRule: rule22
  }, {
    start: 42876,
    length: 1,
    convRule: rule23
  }, {
    start: 42877,
    length: 1,
    convRule: rule183
  }, {
    start: 42878,
    length: 1,
    convRule: rule22
  }, {
    start: 42879,
    length: 1,
    convRule: rule23
  }, {
    start: 42880,
    length: 1,
    convRule: rule22
  }, {
    start: 42881,
    length: 1,
    convRule: rule23
  }, {
    start: 42882,
    length: 1,
    convRule: rule22
  }, {
    start: 42883,
    length: 1,
    convRule: rule23
  }, {
    start: 42884,
    length: 1,
    convRule: rule22
  }, {
    start: 42885,
    length: 1,
    convRule: rule23
  }, {
    start: 42886,
    length: 1,
    convRule: rule22
  }, {
    start: 42887,
    length: 1,
    convRule: rule23
  }, {
    start: 42891,
    length: 1,
    convRule: rule22
  }, {
    start: 42892,
    length: 1,
    convRule: rule23
  }, {
    start: 42893,
    length: 1,
    convRule: rule184
  }, {
    start: 42896,
    length: 1,
    convRule: rule22
  }, {
    start: 42897,
    length: 1,
    convRule: rule23
  }, {
    start: 42898,
    length: 1,
    convRule: rule22
  }, {
    start: 42899,
    length: 1,
    convRule: rule23
  }, {
    start: 42900,
    length: 1,
    convRule: rule185
  }, {
    start: 42902,
    length: 1,
    convRule: rule22
  }, {
    start: 42903,
    length: 1,
    convRule: rule23
  }, {
    start: 42904,
    length: 1,
    convRule: rule22
  }, {
    start: 42905,
    length: 1,
    convRule: rule23
  }, {
    start: 42906,
    length: 1,
    convRule: rule22
  }, {
    start: 42907,
    length: 1,
    convRule: rule23
  }, {
    start: 42908,
    length: 1,
    convRule: rule22
  }, {
    start: 42909,
    length: 1,
    convRule: rule23
  }, {
    start: 42910,
    length: 1,
    convRule: rule22
  }, {
    start: 42911,
    length: 1,
    convRule: rule23
  }, {
    start: 42912,
    length: 1,
    convRule: rule22
  }, {
    start: 42913,
    length: 1,
    convRule: rule23
  }, {
    start: 42914,
    length: 1,
    convRule: rule22
  }, {
    start: 42915,
    length: 1,
    convRule: rule23
  }, {
    start: 42916,
    length: 1,
    convRule: rule22
  }, {
    start: 42917,
    length: 1,
    convRule: rule23
  }, {
    start: 42918,
    length: 1,
    convRule: rule22
  }, {
    start: 42919,
    length: 1,
    convRule: rule23
  }, {
    start: 42920,
    length: 1,
    convRule: rule22
  }, {
    start: 42921,
    length: 1,
    convRule: rule23
  }, {
    start: 42922,
    length: 1,
    convRule: rule186
  }, {
    start: 42923,
    length: 1,
    convRule: rule187
  }, {
    start: 42924,
    length: 1,
    convRule: rule188
  }, {
    start: 42925,
    length: 1,
    convRule: rule189
  }, {
    start: 42926,
    length: 1,
    convRule: rule186
  }, {
    start: 42928,
    length: 1,
    convRule: rule190
  }, {
    start: 42929,
    length: 1,
    convRule: rule191
  }, {
    start: 42930,
    length: 1,
    convRule: rule192
  }, {
    start: 42931,
    length: 1,
    convRule: rule193
  }, {
    start: 42932,
    length: 1,
    convRule: rule22
  }, {
    start: 42933,
    length: 1,
    convRule: rule23
  }, {
    start: 42934,
    length: 1,
    convRule: rule22
  }, {
    start: 42935,
    length: 1,
    convRule: rule23
  }, {
    start: 42936,
    length: 1,
    convRule: rule22
  }, {
    start: 42937,
    length: 1,
    convRule: rule23
  }, {
    start: 42938,
    length: 1,
    convRule: rule22
  }, {
    start: 42939,
    length: 1,
    convRule: rule23
  }, {
    start: 42940,
    length: 1,
    convRule: rule22
  }, {
    start: 42941,
    length: 1,
    convRule: rule23
  }, {
    start: 42942,
    length: 1,
    convRule: rule22
  }, {
    start: 42943,
    length: 1,
    convRule: rule23
  }, {
    start: 42946,
    length: 1,
    convRule: rule22
  }, {
    start: 42947,
    length: 1,
    convRule: rule23
  }, {
    start: 42948,
    length: 1,
    convRule: rule194
  }, {
    start: 42949,
    length: 1,
    convRule: rule195
  }, {
    start: 42950,
    length: 1,
    convRule: rule196
  }, {
    start: 42951,
    length: 1,
    convRule: rule22
  }, {
    start: 42952,
    length: 1,
    convRule: rule23
  }, {
    start: 42953,
    length: 1,
    convRule: rule22
  }, {
    start: 42954,
    length: 1,
    convRule: rule23
  }, {
    start: 42997,
    length: 1,
    convRule: rule22
  }, {
    start: 42998,
    length: 1,
    convRule: rule23
  }, {
    start: 43859,
    length: 1,
    convRule: rule197
  }, {
    start: 43888,
    length: 80,
    convRule: rule198
  }, {
    start: 65313,
    length: 26,
    convRule: rule9
  }, {
    start: 65345,
    length: 26,
    convRule: rule12
  }, {
    start: 66560,
    length: 40,
    convRule: rule201
  }, {
    start: 66600,
    length: 40,
    convRule: rule202
  }, {
    start: 66736,
    length: 36,
    convRule: rule201
  }, {
    start: 66776,
    length: 36,
    convRule: rule202
  }, {
    start: 68736,
    length: 51,
    convRule: rule97
  }, {
    start: 68800,
    length: 51,
    convRule: rule102
  }, {
    start: 71840,
    length: 32,
    convRule: rule9
  }, {
    start: 71872,
    length: 32,
    convRule: rule12
  }, {
    start: 93760,
    length: 32,
    convRule: rule9
  }, {
    start: 93792,
    length: 32,
    convRule: rule12
  }, {
    start: 125184,
    length: 34,
    convRule: rule203
  }, {
    start: 125218,
    length: 34,
    convRule: rule204
  }];
  var bsearch = function(a) {
    return function(array) {
      return function(size3) {
        return function(compare4) {
          var go = function($copy_i) {
            return function($copy_k) {
              var $tco_var_i = $copy_i;
              var $tco_done = false;
              var $tco_result;
              function $tco_loop(i, k) {
                if (i > k || i >= length(array)) {
                  $tco_done = true;
                  return Nothing.value;
                }
                ;
                if (otherwise) {
                  var j = floor2(toNumber(i + k | 0) / 2);
                  var b = unsafeIndex2(array)(j);
                  var v = compare4(a)(b);
                  if (v instanceof EQ) {
                    $tco_done = true;
                    return new Just(b);
                  }
                  ;
                  if (v instanceof GT) {
                    $tco_var_i = j + 1 | 0;
                    $copy_k = k;
                    return;
                  }
                  ;
                  $tco_var_i = i;
                  $copy_k = j - 1 | 0;
                  return;
                }
                ;
                throw new Error("Failed pattern match at Data.CodePoint.Unicode.Internal (line 5622, column 3 - line 5632, column 30): " + [i.constructor.name, k.constructor.name]);
              }
              ;
              while (!$tco_done) {
                $tco_result = $tco_loop($tco_var_i, $copy_k);
              }
              ;
              return $tco_result;
            };
          };
          return go(0)(size3);
        };
      };
    };
  };
  var blkCmp = function(v) {
    return function(v1) {
      if (v.start >= v1.start && v.start < (v1.start + v1.length | 0)) {
        return EQ.value;
      }
      ;
      if (v.start > v1.start) {
        return GT.value;
      }
      ;
      if (otherwise) {
        return LT.value;
      }
      ;
      throw new Error("Failed pattern match at Data.CodePoint.Unicode.Internal (line 5598, column 1 - line 5598, column 45): " + [v.constructor.name, v1.constructor.name]);
    };
  };
  var getRule = function(blocks) {
    return function(unichar) {
      return function(size3) {
        var key = {
          start: unichar,
          length: 1,
          convRule: nullrule
        };
        var maybeCharBlock = bsearch(key)(blocks)(size3)(blkCmp);
        if (maybeCharBlock instanceof Nothing) {
          return Nothing.value;
        }
        ;
        if (maybeCharBlock instanceof Just) {
          return new Just(maybeCharBlock.value0.convRule);
        }
        ;
        throw new Error("Failed pattern match at Data.CodePoint.Unicode.Internal (line 5612, column 5 - line 5614, column 60): " + [maybeCharBlock.constructor.name]);
      };
    };
  };
  var caseConv = function(f) {
    return function($$char2) {
      var maybeConversionRule = getRule(convchars)($$char2)(numConvBlocks);
      if (maybeConversionRule instanceof Nothing) {
        return $$char2;
      }
      ;
      if (maybeConversionRule instanceof Just) {
        return $$char2 + f(maybeConversionRule.value0) | 0;
      }
      ;
      throw new Error("Failed pattern match at Data.CodePoint.Unicode.Internal (line 5727, column 5 - line 5729, column 53): " + [maybeConversionRule.constructor.name]);
    };
  };
  var uTowlower = /* @__PURE__ */ caseConv(function(v) {
    return v.lowdist;
  });
  var uTowupper = /* @__PURE__ */ caseConv(function(v) {
    return v.updist;
  });
  var checkAttrS = function(categories) {
    return function($$char2) {
      var maybeConversionRule = getRule(spacechars)($$char2)(numSpaceBlocks);
      if (maybeConversionRule instanceof Nothing) {
        return false;
      }
      ;
      if (maybeConversionRule instanceof Just) {
        return isJust(elemIndex2(maybeConversionRule.value0.category)(categories));
      }
      ;
      throw new Error("Failed pattern match at Data.CodePoint.Unicode.Internal (line 5654, column 5 - line 5656, column 86): " + [maybeConversionRule.constructor.name]);
    };
  };
  var uIswspace = /* @__PURE__ */ checkAttrS([gencatZS]);
  var allchars = [{
    start: 0,
    length: 32,
    convRule: rule0
  }, {
    start: 32,
    length: 1,
    convRule: rule1
  }, {
    start: 33,
    length: 3,
    convRule: rule2
  }, {
    start: 36,
    length: 1,
    convRule: rule3
  }, {
    start: 37,
    length: 3,
    convRule: rule2
  }, {
    start: 40,
    length: 1,
    convRule: rule4
  }, {
    start: 41,
    length: 1,
    convRule: rule5
  }, {
    start: 42,
    length: 1,
    convRule: rule2
  }, {
    start: 43,
    length: 1,
    convRule: rule6
  }, {
    start: 44,
    length: 1,
    convRule: rule2
  }, {
    start: 45,
    length: 1,
    convRule: rule7
  }, {
    start: 46,
    length: 2,
    convRule: rule2
  }, {
    start: 48,
    length: 10,
    convRule: rule8
  }, {
    start: 58,
    length: 2,
    convRule: rule2
  }, {
    start: 60,
    length: 3,
    convRule: rule6
  }, {
    start: 63,
    length: 2,
    convRule: rule2
  }, {
    start: 65,
    length: 26,
    convRule: rule9
  }, {
    start: 91,
    length: 1,
    convRule: rule4
  }, {
    start: 92,
    length: 1,
    convRule: rule2
  }, {
    start: 93,
    length: 1,
    convRule: rule5
  }, {
    start: 94,
    length: 1,
    convRule: rule10
  }, {
    start: 95,
    length: 1,
    convRule: rule11
  }, {
    start: 96,
    length: 1,
    convRule: rule10
  }, {
    start: 97,
    length: 26,
    convRule: rule12
  }, {
    start: 123,
    length: 1,
    convRule: rule4
  }, {
    start: 124,
    length: 1,
    convRule: rule6
  }, {
    start: 125,
    length: 1,
    convRule: rule5
  }, {
    start: 126,
    length: 1,
    convRule: rule6
  }, {
    start: 127,
    length: 33,
    convRule: rule0
  }, {
    start: 160,
    length: 1,
    convRule: rule1
  }, {
    start: 161,
    length: 1,
    convRule: rule2
  }, {
    start: 162,
    length: 4,
    convRule: rule3
  }, {
    start: 166,
    length: 1,
    convRule: rule13
  }, {
    start: 167,
    length: 1,
    convRule: rule2
  }, {
    start: 168,
    length: 1,
    convRule: rule10
  }, {
    start: 169,
    length: 1,
    convRule: rule13
  }, {
    start: 170,
    length: 1,
    convRule: rule14
  }, {
    start: 171,
    length: 1,
    convRule: rule15
  }, {
    start: 172,
    length: 1,
    convRule: rule6
  }, {
    start: 173,
    length: 1,
    convRule: rule16
  }, {
    start: 174,
    length: 1,
    convRule: rule13
  }, {
    start: 175,
    length: 1,
    convRule: rule10
  }, {
    start: 176,
    length: 1,
    convRule: rule13
  }, {
    start: 177,
    length: 1,
    convRule: rule6
  }, {
    start: 178,
    length: 2,
    convRule: rule17
  }, {
    start: 180,
    length: 1,
    convRule: rule10
  }, {
    start: 181,
    length: 1,
    convRule: rule18
  }, {
    start: 182,
    length: 2,
    convRule: rule2
  }, {
    start: 184,
    length: 1,
    convRule: rule10
  }, {
    start: 185,
    length: 1,
    convRule: rule17
  }, {
    start: 186,
    length: 1,
    convRule: rule14
  }, {
    start: 187,
    length: 1,
    convRule: rule19
  }, {
    start: 188,
    length: 3,
    convRule: rule17
  }, {
    start: 191,
    length: 1,
    convRule: rule2
  }, {
    start: 192,
    length: 23,
    convRule: rule9
  }, {
    start: 215,
    length: 1,
    convRule: rule6
  }, {
    start: 216,
    length: 7,
    convRule: rule9
  }, {
    start: 223,
    length: 1,
    convRule: rule20
  }, {
    start: 224,
    length: 23,
    convRule: rule12
  }, {
    start: 247,
    length: 1,
    convRule: rule6
  }, {
    start: 248,
    length: 7,
    convRule: rule12
  }, {
    start: 255,
    length: 1,
    convRule: rule21
  }, {
    start: 256,
    length: 1,
    convRule: rule22
  }, {
    start: 257,
    length: 1,
    convRule: rule23
  }, {
    start: 258,
    length: 1,
    convRule: rule22
  }, {
    start: 259,
    length: 1,
    convRule: rule23
  }, {
    start: 260,
    length: 1,
    convRule: rule22
  }, {
    start: 261,
    length: 1,
    convRule: rule23
  }, {
    start: 262,
    length: 1,
    convRule: rule22
  }, {
    start: 263,
    length: 1,
    convRule: rule23
  }, {
    start: 264,
    length: 1,
    convRule: rule22
  }, {
    start: 265,
    length: 1,
    convRule: rule23
  }, {
    start: 266,
    length: 1,
    convRule: rule22
  }, {
    start: 267,
    length: 1,
    convRule: rule23
  }, {
    start: 268,
    length: 1,
    convRule: rule22
  }, {
    start: 269,
    length: 1,
    convRule: rule23
  }, {
    start: 270,
    length: 1,
    convRule: rule22
  }, {
    start: 271,
    length: 1,
    convRule: rule23
  }, {
    start: 272,
    length: 1,
    convRule: rule22
  }, {
    start: 273,
    length: 1,
    convRule: rule23
  }, {
    start: 274,
    length: 1,
    convRule: rule22
  }, {
    start: 275,
    length: 1,
    convRule: rule23
  }, {
    start: 276,
    length: 1,
    convRule: rule22
  }, {
    start: 277,
    length: 1,
    convRule: rule23
  }, {
    start: 278,
    length: 1,
    convRule: rule22
  }, {
    start: 279,
    length: 1,
    convRule: rule23
  }, {
    start: 280,
    length: 1,
    convRule: rule22
  }, {
    start: 281,
    length: 1,
    convRule: rule23
  }, {
    start: 282,
    length: 1,
    convRule: rule22
  }, {
    start: 283,
    length: 1,
    convRule: rule23
  }, {
    start: 284,
    length: 1,
    convRule: rule22
  }, {
    start: 285,
    length: 1,
    convRule: rule23
  }, {
    start: 286,
    length: 1,
    convRule: rule22
  }, {
    start: 287,
    length: 1,
    convRule: rule23
  }, {
    start: 288,
    length: 1,
    convRule: rule22
  }, {
    start: 289,
    length: 1,
    convRule: rule23
  }, {
    start: 290,
    length: 1,
    convRule: rule22
  }, {
    start: 291,
    length: 1,
    convRule: rule23
  }, {
    start: 292,
    length: 1,
    convRule: rule22
  }, {
    start: 293,
    length: 1,
    convRule: rule23
  }, {
    start: 294,
    length: 1,
    convRule: rule22
  }, {
    start: 295,
    length: 1,
    convRule: rule23
  }, {
    start: 296,
    length: 1,
    convRule: rule22
  }, {
    start: 297,
    length: 1,
    convRule: rule23
  }, {
    start: 298,
    length: 1,
    convRule: rule22
  }, {
    start: 299,
    length: 1,
    convRule: rule23
  }, {
    start: 300,
    length: 1,
    convRule: rule22
  }, {
    start: 301,
    length: 1,
    convRule: rule23
  }, {
    start: 302,
    length: 1,
    convRule: rule22
  }, {
    start: 303,
    length: 1,
    convRule: rule23
  }, {
    start: 304,
    length: 1,
    convRule: rule24
  }, {
    start: 305,
    length: 1,
    convRule: rule25
  }, {
    start: 306,
    length: 1,
    convRule: rule22
  }, {
    start: 307,
    length: 1,
    convRule: rule23
  }, {
    start: 308,
    length: 1,
    convRule: rule22
  }, {
    start: 309,
    length: 1,
    convRule: rule23
  }, {
    start: 310,
    length: 1,
    convRule: rule22
  }, {
    start: 311,
    length: 1,
    convRule: rule23
  }, {
    start: 312,
    length: 1,
    convRule: rule20
  }, {
    start: 313,
    length: 1,
    convRule: rule22
  }, {
    start: 314,
    length: 1,
    convRule: rule23
  }, {
    start: 315,
    length: 1,
    convRule: rule22
  }, {
    start: 316,
    length: 1,
    convRule: rule23
  }, {
    start: 317,
    length: 1,
    convRule: rule22
  }, {
    start: 318,
    length: 1,
    convRule: rule23
  }, {
    start: 319,
    length: 1,
    convRule: rule22
  }, {
    start: 320,
    length: 1,
    convRule: rule23
  }, {
    start: 321,
    length: 1,
    convRule: rule22
  }, {
    start: 322,
    length: 1,
    convRule: rule23
  }, {
    start: 323,
    length: 1,
    convRule: rule22
  }, {
    start: 324,
    length: 1,
    convRule: rule23
  }, {
    start: 325,
    length: 1,
    convRule: rule22
  }, {
    start: 326,
    length: 1,
    convRule: rule23
  }, {
    start: 327,
    length: 1,
    convRule: rule22
  }, {
    start: 328,
    length: 1,
    convRule: rule23
  }, {
    start: 329,
    length: 1,
    convRule: rule20
  }, {
    start: 330,
    length: 1,
    convRule: rule22
  }, {
    start: 331,
    length: 1,
    convRule: rule23
  }, {
    start: 332,
    length: 1,
    convRule: rule22
  }, {
    start: 333,
    length: 1,
    convRule: rule23
  }, {
    start: 334,
    length: 1,
    convRule: rule22
  }, {
    start: 335,
    length: 1,
    convRule: rule23
  }, {
    start: 336,
    length: 1,
    convRule: rule22
  }, {
    start: 337,
    length: 1,
    convRule: rule23
  }, {
    start: 338,
    length: 1,
    convRule: rule22
  }, {
    start: 339,
    length: 1,
    convRule: rule23
  }, {
    start: 340,
    length: 1,
    convRule: rule22
  }, {
    start: 341,
    length: 1,
    convRule: rule23
  }, {
    start: 342,
    length: 1,
    convRule: rule22
  }, {
    start: 343,
    length: 1,
    convRule: rule23
  }, {
    start: 344,
    length: 1,
    convRule: rule22
  }, {
    start: 345,
    length: 1,
    convRule: rule23
  }, {
    start: 346,
    length: 1,
    convRule: rule22
  }, {
    start: 347,
    length: 1,
    convRule: rule23
  }, {
    start: 348,
    length: 1,
    convRule: rule22
  }, {
    start: 349,
    length: 1,
    convRule: rule23
  }, {
    start: 350,
    length: 1,
    convRule: rule22
  }, {
    start: 351,
    length: 1,
    convRule: rule23
  }, {
    start: 352,
    length: 1,
    convRule: rule22
  }, {
    start: 353,
    length: 1,
    convRule: rule23
  }, {
    start: 354,
    length: 1,
    convRule: rule22
  }, {
    start: 355,
    length: 1,
    convRule: rule23
  }, {
    start: 356,
    length: 1,
    convRule: rule22
  }, {
    start: 357,
    length: 1,
    convRule: rule23
  }, {
    start: 358,
    length: 1,
    convRule: rule22
  }, {
    start: 359,
    length: 1,
    convRule: rule23
  }, {
    start: 360,
    length: 1,
    convRule: rule22
  }, {
    start: 361,
    length: 1,
    convRule: rule23
  }, {
    start: 362,
    length: 1,
    convRule: rule22
  }, {
    start: 363,
    length: 1,
    convRule: rule23
  }, {
    start: 364,
    length: 1,
    convRule: rule22
  }, {
    start: 365,
    length: 1,
    convRule: rule23
  }, {
    start: 366,
    length: 1,
    convRule: rule22
  }, {
    start: 367,
    length: 1,
    convRule: rule23
  }, {
    start: 368,
    length: 1,
    convRule: rule22
  }, {
    start: 369,
    length: 1,
    convRule: rule23
  }, {
    start: 370,
    length: 1,
    convRule: rule22
  }, {
    start: 371,
    length: 1,
    convRule: rule23
  }, {
    start: 372,
    length: 1,
    convRule: rule22
  }, {
    start: 373,
    length: 1,
    convRule: rule23
  }, {
    start: 374,
    length: 1,
    convRule: rule22
  }, {
    start: 375,
    length: 1,
    convRule: rule23
  }, {
    start: 376,
    length: 1,
    convRule: rule26
  }, {
    start: 377,
    length: 1,
    convRule: rule22
  }, {
    start: 378,
    length: 1,
    convRule: rule23
  }, {
    start: 379,
    length: 1,
    convRule: rule22
  }, {
    start: 380,
    length: 1,
    convRule: rule23
  }, {
    start: 381,
    length: 1,
    convRule: rule22
  }, {
    start: 382,
    length: 1,
    convRule: rule23
  }, {
    start: 383,
    length: 1,
    convRule: rule27
  }, {
    start: 384,
    length: 1,
    convRule: rule28
  }, {
    start: 385,
    length: 1,
    convRule: rule29
  }, {
    start: 386,
    length: 1,
    convRule: rule22
  }, {
    start: 387,
    length: 1,
    convRule: rule23
  }, {
    start: 388,
    length: 1,
    convRule: rule22
  }, {
    start: 389,
    length: 1,
    convRule: rule23
  }, {
    start: 390,
    length: 1,
    convRule: rule30
  }, {
    start: 391,
    length: 1,
    convRule: rule22
  }, {
    start: 392,
    length: 1,
    convRule: rule23
  }, {
    start: 393,
    length: 2,
    convRule: rule31
  }, {
    start: 395,
    length: 1,
    convRule: rule22
  }, {
    start: 396,
    length: 1,
    convRule: rule23
  }, {
    start: 397,
    length: 1,
    convRule: rule20
  }, {
    start: 398,
    length: 1,
    convRule: rule32
  }, {
    start: 399,
    length: 1,
    convRule: rule33
  }, {
    start: 400,
    length: 1,
    convRule: rule34
  }, {
    start: 401,
    length: 1,
    convRule: rule22
  }, {
    start: 402,
    length: 1,
    convRule: rule23
  }, {
    start: 403,
    length: 1,
    convRule: rule31
  }, {
    start: 404,
    length: 1,
    convRule: rule35
  }, {
    start: 405,
    length: 1,
    convRule: rule36
  }, {
    start: 406,
    length: 1,
    convRule: rule37
  }, {
    start: 407,
    length: 1,
    convRule: rule38
  }, {
    start: 408,
    length: 1,
    convRule: rule22
  }, {
    start: 409,
    length: 1,
    convRule: rule23
  }, {
    start: 410,
    length: 1,
    convRule: rule39
  }, {
    start: 411,
    length: 1,
    convRule: rule20
  }, {
    start: 412,
    length: 1,
    convRule: rule37
  }, {
    start: 413,
    length: 1,
    convRule: rule40
  }, {
    start: 414,
    length: 1,
    convRule: rule41
  }, {
    start: 415,
    length: 1,
    convRule: rule42
  }, {
    start: 416,
    length: 1,
    convRule: rule22
  }, {
    start: 417,
    length: 1,
    convRule: rule23
  }, {
    start: 418,
    length: 1,
    convRule: rule22
  }, {
    start: 419,
    length: 1,
    convRule: rule23
  }, {
    start: 420,
    length: 1,
    convRule: rule22
  }, {
    start: 421,
    length: 1,
    convRule: rule23
  }, {
    start: 422,
    length: 1,
    convRule: rule43
  }, {
    start: 423,
    length: 1,
    convRule: rule22
  }, {
    start: 424,
    length: 1,
    convRule: rule23
  }, {
    start: 425,
    length: 1,
    convRule: rule43
  }, {
    start: 426,
    length: 2,
    convRule: rule20
  }, {
    start: 428,
    length: 1,
    convRule: rule22
  }, {
    start: 429,
    length: 1,
    convRule: rule23
  }, {
    start: 430,
    length: 1,
    convRule: rule43
  }, {
    start: 431,
    length: 1,
    convRule: rule22
  }, {
    start: 432,
    length: 1,
    convRule: rule23
  }, {
    start: 433,
    length: 2,
    convRule: rule44
  }, {
    start: 435,
    length: 1,
    convRule: rule22
  }, {
    start: 436,
    length: 1,
    convRule: rule23
  }, {
    start: 437,
    length: 1,
    convRule: rule22
  }, {
    start: 438,
    length: 1,
    convRule: rule23
  }, {
    start: 439,
    length: 1,
    convRule: rule45
  }, {
    start: 440,
    length: 1,
    convRule: rule22
  }, {
    start: 441,
    length: 1,
    convRule: rule23
  }, {
    start: 442,
    length: 1,
    convRule: rule20
  }, {
    start: 443,
    length: 1,
    convRule: rule14
  }, {
    start: 444,
    length: 1,
    convRule: rule22
  }, {
    start: 445,
    length: 1,
    convRule: rule23
  }, {
    start: 446,
    length: 1,
    convRule: rule20
  }, {
    start: 447,
    length: 1,
    convRule: rule46
  }, {
    start: 448,
    length: 4,
    convRule: rule14
  }, {
    start: 452,
    length: 1,
    convRule: rule47
  }, {
    start: 453,
    length: 1,
    convRule: rule48
  }, {
    start: 454,
    length: 1,
    convRule: rule49
  }, {
    start: 455,
    length: 1,
    convRule: rule47
  }, {
    start: 456,
    length: 1,
    convRule: rule48
  }, {
    start: 457,
    length: 1,
    convRule: rule49
  }, {
    start: 458,
    length: 1,
    convRule: rule47
  }, {
    start: 459,
    length: 1,
    convRule: rule48
  }, {
    start: 460,
    length: 1,
    convRule: rule49
  }, {
    start: 461,
    length: 1,
    convRule: rule22
  }, {
    start: 462,
    length: 1,
    convRule: rule23
  }, {
    start: 463,
    length: 1,
    convRule: rule22
  }, {
    start: 464,
    length: 1,
    convRule: rule23
  }, {
    start: 465,
    length: 1,
    convRule: rule22
  }, {
    start: 466,
    length: 1,
    convRule: rule23
  }, {
    start: 467,
    length: 1,
    convRule: rule22
  }, {
    start: 468,
    length: 1,
    convRule: rule23
  }, {
    start: 469,
    length: 1,
    convRule: rule22
  }, {
    start: 470,
    length: 1,
    convRule: rule23
  }, {
    start: 471,
    length: 1,
    convRule: rule22
  }, {
    start: 472,
    length: 1,
    convRule: rule23
  }, {
    start: 473,
    length: 1,
    convRule: rule22
  }, {
    start: 474,
    length: 1,
    convRule: rule23
  }, {
    start: 475,
    length: 1,
    convRule: rule22
  }, {
    start: 476,
    length: 1,
    convRule: rule23
  }, {
    start: 477,
    length: 1,
    convRule: rule50
  }, {
    start: 478,
    length: 1,
    convRule: rule22
  }, {
    start: 479,
    length: 1,
    convRule: rule23
  }, {
    start: 480,
    length: 1,
    convRule: rule22
  }, {
    start: 481,
    length: 1,
    convRule: rule23
  }, {
    start: 482,
    length: 1,
    convRule: rule22
  }, {
    start: 483,
    length: 1,
    convRule: rule23
  }, {
    start: 484,
    length: 1,
    convRule: rule22
  }, {
    start: 485,
    length: 1,
    convRule: rule23
  }, {
    start: 486,
    length: 1,
    convRule: rule22
  }, {
    start: 487,
    length: 1,
    convRule: rule23
  }, {
    start: 488,
    length: 1,
    convRule: rule22
  }, {
    start: 489,
    length: 1,
    convRule: rule23
  }, {
    start: 490,
    length: 1,
    convRule: rule22
  }, {
    start: 491,
    length: 1,
    convRule: rule23
  }, {
    start: 492,
    length: 1,
    convRule: rule22
  }, {
    start: 493,
    length: 1,
    convRule: rule23
  }, {
    start: 494,
    length: 1,
    convRule: rule22
  }, {
    start: 495,
    length: 1,
    convRule: rule23
  }, {
    start: 496,
    length: 1,
    convRule: rule20
  }, {
    start: 497,
    length: 1,
    convRule: rule47
  }, {
    start: 498,
    length: 1,
    convRule: rule48
  }, {
    start: 499,
    length: 1,
    convRule: rule49
  }, {
    start: 500,
    length: 1,
    convRule: rule22
  }, {
    start: 501,
    length: 1,
    convRule: rule23
  }, {
    start: 502,
    length: 1,
    convRule: rule51
  }, {
    start: 503,
    length: 1,
    convRule: rule52
  }, {
    start: 504,
    length: 1,
    convRule: rule22
  }, {
    start: 505,
    length: 1,
    convRule: rule23
  }, {
    start: 506,
    length: 1,
    convRule: rule22
  }, {
    start: 507,
    length: 1,
    convRule: rule23
  }, {
    start: 508,
    length: 1,
    convRule: rule22
  }, {
    start: 509,
    length: 1,
    convRule: rule23
  }, {
    start: 510,
    length: 1,
    convRule: rule22
  }, {
    start: 511,
    length: 1,
    convRule: rule23
  }, {
    start: 512,
    length: 1,
    convRule: rule22
  }, {
    start: 513,
    length: 1,
    convRule: rule23
  }, {
    start: 514,
    length: 1,
    convRule: rule22
  }, {
    start: 515,
    length: 1,
    convRule: rule23
  }, {
    start: 516,
    length: 1,
    convRule: rule22
  }, {
    start: 517,
    length: 1,
    convRule: rule23
  }, {
    start: 518,
    length: 1,
    convRule: rule22
  }, {
    start: 519,
    length: 1,
    convRule: rule23
  }, {
    start: 520,
    length: 1,
    convRule: rule22
  }, {
    start: 521,
    length: 1,
    convRule: rule23
  }, {
    start: 522,
    length: 1,
    convRule: rule22
  }, {
    start: 523,
    length: 1,
    convRule: rule23
  }, {
    start: 524,
    length: 1,
    convRule: rule22
  }, {
    start: 525,
    length: 1,
    convRule: rule23
  }, {
    start: 526,
    length: 1,
    convRule: rule22
  }, {
    start: 527,
    length: 1,
    convRule: rule23
  }, {
    start: 528,
    length: 1,
    convRule: rule22
  }, {
    start: 529,
    length: 1,
    convRule: rule23
  }, {
    start: 530,
    length: 1,
    convRule: rule22
  }, {
    start: 531,
    length: 1,
    convRule: rule23
  }, {
    start: 532,
    length: 1,
    convRule: rule22
  }, {
    start: 533,
    length: 1,
    convRule: rule23
  }, {
    start: 534,
    length: 1,
    convRule: rule22
  }, {
    start: 535,
    length: 1,
    convRule: rule23
  }, {
    start: 536,
    length: 1,
    convRule: rule22
  }, {
    start: 537,
    length: 1,
    convRule: rule23
  }, {
    start: 538,
    length: 1,
    convRule: rule22
  }, {
    start: 539,
    length: 1,
    convRule: rule23
  }, {
    start: 540,
    length: 1,
    convRule: rule22
  }, {
    start: 541,
    length: 1,
    convRule: rule23
  }, {
    start: 542,
    length: 1,
    convRule: rule22
  }, {
    start: 543,
    length: 1,
    convRule: rule23
  }, {
    start: 544,
    length: 1,
    convRule: rule53
  }, {
    start: 545,
    length: 1,
    convRule: rule20
  }, {
    start: 546,
    length: 1,
    convRule: rule22
  }, {
    start: 547,
    length: 1,
    convRule: rule23
  }, {
    start: 548,
    length: 1,
    convRule: rule22
  }, {
    start: 549,
    length: 1,
    convRule: rule23
  }, {
    start: 550,
    length: 1,
    convRule: rule22
  }, {
    start: 551,
    length: 1,
    convRule: rule23
  }, {
    start: 552,
    length: 1,
    convRule: rule22
  }, {
    start: 553,
    length: 1,
    convRule: rule23
  }, {
    start: 554,
    length: 1,
    convRule: rule22
  }, {
    start: 555,
    length: 1,
    convRule: rule23
  }, {
    start: 556,
    length: 1,
    convRule: rule22
  }, {
    start: 557,
    length: 1,
    convRule: rule23
  }, {
    start: 558,
    length: 1,
    convRule: rule22
  }, {
    start: 559,
    length: 1,
    convRule: rule23
  }, {
    start: 560,
    length: 1,
    convRule: rule22
  }, {
    start: 561,
    length: 1,
    convRule: rule23
  }, {
    start: 562,
    length: 1,
    convRule: rule22
  }, {
    start: 563,
    length: 1,
    convRule: rule23
  }, {
    start: 564,
    length: 6,
    convRule: rule20
  }, {
    start: 570,
    length: 1,
    convRule: rule54
  }, {
    start: 571,
    length: 1,
    convRule: rule22
  }, {
    start: 572,
    length: 1,
    convRule: rule23
  }, {
    start: 573,
    length: 1,
    convRule: rule55
  }, {
    start: 574,
    length: 1,
    convRule: rule56
  }, {
    start: 575,
    length: 2,
    convRule: rule57
  }, {
    start: 577,
    length: 1,
    convRule: rule22
  }, {
    start: 578,
    length: 1,
    convRule: rule23
  }, {
    start: 579,
    length: 1,
    convRule: rule58
  }, {
    start: 580,
    length: 1,
    convRule: rule59
  }, {
    start: 581,
    length: 1,
    convRule: rule60
  }, {
    start: 582,
    length: 1,
    convRule: rule22
  }, {
    start: 583,
    length: 1,
    convRule: rule23
  }, {
    start: 584,
    length: 1,
    convRule: rule22
  }, {
    start: 585,
    length: 1,
    convRule: rule23
  }, {
    start: 586,
    length: 1,
    convRule: rule22
  }, {
    start: 587,
    length: 1,
    convRule: rule23
  }, {
    start: 588,
    length: 1,
    convRule: rule22
  }, {
    start: 589,
    length: 1,
    convRule: rule23
  }, {
    start: 590,
    length: 1,
    convRule: rule22
  }, {
    start: 591,
    length: 1,
    convRule: rule23
  }, {
    start: 592,
    length: 1,
    convRule: rule61
  }, {
    start: 593,
    length: 1,
    convRule: rule62
  }, {
    start: 594,
    length: 1,
    convRule: rule63
  }, {
    start: 595,
    length: 1,
    convRule: rule64
  }, {
    start: 596,
    length: 1,
    convRule: rule65
  }, {
    start: 597,
    length: 1,
    convRule: rule20
  }, {
    start: 598,
    length: 2,
    convRule: rule66
  }, {
    start: 600,
    length: 1,
    convRule: rule20
  }, {
    start: 601,
    length: 1,
    convRule: rule67
  }, {
    start: 602,
    length: 1,
    convRule: rule20
  }, {
    start: 603,
    length: 1,
    convRule: rule68
  }, {
    start: 604,
    length: 1,
    convRule: rule69
  }, {
    start: 605,
    length: 3,
    convRule: rule20
  }, {
    start: 608,
    length: 1,
    convRule: rule66
  }, {
    start: 609,
    length: 1,
    convRule: rule70
  }, {
    start: 610,
    length: 1,
    convRule: rule20
  }, {
    start: 611,
    length: 1,
    convRule: rule71
  }, {
    start: 612,
    length: 1,
    convRule: rule20
  }, {
    start: 613,
    length: 1,
    convRule: rule72
  }, {
    start: 614,
    length: 1,
    convRule: rule73
  }, {
    start: 615,
    length: 1,
    convRule: rule20
  }, {
    start: 616,
    length: 1,
    convRule: rule74
  }, {
    start: 617,
    length: 1,
    convRule: rule75
  }, {
    start: 618,
    length: 1,
    convRule: rule73
  }, {
    start: 619,
    length: 1,
    convRule: rule76
  }, {
    start: 620,
    length: 1,
    convRule: rule77
  }, {
    start: 621,
    length: 2,
    convRule: rule20
  }, {
    start: 623,
    length: 1,
    convRule: rule75
  }, {
    start: 624,
    length: 1,
    convRule: rule20
  }, {
    start: 625,
    length: 1,
    convRule: rule78
  }, {
    start: 626,
    length: 1,
    convRule: rule79
  }, {
    start: 627,
    length: 2,
    convRule: rule20
  }, {
    start: 629,
    length: 1,
    convRule: rule80
  }, {
    start: 630,
    length: 7,
    convRule: rule20
  }, {
    start: 637,
    length: 1,
    convRule: rule81
  }, {
    start: 638,
    length: 2,
    convRule: rule20
  }, {
    start: 640,
    length: 1,
    convRule: rule82
  }, {
    start: 641,
    length: 1,
    convRule: rule20
  }, {
    start: 642,
    length: 1,
    convRule: rule83
  }, {
    start: 643,
    length: 1,
    convRule: rule82
  }, {
    start: 644,
    length: 3,
    convRule: rule20
  }, {
    start: 647,
    length: 1,
    convRule: rule84
  }, {
    start: 648,
    length: 1,
    convRule: rule82
  }, {
    start: 649,
    length: 1,
    convRule: rule85
  }, {
    start: 650,
    length: 2,
    convRule: rule86
  }, {
    start: 652,
    length: 1,
    convRule: rule87
  }, {
    start: 653,
    length: 5,
    convRule: rule20
  }, {
    start: 658,
    length: 1,
    convRule: rule88
  }, {
    start: 659,
    length: 1,
    convRule: rule20
  }, {
    start: 660,
    length: 1,
    convRule: rule14
  }, {
    start: 661,
    length: 8,
    convRule: rule20
  }, {
    start: 669,
    length: 1,
    convRule: rule89
  }, {
    start: 670,
    length: 1,
    convRule: rule90
  }, {
    start: 671,
    length: 17,
    convRule: rule20
  }, {
    start: 688,
    length: 18,
    convRule: rule91
  }, {
    start: 706,
    length: 4,
    convRule: rule10
  }, {
    start: 710,
    length: 12,
    convRule: rule91
  }, {
    start: 722,
    length: 14,
    convRule: rule10
  }, {
    start: 736,
    length: 5,
    convRule: rule91
  }, {
    start: 741,
    length: 7,
    convRule: rule10
  }, {
    start: 748,
    length: 1,
    convRule: rule91
  }, {
    start: 749,
    length: 1,
    convRule: rule10
  }, {
    start: 750,
    length: 1,
    convRule: rule91
  }, {
    start: 751,
    length: 17,
    convRule: rule10
  }, {
    start: 768,
    length: 69,
    convRule: rule92
  }, {
    start: 837,
    length: 1,
    convRule: rule93
  }, {
    start: 838,
    length: 42,
    convRule: rule92
  }, {
    start: 880,
    length: 1,
    convRule: rule22
  }, {
    start: 881,
    length: 1,
    convRule: rule23
  }, {
    start: 882,
    length: 1,
    convRule: rule22
  }, {
    start: 883,
    length: 1,
    convRule: rule23
  }, {
    start: 884,
    length: 1,
    convRule: rule91
  }, {
    start: 885,
    length: 1,
    convRule: rule10
  }, {
    start: 886,
    length: 1,
    convRule: rule22
  }, {
    start: 887,
    length: 1,
    convRule: rule23
  }, {
    start: 890,
    length: 1,
    convRule: rule91
  }, {
    start: 891,
    length: 3,
    convRule: rule41
  }, {
    start: 894,
    length: 1,
    convRule: rule2
  }, {
    start: 895,
    length: 1,
    convRule: rule94
  }, {
    start: 900,
    length: 2,
    convRule: rule10
  }, {
    start: 902,
    length: 1,
    convRule: rule95
  }, {
    start: 903,
    length: 1,
    convRule: rule2
  }, {
    start: 904,
    length: 3,
    convRule: rule96
  }, {
    start: 908,
    length: 1,
    convRule: rule97
  }, {
    start: 910,
    length: 2,
    convRule: rule98
  }, {
    start: 912,
    length: 1,
    convRule: rule20
  }, {
    start: 913,
    length: 17,
    convRule: rule9
  }, {
    start: 931,
    length: 9,
    convRule: rule9
  }, {
    start: 940,
    length: 1,
    convRule: rule99
  }, {
    start: 941,
    length: 3,
    convRule: rule100
  }, {
    start: 944,
    length: 1,
    convRule: rule20
  }, {
    start: 945,
    length: 17,
    convRule: rule12
  }, {
    start: 962,
    length: 1,
    convRule: rule101
  }, {
    start: 963,
    length: 9,
    convRule: rule12
  }, {
    start: 972,
    length: 1,
    convRule: rule102
  }, {
    start: 973,
    length: 2,
    convRule: rule103
  }, {
    start: 975,
    length: 1,
    convRule: rule104
  }, {
    start: 976,
    length: 1,
    convRule: rule105
  }, {
    start: 977,
    length: 1,
    convRule: rule106
  }, {
    start: 978,
    length: 3,
    convRule: rule107
  }, {
    start: 981,
    length: 1,
    convRule: rule108
  }, {
    start: 982,
    length: 1,
    convRule: rule109
  }, {
    start: 983,
    length: 1,
    convRule: rule110
  }, {
    start: 984,
    length: 1,
    convRule: rule22
  }, {
    start: 985,
    length: 1,
    convRule: rule23
  }, {
    start: 986,
    length: 1,
    convRule: rule22
  }, {
    start: 987,
    length: 1,
    convRule: rule23
  }, {
    start: 988,
    length: 1,
    convRule: rule22
  }, {
    start: 989,
    length: 1,
    convRule: rule23
  }, {
    start: 990,
    length: 1,
    convRule: rule22
  }, {
    start: 991,
    length: 1,
    convRule: rule23
  }, {
    start: 992,
    length: 1,
    convRule: rule22
  }, {
    start: 993,
    length: 1,
    convRule: rule23
  }, {
    start: 994,
    length: 1,
    convRule: rule22
  }, {
    start: 995,
    length: 1,
    convRule: rule23
  }, {
    start: 996,
    length: 1,
    convRule: rule22
  }, {
    start: 997,
    length: 1,
    convRule: rule23
  }, {
    start: 998,
    length: 1,
    convRule: rule22
  }, {
    start: 999,
    length: 1,
    convRule: rule23
  }, {
    start: 1e3,
    length: 1,
    convRule: rule22
  }, {
    start: 1001,
    length: 1,
    convRule: rule23
  }, {
    start: 1002,
    length: 1,
    convRule: rule22
  }, {
    start: 1003,
    length: 1,
    convRule: rule23
  }, {
    start: 1004,
    length: 1,
    convRule: rule22
  }, {
    start: 1005,
    length: 1,
    convRule: rule23
  }, {
    start: 1006,
    length: 1,
    convRule: rule22
  }, {
    start: 1007,
    length: 1,
    convRule: rule23
  }, {
    start: 1008,
    length: 1,
    convRule: rule111
  }, {
    start: 1009,
    length: 1,
    convRule: rule112
  }, {
    start: 1010,
    length: 1,
    convRule: rule113
  }, {
    start: 1011,
    length: 1,
    convRule: rule114
  }, {
    start: 1012,
    length: 1,
    convRule: rule115
  }, {
    start: 1013,
    length: 1,
    convRule: rule116
  }, {
    start: 1014,
    length: 1,
    convRule: rule6
  }, {
    start: 1015,
    length: 1,
    convRule: rule22
  }, {
    start: 1016,
    length: 1,
    convRule: rule23
  }, {
    start: 1017,
    length: 1,
    convRule: rule117
  }, {
    start: 1018,
    length: 1,
    convRule: rule22
  }, {
    start: 1019,
    length: 1,
    convRule: rule23
  }, {
    start: 1020,
    length: 1,
    convRule: rule20
  }, {
    start: 1021,
    length: 3,
    convRule: rule53
  }, {
    start: 1024,
    length: 16,
    convRule: rule118
  }, {
    start: 1040,
    length: 32,
    convRule: rule9
  }, {
    start: 1072,
    length: 32,
    convRule: rule12
  }, {
    start: 1104,
    length: 16,
    convRule: rule112
  }, {
    start: 1120,
    length: 1,
    convRule: rule22
  }, {
    start: 1121,
    length: 1,
    convRule: rule23
  }, {
    start: 1122,
    length: 1,
    convRule: rule22
  }, {
    start: 1123,
    length: 1,
    convRule: rule23
  }, {
    start: 1124,
    length: 1,
    convRule: rule22
  }, {
    start: 1125,
    length: 1,
    convRule: rule23
  }, {
    start: 1126,
    length: 1,
    convRule: rule22
  }, {
    start: 1127,
    length: 1,
    convRule: rule23
  }, {
    start: 1128,
    length: 1,
    convRule: rule22
  }, {
    start: 1129,
    length: 1,
    convRule: rule23
  }, {
    start: 1130,
    length: 1,
    convRule: rule22
  }, {
    start: 1131,
    length: 1,
    convRule: rule23
  }, {
    start: 1132,
    length: 1,
    convRule: rule22
  }, {
    start: 1133,
    length: 1,
    convRule: rule23
  }, {
    start: 1134,
    length: 1,
    convRule: rule22
  }, {
    start: 1135,
    length: 1,
    convRule: rule23
  }, {
    start: 1136,
    length: 1,
    convRule: rule22
  }, {
    start: 1137,
    length: 1,
    convRule: rule23
  }, {
    start: 1138,
    length: 1,
    convRule: rule22
  }, {
    start: 1139,
    length: 1,
    convRule: rule23
  }, {
    start: 1140,
    length: 1,
    convRule: rule22
  }, {
    start: 1141,
    length: 1,
    convRule: rule23
  }, {
    start: 1142,
    length: 1,
    convRule: rule22
  }, {
    start: 1143,
    length: 1,
    convRule: rule23
  }, {
    start: 1144,
    length: 1,
    convRule: rule22
  }, {
    start: 1145,
    length: 1,
    convRule: rule23
  }, {
    start: 1146,
    length: 1,
    convRule: rule22
  }, {
    start: 1147,
    length: 1,
    convRule: rule23
  }, {
    start: 1148,
    length: 1,
    convRule: rule22
  }, {
    start: 1149,
    length: 1,
    convRule: rule23
  }, {
    start: 1150,
    length: 1,
    convRule: rule22
  }, {
    start: 1151,
    length: 1,
    convRule: rule23
  }, {
    start: 1152,
    length: 1,
    convRule: rule22
  }, {
    start: 1153,
    length: 1,
    convRule: rule23
  }, {
    start: 1154,
    length: 1,
    convRule: rule13
  }, {
    start: 1155,
    length: 5,
    convRule: rule92
  }, {
    start: 1160,
    length: 2,
    convRule: rule119
  }, {
    start: 1162,
    length: 1,
    convRule: rule22
  }, {
    start: 1163,
    length: 1,
    convRule: rule23
  }, {
    start: 1164,
    length: 1,
    convRule: rule22
  }, {
    start: 1165,
    length: 1,
    convRule: rule23
  }, {
    start: 1166,
    length: 1,
    convRule: rule22
  }, {
    start: 1167,
    length: 1,
    convRule: rule23
  }, {
    start: 1168,
    length: 1,
    convRule: rule22
  }, {
    start: 1169,
    length: 1,
    convRule: rule23
  }, {
    start: 1170,
    length: 1,
    convRule: rule22
  }, {
    start: 1171,
    length: 1,
    convRule: rule23
  }, {
    start: 1172,
    length: 1,
    convRule: rule22
  }, {
    start: 1173,
    length: 1,
    convRule: rule23
  }, {
    start: 1174,
    length: 1,
    convRule: rule22
  }, {
    start: 1175,
    length: 1,
    convRule: rule23
  }, {
    start: 1176,
    length: 1,
    convRule: rule22
  }, {
    start: 1177,
    length: 1,
    convRule: rule23
  }, {
    start: 1178,
    length: 1,
    convRule: rule22
  }, {
    start: 1179,
    length: 1,
    convRule: rule23
  }, {
    start: 1180,
    length: 1,
    convRule: rule22
  }, {
    start: 1181,
    length: 1,
    convRule: rule23
  }, {
    start: 1182,
    length: 1,
    convRule: rule22
  }, {
    start: 1183,
    length: 1,
    convRule: rule23
  }, {
    start: 1184,
    length: 1,
    convRule: rule22
  }, {
    start: 1185,
    length: 1,
    convRule: rule23
  }, {
    start: 1186,
    length: 1,
    convRule: rule22
  }, {
    start: 1187,
    length: 1,
    convRule: rule23
  }, {
    start: 1188,
    length: 1,
    convRule: rule22
  }, {
    start: 1189,
    length: 1,
    convRule: rule23
  }, {
    start: 1190,
    length: 1,
    convRule: rule22
  }, {
    start: 1191,
    length: 1,
    convRule: rule23
  }, {
    start: 1192,
    length: 1,
    convRule: rule22
  }, {
    start: 1193,
    length: 1,
    convRule: rule23
  }, {
    start: 1194,
    length: 1,
    convRule: rule22
  }, {
    start: 1195,
    length: 1,
    convRule: rule23
  }, {
    start: 1196,
    length: 1,
    convRule: rule22
  }, {
    start: 1197,
    length: 1,
    convRule: rule23
  }, {
    start: 1198,
    length: 1,
    convRule: rule22
  }, {
    start: 1199,
    length: 1,
    convRule: rule23
  }, {
    start: 1200,
    length: 1,
    convRule: rule22
  }, {
    start: 1201,
    length: 1,
    convRule: rule23
  }, {
    start: 1202,
    length: 1,
    convRule: rule22
  }, {
    start: 1203,
    length: 1,
    convRule: rule23
  }, {
    start: 1204,
    length: 1,
    convRule: rule22
  }, {
    start: 1205,
    length: 1,
    convRule: rule23
  }, {
    start: 1206,
    length: 1,
    convRule: rule22
  }, {
    start: 1207,
    length: 1,
    convRule: rule23
  }, {
    start: 1208,
    length: 1,
    convRule: rule22
  }, {
    start: 1209,
    length: 1,
    convRule: rule23
  }, {
    start: 1210,
    length: 1,
    convRule: rule22
  }, {
    start: 1211,
    length: 1,
    convRule: rule23
  }, {
    start: 1212,
    length: 1,
    convRule: rule22
  }, {
    start: 1213,
    length: 1,
    convRule: rule23
  }, {
    start: 1214,
    length: 1,
    convRule: rule22
  }, {
    start: 1215,
    length: 1,
    convRule: rule23
  }, {
    start: 1216,
    length: 1,
    convRule: rule120
  }, {
    start: 1217,
    length: 1,
    convRule: rule22
  }, {
    start: 1218,
    length: 1,
    convRule: rule23
  }, {
    start: 1219,
    length: 1,
    convRule: rule22
  }, {
    start: 1220,
    length: 1,
    convRule: rule23
  }, {
    start: 1221,
    length: 1,
    convRule: rule22
  }, {
    start: 1222,
    length: 1,
    convRule: rule23
  }, {
    start: 1223,
    length: 1,
    convRule: rule22
  }, {
    start: 1224,
    length: 1,
    convRule: rule23
  }, {
    start: 1225,
    length: 1,
    convRule: rule22
  }, {
    start: 1226,
    length: 1,
    convRule: rule23
  }, {
    start: 1227,
    length: 1,
    convRule: rule22
  }, {
    start: 1228,
    length: 1,
    convRule: rule23
  }, {
    start: 1229,
    length: 1,
    convRule: rule22
  }, {
    start: 1230,
    length: 1,
    convRule: rule23
  }, {
    start: 1231,
    length: 1,
    convRule: rule121
  }, {
    start: 1232,
    length: 1,
    convRule: rule22
  }, {
    start: 1233,
    length: 1,
    convRule: rule23
  }, {
    start: 1234,
    length: 1,
    convRule: rule22
  }, {
    start: 1235,
    length: 1,
    convRule: rule23
  }, {
    start: 1236,
    length: 1,
    convRule: rule22
  }, {
    start: 1237,
    length: 1,
    convRule: rule23
  }, {
    start: 1238,
    length: 1,
    convRule: rule22
  }, {
    start: 1239,
    length: 1,
    convRule: rule23
  }, {
    start: 1240,
    length: 1,
    convRule: rule22
  }, {
    start: 1241,
    length: 1,
    convRule: rule23
  }, {
    start: 1242,
    length: 1,
    convRule: rule22
  }, {
    start: 1243,
    length: 1,
    convRule: rule23
  }, {
    start: 1244,
    length: 1,
    convRule: rule22
  }, {
    start: 1245,
    length: 1,
    convRule: rule23
  }, {
    start: 1246,
    length: 1,
    convRule: rule22
  }, {
    start: 1247,
    length: 1,
    convRule: rule23
  }, {
    start: 1248,
    length: 1,
    convRule: rule22
  }, {
    start: 1249,
    length: 1,
    convRule: rule23
  }, {
    start: 1250,
    length: 1,
    convRule: rule22
  }, {
    start: 1251,
    length: 1,
    convRule: rule23
  }, {
    start: 1252,
    length: 1,
    convRule: rule22
  }, {
    start: 1253,
    length: 1,
    convRule: rule23
  }, {
    start: 1254,
    length: 1,
    convRule: rule22
  }, {
    start: 1255,
    length: 1,
    convRule: rule23
  }, {
    start: 1256,
    length: 1,
    convRule: rule22
  }, {
    start: 1257,
    length: 1,
    convRule: rule23
  }, {
    start: 1258,
    length: 1,
    convRule: rule22
  }, {
    start: 1259,
    length: 1,
    convRule: rule23
  }, {
    start: 1260,
    length: 1,
    convRule: rule22
  }, {
    start: 1261,
    length: 1,
    convRule: rule23
  }, {
    start: 1262,
    length: 1,
    convRule: rule22
  }, {
    start: 1263,
    length: 1,
    convRule: rule23
  }, {
    start: 1264,
    length: 1,
    convRule: rule22
  }, {
    start: 1265,
    length: 1,
    convRule: rule23
  }, {
    start: 1266,
    length: 1,
    convRule: rule22
  }, {
    start: 1267,
    length: 1,
    convRule: rule23
  }, {
    start: 1268,
    length: 1,
    convRule: rule22
  }, {
    start: 1269,
    length: 1,
    convRule: rule23
  }, {
    start: 1270,
    length: 1,
    convRule: rule22
  }, {
    start: 1271,
    length: 1,
    convRule: rule23
  }, {
    start: 1272,
    length: 1,
    convRule: rule22
  }, {
    start: 1273,
    length: 1,
    convRule: rule23
  }, {
    start: 1274,
    length: 1,
    convRule: rule22
  }, {
    start: 1275,
    length: 1,
    convRule: rule23
  }, {
    start: 1276,
    length: 1,
    convRule: rule22
  }, {
    start: 1277,
    length: 1,
    convRule: rule23
  }, {
    start: 1278,
    length: 1,
    convRule: rule22
  }, {
    start: 1279,
    length: 1,
    convRule: rule23
  }, {
    start: 1280,
    length: 1,
    convRule: rule22
  }, {
    start: 1281,
    length: 1,
    convRule: rule23
  }, {
    start: 1282,
    length: 1,
    convRule: rule22
  }, {
    start: 1283,
    length: 1,
    convRule: rule23
  }, {
    start: 1284,
    length: 1,
    convRule: rule22
  }, {
    start: 1285,
    length: 1,
    convRule: rule23
  }, {
    start: 1286,
    length: 1,
    convRule: rule22
  }, {
    start: 1287,
    length: 1,
    convRule: rule23
  }, {
    start: 1288,
    length: 1,
    convRule: rule22
  }, {
    start: 1289,
    length: 1,
    convRule: rule23
  }, {
    start: 1290,
    length: 1,
    convRule: rule22
  }, {
    start: 1291,
    length: 1,
    convRule: rule23
  }, {
    start: 1292,
    length: 1,
    convRule: rule22
  }, {
    start: 1293,
    length: 1,
    convRule: rule23
  }, {
    start: 1294,
    length: 1,
    convRule: rule22
  }, {
    start: 1295,
    length: 1,
    convRule: rule23
  }, {
    start: 1296,
    length: 1,
    convRule: rule22
  }, {
    start: 1297,
    length: 1,
    convRule: rule23
  }, {
    start: 1298,
    length: 1,
    convRule: rule22
  }, {
    start: 1299,
    length: 1,
    convRule: rule23
  }, {
    start: 1300,
    length: 1,
    convRule: rule22
  }, {
    start: 1301,
    length: 1,
    convRule: rule23
  }, {
    start: 1302,
    length: 1,
    convRule: rule22
  }, {
    start: 1303,
    length: 1,
    convRule: rule23
  }, {
    start: 1304,
    length: 1,
    convRule: rule22
  }, {
    start: 1305,
    length: 1,
    convRule: rule23
  }, {
    start: 1306,
    length: 1,
    convRule: rule22
  }, {
    start: 1307,
    length: 1,
    convRule: rule23
  }, {
    start: 1308,
    length: 1,
    convRule: rule22
  }, {
    start: 1309,
    length: 1,
    convRule: rule23
  }, {
    start: 1310,
    length: 1,
    convRule: rule22
  }, {
    start: 1311,
    length: 1,
    convRule: rule23
  }, {
    start: 1312,
    length: 1,
    convRule: rule22
  }, {
    start: 1313,
    length: 1,
    convRule: rule23
  }, {
    start: 1314,
    length: 1,
    convRule: rule22
  }, {
    start: 1315,
    length: 1,
    convRule: rule23
  }, {
    start: 1316,
    length: 1,
    convRule: rule22
  }, {
    start: 1317,
    length: 1,
    convRule: rule23
  }, {
    start: 1318,
    length: 1,
    convRule: rule22
  }, {
    start: 1319,
    length: 1,
    convRule: rule23
  }, {
    start: 1320,
    length: 1,
    convRule: rule22
  }, {
    start: 1321,
    length: 1,
    convRule: rule23
  }, {
    start: 1322,
    length: 1,
    convRule: rule22
  }, {
    start: 1323,
    length: 1,
    convRule: rule23
  }, {
    start: 1324,
    length: 1,
    convRule: rule22
  }, {
    start: 1325,
    length: 1,
    convRule: rule23
  }, {
    start: 1326,
    length: 1,
    convRule: rule22
  }, {
    start: 1327,
    length: 1,
    convRule: rule23
  }, {
    start: 1329,
    length: 38,
    convRule: rule122
  }, {
    start: 1369,
    length: 1,
    convRule: rule91
  }, {
    start: 1370,
    length: 6,
    convRule: rule2
  }, {
    start: 1376,
    length: 1,
    convRule: rule20
  }, {
    start: 1377,
    length: 38,
    convRule: rule123
  }, {
    start: 1415,
    length: 2,
    convRule: rule20
  }, {
    start: 1417,
    length: 1,
    convRule: rule2
  }, {
    start: 1418,
    length: 1,
    convRule: rule7
  }, {
    start: 1421,
    length: 2,
    convRule: rule13
  }, {
    start: 1423,
    length: 1,
    convRule: rule3
  }, {
    start: 1425,
    length: 45,
    convRule: rule92
  }, {
    start: 1470,
    length: 1,
    convRule: rule7
  }, {
    start: 1471,
    length: 1,
    convRule: rule92
  }, {
    start: 1472,
    length: 1,
    convRule: rule2
  }, {
    start: 1473,
    length: 2,
    convRule: rule92
  }, {
    start: 1475,
    length: 1,
    convRule: rule2
  }, {
    start: 1476,
    length: 2,
    convRule: rule92
  }, {
    start: 1478,
    length: 1,
    convRule: rule2
  }, {
    start: 1479,
    length: 1,
    convRule: rule92
  }, {
    start: 1488,
    length: 27,
    convRule: rule14
  }, {
    start: 1519,
    length: 4,
    convRule: rule14
  }, {
    start: 1523,
    length: 2,
    convRule: rule2
  }, {
    start: 1536,
    length: 6,
    convRule: rule16
  }, {
    start: 1542,
    length: 3,
    convRule: rule6
  }, {
    start: 1545,
    length: 2,
    convRule: rule2
  }, {
    start: 1547,
    length: 1,
    convRule: rule3
  }, {
    start: 1548,
    length: 2,
    convRule: rule2
  }, {
    start: 1550,
    length: 2,
    convRule: rule13
  }, {
    start: 1552,
    length: 11,
    convRule: rule92
  }, {
    start: 1563,
    length: 1,
    convRule: rule2
  }, {
    start: 1564,
    length: 1,
    convRule: rule16
  }, {
    start: 1566,
    length: 2,
    convRule: rule2
  }, {
    start: 1568,
    length: 32,
    convRule: rule14
  }, {
    start: 1600,
    length: 1,
    convRule: rule91
  }, {
    start: 1601,
    length: 10,
    convRule: rule14
  }, {
    start: 1611,
    length: 21,
    convRule: rule92
  }, {
    start: 1632,
    length: 10,
    convRule: rule8
  }, {
    start: 1642,
    length: 4,
    convRule: rule2
  }, {
    start: 1646,
    length: 2,
    convRule: rule14
  }, {
    start: 1648,
    length: 1,
    convRule: rule92
  }, {
    start: 1649,
    length: 99,
    convRule: rule14
  }, {
    start: 1748,
    length: 1,
    convRule: rule2
  }, {
    start: 1749,
    length: 1,
    convRule: rule14
  }, {
    start: 1750,
    length: 7,
    convRule: rule92
  }, {
    start: 1757,
    length: 1,
    convRule: rule16
  }, {
    start: 1758,
    length: 1,
    convRule: rule13
  }, {
    start: 1759,
    length: 6,
    convRule: rule92
  }, {
    start: 1765,
    length: 2,
    convRule: rule91
  }, {
    start: 1767,
    length: 2,
    convRule: rule92
  }, {
    start: 1769,
    length: 1,
    convRule: rule13
  }, {
    start: 1770,
    length: 4,
    convRule: rule92
  }, {
    start: 1774,
    length: 2,
    convRule: rule14
  }, {
    start: 1776,
    length: 10,
    convRule: rule8
  }, {
    start: 1786,
    length: 3,
    convRule: rule14
  }, {
    start: 1789,
    length: 2,
    convRule: rule13
  }, {
    start: 1791,
    length: 1,
    convRule: rule14
  }, {
    start: 1792,
    length: 14,
    convRule: rule2
  }, {
    start: 1807,
    length: 1,
    convRule: rule16
  }, {
    start: 1808,
    length: 1,
    convRule: rule14
  }, {
    start: 1809,
    length: 1,
    convRule: rule92
  }, {
    start: 1810,
    length: 30,
    convRule: rule14
  }, {
    start: 1840,
    length: 27,
    convRule: rule92
  }, {
    start: 1869,
    length: 89,
    convRule: rule14
  }, {
    start: 1958,
    length: 11,
    convRule: rule92
  }, {
    start: 1969,
    length: 1,
    convRule: rule14
  }, {
    start: 1984,
    length: 10,
    convRule: rule8
  }, {
    start: 1994,
    length: 33,
    convRule: rule14
  }, {
    start: 2027,
    length: 9,
    convRule: rule92
  }, {
    start: 2036,
    length: 2,
    convRule: rule91
  }, {
    start: 2038,
    length: 1,
    convRule: rule13
  }, {
    start: 2039,
    length: 3,
    convRule: rule2
  }, {
    start: 2042,
    length: 1,
    convRule: rule91
  }, {
    start: 2045,
    length: 1,
    convRule: rule92
  }, {
    start: 2046,
    length: 2,
    convRule: rule3
  }, {
    start: 2048,
    length: 22,
    convRule: rule14
  }, {
    start: 2070,
    length: 4,
    convRule: rule92
  }, {
    start: 2074,
    length: 1,
    convRule: rule91
  }, {
    start: 2075,
    length: 9,
    convRule: rule92
  }, {
    start: 2084,
    length: 1,
    convRule: rule91
  }, {
    start: 2085,
    length: 3,
    convRule: rule92
  }, {
    start: 2088,
    length: 1,
    convRule: rule91
  }, {
    start: 2089,
    length: 5,
    convRule: rule92
  }, {
    start: 2096,
    length: 15,
    convRule: rule2
  }, {
    start: 2112,
    length: 25,
    convRule: rule14
  }, {
    start: 2137,
    length: 3,
    convRule: rule92
  }, {
    start: 2142,
    length: 1,
    convRule: rule2
  }, {
    start: 2144,
    length: 11,
    convRule: rule14
  }, {
    start: 2208,
    length: 21,
    convRule: rule14
  }, {
    start: 2230,
    length: 18,
    convRule: rule14
  }, {
    start: 2259,
    length: 15,
    convRule: rule92
  }, {
    start: 2274,
    length: 1,
    convRule: rule16
  }, {
    start: 2275,
    length: 32,
    convRule: rule92
  }, {
    start: 2307,
    length: 1,
    convRule: rule124
  }, {
    start: 2308,
    length: 54,
    convRule: rule14
  }, {
    start: 2362,
    length: 1,
    convRule: rule92
  }, {
    start: 2363,
    length: 1,
    convRule: rule124
  }, {
    start: 2364,
    length: 1,
    convRule: rule92
  }, {
    start: 2365,
    length: 1,
    convRule: rule14
  }, {
    start: 2366,
    length: 3,
    convRule: rule124
  }, {
    start: 2369,
    length: 8,
    convRule: rule92
  }, {
    start: 2377,
    length: 4,
    convRule: rule124
  }, {
    start: 2381,
    length: 1,
    convRule: rule92
  }, {
    start: 2382,
    length: 2,
    convRule: rule124
  }, {
    start: 2384,
    length: 1,
    convRule: rule14
  }, {
    start: 2385,
    length: 7,
    convRule: rule92
  }, {
    start: 2392,
    length: 10,
    convRule: rule14
  }, {
    start: 2402,
    length: 2,
    convRule: rule92
  }, {
    start: 2404,
    length: 2,
    convRule: rule2
  }, {
    start: 2406,
    length: 10,
    convRule: rule8
  }, {
    start: 2416,
    length: 1,
    convRule: rule2
  }, {
    start: 2417,
    length: 1,
    convRule: rule91
  }, {
    start: 2418,
    length: 15,
    convRule: rule14
  }, {
    start: 2433,
    length: 1,
    convRule: rule92
  }, {
    start: 2434,
    length: 2,
    convRule: rule124
  }, {
    start: 2437,
    length: 8,
    convRule: rule14
  }, {
    start: 2447,
    length: 2,
    convRule: rule14
  }, {
    start: 2451,
    length: 22,
    convRule: rule14
  }, {
    start: 2474,
    length: 7,
    convRule: rule14
  }, {
    start: 2482,
    length: 1,
    convRule: rule14
  }, {
    start: 2486,
    length: 4,
    convRule: rule14
  }, {
    start: 2492,
    length: 1,
    convRule: rule92
  }, {
    start: 2493,
    length: 1,
    convRule: rule14
  }, {
    start: 2494,
    length: 3,
    convRule: rule124
  }, {
    start: 2497,
    length: 4,
    convRule: rule92
  }, {
    start: 2503,
    length: 2,
    convRule: rule124
  }, {
    start: 2507,
    length: 2,
    convRule: rule124
  }, {
    start: 2509,
    length: 1,
    convRule: rule92
  }, {
    start: 2510,
    length: 1,
    convRule: rule14
  }, {
    start: 2519,
    length: 1,
    convRule: rule124
  }, {
    start: 2524,
    length: 2,
    convRule: rule14
  }, {
    start: 2527,
    length: 3,
    convRule: rule14
  }, {
    start: 2530,
    length: 2,
    convRule: rule92
  }, {
    start: 2534,
    length: 10,
    convRule: rule8
  }, {
    start: 2544,
    length: 2,
    convRule: rule14
  }, {
    start: 2546,
    length: 2,
    convRule: rule3
  }, {
    start: 2548,
    length: 6,
    convRule: rule17
  }, {
    start: 2554,
    length: 1,
    convRule: rule13
  }, {
    start: 2555,
    length: 1,
    convRule: rule3
  }, {
    start: 2556,
    length: 1,
    convRule: rule14
  }, {
    start: 2557,
    length: 1,
    convRule: rule2
  }, {
    start: 2558,
    length: 1,
    convRule: rule92
  }, {
    start: 2561,
    length: 2,
    convRule: rule92
  }, {
    start: 2563,
    length: 1,
    convRule: rule124
  }, {
    start: 2565,
    length: 6,
    convRule: rule14
  }, {
    start: 2575,
    length: 2,
    convRule: rule14
  }, {
    start: 2579,
    length: 22,
    convRule: rule14
  }, {
    start: 2602,
    length: 7,
    convRule: rule14
  }, {
    start: 2610,
    length: 2,
    convRule: rule14
  }, {
    start: 2613,
    length: 2,
    convRule: rule14
  }, {
    start: 2616,
    length: 2,
    convRule: rule14
  }, {
    start: 2620,
    length: 1,
    convRule: rule92
  }, {
    start: 2622,
    length: 3,
    convRule: rule124
  }, {
    start: 2625,
    length: 2,
    convRule: rule92
  }, {
    start: 2631,
    length: 2,
    convRule: rule92
  }, {
    start: 2635,
    length: 3,
    convRule: rule92
  }, {
    start: 2641,
    length: 1,
    convRule: rule92
  }, {
    start: 2649,
    length: 4,
    convRule: rule14
  }, {
    start: 2654,
    length: 1,
    convRule: rule14
  }, {
    start: 2662,
    length: 10,
    convRule: rule8
  }, {
    start: 2672,
    length: 2,
    convRule: rule92
  }, {
    start: 2674,
    length: 3,
    convRule: rule14
  }, {
    start: 2677,
    length: 1,
    convRule: rule92
  }, {
    start: 2678,
    length: 1,
    convRule: rule2
  }, {
    start: 2689,
    length: 2,
    convRule: rule92
  }, {
    start: 2691,
    length: 1,
    convRule: rule124
  }, {
    start: 2693,
    length: 9,
    convRule: rule14
  }, {
    start: 2703,
    length: 3,
    convRule: rule14
  }, {
    start: 2707,
    length: 22,
    convRule: rule14
  }, {
    start: 2730,
    length: 7,
    convRule: rule14
  }, {
    start: 2738,
    length: 2,
    convRule: rule14
  }, {
    start: 2741,
    length: 5,
    convRule: rule14
  }, {
    start: 2748,
    length: 1,
    convRule: rule92
  }, {
    start: 2749,
    length: 1,
    convRule: rule14
  }, {
    start: 2750,
    length: 3,
    convRule: rule124
  }, {
    start: 2753,
    length: 5,
    convRule: rule92
  }, {
    start: 2759,
    length: 2,
    convRule: rule92
  }, {
    start: 2761,
    length: 1,
    convRule: rule124
  }, {
    start: 2763,
    length: 2,
    convRule: rule124
  }, {
    start: 2765,
    length: 1,
    convRule: rule92
  }, {
    start: 2768,
    length: 1,
    convRule: rule14
  }, {
    start: 2784,
    length: 2,
    convRule: rule14
  }, {
    start: 2786,
    length: 2,
    convRule: rule92
  }, {
    start: 2790,
    length: 10,
    convRule: rule8
  }, {
    start: 2800,
    length: 1,
    convRule: rule2
  }, {
    start: 2801,
    length: 1,
    convRule: rule3
  }, {
    start: 2809,
    length: 1,
    convRule: rule14
  }, {
    start: 2810,
    length: 6,
    convRule: rule92
  }, {
    start: 2817,
    length: 1,
    convRule: rule92
  }, {
    start: 2818,
    length: 2,
    convRule: rule124
  }, {
    start: 2821,
    length: 8,
    convRule: rule14
  }, {
    start: 2831,
    length: 2,
    convRule: rule14
  }, {
    start: 2835,
    length: 22,
    convRule: rule14
  }, {
    start: 2858,
    length: 7,
    convRule: rule14
  }, {
    start: 2866,
    length: 2,
    convRule: rule14
  }, {
    start: 2869,
    length: 5,
    convRule: rule14
  }, {
    start: 2876,
    length: 1,
    convRule: rule92
  }, {
    start: 2877,
    length: 1,
    convRule: rule14
  }, {
    start: 2878,
    length: 1,
    convRule: rule124
  }, {
    start: 2879,
    length: 1,
    convRule: rule92
  }, {
    start: 2880,
    length: 1,
    convRule: rule124
  }, {
    start: 2881,
    length: 4,
    convRule: rule92
  }, {
    start: 2887,
    length: 2,
    convRule: rule124
  }, {
    start: 2891,
    length: 2,
    convRule: rule124
  }, {
    start: 2893,
    length: 1,
    convRule: rule92
  }, {
    start: 2901,
    length: 2,
    convRule: rule92
  }, {
    start: 2903,
    length: 1,
    convRule: rule124
  }, {
    start: 2908,
    length: 2,
    convRule: rule14
  }, {
    start: 2911,
    length: 3,
    convRule: rule14
  }, {
    start: 2914,
    length: 2,
    convRule: rule92
  }, {
    start: 2918,
    length: 10,
    convRule: rule8
  }, {
    start: 2928,
    length: 1,
    convRule: rule13
  }, {
    start: 2929,
    length: 1,
    convRule: rule14
  }, {
    start: 2930,
    length: 6,
    convRule: rule17
  }, {
    start: 2946,
    length: 1,
    convRule: rule92
  }, {
    start: 2947,
    length: 1,
    convRule: rule14
  }, {
    start: 2949,
    length: 6,
    convRule: rule14
  }, {
    start: 2958,
    length: 3,
    convRule: rule14
  }, {
    start: 2962,
    length: 4,
    convRule: rule14
  }, {
    start: 2969,
    length: 2,
    convRule: rule14
  }, {
    start: 2972,
    length: 1,
    convRule: rule14
  }, {
    start: 2974,
    length: 2,
    convRule: rule14
  }, {
    start: 2979,
    length: 2,
    convRule: rule14
  }, {
    start: 2984,
    length: 3,
    convRule: rule14
  }, {
    start: 2990,
    length: 12,
    convRule: rule14
  }, {
    start: 3006,
    length: 2,
    convRule: rule124
  }, {
    start: 3008,
    length: 1,
    convRule: rule92
  }, {
    start: 3009,
    length: 2,
    convRule: rule124
  }, {
    start: 3014,
    length: 3,
    convRule: rule124
  }, {
    start: 3018,
    length: 3,
    convRule: rule124
  }, {
    start: 3021,
    length: 1,
    convRule: rule92
  }, {
    start: 3024,
    length: 1,
    convRule: rule14
  }, {
    start: 3031,
    length: 1,
    convRule: rule124
  }, {
    start: 3046,
    length: 10,
    convRule: rule8
  }, {
    start: 3056,
    length: 3,
    convRule: rule17
  }, {
    start: 3059,
    length: 6,
    convRule: rule13
  }, {
    start: 3065,
    length: 1,
    convRule: rule3
  }, {
    start: 3066,
    length: 1,
    convRule: rule13
  }, {
    start: 3072,
    length: 1,
    convRule: rule92
  }, {
    start: 3073,
    length: 3,
    convRule: rule124
  }, {
    start: 3076,
    length: 1,
    convRule: rule92
  }, {
    start: 3077,
    length: 8,
    convRule: rule14
  }, {
    start: 3086,
    length: 3,
    convRule: rule14
  }, {
    start: 3090,
    length: 23,
    convRule: rule14
  }, {
    start: 3114,
    length: 16,
    convRule: rule14
  }, {
    start: 3133,
    length: 1,
    convRule: rule14
  }, {
    start: 3134,
    length: 3,
    convRule: rule92
  }, {
    start: 3137,
    length: 4,
    convRule: rule124
  }, {
    start: 3142,
    length: 3,
    convRule: rule92
  }, {
    start: 3146,
    length: 4,
    convRule: rule92
  }, {
    start: 3157,
    length: 2,
    convRule: rule92
  }, {
    start: 3160,
    length: 3,
    convRule: rule14
  }, {
    start: 3168,
    length: 2,
    convRule: rule14
  }, {
    start: 3170,
    length: 2,
    convRule: rule92
  }, {
    start: 3174,
    length: 10,
    convRule: rule8
  }, {
    start: 3191,
    length: 1,
    convRule: rule2
  }, {
    start: 3192,
    length: 7,
    convRule: rule17
  }, {
    start: 3199,
    length: 1,
    convRule: rule13
  }, {
    start: 3200,
    length: 1,
    convRule: rule14
  }, {
    start: 3201,
    length: 1,
    convRule: rule92
  }, {
    start: 3202,
    length: 2,
    convRule: rule124
  }, {
    start: 3204,
    length: 1,
    convRule: rule2
  }, {
    start: 3205,
    length: 8,
    convRule: rule14
  }, {
    start: 3214,
    length: 3,
    convRule: rule14
  }, {
    start: 3218,
    length: 23,
    convRule: rule14
  }, {
    start: 3242,
    length: 10,
    convRule: rule14
  }, {
    start: 3253,
    length: 5,
    convRule: rule14
  }, {
    start: 3260,
    length: 1,
    convRule: rule92
  }, {
    start: 3261,
    length: 1,
    convRule: rule14
  }, {
    start: 3262,
    length: 1,
    convRule: rule124
  }, {
    start: 3263,
    length: 1,
    convRule: rule92
  }, {
    start: 3264,
    length: 5,
    convRule: rule124
  }, {
    start: 3270,
    length: 1,
    convRule: rule92
  }, {
    start: 3271,
    length: 2,
    convRule: rule124
  }, {
    start: 3274,
    length: 2,
    convRule: rule124
  }, {
    start: 3276,
    length: 2,
    convRule: rule92
  }, {
    start: 3285,
    length: 2,
    convRule: rule124
  }, {
    start: 3294,
    length: 1,
    convRule: rule14
  }, {
    start: 3296,
    length: 2,
    convRule: rule14
  }, {
    start: 3298,
    length: 2,
    convRule: rule92
  }, {
    start: 3302,
    length: 10,
    convRule: rule8
  }, {
    start: 3313,
    length: 2,
    convRule: rule14
  }, {
    start: 3328,
    length: 2,
    convRule: rule92
  }, {
    start: 3330,
    length: 2,
    convRule: rule124
  }, {
    start: 3332,
    length: 9,
    convRule: rule14
  }, {
    start: 3342,
    length: 3,
    convRule: rule14
  }, {
    start: 3346,
    length: 41,
    convRule: rule14
  }, {
    start: 3387,
    length: 2,
    convRule: rule92
  }, {
    start: 3389,
    length: 1,
    convRule: rule14
  }, {
    start: 3390,
    length: 3,
    convRule: rule124
  }, {
    start: 3393,
    length: 4,
    convRule: rule92
  }, {
    start: 3398,
    length: 3,
    convRule: rule124
  }, {
    start: 3402,
    length: 3,
    convRule: rule124
  }, {
    start: 3405,
    length: 1,
    convRule: rule92
  }, {
    start: 3406,
    length: 1,
    convRule: rule14
  }, {
    start: 3407,
    length: 1,
    convRule: rule13
  }, {
    start: 3412,
    length: 3,
    convRule: rule14
  }, {
    start: 3415,
    length: 1,
    convRule: rule124
  }, {
    start: 3416,
    length: 7,
    convRule: rule17
  }, {
    start: 3423,
    length: 3,
    convRule: rule14
  }, {
    start: 3426,
    length: 2,
    convRule: rule92
  }, {
    start: 3430,
    length: 10,
    convRule: rule8
  }, {
    start: 3440,
    length: 9,
    convRule: rule17
  }, {
    start: 3449,
    length: 1,
    convRule: rule13
  }, {
    start: 3450,
    length: 6,
    convRule: rule14
  }, {
    start: 3457,
    length: 1,
    convRule: rule92
  }, {
    start: 3458,
    length: 2,
    convRule: rule124
  }, {
    start: 3461,
    length: 18,
    convRule: rule14
  }, {
    start: 3482,
    length: 24,
    convRule: rule14
  }, {
    start: 3507,
    length: 9,
    convRule: rule14
  }, {
    start: 3517,
    length: 1,
    convRule: rule14
  }, {
    start: 3520,
    length: 7,
    convRule: rule14
  }, {
    start: 3530,
    length: 1,
    convRule: rule92
  }, {
    start: 3535,
    length: 3,
    convRule: rule124
  }, {
    start: 3538,
    length: 3,
    convRule: rule92
  }, {
    start: 3542,
    length: 1,
    convRule: rule92
  }, {
    start: 3544,
    length: 8,
    convRule: rule124
  }, {
    start: 3558,
    length: 10,
    convRule: rule8
  }, {
    start: 3570,
    length: 2,
    convRule: rule124
  }, {
    start: 3572,
    length: 1,
    convRule: rule2
  }, {
    start: 3585,
    length: 48,
    convRule: rule14
  }, {
    start: 3633,
    length: 1,
    convRule: rule92
  }, {
    start: 3634,
    length: 2,
    convRule: rule14
  }, {
    start: 3636,
    length: 7,
    convRule: rule92
  }, {
    start: 3647,
    length: 1,
    convRule: rule3
  }, {
    start: 3648,
    length: 6,
    convRule: rule14
  }, {
    start: 3654,
    length: 1,
    convRule: rule91
  }, {
    start: 3655,
    length: 8,
    convRule: rule92
  }, {
    start: 3663,
    length: 1,
    convRule: rule2
  }, {
    start: 3664,
    length: 10,
    convRule: rule8
  }, {
    start: 3674,
    length: 2,
    convRule: rule2
  }, {
    start: 3713,
    length: 2,
    convRule: rule14
  }, {
    start: 3716,
    length: 1,
    convRule: rule14
  }, {
    start: 3718,
    length: 5,
    convRule: rule14
  }, {
    start: 3724,
    length: 24,
    convRule: rule14
  }, {
    start: 3749,
    length: 1,
    convRule: rule14
  }, {
    start: 3751,
    length: 10,
    convRule: rule14
  }, {
    start: 3761,
    length: 1,
    convRule: rule92
  }, {
    start: 3762,
    length: 2,
    convRule: rule14
  }, {
    start: 3764,
    length: 9,
    convRule: rule92
  }, {
    start: 3773,
    length: 1,
    convRule: rule14
  }, {
    start: 3776,
    length: 5,
    convRule: rule14
  }, {
    start: 3782,
    length: 1,
    convRule: rule91
  }, {
    start: 3784,
    length: 6,
    convRule: rule92
  }, {
    start: 3792,
    length: 10,
    convRule: rule8
  }, {
    start: 3804,
    length: 4,
    convRule: rule14
  }, {
    start: 3840,
    length: 1,
    convRule: rule14
  }, {
    start: 3841,
    length: 3,
    convRule: rule13
  }, {
    start: 3844,
    length: 15,
    convRule: rule2
  }, {
    start: 3859,
    length: 1,
    convRule: rule13
  }, {
    start: 3860,
    length: 1,
    convRule: rule2
  }, {
    start: 3861,
    length: 3,
    convRule: rule13
  }, {
    start: 3864,
    length: 2,
    convRule: rule92
  }, {
    start: 3866,
    length: 6,
    convRule: rule13
  }, {
    start: 3872,
    length: 10,
    convRule: rule8
  }, {
    start: 3882,
    length: 10,
    convRule: rule17
  }, {
    start: 3892,
    length: 1,
    convRule: rule13
  }, {
    start: 3893,
    length: 1,
    convRule: rule92
  }, {
    start: 3894,
    length: 1,
    convRule: rule13
  }, {
    start: 3895,
    length: 1,
    convRule: rule92
  }, {
    start: 3896,
    length: 1,
    convRule: rule13
  }, {
    start: 3897,
    length: 1,
    convRule: rule92
  }, {
    start: 3898,
    length: 1,
    convRule: rule4
  }, {
    start: 3899,
    length: 1,
    convRule: rule5
  }, {
    start: 3900,
    length: 1,
    convRule: rule4
  }, {
    start: 3901,
    length: 1,
    convRule: rule5
  }, {
    start: 3902,
    length: 2,
    convRule: rule124
  }, {
    start: 3904,
    length: 8,
    convRule: rule14
  }, {
    start: 3913,
    length: 36,
    convRule: rule14
  }, {
    start: 3953,
    length: 14,
    convRule: rule92
  }, {
    start: 3967,
    length: 1,
    convRule: rule124
  }, {
    start: 3968,
    length: 5,
    convRule: rule92
  }, {
    start: 3973,
    length: 1,
    convRule: rule2
  }, {
    start: 3974,
    length: 2,
    convRule: rule92
  }, {
    start: 3976,
    length: 5,
    convRule: rule14
  }, {
    start: 3981,
    length: 11,
    convRule: rule92
  }, {
    start: 3993,
    length: 36,
    convRule: rule92
  }, {
    start: 4030,
    length: 8,
    convRule: rule13
  }, {
    start: 4038,
    length: 1,
    convRule: rule92
  }, {
    start: 4039,
    length: 6,
    convRule: rule13
  }, {
    start: 4046,
    length: 2,
    convRule: rule13
  }, {
    start: 4048,
    length: 5,
    convRule: rule2
  }, {
    start: 4053,
    length: 4,
    convRule: rule13
  }, {
    start: 4057,
    length: 2,
    convRule: rule2
  }, {
    start: 4096,
    length: 43,
    convRule: rule14
  }, {
    start: 4139,
    length: 2,
    convRule: rule124
  }, {
    start: 4141,
    length: 4,
    convRule: rule92
  }, {
    start: 4145,
    length: 1,
    convRule: rule124
  }, {
    start: 4146,
    length: 6,
    convRule: rule92
  }, {
    start: 4152,
    length: 1,
    convRule: rule124
  }, {
    start: 4153,
    length: 2,
    convRule: rule92
  }, {
    start: 4155,
    length: 2,
    convRule: rule124
  }, {
    start: 4157,
    length: 2,
    convRule: rule92
  }, {
    start: 4159,
    length: 1,
    convRule: rule14
  }, {
    start: 4160,
    length: 10,
    convRule: rule8
  }, {
    start: 4170,
    length: 6,
    convRule: rule2
  }, {
    start: 4176,
    length: 6,
    convRule: rule14
  }, {
    start: 4182,
    length: 2,
    convRule: rule124
  }, {
    start: 4184,
    length: 2,
    convRule: rule92
  }, {
    start: 4186,
    length: 4,
    convRule: rule14
  }, {
    start: 4190,
    length: 3,
    convRule: rule92
  }, {
    start: 4193,
    length: 1,
    convRule: rule14
  }, {
    start: 4194,
    length: 3,
    convRule: rule124
  }, {
    start: 4197,
    length: 2,
    convRule: rule14
  }, {
    start: 4199,
    length: 7,
    convRule: rule124
  }, {
    start: 4206,
    length: 3,
    convRule: rule14
  }, {
    start: 4209,
    length: 4,
    convRule: rule92
  }, {
    start: 4213,
    length: 13,
    convRule: rule14
  }, {
    start: 4226,
    length: 1,
    convRule: rule92
  }, {
    start: 4227,
    length: 2,
    convRule: rule124
  }, {
    start: 4229,
    length: 2,
    convRule: rule92
  }, {
    start: 4231,
    length: 6,
    convRule: rule124
  }, {
    start: 4237,
    length: 1,
    convRule: rule92
  }, {
    start: 4238,
    length: 1,
    convRule: rule14
  }, {
    start: 4239,
    length: 1,
    convRule: rule124
  }, {
    start: 4240,
    length: 10,
    convRule: rule8
  }, {
    start: 4250,
    length: 3,
    convRule: rule124
  }, {
    start: 4253,
    length: 1,
    convRule: rule92
  }, {
    start: 4254,
    length: 2,
    convRule: rule13
  }, {
    start: 4256,
    length: 38,
    convRule: rule125
  }, {
    start: 4295,
    length: 1,
    convRule: rule125
  }, {
    start: 4301,
    length: 1,
    convRule: rule125
  }, {
    start: 4304,
    length: 43,
    convRule: rule126
  }, {
    start: 4347,
    length: 1,
    convRule: rule2
  }, {
    start: 4348,
    length: 1,
    convRule: rule91
  }, {
    start: 4349,
    length: 3,
    convRule: rule126
  }, {
    start: 4352,
    length: 329,
    convRule: rule14
  }, {
    start: 4682,
    length: 4,
    convRule: rule14
  }, {
    start: 4688,
    length: 7,
    convRule: rule14
  }, {
    start: 4696,
    length: 1,
    convRule: rule14
  }, {
    start: 4698,
    length: 4,
    convRule: rule14
  }, {
    start: 4704,
    length: 41,
    convRule: rule14
  }, {
    start: 4746,
    length: 4,
    convRule: rule14
  }, {
    start: 4752,
    length: 33,
    convRule: rule14
  }, {
    start: 4786,
    length: 4,
    convRule: rule14
  }, {
    start: 4792,
    length: 7,
    convRule: rule14
  }, {
    start: 4800,
    length: 1,
    convRule: rule14
  }, {
    start: 4802,
    length: 4,
    convRule: rule14
  }, {
    start: 4808,
    length: 15,
    convRule: rule14
  }, {
    start: 4824,
    length: 57,
    convRule: rule14
  }, {
    start: 4882,
    length: 4,
    convRule: rule14
  }, {
    start: 4888,
    length: 67,
    convRule: rule14
  }, {
    start: 4957,
    length: 3,
    convRule: rule92
  }, {
    start: 4960,
    length: 9,
    convRule: rule2
  }, {
    start: 4969,
    length: 20,
    convRule: rule17
  }, {
    start: 4992,
    length: 16,
    convRule: rule14
  }, {
    start: 5008,
    length: 10,
    convRule: rule13
  }, {
    start: 5024,
    length: 80,
    convRule: rule127
  }, {
    start: 5104,
    length: 6,
    convRule: rule104
  }, {
    start: 5112,
    length: 6,
    convRule: rule110
  }, {
    start: 5120,
    length: 1,
    convRule: rule7
  }, {
    start: 5121,
    length: 620,
    convRule: rule14
  }, {
    start: 5741,
    length: 1,
    convRule: rule13
  }, {
    start: 5742,
    length: 1,
    convRule: rule2
  }, {
    start: 5743,
    length: 17,
    convRule: rule14
  }, {
    start: 5760,
    length: 1,
    convRule: rule1
  }, {
    start: 5761,
    length: 26,
    convRule: rule14
  }, {
    start: 5787,
    length: 1,
    convRule: rule4
  }, {
    start: 5788,
    length: 1,
    convRule: rule5
  }, {
    start: 5792,
    length: 75,
    convRule: rule14
  }, {
    start: 5867,
    length: 3,
    convRule: rule2
  }, {
    start: 5870,
    length: 3,
    convRule: rule128
  }, {
    start: 5873,
    length: 8,
    convRule: rule14
  }, {
    start: 5888,
    length: 13,
    convRule: rule14
  }, {
    start: 5902,
    length: 4,
    convRule: rule14
  }, {
    start: 5906,
    length: 3,
    convRule: rule92
  }, {
    start: 5920,
    length: 18,
    convRule: rule14
  }, {
    start: 5938,
    length: 3,
    convRule: rule92
  }, {
    start: 5941,
    length: 2,
    convRule: rule2
  }, {
    start: 5952,
    length: 18,
    convRule: rule14
  }, {
    start: 5970,
    length: 2,
    convRule: rule92
  }, {
    start: 5984,
    length: 13,
    convRule: rule14
  }, {
    start: 5998,
    length: 3,
    convRule: rule14
  }, {
    start: 6002,
    length: 2,
    convRule: rule92
  }, {
    start: 6016,
    length: 52,
    convRule: rule14
  }, {
    start: 6068,
    length: 2,
    convRule: rule92
  }, {
    start: 6070,
    length: 1,
    convRule: rule124
  }, {
    start: 6071,
    length: 7,
    convRule: rule92
  }, {
    start: 6078,
    length: 8,
    convRule: rule124
  }, {
    start: 6086,
    length: 1,
    convRule: rule92
  }, {
    start: 6087,
    length: 2,
    convRule: rule124
  }, {
    start: 6089,
    length: 11,
    convRule: rule92
  }, {
    start: 6100,
    length: 3,
    convRule: rule2
  }, {
    start: 6103,
    length: 1,
    convRule: rule91
  }, {
    start: 6104,
    length: 3,
    convRule: rule2
  }, {
    start: 6107,
    length: 1,
    convRule: rule3
  }, {
    start: 6108,
    length: 1,
    convRule: rule14
  }, {
    start: 6109,
    length: 1,
    convRule: rule92
  }, {
    start: 6112,
    length: 10,
    convRule: rule8
  }, {
    start: 6128,
    length: 10,
    convRule: rule17
  }, {
    start: 6144,
    length: 6,
    convRule: rule2
  }, {
    start: 6150,
    length: 1,
    convRule: rule7
  }, {
    start: 6151,
    length: 4,
    convRule: rule2
  }, {
    start: 6155,
    length: 3,
    convRule: rule92
  }, {
    start: 6158,
    length: 1,
    convRule: rule16
  }, {
    start: 6160,
    length: 10,
    convRule: rule8
  }, {
    start: 6176,
    length: 35,
    convRule: rule14
  }, {
    start: 6211,
    length: 1,
    convRule: rule91
  }, {
    start: 6212,
    length: 53,
    convRule: rule14
  }, {
    start: 6272,
    length: 5,
    convRule: rule14
  }, {
    start: 6277,
    length: 2,
    convRule: rule92
  }, {
    start: 6279,
    length: 34,
    convRule: rule14
  }, {
    start: 6313,
    length: 1,
    convRule: rule92
  }, {
    start: 6314,
    length: 1,
    convRule: rule14
  }, {
    start: 6320,
    length: 70,
    convRule: rule14
  }, {
    start: 6400,
    length: 31,
    convRule: rule14
  }, {
    start: 6432,
    length: 3,
    convRule: rule92
  }, {
    start: 6435,
    length: 4,
    convRule: rule124
  }, {
    start: 6439,
    length: 2,
    convRule: rule92
  }, {
    start: 6441,
    length: 3,
    convRule: rule124
  }, {
    start: 6448,
    length: 2,
    convRule: rule124
  }, {
    start: 6450,
    length: 1,
    convRule: rule92
  }, {
    start: 6451,
    length: 6,
    convRule: rule124
  }, {
    start: 6457,
    length: 3,
    convRule: rule92
  }, {
    start: 6464,
    length: 1,
    convRule: rule13
  }, {
    start: 6468,
    length: 2,
    convRule: rule2
  }, {
    start: 6470,
    length: 10,
    convRule: rule8
  }, {
    start: 6480,
    length: 30,
    convRule: rule14
  }, {
    start: 6512,
    length: 5,
    convRule: rule14
  }, {
    start: 6528,
    length: 44,
    convRule: rule14
  }, {
    start: 6576,
    length: 26,
    convRule: rule14
  }, {
    start: 6608,
    length: 10,
    convRule: rule8
  }, {
    start: 6618,
    length: 1,
    convRule: rule17
  }, {
    start: 6622,
    length: 34,
    convRule: rule13
  }, {
    start: 6656,
    length: 23,
    convRule: rule14
  }, {
    start: 6679,
    length: 2,
    convRule: rule92
  }, {
    start: 6681,
    length: 2,
    convRule: rule124
  }, {
    start: 6683,
    length: 1,
    convRule: rule92
  }, {
    start: 6686,
    length: 2,
    convRule: rule2
  }, {
    start: 6688,
    length: 53,
    convRule: rule14
  }, {
    start: 6741,
    length: 1,
    convRule: rule124
  }, {
    start: 6742,
    length: 1,
    convRule: rule92
  }, {
    start: 6743,
    length: 1,
    convRule: rule124
  }, {
    start: 6744,
    length: 7,
    convRule: rule92
  }, {
    start: 6752,
    length: 1,
    convRule: rule92
  }, {
    start: 6753,
    length: 1,
    convRule: rule124
  }, {
    start: 6754,
    length: 1,
    convRule: rule92
  }, {
    start: 6755,
    length: 2,
    convRule: rule124
  }, {
    start: 6757,
    length: 8,
    convRule: rule92
  }, {
    start: 6765,
    length: 6,
    convRule: rule124
  }, {
    start: 6771,
    length: 10,
    convRule: rule92
  }, {
    start: 6783,
    length: 1,
    convRule: rule92
  }, {
    start: 6784,
    length: 10,
    convRule: rule8
  }, {
    start: 6800,
    length: 10,
    convRule: rule8
  }, {
    start: 6816,
    length: 7,
    convRule: rule2
  }, {
    start: 6823,
    length: 1,
    convRule: rule91
  }, {
    start: 6824,
    length: 6,
    convRule: rule2
  }, {
    start: 6832,
    length: 14,
    convRule: rule92
  }, {
    start: 6846,
    length: 1,
    convRule: rule119
  }, {
    start: 6847,
    length: 2,
    convRule: rule92
  }, {
    start: 6912,
    length: 4,
    convRule: rule92
  }, {
    start: 6916,
    length: 1,
    convRule: rule124
  }, {
    start: 6917,
    length: 47,
    convRule: rule14
  }, {
    start: 6964,
    length: 1,
    convRule: rule92
  }, {
    start: 6965,
    length: 1,
    convRule: rule124
  }, {
    start: 6966,
    length: 5,
    convRule: rule92
  }, {
    start: 6971,
    length: 1,
    convRule: rule124
  }, {
    start: 6972,
    length: 1,
    convRule: rule92
  }, {
    start: 6973,
    length: 5,
    convRule: rule124
  }, {
    start: 6978,
    length: 1,
    convRule: rule92
  }, {
    start: 6979,
    length: 2,
    convRule: rule124
  }, {
    start: 6981,
    length: 7,
    convRule: rule14
  }, {
    start: 6992,
    length: 10,
    convRule: rule8
  }, {
    start: 7002,
    length: 7,
    convRule: rule2
  }, {
    start: 7009,
    length: 10,
    convRule: rule13
  }, {
    start: 7019,
    length: 9,
    convRule: rule92
  }, {
    start: 7028,
    length: 9,
    convRule: rule13
  }, {
    start: 7040,
    length: 2,
    convRule: rule92
  }, {
    start: 7042,
    length: 1,
    convRule: rule124
  }, {
    start: 7043,
    length: 30,
    convRule: rule14
  }, {
    start: 7073,
    length: 1,
    convRule: rule124
  }, {
    start: 7074,
    length: 4,
    convRule: rule92
  }, {
    start: 7078,
    length: 2,
    convRule: rule124
  }, {
    start: 7080,
    length: 2,
    convRule: rule92
  }, {
    start: 7082,
    length: 1,
    convRule: rule124
  }, {
    start: 7083,
    length: 3,
    convRule: rule92
  }, {
    start: 7086,
    length: 2,
    convRule: rule14
  }, {
    start: 7088,
    length: 10,
    convRule: rule8
  }, {
    start: 7098,
    length: 44,
    convRule: rule14
  }, {
    start: 7142,
    length: 1,
    convRule: rule92
  }, {
    start: 7143,
    length: 1,
    convRule: rule124
  }, {
    start: 7144,
    length: 2,
    convRule: rule92
  }, {
    start: 7146,
    length: 3,
    convRule: rule124
  }, {
    start: 7149,
    length: 1,
    convRule: rule92
  }, {
    start: 7150,
    length: 1,
    convRule: rule124
  }, {
    start: 7151,
    length: 3,
    convRule: rule92
  }, {
    start: 7154,
    length: 2,
    convRule: rule124
  }, {
    start: 7164,
    length: 4,
    convRule: rule2
  }, {
    start: 7168,
    length: 36,
    convRule: rule14
  }, {
    start: 7204,
    length: 8,
    convRule: rule124
  }, {
    start: 7212,
    length: 8,
    convRule: rule92
  }, {
    start: 7220,
    length: 2,
    convRule: rule124
  }, {
    start: 7222,
    length: 2,
    convRule: rule92
  }, {
    start: 7227,
    length: 5,
    convRule: rule2
  }, {
    start: 7232,
    length: 10,
    convRule: rule8
  }, {
    start: 7245,
    length: 3,
    convRule: rule14
  }, {
    start: 7248,
    length: 10,
    convRule: rule8
  }, {
    start: 7258,
    length: 30,
    convRule: rule14
  }, {
    start: 7288,
    length: 6,
    convRule: rule91
  }, {
    start: 7294,
    length: 2,
    convRule: rule2
  }, {
    start: 7296,
    length: 1,
    convRule: rule129
  }, {
    start: 7297,
    length: 1,
    convRule: rule130
  }, {
    start: 7298,
    length: 1,
    convRule: rule131
  }, {
    start: 7299,
    length: 2,
    convRule: rule132
  }, {
    start: 7301,
    length: 1,
    convRule: rule133
  }, {
    start: 7302,
    length: 1,
    convRule: rule134
  }, {
    start: 7303,
    length: 1,
    convRule: rule135
  }, {
    start: 7304,
    length: 1,
    convRule: rule136
  }, {
    start: 7312,
    length: 43,
    convRule: rule137
  }, {
    start: 7357,
    length: 3,
    convRule: rule137
  }, {
    start: 7360,
    length: 8,
    convRule: rule2
  }, {
    start: 7376,
    length: 3,
    convRule: rule92
  }, {
    start: 7379,
    length: 1,
    convRule: rule2
  }, {
    start: 7380,
    length: 13,
    convRule: rule92
  }, {
    start: 7393,
    length: 1,
    convRule: rule124
  }, {
    start: 7394,
    length: 7,
    convRule: rule92
  }, {
    start: 7401,
    length: 4,
    convRule: rule14
  }, {
    start: 7405,
    length: 1,
    convRule: rule92
  }, {
    start: 7406,
    length: 6,
    convRule: rule14
  }, {
    start: 7412,
    length: 1,
    convRule: rule92
  }, {
    start: 7413,
    length: 2,
    convRule: rule14
  }, {
    start: 7415,
    length: 1,
    convRule: rule124
  }, {
    start: 7416,
    length: 2,
    convRule: rule92
  }, {
    start: 7418,
    length: 1,
    convRule: rule14
  }, {
    start: 7424,
    length: 44,
    convRule: rule20
  }, {
    start: 7468,
    length: 63,
    convRule: rule91
  }, {
    start: 7531,
    length: 13,
    convRule: rule20
  }, {
    start: 7544,
    length: 1,
    convRule: rule91
  }, {
    start: 7545,
    length: 1,
    convRule: rule138
  }, {
    start: 7546,
    length: 3,
    convRule: rule20
  }, {
    start: 7549,
    length: 1,
    convRule: rule139
  }, {
    start: 7550,
    length: 16,
    convRule: rule20
  }, {
    start: 7566,
    length: 1,
    convRule: rule140
  }, {
    start: 7567,
    length: 12,
    convRule: rule20
  }, {
    start: 7579,
    length: 37,
    convRule: rule91
  }, {
    start: 7616,
    length: 58,
    convRule: rule92
  }, {
    start: 7675,
    length: 5,
    convRule: rule92
  }, {
    start: 7680,
    length: 1,
    convRule: rule22
  }, {
    start: 7681,
    length: 1,
    convRule: rule23
  }, {
    start: 7682,
    length: 1,
    convRule: rule22
  }, {
    start: 7683,
    length: 1,
    convRule: rule23
  }, {
    start: 7684,
    length: 1,
    convRule: rule22
  }, {
    start: 7685,
    length: 1,
    convRule: rule23
  }, {
    start: 7686,
    length: 1,
    convRule: rule22
  }, {
    start: 7687,
    length: 1,
    convRule: rule23
  }, {
    start: 7688,
    length: 1,
    convRule: rule22
  }, {
    start: 7689,
    length: 1,
    convRule: rule23
  }, {
    start: 7690,
    length: 1,
    convRule: rule22
  }, {
    start: 7691,
    length: 1,
    convRule: rule23
  }, {
    start: 7692,
    length: 1,
    convRule: rule22
  }, {
    start: 7693,
    length: 1,
    convRule: rule23
  }, {
    start: 7694,
    length: 1,
    convRule: rule22
  }, {
    start: 7695,
    length: 1,
    convRule: rule23
  }, {
    start: 7696,
    length: 1,
    convRule: rule22
  }, {
    start: 7697,
    length: 1,
    convRule: rule23
  }, {
    start: 7698,
    length: 1,
    convRule: rule22
  }, {
    start: 7699,
    length: 1,
    convRule: rule23
  }, {
    start: 7700,
    length: 1,
    convRule: rule22
  }, {
    start: 7701,
    length: 1,
    convRule: rule23
  }, {
    start: 7702,
    length: 1,
    convRule: rule22
  }, {
    start: 7703,
    length: 1,
    convRule: rule23
  }, {
    start: 7704,
    length: 1,
    convRule: rule22
  }, {
    start: 7705,
    length: 1,
    convRule: rule23
  }, {
    start: 7706,
    length: 1,
    convRule: rule22
  }, {
    start: 7707,
    length: 1,
    convRule: rule23
  }, {
    start: 7708,
    length: 1,
    convRule: rule22
  }, {
    start: 7709,
    length: 1,
    convRule: rule23
  }, {
    start: 7710,
    length: 1,
    convRule: rule22
  }, {
    start: 7711,
    length: 1,
    convRule: rule23
  }, {
    start: 7712,
    length: 1,
    convRule: rule22
  }, {
    start: 7713,
    length: 1,
    convRule: rule23
  }, {
    start: 7714,
    length: 1,
    convRule: rule22
  }, {
    start: 7715,
    length: 1,
    convRule: rule23
  }, {
    start: 7716,
    length: 1,
    convRule: rule22
  }, {
    start: 7717,
    length: 1,
    convRule: rule23
  }, {
    start: 7718,
    length: 1,
    convRule: rule22
  }, {
    start: 7719,
    length: 1,
    convRule: rule23
  }, {
    start: 7720,
    length: 1,
    convRule: rule22
  }, {
    start: 7721,
    length: 1,
    convRule: rule23
  }, {
    start: 7722,
    length: 1,
    convRule: rule22
  }, {
    start: 7723,
    length: 1,
    convRule: rule23
  }, {
    start: 7724,
    length: 1,
    convRule: rule22
  }, {
    start: 7725,
    length: 1,
    convRule: rule23
  }, {
    start: 7726,
    length: 1,
    convRule: rule22
  }, {
    start: 7727,
    length: 1,
    convRule: rule23
  }, {
    start: 7728,
    length: 1,
    convRule: rule22
  }, {
    start: 7729,
    length: 1,
    convRule: rule23
  }, {
    start: 7730,
    length: 1,
    convRule: rule22
  }, {
    start: 7731,
    length: 1,
    convRule: rule23
  }, {
    start: 7732,
    length: 1,
    convRule: rule22
  }, {
    start: 7733,
    length: 1,
    convRule: rule23
  }, {
    start: 7734,
    length: 1,
    convRule: rule22
  }, {
    start: 7735,
    length: 1,
    convRule: rule23
  }, {
    start: 7736,
    length: 1,
    convRule: rule22
  }, {
    start: 7737,
    length: 1,
    convRule: rule23
  }, {
    start: 7738,
    length: 1,
    convRule: rule22
  }, {
    start: 7739,
    length: 1,
    convRule: rule23
  }, {
    start: 7740,
    length: 1,
    convRule: rule22
  }, {
    start: 7741,
    length: 1,
    convRule: rule23
  }, {
    start: 7742,
    length: 1,
    convRule: rule22
  }, {
    start: 7743,
    length: 1,
    convRule: rule23
  }, {
    start: 7744,
    length: 1,
    convRule: rule22
  }, {
    start: 7745,
    length: 1,
    convRule: rule23
  }, {
    start: 7746,
    length: 1,
    convRule: rule22
  }, {
    start: 7747,
    length: 1,
    convRule: rule23
  }, {
    start: 7748,
    length: 1,
    convRule: rule22
  }, {
    start: 7749,
    length: 1,
    convRule: rule23
  }, {
    start: 7750,
    length: 1,
    convRule: rule22
  }, {
    start: 7751,
    length: 1,
    convRule: rule23
  }, {
    start: 7752,
    length: 1,
    convRule: rule22
  }, {
    start: 7753,
    length: 1,
    convRule: rule23
  }, {
    start: 7754,
    length: 1,
    convRule: rule22
  }, {
    start: 7755,
    length: 1,
    convRule: rule23
  }, {
    start: 7756,
    length: 1,
    convRule: rule22
  }, {
    start: 7757,
    length: 1,
    convRule: rule23
  }, {
    start: 7758,
    length: 1,
    convRule: rule22
  }, {
    start: 7759,
    length: 1,
    convRule: rule23
  }, {
    start: 7760,
    length: 1,
    convRule: rule22
  }, {
    start: 7761,
    length: 1,
    convRule: rule23
  }, {
    start: 7762,
    length: 1,
    convRule: rule22
  }, {
    start: 7763,
    length: 1,
    convRule: rule23
  }, {
    start: 7764,
    length: 1,
    convRule: rule22
  }, {
    start: 7765,
    length: 1,
    convRule: rule23
  }, {
    start: 7766,
    length: 1,
    convRule: rule22
  }, {
    start: 7767,
    length: 1,
    convRule: rule23
  }, {
    start: 7768,
    length: 1,
    convRule: rule22
  }, {
    start: 7769,
    length: 1,
    convRule: rule23
  }, {
    start: 7770,
    length: 1,
    convRule: rule22
  }, {
    start: 7771,
    length: 1,
    convRule: rule23
  }, {
    start: 7772,
    length: 1,
    convRule: rule22
  }, {
    start: 7773,
    length: 1,
    convRule: rule23
  }, {
    start: 7774,
    length: 1,
    convRule: rule22
  }, {
    start: 7775,
    length: 1,
    convRule: rule23
  }, {
    start: 7776,
    length: 1,
    convRule: rule22
  }, {
    start: 7777,
    length: 1,
    convRule: rule23
  }, {
    start: 7778,
    length: 1,
    convRule: rule22
  }, {
    start: 7779,
    length: 1,
    convRule: rule23
  }, {
    start: 7780,
    length: 1,
    convRule: rule22
  }, {
    start: 7781,
    length: 1,
    convRule: rule23
  }, {
    start: 7782,
    length: 1,
    convRule: rule22
  }, {
    start: 7783,
    length: 1,
    convRule: rule23
  }, {
    start: 7784,
    length: 1,
    convRule: rule22
  }, {
    start: 7785,
    length: 1,
    convRule: rule23
  }, {
    start: 7786,
    length: 1,
    convRule: rule22
  }, {
    start: 7787,
    length: 1,
    convRule: rule23
  }, {
    start: 7788,
    length: 1,
    convRule: rule22
  }, {
    start: 7789,
    length: 1,
    convRule: rule23
  }, {
    start: 7790,
    length: 1,
    convRule: rule22
  }, {
    start: 7791,
    length: 1,
    convRule: rule23
  }, {
    start: 7792,
    length: 1,
    convRule: rule22
  }, {
    start: 7793,
    length: 1,
    convRule: rule23
  }, {
    start: 7794,
    length: 1,
    convRule: rule22
  }, {
    start: 7795,
    length: 1,
    convRule: rule23
  }, {
    start: 7796,
    length: 1,
    convRule: rule22
  }, {
    start: 7797,
    length: 1,
    convRule: rule23
  }, {
    start: 7798,
    length: 1,
    convRule: rule22
  }, {
    start: 7799,
    length: 1,
    convRule: rule23
  }, {
    start: 7800,
    length: 1,
    convRule: rule22
  }, {
    start: 7801,
    length: 1,
    convRule: rule23
  }, {
    start: 7802,
    length: 1,
    convRule: rule22
  }, {
    start: 7803,
    length: 1,
    convRule: rule23
  }, {
    start: 7804,
    length: 1,
    convRule: rule22
  }, {
    start: 7805,
    length: 1,
    convRule: rule23
  }, {
    start: 7806,
    length: 1,
    convRule: rule22
  }, {
    start: 7807,
    length: 1,
    convRule: rule23
  }, {
    start: 7808,
    length: 1,
    convRule: rule22
  }, {
    start: 7809,
    length: 1,
    convRule: rule23
  }, {
    start: 7810,
    length: 1,
    convRule: rule22
  }, {
    start: 7811,
    length: 1,
    convRule: rule23
  }, {
    start: 7812,
    length: 1,
    convRule: rule22
  }, {
    start: 7813,
    length: 1,
    convRule: rule23
  }, {
    start: 7814,
    length: 1,
    convRule: rule22
  }, {
    start: 7815,
    length: 1,
    convRule: rule23
  }, {
    start: 7816,
    length: 1,
    convRule: rule22
  }, {
    start: 7817,
    length: 1,
    convRule: rule23
  }, {
    start: 7818,
    length: 1,
    convRule: rule22
  }, {
    start: 7819,
    length: 1,
    convRule: rule23
  }, {
    start: 7820,
    length: 1,
    convRule: rule22
  }, {
    start: 7821,
    length: 1,
    convRule: rule23
  }, {
    start: 7822,
    length: 1,
    convRule: rule22
  }, {
    start: 7823,
    length: 1,
    convRule: rule23
  }, {
    start: 7824,
    length: 1,
    convRule: rule22
  }, {
    start: 7825,
    length: 1,
    convRule: rule23
  }, {
    start: 7826,
    length: 1,
    convRule: rule22
  }, {
    start: 7827,
    length: 1,
    convRule: rule23
  }, {
    start: 7828,
    length: 1,
    convRule: rule22
  }, {
    start: 7829,
    length: 1,
    convRule: rule23
  }, {
    start: 7830,
    length: 5,
    convRule: rule20
  }, {
    start: 7835,
    length: 1,
    convRule: rule141
  }, {
    start: 7836,
    length: 2,
    convRule: rule20
  }, {
    start: 7838,
    length: 1,
    convRule: rule142
  }, {
    start: 7839,
    length: 1,
    convRule: rule20
  }, {
    start: 7840,
    length: 1,
    convRule: rule22
  }, {
    start: 7841,
    length: 1,
    convRule: rule23
  }, {
    start: 7842,
    length: 1,
    convRule: rule22
  }, {
    start: 7843,
    length: 1,
    convRule: rule23
  }, {
    start: 7844,
    length: 1,
    convRule: rule22
  }, {
    start: 7845,
    length: 1,
    convRule: rule23
  }, {
    start: 7846,
    length: 1,
    convRule: rule22
  }, {
    start: 7847,
    length: 1,
    convRule: rule23
  }, {
    start: 7848,
    length: 1,
    convRule: rule22
  }, {
    start: 7849,
    length: 1,
    convRule: rule23
  }, {
    start: 7850,
    length: 1,
    convRule: rule22
  }, {
    start: 7851,
    length: 1,
    convRule: rule23
  }, {
    start: 7852,
    length: 1,
    convRule: rule22
  }, {
    start: 7853,
    length: 1,
    convRule: rule23
  }, {
    start: 7854,
    length: 1,
    convRule: rule22
  }, {
    start: 7855,
    length: 1,
    convRule: rule23
  }, {
    start: 7856,
    length: 1,
    convRule: rule22
  }, {
    start: 7857,
    length: 1,
    convRule: rule23
  }, {
    start: 7858,
    length: 1,
    convRule: rule22
  }, {
    start: 7859,
    length: 1,
    convRule: rule23
  }, {
    start: 7860,
    length: 1,
    convRule: rule22
  }, {
    start: 7861,
    length: 1,
    convRule: rule23
  }, {
    start: 7862,
    length: 1,
    convRule: rule22
  }, {
    start: 7863,
    length: 1,
    convRule: rule23
  }, {
    start: 7864,
    length: 1,
    convRule: rule22
  }, {
    start: 7865,
    length: 1,
    convRule: rule23
  }, {
    start: 7866,
    length: 1,
    convRule: rule22
  }, {
    start: 7867,
    length: 1,
    convRule: rule23
  }, {
    start: 7868,
    length: 1,
    convRule: rule22
  }, {
    start: 7869,
    length: 1,
    convRule: rule23
  }, {
    start: 7870,
    length: 1,
    convRule: rule22
  }, {
    start: 7871,
    length: 1,
    convRule: rule23
  }, {
    start: 7872,
    length: 1,
    convRule: rule22
  }, {
    start: 7873,
    length: 1,
    convRule: rule23
  }, {
    start: 7874,
    length: 1,
    convRule: rule22
  }, {
    start: 7875,
    length: 1,
    convRule: rule23
  }, {
    start: 7876,
    length: 1,
    convRule: rule22
  }, {
    start: 7877,
    length: 1,
    convRule: rule23
  }, {
    start: 7878,
    length: 1,
    convRule: rule22
  }, {
    start: 7879,
    length: 1,
    convRule: rule23
  }, {
    start: 7880,
    length: 1,
    convRule: rule22
  }, {
    start: 7881,
    length: 1,
    convRule: rule23
  }, {
    start: 7882,
    length: 1,
    convRule: rule22
  }, {
    start: 7883,
    length: 1,
    convRule: rule23
  }, {
    start: 7884,
    length: 1,
    convRule: rule22
  }, {
    start: 7885,
    length: 1,
    convRule: rule23
  }, {
    start: 7886,
    length: 1,
    convRule: rule22
  }, {
    start: 7887,
    length: 1,
    convRule: rule23
  }, {
    start: 7888,
    length: 1,
    convRule: rule22
  }, {
    start: 7889,
    length: 1,
    convRule: rule23
  }, {
    start: 7890,
    length: 1,
    convRule: rule22
  }, {
    start: 7891,
    length: 1,
    convRule: rule23
  }, {
    start: 7892,
    length: 1,
    convRule: rule22
  }, {
    start: 7893,
    length: 1,
    convRule: rule23
  }, {
    start: 7894,
    length: 1,
    convRule: rule22
  }, {
    start: 7895,
    length: 1,
    convRule: rule23
  }, {
    start: 7896,
    length: 1,
    convRule: rule22
  }, {
    start: 7897,
    length: 1,
    convRule: rule23
  }, {
    start: 7898,
    length: 1,
    convRule: rule22
  }, {
    start: 7899,
    length: 1,
    convRule: rule23
  }, {
    start: 7900,
    length: 1,
    convRule: rule22
  }, {
    start: 7901,
    length: 1,
    convRule: rule23
  }, {
    start: 7902,
    length: 1,
    convRule: rule22
  }, {
    start: 7903,
    length: 1,
    convRule: rule23
  }, {
    start: 7904,
    length: 1,
    convRule: rule22
  }, {
    start: 7905,
    length: 1,
    convRule: rule23
  }, {
    start: 7906,
    length: 1,
    convRule: rule22
  }, {
    start: 7907,
    length: 1,
    convRule: rule23
  }, {
    start: 7908,
    length: 1,
    convRule: rule22
  }, {
    start: 7909,
    length: 1,
    convRule: rule23
  }, {
    start: 7910,
    length: 1,
    convRule: rule22
  }, {
    start: 7911,
    length: 1,
    convRule: rule23
  }, {
    start: 7912,
    length: 1,
    convRule: rule22
  }, {
    start: 7913,
    length: 1,
    convRule: rule23
  }, {
    start: 7914,
    length: 1,
    convRule: rule22
  }, {
    start: 7915,
    length: 1,
    convRule: rule23
  }, {
    start: 7916,
    length: 1,
    convRule: rule22
  }, {
    start: 7917,
    length: 1,
    convRule: rule23
  }, {
    start: 7918,
    length: 1,
    convRule: rule22
  }, {
    start: 7919,
    length: 1,
    convRule: rule23
  }, {
    start: 7920,
    length: 1,
    convRule: rule22
  }, {
    start: 7921,
    length: 1,
    convRule: rule23
  }, {
    start: 7922,
    length: 1,
    convRule: rule22
  }, {
    start: 7923,
    length: 1,
    convRule: rule23
  }, {
    start: 7924,
    length: 1,
    convRule: rule22
  }, {
    start: 7925,
    length: 1,
    convRule: rule23
  }, {
    start: 7926,
    length: 1,
    convRule: rule22
  }, {
    start: 7927,
    length: 1,
    convRule: rule23
  }, {
    start: 7928,
    length: 1,
    convRule: rule22
  }, {
    start: 7929,
    length: 1,
    convRule: rule23
  }, {
    start: 7930,
    length: 1,
    convRule: rule22
  }, {
    start: 7931,
    length: 1,
    convRule: rule23
  }, {
    start: 7932,
    length: 1,
    convRule: rule22
  }, {
    start: 7933,
    length: 1,
    convRule: rule23
  }, {
    start: 7934,
    length: 1,
    convRule: rule22
  }, {
    start: 7935,
    length: 1,
    convRule: rule23
  }, {
    start: 7936,
    length: 8,
    convRule: rule143
  }, {
    start: 7944,
    length: 8,
    convRule: rule144
  }, {
    start: 7952,
    length: 6,
    convRule: rule143
  }, {
    start: 7960,
    length: 6,
    convRule: rule144
  }, {
    start: 7968,
    length: 8,
    convRule: rule143
  }, {
    start: 7976,
    length: 8,
    convRule: rule144
  }, {
    start: 7984,
    length: 8,
    convRule: rule143
  }, {
    start: 7992,
    length: 8,
    convRule: rule144
  }, {
    start: 8e3,
    length: 6,
    convRule: rule143
  }, {
    start: 8008,
    length: 6,
    convRule: rule144
  }, {
    start: 8016,
    length: 1,
    convRule: rule20
  }, {
    start: 8017,
    length: 1,
    convRule: rule143
  }, {
    start: 8018,
    length: 1,
    convRule: rule20
  }, {
    start: 8019,
    length: 1,
    convRule: rule143
  }, {
    start: 8020,
    length: 1,
    convRule: rule20
  }, {
    start: 8021,
    length: 1,
    convRule: rule143
  }, {
    start: 8022,
    length: 1,
    convRule: rule20
  }, {
    start: 8023,
    length: 1,
    convRule: rule143
  }, {
    start: 8025,
    length: 1,
    convRule: rule144
  }, {
    start: 8027,
    length: 1,
    convRule: rule144
  }, {
    start: 8029,
    length: 1,
    convRule: rule144
  }, {
    start: 8031,
    length: 1,
    convRule: rule144
  }, {
    start: 8032,
    length: 8,
    convRule: rule143
  }, {
    start: 8040,
    length: 8,
    convRule: rule144
  }, {
    start: 8048,
    length: 2,
    convRule: rule145
  }, {
    start: 8050,
    length: 4,
    convRule: rule146
  }, {
    start: 8054,
    length: 2,
    convRule: rule147
  }, {
    start: 8056,
    length: 2,
    convRule: rule148
  }, {
    start: 8058,
    length: 2,
    convRule: rule149
  }, {
    start: 8060,
    length: 2,
    convRule: rule150
  }, {
    start: 8064,
    length: 8,
    convRule: rule143
  }, {
    start: 8072,
    length: 8,
    convRule: rule151
  }, {
    start: 8080,
    length: 8,
    convRule: rule143
  }, {
    start: 8088,
    length: 8,
    convRule: rule151
  }, {
    start: 8096,
    length: 8,
    convRule: rule143
  }, {
    start: 8104,
    length: 8,
    convRule: rule151
  }, {
    start: 8112,
    length: 2,
    convRule: rule143
  }, {
    start: 8114,
    length: 1,
    convRule: rule20
  }, {
    start: 8115,
    length: 1,
    convRule: rule152
  }, {
    start: 8116,
    length: 1,
    convRule: rule20
  }, {
    start: 8118,
    length: 2,
    convRule: rule20
  }, {
    start: 8120,
    length: 2,
    convRule: rule144
  }, {
    start: 8122,
    length: 2,
    convRule: rule153
  }, {
    start: 8124,
    length: 1,
    convRule: rule154
  }, {
    start: 8125,
    length: 1,
    convRule: rule10
  }, {
    start: 8126,
    length: 1,
    convRule: rule155
  }, {
    start: 8127,
    length: 3,
    convRule: rule10
  }, {
    start: 8130,
    length: 1,
    convRule: rule20
  }, {
    start: 8131,
    length: 1,
    convRule: rule152
  }, {
    start: 8132,
    length: 1,
    convRule: rule20
  }, {
    start: 8134,
    length: 2,
    convRule: rule20
  }, {
    start: 8136,
    length: 4,
    convRule: rule156
  }, {
    start: 8140,
    length: 1,
    convRule: rule154
  }, {
    start: 8141,
    length: 3,
    convRule: rule10
  }, {
    start: 8144,
    length: 2,
    convRule: rule143
  }, {
    start: 8146,
    length: 2,
    convRule: rule20
  }, {
    start: 8150,
    length: 2,
    convRule: rule20
  }, {
    start: 8152,
    length: 2,
    convRule: rule144
  }, {
    start: 8154,
    length: 2,
    convRule: rule157
  }, {
    start: 8157,
    length: 3,
    convRule: rule10
  }, {
    start: 8160,
    length: 2,
    convRule: rule143
  }, {
    start: 8162,
    length: 3,
    convRule: rule20
  }, {
    start: 8165,
    length: 1,
    convRule: rule113
  }, {
    start: 8166,
    length: 2,
    convRule: rule20
  }, {
    start: 8168,
    length: 2,
    convRule: rule144
  }, {
    start: 8170,
    length: 2,
    convRule: rule158
  }, {
    start: 8172,
    length: 1,
    convRule: rule117
  }, {
    start: 8173,
    length: 3,
    convRule: rule10
  }, {
    start: 8178,
    length: 1,
    convRule: rule20
  }, {
    start: 8179,
    length: 1,
    convRule: rule152
  }, {
    start: 8180,
    length: 1,
    convRule: rule20
  }, {
    start: 8182,
    length: 2,
    convRule: rule20
  }, {
    start: 8184,
    length: 2,
    convRule: rule159
  }, {
    start: 8186,
    length: 2,
    convRule: rule160
  }, {
    start: 8188,
    length: 1,
    convRule: rule154
  }, {
    start: 8189,
    length: 2,
    convRule: rule10
  }, {
    start: 8192,
    length: 11,
    convRule: rule1
  }, {
    start: 8203,
    length: 5,
    convRule: rule16
  }, {
    start: 8208,
    length: 6,
    convRule: rule7
  }, {
    start: 8214,
    length: 2,
    convRule: rule2
  }, {
    start: 8216,
    length: 1,
    convRule: rule15
  }, {
    start: 8217,
    length: 1,
    convRule: rule19
  }, {
    start: 8218,
    length: 1,
    convRule: rule4
  }, {
    start: 8219,
    length: 2,
    convRule: rule15
  }, {
    start: 8221,
    length: 1,
    convRule: rule19
  }, {
    start: 8222,
    length: 1,
    convRule: rule4
  }, {
    start: 8223,
    length: 1,
    convRule: rule15
  }, {
    start: 8224,
    length: 8,
    convRule: rule2
  }, {
    start: 8232,
    length: 1,
    convRule: rule161
  }, {
    start: 8233,
    length: 1,
    convRule: rule162
  }, {
    start: 8234,
    length: 5,
    convRule: rule16
  }, {
    start: 8239,
    length: 1,
    convRule: rule1
  }, {
    start: 8240,
    length: 9,
    convRule: rule2
  }, {
    start: 8249,
    length: 1,
    convRule: rule15
  }, {
    start: 8250,
    length: 1,
    convRule: rule19
  }, {
    start: 8251,
    length: 4,
    convRule: rule2
  }, {
    start: 8255,
    length: 2,
    convRule: rule11
  }, {
    start: 8257,
    length: 3,
    convRule: rule2
  }, {
    start: 8260,
    length: 1,
    convRule: rule6
  }, {
    start: 8261,
    length: 1,
    convRule: rule4
  }, {
    start: 8262,
    length: 1,
    convRule: rule5
  }, {
    start: 8263,
    length: 11,
    convRule: rule2
  }, {
    start: 8274,
    length: 1,
    convRule: rule6
  }, {
    start: 8275,
    length: 1,
    convRule: rule2
  }, {
    start: 8276,
    length: 1,
    convRule: rule11
  }, {
    start: 8277,
    length: 10,
    convRule: rule2
  }, {
    start: 8287,
    length: 1,
    convRule: rule1
  }, {
    start: 8288,
    length: 5,
    convRule: rule16
  }, {
    start: 8294,
    length: 10,
    convRule: rule16
  }, {
    start: 8304,
    length: 1,
    convRule: rule17
  }, {
    start: 8305,
    length: 1,
    convRule: rule91
  }, {
    start: 8308,
    length: 6,
    convRule: rule17
  }, {
    start: 8314,
    length: 3,
    convRule: rule6
  }, {
    start: 8317,
    length: 1,
    convRule: rule4
  }, {
    start: 8318,
    length: 1,
    convRule: rule5
  }, {
    start: 8319,
    length: 1,
    convRule: rule91
  }, {
    start: 8320,
    length: 10,
    convRule: rule17
  }, {
    start: 8330,
    length: 3,
    convRule: rule6
  }, {
    start: 8333,
    length: 1,
    convRule: rule4
  }, {
    start: 8334,
    length: 1,
    convRule: rule5
  }, {
    start: 8336,
    length: 13,
    convRule: rule91
  }, {
    start: 8352,
    length: 32,
    convRule: rule3
  }, {
    start: 8400,
    length: 13,
    convRule: rule92
  }, {
    start: 8413,
    length: 4,
    convRule: rule119
  }, {
    start: 8417,
    length: 1,
    convRule: rule92
  }, {
    start: 8418,
    length: 3,
    convRule: rule119
  }, {
    start: 8421,
    length: 12,
    convRule: rule92
  }, {
    start: 8448,
    length: 2,
    convRule: rule13
  }, {
    start: 8450,
    length: 1,
    convRule: rule107
  }, {
    start: 8451,
    length: 4,
    convRule: rule13
  }, {
    start: 8455,
    length: 1,
    convRule: rule107
  }, {
    start: 8456,
    length: 2,
    convRule: rule13
  }, {
    start: 8458,
    length: 1,
    convRule: rule20
  }, {
    start: 8459,
    length: 3,
    convRule: rule107
  }, {
    start: 8462,
    length: 2,
    convRule: rule20
  }, {
    start: 8464,
    length: 3,
    convRule: rule107
  }, {
    start: 8467,
    length: 1,
    convRule: rule20
  }, {
    start: 8468,
    length: 1,
    convRule: rule13
  }, {
    start: 8469,
    length: 1,
    convRule: rule107
  }, {
    start: 8470,
    length: 2,
    convRule: rule13
  }, {
    start: 8472,
    length: 1,
    convRule: rule6
  }, {
    start: 8473,
    length: 5,
    convRule: rule107
  }, {
    start: 8478,
    length: 6,
    convRule: rule13
  }, {
    start: 8484,
    length: 1,
    convRule: rule107
  }, {
    start: 8485,
    length: 1,
    convRule: rule13
  }, {
    start: 8486,
    length: 1,
    convRule: rule163
  }, {
    start: 8487,
    length: 1,
    convRule: rule13
  }, {
    start: 8488,
    length: 1,
    convRule: rule107
  }, {
    start: 8489,
    length: 1,
    convRule: rule13
  }, {
    start: 8490,
    length: 1,
    convRule: rule164
  }, {
    start: 8491,
    length: 1,
    convRule: rule165
  }, {
    start: 8492,
    length: 2,
    convRule: rule107
  }, {
    start: 8494,
    length: 1,
    convRule: rule13
  }, {
    start: 8495,
    length: 1,
    convRule: rule20
  }, {
    start: 8496,
    length: 2,
    convRule: rule107
  }, {
    start: 8498,
    length: 1,
    convRule: rule166
  }, {
    start: 8499,
    length: 1,
    convRule: rule107
  }, {
    start: 8500,
    length: 1,
    convRule: rule20
  }, {
    start: 8501,
    length: 4,
    convRule: rule14
  }, {
    start: 8505,
    length: 1,
    convRule: rule20
  }, {
    start: 8506,
    length: 2,
    convRule: rule13
  }, {
    start: 8508,
    length: 2,
    convRule: rule20
  }, {
    start: 8510,
    length: 2,
    convRule: rule107
  }, {
    start: 8512,
    length: 5,
    convRule: rule6
  }, {
    start: 8517,
    length: 1,
    convRule: rule107
  }, {
    start: 8518,
    length: 4,
    convRule: rule20
  }, {
    start: 8522,
    length: 1,
    convRule: rule13
  }, {
    start: 8523,
    length: 1,
    convRule: rule6
  }, {
    start: 8524,
    length: 2,
    convRule: rule13
  }, {
    start: 8526,
    length: 1,
    convRule: rule167
  }, {
    start: 8527,
    length: 1,
    convRule: rule13
  }, {
    start: 8528,
    length: 16,
    convRule: rule17
  }, {
    start: 8544,
    length: 16,
    convRule: rule168
  }, {
    start: 8560,
    length: 16,
    convRule: rule169
  }, {
    start: 8576,
    length: 3,
    convRule: rule128
  }, {
    start: 8579,
    length: 1,
    convRule: rule22
  }, {
    start: 8580,
    length: 1,
    convRule: rule23
  }, {
    start: 8581,
    length: 4,
    convRule: rule128
  }, {
    start: 8585,
    length: 1,
    convRule: rule17
  }, {
    start: 8586,
    length: 2,
    convRule: rule13
  }, {
    start: 8592,
    length: 5,
    convRule: rule6
  }, {
    start: 8597,
    length: 5,
    convRule: rule13
  }, {
    start: 8602,
    length: 2,
    convRule: rule6
  }, {
    start: 8604,
    length: 4,
    convRule: rule13
  }, {
    start: 8608,
    length: 1,
    convRule: rule6
  }, {
    start: 8609,
    length: 2,
    convRule: rule13
  }, {
    start: 8611,
    length: 1,
    convRule: rule6
  }, {
    start: 8612,
    length: 2,
    convRule: rule13
  }, {
    start: 8614,
    length: 1,
    convRule: rule6
  }, {
    start: 8615,
    length: 7,
    convRule: rule13
  }, {
    start: 8622,
    length: 1,
    convRule: rule6
  }, {
    start: 8623,
    length: 31,
    convRule: rule13
  }, {
    start: 8654,
    length: 2,
    convRule: rule6
  }, {
    start: 8656,
    length: 2,
    convRule: rule13
  }, {
    start: 8658,
    length: 1,
    convRule: rule6
  }, {
    start: 8659,
    length: 1,
    convRule: rule13
  }, {
    start: 8660,
    length: 1,
    convRule: rule6
  }, {
    start: 8661,
    length: 31,
    convRule: rule13
  }, {
    start: 8692,
    length: 268,
    convRule: rule6
  }, {
    start: 8960,
    length: 8,
    convRule: rule13
  }, {
    start: 8968,
    length: 1,
    convRule: rule4
  }, {
    start: 8969,
    length: 1,
    convRule: rule5
  }, {
    start: 8970,
    length: 1,
    convRule: rule4
  }, {
    start: 8971,
    length: 1,
    convRule: rule5
  }, {
    start: 8972,
    length: 20,
    convRule: rule13
  }, {
    start: 8992,
    length: 2,
    convRule: rule6
  }, {
    start: 8994,
    length: 7,
    convRule: rule13
  }, {
    start: 9001,
    length: 1,
    convRule: rule4
  }, {
    start: 9002,
    length: 1,
    convRule: rule5
  }, {
    start: 9003,
    length: 81,
    convRule: rule13
  }, {
    start: 9084,
    length: 1,
    convRule: rule6
  }, {
    start: 9085,
    length: 30,
    convRule: rule13
  }, {
    start: 9115,
    length: 25,
    convRule: rule6
  }, {
    start: 9140,
    length: 40,
    convRule: rule13
  }, {
    start: 9180,
    length: 6,
    convRule: rule6
  }, {
    start: 9186,
    length: 69,
    convRule: rule13
  }, {
    start: 9280,
    length: 11,
    convRule: rule13
  }, {
    start: 9312,
    length: 60,
    convRule: rule17
  }, {
    start: 9372,
    length: 26,
    convRule: rule13
  }, {
    start: 9398,
    length: 26,
    convRule: rule170
  }, {
    start: 9424,
    length: 26,
    convRule: rule171
  }, {
    start: 9450,
    length: 22,
    convRule: rule17
  }, {
    start: 9472,
    length: 183,
    convRule: rule13
  }, {
    start: 9655,
    length: 1,
    convRule: rule6
  }, {
    start: 9656,
    length: 9,
    convRule: rule13
  }, {
    start: 9665,
    length: 1,
    convRule: rule6
  }, {
    start: 9666,
    length: 54,
    convRule: rule13
  }, {
    start: 9720,
    length: 8,
    convRule: rule6
  }, {
    start: 9728,
    length: 111,
    convRule: rule13
  }, {
    start: 9839,
    length: 1,
    convRule: rule6
  }, {
    start: 9840,
    length: 248,
    convRule: rule13
  }, {
    start: 10088,
    length: 1,
    convRule: rule4
  }, {
    start: 10089,
    length: 1,
    convRule: rule5
  }, {
    start: 10090,
    length: 1,
    convRule: rule4
  }, {
    start: 10091,
    length: 1,
    convRule: rule5
  }, {
    start: 10092,
    length: 1,
    convRule: rule4
  }, {
    start: 10093,
    length: 1,
    convRule: rule5
  }, {
    start: 10094,
    length: 1,
    convRule: rule4
  }, {
    start: 10095,
    length: 1,
    convRule: rule5
  }, {
    start: 10096,
    length: 1,
    convRule: rule4
  }, {
    start: 10097,
    length: 1,
    convRule: rule5
  }, {
    start: 10098,
    length: 1,
    convRule: rule4
  }, {
    start: 10099,
    length: 1,
    convRule: rule5
  }, {
    start: 10100,
    length: 1,
    convRule: rule4
  }, {
    start: 10101,
    length: 1,
    convRule: rule5
  }, {
    start: 10102,
    length: 30,
    convRule: rule17
  }, {
    start: 10132,
    length: 44,
    convRule: rule13
  }, {
    start: 10176,
    length: 5,
    convRule: rule6
  }, {
    start: 10181,
    length: 1,
    convRule: rule4
  }, {
    start: 10182,
    length: 1,
    convRule: rule5
  }, {
    start: 10183,
    length: 31,
    convRule: rule6
  }, {
    start: 10214,
    length: 1,
    convRule: rule4
  }, {
    start: 10215,
    length: 1,
    convRule: rule5
  }, {
    start: 10216,
    length: 1,
    convRule: rule4
  }, {
    start: 10217,
    length: 1,
    convRule: rule5
  }, {
    start: 10218,
    length: 1,
    convRule: rule4
  }, {
    start: 10219,
    length: 1,
    convRule: rule5
  }, {
    start: 10220,
    length: 1,
    convRule: rule4
  }, {
    start: 10221,
    length: 1,
    convRule: rule5
  }, {
    start: 10222,
    length: 1,
    convRule: rule4
  }, {
    start: 10223,
    length: 1,
    convRule: rule5
  }, {
    start: 10224,
    length: 16,
    convRule: rule6
  }, {
    start: 10240,
    length: 256,
    convRule: rule13
  }, {
    start: 10496,
    length: 131,
    convRule: rule6
  }, {
    start: 10627,
    length: 1,
    convRule: rule4
  }, {
    start: 10628,
    length: 1,
    convRule: rule5
  }, {
    start: 10629,
    length: 1,
    convRule: rule4
  }, {
    start: 10630,
    length: 1,
    convRule: rule5
  }, {
    start: 10631,
    length: 1,
    convRule: rule4
  }, {
    start: 10632,
    length: 1,
    convRule: rule5
  }, {
    start: 10633,
    length: 1,
    convRule: rule4
  }, {
    start: 10634,
    length: 1,
    convRule: rule5
  }, {
    start: 10635,
    length: 1,
    convRule: rule4
  }, {
    start: 10636,
    length: 1,
    convRule: rule5
  }, {
    start: 10637,
    length: 1,
    convRule: rule4
  }, {
    start: 10638,
    length: 1,
    convRule: rule5
  }, {
    start: 10639,
    length: 1,
    convRule: rule4
  }, {
    start: 10640,
    length: 1,
    convRule: rule5
  }, {
    start: 10641,
    length: 1,
    convRule: rule4
  }, {
    start: 10642,
    length: 1,
    convRule: rule5
  }, {
    start: 10643,
    length: 1,
    convRule: rule4
  }, {
    start: 10644,
    length: 1,
    convRule: rule5
  }, {
    start: 10645,
    length: 1,
    convRule: rule4
  }, {
    start: 10646,
    length: 1,
    convRule: rule5
  }, {
    start: 10647,
    length: 1,
    convRule: rule4
  }, {
    start: 10648,
    length: 1,
    convRule: rule5
  }, {
    start: 10649,
    length: 63,
    convRule: rule6
  }, {
    start: 10712,
    length: 1,
    convRule: rule4
  }, {
    start: 10713,
    length: 1,
    convRule: rule5
  }, {
    start: 10714,
    length: 1,
    convRule: rule4
  }, {
    start: 10715,
    length: 1,
    convRule: rule5
  }, {
    start: 10716,
    length: 32,
    convRule: rule6
  }, {
    start: 10748,
    length: 1,
    convRule: rule4
  }, {
    start: 10749,
    length: 1,
    convRule: rule5
  }, {
    start: 10750,
    length: 258,
    convRule: rule6
  }, {
    start: 11008,
    length: 48,
    convRule: rule13
  }, {
    start: 11056,
    length: 21,
    convRule: rule6
  }, {
    start: 11077,
    length: 2,
    convRule: rule13
  }, {
    start: 11079,
    length: 6,
    convRule: rule6
  }, {
    start: 11085,
    length: 39,
    convRule: rule13
  }, {
    start: 11126,
    length: 32,
    convRule: rule13
  }, {
    start: 11159,
    length: 105,
    convRule: rule13
  }, {
    start: 11264,
    length: 47,
    convRule: rule122
  }, {
    start: 11312,
    length: 47,
    convRule: rule123
  }, {
    start: 11360,
    length: 1,
    convRule: rule22
  }, {
    start: 11361,
    length: 1,
    convRule: rule23
  }, {
    start: 11362,
    length: 1,
    convRule: rule172
  }, {
    start: 11363,
    length: 1,
    convRule: rule173
  }, {
    start: 11364,
    length: 1,
    convRule: rule174
  }, {
    start: 11365,
    length: 1,
    convRule: rule175
  }, {
    start: 11366,
    length: 1,
    convRule: rule176
  }, {
    start: 11367,
    length: 1,
    convRule: rule22
  }, {
    start: 11368,
    length: 1,
    convRule: rule23
  }, {
    start: 11369,
    length: 1,
    convRule: rule22
  }, {
    start: 11370,
    length: 1,
    convRule: rule23
  }, {
    start: 11371,
    length: 1,
    convRule: rule22
  }, {
    start: 11372,
    length: 1,
    convRule: rule23
  }, {
    start: 11373,
    length: 1,
    convRule: rule177
  }, {
    start: 11374,
    length: 1,
    convRule: rule178
  }, {
    start: 11375,
    length: 1,
    convRule: rule179
  }, {
    start: 11376,
    length: 1,
    convRule: rule180
  }, {
    start: 11377,
    length: 1,
    convRule: rule20
  }, {
    start: 11378,
    length: 1,
    convRule: rule22
  }, {
    start: 11379,
    length: 1,
    convRule: rule23
  }, {
    start: 11380,
    length: 1,
    convRule: rule20
  }, {
    start: 11381,
    length: 1,
    convRule: rule22
  }, {
    start: 11382,
    length: 1,
    convRule: rule23
  }, {
    start: 11383,
    length: 5,
    convRule: rule20
  }, {
    start: 11388,
    length: 2,
    convRule: rule91
  }, {
    start: 11390,
    length: 2,
    convRule: rule181
  }, {
    start: 11392,
    length: 1,
    convRule: rule22
  }, {
    start: 11393,
    length: 1,
    convRule: rule23
  }, {
    start: 11394,
    length: 1,
    convRule: rule22
  }, {
    start: 11395,
    length: 1,
    convRule: rule23
  }, {
    start: 11396,
    length: 1,
    convRule: rule22
  }, {
    start: 11397,
    length: 1,
    convRule: rule23
  }, {
    start: 11398,
    length: 1,
    convRule: rule22
  }, {
    start: 11399,
    length: 1,
    convRule: rule23
  }, {
    start: 11400,
    length: 1,
    convRule: rule22
  }, {
    start: 11401,
    length: 1,
    convRule: rule23
  }, {
    start: 11402,
    length: 1,
    convRule: rule22
  }, {
    start: 11403,
    length: 1,
    convRule: rule23
  }, {
    start: 11404,
    length: 1,
    convRule: rule22
  }, {
    start: 11405,
    length: 1,
    convRule: rule23
  }, {
    start: 11406,
    length: 1,
    convRule: rule22
  }, {
    start: 11407,
    length: 1,
    convRule: rule23
  }, {
    start: 11408,
    length: 1,
    convRule: rule22
  }, {
    start: 11409,
    length: 1,
    convRule: rule23
  }, {
    start: 11410,
    length: 1,
    convRule: rule22
  }, {
    start: 11411,
    length: 1,
    convRule: rule23
  }, {
    start: 11412,
    length: 1,
    convRule: rule22
  }, {
    start: 11413,
    length: 1,
    convRule: rule23
  }, {
    start: 11414,
    length: 1,
    convRule: rule22
  }, {
    start: 11415,
    length: 1,
    convRule: rule23
  }, {
    start: 11416,
    length: 1,
    convRule: rule22
  }, {
    start: 11417,
    length: 1,
    convRule: rule23
  }, {
    start: 11418,
    length: 1,
    convRule: rule22
  }, {
    start: 11419,
    length: 1,
    convRule: rule23
  }, {
    start: 11420,
    length: 1,
    convRule: rule22
  }, {
    start: 11421,
    length: 1,
    convRule: rule23
  }, {
    start: 11422,
    length: 1,
    convRule: rule22
  }, {
    start: 11423,
    length: 1,
    convRule: rule23
  }, {
    start: 11424,
    length: 1,
    convRule: rule22
  }, {
    start: 11425,
    length: 1,
    convRule: rule23
  }, {
    start: 11426,
    length: 1,
    convRule: rule22
  }, {
    start: 11427,
    length: 1,
    convRule: rule23
  }, {
    start: 11428,
    length: 1,
    convRule: rule22
  }, {
    start: 11429,
    length: 1,
    convRule: rule23
  }, {
    start: 11430,
    length: 1,
    convRule: rule22
  }, {
    start: 11431,
    length: 1,
    convRule: rule23
  }, {
    start: 11432,
    length: 1,
    convRule: rule22
  }, {
    start: 11433,
    length: 1,
    convRule: rule23
  }, {
    start: 11434,
    length: 1,
    convRule: rule22
  }, {
    start: 11435,
    length: 1,
    convRule: rule23
  }, {
    start: 11436,
    length: 1,
    convRule: rule22
  }, {
    start: 11437,
    length: 1,
    convRule: rule23
  }, {
    start: 11438,
    length: 1,
    convRule: rule22
  }, {
    start: 11439,
    length: 1,
    convRule: rule23
  }, {
    start: 11440,
    length: 1,
    convRule: rule22
  }, {
    start: 11441,
    length: 1,
    convRule: rule23
  }, {
    start: 11442,
    length: 1,
    convRule: rule22
  }, {
    start: 11443,
    length: 1,
    convRule: rule23
  }, {
    start: 11444,
    length: 1,
    convRule: rule22
  }, {
    start: 11445,
    length: 1,
    convRule: rule23
  }, {
    start: 11446,
    length: 1,
    convRule: rule22
  }, {
    start: 11447,
    length: 1,
    convRule: rule23
  }, {
    start: 11448,
    length: 1,
    convRule: rule22
  }, {
    start: 11449,
    length: 1,
    convRule: rule23
  }, {
    start: 11450,
    length: 1,
    convRule: rule22
  }, {
    start: 11451,
    length: 1,
    convRule: rule23
  }, {
    start: 11452,
    length: 1,
    convRule: rule22
  }, {
    start: 11453,
    length: 1,
    convRule: rule23
  }, {
    start: 11454,
    length: 1,
    convRule: rule22
  }, {
    start: 11455,
    length: 1,
    convRule: rule23
  }, {
    start: 11456,
    length: 1,
    convRule: rule22
  }, {
    start: 11457,
    length: 1,
    convRule: rule23
  }, {
    start: 11458,
    length: 1,
    convRule: rule22
  }, {
    start: 11459,
    length: 1,
    convRule: rule23
  }, {
    start: 11460,
    length: 1,
    convRule: rule22
  }, {
    start: 11461,
    length: 1,
    convRule: rule23
  }, {
    start: 11462,
    length: 1,
    convRule: rule22
  }, {
    start: 11463,
    length: 1,
    convRule: rule23
  }, {
    start: 11464,
    length: 1,
    convRule: rule22
  }, {
    start: 11465,
    length: 1,
    convRule: rule23
  }, {
    start: 11466,
    length: 1,
    convRule: rule22
  }, {
    start: 11467,
    length: 1,
    convRule: rule23
  }, {
    start: 11468,
    length: 1,
    convRule: rule22
  }, {
    start: 11469,
    length: 1,
    convRule: rule23
  }, {
    start: 11470,
    length: 1,
    convRule: rule22
  }, {
    start: 11471,
    length: 1,
    convRule: rule23
  }, {
    start: 11472,
    length: 1,
    convRule: rule22
  }, {
    start: 11473,
    length: 1,
    convRule: rule23
  }, {
    start: 11474,
    length: 1,
    convRule: rule22
  }, {
    start: 11475,
    length: 1,
    convRule: rule23
  }, {
    start: 11476,
    length: 1,
    convRule: rule22
  }, {
    start: 11477,
    length: 1,
    convRule: rule23
  }, {
    start: 11478,
    length: 1,
    convRule: rule22
  }, {
    start: 11479,
    length: 1,
    convRule: rule23
  }, {
    start: 11480,
    length: 1,
    convRule: rule22
  }, {
    start: 11481,
    length: 1,
    convRule: rule23
  }, {
    start: 11482,
    length: 1,
    convRule: rule22
  }, {
    start: 11483,
    length: 1,
    convRule: rule23
  }, {
    start: 11484,
    length: 1,
    convRule: rule22
  }, {
    start: 11485,
    length: 1,
    convRule: rule23
  }, {
    start: 11486,
    length: 1,
    convRule: rule22
  }, {
    start: 11487,
    length: 1,
    convRule: rule23
  }, {
    start: 11488,
    length: 1,
    convRule: rule22
  }, {
    start: 11489,
    length: 1,
    convRule: rule23
  }, {
    start: 11490,
    length: 1,
    convRule: rule22
  }, {
    start: 11491,
    length: 1,
    convRule: rule23
  }, {
    start: 11492,
    length: 1,
    convRule: rule20
  }, {
    start: 11493,
    length: 6,
    convRule: rule13
  }, {
    start: 11499,
    length: 1,
    convRule: rule22
  }, {
    start: 11500,
    length: 1,
    convRule: rule23
  }, {
    start: 11501,
    length: 1,
    convRule: rule22
  }, {
    start: 11502,
    length: 1,
    convRule: rule23
  }, {
    start: 11503,
    length: 3,
    convRule: rule92
  }, {
    start: 11506,
    length: 1,
    convRule: rule22
  }, {
    start: 11507,
    length: 1,
    convRule: rule23
  }, {
    start: 11513,
    length: 4,
    convRule: rule2
  }, {
    start: 11517,
    length: 1,
    convRule: rule17
  }, {
    start: 11518,
    length: 2,
    convRule: rule2
  }, {
    start: 11520,
    length: 38,
    convRule: rule182
  }, {
    start: 11559,
    length: 1,
    convRule: rule182
  }, {
    start: 11565,
    length: 1,
    convRule: rule182
  }, {
    start: 11568,
    length: 56,
    convRule: rule14
  }, {
    start: 11631,
    length: 1,
    convRule: rule91
  }, {
    start: 11632,
    length: 1,
    convRule: rule2
  }, {
    start: 11647,
    length: 1,
    convRule: rule92
  }, {
    start: 11648,
    length: 23,
    convRule: rule14
  }, {
    start: 11680,
    length: 7,
    convRule: rule14
  }, {
    start: 11688,
    length: 7,
    convRule: rule14
  }, {
    start: 11696,
    length: 7,
    convRule: rule14
  }, {
    start: 11704,
    length: 7,
    convRule: rule14
  }, {
    start: 11712,
    length: 7,
    convRule: rule14
  }, {
    start: 11720,
    length: 7,
    convRule: rule14
  }, {
    start: 11728,
    length: 7,
    convRule: rule14
  }, {
    start: 11736,
    length: 7,
    convRule: rule14
  }, {
    start: 11744,
    length: 32,
    convRule: rule92
  }, {
    start: 11776,
    length: 2,
    convRule: rule2
  }, {
    start: 11778,
    length: 1,
    convRule: rule15
  }, {
    start: 11779,
    length: 1,
    convRule: rule19
  }, {
    start: 11780,
    length: 1,
    convRule: rule15
  }, {
    start: 11781,
    length: 1,
    convRule: rule19
  }, {
    start: 11782,
    length: 3,
    convRule: rule2
  }, {
    start: 11785,
    length: 1,
    convRule: rule15
  }, {
    start: 11786,
    length: 1,
    convRule: rule19
  }, {
    start: 11787,
    length: 1,
    convRule: rule2
  }, {
    start: 11788,
    length: 1,
    convRule: rule15
  }, {
    start: 11789,
    length: 1,
    convRule: rule19
  }, {
    start: 11790,
    length: 9,
    convRule: rule2
  }, {
    start: 11799,
    length: 1,
    convRule: rule7
  }, {
    start: 11800,
    length: 2,
    convRule: rule2
  }, {
    start: 11802,
    length: 1,
    convRule: rule7
  }, {
    start: 11803,
    length: 1,
    convRule: rule2
  }, {
    start: 11804,
    length: 1,
    convRule: rule15
  }, {
    start: 11805,
    length: 1,
    convRule: rule19
  }, {
    start: 11806,
    length: 2,
    convRule: rule2
  }, {
    start: 11808,
    length: 1,
    convRule: rule15
  }, {
    start: 11809,
    length: 1,
    convRule: rule19
  }, {
    start: 11810,
    length: 1,
    convRule: rule4
  }, {
    start: 11811,
    length: 1,
    convRule: rule5
  }, {
    start: 11812,
    length: 1,
    convRule: rule4
  }, {
    start: 11813,
    length: 1,
    convRule: rule5
  }, {
    start: 11814,
    length: 1,
    convRule: rule4
  }, {
    start: 11815,
    length: 1,
    convRule: rule5
  }, {
    start: 11816,
    length: 1,
    convRule: rule4
  }, {
    start: 11817,
    length: 1,
    convRule: rule5
  }, {
    start: 11818,
    length: 5,
    convRule: rule2
  }, {
    start: 11823,
    length: 1,
    convRule: rule91
  }, {
    start: 11824,
    length: 10,
    convRule: rule2
  }, {
    start: 11834,
    length: 2,
    convRule: rule7
  }, {
    start: 11836,
    length: 4,
    convRule: rule2
  }, {
    start: 11840,
    length: 1,
    convRule: rule7
  }, {
    start: 11841,
    length: 1,
    convRule: rule2
  }, {
    start: 11842,
    length: 1,
    convRule: rule4
  }, {
    start: 11843,
    length: 13,
    convRule: rule2
  }, {
    start: 11856,
    length: 2,
    convRule: rule13
  }, {
    start: 11858,
    length: 1,
    convRule: rule2
  }, {
    start: 11904,
    length: 26,
    convRule: rule13
  }, {
    start: 11931,
    length: 89,
    convRule: rule13
  }, {
    start: 12032,
    length: 214,
    convRule: rule13
  }, {
    start: 12272,
    length: 12,
    convRule: rule13
  }, {
    start: 12288,
    length: 1,
    convRule: rule1
  }, {
    start: 12289,
    length: 3,
    convRule: rule2
  }, {
    start: 12292,
    length: 1,
    convRule: rule13
  }, {
    start: 12293,
    length: 1,
    convRule: rule91
  }, {
    start: 12294,
    length: 1,
    convRule: rule14
  }, {
    start: 12295,
    length: 1,
    convRule: rule128
  }, {
    start: 12296,
    length: 1,
    convRule: rule4
  }, {
    start: 12297,
    length: 1,
    convRule: rule5
  }, {
    start: 12298,
    length: 1,
    convRule: rule4
  }, {
    start: 12299,
    length: 1,
    convRule: rule5
  }, {
    start: 12300,
    length: 1,
    convRule: rule4
  }, {
    start: 12301,
    length: 1,
    convRule: rule5
  }, {
    start: 12302,
    length: 1,
    convRule: rule4
  }, {
    start: 12303,
    length: 1,
    convRule: rule5
  }, {
    start: 12304,
    length: 1,
    convRule: rule4
  }, {
    start: 12305,
    length: 1,
    convRule: rule5
  }, {
    start: 12306,
    length: 2,
    convRule: rule13
  }, {
    start: 12308,
    length: 1,
    convRule: rule4
  }, {
    start: 12309,
    length: 1,
    convRule: rule5
  }, {
    start: 12310,
    length: 1,
    convRule: rule4
  }, {
    start: 12311,
    length: 1,
    convRule: rule5
  }, {
    start: 12312,
    length: 1,
    convRule: rule4
  }, {
    start: 12313,
    length: 1,
    convRule: rule5
  }, {
    start: 12314,
    length: 1,
    convRule: rule4
  }, {
    start: 12315,
    length: 1,
    convRule: rule5
  }, {
    start: 12316,
    length: 1,
    convRule: rule7
  }, {
    start: 12317,
    length: 1,
    convRule: rule4
  }, {
    start: 12318,
    length: 2,
    convRule: rule5
  }, {
    start: 12320,
    length: 1,
    convRule: rule13
  }, {
    start: 12321,
    length: 9,
    convRule: rule128
  }, {
    start: 12330,
    length: 4,
    convRule: rule92
  }, {
    start: 12334,
    length: 2,
    convRule: rule124
  }, {
    start: 12336,
    length: 1,
    convRule: rule7
  }, {
    start: 12337,
    length: 5,
    convRule: rule91
  }, {
    start: 12342,
    length: 2,
    convRule: rule13
  }, {
    start: 12344,
    length: 3,
    convRule: rule128
  }, {
    start: 12347,
    length: 1,
    convRule: rule91
  }, {
    start: 12348,
    length: 1,
    convRule: rule14
  }, {
    start: 12349,
    length: 1,
    convRule: rule2
  }, {
    start: 12350,
    length: 2,
    convRule: rule13
  }, {
    start: 12353,
    length: 86,
    convRule: rule14
  }, {
    start: 12441,
    length: 2,
    convRule: rule92
  }, {
    start: 12443,
    length: 2,
    convRule: rule10
  }, {
    start: 12445,
    length: 2,
    convRule: rule91
  }, {
    start: 12447,
    length: 1,
    convRule: rule14
  }, {
    start: 12448,
    length: 1,
    convRule: rule7
  }, {
    start: 12449,
    length: 90,
    convRule: rule14
  }, {
    start: 12539,
    length: 1,
    convRule: rule2
  }, {
    start: 12540,
    length: 3,
    convRule: rule91
  }, {
    start: 12543,
    length: 1,
    convRule: rule14
  }, {
    start: 12549,
    length: 43,
    convRule: rule14
  }, {
    start: 12593,
    length: 94,
    convRule: rule14
  }, {
    start: 12688,
    length: 2,
    convRule: rule13
  }, {
    start: 12690,
    length: 4,
    convRule: rule17
  }, {
    start: 12694,
    length: 10,
    convRule: rule13
  }, {
    start: 12704,
    length: 32,
    convRule: rule14
  }, {
    start: 12736,
    length: 36,
    convRule: rule13
  }, {
    start: 12784,
    length: 16,
    convRule: rule14
  }, {
    start: 12800,
    length: 31,
    convRule: rule13
  }, {
    start: 12832,
    length: 10,
    convRule: rule17
  }, {
    start: 12842,
    length: 30,
    convRule: rule13
  }, {
    start: 12872,
    length: 8,
    convRule: rule17
  }, {
    start: 12880,
    length: 1,
    convRule: rule13
  }, {
    start: 12881,
    length: 15,
    convRule: rule17
  }, {
    start: 12896,
    length: 32,
    convRule: rule13
  }, {
    start: 12928,
    length: 10,
    convRule: rule17
  }, {
    start: 12938,
    length: 39,
    convRule: rule13
  }, {
    start: 12977,
    length: 15,
    convRule: rule17
  }, {
    start: 12992,
    length: 320,
    convRule: rule13
  }, {
    start: 13312,
    length: 6592,
    convRule: rule14
  }, {
    start: 19904,
    length: 64,
    convRule: rule13
  }, {
    start: 19968,
    length: 20989,
    convRule: rule14
  }, {
    start: 40960,
    length: 21,
    convRule: rule14
  }, {
    start: 40981,
    length: 1,
    convRule: rule91
  }, {
    start: 40982,
    length: 1143,
    convRule: rule14
  }, {
    start: 42128,
    length: 55,
    convRule: rule13
  }, {
    start: 42192,
    length: 40,
    convRule: rule14
  }, {
    start: 42232,
    length: 6,
    convRule: rule91
  }, {
    start: 42238,
    length: 2,
    convRule: rule2
  }, {
    start: 42240,
    length: 268,
    convRule: rule14
  }, {
    start: 42508,
    length: 1,
    convRule: rule91
  }, {
    start: 42509,
    length: 3,
    convRule: rule2
  }, {
    start: 42512,
    length: 16,
    convRule: rule14
  }, {
    start: 42528,
    length: 10,
    convRule: rule8
  }, {
    start: 42538,
    length: 2,
    convRule: rule14
  }, {
    start: 42560,
    length: 1,
    convRule: rule22
  }, {
    start: 42561,
    length: 1,
    convRule: rule23
  }, {
    start: 42562,
    length: 1,
    convRule: rule22
  }, {
    start: 42563,
    length: 1,
    convRule: rule23
  }, {
    start: 42564,
    length: 1,
    convRule: rule22
  }, {
    start: 42565,
    length: 1,
    convRule: rule23
  }, {
    start: 42566,
    length: 1,
    convRule: rule22
  }, {
    start: 42567,
    length: 1,
    convRule: rule23
  }, {
    start: 42568,
    length: 1,
    convRule: rule22
  }, {
    start: 42569,
    length: 1,
    convRule: rule23
  }, {
    start: 42570,
    length: 1,
    convRule: rule22
  }, {
    start: 42571,
    length: 1,
    convRule: rule23
  }, {
    start: 42572,
    length: 1,
    convRule: rule22
  }, {
    start: 42573,
    length: 1,
    convRule: rule23
  }, {
    start: 42574,
    length: 1,
    convRule: rule22
  }, {
    start: 42575,
    length: 1,
    convRule: rule23
  }, {
    start: 42576,
    length: 1,
    convRule: rule22
  }, {
    start: 42577,
    length: 1,
    convRule: rule23
  }, {
    start: 42578,
    length: 1,
    convRule: rule22
  }, {
    start: 42579,
    length: 1,
    convRule: rule23
  }, {
    start: 42580,
    length: 1,
    convRule: rule22
  }, {
    start: 42581,
    length: 1,
    convRule: rule23
  }, {
    start: 42582,
    length: 1,
    convRule: rule22
  }, {
    start: 42583,
    length: 1,
    convRule: rule23
  }, {
    start: 42584,
    length: 1,
    convRule: rule22
  }, {
    start: 42585,
    length: 1,
    convRule: rule23
  }, {
    start: 42586,
    length: 1,
    convRule: rule22
  }, {
    start: 42587,
    length: 1,
    convRule: rule23
  }, {
    start: 42588,
    length: 1,
    convRule: rule22
  }, {
    start: 42589,
    length: 1,
    convRule: rule23
  }, {
    start: 42590,
    length: 1,
    convRule: rule22
  }, {
    start: 42591,
    length: 1,
    convRule: rule23
  }, {
    start: 42592,
    length: 1,
    convRule: rule22
  }, {
    start: 42593,
    length: 1,
    convRule: rule23
  }, {
    start: 42594,
    length: 1,
    convRule: rule22
  }, {
    start: 42595,
    length: 1,
    convRule: rule23
  }, {
    start: 42596,
    length: 1,
    convRule: rule22
  }, {
    start: 42597,
    length: 1,
    convRule: rule23
  }, {
    start: 42598,
    length: 1,
    convRule: rule22
  }, {
    start: 42599,
    length: 1,
    convRule: rule23
  }, {
    start: 42600,
    length: 1,
    convRule: rule22
  }, {
    start: 42601,
    length: 1,
    convRule: rule23
  }, {
    start: 42602,
    length: 1,
    convRule: rule22
  }, {
    start: 42603,
    length: 1,
    convRule: rule23
  }, {
    start: 42604,
    length: 1,
    convRule: rule22
  }, {
    start: 42605,
    length: 1,
    convRule: rule23
  }, {
    start: 42606,
    length: 1,
    convRule: rule14
  }, {
    start: 42607,
    length: 1,
    convRule: rule92
  }, {
    start: 42608,
    length: 3,
    convRule: rule119
  }, {
    start: 42611,
    length: 1,
    convRule: rule2
  }, {
    start: 42612,
    length: 10,
    convRule: rule92
  }, {
    start: 42622,
    length: 1,
    convRule: rule2
  }, {
    start: 42623,
    length: 1,
    convRule: rule91
  }, {
    start: 42624,
    length: 1,
    convRule: rule22
  }, {
    start: 42625,
    length: 1,
    convRule: rule23
  }, {
    start: 42626,
    length: 1,
    convRule: rule22
  }, {
    start: 42627,
    length: 1,
    convRule: rule23
  }, {
    start: 42628,
    length: 1,
    convRule: rule22
  }, {
    start: 42629,
    length: 1,
    convRule: rule23
  }, {
    start: 42630,
    length: 1,
    convRule: rule22
  }, {
    start: 42631,
    length: 1,
    convRule: rule23
  }, {
    start: 42632,
    length: 1,
    convRule: rule22
  }, {
    start: 42633,
    length: 1,
    convRule: rule23
  }, {
    start: 42634,
    length: 1,
    convRule: rule22
  }, {
    start: 42635,
    length: 1,
    convRule: rule23
  }, {
    start: 42636,
    length: 1,
    convRule: rule22
  }, {
    start: 42637,
    length: 1,
    convRule: rule23
  }, {
    start: 42638,
    length: 1,
    convRule: rule22
  }, {
    start: 42639,
    length: 1,
    convRule: rule23
  }, {
    start: 42640,
    length: 1,
    convRule: rule22
  }, {
    start: 42641,
    length: 1,
    convRule: rule23
  }, {
    start: 42642,
    length: 1,
    convRule: rule22
  }, {
    start: 42643,
    length: 1,
    convRule: rule23
  }, {
    start: 42644,
    length: 1,
    convRule: rule22
  }, {
    start: 42645,
    length: 1,
    convRule: rule23
  }, {
    start: 42646,
    length: 1,
    convRule: rule22
  }, {
    start: 42647,
    length: 1,
    convRule: rule23
  }, {
    start: 42648,
    length: 1,
    convRule: rule22
  }, {
    start: 42649,
    length: 1,
    convRule: rule23
  }, {
    start: 42650,
    length: 1,
    convRule: rule22
  }, {
    start: 42651,
    length: 1,
    convRule: rule23
  }, {
    start: 42652,
    length: 2,
    convRule: rule91
  }, {
    start: 42654,
    length: 2,
    convRule: rule92
  }, {
    start: 42656,
    length: 70,
    convRule: rule14
  }, {
    start: 42726,
    length: 10,
    convRule: rule128
  }, {
    start: 42736,
    length: 2,
    convRule: rule92
  }, {
    start: 42738,
    length: 6,
    convRule: rule2
  }, {
    start: 42752,
    length: 23,
    convRule: rule10
  }, {
    start: 42775,
    length: 9,
    convRule: rule91
  }, {
    start: 42784,
    length: 2,
    convRule: rule10
  }, {
    start: 42786,
    length: 1,
    convRule: rule22
  }, {
    start: 42787,
    length: 1,
    convRule: rule23
  }, {
    start: 42788,
    length: 1,
    convRule: rule22
  }, {
    start: 42789,
    length: 1,
    convRule: rule23
  }, {
    start: 42790,
    length: 1,
    convRule: rule22
  }, {
    start: 42791,
    length: 1,
    convRule: rule23
  }, {
    start: 42792,
    length: 1,
    convRule: rule22
  }, {
    start: 42793,
    length: 1,
    convRule: rule23
  }, {
    start: 42794,
    length: 1,
    convRule: rule22
  }, {
    start: 42795,
    length: 1,
    convRule: rule23
  }, {
    start: 42796,
    length: 1,
    convRule: rule22
  }, {
    start: 42797,
    length: 1,
    convRule: rule23
  }, {
    start: 42798,
    length: 1,
    convRule: rule22
  }, {
    start: 42799,
    length: 1,
    convRule: rule23
  }, {
    start: 42800,
    length: 2,
    convRule: rule20
  }, {
    start: 42802,
    length: 1,
    convRule: rule22
  }, {
    start: 42803,
    length: 1,
    convRule: rule23
  }, {
    start: 42804,
    length: 1,
    convRule: rule22
  }, {
    start: 42805,
    length: 1,
    convRule: rule23
  }, {
    start: 42806,
    length: 1,
    convRule: rule22
  }, {
    start: 42807,
    length: 1,
    convRule: rule23
  }, {
    start: 42808,
    length: 1,
    convRule: rule22
  }, {
    start: 42809,
    length: 1,
    convRule: rule23
  }, {
    start: 42810,
    length: 1,
    convRule: rule22
  }, {
    start: 42811,
    length: 1,
    convRule: rule23
  }, {
    start: 42812,
    length: 1,
    convRule: rule22
  }, {
    start: 42813,
    length: 1,
    convRule: rule23
  }, {
    start: 42814,
    length: 1,
    convRule: rule22
  }, {
    start: 42815,
    length: 1,
    convRule: rule23
  }, {
    start: 42816,
    length: 1,
    convRule: rule22
  }, {
    start: 42817,
    length: 1,
    convRule: rule23
  }, {
    start: 42818,
    length: 1,
    convRule: rule22
  }, {
    start: 42819,
    length: 1,
    convRule: rule23
  }, {
    start: 42820,
    length: 1,
    convRule: rule22
  }, {
    start: 42821,
    length: 1,
    convRule: rule23
  }, {
    start: 42822,
    length: 1,
    convRule: rule22
  }, {
    start: 42823,
    length: 1,
    convRule: rule23
  }, {
    start: 42824,
    length: 1,
    convRule: rule22
  }, {
    start: 42825,
    length: 1,
    convRule: rule23
  }, {
    start: 42826,
    length: 1,
    convRule: rule22
  }, {
    start: 42827,
    length: 1,
    convRule: rule23
  }, {
    start: 42828,
    length: 1,
    convRule: rule22
  }, {
    start: 42829,
    length: 1,
    convRule: rule23
  }, {
    start: 42830,
    length: 1,
    convRule: rule22
  }, {
    start: 42831,
    length: 1,
    convRule: rule23
  }, {
    start: 42832,
    length: 1,
    convRule: rule22
  }, {
    start: 42833,
    length: 1,
    convRule: rule23
  }, {
    start: 42834,
    length: 1,
    convRule: rule22
  }, {
    start: 42835,
    length: 1,
    convRule: rule23
  }, {
    start: 42836,
    length: 1,
    convRule: rule22
  }, {
    start: 42837,
    length: 1,
    convRule: rule23
  }, {
    start: 42838,
    length: 1,
    convRule: rule22
  }, {
    start: 42839,
    length: 1,
    convRule: rule23
  }, {
    start: 42840,
    length: 1,
    convRule: rule22
  }, {
    start: 42841,
    length: 1,
    convRule: rule23
  }, {
    start: 42842,
    length: 1,
    convRule: rule22
  }, {
    start: 42843,
    length: 1,
    convRule: rule23
  }, {
    start: 42844,
    length: 1,
    convRule: rule22
  }, {
    start: 42845,
    length: 1,
    convRule: rule23
  }, {
    start: 42846,
    length: 1,
    convRule: rule22
  }, {
    start: 42847,
    length: 1,
    convRule: rule23
  }, {
    start: 42848,
    length: 1,
    convRule: rule22
  }, {
    start: 42849,
    length: 1,
    convRule: rule23
  }, {
    start: 42850,
    length: 1,
    convRule: rule22
  }, {
    start: 42851,
    length: 1,
    convRule: rule23
  }, {
    start: 42852,
    length: 1,
    convRule: rule22
  }, {
    start: 42853,
    length: 1,
    convRule: rule23
  }, {
    start: 42854,
    length: 1,
    convRule: rule22
  }, {
    start: 42855,
    length: 1,
    convRule: rule23
  }, {
    start: 42856,
    length: 1,
    convRule: rule22
  }, {
    start: 42857,
    length: 1,
    convRule: rule23
  }, {
    start: 42858,
    length: 1,
    convRule: rule22
  }, {
    start: 42859,
    length: 1,
    convRule: rule23
  }, {
    start: 42860,
    length: 1,
    convRule: rule22
  }, {
    start: 42861,
    length: 1,
    convRule: rule23
  }, {
    start: 42862,
    length: 1,
    convRule: rule22
  }, {
    start: 42863,
    length: 1,
    convRule: rule23
  }, {
    start: 42864,
    length: 1,
    convRule: rule91
  }, {
    start: 42865,
    length: 8,
    convRule: rule20
  }, {
    start: 42873,
    length: 1,
    convRule: rule22
  }, {
    start: 42874,
    length: 1,
    convRule: rule23
  }, {
    start: 42875,
    length: 1,
    convRule: rule22
  }, {
    start: 42876,
    length: 1,
    convRule: rule23
  }, {
    start: 42877,
    length: 1,
    convRule: rule183
  }, {
    start: 42878,
    length: 1,
    convRule: rule22
  }, {
    start: 42879,
    length: 1,
    convRule: rule23
  }, {
    start: 42880,
    length: 1,
    convRule: rule22
  }, {
    start: 42881,
    length: 1,
    convRule: rule23
  }, {
    start: 42882,
    length: 1,
    convRule: rule22
  }, {
    start: 42883,
    length: 1,
    convRule: rule23
  }, {
    start: 42884,
    length: 1,
    convRule: rule22
  }, {
    start: 42885,
    length: 1,
    convRule: rule23
  }, {
    start: 42886,
    length: 1,
    convRule: rule22
  }, {
    start: 42887,
    length: 1,
    convRule: rule23
  }, {
    start: 42888,
    length: 1,
    convRule: rule91
  }, {
    start: 42889,
    length: 2,
    convRule: rule10
  }, {
    start: 42891,
    length: 1,
    convRule: rule22
  }, {
    start: 42892,
    length: 1,
    convRule: rule23
  }, {
    start: 42893,
    length: 1,
    convRule: rule184
  }, {
    start: 42894,
    length: 1,
    convRule: rule20
  }, {
    start: 42895,
    length: 1,
    convRule: rule14
  }, {
    start: 42896,
    length: 1,
    convRule: rule22
  }, {
    start: 42897,
    length: 1,
    convRule: rule23
  }, {
    start: 42898,
    length: 1,
    convRule: rule22
  }, {
    start: 42899,
    length: 1,
    convRule: rule23
  }, {
    start: 42900,
    length: 1,
    convRule: rule185
  }, {
    start: 42901,
    length: 1,
    convRule: rule20
  }, {
    start: 42902,
    length: 1,
    convRule: rule22
  }, {
    start: 42903,
    length: 1,
    convRule: rule23
  }, {
    start: 42904,
    length: 1,
    convRule: rule22
  }, {
    start: 42905,
    length: 1,
    convRule: rule23
  }, {
    start: 42906,
    length: 1,
    convRule: rule22
  }, {
    start: 42907,
    length: 1,
    convRule: rule23
  }, {
    start: 42908,
    length: 1,
    convRule: rule22
  }, {
    start: 42909,
    length: 1,
    convRule: rule23
  }, {
    start: 42910,
    length: 1,
    convRule: rule22
  }, {
    start: 42911,
    length: 1,
    convRule: rule23
  }, {
    start: 42912,
    length: 1,
    convRule: rule22
  }, {
    start: 42913,
    length: 1,
    convRule: rule23
  }, {
    start: 42914,
    length: 1,
    convRule: rule22
  }, {
    start: 42915,
    length: 1,
    convRule: rule23
  }, {
    start: 42916,
    length: 1,
    convRule: rule22
  }, {
    start: 42917,
    length: 1,
    convRule: rule23
  }, {
    start: 42918,
    length: 1,
    convRule: rule22
  }, {
    start: 42919,
    length: 1,
    convRule: rule23
  }, {
    start: 42920,
    length: 1,
    convRule: rule22
  }, {
    start: 42921,
    length: 1,
    convRule: rule23
  }, {
    start: 42922,
    length: 1,
    convRule: rule186
  }, {
    start: 42923,
    length: 1,
    convRule: rule187
  }, {
    start: 42924,
    length: 1,
    convRule: rule188
  }, {
    start: 42925,
    length: 1,
    convRule: rule189
  }, {
    start: 42926,
    length: 1,
    convRule: rule186
  }, {
    start: 42927,
    length: 1,
    convRule: rule20
  }, {
    start: 42928,
    length: 1,
    convRule: rule190
  }, {
    start: 42929,
    length: 1,
    convRule: rule191
  }, {
    start: 42930,
    length: 1,
    convRule: rule192
  }, {
    start: 42931,
    length: 1,
    convRule: rule193
  }, {
    start: 42932,
    length: 1,
    convRule: rule22
  }, {
    start: 42933,
    length: 1,
    convRule: rule23
  }, {
    start: 42934,
    length: 1,
    convRule: rule22
  }, {
    start: 42935,
    length: 1,
    convRule: rule23
  }, {
    start: 42936,
    length: 1,
    convRule: rule22
  }, {
    start: 42937,
    length: 1,
    convRule: rule23
  }, {
    start: 42938,
    length: 1,
    convRule: rule22
  }, {
    start: 42939,
    length: 1,
    convRule: rule23
  }, {
    start: 42940,
    length: 1,
    convRule: rule22
  }, {
    start: 42941,
    length: 1,
    convRule: rule23
  }, {
    start: 42942,
    length: 1,
    convRule: rule22
  }, {
    start: 42943,
    length: 1,
    convRule: rule23
  }, {
    start: 42946,
    length: 1,
    convRule: rule22
  }, {
    start: 42947,
    length: 1,
    convRule: rule23
  }, {
    start: 42948,
    length: 1,
    convRule: rule194
  }, {
    start: 42949,
    length: 1,
    convRule: rule195
  }, {
    start: 42950,
    length: 1,
    convRule: rule196
  }, {
    start: 42951,
    length: 1,
    convRule: rule22
  }, {
    start: 42952,
    length: 1,
    convRule: rule23
  }, {
    start: 42953,
    length: 1,
    convRule: rule22
  }, {
    start: 42954,
    length: 1,
    convRule: rule23
  }, {
    start: 42997,
    length: 1,
    convRule: rule22
  }, {
    start: 42998,
    length: 1,
    convRule: rule23
  }, {
    start: 42999,
    length: 1,
    convRule: rule14
  }, {
    start: 43e3,
    length: 2,
    convRule: rule91
  }, {
    start: 43002,
    length: 1,
    convRule: rule20
  }, {
    start: 43003,
    length: 7,
    convRule: rule14
  }, {
    start: 43010,
    length: 1,
    convRule: rule92
  }, {
    start: 43011,
    length: 3,
    convRule: rule14
  }, {
    start: 43014,
    length: 1,
    convRule: rule92
  }, {
    start: 43015,
    length: 4,
    convRule: rule14
  }, {
    start: 43019,
    length: 1,
    convRule: rule92
  }, {
    start: 43020,
    length: 23,
    convRule: rule14
  }, {
    start: 43043,
    length: 2,
    convRule: rule124
  }, {
    start: 43045,
    length: 2,
    convRule: rule92
  }, {
    start: 43047,
    length: 1,
    convRule: rule124
  }, {
    start: 43048,
    length: 4,
    convRule: rule13
  }, {
    start: 43052,
    length: 1,
    convRule: rule92
  }, {
    start: 43056,
    length: 6,
    convRule: rule17
  }, {
    start: 43062,
    length: 2,
    convRule: rule13
  }, {
    start: 43064,
    length: 1,
    convRule: rule3
  }, {
    start: 43065,
    length: 1,
    convRule: rule13
  }, {
    start: 43072,
    length: 52,
    convRule: rule14
  }, {
    start: 43124,
    length: 4,
    convRule: rule2
  }, {
    start: 43136,
    length: 2,
    convRule: rule124
  }, {
    start: 43138,
    length: 50,
    convRule: rule14
  }, {
    start: 43188,
    length: 16,
    convRule: rule124
  }, {
    start: 43204,
    length: 2,
    convRule: rule92
  }, {
    start: 43214,
    length: 2,
    convRule: rule2
  }, {
    start: 43216,
    length: 10,
    convRule: rule8
  }, {
    start: 43232,
    length: 18,
    convRule: rule92
  }, {
    start: 43250,
    length: 6,
    convRule: rule14
  }, {
    start: 43256,
    length: 3,
    convRule: rule2
  }, {
    start: 43259,
    length: 1,
    convRule: rule14
  }, {
    start: 43260,
    length: 1,
    convRule: rule2
  }, {
    start: 43261,
    length: 2,
    convRule: rule14
  }, {
    start: 43263,
    length: 1,
    convRule: rule92
  }, {
    start: 43264,
    length: 10,
    convRule: rule8
  }, {
    start: 43274,
    length: 28,
    convRule: rule14
  }, {
    start: 43302,
    length: 8,
    convRule: rule92
  }, {
    start: 43310,
    length: 2,
    convRule: rule2
  }, {
    start: 43312,
    length: 23,
    convRule: rule14
  }, {
    start: 43335,
    length: 11,
    convRule: rule92
  }, {
    start: 43346,
    length: 2,
    convRule: rule124
  }, {
    start: 43359,
    length: 1,
    convRule: rule2
  }, {
    start: 43360,
    length: 29,
    convRule: rule14
  }, {
    start: 43392,
    length: 3,
    convRule: rule92
  }, {
    start: 43395,
    length: 1,
    convRule: rule124
  }, {
    start: 43396,
    length: 47,
    convRule: rule14
  }, {
    start: 43443,
    length: 1,
    convRule: rule92
  }, {
    start: 43444,
    length: 2,
    convRule: rule124
  }, {
    start: 43446,
    length: 4,
    convRule: rule92
  }, {
    start: 43450,
    length: 2,
    convRule: rule124
  }, {
    start: 43452,
    length: 2,
    convRule: rule92
  }, {
    start: 43454,
    length: 3,
    convRule: rule124
  }, {
    start: 43457,
    length: 13,
    convRule: rule2
  }, {
    start: 43471,
    length: 1,
    convRule: rule91
  }, {
    start: 43472,
    length: 10,
    convRule: rule8
  }, {
    start: 43486,
    length: 2,
    convRule: rule2
  }, {
    start: 43488,
    length: 5,
    convRule: rule14
  }, {
    start: 43493,
    length: 1,
    convRule: rule92
  }, {
    start: 43494,
    length: 1,
    convRule: rule91
  }, {
    start: 43495,
    length: 9,
    convRule: rule14
  }, {
    start: 43504,
    length: 10,
    convRule: rule8
  }, {
    start: 43514,
    length: 5,
    convRule: rule14
  }, {
    start: 43520,
    length: 41,
    convRule: rule14
  }, {
    start: 43561,
    length: 6,
    convRule: rule92
  }, {
    start: 43567,
    length: 2,
    convRule: rule124
  }, {
    start: 43569,
    length: 2,
    convRule: rule92
  }, {
    start: 43571,
    length: 2,
    convRule: rule124
  }, {
    start: 43573,
    length: 2,
    convRule: rule92
  }, {
    start: 43584,
    length: 3,
    convRule: rule14
  }, {
    start: 43587,
    length: 1,
    convRule: rule92
  }, {
    start: 43588,
    length: 8,
    convRule: rule14
  }, {
    start: 43596,
    length: 1,
    convRule: rule92
  }, {
    start: 43597,
    length: 1,
    convRule: rule124
  }, {
    start: 43600,
    length: 10,
    convRule: rule8
  }, {
    start: 43612,
    length: 4,
    convRule: rule2
  }, {
    start: 43616,
    length: 16,
    convRule: rule14
  }, {
    start: 43632,
    length: 1,
    convRule: rule91
  }, {
    start: 43633,
    length: 6,
    convRule: rule14
  }, {
    start: 43639,
    length: 3,
    convRule: rule13
  }, {
    start: 43642,
    length: 1,
    convRule: rule14
  }, {
    start: 43643,
    length: 1,
    convRule: rule124
  }, {
    start: 43644,
    length: 1,
    convRule: rule92
  }, {
    start: 43645,
    length: 1,
    convRule: rule124
  }, {
    start: 43646,
    length: 50,
    convRule: rule14
  }, {
    start: 43696,
    length: 1,
    convRule: rule92
  }, {
    start: 43697,
    length: 1,
    convRule: rule14
  }, {
    start: 43698,
    length: 3,
    convRule: rule92
  }, {
    start: 43701,
    length: 2,
    convRule: rule14
  }, {
    start: 43703,
    length: 2,
    convRule: rule92
  }, {
    start: 43705,
    length: 5,
    convRule: rule14
  }, {
    start: 43710,
    length: 2,
    convRule: rule92
  }, {
    start: 43712,
    length: 1,
    convRule: rule14
  }, {
    start: 43713,
    length: 1,
    convRule: rule92
  }, {
    start: 43714,
    length: 1,
    convRule: rule14
  }, {
    start: 43739,
    length: 2,
    convRule: rule14
  }, {
    start: 43741,
    length: 1,
    convRule: rule91
  }, {
    start: 43742,
    length: 2,
    convRule: rule2
  }, {
    start: 43744,
    length: 11,
    convRule: rule14
  }, {
    start: 43755,
    length: 1,
    convRule: rule124
  }, {
    start: 43756,
    length: 2,
    convRule: rule92
  }, {
    start: 43758,
    length: 2,
    convRule: rule124
  }, {
    start: 43760,
    length: 2,
    convRule: rule2
  }, {
    start: 43762,
    length: 1,
    convRule: rule14
  }, {
    start: 43763,
    length: 2,
    convRule: rule91
  }, {
    start: 43765,
    length: 1,
    convRule: rule124
  }, {
    start: 43766,
    length: 1,
    convRule: rule92
  }, {
    start: 43777,
    length: 6,
    convRule: rule14
  }, {
    start: 43785,
    length: 6,
    convRule: rule14
  }, {
    start: 43793,
    length: 6,
    convRule: rule14
  }, {
    start: 43808,
    length: 7,
    convRule: rule14
  }, {
    start: 43816,
    length: 7,
    convRule: rule14
  }, {
    start: 43824,
    length: 35,
    convRule: rule20
  }, {
    start: 43859,
    length: 1,
    convRule: rule197
  }, {
    start: 43860,
    length: 7,
    convRule: rule20
  }, {
    start: 43867,
    length: 1,
    convRule: rule10
  }, {
    start: 43868,
    length: 4,
    convRule: rule91
  }, {
    start: 43872,
    length: 9,
    convRule: rule20
  }, {
    start: 43881,
    length: 1,
    convRule: rule91
  }, {
    start: 43882,
    length: 2,
    convRule: rule10
  }, {
    start: 43888,
    length: 80,
    convRule: rule198
  }, {
    start: 43968,
    length: 35,
    convRule: rule14
  }, {
    start: 44003,
    length: 2,
    convRule: rule124
  }, {
    start: 44005,
    length: 1,
    convRule: rule92
  }, {
    start: 44006,
    length: 2,
    convRule: rule124
  }, {
    start: 44008,
    length: 1,
    convRule: rule92
  }, {
    start: 44009,
    length: 2,
    convRule: rule124
  }, {
    start: 44011,
    length: 1,
    convRule: rule2
  }, {
    start: 44012,
    length: 1,
    convRule: rule124
  }, {
    start: 44013,
    length: 1,
    convRule: rule92
  }, {
    start: 44016,
    length: 10,
    convRule: rule8
  }, {
    start: 44032,
    length: 11172,
    convRule: rule14
  }, {
    start: 55216,
    length: 23,
    convRule: rule14
  }, {
    start: 55243,
    length: 49,
    convRule: rule14
  }, {
    start: 55296,
    length: 896,
    convRule: rule199
  }, {
    start: 56192,
    length: 128,
    convRule: rule199
  }, {
    start: 56320,
    length: 1024,
    convRule: rule199
  }, {
    start: 57344,
    length: 6400,
    convRule: rule200
  }, {
    start: 63744,
    length: 366,
    convRule: rule14
  }, {
    start: 64112,
    length: 106,
    convRule: rule14
  }, {
    start: 64256,
    length: 7,
    convRule: rule20
  }, {
    start: 64275,
    length: 5,
    convRule: rule20
  }, {
    start: 64285,
    length: 1,
    convRule: rule14
  }, {
    start: 64286,
    length: 1,
    convRule: rule92
  }, {
    start: 64287,
    length: 10,
    convRule: rule14
  }, {
    start: 64297,
    length: 1,
    convRule: rule6
  }, {
    start: 64298,
    length: 13,
    convRule: rule14
  }, {
    start: 64312,
    length: 5,
    convRule: rule14
  }, {
    start: 64318,
    length: 1,
    convRule: rule14
  }, {
    start: 64320,
    length: 2,
    convRule: rule14
  }, {
    start: 64323,
    length: 2,
    convRule: rule14
  }, {
    start: 64326,
    length: 108,
    convRule: rule14
  }, {
    start: 64434,
    length: 16,
    convRule: rule10
  }, {
    start: 64467,
    length: 363,
    convRule: rule14
  }, {
    start: 64830,
    length: 1,
    convRule: rule5
  }, {
    start: 64831,
    length: 1,
    convRule: rule4
  }, {
    start: 64848,
    length: 64,
    convRule: rule14
  }, {
    start: 64914,
    length: 54,
    convRule: rule14
  }, {
    start: 65008,
    length: 12,
    convRule: rule14
  }, {
    start: 65020,
    length: 1,
    convRule: rule3
  }, {
    start: 65021,
    length: 1,
    convRule: rule13
  }, {
    start: 65024,
    length: 16,
    convRule: rule92
  }, {
    start: 65040,
    length: 7,
    convRule: rule2
  }, {
    start: 65047,
    length: 1,
    convRule: rule4
  }, {
    start: 65048,
    length: 1,
    convRule: rule5
  }, {
    start: 65049,
    length: 1,
    convRule: rule2
  }, {
    start: 65056,
    length: 16,
    convRule: rule92
  }, {
    start: 65072,
    length: 1,
    convRule: rule2
  }, {
    start: 65073,
    length: 2,
    convRule: rule7
  }, {
    start: 65075,
    length: 2,
    convRule: rule11
  }, {
    start: 65077,
    length: 1,
    convRule: rule4
  }, {
    start: 65078,
    length: 1,
    convRule: rule5
  }, {
    start: 65079,
    length: 1,
    convRule: rule4
  }, {
    start: 65080,
    length: 1,
    convRule: rule5
  }, {
    start: 65081,
    length: 1,
    convRule: rule4
  }, {
    start: 65082,
    length: 1,
    convRule: rule5
  }, {
    start: 65083,
    length: 1,
    convRule: rule4
  }, {
    start: 65084,
    length: 1,
    convRule: rule5
  }, {
    start: 65085,
    length: 1,
    convRule: rule4
  }, {
    start: 65086,
    length: 1,
    convRule: rule5
  }, {
    start: 65087,
    length: 1,
    convRule: rule4
  }, {
    start: 65088,
    length: 1,
    convRule: rule5
  }, {
    start: 65089,
    length: 1,
    convRule: rule4
  }, {
    start: 65090,
    length: 1,
    convRule: rule5
  }, {
    start: 65091,
    length: 1,
    convRule: rule4
  }, {
    start: 65092,
    length: 1,
    convRule: rule5
  }, {
    start: 65093,
    length: 2,
    convRule: rule2
  }, {
    start: 65095,
    length: 1,
    convRule: rule4
  }, {
    start: 65096,
    length: 1,
    convRule: rule5
  }, {
    start: 65097,
    length: 4,
    convRule: rule2
  }, {
    start: 65101,
    length: 3,
    convRule: rule11
  }, {
    start: 65104,
    length: 3,
    convRule: rule2
  }, {
    start: 65108,
    length: 4,
    convRule: rule2
  }, {
    start: 65112,
    length: 1,
    convRule: rule7
  }, {
    start: 65113,
    length: 1,
    convRule: rule4
  }, {
    start: 65114,
    length: 1,
    convRule: rule5
  }, {
    start: 65115,
    length: 1,
    convRule: rule4
  }, {
    start: 65116,
    length: 1,
    convRule: rule5
  }, {
    start: 65117,
    length: 1,
    convRule: rule4
  }, {
    start: 65118,
    length: 1,
    convRule: rule5
  }, {
    start: 65119,
    length: 3,
    convRule: rule2
  }, {
    start: 65122,
    length: 1,
    convRule: rule6
  }, {
    start: 65123,
    length: 1,
    convRule: rule7
  }, {
    start: 65124,
    length: 3,
    convRule: rule6
  }, {
    start: 65128,
    length: 1,
    convRule: rule2
  }, {
    start: 65129,
    length: 1,
    convRule: rule3
  }, {
    start: 65130,
    length: 2,
    convRule: rule2
  }, {
    start: 65136,
    length: 5,
    convRule: rule14
  }, {
    start: 65142,
    length: 135,
    convRule: rule14
  }, {
    start: 65279,
    length: 1,
    convRule: rule16
  }, {
    start: 65281,
    length: 3,
    convRule: rule2
  }, {
    start: 65284,
    length: 1,
    convRule: rule3
  }, {
    start: 65285,
    length: 3,
    convRule: rule2
  }, {
    start: 65288,
    length: 1,
    convRule: rule4
  }, {
    start: 65289,
    length: 1,
    convRule: rule5
  }, {
    start: 65290,
    length: 1,
    convRule: rule2
  }, {
    start: 65291,
    length: 1,
    convRule: rule6
  }, {
    start: 65292,
    length: 1,
    convRule: rule2
  }, {
    start: 65293,
    length: 1,
    convRule: rule7
  }, {
    start: 65294,
    length: 2,
    convRule: rule2
  }, {
    start: 65296,
    length: 10,
    convRule: rule8
  }, {
    start: 65306,
    length: 2,
    convRule: rule2
  }, {
    start: 65308,
    length: 3,
    convRule: rule6
  }, {
    start: 65311,
    length: 2,
    convRule: rule2
  }, {
    start: 65313,
    length: 26,
    convRule: rule9
  }, {
    start: 65339,
    length: 1,
    convRule: rule4
  }, {
    start: 65340,
    length: 1,
    convRule: rule2
  }, {
    start: 65341,
    length: 1,
    convRule: rule5
  }, {
    start: 65342,
    length: 1,
    convRule: rule10
  }, {
    start: 65343,
    length: 1,
    convRule: rule11
  }, {
    start: 65344,
    length: 1,
    convRule: rule10
  }, {
    start: 65345,
    length: 26,
    convRule: rule12
  }, {
    start: 65371,
    length: 1,
    convRule: rule4
  }, {
    start: 65372,
    length: 1,
    convRule: rule6
  }, {
    start: 65373,
    length: 1,
    convRule: rule5
  }, {
    start: 65374,
    length: 1,
    convRule: rule6
  }, {
    start: 65375,
    length: 1,
    convRule: rule4
  }, {
    start: 65376,
    length: 1,
    convRule: rule5
  }, {
    start: 65377,
    length: 1,
    convRule: rule2
  }, {
    start: 65378,
    length: 1,
    convRule: rule4
  }, {
    start: 65379,
    length: 1,
    convRule: rule5
  }, {
    start: 65380,
    length: 2,
    convRule: rule2
  }, {
    start: 65382,
    length: 10,
    convRule: rule14
  }, {
    start: 65392,
    length: 1,
    convRule: rule91
  }, {
    start: 65393,
    length: 45,
    convRule: rule14
  }, {
    start: 65438,
    length: 2,
    convRule: rule91
  }, {
    start: 65440,
    length: 31,
    convRule: rule14
  }, {
    start: 65474,
    length: 6,
    convRule: rule14
  }, {
    start: 65482,
    length: 6,
    convRule: rule14
  }, {
    start: 65490,
    length: 6,
    convRule: rule14
  }, {
    start: 65498,
    length: 3,
    convRule: rule14
  }, {
    start: 65504,
    length: 2,
    convRule: rule3
  }, {
    start: 65506,
    length: 1,
    convRule: rule6
  }, {
    start: 65507,
    length: 1,
    convRule: rule10
  }, {
    start: 65508,
    length: 1,
    convRule: rule13
  }, {
    start: 65509,
    length: 2,
    convRule: rule3
  }, {
    start: 65512,
    length: 1,
    convRule: rule13
  }, {
    start: 65513,
    length: 4,
    convRule: rule6
  }, {
    start: 65517,
    length: 2,
    convRule: rule13
  }, {
    start: 65529,
    length: 3,
    convRule: rule16
  }, {
    start: 65532,
    length: 2,
    convRule: rule13
  }, {
    start: 65536,
    length: 12,
    convRule: rule14
  }, {
    start: 65549,
    length: 26,
    convRule: rule14
  }, {
    start: 65576,
    length: 19,
    convRule: rule14
  }, {
    start: 65596,
    length: 2,
    convRule: rule14
  }, {
    start: 65599,
    length: 15,
    convRule: rule14
  }, {
    start: 65616,
    length: 14,
    convRule: rule14
  }, {
    start: 65664,
    length: 123,
    convRule: rule14
  }, {
    start: 65792,
    length: 3,
    convRule: rule2
  }, {
    start: 65799,
    length: 45,
    convRule: rule17
  }, {
    start: 65847,
    length: 9,
    convRule: rule13
  }, {
    start: 65856,
    length: 53,
    convRule: rule128
  }, {
    start: 65909,
    length: 4,
    convRule: rule17
  }, {
    start: 65913,
    length: 17,
    convRule: rule13
  }, {
    start: 65930,
    length: 2,
    convRule: rule17
  }, {
    start: 65932,
    length: 3,
    convRule: rule13
  }, {
    start: 65936,
    length: 13,
    convRule: rule13
  }, {
    start: 65952,
    length: 1,
    convRule: rule13
  }, {
    start: 66e3,
    length: 45,
    convRule: rule13
  }, {
    start: 66045,
    length: 1,
    convRule: rule92
  }, {
    start: 66176,
    length: 29,
    convRule: rule14
  }, {
    start: 66208,
    length: 49,
    convRule: rule14
  }, {
    start: 66272,
    length: 1,
    convRule: rule92
  }, {
    start: 66273,
    length: 27,
    convRule: rule17
  }, {
    start: 66304,
    length: 32,
    convRule: rule14
  }, {
    start: 66336,
    length: 4,
    convRule: rule17
  }, {
    start: 66349,
    length: 20,
    convRule: rule14
  }, {
    start: 66369,
    length: 1,
    convRule: rule128
  }, {
    start: 66370,
    length: 8,
    convRule: rule14
  }, {
    start: 66378,
    length: 1,
    convRule: rule128
  }, {
    start: 66384,
    length: 38,
    convRule: rule14
  }, {
    start: 66422,
    length: 5,
    convRule: rule92
  }, {
    start: 66432,
    length: 30,
    convRule: rule14
  }, {
    start: 66463,
    length: 1,
    convRule: rule2
  }, {
    start: 66464,
    length: 36,
    convRule: rule14
  }, {
    start: 66504,
    length: 8,
    convRule: rule14
  }, {
    start: 66512,
    length: 1,
    convRule: rule2
  }, {
    start: 66513,
    length: 5,
    convRule: rule128
  }, {
    start: 66560,
    length: 40,
    convRule: rule201
  }, {
    start: 66600,
    length: 40,
    convRule: rule202
  }, {
    start: 66640,
    length: 78,
    convRule: rule14
  }, {
    start: 66720,
    length: 10,
    convRule: rule8
  }, {
    start: 66736,
    length: 36,
    convRule: rule201
  }, {
    start: 66776,
    length: 36,
    convRule: rule202
  }, {
    start: 66816,
    length: 40,
    convRule: rule14
  }, {
    start: 66864,
    length: 52,
    convRule: rule14
  }, {
    start: 66927,
    length: 1,
    convRule: rule2
  }, {
    start: 67072,
    length: 311,
    convRule: rule14
  }, {
    start: 67392,
    length: 22,
    convRule: rule14
  }, {
    start: 67424,
    length: 8,
    convRule: rule14
  }, {
    start: 67584,
    length: 6,
    convRule: rule14
  }, {
    start: 67592,
    length: 1,
    convRule: rule14
  }, {
    start: 67594,
    length: 44,
    convRule: rule14
  }, {
    start: 67639,
    length: 2,
    convRule: rule14
  }, {
    start: 67644,
    length: 1,
    convRule: rule14
  }, {
    start: 67647,
    length: 23,
    convRule: rule14
  }, {
    start: 67671,
    length: 1,
    convRule: rule2
  }, {
    start: 67672,
    length: 8,
    convRule: rule17
  }, {
    start: 67680,
    length: 23,
    convRule: rule14
  }, {
    start: 67703,
    length: 2,
    convRule: rule13
  }, {
    start: 67705,
    length: 7,
    convRule: rule17
  }, {
    start: 67712,
    length: 31,
    convRule: rule14
  }, {
    start: 67751,
    length: 9,
    convRule: rule17
  }, {
    start: 67808,
    length: 19,
    convRule: rule14
  }, {
    start: 67828,
    length: 2,
    convRule: rule14
  }, {
    start: 67835,
    length: 5,
    convRule: rule17
  }, {
    start: 67840,
    length: 22,
    convRule: rule14
  }, {
    start: 67862,
    length: 6,
    convRule: rule17
  }, {
    start: 67871,
    length: 1,
    convRule: rule2
  }, {
    start: 67872,
    length: 26,
    convRule: rule14
  }, {
    start: 67903,
    length: 1,
    convRule: rule2
  }, {
    start: 67968,
    length: 56,
    convRule: rule14
  }, {
    start: 68028,
    length: 2,
    convRule: rule17
  }, {
    start: 68030,
    length: 2,
    convRule: rule14
  }, {
    start: 68032,
    length: 16,
    convRule: rule17
  }, {
    start: 68050,
    length: 46,
    convRule: rule17
  }, {
    start: 68096,
    length: 1,
    convRule: rule14
  }, {
    start: 68097,
    length: 3,
    convRule: rule92
  }, {
    start: 68101,
    length: 2,
    convRule: rule92
  }, {
    start: 68108,
    length: 4,
    convRule: rule92
  }, {
    start: 68112,
    length: 4,
    convRule: rule14
  }, {
    start: 68117,
    length: 3,
    convRule: rule14
  }, {
    start: 68121,
    length: 29,
    convRule: rule14
  }, {
    start: 68152,
    length: 3,
    convRule: rule92
  }, {
    start: 68159,
    length: 1,
    convRule: rule92
  }, {
    start: 68160,
    length: 9,
    convRule: rule17
  }, {
    start: 68176,
    length: 9,
    convRule: rule2
  }, {
    start: 68192,
    length: 29,
    convRule: rule14
  }, {
    start: 68221,
    length: 2,
    convRule: rule17
  }, {
    start: 68223,
    length: 1,
    convRule: rule2
  }, {
    start: 68224,
    length: 29,
    convRule: rule14
  }, {
    start: 68253,
    length: 3,
    convRule: rule17
  }, {
    start: 68288,
    length: 8,
    convRule: rule14
  }, {
    start: 68296,
    length: 1,
    convRule: rule13
  }, {
    start: 68297,
    length: 28,
    convRule: rule14
  }, {
    start: 68325,
    length: 2,
    convRule: rule92
  }, {
    start: 68331,
    length: 5,
    convRule: rule17
  }, {
    start: 68336,
    length: 7,
    convRule: rule2
  }, {
    start: 68352,
    length: 54,
    convRule: rule14
  }, {
    start: 68409,
    length: 7,
    convRule: rule2
  }, {
    start: 68416,
    length: 22,
    convRule: rule14
  }, {
    start: 68440,
    length: 8,
    convRule: rule17
  }, {
    start: 68448,
    length: 19,
    convRule: rule14
  }, {
    start: 68472,
    length: 8,
    convRule: rule17
  }, {
    start: 68480,
    length: 18,
    convRule: rule14
  }, {
    start: 68505,
    length: 4,
    convRule: rule2
  }, {
    start: 68521,
    length: 7,
    convRule: rule17
  }, {
    start: 68608,
    length: 73,
    convRule: rule14
  }, {
    start: 68736,
    length: 51,
    convRule: rule97
  }, {
    start: 68800,
    length: 51,
    convRule: rule102
  }, {
    start: 68858,
    length: 6,
    convRule: rule17
  }, {
    start: 68864,
    length: 36,
    convRule: rule14
  }, {
    start: 68900,
    length: 4,
    convRule: rule92
  }, {
    start: 68912,
    length: 10,
    convRule: rule8
  }, {
    start: 69216,
    length: 31,
    convRule: rule17
  }, {
    start: 69248,
    length: 42,
    convRule: rule14
  }, {
    start: 69291,
    length: 2,
    convRule: rule92
  }, {
    start: 69293,
    length: 1,
    convRule: rule7
  }, {
    start: 69296,
    length: 2,
    convRule: rule14
  }, {
    start: 69376,
    length: 29,
    convRule: rule14
  }, {
    start: 69405,
    length: 10,
    convRule: rule17
  }, {
    start: 69415,
    length: 1,
    convRule: rule14
  }, {
    start: 69424,
    length: 22,
    convRule: rule14
  }, {
    start: 69446,
    length: 11,
    convRule: rule92
  }, {
    start: 69457,
    length: 4,
    convRule: rule17
  }, {
    start: 69461,
    length: 5,
    convRule: rule2
  }, {
    start: 69552,
    length: 21,
    convRule: rule14
  }, {
    start: 69573,
    length: 7,
    convRule: rule17
  }, {
    start: 69600,
    length: 23,
    convRule: rule14
  }, {
    start: 69632,
    length: 1,
    convRule: rule124
  }, {
    start: 69633,
    length: 1,
    convRule: rule92
  }, {
    start: 69634,
    length: 1,
    convRule: rule124
  }, {
    start: 69635,
    length: 53,
    convRule: rule14
  }, {
    start: 69688,
    length: 15,
    convRule: rule92
  }, {
    start: 69703,
    length: 7,
    convRule: rule2
  }, {
    start: 69714,
    length: 20,
    convRule: rule17
  }, {
    start: 69734,
    length: 10,
    convRule: rule8
  }, {
    start: 69759,
    length: 3,
    convRule: rule92
  }, {
    start: 69762,
    length: 1,
    convRule: rule124
  }, {
    start: 69763,
    length: 45,
    convRule: rule14
  }, {
    start: 69808,
    length: 3,
    convRule: rule124
  }, {
    start: 69811,
    length: 4,
    convRule: rule92
  }, {
    start: 69815,
    length: 2,
    convRule: rule124
  }, {
    start: 69817,
    length: 2,
    convRule: rule92
  }, {
    start: 69819,
    length: 2,
    convRule: rule2
  }, {
    start: 69821,
    length: 1,
    convRule: rule16
  }, {
    start: 69822,
    length: 4,
    convRule: rule2
  }, {
    start: 69837,
    length: 1,
    convRule: rule16
  }, {
    start: 69840,
    length: 25,
    convRule: rule14
  }, {
    start: 69872,
    length: 10,
    convRule: rule8
  }, {
    start: 69888,
    length: 3,
    convRule: rule92
  }, {
    start: 69891,
    length: 36,
    convRule: rule14
  }, {
    start: 69927,
    length: 5,
    convRule: rule92
  }, {
    start: 69932,
    length: 1,
    convRule: rule124
  }, {
    start: 69933,
    length: 8,
    convRule: rule92
  }, {
    start: 69942,
    length: 10,
    convRule: rule8
  }, {
    start: 69952,
    length: 4,
    convRule: rule2
  }, {
    start: 69956,
    length: 1,
    convRule: rule14
  }, {
    start: 69957,
    length: 2,
    convRule: rule124
  }, {
    start: 69959,
    length: 1,
    convRule: rule14
  }, {
    start: 69968,
    length: 35,
    convRule: rule14
  }, {
    start: 70003,
    length: 1,
    convRule: rule92
  }, {
    start: 70004,
    length: 2,
    convRule: rule2
  }, {
    start: 70006,
    length: 1,
    convRule: rule14
  }, {
    start: 70016,
    length: 2,
    convRule: rule92
  }, {
    start: 70018,
    length: 1,
    convRule: rule124
  }, {
    start: 70019,
    length: 48,
    convRule: rule14
  }, {
    start: 70067,
    length: 3,
    convRule: rule124
  }, {
    start: 70070,
    length: 9,
    convRule: rule92
  }, {
    start: 70079,
    length: 2,
    convRule: rule124
  }, {
    start: 70081,
    length: 4,
    convRule: rule14
  }, {
    start: 70085,
    length: 4,
    convRule: rule2
  }, {
    start: 70089,
    length: 4,
    convRule: rule92
  }, {
    start: 70093,
    length: 1,
    convRule: rule2
  }, {
    start: 70094,
    length: 1,
    convRule: rule124
  }, {
    start: 70095,
    length: 1,
    convRule: rule92
  }, {
    start: 70096,
    length: 10,
    convRule: rule8
  }, {
    start: 70106,
    length: 1,
    convRule: rule14
  }, {
    start: 70107,
    length: 1,
    convRule: rule2
  }, {
    start: 70108,
    length: 1,
    convRule: rule14
  }, {
    start: 70109,
    length: 3,
    convRule: rule2
  }, {
    start: 70113,
    length: 20,
    convRule: rule17
  }, {
    start: 70144,
    length: 18,
    convRule: rule14
  }, {
    start: 70163,
    length: 25,
    convRule: rule14
  }, {
    start: 70188,
    length: 3,
    convRule: rule124
  }, {
    start: 70191,
    length: 3,
    convRule: rule92
  }, {
    start: 70194,
    length: 2,
    convRule: rule124
  }, {
    start: 70196,
    length: 1,
    convRule: rule92
  }, {
    start: 70197,
    length: 1,
    convRule: rule124
  }, {
    start: 70198,
    length: 2,
    convRule: rule92
  }, {
    start: 70200,
    length: 6,
    convRule: rule2
  }, {
    start: 70206,
    length: 1,
    convRule: rule92
  }, {
    start: 70272,
    length: 7,
    convRule: rule14
  }, {
    start: 70280,
    length: 1,
    convRule: rule14
  }, {
    start: 70282,
    length: 4,
    convRule: rule14
  }, {
    start: 70287,
    length: 15,
    convRule: rule14
  }, {
    start: 70303,
    length: 10,
    convRule: rule14
  }, {
    start: 70313,
    length: 1,
    convRule: rule2
  }, {
    start: 70320,
    length: 47,
    convRule: rule14
  }, {
    start: 70367,
    length: 1,
    convRule: rule92
  }, {
    start: 70368,
    length: 3,
    convRule: rule124
  }, {
    start: 70371,
    length: 8,
    convRule: rule92
  }, {
    start: 70384,
    length: 10,
    convRule: rule8
  }, {
    start: 70400,
    length: 2,
    convRule: rule92
  }, {
    start: 70402,
    length: 2,
    convRule: rule124
  }, {
    start: 70405,
    length: 8,
    convRule: rule14
  }, {
    start: 70415,
    length: 2,
    convRule: rule14
  }, {
    start: 70419,
    length: 22,
    convRule: rule14
  }, {
    start: 70442,
    length: 7,
    convRule: rule14
  }, {
    start: 70450,
    length: 2,
    convRule: rule14
  }, {
    start: 70453,
    length: 5,
    convRule: rule14
  }, {
    start: 70459,
    length: 2,
    convRule: rule92
  }, {
    start: 70461,
    length: 1,
    convRule: rule14
  }, {
    start: 70462,
    length: 2,
    convRule: rule124
  }, {
    start: 70464,
    length: 1,
    convRule: rule92
  }, {
    start: 70465,
    length: 4,
    convRule: rule124
  }, {
    start: 70471,
    length: 2,
    convRule: rule124
  }, {
    start: 70475,
    length: 3,
    convRule: rule124
  }, {
    start: 70480,
    length: 1,
    convRule: rule14
  }, {
    start: 70487,
    length: 1,
    convRule: rule124
  }, {
    start: 70493,
    length: 5,
    convRule: rule14
  }, {
    start: 70498,
    length: 2,
    convRule: rule124
  }, {
    start: 70502,
    length: 7,
    convRule: rule92
  }, {
    start: 70512,
    length: 5,
    convRule: rule92
  }, {
    start: 70656,
    length: 53,
    convRule: rule14
  }, {
    start: 70709,
    length: 3,
    convRule: rule124
  }, {
    start: 70712,
    length: 8,
    convRule: rule92
  }, {
    start: 70720,
    length: 2,
    convRule: rule124
  }, {
    start: 70722,
    length: 3,
    convRule: rule92
  }, {
    start: 70725,
    length: 1,
    convRule: rule124
  }, {
    start: 70726,
    length: 1,
    convRule: rule92
  }, {
    start: 70727,
    length: 4,
    convRule: rule14
  }, {
    start: 70731,
    length: 5,
    convRule: rule2
  }, {
    start: 70736,
    length: 10,
    convRule: rule8
  }, {
    start: 70746,
    length: 2,
    convRule: rule2
  }, {
    start: 70749,
    length: 1,
    convRule: rule2
  }, {
    start: 70750,
    length: 1,
    convRule: rule92
  }, {
    start: 70751,
    length: 3,
    convRule: rule14
  }, {
    start: 70784,
    length: 48,
    convRule: rule14
  }, {
    start: 70832,
    length: 3,
    convRule: rule124
  }, {
    start: 70835,
    length: 6,
    convRule: rule92
  }, {
    start: 70841,
    length: 1,
    convRule: rule124
  }, {
    start: 70842,
    length: 1,
    convRule: rule92
  }, {
    start: 70843,
    length: 4,
    convRule: rule124
  }, {
    start: 70847,
    length: 2,
    convRule: rule92
  }, {
    start: 70849,
    length: 1,
    convRule: rule124
  }, {
    start: 70850,
    length: 2,
    convRule: rule92
  }, {
    start: 70852,
    length: 2,
    convRule: rule14
  }, {
    start: 70854,
    length: 1,
    convRule: rule2
  }, {
    start: 70855,
    length: 1,
    convRule: rule14
  }, {
    start: 70864,
    length: 10,
    convRule: rule8
  }, {
    start: 71040,
    length: 47,
    convRule: rule14
  }, {
    start: 71087,
    length: 3,
    convRule: rule124
  }, {
    start: 71090,
    length: 4,
    convRule: rule92
  }, {
    start: 71096,
    length: 4,
    convRule: rule124
  }, {
    start: 71100,
    length: 2,
    convRule: rule92
  }, {
    start: 71102,
    length: 1,
    convRule: rule124
  }, {
    start: 71103,
    length: 2,
    convRule: rule92
  }, {
    start: 71105,
    length: 23,
    convRule: rule2
  }, {
    start: 71128,
    length: 4,
    convRule: rule14
  }, {
    start: 71132,
    length: 2,
    convRule: rule92
  }, {
    start: 71168,
    length: 48,
    convRule: rule14
  }, {
    start: 71216,
    length: 3,
    convRule: rule124
  }, {
    start: 71219,
    length: 8,
    convRule: rule92
  }, {
    start: 71227,
    length: 2,
    convRule: rule124
  }, {
    start: 71229,
    length: 1,
    convRule: rule92
  }, {
    start: 71230,
    length: 1,
    convRule: rule124
  }, {
    start: 71231,
    length: 2,
    convRule: rule92
  }, {
    start: 71233,
    length: 3,
    convRule: rule2
  }, {
    start: 71236,
    length: 1,
    convRule: rule14
  }, {
    start: 71248,
    length: 10,
    convRule: rule8
  }, {
    start: 71264,
    length: 13,
    convRule: rule2
  }, {
    start: 71296,
    length: 43,
    convRule: rule14
  }, {
    start: 71339,
    length: 1,
    convRule: rule92
  }, {
    start: 71340,
    length: 1,
    convRule: rule124
  }, {
    start: 71341,
    length: 1,
    convRule: rule92
  }, {
    start: 71342,
    length: 2,
    convRule: rule124
  }, {
    start: 71344,
    length: 6,
    convRule: rule92
  }, {
    start: 71350,
    length: 1,
    convRule: rule124
  }, {
    start: 71351,
    length: 1,
    convRule: rule92
  }, {
    start: 71352,
    length: 1,
    convRule: rule14
  }, {
    start: 71360,
    length: 10,
    convRule: rule8
  }, {
    start: 71424,
    length: 27,
    convRule: rule14
  }, {
    start: 71453,
    length: 3,
    convRule: rule92
  }, {
    start: 71456,
    length: 2,
    convRule: rule124
  }, {
    start: 71458,
    length: 4,
    convRule: rule92
  }, {
    start: 71462,
    length: 1,
    convRule: rule124
  }, {
    start: 71463,
    length: 5,
    convRule: rule92
  }, {
    start: 71472,
    length: 10,
    convRule: rule8
  }, {
    start: 71482,
    length: 2,
    convRule: rule17
  }, {
    start: 71484,
    length: 3,
    convRule: rule2
  }, {
    start: 71487,
    length: 1,
    convRule: rule13
  }, {
    start: 71680,
    length: 44,
    convRule: rule14
  }, {
    start: 71724,
    length: 3,
    convRule: rule124
  }, {
    start: 71727,
    length: 9,
    convRule: rule92
  }, {
    start: 71736,
    length: 1,
    convRule: rule124
  }, {
    start: 71737,
    length: 2,
    convRule: rule92
  }, {
    start: 71739,
    length: 1,
    convRule: rule2
  }, {
    start: 71840,
    length: 32,
    convRule: rule9
  }, {
    start: 71872,
    length: 32,
    convRule: rule12
  }, {
    start: 71904,
    length: 10,
    convRule: rule8
  }, {
    start: 71914,
    length: 9,
    convRule: rule17
  }, {
    start: 71935,
    length: 8,
    convRule: rule14
  }, {
    start: 71945,
    length: 1,
    convRule: rule14
  }, {
    start: 71948,
    length: 8,
    convRule: rule14
  }, {
    start: 71957,
    length: 2,
    convRule: rule14
  }, {
    start: 71960,
    length: 24,
    convRule: rule14
  }, {
    start: 71984,
    length: 6,
    convRule: rule124
  }, {
    start: 71991,
    length: 2,
    convRule: rule124
  }, {
    start: 71995,
    length: 2,
    convRule: rule92
  }, {
    start: 71997,
    length: 1,
    convRule: rule124
  }, {
    start: 71998,
    length: 1,
    convRule: rule92
  }, {
    start: 71999,
    length: 1,
    convRule: rule14
  }, {
    start: 72e3,
    length: 1,
    convRule: rule124
  }, {
    start: 72001,
    length: 1,
    convRule: rule14
  }, {
    start: 72002,
    length: 1,
    convRule: rule124
  }, {
    start: 72003,
    length: 1,
    convRule: rule92
  }, {
    start: 72004,
    length: 3,
    convRule: rule2
  }, {
    start: 72016,
    length: 10,
    convRule: rule8
  }, {
    start: 72096,
    length: 8,
    convRule: rule14
  }, {
    start: 72106,
    length: 39,
    convRule: rule14
  }, {
    start: 72145,
    length: 3,
    convRule: rule124
  }, {
    start: 72148,
    length: 4,
    convRule: rule92
  }, {
    start: 72154,
    length: 2,
    convRule: rule92
  }, {
    start: 72156,
    length: 4,
    convRule: rule124
  }, {
    start: 72160,
    length: 1,
    convRule: rule92
  }, {
    start: 72161,
    length: 1,
    convRule: rule14
  }, {
    start: 72162,
    length: 1,
    convRule: rule2
  }, {
    start: 72163,
    length: 1,
    convRule: rule14
  }, {
    start: 72164,
    length: 1,
    convRule: rule124
  }, {
    start: 72192,
    length: 1,
    convRule: rule14
  }, {
    start: 72193,
    length: 10,
    convRule: rule92
  }, {
    start: 72203,
    length: 40,
    convRule: rule14
  }, {
    start: 72243,
    length: 6,
    convRule: rule92
  }, {
    start: 72249,
    length: 1,
    convRule: rule124
  }, {
    start: 72250,
    length: 1,
    convRule: rule14
  }, {
    start: 72251,
    length: 4,
    convRule: rule92
  }, {
    start: 72255,
    length: 8,
    convRule: rule2
  }, {
    start: 72263,
    length: 1,
    convRule: rule92
  }, {
    start: 72272,
    length: 1,
    convRule: rule14
  }, {
    start: 72273,
    length: 6,
    convRule: rule92
  }, {
    start: 72279,
    length: 2,
    convRule: rule124
  }, {
    start: 72281,
    length: 3,
    convRule: rule92
  }, {
    start: 72284,
    length: 46,
    convRule: rule14
  }, {
    start: 72330,
    length: 13,
    convRule: rule92
  }, {
    start: 72343,
    length: 1,
    convRule: rule124
  }, {
    start: 72344,
    length: 2,
    convRule: rule92
  }, {
    start: 72346,
    length: 3,
    convRule: rule2
  }, {
    start: 72349,
    length: 1,
    convRule: rule14
  }, {
    start: 72350,
    length: 5,
    convRule: rule2
  }, {
    start: 72384,
    length: 57,
    convRule: rule14
  }, {
    start: 72704,
    length: 9,
    convRule: rule14
  }, {
    start: 72714,
    length: 37,
    convRule: rule14
  }, {
    start: 72751,
    length: 1,
    convRule: rule124
  }, {
    start: 72752,
    length: 7,
    convRule: rule92
  }, {
    start: 72760,
    length: 6,
    convRule: rule92
  }, {
    start: 72766,
    length: 1,
    convRule: rule124
  }, {
    start: 72767,
    length: 1,
    convRule: rule92
  }, {
    start: 72768,
    length: 1,
    convRule: rule14
  }, {
    start: 72769,
    length: 5,
    convRule: rule2
  }, {
    start: 72784,
    length: 10,
    convRule: rule8
  }, {
    start: 72794,
    length: 19,
    convRule: rule17
  }, {
    start: 72816,
    length: 2,
    convRule: rule2
  }, {
    start: 72818,
    length: 30,
    convRule: rule14
  }, {
    start: 72850,
    length: 22,
    convRule: rule92
  }, {
    start: 72873,
    length: 1,
    convRule: rule124
  }, {
    start: 72874,
    length: 7,
    convRule: rule92
  }, {
    start: 72881,
    length: 1,
    convRule: rule124
  }, {
    start: 72882,
    length: 2,
    convRule: rule92
  }, {
    start: 72884,
    length: 1,
    convRule: rule124
  }, {
    start: 72885,
    length: 2,
    convRule: rule92
  }, {
    start: 72960,
    length: 7,
    convRule: rule14
  }, {
    start: 72968,
    length: 2,
    convRule: rule14
  }, {
    start: 72971,
    length: 38,
    convRule: rule14
  }, {
    start: 73009,
    length: 6,
    convRule: rule92
  }, {
    start: 73018,
    length: 1,
    convRule: rule92
  }, {
    start: 73020,
    length: 2,
    convRule: rule92
  }, {
    start: 73023,
    length: 7,
    convRule: rule92
  }, {
    start: 73030,
    length: 1,
    convRule: rule14
  }, {
    start: 73031,
    length: 1,
    convRule: rule92
  }, {
    start: 73040,
    length: 10,
    convRule: rule8
  }, {
    start: 73056,
    length: 6,
    convRule: rule14
  }, {
    start: 73063,
    length: 2,
    convRule: rule14
  }, {
    start: 73066,
    length: 32,
    convRule: rule14
  }, {
    start: 73098,
    length: 5,
    convRule: rule124
  }, {
    start: 73104,
    length: 2,
    convRule: rule92
  }, {
    start: 73107,
    length: 2,
    convRule: rule124
  }, {
    start: 73109,
    length: 1,
    convRule: rule92
  }, {
    start: 73110,
    length: 1,
    convRule: rule124
  }, {
    start: 73111,
    length: 1,
    convRule: rule92
  }, {
    start: 73112,
    length: 1,
    convRule: rule14
  }, {
    start: 73120,
    length: 10,
    convRule: rule8
  }, {
    start: 73440,
    length: 19,
    convRule: rule14
  }, {
    start: 73459,
    length: 2,
    convRule: rule92
  }, {
    start: 73461,
    length: 2,
    convRule: rule124
  }, {
    start: 73463,
    length: 2,
    convRule: rule2
  }, {
    start: 73648,
    length: 1,
    convRule: rule14
  }, {
    start: 73664,
    length: 21,
    convRule: rule17
  }, {
    start: 73685,
    length: 8,
    convRule: rule13
  }, {
    start: 73693,
    length: 4,
    convRule: rule3
  }, {
    start: 73697,
    length: 17,
    convRule: rule13
  }, {
    start: 73727,
    length: 1,
    convRule: rule2
  }, {
    start: 73728,
    length: 922,
    convRule: rule14
  }, {
    start: 74752,
    length: 111,
    convRule: rule128
  }, {
    start: 74864,
    length: 5,
    convRule: rule2
  }, {
    start: 74880,
    length: 196,
    convRule: rule14
  }, {
    start: 77824,
    length: 1071,
    convRule: rule14
  }, {
    start: 78896,
    length: 9,
    convRule: rule16
  }, {
    start: 82944,
    length: 583,
    convRule: rule14
  }, {
    start: 92160,
    length: 569,
    convRule: rule14
  }, {
    start: 92736,
    length: 31,
    convRule: rule14
  }, {
    start: 92768,
    length: 10,
    convRule: rule8
  }, {
    start: 92782,
    length: 2,
    convRule: rule2
  }, {
    start: 92880,
    length: 30,
    convRule: rule14
  }, {
    start: 92912,
    length: 5,
    convRule: rule92
  }, {
    start: 92917,
    length: 1,
    convRule: rule2
  }, {
    start: 92928,
    length: 48,
    convRule: rule14
  }, {
    start: 92976,
    length: 7,
    convRule: rule92
  }, {
    start: 92983,
    length: 5,
    convRule: rule2
  }, {
    start: 92988,
    length: 4,
    convRule: rule13
  }, {
    start: 92992,
    length: 4,
    convRule: rule91
  }, {
    start: 92996,
    length: 1,
    convRule: rule2
  }, {
    start: 92997,
    length: 1,
    convRule: rule13
  }, {
    start: 93008,
    length: 10,
    convRule: rule8
  }, {
    start: 93019,
    length: 7,
    convRule: rule17
  }, {
    start: 93027,
    length: 21,
    convRule: rule14
  }, {
    start: 93053,
    length: 19,
    convRule: rule14
  }, {
    start: 93760,
    length: 32,
    convRule: rule9
  }, {
    start: 93792,
    length: 32,
    convRule: rule12
  }, {
    start: 93824,
    length: 23,
    convRule: rule17
  }, {
    start: 93847,
    length: 4,
    convRule: rule2
  }, {
    start: 93952,
    length: 75,
    convRule: rule14
  }, {
    start: 94031,
    length: 1,
    convRule: rule92
  }, {
    start: 94032,
    length: 1,
    convRule: rule14
  }, {
    start: 94033,
    length: 55,
    convRule: rule124
  }, {
    start: 94095,
    length: 4,
    convRule: rule92
  }, {
    start: 94099,
    length: 13,
    convRule: rule91
  }, {
    start: 94176,
    length: 2,
    convRule: rule91
  }, {
    start: 94178,
    length: 1,
    convRule: rule2
  }, {
    start: 94179,
    length: 1,
    convRule: rule91
  }, {
    start: 94180,
    length: 1,
    convRule: rule92
  }, {
    start: 94192,
    length: 2,
    convRule: rule124
  }, {
    start: 94208,
    length: 6136,
    convRule: rule14
  }, {
    start: 100352,
    length: 1238,
    convRule: rule14
  }, {
    start: 101632,
    length: 9,
    convRule: rule14
  }, {
    start: 110592,
    length: 287,
    convRule: rule14
  }, {
    start: 110928,
    length: 3,
    convRule: rule14
  }, {
    start: 110948,
    length: 4,
    convRule: rule14
  }, {
    start: 110960,
    length: 396,
    convRule: rule14
  }, {
    start: 113664,
    length: 107,
    convRule: rule14
  }, {
    start: 113776,
    length: 13,
    convRule: rule14
  }, {
    start: 113792,
    length: 9,
    convRule: rule14
  }, {
    start: 113808,
    length: 10,
    convRule: rule14
  }, {
    start: 113820,
    length: 1,
    convRule: rule13
  }, {
    start: 113821,
    length: 2,
    convRule: rule92
  }, {
    start: 113823,
    length: 1,
    convRule: rule2
  }, {
    start: 113824,
    length: 4,
    convRule: rule16
  }, {
    start: 118784,
    length: 246,
    convRule: rule13
  }, {
    start: 119040,
    length: 39,
    convRule: rule13
  }, {
    start: 119081,
    length: 60,
    convRule: rule13
  }, {
    start: 119141,
    length: 2,
    convRule: rule124
  }, {
    start: 119143,
    length: 3,
    convRule: rule92
  }, {
    start: 119146,
    length: 3,
    convRule: rule13
  }, {
    start: 119149,
    length: 6,
    convRule: rule124
  }, {
    start: 119155,
    length: 8,
    convRule: rule16
  }, {
    start: 119163,
    length: 8,
    convRule: rule92
  }, {
    start: 119171,
    length: 2,
    convRule: rule13
  }, {
    start: 119173,
    length: 7,
    convRule: rule92
  }, {
    start: 119180,
    length: 30,
    convRule: rule13
  }, {
    start: 119210,
    length: 4,
    convRule: rule92
  }, {
    start: 119214,
    length: 59,
    convRule: rule13
  }, {
    start: 119296,
    length: 66,
    convRule: rule13
  }, {
    start: 119362,
    length: 3,
    convRule: rule92
  }, {
    start: 119365,
    length: 1,
    convRule: rule13
  }, {
    start: 119520,
    length: 20,
    convRule: rule17
  }, {
    start: 119552,
    length: 87,
    convRule: rule13
  }, {
    start: 119648,
    length: 25,
    convRule: rule17
  }, {
    start: 119808,
    length: 26,
    convRule: rule107
  }, {
    start: 119834,
    length: 26,
    convRule: rule20
  }, {
    start: 119860,
    length: 26,
    convRule: rule107
  }, {
    start: 119886,
    length: 7,
    convRule: rule20
  }, {
    start: 119894,
    length: 18,
    convRule: rule20
  }, {
    start: 119912,
    length: 26,
    convRule: rule107
  }, {
    start: 119938,
    length: 26,
    convRule: rule20
  }, {
    start: 119964,
    length: 1,
    convRule: rule107
  }, {
    start: 119966,
    length: 2,
    convRule: rule107
  }, {
    start: 119970,
    length: 1,
    convRule: rule107
  }, {
    start: 119973,
    length: 2,
    convRule: rule107
  }, {
    start: 119977,
    length: 4,
    convRule: rule107
  }, {
    start: 119982,
    length: 8,
    convRule: rule107
  }, {
    start: 119990,
    length: 4,
    convRule: rule20
  }, {
    start: 119995,
    length: 1,
    convRule: rule20
  }, {
    start: 119997,
    length: 7,
    convRule: rule20
  }, {
    start: 120005,
    length: 11,
    convRule: rule20
  }, {
    start: 120016,
    length: 26,
    convRule: rule107
  }, {
    start: 120042,
    length: 26,
    convRule: rule20
  }, {
    start: 120068,
    length: 2,
    convRule: rule107
  }, {
    start: 120071,
    length: 4,
    convRule: rule107
  }, {
    start: 120077,
    length: 8,
    convRule: rule107
  }, {
    start: 120086,
    length: 7,
    convRule: rule107
  }, {
    start: 120094,
    length: 26,
    convRule: rule20
  }, {
    start: 120120,
    length: 2,
    convRule: rule107
  }, {
    start: 120123,
    length: 4,
    convRule: rule107
  }, {
    start: 120128,
    length: 5,
    convRule: rule107
  }, {
    start: 120134,
    length: 1,
    convRule: rule107
  }, {
    start: 120138,
    length: 7,
    convRule: rule107
  }, {
    start: 120146,
    length: 26,
    convRule: rule20
  }, {
    start: 120172,
    length: 26,
    convRule: rule107
  }, {
    start: 120198,
    length: 26,
    convRule: rule20
  }, {
    start: 120224,
    length: 26,
    convRule: rule107
  }, {
    start: 120250,
    length: 26,
    convRule: rule20
  }, {
    start: 120276,
    length: 26,
    convRule: rule107
  }, {
    start: 120302,
    length: 26,
    convRule: rule20
  }, {
    start: 120328,
    length: 26,
    convRule: rule107
  }, {
    start: 120354,
    length: 26,
    convRule: rule20
  }, {
    start: 120380,
    length: 26,
    convRule: rule107
  }, {
    start: 120406,
    length: 26,
    convRule: rule20
  }, {
    start: 120432,
    length: 26,
    convRule: rule107
  }, {
    start: 120458,
    length: 28,
    convRule: rule20
  }, {
    start: 120488,
    length: 25,
    convRule: rule107
  }, {
    start: 120513,
    length: 1,
    convRule: rule6
  }, {
    start: 120514,
    length: 25,
    convRule: rule20
  }, {
    start: 120539,
    length: 1,
    convRule: rule6
  }, {
    start: 120540,
    length: 6,
    convRule: rule20
  }, {
    start: 120546,
    length: 25,
    convRule: rule107
  }, {
    start: 120571,
    length: 1,
    convRule: rule6
  }, {
    start: 120572,
    length: 25,
    convRule: rule20
  }, {
    start: 120597,
    length: 1,
    convRule: rule6
  }, {
    start: 120598,
    length: 6,
    convRule: rule20
  }, {
    start: 120604,
    length: 25,
    convRule: rule107
  }, {
    start: 120629,
    length: 1,
    convRule: rule6
  }, {
    start: 120630,
    length: 25,
    convRule: rule20
  }, {
    start: 120655,
    length: 1,
    convRule: rule6
  }, {
    start: 120656,
    length: 6,
    convRule: rule20
  }, {
    start: 120662,
    length: 25,
    convRule: rule107
  }, {
    start: 120687,
    length: 1,
    convRule: rule6
  }, {
    start: 120688,
    length: 25,
    convRule: rule20
  }, {
    start: 120713,
    length: 1,
    convRule: rule6
  }, {
    start: 120714,
    length: 6,
    convRule: rule20
  }, {
    start: 120720,
    length: 25,
    convRule: rule107
  }, {
    start: 120745,
    length: 1,
    convRule: rule6
  }, {
    start: 120746,
    length: 25,
    convRule: rule20
  }, {
    start: 120771,
    length: 1,
    convRule: rule6
  }, {
    start: 120772,
    length: 6,
    convRule: rule20
  }, {
    start: 120778,
    length: 1,
    convRule: rule107
  }, {
    start: 120779,
    length: 1,
    convRule: rule20
  }, {
    start: 120782,
    length: 50,
    convRule: rule8
  }, {
    start: 120832,
    length: 512,
    convRule: rule13
  }, {
    start: 121344,
    length: 55,
    convRule: rule92
  }, {
    start: 121399,
    length: 4,
    convRule: rule13
  }, {
    start: 121403,
    length: 50,
    convRule: rule92
  }, {
    start: 121453,
    length: 8,
    convRule: rule13
  }, {
    start: 121461,
    length: 1,
    convRule: rule92
  }, {
    start: 121462,
    length: 14,
    convRule: rule13
  }, {
    start: 121476,
    length: 1,
    convRule: rule92
  }, {
    start: 121477,
    length: 2,
    convRule: rule13
  }, {
    start: 121479,
    length: 5,
    convRule: rule2
  }, {
    start: 121499,
    length: 5,
    convRule: rule92
  }, {
    start: 121505,
    length: 15,
    convRule: rule92
  }, {
    start: 122880,
    length: 7,
    convRule: rule92
  }, {
    start: 122888,
    length: 17,
    convRule: rule92
  }, {
    start: 122907,
    length: 7,
    convRule: rule92
  }, {
    start: 122915,
    length: 2,
    convRule: rule92
  }, {
    start: 122918,
    length: 5,
    convRule: rule92
  }, {
    start: 123136,
    length: 45,
    convRule: rule14
  }, {
    start: 123184,
    length: 7,
    convRule: rule92
  }, {
    start: 123191,
    length: 7,
    convRule: rule91
  }, {
    start: 123200,
    length: 10,
    convRule: rule8
  }, {
    start: 123214,
    length: 1,
    convRule: rule14
  }, {
    start: 123215,
    length: 1,
    convRule: rule13
  }, {
    start: 123584,
    length: 44,
    convRule: rule14
  }, {
    start: 123628,
    length: 4,
    convRule: rule92
  }, {
    start: 123632,
    length: 10,
    convRule: rule8
  }, {
    start: 123647,
    length: 1,
    convRule: rule3
  }, {
    start: 124928,
    length: 197,
    convRule: rule14
  }, {
    start: 125127,
    length: 9,
    convRule: rule17
  }, {
    start: 125136,
    length: 7,
    convRule: rule92
  }, {
    start: 125184,
    length: 34,
    convRule: rule203
  }, {
    start: 125218,
    length: 34,
    convRule: rule204
  }, {
    start: 125252,
    length: 7,
    convRule: rule92
  }, {
    start: 125259,
    length: 1,
    convRule: rule91
  }, {
    start: 125264,
    length: 10,
    convRule: rule8
  }, {
    start: 125278,
    length: 2,
    convRule: rule2
  }, {
    start: 126065,
    length: 59,
    convRule: rule17
  }, {
    start: 126124,
    length: 1,
    convRule: rule13
  }, {
    start: 126125,
    length: 3,
    convRule: rule17
  }, {
    start: 126128,
    length: 1,
    convRule: rule3
  }, {
    start: 126129,
    length: 4,
    convRule: rule17
  }, {
    start: 126209,
    length: 45,
    convRule: rule17
  }, {
    start: 126254,
    length: 1,
    convRule: rule13
  }, {
    start: 126255,
    length: 15,
    convRule: rule17
  }, {
    start: 126464,
    length: 4,
    convRule: rule14
  }, {
    start: 126469,
    length: 27,
    convRule: rule14
  }, {
    start: 126497,
    length: 2,
    convRule: rule14
  }, {
    start: 126500,
    length: 1,
    convRule: rule14
  }, {
    start: 126503,
    length: 1,
    convRule: rule14
  }, {
    start: 126505,
    length: 10,
    convRule: rule14
  }, {
    start: 126516,
    length: 4,
    convRule: rule14
  }, {
    start: 126521,
    length: 1,
    convRule: rule14
  }, {
    start: 126523,
    length: 1,
    convRule: rule14
  }, {
    start: 126530,
    length: 1,
    convRule: rule14
  }, {
    start: 126535,
    length: 1,
    convRule: rule14
  }, {
    start: 126537,
    length: 1,
    convRule: rule14
  }, {
    start: 126539,
    length: 1,
    convRule: rule14
  }, {
    start: 126541,
    length: 3,
    convRule: rule14
  }, {
    start: 126545,
    length: 2,
    convRule: rule14
  }, {
    start: 126548,
    length: 1,
    convRule: rule14
  }, {
    start: 126551,
    length: 1,
    convRule: rule14
  }, {
    start: 126553,
    length: 1,
    convRule: rule14
  }, {
    start: 126555,
    length: 1,
    convRule: rule14
  }, {
    start: 126557,
    length: 1,
    convRule: rule14
  }, {
    start: 126559,
    length: 1,
    convRule: rule14
  }, {
    start: 126561,
    length: 2,
    convRule: rule14
  }, {
    start: 126564,
    length: 1,
    convRule: rule14
  }, {
    start: 126567,
    length: 4,
    convRule: rule14
  }, {
    start: 126572,
    length: 7,
    convRule: rule14
  }, {
    start: 126580,
    length: 4,
    convRule: rule14
  }, {
    start: 126585,
    length: 4,
    convRule: rule14
  }, {
    start: 126590,
    length: 1,
    convRule: rule14
  }, {
    start: 126592,
    length: 10,
    convRule: rule14
  }, {
    start: 126603,
    length: 17,
    convRule: rule14
  }, {
    start: 126625,
    length: 3,
    convRule: rule14
  }, {
    start: 126629,
    length: 5,
    convRule: rule14
  }, {
    start: 126635,
    length: 17,
    convRule: rule14
  }, {
    start: 126704,
    length: 2,
    convRule: rule6
  }, {
    start: 126976,
    length: 44,
    convRule: rule13
  }, {
    start: 127024,
    length: 100,
    convRule: rule13
  }, {
    start: 127136,
    length: 15,
    convRule: rule13
  }, {
    start: 127153,
    length: 15,
    convRule: rule13
  }, {
    start: 127169,
    length: 15,
    convRule: rule13
  }, {
    start: 127185,
    length: 37,
    convRule: rule13
  }, {
    start: 127232,
    length: 13,
    convRule: rule17
  }, {
    start: 127245,
    length: 161,
    convRule: rule13
  }, {
    start: 127462,
    length: 29,
    convRule: rule13
  }, {
    start: 127504,
    length: 44,
    convRule: rule13
  }, {
    start: 127552,
    length: 9,
    convRule: rule13
  }, {
    start: 127568,
    length: 2,
    convRule: rule13
  }, {
    start: 127584,
    length: 6,
    convRule: rule13
  }, {
    start: 127744,
    length: 251,
    convRule: rule13
  }, {
    start: 127995,
    length: 5,
    convRule: rule10
  }, {
    start: 128e3,
    length: 728,
    convRule: rule13
  }, {
    start: 128736,
    length: 13,
    convRule: rule13
  }, {
    start: 128752,
    length: 13,
    convRule: rule13
  }, {
    start: 128768,
    length: 116,
    convRule: rule13
  }, {
    start: 128896,
    length: 89,
    convRule: rule13
  }, {
    start: 128992,
    length: 12,
    convRule: rule13
  }, {
    start: 129024,
    length: 12,
    convRule: rule13
  }, {
    start: 129040,
    length: 56,
    convRule: rule13
  }, {
    start: 129104,
    length: 10,
    convRule: rule13
  }, {
    start: 129120,
    length: 40,
    convRule: rule13
  }, {
    start: 129168,
    length: 30,
    convRule: rule13
  }, {
    start: 129200,
    length: 2,
    convRule: rule13
  }, {
    start: 129280,
    length: 121,
    convRule: rule13
  }, {
    start: 129402,
    length: 82,
    convRule: rule13
  }, {
    start: 129485,
    length: 135,
    convRule: rule13
  }, {
    start: 129632,
    length: 14,
    convRule: rule13
  }, {
    start: 129648,
    length: 5,
    convRule: rule13
  }, {
    start: 129656,
    length: 3,
    convRule: rule13
  }, {
    start: 129664,
    length: 7,
    convRule: rule13
  }, {
    start: 129680,
    length: 25,
    convRule: rule13
  }, {
    start: 129712,
    length: 7,
    convRule: rule13
  }, {
    start: 129728,
    length: 3,
    convRule: rule13
  }, {
    start: 129744,
    length: 7,
    convRule: rule13
  }, {
    start: 129792,
    length: 147,
    convRule: rule13
  }, {
    start: 129940,
    length: 55,
    convRule: rule13
  }, {
    start: 130032,
    length: 10,
    convRule: rule8
  }, {
    start: 131072,
    length: 42718,
    convRule: rule14
  }, {
    start: 173824,
    length: 4149,
    convRule: rule14
  }, {
    start: 177984,
    length: 222,
    convRule: rule14
  }, {
    start: 178208,
    length: 5762,
    convRule: rule14
  }, {
    start: 183984,
    length: 7473,
    convRule: rule14
  }, {
    start: 194560,
    length: 542,
    convRule: rule14
  }, {
    start: 196608,
    length: 4939,
    convRule: rule14
  }, {
    start: 917505,
    length: 1,
    convRule: rule16
  }, {
    start: 917536,
    length: 96,
    convRule: rule16
  }, {
    start: 917760,
    length: 240,
    convRule: rule92
  }, {
    start: 983040,
    length: 65534,
    convRule: rule200
  }, {
    start: 1048576,
    length: 65534,
    convRule: rule200
  }];
  var checkAttr = function(categories) {
    return function($$char2) {
      var numOfBlocks = function() {
        var $43 = $$char2 < 256;
        if ($43) {
          return numLat1Blocks;
        }
        ;
        return numBlocks;
      }();
      var maybeConversionRule = getRule(allchars)($$char2)(numOfBlocks);
      if (maybeConversionRule instanceof Nothing) {
        return false;
      }
      ;
      if (maybeConversionRule instanceof Just) {
        return isJust(elemIndex2(maybeConversionRule.value0.category)(categories));
      }
      ;
      throw new Error("Failed pattern match at Data.CodePoint.Unicode.Internal (line 5645, column 5 - line 5647, column 86): " + [maybeConversionRule.constructor.name]);
    };
  };
  var uIswalnum = /* @__PURE__ */ checkAttr([gencatLT, gencatLU, gencatLL, gencatLM, gencatLO, gencatMC, gencatME, gencatMN, gencatNO, gencatND, gencatNL]);
  var uIswalpha = /* @__PURE__ */ checkAttr([gencatLL, gencatLU, gencatLT, gencatLM, gencatLO]);
  var uIswlower = /* @__PURE__ */ checkAttr([gencatLL]);
  var uIswupper = /* @__PURE__ */ checkAttr([gencatLU, gencatLT]);

  // .tmp-verdict-build/output/Data.CodePoint.Unicode/index.js
  var fromEnum4 = /* @__PURE__ */ fromEnum(boundedEnumCodePoint);
  var modify4 = unsafeCoerce2;
  var toLowerSimple = /* @__PURE__ */ modify4(uTowlower);
  var toUpperSimple = /* @__PURE__ */ modify4(uTowupper);
  var isUpper = function($66) {
    return uIswupper(fromEnum4($66));
  };
  var isSpace = function(c) {
    var uc = fromEnum4(c);
    var $28 = uc <= 823;
    if ($28) {
      return uc === 32 || (uc >= 9 && uc <= 13 || uc === 160);
    }
    ;
    return uIswspace(uc);
  };
  var isOctDigit = function(c) {
    var diff2 = fromEnum4(c) - toCharCode2("0") | 0;
    return diff2 <= 7 && diff2 >= 0;
  };
  var isLower = function($68) {
    return uIswlower(fromEnum4($68));
  };
  var isDecDigit = function(c) {
    var diff2 = fromEnum4(c) - toCharCode2("0") | 0;
    return diff2 <= 9 && diff2 >= 0;
  };
  var isHexDigit = function(c) {
    return isDecDigit(c) || (function() {
      var diff2 = fromEnum4(c) - toCharCode2("A") | 0;
      return diff2 <= 5 && diff2 >= 0;
    }() || function() {
      var diff2 = fromEnum4(c) - toCharCode2("a") | 0;
      return diff2 <= 5 && diff2 >= 0;
    }());
  };
  var isAlphaNum = function($70) {
    return uIswalnum(fromEnum4($70));
  };
  var isAlpha = function($71) {
    return uIswalpha(fromEnum4($71));
  };
  var hexDigitToInt = function(c) {
    var hexUpper = fromEnum4(c) - toCharCode2("A") | 0;
    var hexLower = fromEnum4(c) - toCharCode2("a") | 0;
    var dec = fromEnum4(c) - toCharCode2("0") | 0;
    var result = function() {
      if (dec <= 9 && dec >= 0) {
        return new Just(dec);
      }
      ;
      if (hexLower <= 5 && hexLower >= 0) {
        return new Just(hexLower + 10 | 0);
      }
      ;
      if (hexUpper <= 5 && hexUpper >= 0) {
        return new Just(hexUpper + 10 | 0);
      }
      ;
      if (otherwise) {
        return Nothing.value;
      }
      ;
      throw new Error("Failed pattern match at Data.CodePoint.Unicode (line 591, column 3 - line 591, column 22): ");
    }();
    return result;
  };

  // .tmp-verdict-build/output/Parsing.String.Basic/index.js
  var elem1 = /* @__PURE__ */ elem2(eqChar);
  var show14 = /* @__PURE__ */ show(/* @__PURE__ */ showArray(showChar));
  var notElem1 = /* @__PURE__ */ notElem2(eqChar);
  var satisfyCP = function(p) {
    return satisfy(function($32) {
      return p(codePointFromChar($32));
    });
  };
  var space = /* @__PURE__ */ withErrorMessage(/* @__PURE__ */ satisfyCP(isSpace))("space");
  var upper2 = /* @__PURE__ */ withErrorMessage(/* @__PURE__ */ satisfyCP(isUpper))("uppercase letter");
  var oneOf2 = function(ss) {
    return withLazyErrorMessage(satisfy(flip(elem1)(ss)))(function(v) {
      return "one of " + show14(ss);
    });
  };
  var octDigit = /* @__PURE__ */ withErrorMessage(/* @__PURE__ */ satisfyCP(isOctDigit))("oct digit");
  var noneOf = function(ss) {
    return withLazyErrorMessage(satisfy(flip(notElem1)(ss)))(function(v) {
      return "none of " + show14(ss);
    });
  };
  var lower2 = /* @__PURE__ */ withErrorMessage(/* @__PURE__ */ satisfyCP(isLower))("lowercase letter");
  var letter = /* @__PURE__ */ withErrorMessage(/* @__PURE__ */ satisfyCP(isAlpha))("letter");
  var hexDigit = /* @__PURE__ */ withErrorMessage(/* @__PURE__ */ satisfyCP(isHexDigit))("hex digit");
  var digit = /* @__PURE__ */ withErrorMessage(/* @__PURE__ */ satisfyCP(isDecDigit))("digit");
  var alphaNum = /* @__PURE__ */ withErrorMessage(/* @__PURE__ */ satisfyCP(isAlphaNum))("letter or digit");

  // .tmp-verdict-build/output/Data.String.Unicode/index.js
  var map20 = /* @__PURE__ */ map(functorArray);
  var convert = function(f) {
    var $6 = map20(f);
    return function($7) {
      return fromCodePointArray($6(toCodePointArray($7)));
    };
  };
  var toLowerSimple2 = /* @__PURE__ */ convert(toLowerSimple);
  var toUpperSimple2 = /* @__PURE__ */ convert(toUpperSimple);

  // .tmp-verdict-build/output/Parsing.Token/index.js
  var bind6 = /* @__PURE__ */ bind(bindParserT);
  var pure6 = /* @__PURE__ */ pure(applicativeParserT);
  var sort4 = /* @__PURE__ */ sort(ordString);
  var map21 = /* @__PURE__ */ map(functorArray);
  var applySecond3 = /* @__PURE__ */ applySecond(applyParserT);
  var compare3 = /* @__PURE__ */ compare(ordString);
  var append6 = /* @__PURE__ */ append(semigroupArray);
  var fix2 = /* @__PURE__ */ fix(lazyParserT);
  var alt5 = /* @__PURE__ */ alt(altParserT);
  var $$void4 = /* @__PURE__ */ $$void(functorParserT);
  var voidLeft3 = /* @__PURE__ */ voidLeft(functorParserT);
  var identity6 = /* @__PURE__ */ identity(categoryFn);
  var many4 = /* @__PURE__ */ many(alternativeParserT)(lazyParserT);
  var map110 = /* @__PURE__ */ map(functorMaybe);
  var some3 = /* @__PURE__ */ some(alternativeParserT)(lazyParserT);
  var foldl5 = /* @__PURE__ */ foldl(foldableArray);
  var applyFirst3 = /* @__PURE__ */ applyFirst(applyParserT);
  var show5 = /* @__PURE__ */ show(showString);
  var bind1 = /* @__PURE__ */ bind(bindMaybe);
  var pure1 = /* @__PURE__ */ pure(applicativeMaybe);
  var foldr5 = /* @__PURE__ */ foldr(foldableArray);
  var map23 = /* @__PURE__ */ map(functorParserT);
  var choice2 = /* @__PURE__ */ choice(foldableArray);
  var many12 = /* @__PURE__ */ many2(alternativeParserT)(lazyParserT);
  var toUnfoldable8 = /* @__PURE__ */ toUnfoldable5(unfoldableArray);
  var foldr12 = /* @__PURE__ */ foldr(foldableList);
  var unGenLanguageDef = function(v) {
    return v;
  };
  var theReservedNames = function(v) {
    if (v.caseSensitive) {
      return sort4(v.reservedNames);
    }
    ;
    if (otherwise) {
      return sort4(map21(toLower)(v.reservedNames));
    }
    ;
    throw new Error("Failed pattern match at Parsing.Token (line 828, column 1 - line 828, column 70): " + [v.constructor.name]);
  };
  var simpleSpace = /* @__PURE__ */ skipMany1(/* @__PURE__ */ satisfyCodePoint(isSpace));
  var oneLineComment = function(v) {
    return applySecond3($$try(string(v.commentLine)))(skipMany(satisfy(function(v1) {
      return v1 !== "\n";
    })));
  };
  var isReserved = function($copy_names) {
    return function($copy_name) {
      var $tco_var_names = $copy_names;
      var $tco_done = false;
      var $tco_result;
      function $tco_loop(names, name2) {
        var v = uncons(names);
        if (v instanceof Nothing) {
          $tco_done = true;
          return false;
        }
        ;
        if (v instanceof Just) {
          var v1 = compare3(v.value0.head)(name2);
          if (v1 instanceof LT) {
            $tco_var_names = v.value0.tail;
            $copy_name = name2;
            return;
          }
          ;
          if (v1 instanceof EQ) {
            $tco_done = true;
            return true;
          }
          ;
          if (v1 instanceof GT) {
            $tco_done = true;
            return false;
          }
          ;
          throw new Error("Failed pattern match at Parsing.Token (line 823, column 35 - line 826, column 18): " + [v1.constructor.name]);
        }
        ;
        throw new Error("Failed pattern match at Parsing.Token (line 821, column 3 - line 826, column 18): " + [v.constructor.name]);
      }
      ;
      while (!$tco_done) {
        $tco_result = $tco_loop($tco_var_names, $copy_name);
      }
      ;
      return $tco_result;
    };
  };
  var isReservedName = function(v) {
    return function(name2) {
      var caseName = function() {
        if (v.caseSensitive) {
          return name2;
        }
        ;
        if (otherwise) {
          return toLower(name2);
        }
        ;
        throw new Error("Failed pattern match at Parsing.Token (line 815, column 3 - line 817, column 31): ");
      }();
      return isReserved(theReservedNames(v))(caseName);
    };
  };
  var inCommentSingle = function(v) {
    var startEnd = append6(toCharArray(v.commentEnd))(toCharArray(v.commentStart));
    return fix2(function(p) {
      return alt5($$void4($$try(string(v.commentEnd))))(alt5(applySecond3(skipMany1(noneOf(startEnd)))(p))(withErrorMessage(applySecond3(oneOf2(startEnd))(p))("end of comment")));
    });
  };
  var multiLineComment = function(v) {
    return applySecond3($$try(string(v.commentStart)))(inComment(v));
  };
  var inCommentMulti = function(v) {
    var startEnd = append6(toCharArray(v.commentEnd))(toCharArray(v.commentStart));
    return fix2(function(p) {
      return alt5($$void4($$try(string(v.commentEnd))))(alt5(applySecond3(multiLineComment(v))(p))(alt5(applySecond3(skipMany1(noneOf(startEnd)))(p))(withErrorMessage(applySecond3(oneOf2(startEnd))(p))("end of comment"))));
    });
  };
  var inComment = function(v) {
    if (v.nestedComments) {
      return inCommentMulti(v);
    }
    ;
    return inCommentSingle(v);
  };
  var whiteSpace$prime = function(v) {
    if ($$null2(v.commentLine) && $$null2(v.commentStart)) {
      return skipMany(withErrorMessage(simpleSpace)(""));
    }
    ;
    if ($$null2(v.commentLine)) {
      return skipMany(alt5(simpleSpace)(withErrorMessage(multiLineComment(v))("")));
    }
    ;
    if ($$null2(v.commentStart)) {
      return skipMany(alt5(simpleSpace)(withErrorMessage(oneLineComment(v))("")));
    }
    ;
    if (otherwise) {
      return skipMany(alt5(simpleSpace)(alt5(oneLineComment(v))(withErrorMessage(multiLineComment(v))(""))));
    }
    ;
    throw new Error("Failed pattern match at Parsing.Token (line 837, column 1 - line 837, column 74): " + [v.constructor.name]);
  };
  var makeTokenParser = function(v) {
    var stringLetter = satisfy(function(c) {
      return c !== '"' && (c !== "\\" && c > "");
    });
    var sign2 = function(dictRing) {
      return alt5(voidLeft3($$char("-"))(negate(dictRing)))(alt5(voidLeft3($$char("+"))(identity6))(pure6(identity6)));
    };
    var sign1 = sign2(ringInt);
    var oper = function() {
      var go = bind6(v.opStart)(function(c) {
        return bind6(many4(v.opLetter))(function(cs) {
          return pure6(singleton6(c) + fromCharArray(cs));
        });
      });
      return withErrorMessage(go)("operator");
    }();
    var number = function(base) {
      return function(baseDigit) {
        var folder = function(v1) {
          return function(v2) {
            if (v1 instanceof Nothing) {
              return Nothing.value;
            }
            ;
            if (v1 instanceof Just) {
              return map110(function(v3) {
                return (base * v1.value0 | 0) + v3 | 0;
              })(hexDigitToInt(codePointFromChar(v2)));
            }
            ;
            throw new Error("Failed pattern match at Parsing.Token (line 707, column 5 - line 707, column 45): " + [v1.constructor.name, v2.constructor.name]);
          };
        };
        return bind6(some3(baseDigit))(function(digits2) {
          return maybe(fail("not digits"))(pure6)(foldl5(folder)(new Just(0))(digits2));
        });
      };
    };
    var octal = applySecond3(oneOf2(["o", "O"]))(number(8)(octDigit));
    var lexeme = function(p) {
      return applyFirst3(p)(whiteSpace$prime(v));
    };
    var reservedOp = function(name2) {
      var go = bind6(string(name2))(function() {
        return withErrorMessage(notFollowedBy(v.opLetter))("end of " + name2);
      });
      return lexeme($$try(go));
    };
    var symbol2 = function(name2) {
      return voidLeft3(lexeme(string(name2)))(name2);
    };
    var parens = function(p) {
      return between(symbol2("("))(symbol2(")"))(p);
    };
    var semi = symbol2(";");
    var semiSep = function(p) {
      return sepBy(p)(semi);
    };
    var semiSep1 = function(p) {
      return sepBy1(p)(semi);
    };
    var isReservedOp = function(name2) {
      return isReserved(sort4(v.reservedOpNames))(name2);
    };
    var operator = function() {
      var go = bind6(oper)(function(name2) {
        var $115 = isReservedOp(name2);
        if ($115) {
          return fail("reserved operator " + name2);
        }
        ;
        return pure6(name2);
      });
      return lexeme($$try(go));
    }();
    var ident = function() {
      var go = bind6(v.identStart)(function(c) {
        return bind6(many4(v.identLetter))(function(cs) {
          return pure6(singleton6(c) + fromCharArray(cs));
        });
      });
      return withErrorMessage(go)("identifier");
    }();
    var identifier2 = function() {
      var go = bind6(ident)(function(name2) {
        var $116 = isReservedName(v)(name2);
        if ($116) {
          return fail("reserved word " + show5(name2));
        }
        ;
        return pure6(name2);
      });
      return lexeme($$try(go));
    }();
    var hexadecimal2 = applySecond3(oneOf2(["x", "X"]))(number(16)(hexDigit));
    var fraction = function() {
      var op = function(v1) {
        return function(v2) {
          if (v2 instanceof Nothing) {
            return Nothing.value;
          }
          ;
          if (v2 instanceof Just) {
            return bind1(hexDigitToInt(codePointFromChar(v1)))(function(int$prime) {
              return pure1((v2.value0 + toNumber(int$prime)) / 10);
            });
          }
          ;
          throw new Error("Failed pattern match at Parsing.Token (line 654, column 5 - line 654, column 47): " + [v1.constructor.name, v2.constructor.name]);
        };
      };
      return asErrorMessage("fraction")(bind6($$char("."))(function() {
        return bind6(withErrorMessage(some3(digit))("fraction"))(function(digits2) {
          return maybe(fail("not digit"))(pure6)(foldr5(op)(new Just(0))(digits2));
        });
      }));
    }();
    var escapeGap = withErrorMessage(applySecond3(some3(space))($$char("\\")))("end of string gap");
    var escapeEmpty = $$char("&");
    var escMap = zip(["a", "b", "f", "n", "r", "t", "v", "\\", '"', "'"])(["\x07", "\b", "\f", "\n", "\r", "	", "\v", "\\", '"', "'"]);
    var dot = symbol2(".");
    var decimal = number(10)(digit);
    var exponent$prime = function() {
      var power = function(e) {
        if (e < 0) {
          return 1 / power(-e | 0);
        }
        ;
        if (otherwise) {
          return pow(10)(toNumber(e));
        }
        ;
        throw new Error("Failed pattern match at Parsing.Token (line 667, column 5 - line 667, column 27): " + [e.constructor.name]);
      };
      return asErrorMessage("exponent")(bind6(oneOf2(["e", "E"]))(function() {
        return bind6(sign1)(function(f) {
          return bind6(withErrorMessage(decimal)("exponent"))(function(e) {
            return pure6(power(f(e)));
          });
        });
      }));
    }();
    var fractExponent = function(n) {
      var justExponent = bind6(exponent$prime)(function(expo) {
        return pure6(toNumber(n) * expo);
      });
      var fractExponent$prime = bind6(fraction)(function(fract) {
        return bind6(option(1)(exponent$prime))(function(expo) {
          return pure6((toNumber(n) + fract) * expo);
        });
      });
      return alt5(fractExponent$prime)(justExponent);
    };
    var fractFloat = function(n) {
      return map23(Right.create)(fractExponent(n));
    };
    var decimalFloat = bind6(decimal)(function(n) {
      return option(new Left(n))(fractFloat(n));
    });
    var zeroNumFloat = alt5(map23(Left.create)(alt5(hexadecimal2)(octal)))(alt5(decimalFloat)(alt5(fractFloat(0))(pure6(new Left(0)))));
    var natFloat = alt5(applySecond3($$char("0"))(zeroNumFloat))(decimalFloat);
    var naturalOrFloat = withErrorMessage(lexeme(natFloat))("number");
    var floating = bind6(map23(fromMaybe(identity6))(optionMaybe(sign2(ringNumber))))(function(f) {
      return bind6(bind6(decimal)(fractExponent))(function(x) {
        return pure6(f(x));
      });
    });
    var $$float = withErrorMessage(lexeme(floating))("float");
    var zeroNumber = withErrorMessage(applySecond3($$char("0"))(alt5(hexadecimal2)(alt5(octal)(alt5(decimal)(pure6(0))))))("");
    var nat = alt5(zeroNumber)(decimal);
    var $$int = bind6(lexeme(sign1))(function(f) {
      return bind6(nat)(function(n) {
        return pure6(f(n));
      });
    });
    var integer = withErrorMessage(lexeme($$int))("integer");
    var natural = withErrorMessage(lexeme(nat))("natural");
    var comma = symbol2(",");
    var commaSep = function(p) {
      return sepBy(p)(comma);
    };
    var commaSep1 = function(p) {
      return sepBy1(p)(comma);
    };
    var colon = symbol2(":");
    var charNum = bind6(alt5(decimal)(alt5(applySecond3($$char("o"))(number(8)(octDigit)))(applySecond3($$char("x"))(number(16)(hexDigit)))))(function(code) {
      var $121 = code > 1114111;
      if ($121) {
        return fail("invalid escape sequence");
      }
      ;
      var v1 = fromCharCode3(code);
      if (v1 instanceof Just) {
        return pure6(v1.value0);
      }
      ;
      if (v1 instanceof Nothing) {
        return fail("invalid character code (should not happen)");
      }
      ;
      throw new Error("Failed pattern match at Parsing.Token (line 498, column 10 - line 500, column 67): " + [v1.constructor.name]);
    });
    var charLetter = satisfy(function(c) {
      return c !== "'" && (c !== "\\" && c > "");
    });
    var charEsc = function() {
      var parseEsc = function(v1) {
        return voidLeft3($$char(v1.value0))(v1.value1);
      };
      return choice2(map21(parseEsc)(escMap));
    }();
    var charControl = bind6($$char("^"))(function() {
      return bind6(upper2)(function(code) {
        var v1 = fromCharCode3((toCharCode2(code) - toCharCode2("A") | 0) + 1 | 0);
        if (v1 instanceof Just) {
          return pure6(v1.value0);
        }
        ;
        if (v1 instanceof Nothing) {
          return fail("invalid character code (should not happen)");
        }
        ;
        throw new Error("Failed pattern match at Parsing.Token (line 488, column 5 - line 490, column 67): " + [v1.constructor.name]);
      });
    });
    var caseString = function(name2) {
      if (v.caseSensitive) {
        return voidLeft3(string(name2))(name2);
      }
      ;
      if (otherwise) {
        var msg = show5(name2);
        var caseChar = function(c) {
          var v1 = function(v2) {
            if (otherwise) {
              return $$char(c);
            }
            ;
            throw new Error("Failed pattern match at Parsing.Token (line 355, column 1 - line 355, column 80): " + [c.constructor.name]);
          };
          var $132 = isAlpha(codePointFromChar(c));
          if ($132) {
            var $133 = toChar(toLowerSimple2(singleton6(c)));
            if ($133 instanceof Just) {
              var $134 = toChar(toUpperSimple2(singleton6(c)));
              if ($134 instanceof Just) {
                return alt5($$char($133.value0))($$char($134.value0));
              }
              ;
              return v1(true);
            }
            ;
            return v1(true);
          }
          ;
          return v1(true);
        };
        var walk = function(name$prime) {
          var v1 = uncons2(name$prime);
          if (v1 instanceof Nothing) {
            return pure6(unit);
          }
          ;
          if (v1 instanceof Just) {
            return applySecond3(withErrorMessage(caseChar(v1.value0.head))(msg))(walk(v1.value0.tail));
          }
          ;
          throw new Error("Failed pattern match at Parsing.Token (line 760, column 22 - line 762, column 72): " + [v1.constructor.name]);
        };
        return voidLeft3(walk(name2))(name2);
      }
      ;
      throw new Error("Failed pattern match at Parsing.Token (line 754, column 3 - line 754, column 50): " + [name2.constructor.name]);
    };
    var reserved = function(name2) {
      var go = applySecond3(caseString(name2))(withErrorMessage(notFollowedBy(v.identLetter))("end of " + name2));
      return lexeme($$try(go));
    };
    var brackets = function(p) {
      return between(symbol2("["))(symbol2("]"))(p);
    };
    var braces = function(p) {
      return between(symbol2("{"))(symbol2("}"))(p);
    };
    var ascii3codes = ["NUL", "SOH", "STX", "ETX", "EOT", "ENQ", "ACK", "BEL", "DLE", "DC1", "DC2", "DC3", "DC4", "NAK", "SYN", "ETB", "CAN", "SUB", "ESC", "DEL"];
    var ascii3 = ["\0", "", "", "", "", "", "", "\x07", "", "", "", "", "", "", "", "", "", "", "\x1B", "\x7F"];
    var ascii2codes = ["BS", "HT", "LF", "VT", "FF", "CR", "SO", "SI", "EM", "FS", "GS", "RS", "US", "SP"];
    var ascii2 = ["\b", "	", "\n", "\v", "\f", "\r", "", "", "", "", "", "", "", " "];
    var asciiMap = zip(append6(ascii3codes)(ascii2codes))(append6(ascii3)(ascii2));
    var charAscii = function() {
      var parseAscii = function(v1) {
        return $$try(voidLeft3(string(v1.value0))(v1.value1));
      };
      return choice2(map21(parseAscii)(asciiMap));
    }();
    var escapeCode = alt5(charEsc)(alt5(charNum)(alt5(charAscii)(withErrorMessage(charControl)("escape code"))));
    var charEscape = applySecond3($$char("\\"))(escapeCode);
    var characterChar = alt5(charLetter)(withErrorMessage(charEscape)("literal character"));
    var charLiteral = function() {
      var go = between($$char("'"))(withErrorMessage($$char("'"))("end of character"))(characterChar);
      return withErrorMessage(lexeme(go))("character");
    }();
    var stringEscape = bind6($$char("\\"))(function() {
      return alt5(voidLeft3(escapeGap)(Nothing.value))(alt5(voidLeft3(escapeEmpty)(Nothing.value))(map23(Just.create)(escapeCode)));
    });
    var stringChar = alt5(map23(Just.create)(stringLetter))(withErrorMessage(stringEscape)("string character"));
    var stringLiteral2 = function() {
      var folder = function(v1) {
        return function(v2) {
          if (v1 instanceof Nothing) {
            return v2;
          }
          ;
          if (v1 instanceof Just) {
            return new Cons(v1.value0, v2);
          }
          ;
          throw new Error("Failed pattern match at Parsing.Token (line 455, column 5 - line 455, column 51): " + [v1.constructor.name, v2.constructor.name]);
        };
      };
      var go = bind6(between($$char('"'))(withErrorMessage($$char('"'))("end of string"))(many12(stringChar)))(function(maybeChars) {
        return pure6(fromCharArray(toUnfoldable8(foldr12(folder)(Nil.value)(maybeChars))));
      });
      return lexeme(withErrorMessage(go)("literal string"));
    }();
    var angles = function(p) {
      return between(symbol2("<"))(symbol2(">"))(p);
    };
    return {
      identifier: identifier2,
      reserved,
      operator,
      reservedOp,
      charLiteral,
      stringLiteral: stringLiteral2,
      natural,
      integer,
      "float": $$float,
      naturalOrFloat,
      decimal,
      hexadecimal: hexadecimal2,
      octal,
      symbol: symbol2,
      lexeme,
      whiteSpace: whiteSpace$prime(v),
      parens,
      braces,
      angles,
      brackets,
      semi,
      comma,
      colon,
      dot,
      semiSep,
      semiSep1,
      commaSep,
      commaSep1
    };
  };

  // .tmp-verdict-build/output/Parsing.Language/index.js
  var alt6 = /* @__PURE__ */ alt(altParserT);
  var emptyDef = /* @__PURE__ */ function() {
    var op$prime = oneOf2([":", "!", "#", "$", "%", "&", "*", "+", ".", "/", "<", "=", ">", "?", "@", "\\", "^", "|", "-", "~"]);
    return {
      commentStart: "",
      commentEnd: "",
      commentLine: "",
      nestedComments: true,
      identStart: alt6(letter)($$char("_")),
      identLetter: alt6(alphaNum)(oneOf2(["_", "'"])),
      opStart: op$prime,
      opLetter: op$prime,
      reservedOpNames: [],
      reservedNames: [],
      caseSensitive: true
    };
  }();

  // .tmp-verdict-build/output/Verdict.Parser/index.js
  var $runtime_lazy6 = function(name2, moduleName2, init3) {
    var state2 = 0;
    var val;
    return function(lineNumber) {
      if (state2 === 2) return val;
      if (state2 === 1) throw new ReferenceError(name2 + " was needed before it finished initializing (module " + moduleName2 + ", line " + lineNumber + ")", moduleName2, lineNumber);
      state2 = 1;
      val = init3();
      state2 = 2;
      return val;
    };
  };
  var bind7 = /* @__PURE__ */ bind(bindParserT);
  var pure7 = /* @__PURE__ */ pure(applicativeParserT);
  var alt7 = /* @__PURE__ */ alt(altParserT);
  var voidLeft4 = /* @__PURE__ */ voidLeft(functorParserT);
  var applyFirst4 = /* @__PURE__ */ applyFirst(applyParserT);
  var map24 = /* @__PURE__ */ map(functorParserT);
  var fromFoldable13 = /* @__PURE__ */ fromFoldable(foldableList);
  var discard4 = /* @__PURE__ */ discard(discardUnit)(bindParserT);
  var defer4 = /* @__PURE__ */ defer(lazyParserT);
  var applySecond4 = /* @__PURE__ */ applySecond(applyParserT);
  var apply3 = /* @__PURE__ */ apply(applyParserT);
  var fromFoldable14 = /* @__PURE__ */ fromFoldable(foldableArray);
  var append7 = /* @__PURE__ */ append(semigroupArray);
  var map111 = /* @__PURE__ */ map(functorMaybe);
  var map25 = /* @__PURE__ */ map(functorEither);
  var langDef = /* @__PURE__ */ function() {
    var v = unGenLanguageDef(emptyDef);
    return {
      identStart: v.identStart,
      identLetter: v.identLetter,
      opStart: v.opStart,
      opLetter: v.opLetter,
      reservedNames: v.reservedNames,
      reservedOpNames: v.reservedOpNames,
      caseSensitive: v.caseSensitive,
      commentLine: "--",
      commentStart: "{-",
      commentEnd: "-}",
      nestedComments: true
    };
  }();
  var tokenParser = /* @__PURE__ */ makeTokenParser(langDef);
  var lowerIdentifier = /* @__PURE__ */ function() {
    return tokenParser.lexeme(bind7(lower2)(function(c) {
      return bind7(many3(alphaNum))(function(rest) {
        return pure7(fromCharArray(cons(c)(rest)));
      });
    }));
  }();
  var stringLiteral = /* @__PURE__ */ function() {
    return tokenParser.stringLiteral;
  }();
  var symbol = /* @__PURE__ */ function() {
    return tokenParser.symbol;
  }();
  var mulOp = /* @__PURE__ */ function() {
    return alt7(voidLeft4(symbol("*"))(EBin.create(OpMul.value)))(voidLeft4(symbol("/"))(EBin.create(OpDiv.value)));
  }();
  var typeIdentifier = /* @__PURE__ */ function() {
    return tokenParser.lexeme(bind7(upper2)(function(c) {
      return bind7(many3(alphaNum))(function(rest) {
        return pure7(fromCharArray(cons(c)(rest)));
      });
    }));
  }();
  var keyword = function(k) {
    return voidLeft4(tokenParser.lexeme($$try(applyFirst4(string(k))(notFollowedBy(alphaNum)))))(unit);
  };
  var primitiveType = /* @__PURE__ */ function() {
    return alt7(voidLeft4(keyword("Int"))(TInt.value))(alt7(voidLeft4(keyword("Fixed"))(TFixed.value))(alt7(voidLeft4(keyword("Rational"))(TRational.value))(alt7(voidLeft4(keyword("Bool"))(TBool.value))(alt7(voidLeft4(keyword("String"))(TString.value))(alt7(voidLeft4(keyword("Unit"))(TUnit.value))(alt7(voidLeft4(keyword("Pid"))(TPid.value))(voidLeft4(keyword("Json"))(TUnknown.value))))))));
  }();
  var identifier = /* @__PURE__ */ function() {
    return tokenParser.identifier;
  }();
  var parseExposing = /* @__PURE__ */ function() {
    var exposeName = alt7(identifier)(typeIdentifier);
    return between(symbol("("))(symbol(")"))(alt7(voidLeft4(symbol(".."))(ExposeAll.value))(map24(function($55) {
      return ExposeNames.create(fromFoldable13($55));
    })(sepBy(exposeName)(symbol(",")))));
  }();
  var parseImport = /* @__PURE__ */ discard4(/* @__PURE__ */ keyword("import"))(function() {
    return bind7(identifier)(function(m) {
      return discard4(keyword("exposing"))(function() {
        return bind7(parseExposing)(function(ex) {
          return pure7({
            mod: m,
            names: ex
          });
        });
      });
    });
  });
  var guardSameDecl = /* @__PURE__ */ bind7(position)(function(v) {
    var $45 = v.column === 1;
    if ($45) {
      return fail("declaration boundary");
    }
    ;
    return pure7(unit);
  });
  var $lazy_parseRecordType = /* @__PURE__ */ $runtime_lazy6("parseRecordType", "Verdict.Parser", function() {
    var recField = bind7(identifier)(function(n) {
      return bind7(symbol(":"))(function() {
        return bind7($lazy_parseType(320))(function(t) {
          return pure7(new Tuple(n, t));
        });
      });
    });
    return defer4(function(v) {
      return map24(function($56) {
        return TRecord.create(fromFoldable13($56));
      })(between(symbol("{"))(symbol("}"))(sepBy(recField)(symbol(","))));
    });
  });
  var $lazy_parseType = /* @__PURE__ */ $runtime_lazy6("parseType", "Verdict.Parser", function() {
    return defer4(function(v) {
      return bind7($lazy_parseTypeApp(262))(function(a) {
        return bind7(optionMaybe(applySecond4(symbol("->"))($lazy_parseType(263))))(function(m) {
          return pure7(function() {
            if (m instanceof Nothing) {
              return a;
            }
            ;
            if (m instanceof Just) {
              return new TArrow(a, m.value0);
            }
            ;
            throw new Error("Failed pattern match at Verdict.Parser (line 264, column 8 - line 266, column 25): " + [m.constructor.name]);
          }());
        });
      });
    });
  });
  var $lazy_parseTypeApp = /* @__PURE__ */ $runtime_lazy6("parseTypeApp", "Verdict.Parser", function() {
    return defer4(function(v) {
      return alt7(primitiveType)(alt7(applySecond4(keyword("List"))(map24(TList.create)($lazy_parseTypeAtom(275))))(alt7(apply3(map24(TData.create)(typeIdentifier))(map24(fromFoldable14)(many3(applySecond4(guardSameDecl)($lazy_parseTypeAtom(276))))))($lazy_parseTypeAtom(277))));
    });
  });
  var $lazy_parseTypeAtom = /* @__PURE__ */ $runtime_lazy6("parseTypeAtom", "Verdict.Parser", function() {
    return defer4(function(v) {
      return alt7(primitiveType)(alt7($lazy_parseRecordType(307))(alt7(between(symbol("("))(symbol(")"))($lazy_parseType(308)))(alt7(map24(function(n) {
        return new TData(n, []);
      })(typeIdentifier))(map24(TVar.create)(lowerIdentifier)))));
    });
  });
  var parseType = /* @__PURE__ */ $lazy_parseType(260);
  var parseTypeApp = /* @__PURE__ */ $lazy_parseTypeApp(272);
  var parseSig = /* @__PURE__ */ bind7(identifier)(function(n) {
    return bind7(symbol(":"))(function() {
      return bind7(parseType)(function(t) {
        return pure7({
          name: n,
          ty: t
        });
      });
    });
  });
  var parseTypeDecl = /* @__PURE__ */ function() {
    var parseCtorField = applySecond4(guardSameDecl)(parseTypeApp);
    var parseCtor = bind7(typeIdentifier)(function(name2) {
      return bind7(many3(parseCtorField))(function(fields) {
        return pure7({
          name: name2,
          fields: fromFoldable14(fields)
        });
      });
    });
    return discard4(keyword("type"))(function() {
      return bind7(typeIdentifier)(function(name2) {
        return bind7(many3(lowerIdentifier))(function(params) {
          return bind7(symbol("="))(function() {
            return bind7(optionMaybe(symbol("|")))(function() {
              return bind7(parseCtor)(function(first) {
                return bind7(many3(applySecond4(symbol("|"))(parseCtor)))(function(rest) {
                  return pure7(new TypeDecl(name2, fromFoldable14(params), append7([first])(fromFoldable14(rest))));
                });
              });
            });
          });
        });
      });
    });
  }();
  var digits = /* @__PURE__ */ map24(function($57) {
    return fromCharArray(toArray($57));
  })(/* @__PURE__ */ many1(digit));
  var numberLit = /* @__PURE__ */ function() {
    var rationalLit = function(sign2) {
      return function(intPart) {
        return discard4(tokenParser.whiteSpace)(function() {
          return bind7(symbol("%"))(function() {
            return bind7(digits)(function(den) {
              return pure7(new LRational(sign2 + intPart, den));
            });
          });
        });
      };
    };
    var fixedLit = function(sign2) {
      return function(intPart) {
        return bind7(applySecond4($$char("."))(digits))(function(fs) {
          return pure7(new LFixed(sign2 + (intPart + fs), length2(fs)));
        });
      };
    };
    return tokenParser.lexeme(bind7(option("")(string("-")))(function(sign2) {
      return bind7(digits)(function(intPart) {
        return alt7(fixedLit(sign2)(intPart))(alt7($$try(rationalLit(sign2)(intPart)))(pure7(new LInt(sign2 + intPart))));
      });
    }));
  }();
  var parseLiteral = /* @__PURE__ */ function() {
    return map24(ELit.create)(alt7($$try(numberLit))(alt7(map24(LStr.create)(stringLiteral))(alt7(voidLeft4(keyword("unit"))(LUnit.value))(alt7(voidLeft4(keyword("True"))(new LBool(true)))(voidLeft4(keyword("False"))(new LBool(false)))))));
  }();
  var cmpOp = /* @__PURE__ */ function() {
    return alt7(voidLeft4(symbol("=="))(ECmp.create(CmpEq.value)))(alt7(voidLeft4(symbol("<"))(ECmp.create(CmpLt.value)))(voidLeft4(symbol(">"))(ECmp.create(CmpGt.value))));
  }();
  var addOp = /* @__PURE__ */ function() {
    return alt7(voidLeft4(symbol("+"))(EBin.create(OpAdd.value)))(voidLeft4(symbol("-"))(EBin.create(OpSub.value)));
  }();
  var $lazy_parseAdd = /* @__PURE__ */ $runtime_lazy6("parseAdd", "Verdict.Parser", function() {
    return defer4(function(v) {
      return chainl1($lazy_parseMul(166))(addOp);
    });
  });
  var $lazy_parseAtom = /* @__PURE__ */ $runtime_lazy6("parseAtom", "Verdict.Parser", function() {
    return defer4(function(v) {
      return bind7(position)(function(v1) {
        return bind7(alt7(parseLiteral)(alt7($lazy_parseList(195))(alt7($lazy_parseRecord(196))(alt7($lazy_parseBuiltin(197))(alt7($lazy_parseEffect(198))(alt7($lazy_parseCallOrVar(199))(between(symbol("("))(symbol(")"))($lazy_parseExpr(200)))))))))(function(e) {
          return pure7(new EAt({
            line: v1.line,
            column: v1.column
          }, e));
        });
      });
    });
  });
  var $lazy_parseBuiltin = /* @__PURE__ */ $runtime_lazy6("parseBuiltin", "Verdict.Parser", function() {
    return defer4(function(v) {
      return discard4(keyword("builtin"))(function() {
        return bind7(symbol("("))(function() {
          return bind7(stringLiteral)(function(bid) {
            return bind7(many3(applySecond4(symbol(","))($lazy_parseExpr(233))))(function(args) {
              return bind7(symbol(")"))(function() {
                return pure7(new EBuiltin(bid, args));
              });
            });
          });
        });
      });
    });
  });
  var $lazy_parseCallOrVar = /* @__PURE__ */ $runtime_lazy6("parseCallOrVar", "Verdict.Parser", function() {
    return defer4(function(v) {
      return bind7(identifier)(function(n) {
        return bind7(optionMaybe(between(symbol("("))(symbol(")"))(sepBy($lazy_parseExpr(251))(symbol(",")))))(function(margs) {
          return pure7(function() {
            if (margs instanceof Nothing) {
              return new EVar(n);
            }
            ;
            if (margs instanceof Just) {
              return new ECall(n, fromFoldable13(margs.value0));
            }
            ;
            throw new Error("Failed pattern match at Verdict.Parser (line 252, column 8 - line 254, column 47): " + [margs.constructor.name]);
          }());
        });
      });
    });
  });
  var $lazy_parseCompare = /* @__PURE__ */ $runtime_lazy6("parseCompare", "Verdict.Parser", function() {
    return defer4(function(v) {
      return bind7($lazy_parseAdd(153))(function(a) {
        return bind7(optionMaybe(apply3(map24(Tuple.create)(cmpOp))($lazy_parseAdd(154))))(function(m) {
          return pure7(function() {
            if (m instanceof Nothing) {
              return a;
            }
            ;
            if (m instanceof Just) {
              return m.value0.value0(a)(m.value0.value1);
            }
            ;
            throw new Error("Failed pattern match at Verdict.Parser (line 155, column 8 - line 157, column 30): " + [m.constructor.name]);
          }());
        });
      });
    });
  });
  var $lazy_parseEffect = /* @__PURE__ */ $runtime_lazy6("parseEffect", "Verdict.Parser", function() {
    return defer4(function(v) {
      return discard4(keyword("effect"))(function() {
        return bind7(symbol("("))(function() {
          return bind7(stringLiteral)(function(eid) {
            return bind7(many3(applySecond4(symbol(","))($lazy_parseExpr(243))))(function(args) {
              return bind7(symbol(")"))(function() {
                return pure7(new EEffect(eid, args));
              });
            });
          });
        });
      });
    });
  });
  var $lazy_parseExpr = /* @__PURE__ */ $runtime_lazy6("parseExpr", "Verdict.Parser", function() {
    return defer4(function(v) {
      return alt7($lazy_parseIf(88))(alt7($lazy_parseLet(88))(alt7($lazy_parseSwitch(88))(alt7($lazy_parseMatch(88))($lazy_parseCompare(88)))));
    });
  });
  var $lazy_parseIf = /* @__PURE__ */ $runtime_lazy6("parseIf", "Verdict.Parser", function() {
    return defer4(function(v) {
      return discard4(keyword("if"))(function() {
        return bind7($lazy_parseExpr(134))(function(c) {
          return discard4(keyword("then"))(function() {
            return bind7($lazy_parseExpr(136))(function(t) {
              return discard4(keyword("else"))(function() {
                return bind7($lazy_parseExpr(138))(function(e) {
                  return pure7(new EIf(c, t, e));
                });
              });
            });
          });
        });
      });
    });
  });
  var $lazy_parseLet = /* @__PURE__ */ $runtime_lazy6("parseLet", "Verdict.Parser", function() {
    return defer4(function(v) {
      return discard4(keyword("let"))(function() {
        return bind7(alt7(identifier)(voidLeft4(symbol("_"))("_")))(function(n) {
          return bind7(symbol("="))(function() {
            return bind7($lazy_parseExpr(146))(function(v1) {
              return discard4(keyword("in"))(function() {
                return bind7($lazy_parseExpr(148))(function(b) {
                  return pure7(new ELet(n, v1, b));
                });
              });
            });
          });
        });
      });
    });
  });
  var $lazy_parseList = /* @__PURE__ */ $runtime_lazy6("parseList", "Verdict.Parser", function() {
    return defer4(function(v) {
      return map24(function($58) {
        return EList.create(fromFoldable13($58));
      })(between(symbol("["))(symbol("]"))(sepBy($lazy_parseExpr(215))(symbol(","))));
    });
  });
  var $lazy_parseMatch = /* @__PURE__ */ $runtime_lazy6("parseMatch", "Verdict.Parser", function() {
    var parsePattern = alt7(voidLeft4(symbol("_"))(PWild.value))(apply3(map24(PCtor.create)(typeIdentifier))(map24(fromFoldable14)(many3(identifier))));
    var parseArm = bind7(parsePattern)(function(pat) {
      return bind7(symbol("->"))(function() {
        return bind7($lazy_parseExpr(124))(function(body) {
          return pure7(new Tuple(pat, body));
        });
      });
    });
    return defer4(function(v) {
      return discard4(keyword("match"))(function() {
        return bind7($lazy_parseExpr(115))(function(scrut) {
          return bind7(symbol("{"))(function() {
            return bind7(sepBy(parseArm)(symbol(",")))(function(arms) {
              return bind7(symbol("}"))(function() {
                return pure7(new EMatch(scrut, fromFoldable13(arms)));
              });
            });
          });
        });
      });
    });
  });
  var $lazy_parseMul = /* @__PURE__ */ $runtime_lazy6("parseMul", "Verdict.Parser", function() {
    return defer4(function(v) {
      return chainl1($lazy_parsePostfix(169))(mulOp);
    });
  });
  var $lazy_parsePostfix = /* @__PURE__ */ $runtime_lazy6("parsePostfix", "Verdict.Parser", function() {
    return defer4(function(v) {
      return bind7($lazy_parseAtom(179))(function(a) {
        return bind7(many3($lazy_postfixOp(180)))(function(ops) {
          return pure7(foldl2(function(acc) {
            return function(f) {
              return f(acc);
            };
          })(a)(ops));
        });
      });
    });
  });
  var $lazy_parseRecord = /* @__PURE__ */ $runtime_lazy6("parseRecord", "Verdict.Parser", function() {
    var recField = bind7(identifier)(function(n) {
      return bind7(symbol("="))(function() {
        return bind7($lazy_parseExpr(225))(function(e) {
          return pure7(new Tuple(n, e));
        });
      });
    });
    return defer4(function(v) {
      return map24(function($59) {
        return ERecord.create(fromFoldable13($59));
      })(between(symbol("{"))(symbol("}"))(sepBy(recField)(symbol(","))));
    });
  });
  var $lazy_parseSwitch = /* @__PURE__ */ $runtime_lazy6("parseSwitch", "Verdict.Parser", function() {
    var parseLitPat = alt7($$try(numberLit))(alt7(map24(LStr.create)(stringLiteral))(alt7(voidLeft4(keyword("unit"))(LUnit.value))(alt7(voidLeft4(keyword("True"))(new LBool(true)))(voidLeft4(keyword("False"))(new LBool(false))))));
    var parseArm = bind7(alt7(voidLeft4(symbol("_"))(Nothing.value))(map24(Just.create)(parseLitPat)))(function(pat) {
      return bind7(symbol("->"))(function() {
        return bind7($lazy_parseExpr(103))(function(body) {
          return pure7(new Tuple(pat, body));
        });
      });
    });
    return defer4(function(v) {
      return discard4(keyword("switch"))(function() {
        return bind7($lazy_parseExpr(94))(function(scrut) {
          return bind7(symbol("{"))(function() {
            return bind7(sepBy(parseArm)(symbol(",")))(function(arms) {
              return bind7(symbol("}"))(function() {
                return pure7(new ESwitch(scrut, fromFoldable13(arms)));
              });
            });
          });
        });
      });
    });
  });
  var $lazy_postfixOp = /* @__PURE__ */ $runtime_lazy6("postfixOp", "Verdict.Parser", function() {
    return defer4(function(v) {
      return alt7(map24(flip(EField.create))(applySecond4(symbol("."))(identifier)))(bind7(between(symbol("["))(symbol("]"))($lazy_parseExpr(187)))(function(ix) {
        return pure7(function(e) {
          return new ECall("get", [e, ix]);
        });
      }));
    });
  });
  var parseExpr = /* @__PURE__ */ $lazy_parseExpr(87);
  var parseDef = /* @__PURE__ */ bind7(identifier)(function(n) {
    return bind7(many3(identifier))(function(ps) {
      return bind7(symbol("="))(function() {
        return bind7(parseExpr)(function(e) {
          return pure7({
            name: n,
            params: ps,
            body: e
          });
        });
      });
    });
  });
  var parseItem = /* @__PURE__ */ bind7(/* @__PURE__ */ optionMaybe(/* @__PURE__ */ $$try(parseSig)))(function(msig) {
    return bind7(parseDef)(function(def) {
      return pure7({
        name: def.name,
        params: def.params,
        sig: map111(function(v) {
          return v.ty;
        })(msig),
        body: def.body
      });
    });
  });
  var parseModule = /* @__PURE__ */ function() {
    return discard4(tokenParser.whiteSpace)(function() {
      return discard4(keyword("module"))(function() {
        return bind7(identifier)(function(modName) {
          return discard4(keyword("exposing"))(function() {
            return bind7(parseExposing)(function(exposing) {
              return bind7(map24(fromFoldable14)(many3(parseImport)))(function(imports) {
                return bind7(many3(parseTypeDecl))(function(types) {
                  return bind7(many1(parseItem))(function(items) {
                    return bind7(eof)(function() {
                      return pure7({
                        mod: new Module(modName, fromFoldable14(types), toArray(items)),
                        exposing,
                        imports
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }();
  var parseModuleFull = function(src) {
    return runParser(src)(parseModule);
  };
  var parseVerdict = function(src) {
    return map25(function(v) {
      return v.mod;
    })(parseModuleFull(src));
  };

  // .tmp-verdict-build/output/Verdict.Std.Link/index.js
  var fromFoldable15 = /* @__PURE__ */ fromFoldable6(foldableArray)(ordString);
  var append8 = /* @__PURE__ */ append(/* @__PURE__ */ semigroupSet(ordString));
  var member7 = /* @__PURE__ */ member4(ordString);
  var insert9 = /* @__PURE__ */ insert5(ordString);
  var map26 = /* @__PURE__ */ map(functorArray);
  var lookup7 = /* @__PURE__ */ lookup2(ordString);
  var fromFoldable16 = /* @__PURE__ */ fromFoldable(foldableSet);
  var append13 = /* @__PURE__ */ append(semigroupArray);
  var fromFoldable23 = /* @__PURE__ */ fromFoldable3(ordString)(foldableArray);
  var typeName = function(v) {
    return v.value0;
  };
  var isIntrinsic = function(v) {
    if (v === "length") {
      return true;
    }
    ;
    if (v === "get") {
      return true;
    }
    ;
    if (v === "append") {
      return true;
    }
    ;
    if (v === "mod") {
      return true;
    }
    ;
    if (v === "spawn") {
      return true;
    }
    ;
    if (v === "actorStart") {
      return true;
    }
    ;
    if (v === "send") {
      return true;
    }
    ;
    if (v === "recv") {
      return true;
    }
    ;
    if (v === "yield") {
      return true;
    }
    ;
    if (v === "self") {
      return true;
    }
    ;
    return false;
  };
  var refs = function(ctors) {
    return function(bound) {
      var patternBound = function(v) {
        if (v instanceof PWild) {
          return empty4;
        }
        ;
        if (v instanceof PCtor) {
          return fromFoldable15(v.value1);
        }
        ;
        throw new Error("Failed pattern match at Verdict.Std.Link (line 50, column 18 - line 52, column 44): " + [v.constructor.name]);
      };
      var foldRefs = function(b) {
        return foldl2(function(acc) {
          return function(e) {
            return append8(acc)(refs(ctors)(b)(e));
          };
        })(empty4);
      };
      return function(v) {
        if (v instanceof EAt) {
          return refs(ctors)(bound)(v.value1);
        }
        ;
        if (v instanceof ELit) {
          return empty4;
        }
        ;
        if (v instanceof EVar) {
          var $39 = member7(v.value0)(bound) || member7(v.value0)(ctors);
          if ($39) {
            return empty4;
          }
          ;
          return singleton7(v.value0);
        }
        ;
        if (v instanceof EBin) {
          return append8(refs(ctors)(bound)(v.value1))(refs(ctors)(bound)(v.value2));
        }
        ;
        if (v instanceof ECmp) {
          return append8(refs(ctors)(bound)(v.value1))(refs(ctors)(bound)(v.value2));
        }
        ;
        if (v instanceof EIf) {
          return append8(refs(ctors)(bound)(v.value0))(append8(refs(ctors)(bound)(v.value1))(refs(ctors)(bound)(v.value2)));
        }
        ;
        if (v instanceof ELet) {
          return append8(refs(ctors)(bound)(v.value1))(refs(ctors)(insert9(v.value0)(bound))(v.value2));
        }
        ;
        if (v instanceof ECall) {
          var base = function() {
            var $53 = member7(v.value0)(bound) || (member7(v.value0)(ctors) || isIntrinsic(v.value0));
            if ($53) {
              return empty4;
            }
            ;
            return singleton7(v.value0);
          }();
          return append8(base)(foldRefs(bound)(v.value1));
        }
        ;
        if (v instanceof EBuiltin) {
          return foldRefs(bound)(v.value1);
        }
        ;
        if (v instanceof EEffect) {
          return foldRefs(bound)(v.value1);
        }
        ;
        if (v instanceof EList) {
          return foldRefs(bound)(v.value0);
        }
        ;
        if (v instanceof ERecord) {
          return foldRefs(bound)(map26(snd)(v.value0));
        }
        ;
        if (v instanceof EField) {
          return refs(ctors)(bound)(v.value0);
        }
        ;
        if (v instanceof ESwitch) {
          return append8(refs(ctors)(bound)(v.value0))(foldRefs(bound)(map26(snd)(v.value1)));
        }
        ;
        if (v instanceof EMatch) {
          return append8(refs(ctors)(bound)(v.value0))(foldl2(function(acc) {
            return function(v1) {
              return append8(acc)(refs(ctors)(append8(patternBound(v1.value0))(bound))(v1.value1));
            };
          })(empty4)(v.value1));
        }
        ;
        throw new Error("Failed pattern match at Verdict.Std.Link (line 22, column 20 - line 46, column 13): " + [v.constructor.name]);
      };
    };
  };
  var entryName2 = function(decls) {
    var v = find2(function(d) {
      return declName(d) === "main";
    })(decls);
    if (v instanceof Just) {
      return "main";
    }
    ;
    if (v instanceof Nothing) {
      var v1 = head(decls);
      if (v1 instanceof Just) {
        return declName(v1.value0);
      }
      ;
      if (v1 instanceof Nothing) {
        return "main";
      }
      ;
      throw new Error("Failed pattern match at Verdict.Std.Link (line 92, column 16 - line 94, column 24): " + [v1.constructor.name]);
    }
    ;
    throw new Error("Failed pattern match at Verdict.Std.Link (line 90, column 3 - line 94, column 24): " + [v.constructor.name]);
  };
  var declRefs = function(ctors) {
    return function(v) {
      return refs(ctors)(fromFoldable15(v.params))(v.body);
    };
  };
  var reachable = function(ctors) {
    return function(declMap) {
      return function(entry) {
        var go = function($copy_seen) {
          return function($copy_frontier) {
            var $tco_var_seen = $copy_seen;
            var $tco_done = false;
            var $tco_result;
            function $tco_loop(seen, frontier) {
              var v = uncons(frontier);
              if (v instanceof Nothing) {
                $tco_done = true;
                return seen;
              }
              ;
              if (v instanceof Just) {
                if (member7(v.value0.head)(seen)) {
                  $tco_var_seen = seen;
                  $copy_frontier = v.value0.tail;
                  return;
                }
                ;
                if (otherwise) {
                  var seen$prime = insert9(v.value0.head)(seen);
                  var outs = function() {
                    var v1 = lookup7(v.value0.head)(declMap);
                    if (v1 instanceof Just) {
                      return fromFoldable16(declRefs(ctors)(v1.value0));
                    }
                    ;
                    if (v1 instanceof Nothing) {
                      return [];
                    }
                    ;
                    throw new Error("Failed pattern match at Verdict.Std.Link (line 82, column 20 - line 84, column 28): " + [v1.constructor.name]);
                  }();
                  $tco_var_seen = seen$prime;
                  $copy_frontier = append13(v.value0.tail)(outs);
                  return;
                }
                ;
              }
              ;
              throw new Error("Failed pattern match at Verdict.Std.Link (line 75, column 22 - line 86, column 36): " + [v.constructor.name]);
            }
            ;
            while (!$tco_done) {
              $tco_result = $tco_loop($tco_var_seen, $copy_frontier);
            }
            ;
            return $tco_result;
          };
        };
        return go(empty4)([entry]);
      };
    };
  };
  var ctorNames = function(v) {
    return map26(function(v1) {
      return v1.name;
    })(v.value2);
  };
  var linkWith = function(roots) {
    return function(userMod) {
      return function(preludeMod) {
        var userTypes = moduleTypes(userMod);
        var userTypeNames = fromFoldable15(map26(typeName)(userTypes));
        var userDecls = moduleDecls(userMod);
        var userNames = fromFoldable15(map26(declName)(userDecls));
        var typeExtra = filter(function(t) {
          return !member7(typeName(t))(userTypeNames);
        })(moduleTypes(preludeMod));
        var preludeExtra = filter(function(d) {
          return !member7(declName(d))(userNames);
        })(moduleDecls(preludeMod));
        var allTypes = append13(userTypes)(typeExtra);
        var ctorSet = fromFoldable15(concatMap(ctorNames)(allTypes));
        var allDecls = append13(userDecls)(preludeExtra);
        var declMap = fromFoldable23(map26(function(d) {
          return new Tuple(declName(d), d);
        })(allDecls));
        var keep = foldl2(function(acc) {
          return function(n) {
            return append8(acc)(reachable(ctorSet)(declMap)(n));
          };
        })(empty4)(roots(userDecls));
        var kept = filter(function(d) {
          return member7(declName(d))(keep);
        })(allDecls);
        return new Module(moduleName(userMod), allTypes, kept);
      };
    };
  };
  var link = /* @__PURE__ */ linkWith(function(userDecls) {
    return [entryName2(userDecls)];
  });
  var linkAll = /* @__PURE__ */ linkWith(/* @__PURE__ */ map26(declName));

  // .tmp-verdict-build/output/Verdict.Std.Prelude/index.js
  var preludeSource = '\nmodule Prelude exposing (..)\n\ntype Option a = Some a | None\n\ntype Result e a = Err e | Ok a\n\ntype Decoder a = Decoder Json\n\ntype Encoder a = Encoder Json\n\ntype ActorRef m = MkActorRef Pid\n\n-- Logic ----------------------------------------------------------------------\n\nand : Bool -> Bool -> Bool\nand a b = builtin("logic.and@1", a, b)\n\nor : Bool -> Bool -> Bool\nor a b = builtin("logic.or@1", a, b)\n\nnot : Bool -> Bool\nnot b = builtin("logic.not@1", b)\n\n-- BigInt math ----------------------------------------------------------------\n\nmodPow : Int -> Int -> Int -> Int\nmodPow base exp mod = builtin("bigint.modPow@1", base, exp, mod)\n\nmodInv : Int -> Int -> Int\nmodInv a mod = builtin("bigint.modInv@1", a, mod)\n\n-- Lists ----------------------------------------------------------------------\n\nmapGo : (a -> b) -> List a -> Int -> List b -> List b\nmapGo f xs i acc =\n  if i == length(xs) then acc\n  else mapGo(f, xs, i + 1, append(acc, f(get(xs, i))))\n\nmap : (a -> b) -> List a -> List b\nmap f xs = mapGo(f, xs, 0, [])\n\nfilterGo : (a -> Bool) -> List a -> Int -> List a -> List a\nfilterGo f xs i acc =\n  if i == length(xs) then acc\n  else if f(get(xs, i)) then filterGo(f, xs, i + 1, append(acc, get(xs, i)))\n  else filterGo(f, xs, i + 1, acc)\n\nfilter : (a -> Bool) -> List a -> List a\nfilter f xs = filterGo(f, xs, 0, [])\n\nfoldlGo : (b -> a -> b) -> b -> List a -> Int -> b\nfoldlGo f acc xs i =\n  if i == length(xs) then acc\n  else foldlGo(f, f(acc, get(xs, i)), xs, i + 1)\n\nfoldl : (b -> a -> b) -> b -> List a -> b\nfoldl f acc xs = foldlGo(f, acc, xs, 0)\n\nisEmpty : List a -> Bool\nisEmpty xs = length(xs) == 0\n\nrangeGo : Int -> Int -> List Int -> List Int\nrangeGo i n acc =\n  if i == n then acc\n  else rangeGo(i + 1, n, append(acc, i))\n\nrange : Int -> List Int\nrange n = rangeGo(0, n, [])\n\nreverseGo : List a -> Int -> List a -> List a\nreverseGo xs i acc =\n  if i < 0 then acc\n  else reverseGo(xs, i - 1, append(acc, get(xs, i)))\n\nreverse : List a -> List a\nreverse xs = reverseGo(xs, length(xs) - 1, [])\n\nconcatGo : List a -> Int -> List a -> List a\nconcatGo ys i acc =\n  if i == length(ys) then acc\n  else concatGo(ys, i + 1, append(acc, get(ys, i)))\n\nconcat : List a -> List a -> List a\nconcat xs ys = concatGo(ys, 0, xs)\n\nsumGo : List Int -> Int -> Int -> Int\nsumGo xs i acc =\n  if i == length(xs) then acc\n  else sumGo(xs, i + 1, acc + get(xs, i))\n\nsum : List Int -> Int\nsum xs = sumGo(xs, 0, 0)\n\nproductGo : List Int -> Int -> Int -> Int\nproductGo xs i acc =\n  if i == length(xs) then acc\n  else productGo(xs, i + 1, acc * get(xs, i))\n\nproduct : List Int -> Int\nproduct xs = productGo(xs, 0, 1)\n\ncontainsGo : a -> List a -> Int -> Bool\ncontainsGo x xs i =\n  if i == length(xs) then False\n  else if get(xs, i) == x then True\n  else containsGo(x, xs, i + 1)\n\ncontains : a -> List a -> Bool\ncontains x xs = containsGo(x, xs, 0)\n\ntakeGo : Int -> List a -> Int -> List a -> List a\ntakeGo n xs i acc =\n  if i == n then acc\n  else if i == length(xs) then acc\n  else takeGo(n, xs, i + 1, append(acc, get(xs, i)))\n\ntake : Int -> List a -> List a\ntake n xs = takeGo(n, xs, 0, [])\n\ndropGo : Int -> List a -> Int -> List a -> List a\ndropGo n xs i acc =\n  if i == length(xs) then acc\n  else if i < n then dropGo(n, xs, i + 1, acc)\n  else dropGo(n, xs, i + 1, append(acc, get(xs, i)))\n\ndrop : Int -> List a -> List a\ndrop n xs = dropGo(n, xs, 0, [])\n\n-- Option helpers -------------------------------------------------------------\n\nmapOption : (a -> b) -> Option a -> Option b\nmapOption f o = match o { Some v -> Some(f(v)), None -> None }\n\nisNone : Option a -> Bool\nisNone o = match o { Some v -> False, None -> True }\n\n-- Strings (deterministic str.* FFI builtins) ---------------------------------\n\nstrLength : String -> Int\nstrLength s = builtin("str.length@1", s)\n\nstrConcat : String -> String -> String\nstrConcat a b = builtin("str.concat@1", a, b)\n\nstrSlice : String -> Int -> Int -> String\nstrSlice s start len = builtin("str.slice@1", s, start, len)\n\nindexOf : String -> String -> Int\nindexOf s needle = builtin("str.indexOf@1", s, needle)\n\nstrContains : String -> String -> Bool\nstrContains s needle = indexOf(s, needle) > -1\n\nsplit : String -> String -> List String\nsplit s sep = builtin("str.split@1", s, sep)\n\ntoUpper : String -> String\ntoUpper s = builtin("str.toUpper@1", s)\n\ntoLower : String -> String\ntoLower s = builtin("str.toLower@1", s)\n\ntrim : String -> String\ntrim s = builtin("str.trim@1", s)\n\nfromInt : Int -> String\nfromInt n = builtin("str.fromInt@1", n)\n\nreplace : String -> String -> String -> String\nreplace s from to = builtin("str.replace@1", s, from, to)\n\nparseInt : String -> Option Int\nparseInt s =\n  let r = builtin("str.toInt@1", s) in\n  if r == unit then None else Some(r)\n\n-- Regex strings (host-backed regex.* FFI builtins) ---------------------------\n\nregexTest : String -> String -> Bool\nregexTest pattern input = builtin("regex.test@1", pattern, input)\n\nregexFindAll : String -> String -> List String\nregexFindAll pattern input = builtin("regex.findAll@1", pattern, input)\n\nregexReplace : String -> String -> String -> String\nregexReplace pattern replacement input = builtin("regex.replace@1", pattern, replacement, input)\n\nregexSplit : String -> String -> List String\nregexSplit pattern input = builtin("regex.split@1", pattern, input)\n\n-- JSON decoders / encoders ---------------------------------------------------\n\njsonValueDecoder : Decoder Json\njsonValueDecoder = Decoder({ kind = "value" })\n\njsonIntDecoder : Decoder Int\njsonIntDecoder = Decoder({ kind = "int" })\n\njsonStringDecoder : Decoder String\njsonStringDecoder = Decoder({ kind = "string" })\n\njsonBoolDecoder : Decoder Bool\njsonBoolDecoder = Decoder({ kind = "bool" })\n\njsonField : String -> Decoder a -> Decoder a\njsonField name decoder =\n  match decoder { Decoder recipe -> Decoder({ kind = "field", name = name, decoder = recipe }) }\n\njsonListDecoder : Decoder a -> Decoder (List a)\njsonListDecoder decoder =\n  match decoder { Decoder recipe -> Decoder({ kind = "list", decoder = recipe }) }\n\njsonNullable : Decoder a -> Decoder (Option a)\njsonNullable decoder =\n  match decoder { Decoder recipe -> Decoder({ kind = "nullable", decoder = recipe }) }\n\njsonDecodeValue : Decoder a -> Json -> Result String a\njsonDecodeValue decoder value =\n  match decoder { Decoder recipe -> builtin("json.decodeValue@1", recipe, value) }\n\njsonDecodeString : Decoder a -> String -> Result String a\njsonDecodeString decoder source =\n  match decoder { Decoder recipe -> builtin("json.decodeString@1", recipe, source) }\n\njsonValueEncoder : Encoder Json\njsonValueEncoder = Encoder({ kind = "value" })\n\njsonIntEncoder : Encoder Int\njsonIntEncoder = Encoder({ kind = "int" })\n\njsonStringEncoder : Encoder String\njsonStringEncoder = Encoder({ kind = "string" })\n\njsonBoolEncoder : Encoder Bool\njsonBoolEncoder = Encoder({ kind = "bool" })\n\njsonListEncoder : Encoder a -> Encoder (List a)\njsonListEncoder encoder =\n  match encoder { Encoder recipe -> Encoder({ kind = "list", encoder = recipe }) }\n\njsonNullableEncoder : Encoder a -> Encoder (Option a)\njsonNullableEncoder encoder =\n  match encoder { Encoder recipe -> Encoder({ kind = "nullable", encoder = recipe }) }\n\njsonEncodeValue : Encoder a -> a -> Json\njsonEncodeValue encoder value =\n  match encoder { Encoder recipe -> builtin("json.encodeValue@1", recipe, value) }\n\njsonEncodeString : Encoder a -> a -> String\njsonEncodeString encoder value =\n  match encoder { Encoder recipe -> builtin("json.encodeString@1", recipe, value) }\n\njsonNull : Json\njsonNull = builtin("json.null@1")\n\njsonPair : String -> Json -> { key : String, value : Json }\njsonPair key value = { key = key, value = value }\n\njsonObject : List { key : String, value : Json } -> Json\njsonObject fields = builtin("json.object@1", fields)\n\n-- Math -----------------------------------------------------------------------\n\nmax : Int -> Int -> Int\nmax a b = if a > b then a else b\n\nmin : Int -> Int -> Int\nmin a b = if a < b then a else b\n\nabs : Int -> Int\nabs n = if n < 0 then 0 - n else n\n\nclamp : Int -> Int -> Int -> Int\nclamp lo hi n = max(lo, min(hi, n))\n\ngcd : Int -> Int -> Int\ngcd a b = builtin("math.gcd@1", a, b)\n\nlcm : Int -> Int -> Int\nlcm a b = builtin("math.lcm@1", a, b)\n\npow : Int -> Int -> Int\npow base exp = builtin("math.pow@1", base, exp)\n\nsqrtFloor : Int -> Int\nsqrtFloor n = builtin("math.sqrtFloor@1", n)\n\n-- HTTP -----------------------------------------------------------------------\n\nhttpGet : String -> { status : Int, ok : Bool, body : String }\nhttpGet url = builtin("http.get@1", url)\n\nhttpPost : String -> String -> { status : Int, ok : Bool, body : String }\nhttpPost url body = builtin("http.post@1", url, body)\n\n-- System I/O -----------------------------------------------------------------\n\nsysLog : String -> Unit\nsysLog msg = builtin("sys.log@1", msg)\n\nsysCwd : String\nsysCwd = builtin("sys.cwd@1")\n\nsysReadText : String -> Option String\nsysReadText path =\n  let r = builtin("sys.readText@1", path) in\n  if r == unit then None else Some(r)\n\nsysWriteText : String -> String -> Bool\nsysWriteText path contents = builtin("sys.writeText@1", path, contents)\n\nsysEnv : String -> Option String\nsysEnv name =\n  let r = builtin("sys.env@1", name) in\n  if r == unit then None else Some(r)\n\n-- Data processing (host-backed fast paths) ----------------------------------\n\nsortInts : List Int -> List Int\nsortInts xs = builtin("data.sortInts@1", xs)\n\ndistinctInts : List Int -> List Int\ndistinctInts xs = builtin("data.distinctInts@1", xs)\n\nsumIntsFast : List Int -> Int\nsumIntsFast xs = builtin("data.sumInts@1", xs)\n\naverageFloor : List Int -> Int\naverageFloor xs = builtin("data.averageFloor@1", xs)\n\nstatsMin : List Int -> Int\nstatsMin xs = builtin("stats.min@1", xs)\n\nstatsMax : List Int -> Int\nstatsMax xs = builtin("stats.max@1", xs)\n\nmeanFloor : List Int -> Int\nmeanFloor xs = builtin("stats.meanFloor@1", xs)\n\nmedian : List Int -> Int\nmedian xs = builtin("stats.median@1", xs)\n\npercentileNearest : Int -> List Int -> Int\npercentileNearest pct xs = builtin("stats.percentileNearest@1", pct, xs)\n\nvarianceFloor : List Int -> Int\nvarianceFloor xs = builtin("stats.varianceFloor@1", xs)\n\nstddevFloor : List Int -> Int\nstddevFloor xs = builtin("stats.stddevFloor@1", xs)\n\ndescribeInts : List Int -> { count : Int, sum : Int, min : Int, max : Int, mean : Int, median : Int, variance : Int, stddev : Int }\ndescribeInts xs = builtin("stats.describeInts@1", xs)\n\nvalueCountsInts : List Int -> List { value : Int, count : Int }\nvalueCountsInts xs = builtin("stats.valueCountsInts@1", xs)\n\nrollingSumInts : Int -> List Int -> List Int\nrollingSumInts window xs = builtin("stats.rollingSumInts@1", window, xs)\n\n-- Technical-analysis / time-series indicators -------------------------------\n-- Integer series in, integer series out. Feed scaled prices if you need fixed\n-- decimal precision.\n\nsma : List Int -> Int -> List Int\nsma src period = builtin("series.sma@1", src, period)\n\nema : List Int -> Int -> List Int\nema src period = builtin("series.ema@1", src, period)\n\nwma : List Int -> Int -> List Int\nwma src period = builtin("series.wma@1", src, period)\n\nrollingMedian : List Int -> Int -> List Int\nrollingMedian src period = builtin("series.rollingMedian@1", src, period)\n\nmomentum : List Int -> Int -> List Int\nmomentum src period = builtin("series.momentum@1", src, period)\n\nroc : List Int -> Int -> List Int\nroc src period = builtin("series.roc@1", src, period)\n\nrsi : List Int -> Int -> List Int\nrsi src period = builtin("series.rsi@1", src, period)\n\nmacd : List Int -> Int -> Int -> List Int\nmacd src fast slow = builtin("series.macd@1", src, fast, slow)\n\nmacdSignal : List Int -> Int -> Int -> Int -> List Int\nmacdSignal src fast slow sig = builtin("series.macdSignal@1", src, fast, slow, sig)\n\nmacdHistogram : List Int -> Int -> Int -> Int -> List Int\nmacdHistogram src fast slow sig = builtin("series.macdHistogram@1", src, fast, slow, sig)\n\nslope : List Int -> Int -> List Int\nslope src period = builtin("series.slope@1", src, period)\n\nrollingStd : List Int -> Int -> List Int\nrollingStd src period = builtin("series.rollingStd@1", src, period)\n\nrealizedVol : List Int -> Int -> List Int\nrealizedVol src period = builtin("series.realizedVol@1", src, period)\n\newmStd : List Int -> Int -> List Int\newmStd src period = builtin("series.ewmStd@1", src, period)\n\nstdevRatio : List Int -> Int -> Int -> List Int\nstdevRatio src short long = builtin("series.stdevRatio@1", src, short, long)\n\natrApprox : List Int -> Int -> List Int\natrApprox src period = builtin("series.atrApprox@1", src, period)\n\nbollingerUpper : List Int -> Int -> Int -> List Int\nbollingerUpper src period nstd = builtin("series.bollingerUpper@1", src, period, nstd)\n\nbollingerLower : List Int -> Int -> Int -> List Int\nbollingerLower src period nstd = builtin("series.bollingerLower@1", src, period, nstd)\n\nzscore : List Int -> Int -> List Int\nzscore src period = builtin("series.zscore@1", src, period)\n\npercentileRank : List Int -> Int -> List Int\npercentileRank src period = builtin("series.percentileRank@1", src, period)\n\ndrawdown : List Int -> List Int\ndrawdown src = builtin("series.drawdown@1", src)\n\npctChange : List Int -> Int -> List Int\npctChange src period = builtin("series.pctChange@1", src, period)\n\nratio : List Int -> List Int -> List Int\nratio a b = builtin("series.ratio@1", a, b)\n\nspread : List Int -> List Int -> List Int\nspread a b = builtin("series.spread@1", a, b)\n\nrollingCorr : List Int -> List Int -> Int -> List Int\nrollingCorr a b period = builtin("series.rollingCorr@1", a, b, period)\n\nrollingBeta : List Int -> List Int -> Int -> List Int\nrollingBeta a b period = builtin("series.rollingBeta@1", a, b, period)\n\nrelativeMomentum : List Int -> List Int -> Int -> List Int\nrelativeMomentum a b period = builtin("series.relativeMomentum@1", a, b, period)\n\nhedgeRatio : List Int -> List Int -> Int -> List Int\nhedgeRatio a b period = builtin("series.hedgeRatio@1", a, b, period)\n\nadd : List Int -> List Int -> List Int\nadd a b = builtin("series.add@1", a, b)\n\nsub : List Int -> List Int -> List Int\nsub a b = builtin("series.sub@1", a, b)\n\nmul : List Int -> List Int -> List Int\nmul a b = builtin("series.mul@1", a, b)\n\ndiv : List Int -> List Int -> List Int\ndiv a b = builtin("series.div@1", a, b)\n\nseriesAbs : List Int -> List Int\nseriesAbs src = builtin("series.abs@1", src)\n\nclip : List Int -> Int -> Int -> List Int\nclip src lo hi = builtin("series.clip@1", src, lo, hi)\n\nshift : List Int -> Int -> List Int\nshift src period = builtin("series.shift@1", src, period)\n\ndiff : List Int -> List Int\ndiff src = builtin("series.diff@1", src)\n\nlog : List Int -> List Int\nlog src = builtin("series.log@1", src)\n\nrollingMax : List Int -> Int -> List Int\nrollingMax src period = builtin("series.rollingMax@1", src, period)\n\nrollingMin : List Int -> Int -> List Int\nrollingMin src period = builtin("series.rollingMin@1", src, period)\n\ncummax : List Int -> List Int\ncummax src = builtin("series.cummax@1", src)\n\ncummin : List Int -> List Int\ncummin src = builtin("series.cummin@1", src)\n\ncrossover : List Int -> List Int -> List Int\ncrossover a b = builtin("series.crossover@1", a, b)\n\ncrossunder : List Int -> List Int -> List Int\ncrossunder a b = builtin("series.crossunder@1", a, b)\n\natrOhlc : List Int -> List Int -> List Int -> Int -> List Int\natrOhlc high low close period = builtin("series.atrOhlc@1", high, low, close, period)\n\ntrueRange : List Int -> List Int -> List Int -> List Int\ntrueRange high low close = builtin("series.trueRange@1", high, low, close)\n\nvwap : List Int -> List Int -> Int -> List Int\nvwap close volume period = builtin("series.vwap@1", close, volume, period)\n\nobv : List Int -> List Int -> List Int\nobv close volume = builtin("series.obv@1", close, volume)\n\nvolumeSma : List Int -> Int -> List Int\nvolumeSma volume period = builtin("series.volumeSma@1", volume, period)\n\nvolumeRatio : List Int -> Int -> List Int\nvolumeRatio volume period = builtin("series.volumeRatio@1", volume, period)\n\nbodySize : List Int -> List Int -> List Int\nbodySize open close = builtin("series.bodySize@1", open, close)\n\nupperWick : List Int -> List Int -> List Int -> List Int\nupperWick high open close = builtin("series.upperWick@1", high, open, close)\n\nlowerWick : List Int -> List Int -> List Int -> List Int\nlowerWick low open close = builtin("series.lowerWick@1", low, open, close)\n\nrangePct : List Int -> List Int -> List Int\nrangePct high low = builtin("series.rangePct@1", high, low)\n\n-- List predicates & search --------------------------------------------------\n\nallGo : (a -> Bool) -> List a -> Int -> Bool\nallGo f xs i =\n  if i == length(xs) then True\n  else if f(get(xs, i)) then allGo(f, xs, i + 1)\n  else False\n\nall : (a -> Bool) -> List a -> Bool\nall f xs = allGo(f, xs, 0)\n\nanyGo : (a -> Bool) -> List a -> Int -> Bool\nanyGo f xs i =\n  if i == length(xs) then False\n  else if f(get(xs, i)) then True\n  else anyGo(f, xs, i + 1)\n\nany : (a -> Bool) -> List a -> Bool\nany f xs = anyGo(f, xs, 0)\n\ncountGo : (a -> Bool) -> List a -> Int -> Int -> Int\ncountGo f xs i acc =\n  if i == length(xs) then acc\n  else if f(get(xs, i)) then countGo(f, xs, i + 1, acc + 1)\n  else countGo(f, xs, i + 1, acc)\n\ncount : (a -> Bool) -> List a -> Int\ncount f xs = countGo(f, xs, 0, 0)\n\nfindGo : (a -> Bool) -> List a -> Int -> Option a\nfindGo f xs i =\n  if i == length(xs) then None\n  else if f(get(xs, i)) then Some(get(xs, i))\n  else findGo(f, xs, i + 1)\n\nfind : (a -> Bool) -> List a -> Option a\nfind f xs = findGo(f, xs, 0)\n\nflatMapGo : (a -> List b) -> List a -> Int -> List b -> List b\nflatMapGo f xs i acc =\n  if i == length(xs) then acc\n  else flatMapGo(f, xs, i + 1, concat(acc, f(get(xs, i))))\n\nflatMap : (a -> List b) -> List a -> List b\nflatMap f xs = flatMapGo(f, xs, 0, [])\n\nreplicateGo : Int -> a -> Int -> List a -> List a\nreplicateGo n x i acc =\n  if i == n then acc\n  else replicateGo(n, x, i + 1, append(acc, x))\n\nreplicate : Int -> a -> List a\nreplicate n x = replicateGo(n, x, 0, [])\n\nhead : List a -> Option a\nhead xs = if isEmpty(xs) then None else Some(xs[0])\n\nlast : List a -> Option a\nlast xs = if isEmpty(xs) then None else Some(xs[length(xs) - 1])\n\n-- String formatting ----------------------------------------------------------\n\njoinGo : String -> List String -> Int -> String -> String\njoinGo sep parts i acc =\n  if i == length(parts) then acc\n  else joinGo(sep, parts, i + 1, strConcat(acc, strConcat(sep, parts[i])))\n\njoin : String -> List String -> String\njoin sep parts =\n  if isEmpty(parts) then ""\n  else joinGo(sep, parts, 1, parts[0])\n\nstartsWith : String -> String -> Bool\nstartsWith s prefix = strSlice(s, 0, strLength(prefix)) == prefix\n\nendsWith : String -> String -> Bool\nendsWith s suffix =\n  strSlice(s, strLength(s) - strLength(suffix), strLength(suffix)) == suffix\n\nrepeatGo : Int -> String -> Int -> String -> String\nrepeatGo n s i acc =\n  if i == n then acc\n  else repeatGo(n, s, i + 1, strConcat(acc, s))\n\nrepeat : Int -> String -> String\nrepeat n s = repeatGo(n, s, 0, "")\n\n-- Option combinators ---------------------------------------------------------\n\nandThen : (a -> Option b) -> Option a -> Option b\nandThen f o = match o { Some v -> f(v), None -> None }\n\norElse : Option a -> Option a -> Option a\norElse fallback o = match o { Some v -> Some(v), None -> fallback }\n\n-- Result helpers -------------------------------------------------------------\n\nisOk : Result e a -> Bool\nisOk r = match r { Ok v -> True, Err e -> False }\n\nokOr : a -> Result e a -> a\nokOr d r = match r { Ok v -> v, Err e -> d }\n\nmapResult : (a -> b) -> Result e a -> Result e b\nmapResult f r = match r { Ok v -> Ok(f(v)), Err e -> Err(e) }\n\n-- Actors ---------------------------------------------------------------------\n\nactorPid : ActorRef m -> Pid\nactorPid ref = match ref { MkActorRef pid -> pid }\n\nactorSelf : Unit -> ActorRef m\nactorSelf _ = MkActorRef(self())\n\nactorReceive : Unit -> m\nactorReceive _ = recv()\n\nactorSend : ActorRef m -> m -> Unit\nactorSend ref msg = send(actorPid(ref), msg)\n\nactorReply : ActorRef m -> m -> Unit\nactorReply ref msg = actorSend(ref, msg)\n\nactorCall : ActorRef m -> (Pid -> m) -> r\nactorCall ref make =\n  let me = self() in\n  let _ = actorSend(ref, make(me)) in\n  recv()\n\nactorContinue : s -> { stop : Bool, state : s }\nactorContinue state = { stop = False, state = state }\n\nactorStop : s -> { stop : Bool, state : s }\nactorStop state = { stop = True, state = state }\n\nactorLoop : (m -> s -> { stop : Bool, state : s }) -> s -> Unit\nactorLoop handle state =\n  let msg = actorReceive(unit) in\n  let next = handle(msg, state) in\n  if next.stop then unit else actorLoop(handle, next.state)\n\n-- Database (encrypted, indexed, persistent) ----------------------------------\n\ndbInsert : String -> Json -> String\ndbInsert table record = builtin("db.insert@1", table, record)\n\ndbGet : String -> String -> Json\ndbGet table id = builtin("db.get@1", table, id)\n\nwithDefault : a -> Option a -> a\nwithDefault d o = match o { Some v -> v, None -> d }\n\nisSome : Option a -> Bool\nisSome o = match o { Some v -> True, None -> False }\n\n-- Assumes db.get@1 yields unit when a row is missing; the reference VM uses\n-- that sentinel, so this wrapper turns it into a typed Option.\ndbGetOpt : String -> String -> Option Json\ndbGetOpt table id =\n  let r = builtin("db.get@1", table, id) in\n  if r == unit then None else Some(r)\n\ndbUpdate : String -> String -> Json -> Bool\ndbUpdate table id record = builtin("db.update@1", table, id, record)\n\ndbDelete : String -> String -> Bool\ndbDelete table id = builtin("db.delete@1", table, id)\n\ndbQuery : String -> Json -> List Json\ndbQuery table filter = builtin("db.query@1", table, filter, {})\n\ndbCreateIndex : String -> String -> Unit\ndbCreateIndex table field = builtin("db.createIndex@1", table, field)\n\ndbHash : String -> String\ndbHash table = builtin("db.hash@1", table)\n\n-- Cache (fast RAM) -----------------------------------------------------------\n\ncacheSet : String -> String -> Json -> Bool\ncacheSet ns key value = builtin("cache.set@1", ns, key, value)\n\ncacheGet : String -> String -> Json\ncacheGet ns key = builtin("cache.get@1", ns, key)\n\ncacheDelete : String -> String -> Bool\ncacheDelete ns key = builtin("cache.delete@1", ns, key)\n';

  // .tmp-verdict-build/output/Verdict.Std.Resolve/index.js
  var map27 = /* @__PURE__ */ map(functorArray);
  var member8 = /* @__PURE__ */ member4(ordString);
  var insert10 = /* @__PURE__ */ insert5(ordString);
  var lookup8 = /* @__PURE__ */ lookup2(ordString);
  var bind8 = /* @__PURE__ */ bind(bindEither);
  var append14 = /* @__PURE__ */ append(semigroupArray);
  var append22 = /* @__PURE__ */ append(/* @__PURE__ */ semigroupSet(ordString));
  var fromFoldable17 = /* @__PURE__ */ fromFoldable6(foldableArray)(ordString);
  var traverse_3 = /* @__PURE__ */ traverse_(applicativeEither)(foldableArray);
  var toUnfoldable9 = /* @__PURE__ */ toUnfoldable6(unfoldableArray);
  var discard5 = /* @__PURE__ */ discard(discardUnit)(bindEither);
  var pure8 = /* @__PURE__ */ pure(applicativeEither);
  var typeName2 = function(v) {
    return v.value0;
  };
  var ctorNames2 = function(v) {
    return map27(function(v1) {
      return v1.name;
    })(v.value2);
  };
  var checkUnique = function(what) {
    var go = function($copy_seen) {
      return function($copy_arr) {
        var $tco_var_seen = $copy_seen;
        var $tco_done = false;
        var $tco_result;
        function $tco_loop(seen, arr) {
          var v = uncons(arr);
          if (v instanceof Nothing) {
            $tco_done = true;
            return new Right(unit);
          }
          ;
          if (v instanceof Just) {
            if (member8(v.value0.head)(seen)) {
              $tco_done = true;
              return new Left("duplicate " + (what + (" across modules: '" + (v.value0.head + "'"))));
            }
            ;
            if (otherwise) {
              $tco_var_seen = insert10(v.value0.head)(seen);
              $copy_arr = v.value0.tail;
              return;
            }
            ;
          }
          ;
          throw new Error("Failed pattern match at Verdict.Std.Resolve (line 74, column 17 - line 78, column 52): " + [v.constructor.name]);
        }
        ;
        while (!$tco_done) {
          $tco_result = $tco_loop($tco_var_seen, $copy_arr);
        }
        ;
        return $tco_result;
      };
    };
    return go(empty4);
  };
  var resolveProject = function(mods) {
    return function(entry) {
      var requireModule = function(n) {
        var v = lookup8(n)(mods);
        if (v instanceof Just) {
          return new Right(v.value0);
        }
        ;
        if (v instanceof Nothing) {
          return new Left("module not found: '" + (n + "'"));
        }
        ;
        throw new Error("Failed pattern match at Verdict.Std.Resolve (line 35, column 21 - line 37, column 56): " + [v.constructor.name]);
      };
      var gather = function(seen) {
        return function(frontier) {
          var v = uncons(frontier);
          if (v instanceof Nothing) {
            return new Right(seen);
          }
          ;
          if (v instanceof Just) {
            if (member8(v.value0.head)(seen)) {
              return gather(seen)(v.value0.tail);
            }
            ;
            if (otherwise) {
              return bind8(requireModule(v.value0.head))(function(pm) {
                return gather(insert10(v.value0.head)(seen))(append14(v.value0.tail)(map27(function(v1) {
                  return v1.mod;
                })(pm.imports)));
              });
            }
            ;
          }
          ;
          throw new Error("Failed pattern match at Verdict.Std.Resolve (line 41, column 26 - line 47, column 71): " + [v.constructor.name]);
        };
      };
      var exportsOf = function(pm) {
        if (pm.exposing instanceof ExposeAll) {
          return append22(fromFoldable17(map27(declName)(moduleDecls(pm.mod))))(append22(fromFoldable17(concatMap(ctorNames2)(moduleTypes(pm.mod))))(fromFoldable17(map27(typeName2)(moduleTypes(pm.mod)))));
        }
        ;
        if (pm.exposing instanceof ExposeNames) {
          return fromFoldable17(pm.exposing.value0);
        }
        ;
        throw new Error("Failed pattern match at Verdict.Std.Resolve (line 64, column 18 - line 69, column 42): " + [pm.exposing.constructor.name]);
      };
      var checkExposed = function(here) {
        return function(from2) {
          return function(exports) {
            return function(n) {
              var $47 = member8(n)(exports);
              if ($47) {
                return new Right(unit);
              }
              ;
              return new Left("module '" + (here + ("' imports '" + (n + ("' from '" + (from2 + "', which does not export it"))))));
            };
          };
        };
      };
      var checkImport = function(here) {
        return function(imp) {
          return bind8(requireModule(imp.mod))(function(target) {
            if (imp.names instanceof ExposeAll) {
              return new Right(unit);
            }
            ;
            if (imp.names instanceof ExposeNames) {
              return traverse_3(checkExposed(here)(imp.mod)(exportsOf(target)))(imp.names.value0);
            }
            ;
            throw new Error("Failed pattern match at Verdict.Std.Resolve (line 53, column 5 - line 55, column 84): " + [imp.names.constructor.name]);
          });
        };
      };
      var checkModuleImports = function(pm) {
        return traverse_3(checkImport(moduleName(pm.mod)))(pm.imports);
      };
      return bind8(requireModule(entry))(function() {
        return bind8(gather(empty4)([entry]))(function(reachable2) {
          var reachMods = mapMaybe(function(n) {
            return lookup8(n)(mods);
          })(toUnfoldable9(reachable2));
          return discard5(traverse_3(checkModuleImports)(reachMods))(function() {
            var allDecls = concatMap(function($50) {
              return moduleDecls(function(v) {
                return v.mod;
              }($50));
            })(reachMods);
            var allTypes = concatMap(function($51) {
              return moduleTypes(function(v) {
                return v.mod;
              }($51));
            })(reachMods);
            return discard5(checkUnique("definition")(map27(declName)(allDecls)))(function() {
              return discard5(checkUnique("constructor")(concatMap(ctorNames2)(allTypes)))(function() {
                return discard5(checkUnique("type")(map27(typeName2)(allTypes)))(function() {
                  return pure8(new Module(entry, allTypes, allDecls));
                });
              });
            });
          });
        });
      });
    };
  };

  // .tmp-verdict-build/output/Verdict.Typecheck/index.js
  var lookup9 = /* @__PURE__ */ lookup2(ordString);
  var discard6 = /* @__PURE__ */ discard(discardUnit)(bindEither);
  var when3 = /* @__PURE__ */ when(applicativeEither);
  var traverse_4 = /* @__PURE__ */ traverse_(applicativeEither)(foldableArray);
  var applySecond5 = /* @__PURE__ */ applySecond(applyEither);
  var show6 = /* @__PURE__ */ show(showInt);
  var show15 = /* @__PURE__ */ show(showTy);
  var map28 = /* @__PURE__ */ map(functorMaybe);
  var foldr6 = /* @__PURE__ */ foldr(foldableArray);
  var eq22 = /* @__PURE__ */ eq(eqTy);
  var insert11 = /* @__PURE__ */ insert2(ordString);
  var bind9 = /* @__PURE__ */ bind(bindEither);
  var foldM3 = /* @__PURE__ */ foldM(monadEither);
  var map112 = /* @__PURE__ */ map(functorArray);
  var traverse4 = /* @__PURE__ */ traverse(traversableArray)(applicativeEither);
  var map29 = /* @__PURE__ */ map(functorEither);
  var union5 = /* @__PURE__ */ union(ordString);
  var fromFoldable18 = /* @__PURE__ */ fromFoldable3(ordString)(foldableArray);
  var eq32 = /* @__PURE__ */ eq(eqPattern);
  var eq4 = /* @__PURE__ */ eq(/* @__PURE__ */ eqSet(eqString));
  var fromFoldable19 = /* @__PURE__ */ fromFoldable6(foldableArray)(ordString);
  var append15 = /* @__PURE__ */ append(semigroupArray);
  var Located = /* @__PURE__ */ function() {
    function Located2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    Located2.create = function(value0) {
      return function(value1) {
        return new Located2(value0, value1);
      };
    };
    return Located2;
  }();
  var MissingSignature = /* @__PURE__ */ function() {
    function MissingSignature2(value0) {
      this.value0 = value0;
    }
    ;
    MissingSignature2.create = function(value0) {
      return new MissingSignature2(value0);
    };
    return MissingSignature2;
  }();
  var SigArityMismatch = /* @__PURE__ */ function() {
    function SigArityMismatch2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    SigArityMismatch2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new SigArityMismatch2(value0, value1, value2);
        };
      };
    };
    return SigArityMismatch2;
  }();
  var UnknownName = /* @__PURE__ */ function() {
    function UnknownName2(value0) {
      this.value0 = value0;
    }
    ;
    UnknownName2.create = function(value0) {
      return new UnknownName2(value0);
    };
    return UnknownName2;
  }();
  var FunctionAsValue = /* @__PURE__ */ function() {
    function FunctionAsValue2(value0) {
      this.value0 = value0;
    }
    ;
    FunctionAsValue2.create = function(value0) {
      return new FunctionAsValue2(value0);
    };
    return FunctionAsValue2;
  }();
  var SpawnRequiresFunction = /* @__PURE__ */ function() {
    function SpawnRequiresFunction2() {
    }
    ;
    SpawnRequiresFunction2.value = new SpawnRequiresFunction2();
    return SpawnRequiresFunction2;
  }();
  var NotAFunction = /* @__PURE__ */ function() {
    function NotAFunction2(value0) {
      this.value0 = value0;
    }
    ;
    NotAFunction2.create = function(value0) {
      return new NotAFunction2(value0);
    };
    return NotAFunction2;
  }();
  var CallArityMismatch = /* @__PURE__ */ function() {
    function CallArityMismatch2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    CallArityMismatch2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new CallArityMismatch2(value0, value1, value2);
        };
      };
    };
    return CallArityMismatch2;
  }();
  var Mismatch = /* @__PURE__ */ function() {
    function Mismatch2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    Mismatch2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new Mismatch2(value0, value1, value2);
        };
      };
    };
    return Mismatch2;
  }();
  var NotNumeric = /* @__PURE__ */ function() {
    function NotNumeric2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    NotNumeric2.create = function(value0) {
      return function(value1) {
        return new NotNumeric2(value0, value1);
      };
    };
    return NotNumeric2;
  }();
  var NoField = /* @__PURE__ */ function() {
    function NoField2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    NoField2.create = function(value0) {
      return function(value1) {
        return new NoField2(value0, value1);
      };
    };
    return NoField2;
  }();
  var NotARecord = /* @__PURE__ */ function() {
    function NotARecord2(value0) {
      this.value0 = value0;
    }
    ;
    NotARecord2.create = function(value0) {
      return new NotARecord2(value0);
    };
    return NotARecord2;
  }();
  var SwitchNoDefault = /* @__PURE__ */ function() {
    function SwitchNoDefault2() {
    }
    ;
    SwitchNoDefault2.value = new SwitchNoDefault2();
    return SwitchNoDefault2;
  }();
  var UnknownType = /* @__PURE__ */ function() {
    function UnknownType2(value0) {
      this.value0 = value0;
    }
    ;
    UnknownType2.create = function(value0) {
      return new UnknownType2(value0);
    };
    return UnknownType2;
  }();
  var UnknownConstructor = /* @__PURE__ */ function() {
    function UnknownConstructor2(value0) {
      this.value0 = value0;
    }
    ;
    UnknownConstructor2.create = function(value0) {
      return new UnknownConstructor2(value0);
    };
    return UnknownConstructor2;
  }();
  var ConstructorArityMismatch = /* @__PURE__ */ function() {
    function ConstructorArityMismatch2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    ConstructorArityMismatch2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new ConstructorArityMismatch2(value0, value1, value2);
        };
      };
    };
    return ConstructorArityMismatch2;
  }();
  var MatchNonData = /* @__PURE__ */ function() {
    function MatchNonData2(value0) {
      this.value0 = value0;
    }
    ;
    MatchNonData2.create = function(value0) {
      return new MatchNonData2(value0);
    };
    return MatchNonData2;
  }();
  var MatchWrongConstructor = /* @__PURE__ */ function() {
    function MatchWrongConstructor2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    MatchWrongConstructor2.create = function(value0) {
      return function(value1) {
        return new MatchWrongConstructor2(value0, value1);
      };
    };
    return MatchWrongConstructor2;
  }();
  var MatchNonExhaustive = /* @__PURE__ */ function() {
    function MatchNonExhaustive2(value0) {
      this.value0 = value0;
    }
    ;
    MatchNonExhaustive2.create = function(value0) {
      return new MatchNonExhaustive2(value0);
    };
    return MatchNonExhaustive2;
  }();
  var DataArityMismatch = /* @__PURE__ */ function() {
    function DataArityMismatch2(value0, value1, value2) {
      this.value0 = value0;
      this.value1 = value1;
      this.value2 = value2;
    }
    ;
    DataArityMismatch2.create = function(value0) {
      return function(value1) {
        return function(value2) {
          return new DataArityMismatch2(value0, value1, value2);
        };
      };
    };
    return DataArityMismatch2;
  }();
  var validateTy = function(dataTypes) {
    return function(v) {
      if (v instanceof TData) {
        var v1 = lookup9(v.value0)(dataTypes);
        if (v1 instanceof Nothing) {
          return new Left(new UnknownType(v.value0));
        }
        ;
        if (v1 instanceof Just) {
          return discard6(when3(length(v.value1) !== length(v1.value0.params))(new Left(new DataArityMismatch(v.value0, length(v1.value0.params), length(v.value1)))))(function() {
            return traverse_4(validateTy(dataTypes))(v.value1);
          });
        }
        ;
        throw new Error("Failed pattern match at Verdict.Typecheck (line 557, column 19 - line 562, column 44): " + [v1.constructor.name]);
      }
      ;
      if (v instanceof TVar) {
        return new Right(unit);
      }
      ;
      if (v instanceof TList) {
        return validateTy(dataTypes)(v.value0);
      }
      ;
      if (v instanceof TRecord) {
        return traverse_4(function() {
          var $444 = validateTy(dataTypes);
          return function($445) {
            return $444(snd($445));
          };
        }())(v.value0);
      }
      ;
      if (v instanceof TArrow) {
        return applySecond5(validateTy(dataTypes)(v.value0))(validateTy(dataTypes)(v.value1));
      }
      ;
      return new Right(unit);
    };
  };
  var showTypeError = function(v) {
    if (v instanceof Located) {
      return show6(v.value0.line) + (":" + (show6(v.value0.column) + (": " + showTypeError(v.value1))));
    }
    ;
    if (v instanceof MissingSignature) {
      return "missing required type signature for '" + (v.value0 + "'");
    }
    ;
    if (v instanceof SigArityMismatch) {
      return "signature for '" + (v.value0 + ("' declares " + (show6(v.value1) + (" parameter(s) but the definition binds " + show6(v.value2)))));
    }
    ;
    if (v instanceof UnknownName) {
      return "unknown name '" + (v.value0 + "'");
    }
    ;
    if (v instanceof FunctionAsValue) {
      return "'" + (v.value0 + "' is a function and cannot be used as a value (no higher-order functions)");
    }
    ;
    if (v instanceof SpawnRequiresFunction) {
      return "spawn expects a bare top-level function name as its first argument";
    }
    ;
    if (v instanceof NotAFunction) {
      return "'" + (v.value0 + "' is not a function and cannot be called");
    }
    ;
    if (v instanceof CallArityMismatch) {
      return "'" + (v.value0 + ("' expects " + (show6(v.value1) + (" argument(s) but got " + show6(v.value2)))));
    }
    ;
    if (v instanceof Mismatch) {
      return "type mismatch in " + (v.value0 + (": expected " + (show15(v.value1) + (", got " + show15(v.value2)))));
    }
    ;
    if (v instanceof NotNumeric) {
      return "operator " + (v.value0 + (" needs a number (Int, Fixed, or Rational), got " + show15(v.value1)));
    }
    ;
    if (v instanceof NoField) {
      return "record has no field '" + (v.value0 + ("' (" + (show15(v.value1) + ")")));
    }
    ;
    if (v instanceof NotARecord) {
      return "field access on a non-record value of type " + show15(v.value0);
    }
    ;
    if (v instanceof SwitchNoDefault) {
      return "switch is missing a required `_` (default) arm";
    }
    ;
    if (v instanceof UnknownType) {
      return "unknown type '" + (v.value0 + "'");
    }
    ;
    if (v instanceof UnknownConstructor) {
      return "unknown constructor '" + (v.value0 + "'");
    }
    ;
    if (v instanceof ConstructorArityMismatch) {
      return "constructor '" + (v.value0 + ("' expects " + (show6(v.value1) + (" argument(s) but got " + show6(v.value2)))));
    }
    ;
    if (v instanceof MatchNonData) {
      return "match scrutinee must be a sum type, got " + show15(v.value0);
    }
    ;
    if (v instanceof MatchWrongConstructor) {
      return "constructor '" + (v.value0 + ("' does not belong to type '" + (v.value1 + "'")));
    }
    ;
    if (v instanceof MatchNonExhaustive) {
      return "match on '" + (v.value0 + "' is not exhaustive");
    }
    ;
    if (v instanceof DataArityMismatch) {
      return "type '" + (v.value0 + ("' expects " + (show6(v.value1) + (" type argument(s) but got " + show6(v.value2)))));
    }
    ;
    throw new Error("Failed pattern match at Verdict.Typecheck (line 43, column 17 - line 69, column 91): " + [v.constructor.name]);
  };
  var showCmp = /* @__PURE__ */ show(showCmpOp);
  var showBin = /* @__PURE__ */ show(showBinOp);
  var schemeOf = function(v) {
    if (v.sig instanceof Nothing) {
      return new Left(new MissingSignature(v.name));
    }
    ;
    if (v.sig instanceof Just) {
      var nparams = length(v.params);
      var $151 = typeArity(v.sig.value0) < nparams;
      if ($151) {
        return new Left(new SigArityMismatch(v.name, typeArity(v.sig.value0), nparams));
      }
      ;
      var sp = splitArrow(nparams)(v.sig.value0);
      return new Right({
        params: sp.params,
        ret: sp.result
      });
    }
    ;
    throw new Error("Failed pattern match at Verdict.Typecheck (line 545, column 21 - line 553, column 55): " + [v.sig.constructor.name]);
  };
  var relocate = function(pos) {
    return function(err2) {
      if (err2 instanceof Located) {
        return err2;
      }
      ;
      return new Located(pos, err2);
    };
  };
  var lookupField2 = function(n) {
    return function(fs) {
      return map28(snd)(find2(function(f) {
        return fst(f) === n;
      })(fs));
    };
  };
  var locate = function(v) {
    if (v instanceof Located) {
      return {
        line: v.value0.line,
        column: v.value0.column,
        message: showTypeError(v.value1)
      };
    }
    ;
    return {
      line: 1,
      column: 1,
      message: showTypeError(v)
    };
  };
  var litTy = function(v) {
    if (v instanceof LInt) {
      return TInt.value;
    }
    ;
    if (v instanceof LFixed) {
      return TFixed.value;
    }
    ;
    if (v instanceof LRational) {
      return TRational.value;
    }
    ;
    if (v instanceof LUnit) {
      return TUnit.value;
    }
    ;
    if (v instanceof LBool) {
      return TBool.value;
    }
    ;
    if (v instanceof LStr) {
      return TString.value;
    }
    ;
    throw new Error("Failed pattern match at Verdict.Typecheck (line 528, column 9 - line 534, column 20): " + [v.constructor.name]);
  };
  var listElem = function(v) {
    if (v instanceof TList) {
      return new Just(v.value0);
    }
    ;
    if (v instanceof TUnknown) {
      return new Just(TUnknown.value);
    }
    ;
    return Nothing.value;
  };
  var joinTy = function(v) {
    return function(v1) {
      if (v instanceof TUnknown) {
        return v1;
      }
      ;
      return v;
    };
  };
  var isNumeric = function(v) {
    if (v instanceof TInt) {
      return true;
    }
    ;
    if (v instanceof TFixed) {
      return true;
    }
    ;
    if (v instanceof TRational) {
      return true;
    }
    ;
    if (v instanceof TUnknown) {
      return true;
    }
    ;
    return false;
  };
  var isArrow2 = function(v) {
    if (v instanceof TArrow) {
      return true;
    }
    ;
    return false;
  };
  var globalArrowType = function(globals) {
    return function(name2) {
      var v = lookup9(name2)(globals);
      if (v instanceof Just && !$$null(v.value0.params)) {
        return new Just(foldr6(TArrow.create)(v.value0.ret)(v.value0.params));
      }
      ;
      return Nothing.value;
    };
  };
  var compatible = function(v) {
    return function(v1) {
      if (v instanceof TUnknown) {
        return true;
      }
      ;
      if (v1 instanceof TUnknown) {
        return true;
      }
      ;
      if (v instanceof TVar && v1 instanceof TVar) {
        return v.value0 === v1.value0;
      }
      ;
      if (v instanceof TList && v1 instanceof TList) {
        return compatible(v.value0)(v1.value0);
      }
      ;
      if (v instanceof TArrow && v1 instanceof TArrow) {
        return compatible(v.value0)(v1.value0) && compatible(v.value1)(v1.value1);
      }
      ;
      if (v instanceof TData && v1 instanceof TData) {
        return v.value0 === v1.value0 && (length(v.value1) === length(v1.value1) && all2(function(v2) {
          return compatible(v2.value0)(v2.value1);
        })(zip(v.value1)(v1.value1)));
      }
      ;
      if (v instanceof TRecord && v1 instanceof TRecord) {
        return length(v.value0) === length(v1.value0) && all2(function(v2) {
          var v3 = lookupField2(v2.value0)(v1.value0);
          if (v3 instanceof Just) {
            return compatible(v2.value1)(v3.value0);
          }
          ;
          if (v3 instanceof Nothing) {
            return false;
          }
          ;
          throw new Error("Failed pattern match at Verdict.Typecheck (line 123, column 35 - line 125, column 27): " + [v3.constructor.name]);
        })(v.value0);
      }
      ;
      return eq22(v)(v1);
    };
  };
  var matchTy = function(ctx) {
    return function(s) {
      return function(pat) {
        return function(act) {
          if (pat instanceof TUnknown) {
            return new Right(s);
          }
          ;
          if (act instanceof TUnknown) {
            return new Right(s);
          }
          ;
          if (pat instanceof TVar) {
            var v = lookup9(pat.value0)(s);
            if (v instanceof Just) {
              var $204 = compatible(v.value0)(act);
              if ($204) {
                return new Right(s);
              }
              ;
              return new Left(new Mismatch(ctx, v.value0, act));
            }
            ;
            if (v instanceof Nothing) {
              return new Right(insert11(pat.value0)(act)(s));
            }
            ;
            throw new Error("Failed pattern match at Verdict.Typecheck (line 154, column 16 - line 156, column 42): " + [v.constructor.name]);
          }
          ;
          if (pat instanceof TList && act instanceof TList) {
            return matchTy(ctx)(s)(pat.value0)(act.value0);
          }
          ;
          if (pat instanceof TArrow && act instanceof TArrow) {
            return bind9(matchTy(ctx)(s)(pat.value0)(act.value0))(function(s1) {
              return matchTy(ctx)(s1)(pat.value1)(act.value1);
            });
          }
          ;
          if (pat instanceof TData && (act instanceof TData && (pat.value0 === act.value0 && length(pat.value1) === length(act.value1)))) {
            return foldM3(function(acc) {
              return function(v2) {
                return matchTy(ctx)(acc)(v2.value0)(v2.value1);
              };
            })(s)(zip(pat.value1)(act.value1));
          }
          ;
          if (pat instanceof TRecord && act instanceof TRecord) {
            return foldM3(function(acc) {
              return function(v2) {
                var v1 = lookupField2(v2.value0)(act.value0);
                if (v1 instanceof Just) {
                  return matchTy(ctx)(acc)(v2.value1)(v1.value0);
                }
                ;
                if (v1 instanceof Nothing) {
                  return new Left(new Mismatch(ctx, pat, act));
                }
                ;
                throw new Error("Failed pattern match at Verdict.Typecheck (line 166, column 29 - line 168, column 49): " + [v1.constructor.name]);
              };
            })(s)(pat.value0);
          }
          ;
          var $227 = compatible(pat)(act);
          if ($227) {
            return new Right(s);
          }
          ;
          return new Left(new Mismatch(ctx, pat, act));
        };
      };
    };
  };
  var atExpr = function(expr) {
    return function(err2) {
      if (expr instanceof EAt) {
        return relocate(expr.value0)(err2);
      }
      ;
      return err2;
    };
  };
  var applySubst2 = function(s) {
    return function(v) {
      if (v instanceof TVar) {
        return fromMaybe(new TVar(v.value0))(lookup9(v.value0)(s));
      }
      ;
      if (v instanceof TList) {
        return new TList(applySubst2(s)(v.value0));
      }
      ;
      if (v instanceof TArrow) {
        return new TArrow(applySubst2(s)(v.value0), applySubst2(s)(v.value1));
      }
      ;
      if (v instanceof TRecord) {
        return new TRecord(map112(function(v1) {
          return new Tuple(v1.value0, applySubst2(s)(v1.value1));
        })(v.value0));
      }
      ;
      if (v instanceof TData) {
        return new TData(v.value0, map112(applySubst2(s))(v.value1));
      }
      ;
      return v;
    };
  };
  var instantiateCall = function(env) {
    return function(locals) {
      return function(ctx) {
        return function(params) {
          return function(args) {
            var functionRefType = function(arg) {
              var v = stripAt(arg);
              if (v instanceof EVar) {
                var v1 = lookup9(v.value0)(locals);
                if (v1 instanceof Just && isArrow2(v1.value0)) {
                  return new Just(v1.value0);
                }
                ;
                return globalArrowType(env.globals)(v.value0);
              }
              ;
              return Nothing.value;
            };
            var step3 = function(subst) {
              return function(v) {
                if (isArrow2(v.value0)) {
                  var v1 = functionRefType(v.value1);
                  if (v1 instanceof Just) {
                    return matchTy(ctx)(subst)(v.value0)(v1.value0);
                  }
                  ;
                  if (v1 instanceof Nothing) {
                    return new Left(new FunctionAsValue(ctx));
                  }
                  ;
                  throw new Error("Failed pattern match at Verdict.Typecheck (line 328, column 23 - line 330, column 46): " + [v1.constructor.name]);
                }
                ;
                if (otherwise) {
                  return bind9(infer(env)(locals)(v.value1))(function(argTy) {
                    return matchTy(ctx)(subst)(v.value0)(argTy);
                  });
                }
                ;
                throw new Error("Failed pattern match at Verdict.Typecheck (line 327, column 3 - line 333, column 38): " + [subst.constructor.name, v.constructor.name]);
              };
            };
            return foldM3(step3)(empty3)(zip(params)(args));
          };
        };
      };
    };
  };
  var instantiate = function(env) {
    return function(locals) {
      return function(ctx) {
        return function(params) {
          return function(args) {
            return bind9(traverse4(infer(env)(locals))(args))(function(argTys) {
              return foldM3(function(s) {
                return function(v) {
                  return matchTy(ctx)(s)(v.value0)(v.value1);
                };
              })(empty3)(zip(params)(argTys));
            });
          };
        };
      };
    };
  };
  var inferIntrinsicCall = function(env) {
    return function(locals) {
      return function(f) {
        return function(args) {
          if (f === "actorStart") {
            return new Just(function() {
              var v = uncons(args);
              if (v instanceof Nothing) {
                return new Left(new CallArityMismatch("actorStart", 1, 0));
              }
              ;
              if (v instanceof Just) {
                var v1 = stripAt(v.value0.head);
                if (v1 instanceof EVar) {
                  var v2 = lookup9(v1.value0)(env.globals);
                  if (v2 instanceof Nothing) {
                    return new Left(SpawnRequiresFunction.value);
                  }
                  ;
                  if (v2 instanceof Just) {
                    var want = length(v2.value0.params);
                    return discard6(when3(want !== length(v.value0.tail))(new Left(new CallArityMismatch(v1.value0, want, length(v.value0.tail)))))(function() {
                      return bind9(instantiateCall(env)(locals)(v1.value0)(v2.value0.params)(v.value0.tail))(function() {
                        return new Right(new TData("ActorRef", [TUnknown.value]));
                      });
                    });
                  }
                  ;
                  throw new Error("Failed pattern match at Verdict.Typecheck (line 203, column 24 - line 209, column 50): " + [v2.constructor.name]);
                }
                ;
                return new Left(SpawnRequiresFunction.value);
              }
              ;
              throw new Error("Failed pattern match at Verdict.Typecheck (line 200, column 5 - line 210, column 40): " + [v.constructor.name]);
            }());
          }
          ;
          if (f === "actorSelf") {
            return new Just(function() {
              if (args.length === 1) {
                return bind9(infer(env)(locals)(args[0]))(function(tu) {
                  return discard6(when3(!compatible(TUnit.value)(tu))(new Left(new Mismatch("actorSelf argument", TUnit.value, tu))))(function() {
                    return new Right(new TData("ActorRef", [TUnknown.value]));
                  });
                });
              }
              ;
              return new Left(new CallArityMismatch("actorSelf", 1, length(args)));
            }());
          }
          ;
          if (f === "actorReceive") {
            return new Just(function() {
              if (args.length === 1) {
                return bind9(infer(env)(locals)(args[0]))(function(tu) {
                  return discard6(when3(!compatible(TUnit.value)(tu))(new Left(new Mismatch("actorReceive argument", TUnit.value, tu))))(function() {
                    return new Right(TUnknown.value);
                  });
                });
              }
              ;
              return new Left(new CallArityMismatch("actorReceive", 1, length(args)));
            }());
          }
          ;
          if (f === "actorSend") {
            return new Just(function() {
              if (args.length === 2) {
                return bind9(instantiateCall(env)(locals)("actorSend")([new TData("ActorRef", [new TVar("m")]), new TVar("m")])(args))(function() {
                  return new Right(TUnit.value);
                });
              }
              ;
              return new Left(new CallArityMismatch("actorSend", 2, length(args)));
            }());
          }
          ;
          if (f === "actorReply") {
            return new Just(function() {
              if (args.length === 2) {
                return bind9(instantiateCall(env)(locals)("actorReply")([new TData("ActorRef", [new TVar("m")]), new TVar("m")])(args))(function() {
                  return new Right(TUnit.value);
                });
              }
              ;
              return new Left(new CallArityMismatch("actorReply", 2, length(args)));
            }());
          }
          ;
          if (f === "actorCall") {
            return new Just(function() {
              if (args.length === 2) {
                return bind9(instantiateCall(env)(locals)("actorCall")([new TData("ActorRef", [new TVar("m")]), new TArrow(TPid.value, new TVar("m"))])(args))(function() {
                  return new Right(TUnknown.value);
                });
              }
              ;
              return new Left(new CallArityMismatch("actorCall", 2, length(args)));
            }());
          }
          ;
          if (f === "spawn") {
            return new Just(function() {
              var v = uncons(args);
              if (v instanceof Nothing) {
                return new Left(new CallArityMismatch("spawn", 1, 0));
              }
              ;
              if (v instanceof Just) {
                var v1 = stripAt(v.value0.head);
                if (v1 instanceof EVar) {
                  var v2 = lookup9(v1.value0)(env.globals);
                  if (v2 instanceof Nothing) {
                    return new Left(SpawnRequiresFunction.value);
                  }
                  ;
                  if (v2 instanceof Just) {
                    var want = length(v2.value0.params);
                    return discard6(when3(want !== length(v.value0.tail))(new Left(new CallArityMismatch(v1.value0, want, length(v.value0.tail)))))(function() {
                      return bind9(instantiateCall(env)(locals)(v1.value0)(v2.value0.params)(v.value0.tail))(function() {
                        return new Right(TPid.value);
                      });
                    });
                  }
                  ;
                  throw new Error("Failed pattern match at Verdict.Typecheck (line 247, column 24 - line 253, column 23): " + [v2.constructor.name]);
                }
                ;
                return new Left(SpawnRequiresFunction.value);
              }
              ;
              throw new Error("Failed pattern match at Verdict.Typecheck (line 244, column 5 - line 254, column 40): " + [v.constructor.name]);
            }());
          }
          ;
          if (f === "send") {
            return new Just(function() {
              if (args.length === 2) {
                return bind9(infer(env)(locals)(args[0]))(function(tpid) {
                  return bind9(infer(env)(locals)(args[1]))(function() {
                    return discard6(when3(!compatible(TPid.value)(tpid))(new Left(new Mismatch("send pid", TPid.value, tpid))))(function() {
                      return new Right(TUnit.value);
                    });
                  });
                });
              }
              ;
              return new Left(new CallArityMismatch("send", 2, length(args)));
            }());
          }
          ;
          if (f === "recv") {
            return new Just(function() {
              if (args.length === 0) {
                return new Right(TUnknown.value);
              }
              ;
              return new Left(new CallArityMismatch("recv", 0, length(args)));
            }());
          }
          ;
          if (f === "yield") {
            return new Just(function() {
              if (args.length === 0) {
                return new Right(TUnit.value);
              }
              ;
              return new Left(new CallArityMismatch("yield", 0, length(args)));
            }());
          }
          ;
          if (f === "self") {
            return new Just(function() {
              if (args.length === 0) {
                return new Right(TPid.value);
              }
              ;
              return new Left(new CallArityMismatch("self", 0, length(args)));
            }());
          }
          ;
          if (f === "length") {
            return new Just(function() {
              if (args.length === 1) {
                return bind9(infer(env)(locals)(args[0]))(function(txs) {
                  var v = listElem(txs);
                  if (v instanceof Just) {
                    return new Right(TInt.value);
                  }
                  ;
                  if (v instanceof Nothing) {
                    return new Left(new Mismatch("length argument", new TList(TUnknown.value), txs));
                  }
                  ;
                  throw new Error("Failed pattern match at Verdict.Typecheck (line 279, column 9 - line 281, column 76): " + [v.constructor.name]);
                });
              }
              ;
              return new Left(new CallArityMismatch("length", 1, length(args)));
            }());
          }
          ;
          if (f === "get") {
            return new Just(function() {
              if (args.length === 2) {
                return bind9(infer(env)(locals)(args[0]))(function(txs) {
                  return bind9(infer(env)(locals)(args[1]))(function(tix) {
                    return discard6(when3(!compatible(TInt.value)(tix))(new Left(new Mismatch("get index", TInt.value, tix))))(function() {
                      var v = listElem(txs);
                      if (v instanceof Just) {
                        return new Right(v.value0);
                      }
                      ;
                      if (v instanceof Nothing) {
                        return new Left(new Mismatch("get argument", new TList(TUnknown.value), txs));
                      }
                      ;
                      throw new Error("Failed pattern match at Verdict.Typecheck (line 289, column 9 - line 291, column 73): " + [v.constructor.name]);
                    });
                  });
                });
              }
              ;
              return new Left(new CallArityMismatch("get", 2, length(args)));
            }());
          }
          ;
          if (f === "append") {
            return new Just(function() {
              if (args.length === 2) {
                return bind9(infer(env)(locals)(args[0]))(function(txs) {
                  return bind9(infer(env)(locals)(args[1]))(function(tx) {
                    var v = listElem(txs);
                    if (v instanceof Just) {
                      return discard6(when3(!compatible(v.value0)(tx))(new Left(new Mismatch("append element", v.value0, tx))))(function() {
                        return new Right(new TList(joinTy(v.value0)(tx)));
                      });
                    }
                    ;
                    if (v instanceof Nothing) {
                      return new Left(new Mismatch("append argument", new TList(TUnknown.value), txs));
                    }
                    ;
                    throw new Error("Failed pattern match at Verdict.Typecheck (line 298, column 9 - line 302, column 76): " + [v.constructor.name]);
                  });
                });
              }
              ;
              return new Left(new CallArityMismatch("append", 2, length(args)));
            }());
          }
          ;
          if (f === "mod") {
            return new Just(function() {
              if (args.length === 2) {
                return bind9(infer(env)(locals)(args[0]))(function(ta) {
                  return bind9(infer(env)(locals)(args[1]))(function(tb) {
                    return discard6(when3(!compatible(TInt.value)(ta))(new Left(new Mismatch("mod argument", TInt.value, ta))))(function() {
                      return discard6(when3(!compatible(TInt.value)(tb))(new Left(new Mismatch("mod argument", TInt.value, tb))))(function() {
                        return new Right(TInt.value);
                      });
                    });
                  });
                });
              }
              ;
              return new Left(new CallArityMismatch("mod", 2, length(args)));
            }());
          }
          ;
          return Nothing.value;
        };
      };
    };
  };
  var infer = function(env) {
    return function(locals) {
      return function(v) {
        if (v instanceof EAt) {
          var v1 = infer(env)(locals)(v.value1);
          if (v1 instanceof Left) {
            return new Left(relocate(v.value0)(v1.value0));
          }
          ;
          if (v1 instanceof Right) {
            return new Right(v1.value0);
          }
          ;
          throw new Error("Failed pattern match at Verdict.Typecheck (line 353, column 16 - line 355, column 23): " + [v1.constructor.name]);
        }
        ;
        if (v instanceof ELit && v.value0 instanceof LInt) {
          return new Right(TInt.value);
        }
        ;
        if (v instanceof ELit && v.value0 instanceof LFixed) {
          return new Right(TFixed.value);
        }
        ;
        if (v instanceof ELit && v.value0 instanceof LRational) {
          return new Right(TRational.value);
        }
        ;
        if (v instanceof ELit && v.value0 instanceof LUnit) {
          return new Right(TUnit.value);
        }
        ;
        if (v instanceof ELit && v.value0 instanceof LBool) {
          return new Right(TBool.value);
        }
        ;
        if (v instanceof ELit && v.value0 instanceof LStr) {
          return new Right(TString.value);
        }
        ;
        if (v instanceof EVar) {
          var v1 = lookup9(v.value0)(locals);
          if (v1 instanceof Just && isArrow2(v1.value0)) {
            return new Left(new FunctionAsValue(v.value0));
          }
          ;
          if (v1 instanceof Just) {
            return new Right(v1.value0);
          }
          ;
          if (v1 instanceof Nothing) {
            var v2 = lookup9(v.value0)(env.globals);
            if (v2 instanceof Just) {
              if ($$null(v2.value0.params)) {
                return new Right(v2.value0.ret);
              }
              ;
              if (otherwise) {
                return new Left(new FunctionAsValue(v.value0));
              }
              ;
            }
            ;
            if (v2 instanceof Nothing) {
              var v3 = lookup9(v.value0)(env.ctors);
              if (v3 instanceof Just) {
                if ($$null(v3.value0.fields)) {
                  return new Right(new TData(v3.value0.parent, map112($$const(TUnknown.value))(v3.value0.params)));
                }
                ;
                if (otherwise) {
                  return new Left(new FunctionAsValue(v.value0));
                }
                ;
              }
              ;
              if (v3 instanceof Nothing) {
                return new Left(new UnknownName(v.value0));
              }
              ;
              throw new Error("Failed pattern match at Verdict.Typecheck (line 371, column 18 - line 377, column 40): " + [v3.constructor.name]);
            }
            ;
            throw new Error("Failed pattern match at Verdict.Typecheck (line 367, column 16 - line 377, column 40): " + [v2.constructor.name]);
          }
          ;
          throw new Error("Failed pattern match at Verdict.Typecheck (line 364, column 13 - line 377, column 40): " + [v1.constructor.name]);
        }
        ;
        if (v instanceof EBin) {
          return bind9(infer(env)(locals)(v.value1))(function(ta) {
            return bind9(infer(env)(locals)(v.value2))(function(tb) {
              return discard6(when3(!isNumeric(ta))(new Left(atExpr(v.value1)(new NotNumeric(showBin(v.value0), ta)))))(function() {
                return discard6(when3(!isNumeric(tb))(new Left(atExpr(v.value2)(new NotNumeric(showBin(v.value0), tb)))))(function() {
                  return discard6(when3(!compatible(ta)(tb))(new Left(atExpr(v.value2)(new Mismatch("operator " + showBin(v.value0), ta, tb)))))(function() {
                    return new Right(joinTy(ta)(tb));
                  });
                });
              });
            });
          });
        }
        ;
        if (v instanceof ECmp) {
          return bind9(infer(env)(locals)(v.value1))(function(ta) {
            return bind9(infer(env)(locals)(v.value2))(function(tb) {
              return discard6(function() {
                if (v.value0 instanceof CmpEq) {
                  return when3(!compatible(ta)(tb))(new Left(atExpr(v.value2)(new Mismatch("==", ta, tb))));
                }
                ;
                return discard6(when3(!isNumeric(ta))(new Left(atExpr(v.value1)(new NotNumeric(showCmp(v.value0), ta)))))(function() {
                  return discard6(when3(!isNumeric(tb))(new Left(atExpr(v.value2)(new NotNumeric(showCmp(v.value0), tb)))))(function() {
                    return when3(!compatible(ta)(tb))(new Left(atExpr(v.value2)(new Mismatch(showCmp(v.value0), ta, tb))));
                  });
                });
              }())(function() {
                return new Right(TBool.value);
              });
            });
          });
        }
        ;
        if (v instanceof EIf) {
          return bind9(infer(env)(locals)(v.value0))(function(tc) {
            return discard6(when3(!compatible(tc)(TBool.value))(new Left(atExpr(v.value0)(new Mismatch("if condition", TBool.value, tc)))))(function() {
              return bind9(infer(env)(locals)(v.value1))(function(tt2) {
                return bind9(infer(env)(locals)(v.value2))(function(te) {
                  return discard6(when3(!compatible(tt2)(te))(new Left(atExpr(v.value2)(new Mismatch("if branches", tt2, te)))))(function() {
                    return new Right(joinTy(tt2)(te));
                  });
                });
              });
            });
          });
        }
        ;
        if (v instanceof ELet) {
          return bind9(infer(env)(locals)(v.value1))(function(te) {
            return infer(env)(insert11(v.value0)(te)(locals))(v.value2);
          });
        }
        ;
        if (v instanceof ECall) {
          var v1 = inferIntrinsicCall(env)(locals)(v.value0)(v.value1);
          if (v1 instanceof Just) {
            return v1.value0;
          }
          ;
          if (v1 instanceof Nothing) {
            var v2 = lookup9(v.value0)(locals);
            if (v2 instanceof Just && isArrow2(v2.value0)) {
              return callLocalArrow(env)(locals)(v.value0)(v2.value0)(v.value1);
            }
            ;
            if (v2 instanceof Just) {
              return new Left(new NotAFunction(v.value0));
            }
            ;
            if (v2 instanceof Nothing) {
              var v3 = lookup9(v.value0)(env.globals);
              if (v3 instanceof Nothing) {
                var v4 = lookup9(v.value0)(env.ctors);
                if (v4 instanceof Just) {
                  var want = length(v4.value0.fields);
                  return discard6(when3(want !== length(v.value1))(new Left(new ConstructorArityMismatch(v.value0, want, length(v.value1)))))(function() {
                    return bind9(instantiate(env)(locals)("argument to " + v.value0)(v4.value0.fields)(v.value1))(function(subst) {
                      return new Right(new TData(v4.value0.parent, map112(function(p) {
                        return fromMaybe(TUnknown.value)(lookup9(p)(subst));
                      })(v4.value0.params)));
                    });
                  });
                }
                ;
                if (v4 instanceof Nothing) {
                  return new Left(new UnknownName(v.value0));
                }
                ;
                throw new Error("Failed pattern match at Verdict.Typecheck (line 416, column 20 - line 423, column 42): " + [v4.constructor.name]);
              }
              ;
              if (v3 instanceof Just) {
                var want = length(v3.value0.params);
                return discard6(when3(want !== length(v.value1))(new Left(new CallArityMismatch(v.value0, want, length(v.value1)))))(function() {
                  return bind9(instantiateCall(env)(locals)(v.value0)(v3.value0.params)(v.value1))(function(subst) {
                    return new Right(applySubst2(subst)(v3.value0.ret));
                  });
                });
              }
              ;
              throw new Error("Failed pattern match at Verdict.Typecheck (line 415, column 18 - line 428, column 43): " + [v3.constructor.name]);
            }
            ;
            throw new Error("Failed pattern match at Verdict.Typecheck (line 412, column 16 - line 428, column 43): " + [v2.constructor.name]);
          }
          ;
          throw new Error("Failed pattern match at Verdict.Typecheck (line 410, column 19 - line 428, column 43): " + [v1.constructor.name]);
        }
        ;
        if (v instanceof EBuiltin) {
          return discard6(traverse_4(infer(env)(locals))(v.value1))(function() {
            return new Right(TUnknown.value);
          });
        }
        ;
        if (v instanceof EEffect) {
          return discard6(traverse_4(infer(env)(locals))(v.value1))(function() {
            return new Right(TUnknown.value);
          });
        }
        ;
        if (v instanceof EList) {
          var unifyElem = function(acc) {
            return function(t) {
              var $363 = compatible(acc)(t);
              if ($363) {
                return new Right(joinTy(acc)(t));
              }
              ;
              return new Left(new Mismatch("list element", acc, t));
            };
          };
          return bind9(traverse4(infer(env)(locals))(v.value0))(function(ts) {
            var v12 = uncons(ts);
            if (v12 instanceof Nothing) {
              return new Right(new TList(TUnknown.value));
            }
            ;
            if (v12 instanceof Just) {
              return bind9(foldM3(unifyElem)(v12.value0.head)(v12.value0.tail))(function(elemTy) {
                return new Right(new TList(elemTy));
              });
            }
            ;
            throw new Error("Failed pattern match at Verdict.Typecheck (line 440, column 5 - line 444, column 29): " + [v12.constructor.name]);
          });
        }
        ;
        if (v instanceof ERecord) {
          return bind9(traverse4(function(v12) {
            return map29(Tuple.create(v12.value0))(infer(env)(locals)(v12.value1));
          })(v.value0))(function(typed) {
            return new Right(new TRecord(typed));
          });
        }
        ;
        if (v instanceof EField) {
          return bind9(infer(env)(locals)(v.value0))(function(te) {
            if (te instanceof TRecord) {
              var v12 = lookupField2(v.value1)(te.value0);
              if (v12 instanceof Just) {
                return new Right(v12.value0);
              }
              ;
              if (v12 instanceof Nothing) {
                return new Left(atExpr(v.value0)(new NoField(v.value1, te)));
              }
              ;
              throw new Error("Failed pattern match at Verdict.Typecheck (line 457, column 21 - line 459, column 54): " + [v12.constructor.name]);
            }
            ;
            if (te instanceof TUnknown) {
              return new Right(TUnknown.value);
            }
            ;
            return new Left(atExpr(v.value0)(new NotARecord(te)));
          });
        }
        ;
        if (v instanceof ESwitch) {
          return bind9(infer(env)(locals)(v.value0))(function(ts) {
            return discard6(when3(!any2(function($446) {
              return isNothing(fst($446));
            })(v.value1))(new Left(SwitchNoDefault.value)))(function() {
              return discard6(traverse_4(function(v12) {
                if (v12.value0 instanceof Just) {
                  var lt = litTy(v12.value0.value0);
                  return when3(!compatible(ts)(lt))(new Left(new Mismatch("switch case", ts, lt)));
                }
                ;
                if (v12.value0 instanceof Nothing) {
                  return new Right(unit);
                }
                ;
                throw new Error("Failed pattern match at Verdict.Typecheck (line 468, column 26 - line 470, column 32): " + [v12.value0.constructor.name]);
              })(v.value1))(function() {
                return bind9(traverse4(function(v12) {
                  return infer(env)(locals)(v12.value1);
                })(v.value1))(function(btys) {
                  var v12 = uncons(btys);
                  if (v12 instanceof Nothing) {
                    return new Left(SwitchNoDefault.value);
                  }
                  ;
                  if (v12 instanceof Just) {
                    return foldM3(function(acc) {
                      return function(t) {
                        var $388 = compatible(acc)(t);
                        if ($388) {
                          return new Right(joinTy(acc)(t));
                        }
                        ;
                        return new Left(new Mismatch("switch branches", acc, t));
                      };
                    })(v12.value0.head)(v12.value0.tail);
                  }
                  ;
                  throw new Error("Failed pattern match at Verdict.Typecheck (line 474, column 5 - line 480, column 15): " + [v12.constructor.name]);
                });
              });
            });
          });
        }
        ;
        if (v instanceof EMatch) {
          var inferMatchArm = function(tyName) {
            return function(dsub) {
              return function(v12) {
                if (v12.value0 instanceof PWild) {
                  return infer(env)(locals)(v12.value1);
                }
                ;
                if (v12.value0 instanceof PCtor) {
                  var v22 = lookup9(v12.value0.value0)(env.ctors);
                  if (v22 instanceof Nothing) {
                    return new Left(new UnknownConstructor(v12.value0.value0));
                  }
                  ;
                  if (v22 instanceof Just) {
                    return discard6(when3(v22.value0.parent !== tyName)(new Left(new MatchWrongConstructor(v12.value0.value0, tyName))))(function() {
                      return discard6(when3(length(v22.value0.fields) !== length(v12.value0.value1))(new Left(new ConstructorArityMismatch(v12.value0.value0, length(v22.value0.fields), length(v12.value0.value1)))))(function() {
                        var fieldTys = map112(applySubst2(dsub))(v22.value0.fields);
                        var locals$prime = union5(fromFoldable18(zip(v12.value0.value1)(fieldTys)))(locals);
                        return infer(env)(locals$prime)(v12.value1);
                      });
                    });
                  }
                  ;
                  throw new Error("Failed pattern match at Verdict.Typecheck (line 509, column 30 - line 517, column 33): " + [v22.constructor.name]);
                }
                ;
                throw new Error("Failed pattern match at Verdict.Typecheck (line 507, column 50 - line 517, column 33): " + [v12.value0.constructor.name]);
              };
            };
          };
          var ctorPatName = function(v12) {
            if (v12.value0 instanceof PCtor) {
              return new Just(v12.value0.value0);
            }
            ;
            return Nothing.value;
          };
          var isExhaustive = function(ctors) {
            return function(arms1) {
              return any2(function(v12) {
                return eq32(v12.value0)(PWild.value);
              })(arms1) || eq4(fromFoldable19(map112(function(v12) {
                return v12.name;
              })(ctors)))(fromFoldable19(mapMaybe(ctorPatName)(arms1)));
            };
          };
          return bind9(infer(env)(locals)(v.value0))(function(ts) {
            if (ts instanceof TData) {
              var v12 = lookup9(ts.value0)(env.dataTypes);
              if (v12 instanceof Nothing) {
                return new Left(new UnknownType(ts.value0));
              }
              ;
              if (v12 instanceof Just) {
                return discard6(when3(!isExhaustive(v12.value0.ctors)(v.value1))(new Left(new MatchNonExhaustive(ts.value0))))(function() {
                  var dsub = fromFoldable18(zip(v12.value0.params)(append15(ts.value1)(replicate(length(v12.value0.params))(TUnknown.value))));
                  return bind9(traverse4(inferMatchArm(ts.value0)(dsub))(v.value1))(function(btys) {
                    var v22 = uncons(btys);
                    if (v22 instanceof Nothing) {
                      return new Left(new MatchNonExhaustive(ts.value0));
                    }
                    ;
                    if (v22 instanceof Just) {
                      return foldM3(function(acc) {
                        return function(t) {
                          var $415 = compatible(acc)(t);
                          if ($415) {
                            return new Right(joinTy(acc)(t));
                          }
                          ;
                          return new Left(new Mismatch("match branches", acc, t));
                        };
                      })(v22.value0.head)(v22.value0.tail);
                    }
                    ;
                    throw new Error("Failed pattern match at Verdict.Typecheck (line 497, column 11 - line 503, column 21): " + [v22.constructor.name]);
                  });
                });
              }
              ;
              throw new Error("Failed pattern match at Verdict.Typecheck (line 485, column 32 - line 503, column 21): " + [v12.constructor.name]);
            }
            ;
            if (ts instanceof TUnknown) {
              return new Right(TUnknown.value);
            }
            ;
            return new Left(new MatchNonData(ts));
          });
        }
        ;
        throw new Error("Failed pattern match at Verdict.Typecheck (line 352, column 20 - line 525, column 28): " + [v.constructor.name]);
      };
    };
  };
  var callLocalArrow = function(env) {
    return function(locals) {
      return function(f) {
        return function(ty) {
          return function(args) {
            var want = typeArity(ty);
            return discard6(when3(want !== length(args))(new Left(new CallArityMismatch(f, want, length(args)))))(function() {
              var sp = splitArrow(length(args))(ty);
              return bind9(instantiate(env)(locals)("argument to " + f)(sp.params)(args))(function(subst) {
                return new Right(applySubst2(subst)(sp.result));
              });
            });
          };
        };
      };
    };
  };
  var checkDecl = function(env) {
    return function(v) {
      return bind9(schemeOf(v))(function(sch) {
        return discard6(traverse_4(validateTy(env.dataTypes))(sch.params))(function() {
          return discard6(validateTy(env.dataTypes)(sch.ret))(function() {
            var locals = fromFoldable18(zip(v.params)(sch.params));
            return bind9(infer(env)(locals)(v.body))(function(bodyTy) {
              return when3(!compatible(sch.ret)(bodyTy))(new Left(new Mismatch("body of " + v.name, sch.ret, bodyTy)));
            });
          });
        });
      });
    };
  };
  var checkModule = function(v) {
    var validateTypeDecl = function(dataTypes2) {
      return function(v1) {
        return traverse_4(function() {
          var $447 = traverse_4(validateTy(dataTypes2));
          return function($448) {
            return $447(function(v2) {
              return v2.fields;
            }($448));
          };
        }())(v1.value2);
      };
    };
    var ctorEntries = function(v1) {
      return map112(function(c) {
        return new Tuple(c.name, {
          parent: v1.value0,
          params: v1.value1,
          fields: c.fields
        });
      })(v1.value2);
    };
    var buildGlobals = map29(fromFoldable18)(traverse4(function(v1) {
      return map29(Tuple.create(v1.name))(schemeOf(v1));
    })(v.value2));
    var buildDataTypes = function(tys) {
      return fromFoldable18(map112(function(v1) {
        return new Tuple(v1.value0, {
          name: v1.value0,
          params: v1.value1,
          ctors: v1.value2
        });
      })(tys));
    };
    var buildCtors = function(tys) {
      return fromFoldable18(concatMap(ctorEntries)(tys));
    };
    var dataTypes = buildDataTypes(v.value1);
    var ctors = buildCtors(v.value1);
    return discard6(traverse_4(validateTypeDecl(dataTypes))(v.value1))(function() {
      return bind9(buildGlobals)(function(globals) {
        var env = {
          globals,
          dataTypes,
          ctors
        };
        return traverse_4(checkDecl(env))(v.value2);
      });
    });
  };

  // .tmp-verdict-build/output/Data.Argonaut.Parser/foreign.js
  function _jsonParser(fail2, succ, s) {
    try {
      return succ(JSON.parse(s));
    } catch (e) {
      return fail2(e.message);
    }
  }

  // .tmp-verdict-build/output/Data.Argonaut.Parser/index.js
  var jsonParser = function(j) {
    return _jsonParser(Left.create, Right.create, j);
  };

  // .tmp-verdict-build/output/Verdict.Eval.Regex/foreign.js
  var compile = (pattern) => {
    try {
      return new RegExp(pattern, "g");
    } catch (_) {
      return null;
    }
  };
  var regexTest = (pattern) => (input) => {
    const re = compile(pattern);
    return re == null ? false : re.test(input);
  };
  var regexFindAll = (pattern) => (input) => {
    const re = compile(pattern);
    if (re == null) return [];
    return Array.from(input.matchAll(re), (match2) => match2[0]);
  };
  var regexReplace = (pattern) => (replacement) => (input) => {
    const re = compile(pattern);
    return re == null ? input : input.replace(re, replacement);
  };
  var regexSplit = (pattern) => (input) => {
    const re = compile(pattern);
    return re == null ? [input] : input.split(re);
  };

  // .tmp-verdict-build/output/Verdict.Eval.Series/foreign.js
  var nums = (xs) => xs.map((x) => Number(x));
  var period = (p) => Math.max(1, Math.trunc(Number(p)));
  var out = (xs) => xs.map((x) => {
    const n = Number.isFinite(x) ? Math.trunc(x) : 0;
    return Object.is(n, -0) ? "0" : String(n);
  });
  var minLen = (a, b) => Math.min(a.length, b.length);
  var windowOf = (xs, i, p) => i + 1 >= p ? xs.slice(i - p + 1, i + 1) : null;
  var sum2 = (xs) => xs.reduce((a, b) => a + b, 0);
  var mean = (xs) => xs.length === 0 ? 0 : sum2(xs) / xs.length;
  var std = (xs) => {
    if (xs.length === 0) return 0;
    const m = mean(xs);
    return Math.sqrt(mean(xs.map((x) => (x - m) * (x - m))));
  };
  var med = (xs) => {
    if (xs.length === 0) return 0;
    const s = [...xs].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 === 1 ? s[mid] : Math.floor((s[mid - 1] + s[mid]) / 2);
  };
  var rolling = (src, p, f) => {
    const xs = nums(src), n = period(p);
    return out(xs.map((_, i) => {
      const w = windowOf(xs, i, n);
      return w == null ? 0 : f(w, i, xs);
    }));
  };
  var emaNums = (xs, p) => {
    if (xs.length === 0) return [];
    const a = 2 / (period(p) + 1);
    let e = xs[0];
    return xs.map((x, i) => {
      e = i === 0 ? x : a * x + (1 - a) * e;
      return e;
    });
  };
  var binary = (a, b, f) => {
    const xs = nums(a), ys = nums(b), n = minLen(xs, ys);
    const r = [];
    for (let i = 0; i < n; i++) r.push(f(xs[i], ys[i], i, xs, ys));
    return out(r);
  };
  var sma = (src) => (p) => rolling(src, p, mean);
  var ema = (src) => (p) => out(emaNums(nums(src), p));
  var wma = (src) => (p) => rolling(src, p, (w) => {
    const den = w.length * (w.length + 1) / 2;
    return sum2(w.map((x, i) => x * (i + 1))) / den;
  });
  var rollingMedian = (src) => (p) => rolling(src, p, med);
  var momentum = (src) => (p) => {
    const xs = nums(src), n = period(p);
    return out(xs.map((x, i) => i >= n ? x - xs[i - n] : 0));
  };
  var roc = (src) => (p) => {
    const xs = nums(src), n = period(p);
    return out(xs.map((x, i) => i >= n && xs[i - n] !== 0 ? (x - xs[i - n]) * 100 / xs[i - n] : 0));
  };
  var rsi = (src) => (p) => {
    const xs = nums(src), n = period(p);
    return out(xs.map((_, i) => {
      if (i < n) return 0;
      let gain = 0, loss = 0;
      for (let j = i - n + 1; j <= i; j++) {
        const d = xs[j] - xs[j - 1];
        if (d >= 0) gain += d;
        else loss -= d;
      }
      if (loss === 0) return 100;
      const rs = gain / loss;
      return 100 - 100 / (1 + rs);
    }));
  };
  var macd = (src) => (fast) => (slow) => {
    const xs = nums(src);
    const f = emaNums(xs, fast), s = emaNums(xs, slow);
    return out(f.map((x, i) => x - s[i]));
  };
  var macdSignal = (src) => (fast) => (slow) => (sig) => out(emaNums(nums(macd(src)(fast)(slow)), sig));
  var macdHistogram = (src) => (fast) => (slow) => (sig) => {
    const m = nums(macd(src)(fast)(slow)), s = emaNums(m, sig);
    return out(m.map((x, i) => x - s[i]));
  };
  var slope = (src) => (p) => rolling(src, p, (w) => w.length <= 1 ? 0 : (w[w.length - 1] - w[0]) / (w.length - 1));
  var rollingStd = (src) => (p) => rolling(src, p, std);
  var realizedVol = (src) => (p) => rolling(roc(src)("1"), p, std);
  var ewmStd = (src) => (p) => {
    const xs = nums(src), a = 2 / (period(p) + 1);
    let m = xs[0] ?? 0, v = 0;
    return out(xs.map((x, i) => {
      if (i === 0) return 0;
      const old = m;
      m = a * x + (1 - a) * m;
      v = (1 - a) * (v + a * (x - old) * (x - old));
      return Math.sqrt(v);
    }));
  };
  var stdevRatio = (src) => (shortP) => (longP) => {
    const s = nums(rollingStd(src)(shortP)), l = nums(rollingStd(src)(longP));
    return out(s.map((x, i) => l[i] === 0 ? 0 : x * 100 / l[i]));
  };
  var atrApprox = (src) => (p) => sma(diff(src).map((x) => String(Math.abs(Number(x)))))(p);
  var bollingerUpper = (src) => (p) => (nstd) => {
    const m = nums(sma(src)(p)), st = nums(rollingStd(src)(p)), n = Number(nstd);
    return out(m.map((x, i) => x + n * st[i]));
  };
  var bollingerLower = (src) => (p) => (nstd) => {
    const m = nums(sma(src)(p)), st = nums(rollingStd(src)(p)), n = Number(nstd);
    return out(m.map((x, i) => x - n * st[i]));
  };
  var zscore = (src) => (p) => {
    const xs = nums(src), m = nums(sma(src)(p)), st = nums(rollingStd(src)(p));
    return out(xs.map((x, i) => st[i] === 0 ? 0 : (x - m[i]) * 100 / st[i]));
  };
  var percentileRank = (src) => (p) => rolling(src, p, (w) => {
    const last3 = w[w.length - 1];
    return w.filter((x) => x <= last3).length * 100 / w.length;
  });
  var drawdown = (src) => {
    const xs = nums(src);
    let peak = -Infinity;
    return out(xs.map((x) => {
      peak = Math.max(peak, x);
      return x - peak;
    }));
  };
  var pctChange = (src) => (p) => roc(src)(p);
  var ratio = (a) => (b) => binary(a, b, (x, y) => y === 0 ? 0 : x * 100 / y);
  var spread = (a) => (b) => binary(a, b, (x, y) => x - y);
  var rollingCorr = (a) => (b) => (p) => {
    const xs = nums(a), ys = nums(b), n = minLen(xs, ys), per = period(p), r = [];
    for (let i = 0; i < n; i++) {
      if (i + 1 < per) {
        r.push(0);
        continue;
      }
      const xw = xs.slice(i - per + 1, i + 1), yw = ys.slice(i - per + 1, i + 1);
      const mx = mean(xw), my = mean(yw);
      const cov = mean(xw.map((x, j) => (x - mx) * (yw[j] - my)));
      const den = std(xw) * std(yw);
      r.push(den === 0 ? 0 : cov / den * 100);
    }
    return out(r);
  };
  var rollingBeta = (a) => (b) => (p) => {
    const xs = nums(a), ys = nums(b), n = minLen(xs, ys), per = period(p), r = [];
    for (let i = 0; i < n; i++) {
      if (i + 1 < per) {
        r.push(0);
        continue;
      }
      const xw = xs.slice(i - per + 1, i + 1), yw = ys.slice(i - per + 1, i + 1);
      const mx = mean(xw), my = mean(yw);
      const cov = mean(xw.map((x, j) => (x - mx) * (yw[j] - my)));
      const vb = mean(yw.map((y) => (y - my) * (y - my)));
      r.push(vb === 0 ? 0 : cov / vb * 100);
    }
    return out(r);
  };
  var relativeMomentum = (a) => (b) => (p) => binary(momentum(a)(p), momentum(b)(p), (x, y) => x - y);
  var hedgeRatio = (a) => (b) => (p) => rollingBeta(a)(b)(p);
  var seriesAdd = (a) => (b) => binary(a, b, (x, y) => x + y);
  var seriesSub = (a) => (b) => binary(a, b, (x, y) => x - y);
  var seriesMul = (a) => (b) => binary(a, b, (x, y) => x * y);
  var seriesDiv = (a) => (b) => binary(a, b, (x, y) => y === 0 ? 0 : x / y);
  var seriesAbs = (src) => out(nums(src).map(Math.abs));
  var clip = (src) => (lo) => (hi) => out(nums(src).map((x) => Math.max(Number(lo), Math.min(Number(hi), x))));
  var shift = (src) => (p) => {
    const xs = nums(src), n = Math.max(0, Math.trunc(Number(p)));
    return out(xs.map((_, i) => i >= n ? xs[i - n] : 0));
  };
  var diff = (src) => {
    const xs = nums(src);
    return out(xs.map((x, i) => i === 0 ? 0 : x - xs[i - 1]));
  };
  var logSeries = (src) => out(nums(src).map((x) => x > 0 ? Math.log(x) : 0));
  var rollingMax = (src) => (p) => rolling(src, p, (w) => Math.max(...w));
  var rollingMin = (src) => (p) => rolling(src, p, (w) => Math.min(...w));
  var cummax = (src) => {
    let m = -Infinity;
    return out(nums(src).map((x) => m = Math.max(m, x)));
  };
  var cummin = (src) => {
    let m = Infinity;
    return out(nums(src).map((x) => m = Math.min(m, x)));
  };
  var crossover = (a) => (b) => binary(a, b, (x, y, i, xs, ys) => i > 0 && xs[i - 1] <= ys[i - 1] && x > y ? 1 : 0);
  var crossunder = (a) => (b) => binary(a, b, (x, y, i, xs, ys) => i > 0 && xs[i - 1] >= ys[i - 1] && x < y ? 1 : 0);
  var trueRange = (high) => (low) => (close) => {
    const h = nums(high), l = nums(low), c = nums(close), n = Math.min(h.length, l.length, c.length);
    const r = [];
    for (let i = 0; i < n; i++) {
      const prev = i === 0 ? c[i] : c[i - 1];
      r.push(Math.max(h[i] - l[i], Math.abs(h[i] - prev), Math.abs(l[i] - prev)));
    }
    return out(r);
  };
  var atrOhlc = (high) => (low) => (close) => (p) => sma(trueRange(high)(low)(close))(p);
  var vwap = (close) => (volume) => (p) => {
    const c = nums(close), v = nums(volume), n = minLen(c, v), per = period(p), r = [];
    for (let i = 0; i < n; i++) {
      if (i + 1 < per) {
        r.push(0);
        continue;
      }
      let pv = 0, vv = 0;
      for (let j = i - per + 1; j <= i; j++) {
        pv += c[j] * v[j];
        vv += v[j];
      }
      r.push(vv === 0 ? 0 : pv / vv);
    }
    return out(r);
  };
  var obv = (close) => (volume) => {
    const c = nums(close), v = nums(volume), n = minLen(c, v), r = [];
    let acc = 0;
    for (let i = 0; i < n; i++) {
      if (i > 0) acc += c[i] > c[i - 1] ? v[i] : c[i] < c[i - 1] ? -v[i] : 0;
      r.push(acc);
    }
    return out(r);
  };
  var volumeSma = (volume) => (p) => sma(volume)(p);
  var volumeRatio = (volume) => (p) => {
    const v = nums(volume), m = nums(volumeSma(volume)(p));
    return out(v.map((x, i) => m[i] === 0 ? 0 : x * 100 / m[i]));
  };
  var bodySize = (open) => (close) => binary(open, close, (o, c) => Math.abs(c - o));
  var upperWick = (high) => (open) => (close) => {
    const h = nums(high), o = nums(open), c = nums(close), n = Math.min(h.length, o.length, c.length);
    return out(Array.from({ length: n }, (_, i) => h[i] - Math.max(o[i], c[i])));
  };
  var lowerWick = (low) => (open) => (close) => {
    const l = nums(low), o = nums(open), c = nums(close), n = Math.min(l.length, o.length, c.length);
    return out(Array.from({ length: n }, (_, i) => Math.min(o[i], c[i]) - l[i]));
  };
  var rangePct = (high) => (low) => binary(high, low, (h, l) => l === 0 ? 0 : (h - l) * 100 / l);

  // .tmp-verdict-build/output/Verdict.VM.Eval/index.js
  var show7 = /* @__PURE__ */ show(showInt);
  var map30 = /* @__PURE__ */ map(functorArray);
  var fromFoldable20 = /* @__PURE__ */ fromFoldable2(foldableArray);
  var foldM4 = /* @__PURE__ */ foldM(/* @__PURE__ */ monadStateT(monadEither));
  var map113 = /* @__PURE__ */ map(/* @__PURE__ */ functorStateT(functorEither));
  var foldl6 = /* @__PURE__ */ foldl(foldableArray);
  var show16 = /* @__PURE__ */ show(showBoolean);
  var show24 = /* @__PURE__ */ show(showString);
  var bindStateT4 = /* @__PURE__ */ bindStateT(monadEither);
  var bind10 = /* @__PURE__ */ bind(bindStateT4);
  var monadStateStateT4 = /* @__PURE__ */ monadStateStateT(monadEither);
  var get5 = /* @__PURE__ */ get(monadStateStateT4);
  var lookup10 = /* @__PURE__ */ lookup2(ordString);
  var pure9 = /* @__PURE__ */ pure(/* @__PURE__ */ applicativeStateT(monadEither));
  var put3 = /* @__PURE__ */ put(monadStateStateT4);
  var insert13 = /* @__PURE__ */ insert2(ordString);
  var any3 = /* @__PURE__ */ any(foldableArray)(heytingAlgebraBoolean);
  var map210 = /* @__PURE__ */ map(functorMaybe);
  var bind12 = /* @__PURE__ */ bind(bindEither);
  var lift22 = /* @__PURE__ */ lift2(applyMaybe);
  var show32 = /* @__PURE__ */ show(showNumber);
  var toUnfoldable10 = /* @__PURE__ */ toUnfoldable2(unfoldableArray);
  var max5 = /* @__PURE__ */ max(ordInt);
  var eqTuple3 = /* @__PURE__ */ eqTuple(eqString);
  var all4 = /* @__PURE__ */ all(foldableArray)(heytingAlgebraBoolean);
  var extend5 = /* @__PURE__ */ extend3(encodeJsonJson);
  var assoc9 = /* @__PURE__ */ assoc2(encodeJsonJString);
  var assoc12 = /* @__PURE__ */ assoc2(encodeJsonJson);
  var assoc23 = /* @__PURE__ */ assoc2(encodeJsonInt);
  var assoc33 = /* @__PURE__ */ assoc2(encodeJsonJBoolean);
  var assoc42 = /* @__PURE__ */ assoc2(/* @__PURE__ */ encodeJsonArray(encodeJsonJson));
  var map32 = /* @__PURE__ */ map(functorEither);
  var elem3 = /* @__PURE__ */ elem2(eqString);
  var div3 = /* @__PURE__ */ div(euclideanRingInt);
  var mod4 = /* @__PURE__ */ mod(euclideanRingInt);
  var min3 = /* @__PURE__ */ min(ordInt);
  var fromFoldable110 = /* @__PURE__ */ fromFoldable3(ordInt)(foldableArray);
  var discard7 = /* @__PURE__ */ discard(discardUnit)(bindStateT4);
  var bind22 = /* @__PURE__ */ bind(bindMaybe);
  var member9 = /* @__PURE__ */ member2(ordString);
  var $$delete7 = /* @__PURE__ */ $$delete(ordString);
  var fromFoldable24 = /* @__PURE__ */ fromFoldable(foldableList);
  var toUnfoldable1 = /* @__PURE__ */ toUnfoldable3(unfoldableArray);
  var insert14 = /* @__PURE__ */ insert2(ordInt);
  var lookup12 = /* @__PURE__ */ lookup2(ordInt);
  var tailRecM5 = /* @__PURE__ */ tailRecM(/* @__PURE__ */ monadRecStateT(monadRecEither));
  var VUnit = /* @__PURE__ */ function() {
    function VUnit2() {
    }
    ;
    VUnit2.value = new VUnit2();
    return VUnit2;
  }();
  var VInt = /* @__PURE__ */ function() {
    function VInt2(value0) {
      this.value0 = value0;
    }
    ;
    VInt2.create = function(value0) {
      return new VInt2(value0);
    };
    return VInt2;
  }();
  var VFixed = /* @__PURE__ */ function() {
    function VFixed2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    VFixed2.create = function(value0) {
      return function(value1) {
        return new VFixed2(value0, value1);
      };
    };
    return VFixed2;
  }();
  var VRational = /* @__PURE__ */ function() {
    function VRational2(value0, value1) {
      this.value0 = value0;
      this.value1 = value1;
    }
    ;
    VRational2.create = function(value0) {
      return function(value1) {
        return new VRational2(value0, value1);
      };
    };
    return VRational2;
  }();
  var VBool = /* @__PURE__ */ function() {
    function VBool2(value0) {
      this.value0 = value0;
    }
    ;
    VBool2.create = function(value0) {
      return new VBool2(value0);
    };
    return VBool2;
  }();
  var VString = /* @__PURE__ */ function() {
    function VString2(value0) {
      this.value0 = value0;
    }
    ;
    VString2.create = function(value0) {
      return new VString2(value0);
    };
    return VString2;
  }();
  var VList = /* @__PURE__ */ function() {
    function VList2(value0) {
      this.value0 = value0;
    }
    ;
    VList2.create = function(value0) {
      return new VList2(value0);
    };
    return VList2;
  }();
  var VRecord = /* @__PURE__ */ function() {
    function VRecord2(value0) {
      this.value0 = value0;
    }
    ;
    VRecord2.create = function(value0) {
      return new VRecord2(value0);
    };
    return VRecord2;
  }();
  var SContinue = /* @__PURE__ */ function() {
    function SContinue2(value0) {
      this.value0 = value0;
    }
    ;
    SContinue2.create = function(value0) {
      return new SContinue2(value0);
    };
    return SContinue2;
  }();
  var SDone = /* @__PURE__ */ function() {
    function SDone2(value0) {
      this.value0 = value0;
    }
    ;
    SDone2.create = function(value0) {
      return new SDone2(value0);
    };
    return SDone2;
  }();
  var SBlocked = /* @__PURE__ */ function() {
    function SBlocked2(value0) {
      this.value0 = value0;
    }
    ;
    SBlocked2.create = function(value0) {
      return new SBlocked2(value0);
    };
    return SBlocked2;
  }();
  var SYield = /* @__PURE__ */ function() {
    function SYield2(value0) {
      this.value0 = value0;
    }
    ;
    SYield2.create = function(value0) {
      return new SYield2(value0);
    };
    return SYield2;
  }();
  var valueToJson = function(v) {
    if (v instanceof VUnit) {
      return jsonNull;
    }
    ;
    if (v instanceof VInt) {
      var v1 = fromString(v.value0);
      if (v1 instanceof Just) {
        return id(toNumber(v1.value0));
      }
      ;
      if (v1 instanceof Nothing) {
        return id(v.value0);
      }
      ;
      throw new Error("Failed pattern match at Verdict.VM.Eval (line 794, column 13 - line 796, column 30): " + [v1.constructor.name]);
    }
    ;
    if (v instanceof VFixed) {
      return id("fixed(" + (v.value0 + ("," + (show7(v.value1) + ")"))));
    }
    ;
    if (v instanceof VRational) {
      return id(render({
        num: v.value0,
        den: v.value1
      }));
    }
    ;
    if (v instanceof VBool) {
      return id(v.value0);
    }
    ;
    if (v instanceof VString) {
      return id(v.value0);
    }
    ;
    if (v instanceof VList) {
      return id(map30(valueToJson)(v.value0));
    }
    ;
    if (v instanceof VRecord) {
      return id(fromFoldable20(map30(function(v12) {
        return new Tuple(v12.value0, valueToJson(v12.value1));
      })(v.value0)));
    }
    ;
    throw new Error("Failed pattern match at Verdict.VM.Eval (line 792, column 15 - line 802, column 98): " + [v.constructor.name]);
  };
  var valueCountValue = function(v) {
    return new VRecord([new Tuple("value", new VInt(v.value0)), new Tuple("count", new VInt(show7(v.value1)))]);
  };
  var traverse5 = function(f) {
    return foldM4(function(acc) {
      return function(x) {
        return map113(snoc(acc))(f(x));
      };
    })([]);
  };
  var sumStrings = /* @__PURE__ */ foldl6(function(acc) {
    return function(x) {
      return addStr(acc)(x);
    };
  })("0");
  var someValue = function(v) {
    return new VRecord([new Tuple("$tag", new VString("Some")), new Tuple("$0", v)]);
  };
  var seriesOut = function(xs) {
    return new VList(map30(VInt.create)(xs));
  };
  var serialize = function(v) {
    if (v instanceof VUnit) {
      return "unit";
    }
    ;
    if (v instanceof VInt) {
      return v.value0;
    }
    ;
    if (v instanceof VFixed) {
      return "fixed(" + (v.value0 + ("," + (show7(v.value1) + ")")));
    }
    ;
    if (v instanceof VRational) {
      return render({
        num: v.value0,
        den: v.value1
      });
    }
    ;
    if (v instanceof VBool) {
      return show16(v.value0);
    }
    ;
    if (v instanceof VString) {
      return show24(v.value0);
    }
    ;
    if (v instanceof VList) {
      return "[" + (joinWith(",")(map30(serialize)(v.value0)) + "]");
    }
    ;
    if (v instanceof VRecord) {
      return "{" + (joinWith(",")(map30(function(v1) {
        return v1.value0 + ("=" + serialize(v1.value1));
      })(v.value0)) + "}");
    }
    ;
    throw new Error("Failed pattern match at Verdict.VM.Eval (line 1160, column 13 - line 1168, column 94): " + [v.constructor.name]);
  };
  var showValue = {
    show: serialize
  };
  var saveProcess = function(pid) {
    return function(frame) {
      return function(blocked) {
        return function(requeue) {
          return bind10(get5)(function(w) {
            var v = lookup10(pid)(w.procs);
            if (v instanceof Nothing) {
              return pure9(unit);
            }
            ;
            if (v instanceof Just) {
              var ready$prime = function() {
                if (requeue) {
                  return snoc(w.ready)(pid);
                }
                ;
                return w.ready;
              }();
              return put3(function() {
                var $223 = {};
                for (var $224 in w) {
                  if ({}.hasOwnProperty.call(w, $224)) {
                    $223[$224] = w[$224];
                  }
                  ;
                }
                ;
                $223.procs = insert13(pid)(function() {
                  var $220 = {};
                  for (var $221 in v.value0) {
                    if ({}.hasOwnProperty.call(v.value0, $221)) {
                      $220[$221] = v["value0"][$221];
                    }
                    ;
                  }
                  ;
                  $220.frame = frame;
                  $220.blocked = blocked;
                  return $220;
                }())(w.procs);
                $223.ready = ready$prime;
                return $223;
              }());
            }
            ;
            throw new Error("Failed pattern match at Verdict.VM.Eval (line 209, column 3 - line 216, column 10): " + [v.constructor.name]);
          });
        };
      };
    };
  };
  var rollingSumStrings = function(window) {
    return function(xs) {
      var sumWindow = function($copy_start) {
        return function($copy_offset) {
          return function($copy_acc) {
            var $tco_var_start = $copy_start;
            var $tco_var_offset = $copy_offset;
            var $tco_done = false;
            var $tco_result;
            function $tco_loop(start, offset, acc) {
              var $227 = offset === window;
              if ($227) {
                $tco_done = true;
                return acc;
              }
              ;
              var v = fromMaybe("0")(index(xs)(start + offset | 0));
              $tco_var_start = start;
              $tco_var_offset = offset + 1 | 0;
              $copy_acc = addStr(acc)(v);
              return;
            }
            ;
            while (!$tco_done) {
              $tco_result = $tco_loop($tco_var_start, $tco_var_offset, $copy_acc);
            }
            ;
            return $tco_result;
          };
        };
      };
      var n = length(xs);
      var go = function($copy_start) {
        return function($copy_acc) {
          var $tco_var_start = $copy_start;
          var $tco_done1 = false;
          var $tco_result;
          function $tco_loop(start, acc) {
            var $228 = (start + window | 0) > n;
            if ($228) {
              $tco_done1 = true;
              return acc;
            }
            ;
            $tco_var_start = start + 1 | 0;
            $copy_acc = snoc(acc)(sumWindow(start)(0)("0"));
            return;
          }
          ;
          while (!$tco_done1) {
            $tco_result = $tco_loop($tco_var_start, $copy_acc);
          }
          ;
          return $tco_result;
        };
      };
      var $229 = window <= 0;
      if ($229) {
        return [];
      }
      ;
      return go(0)([]);
    };
  };
  var recUpsert = function(k) {
    return function(v) {
      return function(fs) {
        var $233 = any3(function(v1) {
          return v1.value0 === k;
        })(fs);
        if ($233) {
          return map30(function(v1) {
            var $235 = v1.value0 === k;
            if ($235) {
              return new Tuple(v1.value0, v);
            }
            ;
            return new Tuple(v1.value0, v1.value1);
          })(fs);
        }
        ;
        return snoc(fs)(new Tuple(k, v));
      };
    };
  };
  var $$parseInt = function(s) {
    return fromMaybe(0)(fromString(s));
  };
  var okResult = function(v) {
    return new VRecord([new Tuple("$tag", new VString("Ok")), new Tuple("$0", v)]);
  };
  var noneValue = /* @__PURE__ */ function() {
    return new VRecord([new Tuple("$tag", new VString("None"))]);
  }();
  var meanFloorString = function(xs) {
    var $238 = $$null(xs);
    if ($238) {
      return "0";
    }
    ;
    return divFloorStr(sumStrings(xs))(show7(length(xs)));
  };
  var varianceFloorString = function(xs) {
    var $239 = $$null(xs);
    if ($239) {
      return "0";
    }
    ;
    var mean2 = meanFloorString(xs);
    var sumSq = foldl6(function(acc) {
      return function(x) {
        var d = subStr(x)(mean2);
        return addStr(acc)(mulStr(d)(d));
      };
    })("0")(xs);
    return divFloorStr(sumSq)(show7(length(xs)));
  };
  var stddevFloorString = function($1139) {
    return sqrtFloorStr(varianceFloorString($1139));
  };
  var lookupField3 = function(k) {
    return function(fs) {
      var snd$prime = function(v) {
        return v.value1;
      };
      return map210(snd$prime)(find2(function(v) {
        return v.value0 === k;
      })(fs));
    };
  };
  var optionValue = function(v) {
    if (v instanceof VRecord) {
      var v1 = lookupField3("$tag")(v.value0);
      if (v1 instanceof Just && (v1.value0 instanceof VString && v1.value0.value0 === "None")) {
        return new Just(Nothing.value);
      }
      ;
      if (v1 instanceof Just && (v1.value0 instanceof VString && v1.value0.value0 === "Some")) {
        return map210(Just.create)(lookupField3("$0")(v.value0));
      }
      ;
      return Nothing.value;
    }
    ;
    return Nothing.value;
  };
  var recipeField = function(name2) {
    return function(recipe) {
      if (recipe instanceof VRecord) {
        var v = lookupField3(name2)(recipe.value0);
        if (v instanceof Just) {
          return new Right(v.value0);
        }
        ;
        if (v instanceof Nothing) {
          return new Left("missing recipe field '" + (name2 + "'"));
        }
        ;
        throw new Error("Failed pattern match at Verdict.VM.Eval (line 888, column 17 - line 890, column 62): " + [v.constructor.name]);
      }
      ;
      return new Left("invalid recipe");
    };
  };
  var recipeString = function(name2) {
    return function(recipe) {
      return bind12(recipeField(name2)(recipe))(function(v) {
        if (v instanceof VString) {
          return new Right(v.value0);
        }
        ;
        return new Left("recipe field '" + (name2 + "' must be a string"));
      });
    };
  };
  var recipeKind = function(recipe) {
    if (recipe instanceof VRecord) {
      var v = lookupField3("kind")(recipe.value0);
      if (v instanceof Just && v.value0 instanceof VString) {
        return new Just(v.value0.value0);
      }
      ;
      return Nothing.value;
    }
    ;
    return Nothing.value;
  };
  var labelTable = /* @__PURE__ */ foldlWithIndex(foldableWithIndexArray)(function(i) {
    return function(m) {
      return function(instr) {
        if (instr instanceof Label) {
          return insert13(instr.value0)(i)(m);
        }
        ;
        return m;
      };
    };
  })(empty3);
  var knownEffectArgs = function(typ) {
    return function(payload) {
      var mapM = foldr2(function(m) {
        return function(acc) {
          return lift22(cons)(m)(acc);
        };
      })(new Just([]));
      if (payload instanceof VRecord) {
        var f = function(n) {
          return lookupField3(n)(payload.value0);
        };
        if (typ === "http.get") {
          return mapM([f("url")]);
        }
        ;
        if (typ === "http.post") {
          return mapM([f("url"), f("body")]);
        }
        ;
        if (typ === "sys.log") {
          return mapM([f("message")]);
        }
        ;
        if (typ === "sys.cwd") {
          return new Just([]);
        }
        ;
        if (typ === "sys.readText") {
          return mapM([f("path")]);
        }
        ;
        if (typ === "sys.writeText") {
          return mapM([f("path"), f("contents")]);
        }
        ;
        if (typ === "sys.env") {
          return mapM([f("name")]);
        }
        ;
        if (typ === "db.insert") {
          return mapM([f("table"), f("record")]);
        }
        ;
        if (typ === "db.get") {
          return mapM([f("table"), f("id")]);
        }
        ;
        if (typ === "db.update") {
          return mapM([f("table"), f("id"), f("record")]);
        }
        ;
        if (typ === "db.delete") {
          return mapM([f("table"), f("id")]);
        }
        ;
        if (typ === "db.query") {
          return mapM([f("table"), f("query"), f("options")]);
        }
        ;
        if (typ === "db.createIndex") {
          return mapM([f("table"), f("field")]);
        }
        ;
        if (typ === "db.hash") {
          return mapM([f("table")]);
        }
        ;
        if (typ === "cache.set") {
          return mapM([f("ns"), f("cacheKey"), f("value")]);
        }
        ;
        if (typ === "cache.get") {
          return mapM([f("ns"), f("cacheKey")]);
        }
        ;
        if (typ === "cache.delete") {
          return mapM([f("ns"), f("cacheKey")]);
        }
        ;
        return Nothing.value;
      }
      ;
      return Nothing.value;
    };
  };
  var jsonNumberToValue = function(n) {
    var v = fromNumber(n);
    if (v instanceof Just) {
      return new VInt(show7(v.value0));
    }
    ;
    if (v instanceof Nothing) {
      return new VString(show32(n));
    }
    ;
    throw new Error("Failed pattern match at Verdict.VM.Eval (line 787, column 23 - line 789, column 30): " + [v.constructor.name]);
  };
  var jsonToValue = function(json) {
    return caseJson(function(v) {
      return VUnit.value;
    })(VBool.create)(jsonNumberToValue)(VString.create)(function() {
      var $1140 = map30(jsonToValue);
      return function($1141) {
        return VList.create($1140($1141));
      };
    }())(function() {
      var $1142 = map30(function(v) {
        return new Tuple(v.value0, jsonToValue(v.value1));
      });
      return function($1143) {
        return VRecord.create($1142(toUnfoldable10($1143)));
      };
    }())(json);
  };
  var isIntLiteral = function(s) {
    var body = function() {
      var $274 = take(1)(s) === "-";
      if ($274) {
        return drop(1)(s);
      }
      ;
      return s;
    }();
    return body !== "" && all2(function(c) {
      return c >= "0" && c <= "9";
    })(toCharArray(body));
  };
  var initWorld = {
    db: empty3,
    cache: empty3,
    files: empty3,
    logs: [],
    nextId: 0,
    steps: 0,
    procs: empty3,
    ready: [],
    nextPid: 0
  };
  var httpResponse = function(status) {
    return function(ok) {
      return function(body) {
        return new VRecord([new Tuple("status", new VInt(show7(status))), new Tuple("ok", new VBool(ok)), new Tuple("body", new VString(body))]);
      };
    };
  };
  var fuel = 5e6;
  var fromVM = function(v) {
    if (v instanceof VUnitVM) {
      return VUnit.value;
    }
    ;
    if (v instanceof VIntVM) {
      return new VInt(v.value0);
    }
    ;
    if (v instanceof VFixedVM) {
      return new VFixed(v.value0, v.value1);
    }
    ;
    if (v instanceof VRationalVM) {
      var r = reduce(v.value0)(v.value1);
      return new VRational(r.num, r.den);
    }
    ;
    if (v instanceof VBoolVM) {
      return new VBool(v.value0);
    }
    ;
    if (v instanceof VStringVM) {
      return new VString(v.value0);
    }
    ;
    throw new Error("Failed pattern match at Verdict.VM.Eval (line 135, column 10 - line 143, column 27): " + [v.constructor.name]);
  };
  var errResult = function(msg) {
    return new VRecord([new Tuple("$tag", new VString("Err")), new Tuple("$0", new VString(msg))]);
  };
  var resultValue = function(v) {
    if (v instanceof Left) {
      return errResult(v.value0);
    }
    ;
    if (v instanceof Right) {
      return okResult(v.value0);
    }
    ;
    throw new Error("Failed pattern match at Verdict.VM.Eval (line 901, column 15 - line 903, column 24): " + [v.constructor.name]);
  };
  var err = /* @__PURE__ */ function() {
    var $1144 = lift(monadTransStateT)(monadEither);
    return function($1145) {
      return $1144(Left.create($1145));
    };
  }();
  var intList = /* @__PURE__ */ traverse5(function(v) {
    if (v instanceof VInt) {
      return pure9(v.value0);
    }
    ;
    return err("data.* integer list builtin received a non-int element");
  });
  var series0 = function(xs) {
    return function(f) {
      return bind10(intList(xs))(function(ints2) {
        return pure9(seriesOut(f(ints2)));
      });
    };
  };
  var series1 = function(xs) {
    return function(p) {
      return function(f) {
        return bind10(intList(xs))(function(ints2) {
          return pure9(seriesOut(f(ints2)(p)));
        });
      };
    };
  };
  var series1_2 = function(xs) {
    return function(a) {
      return function(b) {
        return function(f) {
          return bind10(intList(xs))(function(ints2) {
            return pure9(seriesOut(f(ints2)(a)(b)));
          });
        };
      };
    };
  };
  var series1_3 = function(xs) {
    return function(a) {
      return function(b) {
        return function(c) {
          return function(f) {
            return bind10(intList(xs))(function(ints2) {
              return pure9(seriesOut(f(ints2)(a)(b)(c)));
            });
          };
        };
      };
    };
  };
  var series2 = function(a) {
    return function(b) {
      return function(f) {
        return bind10(intList(a))(function(xs) {
          return bind10(intList(b))(function(ys) {
            return pure9(seriesOut(f(xs)(ys)));
          });
        });
      };
    };
  };
  var series2_1 = function(a) {
    return function(b) {
      return function(p) {
        return function(f) {
          return bind10(intList(a))(function(xs) {
            return bind10(intList(b))(function(ys) {
              return pure9(seriesOut(f(xs)(ys)(p)));
            });
          });
        };
      };
    };
  };
  var series3 = function(a) {
    return function(b) {
      return function(c) {
        return function(f) {
          return bind10(intList(a))(function(xs) {
            return bind10(intList(b))(function(ys) {
              return bind10(intList(c))(function(zs) {
                return pure9(seriesOut(f(xs)(ys)(zs)));
              });
            });
          });
        };
      };
    };
  };
  var series3_1 = function(a) {
    return function(b) {
      return function(c) {
        return function(p) {
          return function(f) {
            return bind10(intList(a))(function(xs) {
              return bind10(intList(b))(function(ys) {
                return bind10(intList(c))(function(zs) {
                  return pure9(seriesOut(f(xs)(ys)(zs)(p)));
                });
              });
            });
          };
        };
      };
    };
  };
  var jsonObjectPair = function(v) {
    if (v instanceof VRecord) {
      var v1 = lookupField3("value")(v.value0);
      var v2 = lookupField3("key")(v.value0);
      if (v2 instanceof Just && (v2.value0 instanceof VString && v1 instanceof Just)) {
        return pure9(new Tuple(v2.value0.value0, v1.value0));
      }
      ;
      return err("jsonObject expects { key, value } records");
    }
    ;
    return err("jsonObject expects { key, value } records");
  };
  var numAddLike = function(f) {
    return function(rf) {
      return function(a) {
        return function(b) {
          if (a instanceof VInt && b instanceof VInt) {
            return pure9(new VInt(f(a.value0)(b.value0)));
          }
          ;
          if (a instanceof VFixed && b instanceof VFixed) {
            var s = max5(a.value1)(b.value1);
            return pure9(new VFixed(f(scale10(a.value0)(s - a.value1 | 0))(scale10(b.value0)(s - b.value1 | 0)), s));
          }
          ;
          if (a instanceof VRational && b instanceof VRational) {
            var r = rf({
              num: a.value0,
              den: a.value1
            })({
              num: b.value0,
              den: b.value1
            });
            return pure9(new VRational(r.num, r.den));
          }
          ;
          return err("arithmetic on non-numbers");
        };
      };
    };
  };
  var numCompare = function(a) {
    return function(b) {
      if (a instanceof VInt && b instanceof VInt) {
        return pure9(cmpStr(a.value0)(b.value0));
      }
      ;
      if (a instanceof VFixed && b instanceof VFixed) {
        var s = max5(a.value1)(b.value1);
        return pure9(cmpStr(scale10(a.value0)(s - a.value1 | 0))(scale10(b.value0)(s - b.value1 | 0)));
      }
      ;
      if (a instanceof VRational && b instanceof VRational) {
        return pure9(cmp({
          num: a.value0,
          den: a.value1
        })({
          num: b.value0,
          den: b.value1
        }));
      }
      ;
      return err("comparison on non-numbers");
    };
  };
  var numMul2 = function(a) {
    return function(b) {
      if (a instanceof VInt && b instanceof VInt) {
        return pure9(new VInt(mulStr(a.value0)(b.value0)));
      }
      ;
      if (a instanceof VFixed && b instanceof VFixed) {
        return pure9(new VFixed(mulStr(a.value0)(b.value0), a.value1 + b.value1 | 0));
      }
      ;
      if (a instanceof VRational && b instanceof VRational) {
        var r = mul2({
          num: a.value0,
          den: a.value1
        })({
          num: b.value0,
          den: b.value1
        });
        return pure9(new VRational(r.num, r.den));
      }
      ;
      return err("multiply on non-numbers");
    };
  };
  var eqValue = {
    eq: function(x) {
      return function(y) {
        if (x instanceof VUnit && y instanceof VUnit) {
          return true;
        }
        ;
        if (x instanceof VInt && y instanceof VInt) {
          return x.value0 === y.value0;
        }
        ;
        if (x instanceof VFixed && y instanceof VFixed) {
          return x.value0 === y.value0 && x.value1 === y.value1;
        }
        ;
        if (x instanceof VRational && y instanceof VRational) {
          return x.value0 === y.value0 && x.value1 === y.value1;
        }
        ;
        if (x instanceof VBool && y instanceof VBool) {
          return x.value0 === y.value0;
        }
        ;
        if (x instanceof VString && y instanceof VString) {
          return x.value0 === y.value0;
        }
        ;
        if (x instanceof VList && y instanceof VList) {
          return eq(eqArray(eqValue))(x.value0)(y.value0);
        }
        ;
        if (x instanceof VRecord && y instanceof VRecord) {
          return eq(eqArray(eqTuple3(eqValue)))(x.value0)(y.value0);
        }
        ;
        return false;
      };
    }
  };
  var eq33 = /* @__PURE__ */ eq(eqValue);
  var matchCond = function(cond) {
    return function(fv) {
      var applyOp = function(v) {
        return function(v1) {
          if (v1.value0 === "$eq") {
            return eq33(v)(v1.value1);
          }
          ;
          if (v1.value0 === "$gt" && (v instanceof VInt && v1.value1 instanceof VInt)) {
            return cmpStr(v.value0)(v1.value1.value0) > 0;
          }
          ;
          if (v1.value0 === "$gte" && (v instanceof VInt && v1.value1 instanceof VInt)) {
            return cmpStr(v.value0)(v1.value1.value0) >= 0;
          }
          ;
          if (v1.value0 === "$lt" && (v instanceof VInt && v1.value1 instanceof VInt)) {
            return cmpStr(v.value0)(v1.value1.value0) < 0;
          }
          ;
          if (v1.value0 === "$lte" && (v instanceof VInt && v1.value1 instanceof VInt)) {
            return cmpStr(v.value0)(v1.value1.value0) <= 0;
          }
          ;
          return false;
        };
      };
      if (cond instanceof VRecord) {
        return all4(applyOp(fv))(cond.value0);
      }
      ;
      return eq33(cond)(fv);
    };
  };
  var matchesQuery = function(query) {
    return function(row) {
      var matchField = function(fields) {
        return function(v) {
          var v1 = lookupField3(v.value0)(fields);
          if (v1 instanceof Nothing) {
            return false;
          }
          ;
          if (v1 instanceof Just) {
            return matchCond(v.value1)(v1.value0);
          }
          ;
          throw new Error("Failed pattern match at Verdict.VM.Eval (line 1138, column 42 - line 1140, column 33): " + [v1.constructor.name]);
        };
      };
      if (query instanceof VRecord && row instanceof VRecord) {
        return all4(matchField(row.value0))(query.value0);
      }
      ;
      return false;
    };
  };
  var encodeValueJson = function(v) {
    if (v instanceof VUnit) {
      return jsonNull;
    }
    ;
    if (v instanceof VInt) {
      return extend5(assoc9("int")(v.value0))(jsonEmptyObject);
    }
    ;
    if (v instanceof VFixed) {
      return extend5(assoc12("fixed")(extend5(assoc9("value")(v.value0))(extend5(assoc23("scale")(v.value1))(jsonEmptyObject))))(jsonEmptyObject);
    }
    ;
    if (v instanceof VRational) {
      return extend5(assoc12("rational")(extend5(assoc9("numerator")(v.value0))(extend5(assoc9("denominator")(v.value1))(jsonEmptyObject))))(jsonEmptyObject);
    }
    ;
    if (v instanceof VBool) {
      return extend5(assoc33("bool")(v.value0))(jsonEmptyObject);
    }
    ;
    if (v instanceof VString) {
      return extend5(assoc9("string")(v.value0))(jsonEmptyObject);
    }
    ;
    if (v instanceof VList) {
      return extend5(assoc42("list")(map30(encodeValueJson)(v.value0)))(jsonEmptyObject);
    }
    ;
    if (v instanceof VRecord) {
      return extend5(assoc12("record")(id(fromFoldable20(map30(function(v1) {
        return new Tuple(v1.value0, encodeValueJson(v1.value1));
      })(v.value0)))))(jsonEmptyObject);
    }
    ;
    throw new Error("Failed pattern match at Verdict.VM.Eval (line 61, column 19 - line 75, column 27): " + [v.constructor.name]);
  };
  var encodeJsonRecipe = function($copy_recipe) {
    return function($copy_value) {
      var $tco_var_recipe = $copy_recipe;
      var $tco_done = false;
      var $tco_result;
      function $tco_loop(recipe, value) {
        var v = recipeKind(recipe);
        if (v instanceof Just && v.value0 === "value") {
          $tco_done = true;
          return new Right(value);
        }
        ;
        if (v instanceof Just && v.value0 === "int") {
          if (value instanceof VInt) {
            $tco_done = true;
            return new Right(value);
          }
          ;
          $tco_done = true;
          return new Left("json int encoder expected Int");
        }
        ;
        if (v instanceof Just && v.value0 === "string") {
          if (value instanceof VString) {
            $tco_done = true;
            return new Right(value);
          }
          ;
          $tco_done = true;
          return new Left("json string encoder expected String");
        }
        ;
        if (v instanceof Just && v.value0 === "bool") {
          if (value instanceof VBool) {
            $tco_done = true;
            return new Right(value);
          }
          ;
          $tco_done = true;
          return new Left("json bool encoder expected Bool");
        }
        ;
        if (v instanceof Just && v.value0 === "list") {
          $tco_done = true;
          return bind12(recipeField("encoder")(recipe))(function(sub1) {
            if (value instanceof VList) {
              return map32(VList.create)(encodeJsonList(sub1)(value.value0));
            }
            ;
            return new Left("json list encoder expected List");
          });
        }
        ;
        if (v instanceof Just && v.value0 === "nullable") {
          var v1 = optionValue(value);
          if (v1 instanceof Just && v1.value0 instanceof Nothing) {
            $tco_done = true;
            return new Right(VUnit.value);
          }
          ;
          if (v1 instanceof Just && v1.value0 instanceof Just) {
            var v3 = recipeField("encoder")(recipe);
            if (v3 instanceof Left) {
              $tco_done = true;
              return new Left(v3.value0);
            }
            ;
            if (v3 instanceof Right) {
              $tco_var_recipe = v3.value0;
              $copy_value = v1.value0.value0;
              return;
            }
            ;
            throw new Error("Failed pattern match at Verdict.VM.Eval (line 856, column 22 - line 858, column 42): " + [v3.constructor.name]);
          }
          ;
          if (v1 instanceof Nothing) {
            $tco_done = true;
            return new Left("json nullable encoder expected Option");
          }
          ;
          throw new Error("Failed pattern match at Verdict.VM.Eval (line 854, column 22 - line 859, column 60): " + [v1.constructor.name]);
        }
        ;
        if (v instanceof Just) {
          $tco_done = true;
          return new Left("unknown encoder kind '" + (v.value0 + "'"));
        }
        ;
        if (v instanceof Nothing) {
          $tco_done = true;
          return new Left("invalid encoder");
        }
        ;
        throw new Error("Failed pattern match at Verdict.VM.Eval (line 838, column 33 - line 861, column 36): " + [v.constructor.name]);
      }
      ;
      while (!$tco_done) {
        $tco_result = $tco_loop($tco_var_recipe, $copy_value);
      }
      ;
      return $tco_result;
    };
  };
  var encodeJsonList = function(recipe) {
    return function(xs) {
      var v = uncons(xs);
      if (v instanceof Nothing) {
        return new Right([]);
      }
      ;
      if (v instanceof Just) {
        return bind12(encodeJsonRecipe(recipe)(v.value0.head))(function(h) {
          return bind12(encodeJsonList(recipe)(v.value0.tail))(function(t) {
            return new Right(cons(h)(t));
          });
        });
      }
      ;
      throw new Error("Failed pattern match at Verdict.VM.Eval (line 872, column 28 - line 877, column 27): " + [v.constructor.name]);
    };
  };
  var distinctStrings = /* @__PURE__ */ foldl6(function(acc) {
    return function(x) {
      var $418 = elem3(x)(acc);
      if ($418) {
        return acc;
      }
      ;
      return snoc(acc)(x);
    };
  })([]);
  var decodeJsonRecipe = function(recipe) {
    return function(value) {
      var v = recipeKind(recipe);
      if (v instanceof Just && v.value0 === "value") {
        return new Right(value);
      }
      ;
      if (v instanceof Just && v.value0 === "int") {
        if (value instanceof VInt) {
          return new Right(value);
        }
        ;
        return new Left("expected Int");
      }
      ;
      if (v instanceof Just && v.value0 === "string") {
        if (value instanceof VString) {
          return new Right(value);
        }
        ;
        return new Left("expected String");
      }
      ;
      if (v instanceof Just && v.value0 === "bool") {
        if (value instanceof VBool) {
          return new Right(value);
        }
        ;
        return new Left("expected Bool");
      }
      ;
      if (v instanceof Just && v.value0 === "field") {
        return bind12(recipeString("name")(recipe))(function(name2) {
          return bind12(recipeField("decoder")(recipe))(function(sub1) {
            if (value instanceof VRecord) {
              var v1 = lookupField3(name2)(value.value0);
              if (v1 instanceof Just) {
                return decodeJsonRecipe(sub1)(v1.value0);
              }
              ;
              if (v1 instanceof Nothing) {
                return new Left("missing field '" + (name2 + "'"));
              }
              ;
              throw new Error("Failed pattern match at Verdict.VM.Eval (line 820, column 21 - line 822, column 59): " + [v1.constructor.name]);
            }
            ;
            return new Left("expected object");
          });
        });
      }
      ;
      if (v instanceof Just && v.value0 === "list") {
        return bind12(recipeField("decoder")(recipe))(function(sub1) {
          if (value instanceof VList) {
            return map32(VList.create)(decodeJsonList(sub1)(value.value0));
          }
          ;
          return new Left("expected list");
        });
      }
      ;
      if (v instanceof Just && v.value0 === "nullable") {
        var $438 = eq33(value)(VUnit.value);
        if ($438) {
          return new Right(noneValue);
        }
        ;
        return bind12(recipeField("decoder")(recipe))(function(sub1) {
          return map32(someValue)(decodeJsonRecipe(sub1)(value));
        });
      }
      ;
      if (v instanceof Just) {
        return new Left("unknown decoder kind '" + (v.value0 + "'"));
      }
      ;
      if (v instanceof Nothing) {
        return new Left("invalid decoder");
      }
      ;
      throw new Error("Failed pattern match at Verdict.VM.Eval (line 805, column 33 - line 835, column 36): " + [v.constructor.name]);
    };
  };
  var decodeJsonList = function(recipe) {
    return function(xs) {
      var v = uncons(xs);
      if (v instanceof Nothing) {
        return new Right([]);
      }
      ;
      if (v instanceof Just) {
        return bind12(decodeJsonRecipe(recipe)(v.value0.head))(function(h) {
          return bind12(decodeJsonList(recipe)(v.value0.tail))(function(t) {
            return new Right(cons(h)(t));
          });
        });
      }
      ;
      throw new Error("Failed pattern match at Verdict.VM.Eval (line 864, column 28 - line 869, column 27): " + [v.constructor.name]);
    };
  };
  var cmpIntString = function(a) {
    return function(b) {
      var c = cmpStr(a)(b);
      var $445 = c < 0;
      if ($445) {
        return LT.value;
      }
      ;
      var $446 = c > 0;
      if ($446) {
        return GT.value;
      }
      ;
      return EQ.value;
    };
  };
  var sortedIntStrings = /* @__PURE__ */ sortBy(cmpIntString);
  var maxString = function(xs) {
    return fromMaybe("0")(last(sortedIntStrings(xs)));
  };
  var medianString = function(xs) {
    var sorted = sortedIntStrings(xs);
    var n = length(sorted);
    var mid = div3(n)(2);
    var $447 = n === 0;
    if ($447) {
      return "0";
    }
    ;
    var $448 = mod4(n)(2) === 1;
    if ($448) {
      return fromMaybe("0")(index(sorted)(mid));
    }
    ;
    var b = fromMaybe("0")(index(sorted)(mid));
    var a = fromMaybe("0")(index(sorted)(mid - 1 | 0));
    return divFloorStr(addStr(a)(b))("2");
  };
  var minString = function(xs) {
    return fromMaybe("0")(head(sortedIntStrings(xs)));
  };
  var describeIntsValue = function(xs) {
    return new VRecord([new Tuple("count", new VInt(show7(length(xs)))), new Tuple("sum", new VInt(sumStrings(xs))), new Tuple("min", new VInt(minString(xs))), new Tuple("max", new VInt(maxString(xs))), new Tuple("mean", new VInt(meanFloorString(xs))), new Tuple("median", new VInt(medianString(xs))), new Tuple("variance", new VInt(varianceFloorString(xs))), new Tuple("stddev", new VInt(stddevFloorString(xs)))]);
  };
  var percentileNearestString = function(pct) {
    return function(xs) {
      var sorted = sortedIntStrings(xs);
      var p = max5(0)(min3(100)(pct));
      var n = length(sorted);
      var rank = function() {
        var $449 = n === 0;
        if ($449) {
          return 0;
        }
        ;
        return div3((p * n | 0) + 99 | 0)(100) - 1 | 0;
      }();
      var ix = max5(0)(min3(n - 1 | 0)(rank));
      var $450 = n === 0;
      if ($450) {
        return "0";
      }
      ;
      return fromMaybe("0")(index(sorted)(ix));
    };
  };
  var valueCountsStrings = function(xs) {
    var addCount = function(acc) {
      return function(x) {
        var v = unsnoc(acc);
        if (v instanceof Just && v.value0.last.value0 === x) {
          return snoc(v.value0.init)(new Tuple(v.value0.last.value0, v.value0.last.value1 + 1 | 0));
        }
        ;
        return snoc(acc)(new Tuple(x, 1));
      };
    };
    return foldl6(addCount)([])(sortedIntStrings(xs));
  };
  var argRegs = function(as) {
    return fromFoldable110(mapWithIndex2(Tuple.create)(as));
  };
  var initialFrame = function(fn) {
    return function(args) {
      return {
        fn,
        regs: argRegs(args),
        pc: 0,
        stack: []
      };
    };
  };
  var absIntString = function(s) {
    var $457 = take(1)(s) === "-";
    if ($457) {
      return drop(1)(s);
    }
    ;
    return s;
  };
  var lcmStr = function(a) {
    return function(b) {
      var g = gcdStr(a)(b);
      var $458 = g === "0";
      if ($458) {
        return "0";
      }
      ;
      return absIntString(divFloorStr(mulStr(a)(b))(g));
    };
  };
  var callBuiltin = function(bid) {
    return function(args) {
      if (bid === "logic.and@1" && (args.length === 2 && (args[0] instanceof VBool && args[1] instanceof VBool))) {
        return pure9(new VBool(args[0].value0 && args[1].value0));
      }
      ;
      if (bid === "logic.or@1" && (args.length === 2 && (args[0] instanceof VBool && args[1] instanceof VBool))) {
        return pure9(new VBool(args[0].value0 || args[1].value0));
      }
      ;
      if (bid === "logic.not@1" && (args.length === 1 && args[0] instanceof VBool)) {
        return pure9(new VBool(!args[0].value0));
      }
      ;
      if (bid === "bigint.modPow@1" && (args.length === 3 && (args[0] instanceof VInt && (args[1] instanceof VInt && args[2] instanceof VInt)))) {
        return pure9(new VInt(modPowStr(args[0].value0)(args[1].value0)(args[2].value0)));
      }
      ;
      if (bid === "bigint.modInv@1" && (args.length === 2 && (args[0] instanceof VInt && args[1] instanceof VInt))) {
        return pure9(new VInt(modInvStr(args[0].value0)(args[1].value0)));
      }
      ;
      if (bid === "math.gcd@1" && (args.length === 2 && (args[0] instanceof VInt && args[1] instanceof VInt))) {
        return pure9(new VInt(gcdStr(args[0].value0)(args[1].value0)));
      }
      ;
      if (bid === "math.lcm@1" && (args.length === 2 && (args[0] instanceof VInt && args[1] instanceof VInt))) {
        return pure9(new VInt(lcmStr(args[0].value0)(args[1].value0)));
      }
      ;
      if (bid === "math.pow@1" && (args.length === 2 && (args[0] instanceof VInt && args[1] instanceof VInt))) {
        if (cmpStr(args[1].value0)("0") < 0) {
          return err("math.pow expects a non-negative exponent");
        }
        ;
        if (otherwise) {
          return pure9(new VInt(powStr(args[0].value0)(args[1].value0)));
        }
        ;
      }
      ;
      if (bid === "math.sqrtFloor@1" && (args.length === 1 && args[0] instanceof VInt)) {
        if (cmpStr(args[0].value0)("0") < 0) {
          return err("math.sqrtFloor expects a non-negative integer");
        }
        ;
        if (otherwise) {
          return pure9(new VInt(sqrtFloorStr(args[0].value0)));
        }
        ;
      }
      ;
      if (bid === "db.insert@1" && (args.length === 2 && args[0] instanceof VString)) {
        return bind10(get5)(function(w) {
          var idStr = show7(w.nextId);
          var tbl = fromMaybe(empty3)(lookup10(args[0].value0)(w.db));
          return discard7(put3(function() {
            var $495 = {};
            for (var $496 in w) {
              if ({}.hasOwnProperty.call(w, $496)) {
                $495[$496] = w[$496];
              }
              ;
            }
            ;
            $495.db = insert13(args[0].value0)(insert13(idStr)(args[1])(tbl))(w.db);
            $495.nextId = w.nextId + 1 | 0;
            return $495;
          }()))(function() {
            return pure9(new VString(idStr));
          });
        });
      }
      ;
      if (bid === "db.get@1" && (args.length === 2 && (args[0] instanceof VString && args[1] instanceof VString))) {
        return bind10(get5)(function(w) {
          return pure9(fromMaybe(VUnit.value)(bind22(lookup10(args[0].value0)(w.db))(lookup10(args[1].value0))));
        });
      }
      ;
      if (bid === "db.update@1" && (args.length === 3 && (args[0] instanceof VString && args[1] instanceof VString))) {
        return bind10(get5)(function(w) {
          var v2 = bind22(lookup10(args[0].value0)(w.db))(lookup10(args[1].value0));
          if (v2 instanceof Nothing) {
            return pure9(new VBool(false));
          }
          ;
          if (v2 instanceof Just) {
            var tbl = fromMaybe(empty3)(lookup10(args[0].value0)(w.db));
            return discard7(put3(function() {
              var $506 = {};
              for (var $507 in w) {
                if ({}.hasOwnProperty.call(w, $507)) {
                  $506[$507] = w[$507];
                }
                ;
              }
              ;
              $506.db = insert13(args[0].value0)(insert13(args[1].value0)(args[2])(tbl))(w.db);
              return $506;
            }()))(function() {
              return pure9(new VBool(true));
            });
          }
          ;
          throw new Error("Failed pattern match at Verdict.VM.Eval (line 570, column 5 - line 575, column 26): " + [v2.constructor.name]);
        });
      }
      ;
      if (bid === "db.delete@1" && (args.length === 2 && (args[0] instanceof VString && args[1] instanceof VString))) {
        return bind10(get5)(function(w) {
          var v2 = lookup10(args[0].value0)(w.db);
          if (v2 instanceof Just && member9(args[1].value0)(v2.value0)) {
            return discard7(put3(function() {
              var $516 = {};
              for (var $517 in w) {
                if ({}.hasOwnProperty.call(w, $517)) {
                  $516[$517] = w[$517];
                }
                ;
              }
              ;
              $516.db = insert13(args[0].value0)($$delete7(args[1].value0)(v2.value0))(w.db);
              return $516;
            }()))(function() {
              return pure9(new VBool(true));
            });
          }
          ;
          return pure9(new VBool(false));
        });
      }
      ;
      if (bid === "db.query@1" && (args.length === 3 && args[0] instanceof VString)) {
        return bind10(get5)(function(w) {
          var rows = maybe([])(function($1146) {
            return fromFoldable24(values($1146));
          })(lookup10(args[0].value0)(w.db));
          return pure9(new VList(filter(matchesQuery(args[1]))(rows)));
        });
      }
      ;
      if (bid === "db.createIndex@1" && (args.length === 2 && (args[0] instanceof VString && args[1] instanceof VString))) {
        return pure9(VUnit.value);
      }
      ;
      if (bid === "db.hash@1" && (args.length === 1 && args[0] instanceof VString)) {
        return bind10(get5)(function(w) {
          var tbl = fromMaybe(empty3)(lookup10(args[0].value0)(w.db));
          var entries = map30(function(v2) {
            return v2.value0 + ("=" + serialize(v2.value1));
          })(toUnfoldable1(tbl));
          return pure9(new VString(joinWith(";")(entries)));
        });
      }
      ;
      if (bid === "cache.set@1" && (args.length === 3 && (args[0] instanceof VString && args[1] instanceof VString))) {
        return bind10(get5)(function(w) {
          return discard7(put3(function() {
            var $537 = {};
            for (var $538 in w) {
              if ({}.hasOwnProperty.call(w, $538)) {
                $537[$538] = w[$538];
              }
              ;
            }
            ;
            $537.cache = insert13(args[0].value0 + ("\0" + args[1].value0))(args[2])(w.cache);
            return $537;
          }()))(function() {
            return pure9(new VBool(true));
          });
        });
      }
      ;
      if (bid === "cache.get@1" && (args.length === 2 && (args[0] instanceof VString && args[1] instanceof VString))) {
        return bind10(get5)(function(w) {
          return pure9(fromMaybe(VUnit.value)(lookup10(args[0].value0 + ("\0" + args[1].value0))(w.cache)));
        });
      }
      ;
      if (bid === "cache.delete@1" && (args.length === 2 && (args[0] instanceof VString && args[1] instanceof VString))) {
        return bind10(get5)(function(w) {
          var k = args[0].value0 + ("\0" + args[1].value0);
          var had = member9(k)(w.cache);
          return discard7(put3(function() {
            var $549 = {};
            for (var $550 in w) {
              if ({}.hasOwnProperty.call(w, $550)) {
                $549[$550] = w[$550];
              }
              ;
            }
            ;
            $549.cache = $$delete7(k)(w.cache);
            return $549;
          }()))(function() {
            return pure9(new VBool(had));
          });
        });
      }
      ;
      if (bid === "http.get@1" && (args.length === 1 && args[0] instanceof VString)) {
        return pure9(httpResponse(200)(true)("GET " + args[0].value0));
      }
      ;
      if (bid === "http.post@1" && (args.length === 2 && (args[0] instanceof VString && args[1] instanceof VString))) {
        return pure9(httpResponse(200)(true)("POST " + (args[0].value0 + (" " + args[1].value0))));
      }
      ;
      if (bid === "sys.log@1" && (args.length === 1 && args[0] instanceof VString)) {
        return bind10(get5)(function(w) {
          return discard7(put3(function() {
            var $562 = {};
            for (var $563 in w) {
              if ({}.hasOwnProperty.call(w, $563)) {
                $562[$563] = w[$563];
              }
              ;
            }
            ;
            $562.logs = snoc(w.logs)(args[0].value0);
            return $562;
          }()))(function() {
            return pure9(VUnit.value);
          });
        });
      }
      ;
      if (bid === "sys.cwd@1" && args.length === 0) {
        return pure9(new VString("/"));
      }
      ;
      if (bid === "sys.readText@1" && (args.length === 1 && args[0] instanceof VString)) {
        return bind10(get5)(function(w) {
          return pure9(maybe(VUnit.value)(VString.create)(lookup10(args[0].value0)(w.files)));
        });
      }
      ;
      if (bid === "sys.writeText@1" && (args.length === 2 && (args[0] instanceof VString && args[1] instanceof VString))) {
        return bind10(get5)(function(w) {
          return discard7(put3(function() {
            var $569 = {};
            for (var $570 in w) {
              if ({}.hasOwnProperty.call(w, $570)) {
                $569[$570] = w[$570];
              }
              ;
            }
            ;
            $569.files = insert13(args[0].value0)(args[1].value0)(w.files);
            return $569;
          }()))(function() {
            return pure9(new VBool(true));
          });
        });
      }
      ;
      if (bid === "sys.env@1" && (args.length === 1 && args[0] instanceof VString)) {
        return pure9(function() {
          if (args[0].value0 === "PWD") {
            return new VString("/");
          }
          ;
          if (args[0].value0 === "VERDICT") {
            return new VString("1");
          }
          ;
          return VUnit.value;
        }());
      }
      ;
      if (bid === "data.sortInts@1" && (args.length === 1 && args[0] instanceof VList)) {
        return bind10(intList(args[0].value0))(function(ints2) {
          return pure9(new VList(map30(VInt.create)(sortBy(cmpIntString)(ints2))));
        });
      }
      ;
      if (bid === "data.distinctInts@1" && (args.length === 1 && args[0] instanceof VList)) {
        return bind10(intList(args[0].value0))(function(ints2) {
          return pure9(new VList(map30(VInt.create)(distinctStrings(ints2))));
        });
      }
      ;
      if (bid === "data.sumInts@1" && (args.length === 1 && args[0] instanceof VList)) {
        return bind10(intList(args[0].value0))(function(ints2) {
          return pure9(new VInt(sumStrings(ints2)));
        });
      }
      ;
      if (bid === "data.averageFloor@1" && (args.length === 1 && args[0] instanceof VList)) {
        return bind10(intList(args[0].value0))(function(ints2) {
          return pure9(new VInt(function() {
            var $585 = $$null(ints2);
            if ($585) {
              return "0";
            }
            ;
            return divFloorStr(sumStrings(ints2))(show7(length(ints2)));
          }()));
        });
      }
      ;
      if (bid === "regex.test@1" && (args.length === 2 && (args[0] instanceof VString && args[1] instanceof VString))) {
        return pure9(new VBool(regexTest(args[0].value0)(args[1].value0)));
      }
      ;
      if (bid === "regex.findAll@1" && (args.length === 2 && (args[0] instanceof VString && args[1] instanceof VString))) {
        return pure9(new VList(map30(VString.create)(regexFindAll(args[0].value0)(args[1].value0))));
      }
      ;
      if (bid === "regex.replace@1" && (args.length === 3 && (args[0] instanceof VString && (args[1] instanceof VString && args[2] instanceof VString)))) {
        return pure9(new VString(regexReplace(args[0].value0)(args[1].value0)(args[2].value0)));
      }
      ;
      if (bid === "regex.split@1" && (args.length === 2 && (args[0] instanceof VString && args[1] instanceof VString))) {
        return pure9(new VList(map30(VString.create)(regexSplit(args[0].value0)(args[1].value0))));
      }
      ;
      if (bid === "stats.min@1" && (args.length === 1 && args[0] instanceof VList)) {
        return bind10(intList(args[0].value0))(function($1147) {
          return pure9(VInt.create(minString($1147)));
        });
      }
      ;
      if (bid === "stats.max@1" && (args.length === 1 && args[0] instanceof VList)) {
        return bind10(intList(args[0].value0))(function($1148) {
          return pure9(VInt.create(maxString($1148)));
        });
      }
      ;
      if (bid === "stats.meanFloor@1" && (args.length === 1 && args[0] instanceof VList)) {
        return bind10(intList(args[0].value0))(function($1149) {
          return pure9(VInt.create(meanFloorString($1149)));
        });
      }
      ;
      if (bid === "stats.median@1" && (args.length === 1 && args[0] instanceof VList)) {
        return bind10(intList(args[0].value0))(function($1150) {
          return pure9(VInt.create(medianString($1150)));
        });
      }
      ;
      if (bid === "stats.percentileNearest@1" && (args.length === 2 && (args[0] instanceof VInt && args[1] instanceof VList))) {
        return bind10(intList(args[1].value0))(function() {
          var $1151 = percentileNearestString($$parseInt(args[0].value0));
          return function($1152) {
            return pure9(VInt.create($1151($1152)));
          };
        }());
      }
      ;
      if (bid === "stats.varianceFloor@1" && (args.length === 1 && args[0] instanceof VList)) {
        return bind10(intList(args[0].value0))(function($1153) {
          return pure9(VInt.create(varianceFloorString($1153)));
        });
      }
      ;
      if (bid === "stats.stddevFloor@1" && (args.length === 1 && args[0] instanceof VList)) {
        return bind10(intList(args[0].value0))(function($1154) {
          return pure9(VInt.create(stddevFloorString($1154)));
        });
      }
      ;
      if (bid === "stats.describeInts@1" && (args.length === 1 && args[0] instanceof VList)) {
        return bind10(intList(args[0].value0))(function(ints2) {
          return pure9(describeIntsValue(ints2));
        });
      }
      ;
      if (bid === "stats.valueCountsInts@1" && (args.length === 1 && args[0] instanceof VList)) {
        return bind10(intList(args[0].value0))(function(ints2) {
          return pure9(new VList(map30(valueCountValue)(valueCountsStrings(ints2))));
        });
      }
      ;
      if (bid === "stats.rollingSumInts@1" && (args.length === 2 && (args[0] instanceof VInt && args[1] instanceof VList))) {
        return bind10(intList(args[1].value0))(function(ints2) {
          return pure9(new VList(map30(VInt.create)(rollingSumStrings($$parseInt(args[0].value0))(ints2))));
        });
      }
      ;
      if (bid === "series.sma@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VInt))) {
        return series1(args[0].value0)(args[1].value0)(sma);
      }
      ;
      if (bid === "series.ema@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VInt))) {
        return series1(args[0].value0)(args[1].value0)(ema);
      }
      ;
      if (bid === "series.wma@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VInt))) {
        return series1(args[0].value0)(args[1].value0)(wma);
      }
      ;
      if (bid === "series.rollingMedian@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VInt))) {
        return series1(args[0].value0)(args[1].value0)(rollingMedian);
      }
      ;
      if (bid === "series.momentum@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VInt))) {
        return series1(args[0].value0)(args[1].value0)(momentum);
      }
      ;
      if (bid === "series.roc@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VInt))) {
        return series1(args[0].value0)(args[1].value0)(roc);
      }
      ;
      if (bid === "series.rsi@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VInt))) {
        return series1(args[0].value0)(args[1].value0)(rsi);
      }
      ;
      if (bid === "series.macd@1" && (args.length === 3 && (args[0] instanceof VList && (args[1] instanceof VInt && args[2] instanceof VInt)))) {
        return series1_2(args[0].value0)(args[1].value0)(args[2].value0)(macd);
      }
      ;
      if (bid === "series.macdSignal@1" && (args.length === 4 && (args[0] instanceof VList && (args[1] instanceof VInt && (args[2] instanceof VInt && args[3] instanceof VInt))))) {
        return series1_3(args[0].value0)(args[1].value0)(args[2].value0)(args[3].value0)(macdSignal);
      }
      ;
      if (bid === "series.macdHistogram@1" && (args.length === 4 && (args[0] instanceof VList && (args[1] instanceof VInt && (args[2] instanceof VInt && args[3] instanceof VInt))))) {
        return series1_3(args[0].value0)(args[1].value0)(args[2].value0)(args[3].value0)(macdHistogram);
      }
      ;
      if (bid === "series.slope@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VInt))) {
        return series1(args[0].value0)(args[1].value0)(slope);
      }
      ;
      if (bid === "series.rollingStd@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VInt))) {
        return series1(args[0].value0)(args[1].value0)(rollingStd);
      }
      ;
      if (bid === "series.realizedVol@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VInt))) {
        return series1(args[0].value0)(args[1].value0)(realizedVol);
      }
      ;
      if (bid === "series.ewmStd@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VInt))) {
        return series1(args[0].value0)(args[1].value0)(ewmStd);
      }
      ;
      if (bid === "series.stdevRatio@1" && (args.length === 3 && (args[0] instanceof VList && (args[1] instanceof VInt && args[2] instanceof VInt)))) {
        return series1_2(args[0].value0)(args[1].value0)(args[2].value0)(stdevRatio);
      }
      ;
      if (bid === "series.atrApprox@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VInt))) {
        return series1(args[0].value0)(args[1].value0)(atrApprox);
      }
      ;
      if (bid === "series.bollingerUpper@1" && (args.length === 3 && (args[0] instanceof VList && (args[1] instanceof VInt && args[2] instanceof VInt)))) {
        return series1_2(args[0].value0)(args[1].value0)(args[2].value0)(bollingerUpper);
      }
      ;
      if (bid === "series.bollingerLower@1" && (args.length === 3 && (args[0] instanceof VList && (args[1] instanceof VInt && args[2] instanceof VInt)))) {
        return series1_2(args[0].value0)(args[1].value0)(args[2].value0)(bollingerLower);
      }
      ;
      if (bid === "series.zscore@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VInt))) {
        return series1(args[0].value0)(args[1].value0)(zscore);
      }
      ;
      if (bid === "series.percentileRank@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VInt))) {
        return series1(args[0].value0)(args[1].value0)(percentileRank);
      }
      ;
      if (bid === "series.drawdown@1" && (args.length === 1 && args[0] instanceof VList)) {
        return series0(args[0].value0)(drawdown);
      }
      ;
      if (bid === "series.pctChange@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VInt))) {
        return series1(args[0].value0)(args[1].value0)(pctChange);
      }
      ;
      if (bid === "series.ratio@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VList))) {
        return series2(args[0].value0)(args[1].value0)(ratio);
      }
      ;
      if (bid === "series.spread@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VList))) {
        return series2(args[0].value0)(args[1].value0)(spread);
      }
      ;
      if (bid === "series.rollingCorr@1" && (args.length === 3 && (args[0] instanceof VList && (args[1] instanceof VList && args[2] instanceof VInt)))) {
        return series2_1(args[0].value0)(args[1].value0)(args[2].value0)(rollingCorr);
      }
      ;
      if (bid === "series.rollingBeta@1" && (args.length === 3 && (args[0] instanceof VList && (args[1] instanceof VList && args[2] instanceof VInt)))) {
        return series2_1(args[0].value0)(args[1].value0)(args[2].value0)(rollingBeta);
      }
      ;
      if (bid === "series.relativeMomentum@1" && (args.length === 3 && (args[0] instanceof VList && (args[1] instanceof VList && args[2] instanceof VInt)))) {
        return series2_1(args[0].value0)(args[1].value0)(args[2].value0)(relativeMomentum);
      }
      ;
      if (bid === "series.hedgeRatio@1" && (args.length === 3 && (args[0] instanceof VList && (args[1] instanceof VList && args[2] instanceof VInt)))) {
        return series2_1(args[0].value0)(args[1].value0)(args[2].value0)(hedgeRatio);
      }
      ;
      if (bid === "series.add@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VList))) {
        return series2(args[0].value0)(args[1].value0)(seriesAdd);
      }
      ;
      if (bid === "series.sub@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VList))) {
        return series2(args[0].value0)(args[1].value0)(seriesSub);
      }
      ;
      if (bid === "series.mul@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VList))) {
        return series2(args[0].value0)(args[1].value0)(seriesMul);
      }
      ;
      if (bid === "series.div@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VList))) {
        return series2(args[0].value0)(args[1].value0)(seriesDiv);
      }
      ;
      if (bid === "series.abs@1" && (args.length === 1 && args[0] instanceof VList)) {
        return series0(args[0].value0)(seriesAbs);
      }
      ;
      if (bid === "series.clip@1" && (args.length === 3 && (args[0] instanceof VList && (args[1] instanceof VInt && args[2] instanceof VInt)))) {
        return series1_2(args[0].value0)(args[1].value0)(args[2].value0)(clip);
      }
      ;
      if (bid === "series.shift@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VInt))) {
        return series1(args[0].value0)(args[1].value0)(shift);
      }
      ;
      if (bid === "series.diff@1" && (args.length === 1 && args[0] instanceof VList)) {
        return series0(args[0].value0)(diff);
      }
      ;
      if (bid === "series.log@1" && (args.length === 1 && args[0] instanceof VList)) {
        return series0(args[0].value0)(logSeries);
      }
      ;
      if (bid === "series.rollingMax@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VInt))) {
        return series1(args[0].value0)(args[1].value0)(rollingMax);
      }
      ;
      if (bid === "series.rollingMin@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VInt))) {
        return series1(args[0].value0)(args[1].value0)(rollingMin);
      }
      ;
      if (bid === "series.cummax@1" && (args.length === 1 && args[0] instanceof VList)) {
        return series0(args[0].value0)(cummax);
      }
      ;
      if (bid === "series.cummin@1" && (args.length === 1 && args[0] instanceof VList)) {
        return series0(args[0].value0)(cummin);
      }
      ;
      if (bid === "series.crossover@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VList))) {
        return series2(args[0].value0)(args[1].value0)(crossover);
      }
      ;
      if (bid === "series.crossunder@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VList))) {
        return series2(args[0].value0)(args[1].value0)(crossunder);
      }
      ;
      if (bid === "series.atrOhlc@1" && (args.length === 4 && (args[0] instanceof VList && (args[1] instanceof VList && (args[2] instanceof VList && args[3] instanceof VInt))))) {
        return series3_1(args[0].value0)(args[1].value0)(args[2].value0)(args[3].value0)(atrOhlc);
      }
      ;
      if (bid === "series.trueRange@1" && (args.length === 3 && (args[0] instanceof VList && (args[1] instanceof VList && args[2] instanceof VList)))) {
        return series3(args[0].value0)(args[1].value0)(args[2].value0)(trueRange);
      }
      ;
      if (bid === "series.vwap@1" && (args.length === 3 && (args[0] instanceof VList && (args[1] instanceof VList && args[2] instanceof VInt)))) {
        return series2_1(args[0].value0)(args[1].value0)(args[2].value0)(vwap);
      }
      ;
      if (bid === "series.obv@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VList))) {
        return series2(args[0].value0)(args[1].value0)(obv);
      }
      ;
      if (bid === "series.volumeSma@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VInt))) {
        return series1(args[0].value0)(args[1].value0)(volumeSma);
      }
      ;
      if (bid === "series.volumeRatio@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VInt))) {
        return series1(args[0].value0)(args[1].value0)(volumeRatio);
      }
      ;
      if (bid === "series.bodySize@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VList))) {
        return series2(args[0].value0)(args[1].value0)(bodySize);
      }
      ;
      if (bid === "series.upperWick@1" && (args.length === 3 && (args[0] instanceof VList && (args[1] instanceof VList && args[2] instanceof VList)))) {
        return series3(args[0].value0)(args[1].value0)(args[2].value0)(upperWick);
      }
      ;
      if (bid === "series.lowerWick@1" && (args.length === 3 && (args[0] instanceof VList && (args[1] instanceof VList && args[2] instanceof VList)))) {
        return series3(args[0].value0)(args[1].value0)(args[2].value0)(lowerWick);
      }
      ;
      if (bid === "series.rangePct@1" && (args.length === 2 && (args[0] instanceof VList && args[1] instanceof VList))) {
        return series2(args[0].value0)(args[1].value0)(rangePct);
      }
      ;
      if (bid === "str.length@1" && (args.length === 1 && args[0] instanceof VString)) {
        return pure9(new VInt(show7(length2(args[0].value0))));
      }
      ;
      if (bid === "str.concat@1" && (args.length === 2 && (args[0] instanceof VString && args[1] instanceof VString))) {
        return pure9(new VString(args[0].value0 + args[1].value0));
      }
      ;
      if (bid === "str.slice@1" && (args.length === 3 && (args[0] instanceof VString && (args[1] instanceof VInt && args[2] instanceof VInt)))) {
        var start = max5(0)($$parseInt(args[1].value0));
        var len = max5(0)($$parseInt(args[2].value0));
        return pure9(new VString(take(len)(drop(start)(args[0].value0))));
      }
      ;
      if (bid === "str.indexOf@1" && (args.length === 2 && (args[0] instanceof VString && args[1] instanceof VString))) {
        return pure9(new VInt(show7(fromMaybe(-1 | 0)(indexOf(args[1].value0)(args[0].value0)))));
      }
      ;
      if (bid === "str.split@1" && (args.length === 2 && (args[0] instanceof VString && args[1] instanceof VString))) {
        return pure9(new VList(map30(VString.create)(split(args[1].value0)(args[0].value0))));
      }
      ;
      if (bid === "str.toUpper@1" && (args.length === 1 && args[0] instanceof VString)) {
        return pure9(new VString(toUpper(args[0].value0)));
      }
      ;
      if (bid === "str.toLower@1" && (args.length === 1 && args[0] instanceof VString)) {
        return pure9(new VString(toLower(args[0].value0)));
      }
      ;
      if (bid === "str.trim@1" && (args.length === 1 && args[0] instanceof VString)) {
        return pure9(new VString(trim(args[0].value0)));
      }
      ;
      if (bid === "str.fromInt@1" && (args.length === 1 && args[0] instanceof VInt)) {
        return pure9(new VString(args[0].value0));
      }
      ;
      if (bid === "str.toInt@1" && (args.length === 1 && args[0] instanceof VString)) {
        return pure9(function() {
          var $896 = isIntLiteral(args[0].value0);
          if ($896) {
            return new VInt(normalizeStr(args[0].value0));
          }
          ;
          return VUnit.value;
        }());
      }
      ;
      if (bid === "str.replace@1" && (args.length === 3 && (args[0] instanceof VString && (args[1] instanceof VString && args[2] instanceof VString)))) {
        return pure9(new VString(replaceAll(args[1].value0)(args[2].value0)(args[0].value0)));
      }
      ;
      if (bid === "json.decodeValue@1" && args.length === 2) {
        return pure9(resultValue(decodeJsonRecipe(args[0])(args[1])));
      }
      ;
      if (bid === "json.decodeString@1" && (args.length === 2 && args[1] instanceof VString)) {
        var v = jsonParser(args[1].value0);
        if (v instanceof Left) {
          return pure9(errResult("invalid JSON: " + v.value0));
        }
        ;
        if (v instanceof Right) {
          return pure9(resultValue(decodeJsonRecipe(args[0])(jsonToValue(v.value0))));
        }
        ;
        throw new Error("Failed pattern match at Verdict.VM.Eval (line 757, column 5 - line 759, column 84): " + [v.constructor.name]);
      }
      ;
      if (bid === "json.encodeValue@1" && args.length === 2) {
        var v = encodeJsonRecipe(args[0])(args[1]);
        if (v instanceof Left) {
          return err(v.value0);
        }
        ;
        if (v instanceof Right) {
          return pure9(v.value0);
        }
        ;
        throw new Error("Failed pattern match at Verdict.VM.Eval (line 761, column 5 - line 763, column 24): " + [v.constructor.name]);
      }
      ;
      if (bid === "json.encodeString@1" && args.length === 2) {
        var v = encodeJsonRecipe(args[0])(args[1]);
        if (v instanceof Left) {
          return err(v.value0);
        }
        ;
        if (v instanceof Right) {
          return pure9(new VString(stringify(valueToJson(v.value0))));
        }
        ;
        throw new Error("Failed pattern match at Verdict.VM.Eval (line 765, column 5 - line 767, column 62): " + [v.constructor.name]);
      }
      ;
      if (bid === "json.null@1" && args.length === 0) {
        return pure9(VUnit.value);
      }
      ;
      if (bid === "json.object@1" && (args.length === 1 && args[0] instanceof VList)) {
        return bind10(traverse5(jsonObjectPair)(args[0].value0))(function(pairs) {
          return pure9(new VRecord(pairs));
        });
      }
      ;
      return err("unsupported builtin in reference VM: " + bid);
    };
  };
  var fulfillEffect = function(typ) {
    return function(payload) {
      var v = knownEffectArgs(typ)(payload);
      if (v instanceof Just) {
        return callBuiltin(typ + "@1")(v.value0);
      }
      ;
      if (v instanceof Nothing) {
        return pure9(VUnit.value);
      }
      ;
      throw new Error("Failed pattern match at Verdict.VM.Eval (line 505, column 29 - line 507, column 24): " + [v.constructor.name]);
    };
  };
  var runProcess = function(prog) {
    return function(pid) {
      return function(frame0) {
        var set = function(regs) {
          return function(d) {
            return function(v) {
              return insert14(d)(v)(regs);
            };
          };
        };
        var lookupFn = function(fid) {
          var v = lookup(fid)(prog.functions);
          if (v instanceof Just) {
            return pure9(v.value0);
          }
          ;
          if (v instanceof Nothing) {
            return err("call to unknown function " + fid);
          }
          ;
          throw new Error("Failed pattern match at Verdict.VM.Eval (line 228, column 18 - line 230, column 56): " + [v.constructor.name]);
        };
        var getR = function(regs) {
          return function(r) {
            var v = lookup12(r)(regs);
            if (v instanceof Just) {
              return pure9(v.value0);
            }
            ;
            if (v instanceof Nothing) {
              return err("read of unset register " + show7(r));
            }
            ;
            throw new Error("Failed pattern match at Verdict.VM.Eval (line 221, column 17 - line 223, column 57): " + [v.constructor.name]);
          };
        };
        var traverseR = function(regs) {
          return traverse5(getR(regs));
        };
        var step3 = function(v) {
          return function(instr) {
            var suspend = function(result) {
              return pure9(new Done(result));
            };
            var returnValue = function(v12) {
              var v2 = unsnoc(v.stack);
              if (v2 instanceof Nothing) {
                return suspend(new SDone(v12));
              }
              ;
              if (v2 instanceof Just) {
                return pure9(new Loop({
                  fn: v2.value0.last.fn,
                  regs: set(v2.value0.last.regs)(v2.value0.last.dst)(v12),
                  pc: v2.value0.last.pc,
                  stack: v2.value0.init
                }));
              }
              ;
              throw new Error("Failed pattern match at Verdict.VM.Eval (line 254, column 23 - line 257, column 104): " + [v2.constructor.name]);
            };
            var labels = labelTable(v.fn.instructions);
            var jumpTo = function(l) {
              var v12 = lookup10(l)(labels);
              if (v12 instanceof Just) {
                return pure9(v12.value0);
              }
              ;
              if (v12 instanceof Nothing) {
                return err("unknown label: " + l);
              }
              ;
              throw new Error("Failed pattern match at Verdict.VM.Eval (line 248, column 18 - line 250, column 48): " + [v12.constructor.name]);
            };
            var cont = function(regs$prime) {
              return function(pc$prime) {
                return pure9(new Loop({
                  fn: v.fn,
                  stack: v.stack,
                  regs: regs$prime,
                  pc: pc$prime
                }));
              };
            };
            var next = function(regs$prime) {
              return cont(regs$prime)(v.pc + 1 | 0);
            };
            var divValue = function(d) {
              return function(a) {
                return function(b) {
                  return bind10(getR(v.regs)(a))(function(va) {
                    return bind10(getR(v.regs)(b))(function(vb) {
                      if (va instanceof VInt && vb instanceof VInt) {
                        return next(set(v.regs)(d)(new VInt(divFloorStr(va.value0)(vb.value0))));
                      }
                      ;
                      if (va instanceof VRational && vb instanceof VRational) {
                        var r = divR({
                          num: va.value0,
                          den: va.value1
                        })({
                          num: vb.value0,
                          den: vb.value1
                        });
                        return next(set(v.regs)(d)(new VRational(r.num, r.den)));
                      }
                      ;
                      return err("DIV expects integers or rationals");
                    });
                  });
                };
              };
            };
            var modValue = function(d) {
              return function(a) {
                return function(b) {
                  return bind10(getR(v.regs)(a))(function(va) {
                    return bind10(getR(v.regs)(b))(function(vb) {
                      if (va instanceof VInt && vb instanceof VInt) {
                        return next(set(v.regs)(d)(new VInt(modStr(va.value0)(vb.value0))));
                      }
                      ;
                      return err("MOD expects integers");
                    });
                  });
                };
              };
            };
            var mul1 = function(d) {
              return function(a) {
                return function(b) {
                  return bind10(getR(v.regs)(a))(function(va) {
                    return bind10(getR(v.regs)(b))(function(vb) {
                      return bind10(numMul2(va)(vb))(function(res) {
                        return next(set(v.regs)(d)(res));
                      });
                    });
                  });
                };
              };
            };
            var cmp2 = function(test2) {
              return function(d) {
                return function(a) {
                  return function(b) {
                    return bind10(getR(v.regs)(a))(function(va) {
                      return bind10(getR(v.regs)(b))(function(vb) {
                        return bind10(numCompare(va)(vb))(function(c) {
                          return next(set(v.regs)(d)(new VBool(test2(c))));
                        });
                      });
                    });
                  };
                };
              };
            };
            var arith = function(f) {
              return function(rf) {
                return function(d) {
                  return function(a) {
                    return function(b) {
                      return bind10(getR(v.regs)(a))(function(va) {
                        return bind10(getR(v.regs)(b))(function(vb) {
                          return bind10(numAddLike(f)(rf)(va)(vb))(function(res) {
                            return next(set(v.regs)(d)(res));
                          });
                        });
                      });
                    };
                  };
                };
              };
            };
            if (instr instanceof Return) {
              return bind10(getR(v.regs)(instr.value0))(returnValue);
            }
            ;
            if (instr instanceof Halt) {
              return bind10(getR(v.regs)(instr.value0))(function($1155) {
                return suspend(SDone.create($1155));
              });
            }
            ;
            if (instr instanceof Label) {
              return next(v.regs);
            }
            ;
            if (instr instanceof Jump) {
              return bind10(jumpTo(instr.value0))(cont(v.regs));
            }
            ;
            if (instr instanceof JumpIfFalse) {
              return bind10(getR(v.regs)(instr.value0))(function(v12) {
                if (v12 instanceof VBool && !v12.value0) {
                  return bind10(jumpTo(instr.value1))(cont(v.regs));
                }
                ;
                if (v12 instanceof VBool && v12.value0) {
                  return next(v.regs);
                }
                ;
                return err("JUMP_IF_FALSE on a non-boolean");
              });
            }
            ;
            if (instr instanceof LoadConst) {
              var v1 = index(prog.constants)(instr.value1);
              if (v1 instanceof Just) {
                return next(set(v.regs)(instr.value0)(fromVM(v1.value0)));
              }
              ;
              if (v1 instanceof Nothing) {
                return err("bad constant index " + show7(instr.value1));
              }
              ;
              throw new Error("Failed pattern match at Verdict.VM.Eval (line 299, column 24 - line 301, column 57): " + [v1.constructor.name]);
            }
            ;
            if (instr instanceof Move) {
              return bind10(getR(v.regs)(instr.value1))(function(v12) {
                return next(set(v.regs)(instr.value0)(v12));
              });
            }
            ;
            if (instr instanceof Add) {
              return arith(addStr)(add2)(instr.value0)(instr.value1)(instr.value2);
            }
            ;
            if (instr instanceof Sub) {
              return arith(subStr)(sub2)(instr.value0)(instr.value1)(instr.value2);
            }
            ;
            if (instr instanceof Mul) {
              return mul1(instr.value0)(instr.value1)(instr.value2);
            }
            ;
            if (instr instanceof Div) {
              return divValue(instr.value0)(instr.value1)(instr.value2);
            }
            ;
            if (instr instanceof Mod) {
              return modValue(instr.value0)(instr.value1)(instr.value2);
            }
            ;
            if (instr instanceof EqI) {
              return bind10(getR(v.regs)(instr.value1))(function(va) {
                return bind10(getR(v.regs)(instr.value2))(function(vb) {
                  return next(set(v.regs)(instr.value0)(new VBool(eq33(va)(vb))));
                });
              });
            }
            ;
            if (instr instanceof LtI) {
              return cmp2(function(c) {
                return c < 0;
              })(instr.value0)(instr.value1)(instr.value2);
            }
            ;
            if (instr instanceof GtI) {
              return cmp2(function(c) {
                return c > 0;
              })(instr.value0)(instr.value1)(instr.value2);
            }
            ;
            if (instr instanceof Call) {
              return bind10(traverseR(v.regs)(instr.value2))(function(argsV) {
                return bind10(lookupFn(instr.value1))(function(f2) {
                  return pure9(new Loop({
                    fn: f2,
                    regs: argRegs(argsV),
                    pc: 0,
                    stack: snoc(v.stack)({
                      fn: v.fn,
                      regs: v.regs,
                      pc: v.pc + 1 | 0,
                      dst: instr.value0
                    })
                  }));
                });
              });
            }
            ;
            if (instr instanceof TailCall) {
              return bind10(traverseR(v.regs)(instr.value1))(function(argsV) {
                return bind10(lookupFn(instr.value0))(function(f2) {
                  return pure9(new Loop({
                    fn: f2,
                    regs: argRegs(argsV),
                    pc: 0,
                    stack: v.stack
                  }));
                });
              });
            }
            ;
            if (instr instanceof CallBuiltin) {
              return bind10(traverseR(v.regs)(instr.value2))(function(argsV) {
                return bind10(callBuiltin(instr.value1)(argsV))(function(res) {
                  return next(set(v.regs)(instr.value0)(res));
                });
              });
            }
            ;
            if (instr instanceof LoadInput) {
              return err("LOAD_INPUT is not supported by the reference VM");
            }
            ;
            if (instr instanceof EffectRequest) {
              return err("EFFECT_REQUEST is not supported by the reference VM");
            }
            ;
            if (instr instanceof EffectNew) {
              return bind10(getR(v.regs)(instr.value2))(function(payloadV) {
                return next(set(v.regs)(instr.value0)(new VRecord([new Tuple("$effectType", new VString(instr.value1)), new Tuple("$payload", payloadV)])));
              });
            }
            ;
            if (instr instanceof EffectAwait) {
              return bind10(getR(v.regs)(instr.value0))(function(intentV) {
                if (intentV instanceof VRecord) {
                  var v12 = lookupField3("$payload")(intentV.value0);
                  var v2 = lookupField3("$effectType")(intentV.value0);
                  if (v2 instanceof Just && (v2.value0 instanceof VString && v12 instanceof Just)) {
                    return bind10(fulfillEffect(v2.value0.value0)(v12.value0))(function(result) {
                      var keyV = function() {
                        if (v12.value0 instanceof VRecord) {
                          return fromMaybe(VUnit.value)(lookupField3("key")(v12.value0.value0));
                        }
                        ;
                        return VUnit.value;
                      }();
                      var reply = new VRecord([new Tuple("key", keyV), new Tuple("value", result)]);
                      return bind10(get5)(function(w) {
                        return discard7(function() {
                          var v3 = lookup10(pid)(w.procs);
                          if (v3 instanceof Just) {
                            return put3(function() {
                              var $1014 = {};
                              for (var $1015 in w) {
                                if ({}.hasOwnProperty.call(w, $1015)) {
                                  $1014[$1015] = w[$1015];
                                }
                                ;
                              }
                              ;
                              $1014.procs = insert13(pid)(function() {
                                var $1011 = {};
                                for (var $1012 in v3.value0) {
                                  if ({}.hasOwnProperty.call(v3.value0, $1012)) {
                                    $1011[$1012] = v3["value0"][$1012];
                                  }
                                  ;
                                }
                                ;
                                $1011.mailbox = snoc(v3.value0.mailbox)(reply);
                                return $1011;
                              }())(w.procs);
                              return $1014;
                            }());
                          }
                          ;
                          if (v3 instanceof Nothing) {
                            return pure9(unit);
                          }
                          ;
                          throw new Error("Failed pattern match at Verdict.VM.Eval (line 351, column 15 - line 353, column 37): " + [v3.constructor.name]);
                        }())(function() {
                          return next(v.regs);
                        });
                      });
                    });
                  }
                  ;
                  return err("EFFECT_AWAIT: malformed effect intent");
                }
                ;
                return err("EFFECT_AWAIT requires an effect intent");
              });
            }
            ;
            if (instr instanceof VariantPayload) {
              return bind10(getR(v.regs)(instr.value1))(function(v12) {
                return next(set(v.regs)(instr.value0)(v12));
              });
            }
            ;
            if (instr instanceof EffectBatchNew) {
              return err("EFFECT_BATCH_NEW is not supported by the reference VM");
            }
            ;
            if (instr instanceof EffectBatchAppend) {
              return err("EFFECT_BATCH_APPEND is not supported by the reference VM");
            }
            ;
            if (instr instanceof Spawn) {
              return bind10(traverseR(v.regs)(instr.value2))(function(argsV) {
                return bind10(lookupFn(instr.value1))(function(f2) {
                  return bind10(get5)(function(w) {
                    var newPid = "p" + show7(w.nextPid);
                    var child = {
                      frame: initialFrame(f2)(argsV),
                      mailbox: [],
                      blocked: false
                    };
                    return discard7(put3(function() {
                      var $1029 = {};
                      for (var $1030 in w) {
                        if ({}.hasOwnProperty.call(w, $1030)) {
                          $1029[$1030] = w[$1030];
                        }
                        ;
                      }
                      ;
                      $1029.nextPid = w.nextPid + 1 | 0;
                      $1029.procs = insert13(newPid)(child)(w.procs);
                      $1029.ready = snoc(w.ready)(newPid);
                      return $1029;
                    }()))(function() {
                      return next(set(v.regs)(instr.value0)(new VString(newPid)));
                    });
                  });
                });
              });
            }
            ;
            if (instr instanceof Send) {
              return bind10(getR(v.regs)(instr.value0))(function(pidVal) {
                return bind10(getR(v.regs)(instr.value1))(function(msg) {
                  if (pidVal instanceof VString) {
                    return bind10(get5)(function(w) {
                      var v12 = lookup10(pidVal.value0)(w.procs);
                      if (v12 instanceof Nothing) {
                        return next(v.regs);
                      }
                      ;
                      if (v12 instanceof Just) {
                        var shouldWake = pidVal.value0 !== pid && !any3(function(v2) {
                          return v2 === pidVal.value0;
                        })(w.ready);
                        return discard7(put3(function() {
                          var $1041 = {};
                          for (var $1042 in w) {
                            if ({}.hasOwnProperty.call(w, $1042)) {
                              $1041[$1042] = w[$1042];
                            }
                            ;
                          }
                          ;
                          $1041.procs = insert13(pidVal.value0)(function() {
                            var $1037 = {};
                            for (var $1038 in v12.value0) {
                              if ({}.hasOwnProperty.call(v12.value0, $1038)) {
                                $1037[$1038] = v12["value0"][$1038];
                              }
                              ;
                            }
                            ;
                            $1037.mailbox = snoc(v12.value0.mailbox)(msg);
                            $1037.blocked = false;
                            return $1037;
                          }())(w.procs);
                          $1041.ready = function() {
                            if (shouldWake) {
                              return snoc(w.ready)(pidVal.value0);
                            }
                            ;
                            return w.ready;
                          }();
                          return $1041;
                        }()))(function() {
                          return next(v.regs);
                        });
                      }
                      ;
                      throw new Error("Failed pattern match at Verdict.VM.Eval (line 384, column 13 - line 392, column 26): " + [v12.constructor.name]);
                    });
                  }
                  ;
                  return err("PROC_SEND expects pid");
                });
              });
            }
            ;
            if (instr instanceof Recv) {
              return bind10(get5)(function(w) {
                var v12 = lookup10(pid)(w.procs);
                if (v12 instanceof Nothing) {
                  return err("missing process " + show24(pid));
                }
                ;
                if (v12 instanceof Just) {
                  var v2 = uncons(v12.value0.mailbox);
                  if (v2 instanceof Nothing) {
                    return suspend(new SBlocked(v));
                  }
                  ;
                  if (v2 instanceof Just) {
                    return discard7(put3(function() {
                      var $1053 = {};
                      for (var $1054 in w) {
                        if ({}.hasOwnProperty.call(w, $1054)) {
                          $1053[$1054] = w[$1054];
                        }
                        ;
                      }
                      ;
                      $1053.procs = insert13(pid)(function() {
                        var $1050 = {};
                        for (var $1051 in v12.value0) {
                          if ({}.hasOwnProperty.call(v12.value0, $1051)) {
                            $1050[$1051] = v12["value0"][$1051];
                          }
                          ;
                        }
                        ;
                        $1050.mailbox = v2.value0.tail;
                        return $1050;
                      }())(w.procs);
                      return $1053;
                    }()))(function() {
                      return next(set(v.regs)(instr.value0)(v2.value0.head));
                    });
                  }
                  ;
                  throw new Error("Failed pattern match at Verdict.VM.Eval (line 398, column 24 - line 402, column 36): " + [v2.constructor.name]);
                }
                ;
                throw new Error("Failed pattern match at Verdict.VM.Eval (line 396, column 9 - line 402, column 36): " + [v12.constructor.name]);
              });
            }
            ;
            if (instr instanceof Yield) {
              return suspend(new SYield({
                fn: v.fn,
                regs: v.regs,
                stack: v.stack,
                pc: v.pc + 1 | 0
              }));
            }
            ;
            if (instr instanceof Self) {
              return next(set(v.regs)(instr.value0)(new VString(pid)));
            }
            ;
            if (instr instanceof RecordNew) {
              return next(set(v.regs)(instr.value0)(new VRecord([])));
            }
            ;
            if (instr instanceof RecordSet) {
              return bind10(getR(v.regs)(instr.value1))(function(rec) {
                return bind10(getR(v.regs)(instr.value3))(function(val) {
                  if (rec instanceof VRecord) {
                    return next(set(v.regs)(instr.value0)(new VRecord(recUpsert(instr.value2)(val)(rec.value0))));
                  }
                  ;
                  return err("RECORD_SET on non-record");
                });
              });
            }
            ;
            if (instr instanceof RecordGet) {
              return bind10(getR(v.regs)(instr.value1))(function(rec) {
                if (rec instanceof VRecord) {
                  var v12 = lookupField3(instr.value2)(rec.value0);
                  if (v12 instanceof Just) {
                    return next(set(v.regs)(instr.value0)(v12.value0));
                  }
                  ;
                  if (v12 instanceof Nothing) {
                    return err("missing field " + instr.value2);
                  }
                  ;
                  throw new Error("Failed pattern match at Verdict.VM.Eval (line 417, column 25 - line 419, column 51): " + [v12.constructor.name]);
                }
                ;
                return err("RECORD_GET on non-record");
              });
            }
            ;
            if (instr instanceof ListNew) {
              return next(set(v.regs)(instr.value0)(new VList([])));
            }
            ;
            if (instr instanceof ListAppend) {
              return bind10(getR(v.regs)(instr.value1))(function(lst) {
                return bind10(getR(v.regs)(instr.value2))(function(val) {
                  if (lst instanceof VList) {
                    return next(set(v.regs)(instr.value0)(new VList(snoc(lst.value0)(val))));
                  }
                  ;
                  return err("LIST_APPEND on non-list");
                });
              });
            }
            ;
            if (instr instanceof ListGet) {
              return bind10(getR(v.regs)(instr.value1))(function(lst) {
                return bind10(getR(v.regs)(instr.value2))(function(idx) {
                  if (lst instanceof VList && idx instanceof VInt) {
                    var v12 = index(lst.value0)($$parseInt(idx.value0));
                    if (v12 instanceof Just) {
                      return next(set(v.regs)(instr.value0)(v12.value0));
                    }
                    ;
                    if (v12 instanceof Nothing) {
                      return err("list index out of range");
                    }
                    ;
                    throw new Error("Failed pattern match at Verdict.VM.Eval (line 432, column 31 - line 434, column 53): " + [v12.constructor.name]);
                  }
                  ;
                  return err("LIST_GET on non-list/index");
                });
              });
            }
            ;
            if (instr instanceof ListLength) {
              return bind10(getR(v.regs)(instr.value1))(function(lst) {
                if (lst instanceof VList) {
                  return next(set(v.regs)(instr.value0)(new VInt(show7(length(lst.value0)))));
                }
                ;
                return err("LIST_LENGTH on non-list");
              });
            }
            ;
            throw new Error("Failed pattern match at Verdict.VM.Eval (line 288, column 8 - line 440, column 45): " + [instr.constructor.name]);
          };
        };
        var loop = function(v) {
          return bind10(get5)(function(w) {
            var $1100 = w.steps > fuel;
            if ($1100) {
              return err("step limit exceeded (possible infinite loop)");
            }
            ;
            return discard7(put3(function() {
              var $1101 = {};
              for (var $1102 in w) {
                if ({}.hasOwnProperty.call(w, $1102)) {
                  $1101[$1102] = w[$1102];
                }
                ;
              }
              ;
              $1101.steps = w.steps + 1 | 0;
              return $1101;
            }()))(function() {
              var v1 = index(v.fn.instructions)(v.pc);
              if (v1 instanceof Nothing) {
                return err("program counter ran off the end (missing RETURN/HALT?)");
              }
              ;
              if (v1 instanceof Just) {
                return step3(v)(v1.value0);
              }
              ;
              throw new Error("Failed pattern match at Verdict.VM.Eval (line 238, column 7 - line 240, column 39): " + [v1.constructor.name]);
            });
          });
        };
        return tailRecM5(loop)(frame0);
      };
    };
  };
  var schedule = function(prog) {
    return bind10(get5)(function(w) {
      var v = uncons(w.ready);
      if (v instanceof Nothing) {
        return err("deadlock: all processes blocked");
      }
      ;
      if (v instanceof Just) {
        var v1 = lookup10(v.value0.head)(w.procs);
        if (v1 instanceof Nothing) {
          return discard7(put3(function() {
            var $1110 = {};
            for (var $1111 in w) {
              if ({}.hasOwnProperty.call(w, $1111)) {
                $1110[$1111] = w[$1111];
              }
              ;
            }
            ;
            $1110.ready = v.value0.tail;
            return $1110;
          }()))(function() {
            return schedule(prog);
          });
        }
        ;
        if (v1 instanceof Just) {
          return discard7(put3(function() {
            var $1116 = {};
            for (var $1117 in w) {
              if ({}.hasOwnProperty.call(w, $1117)) {
                $1116[$1117] = w[$1117];
              }
              ;
            }
            ;
            $1116.ready = v.value0.tail;
            $1116.procs = insert13(v.value0.head)(function() {
              var $1113 = {};
              for (var $1114 in v1.value0) {
                if ({}.hasOwnProperty.call(v1.value0, $1114)) {
                  $1113[$1114] = v1["value0"][$1114];
                }
                ;
              }
              ;
              $1113.blocked = false;
              return $1113;
            }())(w.procs);
            return $1116;
          }()))(function() {
            return bind10(runProcess(prog)(v.value0.head)(v1.value0.frame))(function(result) {
              if (result instanceof SDone && v.value0.head === "main") {
                return pure9(result.value0);
              }
              ;
              if (result instanceof SDone) {
                return bind10(get5)(function(w2) {
                  return discard7(put3(function() {
                    var $1121 = {};
                    for (var $1122 in w2) {
                      if ({}.hasOwnProperty.call(w2, $1122)) {
                        $1121[$1122] = w2[$1122];
                      }
                      ;
                    }
                    ;
                    $1121.procs = $$delete7(v.value0.head)(w2.procs);
                    return $1121;
                  }()))(function() {
                    return schedule(prog);
                  });
                });
              }
              ;
              if (result instanceof SBlocked) {
                return discard7(saveProcess(v.value0.head)(result.value0)(true)(false))(function() {
                  return schedule(prog);
                });
              }
              ;
              if (result instanceof SYield) {
                return discard7(saveProcess(v.value0.head)(result.value0)(false)(true))(function() {
                  return schedule(prog);
                });
              }
              ;
              if (result instanceof SContinue) {
                return err("internal scheduler error: process returned SContinue");
              }
              ;
              throw new Error("Failed pattern match at Verdict.VM.Eval (line 192, column 9 - line 204, column 84): " + [result.constructor.name]);
            });
          });
        }
        ;
        throw new Error("Failed pattern match at Verdict.VM.Eval (line 182, column 33 - line 204, column 84): " + [v1.constructor.name]);
      }
      ;
      throw new Error("Failed pattern match at Verdict.VM.Eval (line 180, column 3 - line 204, column 84): " + [v.constructor.name]);
    });
  };
  var runProgramWithLogs = function(prog) {
    var v = lookup(prog.entrypoint)(prog.functions);
    if (v instanceof Nothing) {
      return {
        result: new Left("no entrypoint: " + prog.entrypoint),
        logs: []
      };
    }
    ;
    if (v instanceof Just) {
      var p0 = {
        frame: initialFrame(v.value0)([]),
        mailbox: [],
        blocked: false
      };
      var world0 = {
        cache: initWorld.cache,
        db: initWorld.db,
        files: initWorld.files,
        logs: initWorld.logs,
        nextId: initWorld.nextId,
        steps: initWorld.steps,
        procs: singleton5("main")(p0),
        ready: ["main"],
        nextPid: 0
      };
      var v1 = runStateT(schedule(prog))(world0);
      if (v1 instanceof Left) {
        return {
          result: new Left(v1.value0),
          logs: []
        };
      }
      ;
      if (v1 instanceof Right) {
        return {
          result: new Right(v1.value0.value0),
          logs: v1.value0.value1.logs
        };
      }
      ;
      throw new Error("Failed pattern match at Verdict.VM.Eval (line 130, column 8 - line 132, column 61): " + [v1.constructor.name]);
    }
    ;
    throw new Error("Failed pattern match at Verdict.VM.Eval (line 116, column 27 - line 132, column 61): " + [v.constructor.name]);
  };
  var runProgram = function($1156) {
    return function(v) {
      return v.result;
    }(runProgramWithLogs($1156));
  };

  // .tmp-verdict-build/output/Verdict.Compiler/index.js
  var map31 = /* @__PURE__ */ map(functorMaybe);
  var show8 = /* @__PURE__ */ show(showTy);
  var append9 = /* @__PURE__ */ append(semigroupArray);
  var show17 = /* @__PURE__ */ show(showParseError);
  var toUnfoldable11 = /* @__PURE__ */ toUnfoldable2(unfoldableArray);
  var map114 = /* @__PURE__ */ map(functorEither);
  var fromFoldable21 = /* @__PURE__ */ fromFoldable3(ordString)(foldableArray);
  var traverse6 = /* @__PURE__ */ traverse(traversableArray)(applicativeEither);
  var map211 = /* @__PURE__ */ map(functorArray);
  var bind11 = /* @__PURE__ */ bind(bindEither);
  var show25 = /* @__PURE__ */ show(showValue);
  var toEmitFunc = function(f) {
    var alloc = allocate(f);
    return {
      name: f.name,
      arity: length(f.params),
      paramTys: f.paramTys,
      retTy: f.retTy,
      registerCount: alloc.registerCount,
      body: alloc.body,
      isEntry: f.isEntry
    };
  };
  var signaturesJS = function(src) {
    var declSig = function(v) {
      return map31(function(t) {
        return {
          name: v.name,
          signature: show8(t)
        };
      })(v.sig);
    };
    var sigsOf = function(code) {
      var v = parseVerdict(code);
      if (v instanceof Left) {
        return [];
      }
      ;
      if (v instanceof Right) {
        return mapMaybe(declSig)(moduleDecls(v.value0));
      }
      ;
      throw new Error("Failed pattern match at Verdict.Compiler (line 186, column 17 - line 188, column 58): " + [v.constructor.name]);
    };
    return append9(sigsOf(src))(sigsOf(preludeSource));
  };
  var parseAll = function(sources) {
    var parseOne = function(v) {
      var v1 = parseModuleFull(v.value1);
      if (v1 instanceof Left) {
        return new Left("Parse error in '" + (v.value0 + ("': " + show17(v1.value0))));
      }
      ;
      if (v1 instanceof Right) {
        return new Right(new Tuple(v.value0, v1.value0));
      }
      ;
      throw new Error("Failed pattern match at Verdict.Compiler (line 73, column 31 - line 75, column 38): " + [v1.constructor.name]);
    };
    var entries = toUnfoldable11(sources);
    return map114(fromFoldable21)(traverse6(parseOne)(entries));
  };
  var finish = function(userMod) {
    var v = parseVerdict(preludeSource);
    if (v instanceof Left) {
      return new Left("Internal error: prelude failed to parse: " + show17(v.value0));
    }
    ;
    if (v instanceof Right) {
      var mod5 = link(userMod)(v.value0);
      var v1 = checkModule(mod5);
      if (v1 instanceof Left) {
        return new Left("Type error: " + showTypeError(v1.value0));
      }
      ;
      if (v1 instanceof Right) {
        var mono = monomorphize(mod5);
        var lowered = lowerModule(mono);
        var inlined = inlineNullaries(lowered.funcs)(lowered.entry);
        var emitFuncs = map211(function($105) {
          return toEmitFunc(optimize($105));
        })(inlined);
        return new Right(assemble(emitFuncs)(lowered.entry));
      }
      ;
      throw new Error("Failed pattern match at Verdict.Compiler (line 85, column 10 - line 94, column 53): " + [v1.constructor.name]);
    }
    ;
    throw new Error("Failed pattern match at Verdict.Compiler (line 81, column 3 - line 94, column 53): " + [v.constructor.name]);
  };
  var diagnosticsJS = function(src) {
    var parseDiag = function(perr) {
      var v3 = parseErrorPosition(perr);
      return {
        line: v3.line,
        column: v3.column,
        message: parseErrorMessage(perr),
        severity: "error"
      };
    };
    var v = parseVerdict(src);
    if (v instanceof Left) {
      return [parseDiag(v.value0)];
    }
    ;
    if (v instanceof Right) {
      var v1 = parseVerdict(preludeSource);
      if (v1 instanceof Left) {
        return [];
      }
      ;
      if (v1 instanceof Right) {
        var v2 = checkModule(link(v.value0)(v1.value0));
        if (v2 instanceof Left) {
          var l = locate(v2.value0);
          return [{
            line: l.line,
            column: l.column,
            message: l.message,
            severity: "error"
          }];
        }
        ;
        if (v2 instanceof Right) {
          return [];
        }
        ;
        throw new Error("Failed pattern match at Verdict.Compiler (line 198, column 25 - line 202, column 20): " + [v2.constructor.name]);
      }
      ;
      throw new Error("Failed pattern match at Verdict.Compiler (line 196, column 20 - line 202, column 20): " + [v1.constructor.name]);
    }
    ;
    throw new Error("Failed pattern match at Verdict.Compiler (line 194, column 21 - line 202, column 20): " + [v.constructor.name]);
  };
  var compileProject = function(sources) {
    return function(entry) {
      return bind11(parseAll(sources))(function(parsed) {
        return bind11(resolveProject(parsed)(entry))(function(merged) {
          return finish(merged);
        });
      });
    };
  };
  var compileProjectJS = function(sources) {
    return function(entry) {
      var v = map114(function() {
        var $106 = stringifyWithIndent(2);
        return function($107) {
          return $106(encodeProgramVM($107));
        };
      }())(compileProject(sources)(entry));
      if (v instanceof Right) {
        return {
          ok: true,
          output: v.value0,
          error: ""
        };
      }
      ;
      if (v instanceof Left) {
        return {
          ok: false,
          output: "",
          error: v.value0
        };
      }
      ;
      throw new Error("Failed pattern match at Verdict.Compiler (line 151, column 3 - line 153, column 54): " + [v.constructor.name]);
    };
  };
  var runProjectToJson = function(sources) {
    return function(entry) {
      return map114(encodeValueJson)(bind11(compileProject(sources)(entry))(runProgram));
    };
  };
  var runProjectJS = function(sources) {
    return function(entry) {
      var v = runProjectToJson(sources)(entry);
      if (v instanceof Right) {
        return {
          ok: true,
          output: stringifyWithIndent(2)(v.value0),
          error: ""
        };
      }
      ;
      if (v instanceof Left) {
        return {
          ok: false,
          output: "",
          error: v.value0
        };
      }
      ;
      throw new Error("Failed pattern match at Verdict.Compiler (line 161, column 30 - line 163, column 52): " + [v.constructor.name]);
    };
  };
  var compileProgram = function(src) {
    var v = parseVerdict(src);
    if (v instanceof Left) {
      return new Left("Parse error: " + show17(v.value0));
    }
    ;
    if (v instanceof Right) {
      return finish(v.value0);
    }
    ;
    throw new Error("Failed pattern match at Verdict.Compiler (line 52, column 22 - line 54, column 34): " + [v.constructor.name]);
  };
  var runToJson = function(src) {
    return map114(encodeValueJson)(bind11(compileProgram(src))(runProgram));
  };
  var runJS = function(src) {
    var v = runToJson(src);
    if (v instanceof Right) {
      return {
        ok: true,
        output: stringifyWithIndent(2)(v.value0),
        error: ""
      };
    }
    ;
    if (v instanceof Left) {
      return {
        ok: false,
        output: "",
        error: v.value0
      };
    }
    ;
    throw new Error("Failed pattern match at Verdict.Compiler (line 156, column 13 - line 158, column 52): " + [v.constructor.name]);
  };
  var runWithLogsJS = function(src) {
    var v = compileProgram(src);
    if (v instanceof Left) {
      return {
        ok: false,
        value: "",
        error: v.value0,
        logs: []
      };
    }
    ;
    if (v instanceof Right) {
      var r = runProgramWithLogs(v.value0);
      if (r.result instanceof Right) {
        return {
          ok: true,
          value: show25(r.result.value0),
          error: "",
          logs: r.logs
        };
      }
      ;
      if (r.result instanceof Left) {
        return {
          ok: false,
          value: "",
          error: r.result.value0,
          logs: r.logs
        };
      }
      ;
      throw new Error("Failed pattern match at Verdict.Compiler (line 177, column 8 - line 179, column 69): " + [r.result.constructor.name]);
    }
    ;
    throw new Error("Failed pattern match at Verdict.Compiler (line 173, column 21 - line 179, column 69): " + [v.constructor.name]);
  };
  var compileJson = function(src) {
    return map114(encodeProgramVM)(compileProgram(src));
  };
  var compileBindings = function(src) {
    var v = parseVerdict(src);
    if (v instanceof Left) {
      return new Left("Parse error: " + show17(v.value0));
    }
    ;
    if (v instanceof Right) {
      var v1 = parseVerdict(preludeSource);
      if (v1 instanceof Left) {
        return new Left("internal error: prelude failed to parse");
      }
      ;
      if (v1 instanceof Right) {
        var mod5 = linkAll(v.value0)(v1.value0);
        var v2 = checkModule(mod5);
        if (v2 instanceof Left) {
          return new Left("Type error: " + showTypeError(v2.value0));
        }
        ;
        if (v2 instanceof Right) {
          var lowered = lowerModule(monomorphize(mod5));
          var emitFuncs = map211(function($108) {
            return toEmitFunc(optimize($108));
          })(lowered.funcs);
          return new Right(assemble(emitFuncs)(lowered.entry));
        }
        ;
        throw new Error("Failed pattern match at Verdict.Compiler (line 106, column 10 - line 113, column 53): " + [v2.constructor.name]);
      }
      ;
      throw new Error("Failed pattern match at Verdict.Compiler (line 102, column 20 - line 113, column 53): " + [v1.constructor.name]);
    }
    ;
    throw new Error("Failed pattern match at Verdict.Compiler (line 100, column 23 - line 113, column 53): " + [v.constructor.name]);
  };
  var evalBindingsJS = function(src) {
    var nullary = function(mod5) {
      return mapMaybe(function(v2) {
        var $93 = $$null(v2.params);
        if ($93) {
          return new Just(v2.name);
        }
        ;
        return Nothing.value;
      })(moduleDecls(mod5));
    };
    var evalBinding = function(prog) {
      return function(name2) {
        var $94 = member(name2)(prog.functions);
        if ($94) {
          return new Just(function() {
            var v2 = runProgram({
              version: prog.version,
              constants: prog.constants,
              functions: prog.functions,
              stateMachines: prog.stateMachines,
              exports: prog.exports,
              metadata: prog.metadata,
              typeTable: prog.typeTable,
              capabilities: prog.capabilities,
              verification: prog.verification,
              limits: prog.limits,
              entrypoint: name2
            });
            if (v2 instanceof Right) {
              return {
                name: name2,
                ok: true,
                value: show25(v2.value0),
                error: ""
              };
            }
            ;
            if (v2 instanceof Left) {
              return {
                name: name2,
                ok: false,
                value: "",
                error: v2.value0
              };
            }
            ;
            throw new Error("Failed pattern match at Verdict.Compiler (line 219, column 7 - line 221, column 63): " + [v2.constructor.name]);
          }());
        }
        ;
        return Nothing.value;
      };
    };
    var v = compileBindings(src);
    var v1 = parseVerdict(src);
    if (v1 instanceof Right && v instanceof Right) {
      return mapMaybe(evalBinding(v.value0))(nullary(v1.value0));
    }
    ;
    return [];
  };
  var compile2 = function(src) {
    return map114(stringifyWithIndent(2))(compileJson(src));
  };
  var compileJS = function(src) {
    var v = compile2(src);
    if (v instanceof Right) {
      return {
        ok: true,
        output: v.value0,
        error: ""
      };
    }
    ;
    if (v instanceof Left) {
      return {
        ok: false,
        output: "",
        error: v.value0
      };
    }
    ;
    throw new Error("Failed pattern match at Verdict.Compiler (line 143, column 17 - line 145, column 52): " + [v.constructor.name]);
  };
  return __toCommonJS(index_exports);
})();
