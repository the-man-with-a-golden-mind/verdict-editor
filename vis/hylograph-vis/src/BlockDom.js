"use strict";

export const createEl = (tag) => () => document.createElement(tag);

export const setClassName = (cls) => (el) => () => {
  el.className = cls;
};

export const setText = (txt) => (el) => () => {
  el.textContent = txt;
};

export const setAttr = (k) => (v) => (el) => () => {
  el.setAttribute(k, v);
};

export const appendChild = (child) => (parent) => () => {
  parent.appendChild(child);
};

export const mount = (selector) => (nodeEl) => () => {
  const host = document.querySelector(selector);
  if (host) {
    while (host.firstChild) host.removeChild(host.firstChild);
    host.appendChild(nodeEl);
  }
};
