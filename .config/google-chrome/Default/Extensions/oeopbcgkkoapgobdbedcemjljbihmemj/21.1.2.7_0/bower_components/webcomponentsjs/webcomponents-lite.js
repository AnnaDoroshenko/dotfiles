(function(){/*

 Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 Code distributed by Google as part of the polymer project is also
 subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt

 Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 Code distributed by Google as part of the polymer project is also
 subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt

Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt

Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
'use strict';(function() {
  (function(scope) {
    var workingDefaultPrevented = function() {
      var e = document.createEvent("Event");
      e.initEvent("foo", true, true);
      e.preventDefault();
      return e.defaultPrevented;
    }();
    if (!workingDefaultPrevented) {
      var origPreventDefault = Event.prototype.preventDefault;
      Event.prototype.preventDefault = function() {
        if (!this.cancelable) {
          return;
        }
        origPreventDefault.call(this);
        Object.defineProperty(this, "defaultPrevented", {get:function() {
          return true;
        }, configurable:true});
      };
    }
    var isIE = /Trident/.test(navigator.userAgent);
    if (!window.CustomEvent || isIE && typeof window.CustomEvent !== "function") {
      window.CustomEvent = function(inType, params) {
        params = params || {};
        var e = document.createEvent("CustomEvent");
        e.initCustomEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable), params.detail);
        return e;
      };
      window.CustomEvent.prototype = window.Event.prototype;
    }
    if (!window.Event || isIE && typeof window.Event !== "function") {
      var origEvent = window.Event;
      window.Event = function(inType, params) {
        params = params || {};
        var e = document.createEvent("Event");
        e.initEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable));
        return e;
      };
      if (origEvent) {
        for (var i in origEvent) {
          window.Event[i] = origEvent[i];
        }
      }
      window.Event.prototype = origEvent.prototype;
    }
    if (!window.MouseEvent || isIE && typeof window.MouseEvent !== "function") {
      var origMouseEvent = window.MouseEvent;
      window.MouseEvent = function(inType, params) {
        params = params || {};
        var e = document.createEvent("MouseEvent");
        e.initMouseEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable), params.view || window, params.detail, params.screenX, params.screenY, params.clientX, params.clientY, params.ctrlKey, params.altKey, params.shiftKey, params.metaKey, params.button, params.relatedTarget);
        return e;
      };
      if (origMouseEvent) {
        for (var i in origMouseEvent) {
          window.MouseEvent[i] = origMouseEvent[i];
        }
      }
      window.MouseEvent.prototype = origMouseEvent.prototype;
    }
    if (!Array.from) {
      Array.from = function(object) {
        return [].slice.call(object);
      };
    }
    if (!Object.assign) {
      var assign = function(target, source) {
        var n$ = Object.getOwnPropertyNames(source);
        for (var i = 0, p;i < n$.length;i++) {
          p = n$[i];
          target[p] = source[p];
        }
      };
      Object.assign = function(target, sources) {
        var args = [].slice.call(arguments, 1);
        for (var i = 0, s;i < args.length;i++) {
          s = args[i];
          if (s) {
            assign(target, s);
          }
        }
        return target;
      };
    }
  })(window.WebComponents);
  (function() {
    var needsTemplate = typeof HTMLTemplateElement === "undefined";
    if (/Trident/.test(navigator.userAgent)) {
      (function() {
        var Native_importNode = Document.prototype.importNode;
        Document.prototype.importNode = function() {
          var n = Native_importNode.apply(this, arguments);
          if (n.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
            var f = this.createDocumentFragment();
            f.appendChild(n);
            return f;
          } else {
            return n;
          }
        };
      })();
    }
    var Native_cloneNode = Node.prototype.cloneNode;
    var Native_createElement = Document.prototype.createElement;
    var Native_importNode = Document.prototype.importNode;
    var needsCloning = function() {
      if (!needsTemplate) {
        var t = document.createElement("template");
        var t2 = document.createElement("template");
        t2.content.appendChild(document.createElement("div"));
        t.content.appendChild(t2);
        var clone = t.cloneNode(true);
        return clone.content.childNodes.length === 0 || clone.content.firstChild.content.childNodes.length === 0 || !(document.createDocumentFragment().cloneNode() instanceof DocumentFragment);
      }
    }();
    var TEMPLATE_TAG = "template";
    var PolyfilledHTMLTemplateElement = function() {
    };
    if (needsTemplate) {
      var escapeData$1 = function(s) {
        return s.replace(escapeDataRegExp, escapeReplace$0);
      };
      var escapeReplace$0 = function(c) {
        switch(c) {
          case "&":
            return "&amp;";
          case "<":
            return "&lt;";
          case ">":
            return "&gt;";
          case "\u00a0":
            return "&nbsp;";
        }
      };
      var defineInnerHTML = function(obj) {
        Object.defineProperty(obj, "innerHTML", {get:function() {
          var o = "";
          for (var e = this.content.firstChild;e;e = e.nextSibling) {
            o += e.outerHTML || escapeData$1(e.data);
          }
          return o;
        }, set:function(text) {
          contentDoc.body.innerHTML = text;
          PolyfilledHTMLTemplateElement.bootstrap(contentDoc);
          while (this.content.firstChild) {
            this.content.removeChild(this.content.firstChild);
          }
          while (contentDoc.body.firstChild) {
            this.content.appendChild(contentDoc.body.firstChild);
          }
        }, configurable:true});
      };
      var contentDoc = document.implementation.createHTMLDocument("template");
      var canDecorate = true;
      var templateStyle = document.createElement("style");
      templateStyle.textContent = TEMPLATE_TAG + "{display:none;}";
      var head = document.head;
      head.insertBefore(templateStyle, head.firstElementChild);
      PolyfilledHTMLTemplateElement.prototype = Object.create(HTMLElement.prototype);
      var canProtoPatch = !document.createElement("div").hasOwnProperty("innerHTML");
      PolyfilledHTMLTemplateElement.decorate = function(template) {
        if (template.content) {
          return;
        }
        template.content = contentDoc.createDocumentFragment();
        var child;
        while (child = template.firstChild) {
          template.content.appendChild(child);
        }
        if (canProtoPatch) {
          template.__proto__ = PolyfilledHTMLTemplateElement.prototype;
        } else {
          template.cloneNode = function(deep) {
            return PolyfilledHTMLTemplateElement._cloneNode(this, deep);
          };
          if (canDecorate) {
            try {
              defineInnerHTML(template);
            } catch (err) {
              canDecorate = false;
            }
          }
        }
        PolyfilledHTMLTemplateElement.bootstrap(template.content);
      };
      defineInnerHTML(PolyfilledHTMLTemplateElement.prototype);
      PolyfilledHTMLTemplateElement.bootstrap = function(doc) {
        var templates = doc.querySelectorAll(TEMPLATE_TAG);
        for (var i = 0, l = templates.length, t;i < l && (t = templates[i]);i++) {
          PolyfilledHTMLTemplateElement.decorate(t);
        }
      };
      document.addEventListener("DOMContentLoaded", function() {
        PolyfilledHTMLTemplateElement.bootstrap(document);
      });
      Document.prototype.createElement = function() {
        var el = Native_createElement.apply(this, arguments);
        if (el.localName === "template") {
          PolyfilledHTMLTemplateElement.decorate(el);
        }
        return el;
      };
      var escapeDataRegExp = /[&\u00A0<>]/g;
    }
    if (needsTemplate || needsCloning) {
      PolyfilledHTMLTemplateElement._cloneNode = function(template, deep) {
        var clone = Native_cloneNode.call(template, false);
        if (this.decorate) {
          this.decorate(clone);
        }
        if (deep) {
          clone.content.appendChild(Native_cloneNode.call(template.content, true));
          this.fixClonedDom(clone.content, template.content);
        }
        return clone;
      };
      PolyfilledHTMLTemplateElement.prototype.cloneNode = function(deep) {
        return PolyfilledHTMLTemplateElement._cloneNode(this, deep);
      };
      PolyfilledHTMLTemplateElement.fixClonedDom = function(clone, source) {
        if (!source.querySelectorAll) {
          return;
        }
        var s$ = source.querySelectorAll(TEMPLATE_TAG);
        var t$ = clone.querySelectorAll(TEMPLATE_TAG);
        for (var i = 0, l = t$.length, t, s;i < l;i++) {
          s = s$[i];
          t = t$[i];
          if (this.decorate) {
            this.decorate(s);
          }
          t.parentNode.replaceChild(s.cloneNode(true), t);
        }
      };
      Node.prototype.cloneNode = function(deep) {
        var dom;
        if (this instanceof DocumentFragment) {
          if (!deep) {
            return this.ownerDocument.createDocumentFragment();
          } else {
            dom = this.ownerDocument.importNode(this, true);
          }
        } else {
          dom = Native_cloneNode.call(this, deep);
        }
        if (deep) {
          PolyfilledHTMLTemplateElement.fixClonedDom(dom, this);
        }
        return dom;
      };
      Document.prototype.importNode = function(element, deep) {
        if (element.localName === TEMPLATE_TAG) {
          return PolyfilledHTMLTemplateElement._cloneNode(element, deep);
        } else {
          var dom = Native_importNode.call(this, element, deep);
          if (deep) {
            PolyfilledHTMLTemplateElement.fixClonedDom(dom, element);
          }
          return dom;
        }
      };
      if (needsCloning) {
        window.HTMLTemplateElement.prototype.cloneNode = function(deep) {
          return PolyfilledHTMLTemplateElement._cloneNode(this, deep);
        };
      }
    }
    if (needsTemplate) {
      window.HTMLTemplateElement = PolyfilledHTMLTemplateElement;
    }
  })();
  !function(t, e) {
    "object" == typeof exports && "undefined" != typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define(e) : t.ES6Promise = e();
  }(window, function() {
    function t(t) {
      var e = typeof t;
      return null !== t && ("object" === e || "function" === e);
    }
    function e(t) {
      return "function" == typeof t;
    }
    function n(t) {
      I = t;
    }
    function r(t) {
      J = t;
    }
    function o() {
      return function() {
        return process.nextTick(a);
      };
    }
    function i() {
      return "undefined" != typeof H ? function() {
        H(a);
      } : c();
    }
    function s() {
      var t = 0, e = new V(a), n = document.createTextNode("");
      return e.observe(n, {characterData:!0}), function() {
        n.data = t = ++t % 2;
      };
    }
    function u() {
      var t = new MessageChannel;
      return t.port1.onmessage = a, function() {
        return t.port2.postMessage(0);
      };
    }
    function c() {
      var t = setTimeout;
      return function() {
        return t(a, 1);
      };
    }
    function a() {
      for (var t = 0;t < G;t += 2) {
        var e = $[t], n = $[t + 1];
        e(n), $[t] = void 0, $[t + 1] = void 0;
      }
      G = 0;
    }
    function f() {
      try {
        var t = require, e = t("vertx");
        return H = e.runOnLoop || e.runOnContext, i();
      } catch (n$2) {
        return c();
      }
    }
    function l(t, e) {
      var n = arguments, r = this, o = new this.constructor(p);
      void 0 === o[et] && k(o);
      var i = r._state;
      return i ? !function() {
        var t = n[i - 1];
        J(function() {
          return x(i, o, t, r._result);
        });
      }() : E(r, o, t, e), o;
    }
    function h(t) {
      var e = this;
      if (t && "object" == typeof t && t.constructor === e) {
        return t;
      }
      var n = new e(p);
      return g(n, t), n;
    }
    function p() {
    }
    function v() {
      return new TypeError("You cannot resolve a promise with itself");
    }
    function d() {
      return new TypeError("A promises callback cannot return that same promise.");
    }
    function _(t) {
      try {
        return t.then;
      } catch (e$3) {
        return it.error = e$3, it;
      }
    }
    function y(t, e, n, r) {
      try {
        t.call(e, n, r);
      } catch (o$4) {
        return o$4;
      }
    }
    function m(t, e, n) {
      J(function(t) {
        var r = !1, o = y(n, e, function(n) {
          r || (r = !0, e !== n ? g(t, n) : S(t, n));
        }, function(e) {
          r || (r = !0, j(t, e));
        }, "Settle: " + (t._label || " unknown promise"));
        !r && o && (r = !0, j(t, o));
      }, t);
    }
    function b(t, e) {
      e._state === rt ? S(t, e._result) : e._state === ot ? j(t, e._result) : E(e, void 0, function(e) {
        return g(t, e);
      }, function(e) {
        return j(t, e);
      });
    }
    function w(t, n, r) {
      n.constructor === t.constructor && r === l && n.constructor.resolve === h ? b(t, n) : r === it ? (j(t, it.error), it.error = null) : void 0 === r ? S(t, n) : e(r) ? m(t, n, r) : S(t, n);
    }
    function g(e, n) {
      e === n ? j(e, v()) : t(n) ? w(e, n, _(n)) : S(e, n);
    }
    function A(t) {
      t._onerror && t._onerror(t._result), T(t);
    }
    function S(t, e) {
      t._state === nt && (t._result = e, t._state = rt, 0 !== t._subscribers.length && J(T, t));
    }
    function j(t, e) {
      t._state === nt && (t._state = ot, t._result = e, J(A, t));
    }
    function E(t, e, n, r) {
      var o = t._subscribers, i = o.length;
      t._onerror = null, o[i] = e, o[i + rt] = n, o[i + ot] = r, 0 === i && t._state && J(T, t);
    }
    function T(t) {
      var e = t._subscribers, n = t._state;
      if (0 !== e.length) {
        for (var r = void 0, o = void 0, i = t._result, s = 0;s < e.length;s += 3) {
          r = e[s], o = e[s + n], r ? x(n, r, o, i) : o(i);
        }
        t._subscribers.length = 0;
      }
    }
    function M() {
      this.error = null;
    }
    function P(t, e) {
      try {
        return t(e);
      } catch (n$5) {
        return st.error = n$5, st;
      }
    }
    function x(t, n, r, o) {
      var i = e(r), s = void 0, u = void 0, c = void 0, a = void 0;
      if (i) {
        if (s = P(r, o), s === st ? (a = !0, u = s.error, s.error = null) : c = !0, n === s) {
          return void j(n, d());
        }
      } else {
        s = o, c = !0;
      }
      n._state !== nt || (i && c ? g(n, s) : a ? j(n, u) : t === rt ? S(n, s) : t === ot && j(n, s));
    }
    function C(t, e) {
      try {
        e(function(e) {
          g(t, e);
        }, function(e) {
          j(t, e);
        });
      } catch (n$6) {
        j(t, n$6);
      }
    }
    function O() {
      return ut++;
    }
    function k(t) {
      t[et] = ut++, t._state = void 0, t._result = void 0, t._subscribers = [];
    }
    function Y(t, e) {
      this._instanceConstructor = t, this.promise = new t(p), this.promise[et] || k(this.promise), B(e) ? (this.length = e.length, this._remaining = e.length, this._result = new Array(this.length), 0 === this.length ? S(this.promise, this._result) : (this.length = this.length || 0, this._enumerate(e), 0 === this._remaining && S(this.promise, this._result))) : j(this.promise, q());
    }
    function q() {
      return new Error("Array Methods must be provided an Array");
    }
    function F(t) {
      return (new Y(this, t)).promise;
    }
    function D(t) {
      var e = this;
      return new e(B(t) ? function(n, r) {
        for (var o = t.length, i = 0;i < o;i++) {
          e.resolve(t[i]).then(n, r);
        }
      } : function(t, e) {
        return e(new TypeError("You must pass an array to race."));
      });
    }
    function K(t) {
      var e = this, n = new e(p);
      return j(n, t), n;
    }
    function L() {
      throw new TypeError("You must pass a resolver function as the first argument to the promise constructor");
    }
    function N() {
      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }
    function U(t) {
      this[et] = O(), this._result = this._state = void 0, this._subscribers = [], p !== t && ("function" != typeof t && L(), this instanceof U ? C(this, t) : N());
    }
    function W() {
      var t = void 0;
      if ("undefined" != typeof global) {
        t = global;
      } else {
        if ("undefined" != typeof self) {
          t = self;
        } else {
          try {
            t = Function("return this")();
          } catch (e$7) {
            throw new Error("polyfill failed because global object is unavailable in this environment");
          }
        }
      }
      var n = t.Promise;
      if (n) {
        var r = null;
        try {
          r = Object.prototype.toString.call(n.resolve());
        } catch (e$8) {
        }
        if ("[object Promise]" === r && !n.cast) {
          return;
        }
      }
      t.Promise = U;
    }
    var z = void 0;
    z = Array.isArray ? Array.isArray : function(t) {
      return "[object Array]" === Object.prototype.toString.call(t);
    };
    var B = z, G = 0, H = void 0, I = void 0, J = function(t, e) {
      $[G] = t, $[G + 1] = e, G += 2, 2 === G && (I ? I(a) : tt());
    }, Q = "undefined" != typeof window ? window : void 0, R = Q || {}, V = R.MutationObserver || R.WebKitMutationObserver, X = "undefined" == typeof self && "undefined" != typeof process && "[object process]" === {}.toString.call(process), Z = "undefined" != typeof Uint8ClampedArray && "undefined" != typeof importScripts && "undefined" != typeof MessageChannel, $ = new Array(1E3), tt = void 0;
    tt = X ? o() : V ? s() : Z ? u() : void 0 === Q && "function" == typeof require ? f() : c();
    var et = Math.random().toString(36).substring(16), nt = void 0, rt = 1, ot = 2, it = new M, st = new M, ut = 0;
    return Y.prototype._enumerate = function(t) {
      for (var e = 0;this._state === nt && e < t.length;e++) {
        this._eachEntry(t[e], e);
      }
    }, Y.prototype._eachEntry = function(t, e) {
      var n = this._instanceConstructor, r = n.resolve;
      if (r === h) {
        var o = _(t);
        if (o === l && t._state !== nt) {
          this._settledAt(t._state, e, t._result);
        } else {
          if ("function" != typeof o) {
            this._remaining--, this._result[e] = t;
          } else {
            if (n === U) {
              var i = new n(p);
              w(i, t, o), this._willSettleAt(i, e);
            } else {
              this._willSettleAt(new n(function(e) {
                return e(t);
              }), e);
            }
          }
        }
      } else {
        this._willSettleAt(r(t), e);
      }
    }, Y.prototype._settledAt = function(t, e, n) {
      var r = this.promise;
      r._state === nt && (this._remaining--, t === ot ? j(r, n) : this._result[e] = n), 0 === this._remaining && S(r, this._result);
    }, Y.prototype._willSettleAt = function(t, e) {
      var n = this;
      E(t, void 0, function(t) {
        return n._settledAt(rt, e, t);
      }, function(t) {
        return n._settledAt(ot, e, t);
      });
    }, U.all = F, U.race = D, U.resolve = h, U.reject = K, U._setScheduler = n, U._setAsap = r, U._asap = J, U.prototype = {constructor:U, then:l, "catch":function(t) {
      return this.then(null, t);
    }}, U.polyfill = W, U.Promise = U, U.polyfill(), U;
  });
  (function(scope) {
    var useNative = Boolean("import" in document.createElement("link"));
    var currentScript = null;
    if ("currentScript" in document === false) {
      Object.defineProperty(document, "currentScript", {get:function() {
        return currentScript || (document.readyState !== "complete" ? document.scripts[document.scripts.length - 1] : null);
      }, configurable:true});
    }
    var forEach = function(list, callback, inverseOrder) {
      var length = list ? list.length : 0;
      var increment = inverseOrder ? -1 : 1;
      var i = inverseOrder ? length - 1 : 0;
      for (;i < length && i >= 0;i = i + increment) {
        callback(list[i], i);
      }
    };
    var ABS_URL_TEST = /(^\/)|(^#)|(^[\w-\d]*:)/;
    var CSS_URL_REGEXP = /(url\()([^)]*)(\))/g;
    var CSS_IMPORT_REGEXP = /(@import[\s]+(?!url\())([^;]*)(;)/g;
    var STYLESHEET_REGEXP = /(<link[^>]*)(rel=['|"]?stylesheet['|"]?[^>]*>)/g;
    var Path = {fixUrls:function(element, base) {
      if (element.href) {
        element.setAttribute("href", Path.replaceAttrUrl(element.getAttribute("href"), base));
      }
      if (element.src) {
        element.setAttribute("src", Path.replaceAttrUrl(element.getAttribute("src"), base));
      }
      if (element.localName === "style") {
        var r = Path.replaceUrls(element.textContent, base, CSS_URL_REGEXP);
        element.textContent = Path.replaceUrls(r, base, CSS_IMPORT_REGEXP);
      }
    }, replaceUrls:function(text, linkUrl, regexp) {
      return text.replace(regexp, function(m, pre, url, post) {
        var urlPath = url.replace(/["']/g, "");
        if (linkUrl) {
          urlPath = Path.resolveUrl(urlPath, linkUrl);
        }
        return pre + "'" + urlPath + "'" + post;
      });
    }, replaceAttrUrl:function(text, linkUrl) {
      if (text && ABS_URL_TEST.test(text)) {
        return text;
      } else {
        return Path.resolveUrl(text, linkUrl);
      }
    }, resolveUrl:function(url, base) {
      if (Path.__workingURL === undefined) {
        Path.__workingURL = false;
        try {
          var u = new URL("b", "http://a");
          u.pathname = "c%20d";
          Path.__workingURL = u.href === "http://a/c%20d";
        } catch (e) {
        }
      }
      if (Path.__workingURL) {
        return (new URL(url, base)).href;
      }
      var doc = Path.__tempDoc;
      if (!doc) {
        doc = document.implementation.createHTMLDocument("temp");
        Path.__tempDoc = doc;
        doc.__base = doc.createElement("base");
        doc.head.appendChild(doc.__base);
        doc.__anchor = doc.createElement("a");
      }
      doc.__base.href = base;
      doc.__anchor.href = url;
      return doc.__anchor.href || url;
    }};
    var Xhr = {async:true, load:function(url, success, fail) {
      if (!url) {
        fail("error: href must be specified");
      } else {
        if (url.match(/^data:/)) {
          var pieces = url.split(",");
          var header = pieces[0];
          var resource = pieces[1];
          if (header.indexOf(";base64") > -1) {
            resource = atob(resource);
          } else {
            resource = decodeURIComponent(resource);
          }
          success(resource);
        } else {
          var request = new XMLHttpRequest;
          request.open("GET", url, Xhr.async);
          request.onload = function() {
            var redirectedUrl = request.getResponseHeader("Location");
            if (redirectedUrl && redirectedUrl.indexOf("/") === 0) {
              var origin = location.origin || location.protocol + "//" + location.host;
              redirectedUrl = origin + redirectedUrl;
            }
            var resource = (request.response || request.responseText);
            if (request.status === 304 || request.status === 0 || request.status >= 200 && request.status < 300) {
              success(resource, redirectedUrl);
            } else {
              fail(resource);
            }
          };
          request.send();
        }
      }
    }};
    var isIE = /Trident/.test(navigator.userAgent) || /Edge\/\d./i.test(navigator.userAgent);
    var importSelector = "link[rel=import]";
    var importDisableType = "import-disable";
    var disabledLinkSelector = "link[rel=stylesheet][href][type=" + importDisableType + "]";
    var importDependenciesSelector = importSelector + ", " + disabledLinkSelector + ',\n    style:not([type]), link[rel=stylesheet][href]:not([type]),\n    script:not([type]), script[type="application/javascript"],\n    script[type="text/javascript"]';
    var importDependencyAttr = "import-dependency";
    var rootImportSelector = importSelector + ":not(" + importDependencyAttr + ")";
    var pendingScriptsSelector = "script[" + importDependencyAttr + "]";
    var pendingStylesSelector = "style[" + importDependencyAttr + "],\n    link[rel=stylesheet][" + importDependencyAttr + "]";
    var Importer = function() {
      var $jscomp$this = this;
      this.documents = {};
      this.inflight = 0;
      this.dynamicImportsMO = new MutationObserver(function(m) {
        return $jscomp$this.handleMutations(m);
      });
      this.dynamicImportsMO.observe(document.head, {childList:true, subtree:true});
      this.loadImports(document);
    };
    Importer.prototype.loadImports = function(doc) {
      var $jscomp$this = this;
      var links = (doc.querySelectorAll(importSelector));
      forEach(links, function(link) {
        return $jscomp$this.loadImport(link);
      });
    };
    Importer.prototype.loadImport = function(link) {
      var $jscomp$this = this;
      var url = link.href;
      if (this.documents[url] !== undefined) {
        var imp = this.documents[url];
        if (imp && imp["__loaded"]) {
          link.import = imp;
          this.fireEventIfNeeded(link);
        }
        return;
      }
      this.inflight++;
      this.documents[url] = "pending";
      Xhr.load(url, function(resource, redirectedUrl) {
        var doc = $jscomp$this.makeDocument(resource, redirectedUrl || url);
        $jscomp$this.documents[url] = doc;
        $jscomp$this.inflight--;
        $jscomp$this.loadImports(doc);
        $jscomp$this.processImportsIfLoadingDone();
      }, function() {
        $jscomp$this.documents[url] = null;
        $jscomp$this.inflight--;
        $jscomp$this.processImportsIfLoadingDone();
      });
    };
    Importer.prototype.makeDocument = function(resource, url) {
      if (!resource) {
        return document.createDocumentFragment();
      }
      if (isIE) {
        resource = resource.replace(STYLESHEET_REGEXP, function(match, p1, p2) {
          if (match.indexOf("type=") === -1) {
            return p1 + " type=" + importDisableType + " " + p2;
          }
          return match;
        });
      }
      var content;
      var template = (document.createElement("template"));
      template.innerHTML = resource;
      if (template.content) {
        content = template.content;
      } else {
        content = document.createDocumentFragment();
        while (template.firstChild) {
          content.appendChild(template.firstChild);
        }
      }
      var baseEl = content.querySelector("base");
      if (baseEl) {
        url = Path.replaceAttrUrl(baseEl.getAttribute("href"), url);
        baseEl.removeAttribute("href");
      }
      var n$ = (content.querySelectorAll(importDependenciesSelector));
      var inlineScriptIndex = 0;
      forEach(n$, function(n) {
        whenElementLoaded(n);
        Path.fixUrls(n, url);
        n.setAttribute(importDependencyAttr, "");
        if (n.localName === "script" && !n.src && n.textContent) {
          var num = inlineScriptIndex ? "-" + inlineScriptIndex : "";
          var content$9 = n.textContent + ("\n//# sourceURL=" + url + num + ".js\n");
          n.setAttribute("src", "data:text/javascript;charset=utf-8," + encodeURIComponent(content$9));
          n.textContent = "";
          inlineScriptIndex++;
        }
      });
      return content;
    };
    Importer.prototype.processImportsIfLoadingDone = function() {
      var $jscomp$this = this;
      if (this.inflight) {
        return;
      }
      this.dynamicImportsMO.disconnect();
      this.flatten(document);
      var scriptsOk = false, stylesOk = false;
      var onLoadingDone = function() {
        if (stylesOk && scriptsOk) {
          $jscomp$this.loadImports(document);
          if ($jscomp$this.inflight) {
            return;
          }
          $jscomp$this.dynamicImportsMO.observe(document.head, {childList:true, subtree:true});
          $jscomp$this.fireEvents();
        }
      };
      this.waitForStyles(function() {
        stylesOk = true;
        onLoadingDone();
      });
      this.runScripts(function() {
        scriptsOk = true;
        onLoadingDone();
      });
    };
    Importer.prototype.flatten = function(doc) {
      var $jscomp$this = this;
      var n$ = (doc.querySelectorAll(importSelector));
      forEach(n$, function(n) {
        var imp = $jscomp$this.documents[n.href];
        n.import = (imp);
        if (imp && imp.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
          $jscomp$this.documents[n.href] = n;
          n.readyState = "loading";
          (n).import = n;
          $jscomp$this.flatten(imp);
          n.appendChild(imp);
        }
      });
    };
    Importer.prototype.runScripts = function(callback) {
      var s$ = document.querySelectorAll(pendingScriptsSelector);
      var l = s$.length;
      var cloneScript = function(i) {
        if (i < l) {
          var s = s$[i];
          var clone = (document.createElement("script"));
          s.removeAttribute(importDependencyAttr);
          forEach(s.attributes, function(attr) {
            return clone.setAttribute(attr.name, attr.value);
          });
          currentScript = clone;
          s.parentNode.replaceChild(clone, s);
          whenElementLoaded(clone, function() {
            currentScript = null;
            cloneScript(i + 1);
          });
        } else {
          callback();
        }
      };
      cloneScript(0);
    };
    Importer.prototype.waitForStyles = function(callback) {
      var s$ = (document.querySelectorAll(pendingStylesSelector));
      var pending = s$.length;
      if (!pending) {
        callback();
        return;
      }
      var needsMove = isIE && !!document.querySelector(disabledLinkSelector);
      forEach(s$, function(s) {
        whenElementLoaded(s, function() {
          s.removeAttribute(importDependencyAttr);
          if (--pending === 0) {
            callback();
          }
        });
        if (needsMove && s.parentNode !== document.head) {
          var placeholder = document.createElement(s.localName);
          placeholder["__appliedElement"] = s;
          placeholder.setAttribute("type", "import-placeholder");
          s.parentNode.insertBefore(placeholder, s.nextSibling);
          var newSibling = importForElement(s);
          while (newSibling && importForElement(newSibling)) {
            newSibling = importForElement(newSibling);
          }
          if (newSibling.parentNode !== document.head) {
            newSibling = null;
          }
          document.head.insertBefore(s, newSibling);
          s.removeAttribute("type");
        }
      });
    };
    Importer.prototype.fireEvents = function() {
      var $jscomp$this = this;
      var n$ = (document.querySelectorAll(importSelector));
      forEach(n$, function(n) {
        return $jscomp$this.fireEventIfNeeded(n);
      }, true);
    };
    Importer.prototype.fireEventIfNeeded = function(link) {
      if (!link["__loaded"]) {
        link["__loaded"] = true;
        link.import && (link.import.readyState = "complete");
        var eventType = link.import ? "load" : "error";
        link.dispatchEvent(newCustomEvent(eventType, {bubbles:false, cancelable:false, detail:undefined}));
      }
    };
    Importer.prototype.handleMutations = function(mutations) {
      var $jscomp$this = this;
      forEach(mutations, function(m) {
        return forEach(m.addedNodes, function(elem) {
          if (elem && elem.nodeType === Node.ELEMENT_NODE) {
            if (isImportLink(elem)) {
              $jscomp$this.loadImport((elem));
            } else {
              $jscomp$this.loadImports((elem));
            }
          }
        });
      });
    };
    var isImportLink = function(node) {
      return node.nodeType === Node.ELEMENT_NODE && node.localName === "link" && (node).rel === "import";
    };
    var whenElementLoaded = function(element, callback) {
      if (element["__loaded"]) {
        callback && callback();
      } else {
        if (element.localName === "script" && !element.src || element.localName === "style" && !element.firstChild) {
          element["__loaded"] = true;
          callback && callback();
        } else {
          var onLoadingDone = function(event) {
            element.removeEventListener(event.type, onLoadingDone);
            element["__loaded"] = true;
            callback && callback();
          };
          element.addEventListener("load", onLoadingDone);
          if (!isIE || element.localName !== "style") {
            element.addEventListener("error", onLoadingDone);
          }
        }
      }
    };
    var whenReady = function(callback) {
      whenDocumentReady(function() {
        return whenImportsReady(function() {
          return callback && callback();
        });
      });
    };
    var whenDocumentReady = function(callback) {
      var stateChanged = function() {
        if (document.readyState !== "loading" && !!document.body) {
          document.removeEventListener("readystatechange", stateChanged);
          callback();
        }
      };
      document.addEventListener("readystatechange", stateChanged);
      stateChanged();
    };
    var whenImportsReady = function(callback) {
      var imports = (document.querySelectorAll(rootImportSelector));
      var pending = imports.length;
      if (!pending) {
        callback();
        return;
      }
      forEach(imports, function(imp) {
        return whenElementLoaded(imp, function() {
          if (--pending === 0) {
            callback();
          }
        });
      });
    };
    var importForElement = function(element) {
      if (useNative) {
        return element.ownerDocument !== document ? element.ownerDocument : null;
      }
      var doc = element["__importDoc"];
      if (!doc && element.parentNode) {
        doc = (element.parentNode);
        if (typeof doc.closest === "function") {
          doc = doc.closest(importSelector);
        } else {
          while (!isImportLink(doc) && (doc = doc.parentNode)) {
          }
        }
        element["__importDoc"] = doc;
      }
      return doc;
    };
    var newCustomEvent = function(type, params) {
      if (typeof window.CustomEvent === "function") {
        return new CustomEvent(type, params);
      }
      var event = (document.createEvent("CustomEvent"));
      event.initCustomEvent(type, Boolean(params.bubbles), Boolean(params.cancelable), params.detail);
      return event;
    };
    if (useNative) {
      var imps = (document.querySelectorAll(importSelector));
      forEach(imps, function(imp) {
        if (!imp.import || imp.import.readyState !== "loading") {
          imp["__loaded"] = true;
        }
      });
      var onLoadingDone = function(event) {
        var elem = (event.target);
        if (isImportLink(elem)) {
          elem["__loaded"] = true;
        }
      };
      document.addEventListener("load", onLoadingDone, true);
      document.addEventListener("error", onLoadingDone, true);
    } else {
      var native_baseURI = Object.getOwnPropertyDescriptor(Node.prototype, "baseURI");
      var klass = !native_baseURI || native_baseURI.configurable ? Node : Element;
      Object.defineProperty(klass.prototype, "baseURI", {get:function() {
        var ownerDoc = (isImportLink(this) ? this : importForElement(this));
        if (ownerDoc) {
          return ownerDoc.href;
        }
        if (native_baseURI && native_baseURI.get) {
          return native_baseURI.get.call(this);
        }
        var base = (document.querySelector("base"));
        return (base || window.location).href;
      }, configurable:true, enumerable:true});
      whenDocumentReady(function() {
        return new Importer;
      });
    }
    whenReady(function() {
      return document.dispatchEvent(newCustomEvent("HTMLImportsLoaded", {cancelable:true, bubbles:true, detail:undefined}));
    });
    scope.useNative = useNative;
    scope.whenReady = whenReady;
    scope.importForElement = importForElement;
  })(window.HTMLImports = window.HTMLImports || {});
  (function() {
    window["WebComponents"] = window["WebComponents"] || {"flags":{}};
    var file = "webcomponents-lite.js";
    var script = document.querySelector('script[src*="' + file + '"]');
    var flagMatcher = /wc-(.+)/;
    var flags = {};
    if (!flags["noOpts"]) {
      location.search.slice(1).split("&").forEach(function(option) {
        var parts = option.split("=");
        var match;
        if (parts[0] && (match = parts[0].match(flagMatcher))) {
          flags[match[1]] = parts[1] || true;
        }
      });
      if (script) {
        for (var i = 0, a;a = script.attributes[i];i++) {
          if (a.name !== "src") {
            flags[a.name] = a.value || true;
          }
        }
      }
      if (flags["log"] && flags["log"]["split"]) {
        var parts = flags["log"].split(",");
        flags["log"] = {};
        parts.forEach(function(f) {
          flags["log"][f] = true;
        });
      } else {
        flags["log"] = {};
      }
    }
    window["WebComponents"]["flags"] = flags;
    var forceShady = flags["shadydom"];
    if (forceShady) {
      window["ShadyDOM"] = window["ShadyDOM"] || {};
      window["ShadyDOM"]["force"] = forceShady;
    }
    var forceCE = flags["register"] || flags["ce"];
    if (forceCE && window["customElements"]) {
      window["customElements"]["forcePolyfill"] = forceCE;
    }
  })();
  var settings = window["ShadyDOM"] || {};
  settings.hasNativeShadowDOM = Boolean(Element.prototype.attachShadow && Node.prototype.getRootNode);
  var desc = Object.getOwnPropertyDescriptor(Node.prototype, "firstChild");
  settings.hasDescriptors = Boolean(desc && desc.configurable && desc.get);
  settings.inUse = settings["force"] || !settings.hasNativeShadowDOM;
  function isTrackingLogicalChildNodes(node) {
    return node.__shady && node.__shady.firstChild !== undefined;
  }
  function isShadyRoot(obj) {
    return Boolean(obj.__localName === "ShadyRoot");
  }
  function ownerShadyRootForNode(node) {
    var root = node.getRootNode();
    if (isShadyRoot(root)) {
      return root;
    }
  }
  var p = Element.prototype;
  var matches = p.matches || p.matchesSelector || p.mozMatchesSelector || p.msMatchesSelector || p.oMatchesSelector || p.webkitMatchesSelector;
  function matchesSelector(element, selector) {
    return matches.call(element, selector);
  }
  function copyOwnProperty(name, source, target) {
    var pd = Object.getOwnPropertyDescriptor(source, name);
    if (pd) {
      Object.defineProperty(target, name, pd);
    }
  }
  function extend(target, source) {
    if (target && source) {
      var n$ = Object.getOwnPropertyNames(source);
      for (var i = 0, n;i < n$.length && (n = n$[i]);i++) {
        copyOwnProperty(n, source, target);
      }
    }
    return target || source;
  }
  function extendAll(target, sources) {
    var $jscomp$restParams = [];
    for (var $jscomp$restIndex = 1;$jscomp$restIndex < arguments.length;++$jscomp$restIndex) {
      $jscomp$restParams[$jscomp$restIndex - 1] = arguments[$jscomp$restIndex];
    }
    {
      var sources$10 = $jscomp$restParams;
      for (var i = 0;i < sources$10.length;i++) {
        extend(target, sources$10[i]);
      }
      return target;
    }
  }
  function mixin(target, source) {
    for (var i in source) {
      target[i] = source[i];
    }
    return target;
  }
  function patchPrototype(obj, mixin) {
    var proto = Object.getPrototypeOf(obj);
    if (!proto.hasOwnProperty("__patchProto")) {
      var patchProto = Object.create(proto);
      patchProto.__sourceProto = proto;
      extend(patchProto, mixin);
      proto["__patchProto"] = patchProto;
    }
    obj.__proto__ = proto["__patchProto"];
  }
  var twiddle = document.createTextNode("");
  var content = 0;
  var queue = [];
  (new MutationObserver(function() {
    while (queue.length) {
      try {
        queue.shift()();
      } catch (e) {
        twiddle.textContent = content++;
        throw e;
      }
    }
  })).observe(twiddle, {characterData:true});
  function microtask(callback) {
    queue.push(callback);
    twiddle.textContent = content++;
  }
  var flushList = [];
  var scheduled;
  function enqueue(callback) {
    if (!scheduled) {
      scheduled = true;
      microtask(flush);
    }
    flushList.push(callback);
  }
  function flush() {
    scheduled = false;
    var didFlush = Boolean(flushList.length);
    while (flushList.length) {
      flushList.shift()();
    }
    return didFlush;
  }
  flush["list"] = flushList;
  var AsyncObserver = function() {
    this._scheduled = false;
    this.addedNodes = [];
    this.removedNodes = [];
    this.callbacks = new Set;
  };
  AsyncObserver.prototype.schedule = function() {
    var $jscomp$this = this;
    if (!this._scheduled) {
      this._scheduled = true;
      microtask(function() {
        $jscomp$this.flush();
      });
    }
  };
  AsyncObserver.prototype.flush = function() {
    if (this._scheduled) {
      this._scheduled = false;
      var mutations = this.takeRecords();
      if (mutations.length) {
        this.callbacks.forEach(function(cb) {
          cb(mutations);
        });
      }
    }
  };
  AsyncObserver.prototype.takeRecords = function() {
    if (this.addedNodes.length || this.removedNodes.length) {
      var mutations = [{addedNodes:this.addedNodes, removedNodes:this.removedNodes}];
      this.addedNodes = [];
      this.removedNodes = [];
      return mutations;
    }
    return [];
  };
  var observeChildren = function(node, callback) {
    node.__shady = node.__shady || {};
    if (!node.__shady.observer) {
      node.__shady.observer = new AsyncObserver;
    }
    node.__shady.observer.callbacks.add(callback);
    var observer = node.__shady.observer;
    return {_callback:callback, _observer:observer, _node:node, takeRecords:function() {
      return observer.takeRecords();
    }};
  };
  var unobserveChildren = function(handle) {
    var observer = handle && handle._observer;
    if (observer) {
      observer.callbacks.delete(handle._callback);
      if (!observer.callbacks.size) {
        handle._node.__shady.observer = null;
      }
    }
  };
  function filterMutations(mutations, target) {
    var targetRootNode = target.getRootNode();
    return mutations.map(function(mutation) {
      var mutationInScope = targetRootNode === mutation.target.getRootNode();
      if (mutationInScope && mutation.addedNodes) {
        var nodes = Array.from(mutation.addedNodes).filter(function(n) {
          return targetRootNode === n.getRootNode();
        });
        if (nodes.length) {
          mutation = Object.create(mutation);
          Object.defineProperty(mutation, "addedNodes", {value:nodes, configurable:true});
          return mutation;
        }
      } else {
        if (mutationInScope) {
          return mutation;
        }
      }
    }).filter(function(m) {
      return m;
    });
  }
  var appendChild = Element.prototype.appendChild;
  var insertBefore = Element.prototype.insertBefore;
  var removeChild = Element.prototype.removeChild;
  var setAttribute = Element.prototype.setAttribute;
  var removeAttribute = Element.prototype.removeAttribute;
  var cloneNode = Element.prototype.cloneNode;
  var importNode = Document.prototype.importNode;
  var addEventListener = Element.prototype.addEventListener;
  var removeEventListener = Element.prototype.removeEventListener;
  var windowAddEventListener = Window.prototype.addEventListener;
  var windowRemoveEventListener = Window.prototype.removeEventListener;
  var dispatchEvent = Element.prototype.dispatchEvent;
  var querySelector = Element.prototype.querySelector;
  var querySelectorAll = Element.prototype.querySelectorAll;
  var nativeMethods = Object.freeze({appendChild:appendChild, insertBefore:insertBefore, removeChild:removeChild, setAttribute:setAttribute, removeAttribute:removeAttribute, cloneNode:cloneNode, importNode:importNode, addEventListener:addEventListener, removeEventListener:removeEventListener, windowAddEventListener:windowAddEventListener, windowRemoveEventListener:windowRemoveEventListener, dispatchEvent:dispatchEvent, querySelector:querySelector, querySelectorAll:querySelectorAll});
  var escapeAttrRegExp = /[&\u00A0"]/g;
  var escapeDataRegExp = /[&\u00A0<>]/g;
  function escapeReplace(c) {
    switch(c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "\u00a0":
        return "&nbsp;";
    }
  }
  function escapeAttr(s) {
    return s.replace(escapeAttrRegExp, escapeReplace);
  }
  function escapeData(s) {
    return s.replace(escapeDataRegExp, escapeReplace);
  }
  function makeSet(arr) {
    var set = {};
    for (var i = 0;i < arr.length;i++) {
      set[arr[i]] = true;
    }
    return set;
  }
  var voidElements = makeSet(["area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"]);
  var plaintextParents = makeSet(["style", "script", "xmp", "iframe", "noembed", "noframes", "plaintext", "noscript"]);
  function getOuterHTML(node, parentNode, callback) {
    switch(node.nodeType) {
      case Node.ELEMENT_NODE:
        {
          var tagName = node.localName;
          var s = "<" + tagName;
          var attrs = node.attributes;
          for (var i = 0, attr;attr = attrs[i];i++) {
            s += " " + attr.name + '="' + escapeAttr(attr.value) + '"';
          }
          s += ">";
          if (voidElements[tagName]) {
            return s;
          }
          return s + getInnerHTML(node, callback) + "</" + tagName + ">";
        }
      case Node.TEXT_NODE:
        {
          var data = (node).data;
          if (parentNode && plaintextParents[parentNode.localName]) {
            return data;
          }
          return escapeData(data);
        }
      case Node.COMMENT_NODE:
        {
          return "\x3c!--" + (node).data + "--\x3e";
        }
      default:
        {
          window.console.error(node);
          throw new Error("not implemented");
        }
    }
  }
  function getInnerHTML(node, callback) {
    if (node.localName === "template") {
      node = (node).content;
    }
    var s = "";
    var c$ = callback ? callback(node) : node.childNodes;
    for (var i = 0, l = c$.length, child;i < l && (child = c$[i]);i++) {
      s += getOuterHTML(child, node, callback);
    }
    return s;
  }
  var nodeWalker = document.createTreeWalker(document, NodeFilter.SHOW_ALL, null, false);
  var elementWalker = document.createTreeWalker(document, NodeFilter.SHOW_ELEMENT, null, false);
  function parentNode(node) {
    nodeWalker.currentNode = node;
    return nodeWalker.parentNode();
  }
  function firstChild(node) {
    nodeWalker.currentNode = node;
    return nodeWalker.firstChild();
  }
  function lastChild(node) {
    nodeWalker.currentNode = node;
    return nodeWalker.lastChild();
  }
  function previousSibling(node) {
    nodeWalker.currentNode = node;
    return nodeWalker.previousSibling();
  }
  function nextSibling(node) {
    nodeWalker.currentNode = node;
    return nodeWalker.nextSibling();
  }
  function childNodes(node) {
    var nodes = [];
    nodeWalker.currentNode = node;
    var n = nodeWalker.firstChild();
    while (n) {
      nodes.push(n);
      n = nodeWalker.nextSibling();
    }
    return nodes;
  }
  function parentElement(node) {
    elementWalker.currentNode = node;
    return elementWalker.parentNode();
  }
  function firstElementChild(node) {
    elementWalker.currentNode = node;
    return elementWalker.firstChild();
  }
  function lastElementChild(node) {
    elementWalker.currentNode = node;
    return elementWalker.lastChild();
  }
  function previousElementSibling(node) {
    elementWalker.currentNode = node;
    return elementWalker.previousSibling();
  }
  function nextElementSibling(node) {
    elementWalker.currentNode = node;
    return elementWalker.nextSibling();
  }
  function children(node) {
    var nodes = [];
    elementWalker.currentNode = node;
    var n = elementWalker.firstChild();
    while (n) {
      nodes.push(n);
      n = elementWalker.nextSibling();
    }
    return nodes;
  }
  function innerHTML(node) {
    return getInnerHTML(node, function(n) {
      return childNodes(n);
    });
  }
  function textContent(node) {
    switch(node.nodeType) {
      case Node.ELEMENT_NODE:
      case Node.DOCUMENT_FRAGMENT_NODE:
        var textWalker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
        var content$11 = "", n;
        while (n = textWalker.nextNode()) {
          content$11 += n.nodeValue;
        }
        return content$11;
      default:
        return node.nodeValue;
    }
  }
  var nativeTree = Object.freeze({parentNode:parentNode, firstChild:firstChild, lastChild:lastChild, previousSibling:previousSibling, nextSibling:nextSibling, childNodes:childNodes, parentElement:parentElement, firstElementChild:firstElementChild, lastElementChild:lastElementChild, previousElementSibling:previousElementSibling, nextElementSibling:nextElementSibling, children:children, innerHTML:innerHTML, textContent:textContent});
  function clearNode(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }
  var nativeInnerHTMLDesc = (Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML") || Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerHTML"));
  var inertDoc = document.implementation.createHTMLDocument("inert");
  var htmlContainer = inertDoc.createElement("div");
  var nativeActiveElementDescriptor = (Object.getOwnPropertyDescriptor(Document.prototype, "activeElement"));
  function getDocumentActiveElement() {
    if (nativeActiveElementDescriptor && nativeActiveElementDescriptor.get) {
      return nativeActiveElementDescriptor.get.call(document);
    } else {
      if (!settings.hasDescriptors) {
        return document.activeElement;
      }
    }
  }
  function activeElementForNode(node) {
    var active = getDocumentActiveElement();
    if (!active || !active.nodeType) {
      return null;
    }
    var isShadyRoot$$1 = !!isShadyRoot(node);
    if (node !== document) {
      if (!isShadyRoot$$1) {
        return null;
      }
      if (node.host === active || !node.host.contains(active)) {
        return null;
      }
    }
    var activeRoot = ownerShadyRootForNode(active);
    while (activeRoot && activeRoot !== node) {
      active = activeRoot.host;
      activeRoot = ownerShadyRootForNode(active);
    }
    if (node === document) {
      return activeRoot ? null : active;
    } else {
      return activeRoot === node ? active : null;
    }
  }
  var OutsideAccessors = {parentElement:{get:function() {
    var l = this.__shady && this.__shady.parentNode;
    if (l && l.nodeType !== Node.ELEMENT_NODE) {
      l = null;
    }
    return l !== undefined ? l : parentElement(this);
  }, configurable:true}, parentNode:{get:function() {
    var l = this.__shady && this.__shady.parentNode;
    return l !== undefined ? l : parentNode(this);
  }, configurable:true}, nextSibling:{get:function() {
    var l = this.__shady && this.__shady.nextSibling;
    return l !== undefined ? l : nextSibling(this);
  }, configurable:true}, previousSibling:{get:function() {
    var l = this.__shady && this.__shady.previousSibling;
    return l !== undefined ? l : previousSibling(this);
  }, configurable:true}, className:{get:function() {
    return this.getAttribute("class") || "";
  }, set:function(value) {
    this.setAttribute("class", value);
  }, configurable:true}, nextElementSibling:{get:function() {
    if (this.__shady && this.__shady.nextSibling !== undefined) {
      var n = this.nextSibling;
      while (n && n.nodeType !== Node.ELEMENT_NODE) {
        n = n.nextSibling;
      }
      return n;
    } else {
      return nextElementSibling(this);
    }
  }, configurable:true}, previousElementSibling:{get:function() {
    if (this.__shady && this.__shady.previousSibling !== undefined) {
      var n = this.previousSibling;
      while (n && n.nodeType !== Node.ELEMENT_NODE) {
        n = n.previousSibling;
      }
      return n;
    } else {
      return previousElementSibling(this);
    }
  }, configurable:true}};
  var InsideAccessors = {childNodes:{get:function() {
    var childNodes$$1;
    if (isTrackingLogicalChildNodes(this)) {
      if (!this.__shady.childNodes) {
        this.__shady.childNodes = [];
        for (var n = this.firstChild;n;n = n.nextSibling) {
          this.__shady.childNodes.push(n);
        }
      }
      childNodes$$1 = this.__shady.childNodes;
    } else {
      childNodes$$1 = childNodes(this);
    }
    childNodes$$1.item = function(index) {
      return childNodes$$1[index];
    };
    return childNodes$$1;
  }, configurable:true}, childElementCount:{get:function() {
    return this.children.length;
  }, configurable:true}, firstChild:{get:function() {
    var l = this.__shady && this.__shady.firstChild;
    return l !== undefined ? l : firstChild(this);
  }, configurable:true}, lastChild:{get:function() {
    var l = this.__shady && this.__shady.lastChild;
    return l !== undefined ? l : lastChild(this);
  }, configurable:true}, textContent:{get:function() {
    if (isTrackingLogicalChildNodes(this)) {
      var tc = [];
      for (var i = 0, cn = this.childNodes, c;c = cn[i];i++) {
        if (c.nodeType !== Node.COMMENT_NODE) {
          tc.push(c.textContent);
        }
      }
      return tc.join("");
    } else {
      return textContent(this);
    }
  }, set:function(text) {
    switch(this.nodeType) {
      case Node.ELEMENT_NODE:
      case Node.DOCUMENT_FRAGMENT_NODE:
        clearNode(this);
        this.appendChild(document.createTextNode(text));
        break;
      default:
        this.nodeValue = text;
        break;
    }
  }, configurable:true}, firstElementChild:{get:function() {
    if (this.__shady && this.__shady.firstChild !== undefined) {
      var n = this.firstChild;
      while (n && n.nodeType !== Node.ELEMENT_NODE) {
        n = n.nextSibling;
      }
      return n;
    } else {
      return firstElementChild(this);
    }
  }, configurable:true}, lastElementChild:{get:function() {
    if (this.__shady && this.__shady.lastChild !== undefined) {
      var n = this.lastChild;
      while (n && n.nodeType !== Node.ELEMENT_NODE) {
        n = n.previousSibling;
      }
      return n;
    } else {
      return lastElementChild(this);
    }
  }, configurable:true}, children:{get:function() {
    var children$$1;
    if (isTrackingLogicalChildNodes(this)) {
      children$$1 = Array.prototype.filter.call(this.childNodes, function(n) {
        return n.nodeType === Node.ELEMENT_NODE;
      });
    } else {
      children$$1 = children(this);
    }
    children$$1.item = function(index) {
      return children$$1[index];
    };
    return children$$1;
  }, configurable:true}, innerHTML:{get:function() {
    var content = this.localName === "template" ? (this).content : this;
    if (isTrackingLogicalChildNodes(this)) {
      return getInnerHTML(content);
    } else {
      return innerHTML(content);
    }
  }, set:function(text) {
    var content = this.localName === "template" ? (this).content : this;
    clearNode(content);
    if (nativeInnerHTMLDesc && nativeInnerHTMLDesc.set) {
      nativeInnerHTMLDesc.set.call(htmlContainer, text);
    } else {
      htmlContainer.innerHTML = text;
    }
    while (htmlContainer.firstChild) {
      content.appendChild(htmlContainer.firstChild);
    }
  }, configurable:true}};
  var ShadowRootAccessor = {shadowRoot:{get:function() {
    return this.__shady && this.__shady.publicRoot || null;
  }, configurable:true}};
  var ActiveElementAccessor = {activeElement:{get:function() {
    return activeElementForNode(this);
  }, set:function() {
  }, configurable:true}};
  function patchAccessorGroup(obj, descriptors, force) {
    for (var p$12 in descriptors) {
      var objDesc = Object.getOwnPropertyDescriptor(obj, p$12);
      if (objDesc && objDesc.configurable || !objDesc && force) {
        Object.defineProperty(obj, p$12, descriptors[p$12]);
      } else {
        if (force) {
          console.warn("Could not define", p$12, "on", obj);
        }
      }
    }
  }
  function patchAccessors(proto) {
    patchAccessorGroup(proto, OutsideAccessors);
    patchAccessorGroup(proto, InsideAccessors);
    patchAccessorGroup(proto, ActiveElementAccessor);
  }
  function patchShadowRootAccessors(proto) {
    patchAccessorGroup(proto, InsideAccessors, true);
    patchAccessorGroup(proto, ActiveElementAccessor, true);
  }
  var patchOutsideElementAccessors = settings.hasDescriptors ? function() {
  } : function(element) {
    if (!(element.__shady && element.__shady.__outsideAccessors)) {
      element.__shady = element.__shady || {};
      element.__shady.__outsideAccessors = true;
      patchAccessorGroup(element, OutsideAccessors, true);
    }
  };
  var patchInsideElementAccessors = settings.hasDescriptors ? function() {
  } : function(element) {
    if (!(element.__shady && element.__shady.__insideAccessors)) {
      element.__shady = element.__shady || {};
      element.__shady.__insideAccessors = true;
      patchAccessorGroup(element, InsideAccessors, true);
      patchAccessorGroup(element, ShadowRootAccessor, true);
    }
  };
  function recordInsertBefore(node, container, ref_node) {
    patchInsideElementAccessors(container);
    container.__shady = container.__shady || {};
    if (container.__shady.firstChild !== undefined) {
      container.__shady.childNodes = null;
    }
    if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      var c$ = node.childNodes;
      for (var i = 0;i < c$.length;i++) {
        linkNode(c$[i], container, ref_node);
      }
      node.__shady = node.__shady || {};
      var resetTo = node.__shady.firstChild !== undefined ? null : undefined;
      node.__shady.firstChild = node.__shady.lastChild = resetTo;
      node.__shady.childNodes = resetTo;
    } else {
      linkNode(node, container, ref_node);
    }
  }
  function linkNode(node, container, ref_node) {
    patchOutsideElementAccessors(node);
    ref_node = ref_node || null;
    node.__shady = node.__shady || {};
    container.__shady = container.__shady || {};
    if (ref_node) {
      ref_node.__shady = ref_node.__shady || {};
    }
    node.__shady.previousSibling = ref_node ? ref_node.__shady.previousSibling : container.lastChild;
    var ps = node.__shady.previousSibling;
    if (ps && ps.__shady) {
      ps.__shady.nextSibling = node;
    }
    var ns = node.__shady.nextSibling = ref_node;
    if (ns && ns.__shady) {
      ns.__shady.previousSibling = node;
    }
    node.__shady.parentNode = container;
    if (ref_node) {
      if (ref_node === container.__shady.firstChild) {
        container.__shady.firstChild = node;
      }
    } else {
      container.__shady.lastChild = node;
      if (!container.__shady.firstChild) {
        container.__shady.firstChild = node;
      }
    }
    container.__shady.childNodes = null;
  }
  function recordRemoveChild(node, container) {
    node.__shady = node.__shady || {};
    container.__shady = container.__shady || {};
    if (node === container.__shady.firstChild) {
      container.__shady.firstChild = node.__shady.nextSibling;
    }
    if (node === container.__shady.lastChild) {
      container.__shady.lastChild = node.__shady.previousSibling;
    }
    var p = node.__shady.previousSibling;
    var n = node.__shady.nextSibling;
    if (p) {
      p.__shady = p.__shady || {};
      p.__shady.nextSibling = n;
    }
    if (n) {
      n.__shady = n.__shady || {};
      n.__shady.previousSibling = p;
    }
    node.__shady.parentNode = node.__shady.previousSibling = node.__shady.nextSibling = undefined;
    if (container.__shady.childNodes !== undefined) {
      container.__shady.childNodes = null;
    }
  }
  var recordChildNodes = function(node) {
    if (!node.__shady || node.__shady.firstChild === undefined) {
      node.__shady = node.__shady || {};
      node.__shady.firstChild = firstChild(node);
      node.__shady.lastChild = lastChild(node);
      patchInsideElementAccessors(node);
      var c$ = node.__shady.childNodes = childNodes(node);
      for (var i = 0, n;i < c$.length && (n = c$[i]);i++) {
        n.__shady = n.__shady || {};
        n.__shady.parentNode = node;
        n.__shady.nextSibling = c$[i + 1] || null;
        n.__shady.previousSibling = c$[i - 1] || null;
        patchOutsideElementAccessors(n);
      }
    }
  };
  function insertBefore$1(parent, node, ref_node) {
    if (node === parent) {
      throw Error("Failed to execute 'appendChild' on 'Node': The new child element contains the parent.");
    }
    if (ref_node) {
      var p$13 = ref_node.__shady && ref_node.__shady.parentNode;
      if (p$13 !== undefined && p$13 !== parent || p$13 === undefined && parentNode(ref_node) !== parent) {
        throw Error("Failed to execute 'insertBefore' on 'Node': The node " + "before which the new node is to be inserted is not a child of this node.");
      }
    }
    if (ref_node === node) {
      return node;
    }
    if (node.parentNode) {
      removeChild$1(node.parentNode, node);
    }
    var preventNativeInsert;
    var ownerRoot = ownerShadyRootForNode(parent);
    var slotsAdded = ownerRoot && findContainedSlots(node);
    if (ownerRoot && (parent.localName === "slot" || slotsAdded)) {
      ownerRoot._asyncRender();
    }
    if (isTrackingLogicalChildNodes(parent)) {
      recordInsertBefore(node, parent, ref_node);
      if (hasShadowRootWithSlot(parent)) {
        parent.__shady.root._asyncRender();
        preventNativeInsert = true;
      } else {
        if (parent.__shady.root) {
          preventNativeInsert = true;
        }
      }
    }
    if (!preventNativeInsert) {
      var container = isShadyRoot(parent) ? (parent).host : parent;
      if (ref_node) {
        ref_node = firstComposedNode(ref_node);
        insertBefore.call(container, node, ref_node);
      } else {
        appendChild.call(container, node);
      }
    }
    scheduleObserver(parent, node);
    if (slotsAdded) {
      ownerRoot._addSlots(slotsAdded);
    }
    return node;
  }
  function findContainedSlots(node) {
    if (!node["__noInsertionPoint"]) {
      var slots;
      if (node.localName === "slot") {
        slots = [node];
      } else {
        if (node.querySelectorAll) {
          slots = node.querySelectorAll("slot");
        }
      }
      if (slots && slots.length) {
        return slots;
      }
    }
  }
  function removeChild$1(parent, node) {
    if (node.parentNode !== parent) {
      throw Error("The node to be removed is not a child of this node: " + node);
    }
    var preventNativeRemove;
    var ownerRoot = ownerShadyRootForNode(node);
    var removingInsertionPoint;
    if (isTrackingLogicalChildNodes(parent)) {
      recordRemoveChild(node, parent);
      if (hasShadowRootWithSlot(parent)) {
        parent.__shady.root._asyncRender();
        preventNativeRemove = true;
      }
    }
    removeOwnerShadyRoot(node);
    if (ownerRoot) {
      var changeSlotContent = parent && parent.localName === "slot";
      if (changeSlotContent) {
        preventNativeRemove = true;
      }
      removingInsertionPoint = ownerRoot._removeContainedSlots(node);
      if (removingInsertionPoint || changeSlotContent) {
        ownerRoot._asyncRender();
      }
    }
    if (!preventNativeRemove) {
      var container = isShadyRoot(parent) ? (parent).host : parent;
      if (!(parent.__shady.root || node.localName === "slot") || container === parentNode(node)) {
        removeChild.call(container, node);
      }
    }
    scheduleObserver(parent, null, node);
    return node;
  }
  function removeOwnerShadyRoot(node) {
    if (hasCachedOwnerRoot(node)) {
      var c$ = node.childNodes;
      for (var i = 0, l = c$.length, n;i < l && (n = c$[i]);i++) {
        removeOwnerShadyRoot(n);
      }
    }
    if (node.__shady) {
      node.__shady.ownerShadyRoot = undefined;
    }
  }
  function hasCachedOwnerRoot(node) {
    return Boolean(node.__shady && node.__shady.ownerShadyRoot !== undefined);
  }
  function firstComposedNode(node) {
    var composed = node;
    if (node && node.localName === "slot") {
      var flattened = node.__shady.flattenedNodes;
      composed = flattened && flattened.length ? flattened[0] : firstComposedNode(node.nextSibling);
    }
    return composed;
  }
  function hasShadowRootWithSlot(node) {
    var root = node && node.__shady && node.__shady.root;
    return root && root._hasInsertionPoint();
  }
  function distributeAttributeChange(node, name) {
    if (name === "slot") {
      var parent = node.parentNode;
      if (hasShadowRootWithSlot(parent)) {
        parent.__shady.root._asyncRender();
      }
    } else {
      if (node.localName === "slot" && name === "name") {
        var root = ownerShadyRootForNode(node);
        if (root) {
          root._updateSlotName(node);
          root._asyncRender();
        }
      }
    }
  }
  function scheduleObserver(node, addedNode, removedNode) {
    var observer = node.__shady && node.__shady.observer;
    if (observer) {
      if (addedNode) {
        observer.addedNodes.push(addedNode);
      }
      if (removedNode) {
        observer.removedNodes.push(removedNode);
      }
      observer.schedule();
    }
  }
  function getRootNode(node, options) {
    if (!node || !node.nodeType) {
      return;
    }
    node.__shady = node.__shady || {};
    var root = node.__shady.ownerShadyRoot;
    if (root === undefined) {
      if (isShadyRoot(node)) {
        root = node;
      } else {
        var parent = node.parentNode;
        root = parent ? getRootNode(parent) : node;
      }
      if (document.documentElement.contains(node)) {
        node.__shady.ownerShadyRoot = root;
      }
    }
    return root;
  }
  function query(node, matcher, halter) {
    var list = [];
    queryElements(node.childNodes, matcher, halter, list);
    return list;
  }
  function queryElements(elements, matcher, halter, list) {
    for (var i = 0, l = elements.length, c;i < l && (c = elements[i]);i++) {
      if (c.nodeType === Node.ELEMENT_NODE && queryElement(c, matcher, halter, list)) {
        return true;
      }
    }
  }
  function queryElement(node, matcher, halter, list) {
    var result = matcher(node);
    if (result) {
      list.push(node);
    }
    if (halter && halter(result)) {
      return result;
    }
    queryElements(node.childNodes, matcher, halter, list);
  }
  function renderRootNode(element) {
    var root = element.getRootNode();
    if (isShadyRoot(root)) {
      root._render();
    }
  }
  var scopingShim = null;
  function setAttribute$1(node, attr, value) {
    if (!scopingShim) {
      scopingShim = window["ShadyCSS"] && window["ShadyCSS"]["ScopingShim"];
    }
    if (scopingShim && attr === "class") {
      scopingShim["setElementClass"](node, value);
    } else {
      setAttribute.call(node, attr, value);
      distributeAttributeChange(node, attr);
    }
  }
  function removeAttribute$1(node, attr) {
    removeAttribute.call(node, attr);
    distributeAttributeChange(node, attr);
  }
  function cloneNode$1(node, deep) {
    if (node.localName == "template") {
      return cloneNode.call(node, deep);
    } else {
      var n = cloneNode.call(node, false);
      if (deep) {
        var c$ = node.childNodes;
        for (var i = 0, nc;i < c$.length;i++) {
          nc = c$[i].cloneNode(true);
          n.appendChild(nc);
        }
      }
      return n;
    }
  }
  function importNode$1(node, deep) {
    if (node.ownerDocument !== document) {
      return importNode.call(document, node, deep);
    }
    var n = importNode.call(document, node, false);
    if (deep) {
      var c$ = node.childNodes;
      for (var i = 0, nc;i < c$.length;i++) {
        nc = importNode$1(c$[i], true);
        n.appendChild(nc);
      }
    }
    return n;
  }
  var alwaysComposed = {"blur":true, "focus":true, "focusin":true, "focusout":true, "click":true, "dblclick":true, "mousedown":true, "mouseenter":true, "mouseleave":true, "mousemove":true, "mouseout":true, "mouseover":true, "mouseup":true, "wheel":true, "beforeinput":true, "input":true, "keydown":true, "keyup":true, "compositionstart":true, "compositionupdate":true, "compositionend":true, "touchstart":true, "touchend":true, "touchmove":true, "touchcancel":true, "pointerover":true, "pointerenter":true, 
  "pointerdown":true, "pointermove":true, "pointerup":true, "pointercancel":true, "pointerout":true, "pointerleave":true, "gotpointercapture":true, "lostpointercapture":true, "dragstart":true, "drag":true, "dragenter":true, "dragleave":true, "dragover":true, "drop":true, "dragend":true, "DOMActivate":true, "DOMFocusIn":true, "DOMFocusOut":true, "keypress":true};
  function pathComposer(startNode, composed) {
    var composedPath = [];
    var current = startNode;
    var startRoot = startNode === window ? window : startNode.getRootNode();
    while (current) {
      composedPath.push(current);
      if (current.assignedSlot) {
        current = current.assignedSlot;
      } else {
        if (current.nodeType === Node.DOCUMENT_FRAGMENT_NODE && current.host && (composed || current !== startRoot)) {
          current = current.host;
        } else {
          current = current.parentNode;
        }
      }
    }
    if (composedPath[composedPath.length - 1] === document) {
      composedPath.push(window);
    }
    return composedPath;
  }
  function retarget(refNode, path) {
    if (!isShadyRoot) {
      return refNode;
    }
    var refNodePath = pathComposer(refNode, true);
    var p$ = path;
    for (var i = 0, ancestor, lastRoot, root, rootIdx;i < p$.length;i++) {
      ancestor = p$[i];
      root = ancestor === window ? window : ancestor.getRootNode();
      if (root !== lastRoot) {
        rootIdx = refNodePath.indexOf(root);
        lastRoot = root;
      }
      if (!isShadyRoot(root) || rootIdx > -1) {
        return ancestor;
      }
    }
  }
  var eventMixin = {get composed() {
    if (this.isTrusted !== false && this.__composed === undefined) {
      this.__composed = alwaysComposed[this.type];
    }
    return this.__composed || false;
  }, composedPath:function() {
    if (!this.__composedPath) {
      this.__composedPath = pathComposer(this["__target"], this.composed);
    }
    return this.__composedPath;
  }, get target() {
    return retarget(this.currentTarget, this.composedPath());
  }, get relatedTarget() {
    if (!this.__relatedTarget) {
      return null;
    }
    if (!this.__relatedTargetComposedPath) {
      this.__relatedTargetComposedPath = pathComposer(this.__relatedTarget, true);
    }
    return retarget(this.currentTarget, this.__relatedTargetComposedPath);
  }, stopPropagation:function() {
    Event.prototype.stopPropagation.call(this);
    this.__propagationStopped = true;
  }, stopImmediatePropagation:function() {
    Event.prototype.stopImmediatePropagation.call(this);
    this.__immediatePropagationStopped = true;
    this.__propagationStopped = true;
  }};
  function mixinComposedFlag(Base) {
    var klazz = function(type, options) {
      var event = new Base(type, options);
      event.__composed = options && Boolean(options["composed"]);
      return event;
    };
    mixin(klazz, Base);
    klazz.prototype = Base.prototype;
    return klazz;
  }
  var nonBubblingEventsToRetarget = {"focus":true, "blur":true};
  function fireHandlers(event, node, phase) {
    var hs = node.__handlers && node.__handlers[event.type] && node.__handlers[event.type][phase];
    if (hs) {
      for (var i = 0, fn;fn = hs[i];i++) {
        if (event.target === event.relatedTarget) {
          return;
        }
        fn.call(node, event);
        if (event.__immediatePropagationStopped) {
          return;
        }
      }
    }
  }
  function retargetNonBubblingEvent(e) {
    var path = e.composedPath();
    var node;
    Object.defineProperty(e, "currentTarget", {get:function() {
      return node;
    }, configurable:true});
    for (var i = path.length - 1;i >= 0;i--) {
      node = path[i];
      fireHandlers(e, node, "capture");
      if (e.__propagationStopped) {
        return;
      }
    }
    Object.defineProperty(e, "eventPhase", {get:function() {
      return Event.AT_TARGET;
    }});
    var lastFiredRoot;
    for (var i$14 = 0;i$14 < path.length;i$14++) {
      node = path[i$14];
      var root = node.__shady && node.__shady.root;
      if (i$14 === 0 || root && root === lastFiredRoot) {
        fireHandlers(e, node, "bubble");
        if (node !== window) {
          lastFiredRoot = node.getRootNode();
        }
        if (e.__propagationStopped) {
          return;
        }
      }
    }
  }
  function listenerSettingsEqual(savedListener, node, type, capture, once, passive) {
    var $jscomp$destructuring$var0 = savedListener;
    var savedNode = $jscomp$destructuring$var0.node;
    var savedType = $jscomp$destructuring$var0.type;
    var savedCapture = $jscomp$destructuring$var0.capture;
    var savedOnce = $jscomp$destructuring$var0.once;
    var savedPassive = $jscomp$destructuring$var0.passive;
    return node === savedNode && type === savedType && capture === savedCapture && once === savedOnce && passive === savedPassive;
  }
  function findListener(wrappers, node, type, capture, once, passive) {
    for (var i = 0;i < wrappers.length;i++) {
      if (listenerSettingsEqual(wrappers[i], node, type, capture, once, passive)) {
        return i;
      }
    }
    return -1;
  }
  function getEventWrappers(eventLike) {
    var wrappers = null;
    try {
      wrappers = eventLike.__eventWrappers;
    } catch (e) {
    }
    return wrappers;
  }
  function addEventListener$1(type, fnOrObj, optionsOrCapture) {
    if (!fnOrObj) {
      return;
    }
    var capture, once, passive;
    if (typeof optionsOrCapture === "object") {
      capture = Boolean(optionsOrCapture.capture);
      once = Boolean(optionsOrCapture.once);
      passive = Boolean(optionsOrCapture.passive);
    } else {
      capture = Boolean(optionsOrCapture);
      once = false;
      passive = false;
    }
    var target = optionsOrCapture && optionsOrCapture.__shadyTarget || this;
    var wrappers = fnOrObj.__eventWrappers;
    if (wrappers) {
      if (findListener(wrappers, target, type, capture, once, passive) > -1) {
        return;
      }
    } else {
      fnOrObj.__eventWrappers = [];
    }
    var wrapperFn = function(e) {
      if (once) {
        this.removeEventListener(type, fnOrObj, optionsOrCapture);
      }
      if (!e["__target"]) {
        patchEvent(e);
      }
      var lastCurrentTargetDesc;
      if (target !== this) {
        lastCurrentTargetDesc = Object.getOwnPropertyDescriptor(e, "currentTarget");
        Object.defineProperty(e, "currentTarget", {get:function() {
          return target;
        }, configurable:true});
      }
      if (e.composed || e.composedPath().indexOf(target) > -1) {
        if (e.target === e.relatedTarget) {
          if (e.eventPhase === Event.BUBBLING_PHASE) {
            e.stopImmediatePropagation();
          }
          return;
        }
        if (e.eventPhase !== Event.CAPTURING_PHASE && !e.bubbles && e.target !== target) {
          return;
        }
        var ret = typeof fnOrObj === "object" && fnOrObj.handleEvent ? fnOrObj.handleEvent(e) : fnOrObj.call(target, e);
        if (target !== this) {
          if (lastCurrentTargetDesc) {
            Object.defineProperty(e, "currentTarget", lastCurrentTargetDesc);
            lastCurrentTargetDesc = null;
          } else {
            delete e["currentTarget"];
          }
        }
        return ret;
      }
    };
    fnOrObj.__eventWrappers.push({node:this, type:type, capture:capture, once:once, passive:passive, wrapperFn:wrapperFn});
    if (nonBubblingEventsToRetarget[type]) {
      this.__handlers = this.__handlers || {};
      this.__handlers[type] = this.__handlers[type] || {"capture":[], "bubble":[]};
      this.__handlers[type][capture ? "capture" : "bubble"].push(wrapperFn);
    } else {
      var ael = this instanceof Window ? windowAddEventListener : addEventListener;
      ael.call(this, type, wrapperFn, optionsOrCapture);
    }
  }
  function removeEventListener$1(type, fnOrObj, optionsOrCapture) {
    if (!fnOrObj) {
      return;
    }
    var capture, once, passive;
    if (typeof optionsOrCapture === "object") {
      capture = Boolean(optionsOrCapture.capture);
      once = Boolean(optionsOrCapture.once);
      passive = Boolean(optionsOrCapture.passive);
    } else {
      capture = Boolean(optionsOrCapture);
      once = false;
      passive = false;
    }
    var target = optionsOrCapture && optionsOrCapture.__shadyTarget || this;
    var wrapperFn = undefined;
    var wrappers = getEventWrappers(fnOrObj);
    if (wrappers) {
      var idx = findListener(wrappers, target, type, capture, once, passive);
      if (idx > -1) {
        wrapperFn = wrappers.splice(idx, 1)[0].wrapperFn;
        if (!wrappers.length) {
          fnOrObj.__eventWrappers = undefined;
        }
      }
    }
    var rel = this instanceof Window ? windowRemoveEventListener : removeEventListener;
    rel.call(this, type, wrapperFn || fnOrObj, optionsOrCapture);
    if (wrapperFn && nonBubblingEventsToRetarget[type] && this.__handlers && this.__handlers[type]) {
      var arr = this.__handlers[type][capture ? "capture" : "bubble"];
      var idx$15 = arr.indexOf(wrapperFn);
      if (idx$15 > -1) {
        arr.splice(idx$15, 1);
      }
    }
  }
  function activateFocusEventOverrides() {
    for (var ev in nonBubblingEventsToRetarget) {
      window.addEventListener(ev, function(e) {
        if (!e["__target"]) {
          patchEvent(e);
          retargetNonBubblingEvent(e);
        }
      }, true);
    }
  }
  function patchEvent(event) {
    event["__target"] = event.target;
    event.__relatedTarget = event.relatedTarget;
    if (settings.hasDescriptors) {
      patchPrototype(event, eventMixin);
    } else {
      extend(event, eventMixin);
    }
  }
  var PatchedEvent = mixinComposedFlag(window.Event);
  var PatchedCustomEvent = mixinComposedFlag(window.CustomEvent);
  var PatchedMouseEvent = mixinComposedFlag(window.MouseEvent);
  function patchEvents() {
    window.Event = PatchedEvent;
    window.CustomEvent = PatchedCustomEvent;
    window.MouseEvent = PatchedMouseEvent;
    activateFocusEventOverrides();
  }
  function newSplice(index, removed, addedCount) {
    return {index:index, removed:removed, addedCount:addedCount};
  }
  var EDIT_LEAVE = 0;
  var EDIT_UPDATE = 1;
  var EDIT_ADD = 2;
  var EDIT_DELETE = 3;
  function calcEditDistances(current, currentStart, currentEnd, old, oldStart, oldEnd) {
    var rowCount = oldEnd - oldStart + 1;
    var columnCount = currentEnd - currentStart + 1;
    var distances = new Array(rowCount);
    for (var i = 0;i < rowCount;i++) {
      distances[i] = new Array(columnCount);
      distances[i][0] = i;
    }
    for (var j = 0;j < columnCount;j++) {
      distances[0][j] = j;
    }
    for (var i$16 = 1;i$16 < rowCount;i$16++) {
      for (var j$17 = 1;j$17 < columnCount;j$17++) {
        if (equals(current[currentStart + j$17 - 1], old[oldStart + i$16 - 1])) {
          distances[i$16][j$17] = distances[i$16 - 1][j$17 - 1];
        } else {
          var north = distances[i$16 - 1][j$17] + 1;
          var west = distances[i$16][j$17 - 1] + 1;
          distances[i$16][j$17] = north < west ? north : west;
        }
      }
    }
    return distances;
  }
  function spliceOperationsFromEditDistances(distances) {
    var i = distances.length - 1;
    var j = distances[0].length - 1;
    var current = distances[i][j];
    var edits = [];
    while (i > 0 || j > 0) {
      if (i == 0) {
        edits.push(EDIT_ADD);
        j--;
        continue;
      }
      if (j == 0) {
        edits.push(EDIT_DELETE);
        i--;
        continue;
      }
      var northWest = distances[i - 1][j - 1];
      var west = distances[i - 1][j];
      var north = distances[i][j - 1];
      var min = undefined;
      if (west < north) {
        min = west < northWest ? west : northWest;
      } else {
        min = north < northWest ? north : northWest;
      }
      if (min == northWest) {
        if (northWest == current) {
          edits.push(EDIT_LEAVE);
        } else {
          edits.push(EDIT_UPDATE);
          current = northWest;
        }
        i--;
        j--;
      } else {
        if (min == west) {
          edits.push(EDIT_DELETE);
          i--;
          current = west;
        } else {
          edits.push(EDIT_ADD);
          j--;
          current = north;
        }
      }
    }
    edits.reverse();
    return edits;
  }
  function calcSplices(current, currentStart, currentEnd, old, oldStart, oldEnd) {
    var prefixCount = 0;
    var suffixCount = 0;
    var splice;
    var minLength = Math.min(currentEnd - currentStart, oldEnd - oldStart);
    if (currentStart == 0 && oldStart == 0) {
      prefixCount = sharedPrefix(current, old, minLength);
    }
    if (currentEnd == current.length && oldEnd == old.length) {
      suffixCount = sharedSuffix(current, old, minLength - prefixCount);
    }
    currentStart += prefixCount;
    oldStart += prefixCount;
    currentEnd -= suffixCount;
    oldEnd -= suffixCount;
    if (currentEnd - currentStart == 0 && oldEnd - oldStart == 0) {
      return [];
    }
    if (currentStart == currentEnd) {
      splice = newSplice(currentStart, [], 0);
      while (oldStart < oldEnd) {
        splice.removed.push(old[oldStart++]);
      }
      return [splice];
    } else {
      if (oldStart == oldEnd) {
        return [newSplice(currentStart, [], currentEnd - currentStart)];
      }
    }
    var ops = spliceOperationsFromEditDistances(calcEditDistances(current, currentStart, currentEnd, old, oldStart, oldEnd));
    splice = undefined;
    var splices = [];
    var index = currentStart;
    var oldIndex = oldStart;
    for (var i = 0;i < ops.length;i++) {
      switch(ops[i]) {
        case EDIT_LEAVE:
          if (splice) {
            splices.push(splice);
            splice = undefined;
          }
          index++;
          oldIndex++;
          break;
        case EDIT_UPDATE:
          if (!splice) {
            splice = newSplice(index, [], 0);
          }
          splice.addedCount++;
          index++;
          splice.removed.push(old[oldIndex]);
          oldIndex++;
          break;
        case EDIT_ADD:
          if (!splice) {
            splice = newSplice(index, [], 0);
          }
          splice.addedCount++;
          index++;
          break;
        case EDIT_DELETE:
          if (!splice) {
            splice = newSplice(index, [], 0);
          }
          splice.removed.push(old[oldIndex]);
          oldIndex++;
          break;
      }
    }
    if (splice) {
      splices.push(splice);
    }
    return splices;
  }
  function sharedPrefix(current, old, searchLength) {
    for (var i = 0;i < searchLength;i++) {
      if (!equals(current[i], old[i])) {
        return i;
      }
    }
    return searchLength;
  }
  function sharedSuffix(current, old, searchLength) {
    var index1 = current.length;
    var index2 = old.length;
    var count = 0;
    while (count < searchLength && equals(current[--index1], old[--index2])) {
      count++;
    }
    return count;
  }
  function equals(currentValue, previousValue) {
    return currentValue === previousValue;
  }
  function calculateSplices(current, previous) {
    return calcSplices(current, 0, current.length, previous, 0, previous.length);
  }
  var ShadyRootConstructionToken = {};
  var CATCHALL_NAME = "__catchall";
  var ShadyRoot = function(token, host, options) {
    if (token !== ShadyRootConstructionToken) {
      throw new TypeError("Illegal constructor");
    }
    var shadowRoot = document.createDocumentFragment();
    shadowRoot.__proto__ = ShadyRoot.prototype;
    (shadowRoot)._init(host, options);
    return shadowRoot;
  };
  ShadyRoot.prototype = Object.create(DocumentFragment.prototype);
  ShadyRoot.prototype._init = function(host, options) {
    this.__localName = "ShadyRoot";
    recordChildNodes(host);
    recordChildNodes(this);
    this.host = host;
    this._mode = options && options.mode;
    host.__shady = host.__shady || {};
    host.__shady.root = this;
    host.__shady.publicRoot = this._mode !== "closed" ? this : null;
    this._renderPending = false;
    this._hasRendered = false;
    this._slotList = [];
    this._slotMap = null;
    var c$ = childNodes(host);
    for (var i = 0, l = c$.length;i < l;i++) {
      removeChild.call(host, c$[i]);
    }
  };
  ShadyRoot.prototype._asyncRender = function() {
    var $jscomp$this = this;
    if (!this._renderPending) {
      this._renderPending = true;
      enqueue(function() {
        return $jscomp$this._render();
      });
    }
  };
  ShadyRoot.prototype._getRenderRoot = function() {
    var renderRoot = this;
    var root = this;
    while (root) {
      if (root._renderPending) {
        renderRoot = root;
      }
      root = root._rendererForHost();
    }
    return renderRoot;
  };
  ShadyRoot.prototype._rendererForHost = function() {
    var root = this.host.getRootNode();
    if (isShadyRoot(root)) {
      var c$ = this.host.childNodes;
      for (var i = 0, c;i < c$.length;i++) {
        c = c$[i];
        if (this._isInsertionPoint(c)) {
          return root;
        }
      }
    }
  };
  ShadyRoot.prototype._render = function() {
    if (this._renderPending) {
      this._getRenderRoot()["_renderRoot"]();
    }
  };
  ShadyRoot.prototype["_renderRoot"] = function() {
    this._renderPending = false;
    this._distribute();
    this._compose();
    this._hasRendered = true;
  };
  ShadyRoot.prototype._distribute = function() {
    for (var i = 0, slot;i < this._slotList.length;i++) {
      slot = this._slotList[i];
      this._clearSlotAssignedNodes(slot);
    }
    for (var n = this.host.firstChild;n;n = n.nextSibling) {
      this._distributeNodeToSlot(n);
    }
    for (var i$18 = 0, slot;i$18 < this._slotList.length;i$18++) {
      slot = this._slotList[i$18];
      if (!slot.__shady.assignedNodes.length) {
        for (var n$19 = slot.firstChild;n$19;n$19 = n$19.nextSibling) {
          this._distributeNodeToSlot(n$19, slot);
        }
      }
      var slotParent = slot.parentNode;
      var slotParentRoot = slotParent.__shady && slotParent.__shady.root;
      if (slotParentRoot && slotParentRoot._hasInsertionPoint()) {
        slotParentRoot["_renderRoot"]();
      }
      this._addAssignedToFlattenedNodes(slot.__shady.flattenedNodes, slot.__shady.assignedNodes);
      var prevAssignedNodes = slot.__shady._previouslyAssignedNodes;
      if (prevAssignedNodes) {
        for (var i$20 = 0;i$20 < prevAssignedNodes.length;i$20++) {
          prevAssignedNodes[i$20].__shady._prevAssignedSlot = null;
        }
        slot.__shady._previouslyAssignedNodes = null;
        if (prevAssignedNodes.length > slot.__shady.assignedNodes.length) {
          slot.__shady.dirty = true;
        }
      }
      if (slot.__shady.dirty) {
        slot.__shady.dirty = false;
        this._fireSlotChange(slot);
      }
    }
  };
  ShadyRoot.prototype._distributeNodeToSlot = function(node, forcedSlot) {
    node.__shady = node.__shady || {};
    var oldSlot = node.__shady._prevAssignedSlot;
    node.__shady._prevAssignedSlot = null;
    var slot = forcedSlot;
    if (!slot) {
      var name = node.slot || CATCHALL_NAME;
      var list = this._slotMap[name];
      slot = list && list[0];
    }
    if (slot) {
      slot.__shady.assignedNodes.push(node);
      node.__shady.assignedSlot = slot;
    } else {
      node.__shady.assignedSlot = undefined;
    }
    if (oldSlot !== node.__shady.assignedSlot) {
      if (node.__shady.assignedSlot) {
        node.__shady.assignedSlot.__shady.dirty = true;
      }
    }
  };
  ShadyRoot.prototype._clearSlotAssignedNodes = function(slot) {
    var n$ = slot.__shady.assignedNodes;
    slot.__shady.assignedNodes = [];
    slot.__shady.flattenedNodes = [];
    slot.__shady._previouslyAssignedNodes = n$;
    if (n$) {
      for (var i = 0;i < n$.length;i++) {
        var n = n$[i];
        n.__shady._prevAssignedSlot = n.__shady.assignedSlot;
        if (n.__shady.assignedSlot === slot) {
          n.__shady.assignedSlot = null;
        }
      }
    }
  };
  ShadyRoot.prototype._addAssignedToFlattenedNodes = function(flattened, asssigned) {
    for (var i = 0, n;i < asssigned.length && (n = asssigned[i]);i++) {
      if (n.localName == "slot") {
        this._addAssignedToFlattenedNodes(flattened, n.__shady.assignedNodes);
      } else {
        flattened.push(asssigned[i]);
      }
    }
  };
  ShadyRoot.prototype._fireSlotChange = function(slot) {
    dispatchEvent.call(slot, new Event("slotchange"));
    if (slot.__shady.assignedSlot) {
      this._fireSlotChange(slot.__shady.assignedSlot);
    }
  };
  ShadyRoot.prototype._compose = function() {
    var slots = this._slotList;
    var composeList = [];
    for (var i = 0;i < slots.length;i++) {
      var parent = slots[i].parentNode;
      if (!(parent.__shady && parent.__shady.root) && composeList.indexOf(parent) < 0) {
        composeList.push(parent);
      }
    }
    for (var i$21 = 0;i$21 < composeList.length;i$21++) {
      var node = composeList[i$21];
      var targetNode = node === this ? this.host : node;
      this._updateChildNodes(targetNode, this._composeNode(node));
    }
  };
  ShadyRoot.prototype._composeNode = function(node) {
    var children$$1 = [];
    var c$ = node.childNodes;
    for (var i = 0;i < c$.length;i++) {
      var child = c$[i];
      if (this._isInsertionPoint(child)) {
        var flattenedNodes = child.__shady.flattenedNodes;
        for (var j = 0;j < flattenedNodes.length;j++) {
          var distributedNode = flattenedNodes[j];
          children$$1.push(distributedNode);
        }
      } else {
        children$$1.push(child);
      }
    }
    return children$$1;
  };
  ShadyRoot.prototype._isInsertionPoint = function(node) {
    return node.localName == "slot";
  };
  ShadyRoot.prototype._updateChildNodes = function(container, children$$1) {
    var composed = childNodes(container);
    var splices = calculateSplices(children$$1, composed);
    for (var i = 0, d = 0, s;i < splices.length && (s = splices[i]);i++) {
      for (var j = 0, n;j < s.removed.length && (n = s.removed[j]);j++) {
        if (parentNode(n) === container) {
          removeChild.call(container, n);
        }
        composed.splice(s.index + d, 1);
      }
      d -= s.addedCount;
    }
    for (var i$22 = 0, s, next;i$22 < splices.length && (s = splices[i$22]);i$22++) {
      next = composed[s.index];
      for (var j$23 = s.index, n;j$23 < s.index + s.addedCount;j$23++) {
        n = children$$1[j$23];
        insertBefore.call(container, n, next);
        composed.splice(j$23, 0, n);
      }
    }
  };
  ShadyRoot.prototype._addSlots = function(slots) {
    var slotNamesToSort;
    this._slotMap = this._slotMap || {};
    this._slotList = this._slotList || [];
    for (var i = 0;i < slots.length;i++) {
      var slot = slots[i];
      slot.__shady = slot.__shady || {};
      recordChildNodes(slot);
      recordChildNodes(slot.parentNode);
      var name = this._nameForSlot(slot);
      if (this._slotMap[name]) {
        slotNamesToSort = slotNamesToSort || {};
        slotNamesToSort[name] = true;
        this._slotMap[name].push(slot);
      } else {
        this._slotMap[name] = [slot];
      }
      this._slotList.push(slot);
    }
    if (slotNamesToSort) {
      for (var n in slotNamesToSort) {
        this._slotMap[n] = this._sortSlots(this._slotMap[n]);
      }
    }
  };
  ShadyRoot.prototype._nameForSlot = function(slot) {
    var name = slot["name"] || slot.getAttribute("name") || CATCHALL_NAME;
    slot.__slotName = name;
    return name;
  };
  ShadyRoot.prototype._sortSlots = function(slots) {
    return slots.sort(function(a, b) {
      var listA = ancestorList(a);
      var listB = ancestorList(b);
      for (var i = 0;i < listA.length;i++) {
        var nA = listA[i];
        var nB = listB[i];
        if (nA !== nB) {
          var c$ = Array.from(nA.parentNode.childNodes);
          return c$.indexOf(nA) - c$.indexOf(nB);
        }
      }
    });
  };
  function ancestorList(node) {
    var ancestors = [];
    do {
      ancestors.unshift(node);
    } while (node = node.parentNode);
    return ancestors;
  }
  function contains(container, node) {
    while (node) {
      if (node == container) {
        return true;
      }
      node = node.parentNode;
    }
  }
  ShadyRoot.prototype._removeContainedSlots = function(container) {
    var didRemove;
    this._slotMap = this._slotMap || {};
    this._slotList = this._slotList || [];
    var map = this._slotMap;
    for (var n in map) {
      var slots = map[n];
      for (var i = 0;i < slots.length;i++) {
        var slot = slots[i];
        if (contains(container, slot)) {
          slots.splice(i, 1);
          var x = this._slotList.indexOf(slot);
          if (x >= 0) {
            this._slotList.splice(x, 1);
          }
          i--;
          this._removeFlattenedNodes(slot);
          didRemove = true;
        }
      }
    }
    return didRemove;
  };
  ShadyRoot.prototype._updateSlotName = function(slot) {
    var oldName = slot.__slotName;
    var name = this._nameForSlot(slot);
    if (name === oldName) {
      return;
    }
    var slots = this._slotMap[oldName];
    var i = slots.indexOf(slot);
    if (i >= 0) {
      slots.splice(i, 1);
    }
    var list = this._slotMap[name] || (this._slotMap[name] = []);
    list.push(slot);
    if (list.length > 1) {
      this._slotMap[name] = this._sortSlots(list);
    }
  };
  ShadyRoot.prototype._removeFlattenedNodes = function(slot) {
    var n$ = slot.__shady.flattenedNodes;
    if (n$) {
      for (var i = 0;i < n$.length;i++) {
        var node = n$[i];
        var parent = parentNode(node);
        if (parent) {
          removeChild.call(parent, node);
        }
      }
    }
  };
  ShadyRoot.prototype._hasInsertionPoint = function() {
    return Boolean(this._slotList.length);
  };
  ShadyRoot.prototype.addEventListener = function(type, fn, optionsOrCapture) {
    if (typeof optionsOrCapture !== "object") {
      optionsOrCapture = {capture:Boolean(optionsOrCapture)};
    }
    optionsOrCapture.__shadyTarget = this;
    this.host.addEventListener(type, fn, optionsOrCapture);
  };
  ShadyRoot.prototype.removeEventListener = function(type, fn, optionsOrCapture) {
    if (typeof optionsOrCapture !== "object") {
      optionsOrCapture = {capture:Boolean(optionsOrCapture)};
    }
    optionsOrCapture.__shadyTarget = this;
    this.host.removeEventListener(type, fn, optionsOrCapture);
  };
  ShadyRoot.prototype.getElementById = function(id) {
    var result = query(this, function(n) {
      return n.id == id;
    }, function(n) {
      return Boolean(n);
    })[0];
    return result || null;
  };
  function attachShadow(host, options) {
    if (!host) {
      throw "Must provide a host.";
    }
    if (!options) {
      throw "Not enough arguments.";
    }
    return new ShadyRoot(ShadyRootConstructionToken, host, options);
  }
  patchShadowRootAccessors(ShadyRoot.prototype);
  function getAssignedSlot(node) {
    renderRootNode(node);
    return node.__shady && node.__shady.assignedSlot || null;
  }
  var windowMixin = {addEventListener:addEventListener$1.bind(window), removeEventListener:removeEventListener$1.bind(window)};
  var nodeMixin = {addEventListener:addEventListener$1, removeEventListener:removeEventListener$1, appendChild:function(node) {
    return insertBefore$1(this, node);
  }, insertBefore:function(node, ref_node) {
    return insertBefore$1(this, node, ref_node);
  }, removeChild:function(node) {
    return removeChild$1(this, node);
  }, replaceChild:function(node, ref_node) {
    insertBefore$1(this, node, ref_node);
    removeChild$1(this, ref_node);
    return node;
  }, cloneNode:function(deep) {
    return cloneNode$1(this, deep);
  }, getRootNode:function(options) {
    return getRootNode(this, options);
  }, get isConnected() {
    var ownerDocument = this.ownerDocument;
    if (ownerDocument && ownerDocument.contains && ownerDocument.contains(this)) {
      return true;
    }
    var ownerDocumentElement = ownerDocument.documentElement;
    if (ownerDocumentElement && ownerDocumentElement.contains && ownerDocumentElement.contains(this)) {
      return true;
    }
    var node = this;
    while (node && !(node instanceof Document)) {
      node = node.parentNode || (node instanceof ShadyRoot ? (node).host : undefined);
    }
    return !!(node && node instanceof Document);
  }, dispatchEvent:function(event) {
    flush();
    return dispatchEvent.call(this, event);
  }};
  var textMixin = {get assignedSlot() {
    return getAssignedSlot(this);
  }};
  var fragmentMixin = {querySelector:function(selector) {
    var result = query(this, function(n) {
      return matchesSelector(n, selector);
    }, function(n) {
      return Boolean(n);
    })[0];
    return result || null;
  }, querySelectorAll:function(selector) {
    return query(this, function(n) {
      return matchesSelector(n, selector);
    });
  }};
  var slotMixin = {assignedNodes:function(options) {
    if (this.localName === "slot") {
      renderRootNode(this);
      return this.__shady ? (options && options.flatten ? this.__shady.flattenedNodes : this.__shady.assignedNodes) || [] : [];
    }
  }};
  var elementMixin = extendAll({setAttribute:function(name, value) {
    setAttribute$1(this, name, value);
  }, removeAttribute:function(name) {
    removeAttribute$1(this, name);
  }, attachShadow:function(options) {
    return attachShadow(this, options);
  }, get slot() {
    return this.getAttribute("slot");
  }, set slot(value) {
    setAttribute$1(this, "slot", value);
  }, get assignedSlot() {
    return getAssignedSlot(this);
  }}, fragmentMixin, slotMixin);
  Object.defineProperties(elementMixin, ShadowRootAccessor);
  var documentMixin = extendAll({importNode:function(node, deep) {
    return importNode$1(node, deep);
  }, getElementById:function(id) {
    var result = query(this, function(n) {
      return n.id == id;
    }, function(n) {
      return Boolean(n);
    })[0];
    return result || null;
  }}, fragmentMixin);
  Object.defineProperties(documentMixin, {"_activeElement":ActiveElementAccessor.activeElement});
  var nativeBlur = HTMLElement.prototype.blur;
  var htmlElementMixin = extendAll({blur:function() {
    var root = this.__shady && this.__shady.root;
    var shadowActive = root && root.activeElement;
    if (shadowActive) {
      shadowActive.blur();
    } else {
      nativeBlur.call(this);
    }
  }});
  function patchBuiltin(proto, obj) {
    var n$ = Object.getOwnPropertyNames(obj);
    for (var i = 0;i < n$.length;i++) {
      var n = n$[i];
      var d = Object.getOwnPropertyDescriptor(obj, n);
      if (d.value) {
        proto[n] = d.value;
      } else {
        Object.defineProperty(proto, n, d);
      }
    }
  }
  function patchBuiltins() {
    var nativeHTMLElement = window["customElements"] && window["customElements"]["nativeHTMLElement"] || HTMLElement;
    patchBuiltin(window.Node.prototype, nodeMixin);
    patchBuiltin(window.Window.prototype, windowMixin);
    patchBuiltin(window.Text.prototype, textMixin);
    patchBuiltin(window.DocumentFragment.prototype, fragmentMixin);
    patchBuiltin(window.Element.prototype, elementMixin);
    patchBuiltin(window.Document.prototype, documentMixin);
    if (window.HTMLSlotElement) {
      patchBuiltin(window.HTMLSlotElement.prototype, slotMixin);
    }
    patchBuiltin(nativeHTMLElement.prototype, htmlElementMixin);
    if (settings.hasDescriptors) {
      patchAccessors(window.Node.prototype);
      patchAccessors(window.Text.prototype);
      patchAccessors(window.DocumentFragment.prototype);
      patchAccessors(window.Element.prototype);
      patchAccessors(nativeHTMLElement.prototype);
      patchAccessors(window.Document.prototype);
      if (window.HTMLSlotElement) {
        patchAccessors(window.HTMLSlotElement.prototype);
      }
    }
  }
  if (settings.inUse) {
    var ShadyDOM = {"inUse":settings.inUse, "patch":function(node) {
      return node;
    }, "isShadyRoot":isShadyRoot, "enqueue":enqueue, "flush":flush, "settings":settings, "filterMutations":filterMutations, "observeChildren":observeChildren, "unobserveChildren":unobserveChildren, "nativeMethods":nativeMethods, "nativeTree":nativeTree};
    window["ShadyDOM"] = ShadyDOM;
    patchEvents();
    patchBuiltins();
    window.ShadowRoot = ShadyRoot;
  }
  var reservedTagList = new Set(["annotation-xml", "color-profile", "font-face", "font-face-src", "font-face-uri", "font-face-format", "font-face-name", "missing-glyph"]);
  function isValidCustomElementName(localName) {
    var reserved = reservedTagList.has(localName);
    var validForm = /^[a-z][.0-9_a-z]*-[\-.0-9_a-z]*$/.test(localName);
    return !reserved && validForm;
  }
  function isConnected(node) {
    var nativeValue = node.isConnected;
    if (nativeValue !== undefined) {
      return nativeValue;
    }
    var current = node;
    while (current && !(current.__CE_isImportDocument || current instanceof Document)) {
      current = current.parentNode || (window.ShadowRoot && current instanceof ShadowRoot ? current.host : undefined);
    }
    return !!(current && (current.__CE_isImportDocument || current instanceof Document));
  }
  function nextSiblingOrAncestorSibling(root, start) {
    var node = start;
    while (node && node !== root && !node.nextSibling) {
      node = node.parentNode;
    }
    return !node || node === root ? null : node.nextSibling;
  }
  function nextNode(root, start) {
    return start.firstChild ? start.firstChild : nextSiblingOrAncestorSibling(root, start);
  }
  function walkDeepDescendantElements(root, callback, visitedImports) {
    visitedImports = visitedImports === undefined ? new Set : visitedImports;
    var node = root;
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        var element = (node);
        callback(element);
        var localName = element.localName;
        if (localName === "link" && element.getAttribute("rel") === "import") {
          var importNode$24 = (element.import);
          if (importNode$24 instanceof Node && !visitedImports.has(importNode$24)) {
            visitedImports.add(importNode$24);
            for (var child = importNode$24.firstChild;child;child = child.nextSibling) {
              walkDeepDescendantElements(child, callback, visitedImports);
            }
          }
          node = nextSiblingOrAncestorSibling(root, element);
          continue;
        } else {
          if (localName === "template") {
            node = nextSiblingOrAncestorSibling(root, element);
            continue;
          }
        }
        var shadowRoot = element.__CE_shadowRoot;
        if (shadowRoot) {
          for (var child$25 = shadowRoot.firstChild;child$25;child$25 = child$25.nextSibling) {
            walkDeepDescendantElements(child$25, callback, visitedImports);
          }
        }
      }
      node = nextNode(root, node);
    }
  }
  function setPropertyUnchecked(destination, name, value) {
    destination[name] = value;
  }
  var CustomElementState = {custom:1, failed:2};
  var CustomElementInternals = function() {
    this._localNameToDefinition = new Map;
    this._constructorToDefinition = new Map;
    this._patches = [];
    this._hasPatches = false;
  };
  CustomElementInternals.prototype.setDefinition = function(localName, definition) {
    this._localNameToDefinition.set(localName, definition);
    this._constructorToDefinition.set(definition.constructor, definition);
  };
  CustomElementInternals.prototype.localNameToDefinition = function(localName) {
    return this._localNameToDefinition.get(localName);
  };
  CustomElementInternals.prototype.constructorToDefinition = function(constructor) {
    return this._constructorToDefinition.get(constructor);
  };
  CustomElementInternals.prototype.addPatch = function(listener) {
    this._hasPatches = true;
    this._patches.push(listener);
  };
  CustomElementInternals.prototype.patchTree = function(node) {
    var $jscomp$this = this;
    if (!this._hasPatches) {
      return;
    }
    walkDeepDescendantElements(node, function(element) {
      return $jscomp$this.patch(element);
    });
  };
  CustomElementInternals.prototype.patch = function(node) {
    if (!this._hasPatches) {
      return;
    }
    if (node.__CE_patched) {
      return;
    }
    node.__CE_patched = true;
    for (var i = 0;i < this._patches.length;i++) {
      this._patches[i](node);
    }
  };
  CustomElementInternals.prototype.connectTree = function(root) {
    var elements = [];
    walkDeepDescendantElements(root, function(element) {
      return elements.push(element);
    });
    for (var i = 0;i < elements.length;i++) {
      var element = elements[i];
      if (element.__CE_state === CustomElementState.custom) {
        this.connectedCallback(element);
      } else {
        this.upgradeElement(element);
      }
    }
  };
  CustomElementInternals.prototype.disconnectTree = function(root) {
    var elements = [];
    walkDeepDescendantElements(root, function(element) {
      return elements.push(element);
    });
    for (var i = 0;i < elements.length;i++) {
      var element = elements[i];
      if (element.__CE_state === CustomElementState.custom) {
        this.disconnectedCallback(element);
      }
    }
  };
  CustomElementInternals.prototype.patchAndUpgradeTree = function(root, visitedImports) {
    visitedImports = visitedImports === undefined ? new Set : visitedImports;
    var $jscomp$this = this;
    var elements = [];
    var gatherElements = function(element) {
      if (element.localName === "link" && element.getAttribute("rel") === "import") {
        var importNode$26 = (element.import);
        if (importNode$26 instanceof Node && importNode$26.readyState === "complete") {
          importNode$26.__CE_isImportDocument = true;
          importNode$26.__CE_hasRegistry = true;
        } else {
          element.addEventListener("load", function() {
            var importNode = (element.import);
            if (importNode.__CE_documentLoadHandled) {
              return;
            }
            importNode.__CE_documentLoadHandled = true;
            importNode.__CE_isImportDocument = true;
            importNode.__CE_hasRegistry = true;
            var clonedVisitedImports = new Set(visitedImports);
            visitedImports.delete(importNode);
            $jscomp$this.patchAndUpgradeTree(importNode, visitedImports);
          });
        }
      } else {
        elements.push(element);
      }
    };
    walkDeepDescendantElements(root, gatherElements, visitedImports);
    if (this._hasPatches) {
      for (var i = 0;i < elements.length;i++) {
        this.patch(elements[i]);
      }
    }
    for (var i$27 = 0;i$27 < elements.length;i$27++) {
      this.upgradeElement(elements[i$27]);
    }
  };
  CustomElementInternals.prototype.upgradeElement = function(element) {
    var currentState = element.__CE_state;
    if (currentState !== undefined) {
      return;
    }
    var definition = this.localNameToDefinition(element.localName);
    if (!definition) {
      return;
    }
    definition.constructionStack.push(element);
    var constructor = definition.constructor;
    try {
      try {
        var result = new constructor;
        if (result !== element) {
          throw new Error("The custom element constructor did not produce the element being upgraded.");
        }
      } finally {
        definition.constructionStack.pop();
      }
    } catch (e) {
      element.__CE_state = CustomElementState.failed;
      throw e;
    }
    element.__CE_state = CustomElementState.custom;
    element.__CE_definition = definition;
    if (definition.attributeChangedCallback) {
      var observedAttributes = definition.observedAttributes;
      for (var i = 0;i < observedAttributes.length;i++) {
        var name = observedAttributes[i];
        var value = element.getAttribute(name);
        if (value !== null) {
          this.attributeChangedCallback(element, name, null, value, null);
        }
      }
    }
    if (isConnected(element)) {
      this.connectedCallback(element);
    }
  };
  CustomElementInternals.prototype.connectedCallback = function(element) {
    var definition = element.__CE_definition;
    if (definition.connectedCallback) {
      definition.connectedCallback.call(element);
    }
  };
  CustomElementInternals.prototype.disconnectedCallback = function(element) {
    var definition = element.__CE_definition;
    if (definition.disconnectedCallback) {
      definition.disconnectedCallback.call(element);
    }
  };
  CustomElementInternals.prototype.attributeChangedCallback = function(element, name, oldValue, newValue, namespace) {
    var definition = element.__CE_definition;
    if (definition.attributeChangedCallback && definition.observedAttributes.indexOf(name) > -1) {
      definition.attributeChangedCallback.call(element, name, oldValue, newValue, namespace);
    }
  };
  var DocumentConstructionObserver = function(internals, doc) {
    this._internals = internals;
    this._document = doc;
    this._observer = undefined;
    this._internals.patchAndUpgradeTree(this._document);
    if (this._document.readyState === "loading") {
      this._observer = new MutationObserver(this._handleMutations.bind(this));
      this._observer.observe(this._document, {childList:true, subtree:true});
    }
  };
  DocumentConstructionObserver.prototype.disconnect = function() {
    if (this._observer) {
      this._observer.disconnect();
    }
  };
  DocumentConstructionObserver.prototype._handleMutations = function(mutations) {
    var readyState = this._document.readyState;
    if (readyState === "interactive" || readyState === "complete") {
      this.disconnect();
    }
    for (var i = 0;i < mutations.length;i++) {
      var addedNodes = mutations[i].addedNodes;
      for (var j = 0;j < addedNodes.length;j++) {
        var node = addedNodes[j];
        this._internals.patchAndUpgradeTree(node);
      }
    }
  };
  var Deferred = function() {
    var $jscomp$this = this;
    this._value = undefined;
    this._resolve = undefined;
    this._promise = new Promise(function(resolve) {
      $jscomp$this._resolve = resolve;
      if ($jscomp$this._value) {
        resolve($jscomp$this._value);
      }
    });
  };
  Deferred.prototype.resolve = function(value) {
    if (this._value) {
      throw new Error("Already resolved.");
    }
    this._value = value;
    if (this._resolve) {
      this._resolve(value);
    }
  };
  Deferred.prototype.toPromise = function() {
    return this._promise;
  };
  var CustomElementRegistry = function(internals) {
    this._elementDefinitionIsRunning = false;
    this._internals = internals;
    this._whenDefinedDeferred = new Map;
    this._flushCallback = function(fn) {
      return fn();
    };
    this._flushPending = false;
    this._unflushedLocalNames = [];
    this._documentConstructionObserver = new DocumentConstructionObserver(internals, document);
  };
  CustomElementRegistry.prototype.define = function(localName, constructor) {
    var $jscomp$this = this;
    if (!(constructor instanceof Function)) {
      throw new TypeError("Custom element constructors must be functions.");
    }
    if (!isValidCustomElementName(localName)) {
      throw new SyntaxError("The element name '" + localName + "' is not valid.");
    }
    if (this._internals.localNameToDefinition(localName)) {
      throw new Error("A custom element with name '" + localName + "' has already been defined.");
    }
    if (this._elementDefinitionIsRunning) {
      throw new Error("A custom element is already being defined.");
    }
    this._elementDefinitionIsRunning = true;
    var connectedCallback;
    var disconnectedCallback;
    var adoptedCallback;
    var attributeChangedCallback;
    var observedAttributes;
    try {
      var getCallback = function(name) {
        var callbackValue = prototype[name];
        if (callbackValue !== undefined && !(callbackValue instanceof Function)) {
          throw new Error("The '" + name + "' callback must be a function.");
        }
        return callbackValue;
      };
      var prototype = constructor.prototype;
      if (!(prototype instanceof Object)) {
        throw new TypeError("The custom element constructor's prototype is not an object.");
      }
      connectedCallback = getCallback("connectedCallback");
      disconnectedCallback = getCallback("disconnectedCallback");
      adoptedCallback = getCallback("adoptedCallback");
      attributeChangedCallback = getCallback("attributeChangedCallback");
      observedAttributes = constructor["observedAttributes"] || [];
    } catch (e) {
      return;
    } finally {
      this._elementDefinitionIsRunning = false;
    }
    var definition = {localName:localName, constructor:constructor, connectedCallback:connectedCallback, disconnectedCallback:disconnectedCallback, adoptedCallback:adoptedCallback, attributeChangedCallback:attributeChangedCallback, observedAttributes:observedAttributes, constructionStack:[]};
    this._internals.setDefinition(localName, definition);
    this._unflushedLocalNames.push(localName);
    if (!this._flushPending) {
      this._flushPending = true;
      this._flushCallback(function() {
        return $jscomp$this._flush();
      });
    }
  };
  CustomElementRegistry.prototype._flush = function() {
    if (this._flushPending === false) {
      return;
    }
    this._flushPending = false;
    this._internals.patchAndUpgradeTree(document);
    while (this._unflushedLocalNames.length > 0) {
      var localName = this._unflushedLocalNames.shift();
      var deferred = this._whenDefinedDeferred.get(localName);
      if (deferred) {
        deferred.resolve(undefined);
      }
    }
  };
  CustomElementRegistry.prototype.get = function(localName) {
    var definition = this._internals.localNameToDefinition(localName);
    if (definition) {
      return definition.constructor;
    }
    return undefined;
  };
  CustomElementRegistry.prototype.whenDefined = function(localName) {
    if (!isValidCustomElementName(localName)) {
      return Promise.reject(new SyntaxError("'" + localName + "' is not a valid custom element name."));
    }
    var prior = this._whenDefinedDeferred.get(localName);
    if (prior) {
      return prior.toPromise();
    }
    var deferred = new Deferred;
    this._whenDefinedDeferred.set(localName, deferred);
    var definition = this._internals.localNameToDefinition(localName);
    if (definition && this._unflushedLocalNames.indexOf(localName) === -1) {
      deferred.resolve(undefined);
    }
    return deferred.toPromise();
  };
  CustomElementRegistry.prototype.polyfillWrapFlushCallback = function(outer) {
    this._documentConstructionObserver.disconnect();
    var inner = this._flushCallback;
    this._flushCallback = function(flush) {
      return outer(function() {
        return inner(flush);
      });
    };
  };
  window["CustomElementRegistry"] = CustomElementRegistry;
  CustomElementRegistry.prototype["define"] = CustomElementRegistry.prototype.define;
  CustomElementRegistry.prototype["get"] = CustomElementRegistry.prototype.get;
  CustomElementRegistry.prototype["whenDefined"] = CustomElementRegistry.prototype.whenDefined;
  CustomElementRegistry.prototype["polyfillWrapFlushCallback"] = CustomElementRegistry.prototype.polyfillWrapFlushCallback;
  var Native = {Document_createElement:window.Document.prototype.createElement, Document_createElementNS:window.Document.prototype.createElementNS, Document_importNode:window.Document.prototype.importNode, Document_prepend:window.Document.prototype["prepend"], Document_append:window.Document.prototype["append"], Node_cloneNode:window.Node.prototype.cloneNode, Node_appendChild:window.Node.prototype.appendChild, Node_insertBefore:window.Node.prototype.insertBefore, Node_removeChild:window.Node.prototype.removeChild, 
  Node_replaceChild:window.Node.prototype.replaceChild, Node_textContent:Object.getOwnPropertyDescriptor(window.Node.prototype, "textContent"), Element_attachShadow:window.Element.prototype["attachShadow"], Element_innerHTML:Object.getOwnPropertyDescriptor(window.Element.prototype, "innerHTML"), Element_getAttribute:window.Element.prototype.getAttribute, Element_setAttribute:window.Element.prototype.setAttribute, Element_removeAttribute:window.Element.prototype.removeAttribute, Element_getAttributeNS:window.Element.prototype.getAttributeNS, 
  Element_setAttributeNS:window.Element.prototype.setAttributeNS, Element_removeAttributeNS:window.Element.prototype.removeAttributeNS, Element_insertAdjacentElement:window.Element.prototype["insertAdjacentElement"], Element_prepend:window.Element.prototype["prepend"], Element_append:window.Element.prototype["append"], Element_before:window.Element.prototype["before"], Element_after:window.Element.prototype["after"], Element_replaceWith:window.Element.prototype["replaceWith"], Element_remove:window.Element.prototype["remove"], 
  HTMLElement:window.HTMLElement, HTMLElement_innerHTML:Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, "innerHTML"), HTMLElement_insertAdjacentElement:window.HTMLElement.prototype["insertAdjacentElement"]};
  var AlreadyConstructedMarker = function() {
  };
  var AlreadyConstructedMarker$1 = new AlreadyConstructedMarker;
  var PatchHTMLElement = function(internals) {
    window["HTMLElement"] = function() {
      function HTMLElement() {
        var constructor = this.constructor;
        var definition = internals.constructorToDefinition(constructor);
        if (!definition) {
          throw new Error("The custom element being constructed was not registered with `customElements`.");
        }
        var constructionStack = definition.constructionStack;
        if (constructionStack.length === 0) {
          var element$28 = Native.Document_createElement.call(document, definition.localName);
          Object.setPrototypeOf(element$28, constructor.prototype);
          element$28.__CE_state = CustomElementState.custom;
          element$28.__CE_definition = definition;
          internals.patch(element$28);
          return element$28;
        }
        var lastIndex = constructionStack.length - 1;
        var element = constructionStack[lastIndex];
        if (element === AlreadyConstructedMarker$1) {
          throw new Error("The HTMLElement constructor was either called reentrantly for this constructor or called multiple times.");
        }
        constructionStack[lastIndex] = AlreadyConstructedMarker$1;
        Object.setPrototypeOf(element, constructor.prototype);
        internals.patch((element));
        return element;
      }
      HTMLElement.prototype = Native.HTMLElement.prototype;
      return HTMLElement;
    }();
  };
  var PatchParentNode = function(internals, destination, builtIn) {
    destination["prepend"] = function(nodes) {
      var $jscomp$restParams = [];
      for (var $jscomp$restIndex = 0;$jscomp$restIndex < arguments.length;++$jscomp$restIndex) {
        $jscomp$restParams[$jscomp$restIndex - 0] = arguments[$jscomp$restIndex];
      }
      {
        var nodes$29 = $jscomp$restParams;
        var connectedBefore = (nodes$29.filter(function(node) {
          return node instanceof Node && isConnected(node);
        }));
        builtIn.prepend.apply(this, nodes$29);
        for (var i = 0;i < connectedBefore.length;i++) {
          internals.disconnectTree(connectedBefore[i]);
        }
        if (isConnected(this)) {
          for (var i$30 = 0;i$30 < nodes$29.length;i$30++) {
            var node = nodes$29[i$30];
            if (node instanceof Element) {
              internals.connectTree(node);
            }
          }
        }
      }
    };
    destination["append"] = function(nodes) {
      var $jscomp$restParams = [];
      for (var $jscomp$restIndex = 0;$jscomp$restIndex < arguments.length;++$jscomp$restIndex) {
        $jscomp$restParams[$jscomp$restIndex - 0] = arguments[$jscomp$restIndex];
      }
      {
        var nodes$31 = $jscomp$restParams;
        var connectedBefore = (nodes$31.filter(function(node) {
          return node instanceof Node && isConnected(node);
        }));
        builtIn.append.apply(this, nodes$31);
        for (var i = 0;i < connectedBefore.length;i++) {
          internals.disconnectTree(connectedBefore[i]);
        }
        if (isConnected(this)) {
          for (var i$32 = 0;i$32 < nodes$31.length;i$32++) {
            var node = nodes$31[i$32];
            if (node instanceof Element) {
              internals.connectTree(node);
            }
          }
        }
      }
    };
  };
  var PatchDocument = function(internals) {
    setPropertyUnchecked(Document.prototype, "createElement", function(localName) {
      if (this.__CE_hasRegistry) {
        var definition = internals.localNameToDefinition(localName);
        if (definition) {
          return new definition.constructor;
        }
      }
      var result = (Native.Document_createElement.call(this, localName));
      internals.patch(result);
      return result;
    });
    setPropertyUnchecked(Document.prototype, "importNode", function(node, deep) {
      var clone = Native.Document_importNode.call(this, node, deep);
      if (!this.__CE_hasRegistry) {
        internals.patchTree(clone);
      } else {
        internals.patchAndUpgradeTree(clone);
      }
      return clone;
    });
    var NS_HTML = "http://www.w3.org/1999/xhtml";
    setPropertyUnchecked(Document.prototype, "createElementNS", function(namespace, localName) {
      if (this.__CE_hasRegistry && (namespace === null || namespace === NS_HTML)) {
        var definition = internals.localNameToDefinition(localName);
        if (definition) {
          return new definition.constructor;
        }
      }
      var result = (Native.Document_createElementNS.call(this, namespace, localName));
      internals.patch(result);
      return result;
    });
    PatchParentNode(internals, Document.prototype, {prepend:Native.Document_prepend, append:Native.Document_append});
  };
  var PatchNode = function(internals) {
    setPropertyUnchecked(Node.prototype, "insertBefore", function(node, refNode) {
      if (node instanceof DocumentFragment) {
        var insertedNodes = Array.prototype.slice.apply(node.childNodes);
        var nativeResult$33 = Native.Node_insertBefore.call(this, node, refNode);
        if (isConnected(this)) {
          for (var i = 0;i < insertedNodes.length;i++) {
            internals.connectTree(insertedNodes[i]);
          }
        }
        return nativeResult$33;
      }
      var nodeWasConnected = isConnected(node);
      var nativeResult = Native.Node_insertBefore.call(this, node, refNode);
      if (nodeWasConnected) {
        internals.disconnectTree(node);
      }
      if (isConnected(this)) {
        internals.connectTree(node);
      }
      return nativeResult;
    });
    setPropertyUnchecked(Node.prototype, "appendChild", function(node) {
      if (node instanceof DocumentFragment) {
        var insertedNodes = Array.prototype.slice.apply(node.childNodes);
        var nativeResult$34 = Native.Node_appendChild.call(this, node);
        if (isConnected(this)) {
          for (var i = 0;i < insertedNodes.length;i++) {
            internals.connectTree(insertedNodes[i]);
          }
        }
        return nativeResult$34;
      }
      var nodeWasConnected = isConnected(node);
      var nativeResult = Native.Node_appendChild.call(this, node);
      if (nodeWasConnected) {
        internals.disconnectTree(node);
      }
      if (isConnected(this)) {
        internals.connectTree(node);
      }
      return nativeResult;
    });
    setPropertyUnchecked(Node.prototype, "cloneNode", function(deep) {
      var clone = Native.Node_cloneNode.call(this, deep);
      if (!this.ownerDocument.__CE_hasRegistry) {
        internals.patchTree(clone);
      } else {
        internals.patchAndUpgradeTree(clone);
      }
      return clone;
    });
    setPropertyUnchecked(Node.prototype, "removeChild", function(node) {
      var nodeWasConnected = isConnected(node);
      var nativeResult = Native.Node_removeChild.call(this, node);
      if (nodeWasConnected) {
        internals.disconnectTree(node);
      }
      return nativeResult;
    });
    setPropertyUnchecked(Node.prototype, "replaceChild", function(nodeToInsert, nodeToRemove) {
      if (nodeToInsert instanceof DocumentFragment) {
        var insertedNodes = Array.prototype.slice.apply(nodeToInsert.childNodes);
        var nativeResult$35 = Native.Node_replaceChild.call(this, nodeToInsert, nodeToRemove);
        if (isConnected(this)) {
          internals.disconnectTree(nodeToRemove);
          for (var i = 0;i < insertedNodes.length;i++) {
            internals.connectTree(insertedNodes[i]);
          }
        }
        return nativeResult$35;
      }
      var nodeToInsertWasConnected = isConnected(nodeToInsert);
      var nativeResult = Native.Node_replaceChild.call(this, nodeToInsert, nodeToRemove);
      var thisIsConnected = isConnected(this);
      if (thisIsConnected) {
        internals.disconnectTree(nodeToRemove);
      }
      if (nodeToInsertWasConnected) {
        internals.disconnectTree(nodeToInsert);
      }
      if (thisIsConnected) {
        internals.connectTree(nodeToInsert);
      }
      return nativeResult;
    });
    function patch_textContent(destination, baseDescriptor) {
      Object.defineProperty(destination, "textContent", {enumerable:baseDescriptor.enumerable, configurable:true, get:baseDescriptor.get, set:function(assignedValue) {
        if (this.nodeType === Node.TEXT_NODE) {
          baseDescriptor.set.call(this, assignedValue);
          return;
        }
        var removedNodes = undefined;
        if (this.firstChild) {
          var childNodes$36 = this.childNodes;
          var childNodesLength = childNodes$36.length;
          if (childNodesLength > 0 && isConnected(this)) {
            removedNodes = new Array(childNodesLength);
            for (var i = 0;i < childNodesLength;i++) {
              removedNodes[i] = childNodes$36[i];
            }
          }
        }
        baseDescriptor.set.call(this, assignedValue);
        if (removedNodes) {
          for (var i$37 = 0;i$37 < removedNodes.length;i$37++) {
            internals.disconnectTree(removedNodes[i$37]);
          }
        }
      }});
    }
    if (Native.Node_textContent && Native.Node_textContent.get) {
      patch_textContent(Node.prototype, Native.Node_textContent);
    } else {
      internals.addPatch(function(element) {
        patch_textContent(element, {enumerable:true, configurable:true, get:function() {
          var parts = [];
          for (var i = 0;i < this.childNodes.length;i++) {
            parts.push(this.childNodes[i].textContent);
          }
          return parts.join("");
        }, set:function(assignedValue) {
          while (this.firstChild) {
            Native.Node_removeChild.call(this, this.firstChild);
          }
          Native.Node_appendChild.call(this, document.createTextNode(assignedValue));
        }});
      });
    }
  };
  var PatchChildNode = function(internals, destination, builtIn) {
    destination["before"] = function(nodes) {
      var $jscomp$restParams = [];
      for (var $jscomp$restIndex = 0;$jscomp$restIndex < arguments.length;++$jscomp$restIndex) {
        $jscomp$restParams[$jscomp$restIndex - 0] = arguments[$jscomp$restIndex];
      }
      {
        var nodes$38 = $jscomp$restParams;
        var connectedBefore = (nodes$38.filter(function(node) {
          return node instanceof Node && isConnected(node);
        }));
        builtIn.before.apply(this, nodes$38);
        for (var i = 0;i < connectedBefore.length;i++) {
          internals.disconnectTree(connectedBefore[i]);
        }
        if (isConnected(this)) {
          for (var i$39 = 0;i$39 < nodes$38.length;i$39++) {
            var node = nodes$38[i$39];
            if (node instanceof Element) {
              internals.connectTree(node);
            }
          }
        }
      }
    };
    destination["after"] = function(nodes) {
      var $jscomp$restParams = [];
      for (var $jscomp$restIndex = 0;$jscomp$restIndex < arguments.length;++$jscomp$restIndex) {
        $jscomp$restParams[$jscomp$restIndex - 0] = arguments[$jscomp$restIndex];
      }
      {
        var nodes$40 = $jscomp$restParams;
        var connectedBefore = (nodes$40.filter(function(node) {
          return node instanceof Node && isConnected(node);
        }));
        builtIn.after.apply(this, nodes$40);
        for (var i = 0;i < connectedBefore.length;i++) {
          internals.disconnectTree(connectedBefore[i]);
        }
        if (isConnected(this)) {
          for (var i$41 = 0;i$41 < nodes$40.length;i$41++) {
            var node = nodes$40[i$41];
            if (node instanceof Element) {
              internals.connectTree(node);
            }
          }
        }
      }
    };
    destination["replaceWith"] = function(nodes) {
      var $jscomp$restParams = [];
      for (var $jscomp$restIndex = 0;$jscomp$restIndex < arguments.length;++$jscomp$restIndex) {
        $jscomp$restParams[$jscomp$restIndex - 0] = arguments[$jscomp$restIndex];
      }
      {
        var nodes$42 = $jscomp$restParams;
        var connectedBefore = (nodes$42.filter(function(node) {
          return node instanceof Node && isConnected(node);
        }));
        var wasConnected = isConnected(this);
        builtIn.replaceWith.apply(this, nodes$42);
        for (var i = 0;i < connectedBefore.length;i++) {
          internals.disconnectTree(connectedBefore[i]);
        }
        if (wasConnected) {
          internals.disconnectTree(this);
          for (var i$43 = 0;i$43 < nodes$42.length;i$43++) {
            var node = nodes$42[i$43];
            if (node instanceof Element) {
              internals.connectTree(node);
            }
          }
        }
      }
    };
    destination["remove"] = function() {
      var wasConnected = isConnected(this);
      builtIn.remove.call(this);
      if (wasConnected) {
        internals.disconnectTree(this);
      }
    };
  };
  var PatchElement = function(internals) {
    if (Native.Element_attachShadow) {
      setPropertyUnchecked(Element.prototype, "attachShadow", function(init) {
        var shadowRoot = Native.Element_attachShadow.call(this, init);
        this.__CE_shadowRoot = shadowRoot;
        return shadowRoot;
      });
    } else {
      console.warn("Custom Elements: `Element#attachShadow` was not patched.");
    }
    function patch_innerHTML(destination, baseDescriptor) {
      Object.defineProperty(destination, "innerHTML", {enumerable:baseDescriptor.enumerable, configurable:true, get:baseDescriptor.get, set:function(htmlString) {
        var $jscomp$this = this;
        var isConnected$$1 = isConnected(this);
        var removedElements = undefined;
        if (isConnected$$1) {
          removedElements = [];
          walkDeepDescendantElements(this, function(element) {
            if (element !== $jscomp$this) {
              removedElements.push(element);
            }
          });
        }
        baseDescriptor.set.call(this, htmlString);
        if (removedElements) {
          for (var i = 0;i < removedElements.length;i++) {
            var element = removedElements[i];
            if (element.__CE_state === CustomElementState.custom) {
              internals.disconnectedCallback(element);
            }
          }
        }
        if (!this.ownerDocument.__CE_hasRegistry) {
          internals.patchTree(this);
        } else {
          internals.patchAndUpgradeTree(this);
        }
        return htmlString;
      }});
    }
    if (Native.Element_innerHTML && Native.Element_innerHTML.get) {
      patch_innerHTML(Element.prototype, Native.Element_innerHTML);
    } else {
      if (Native.HTMLElement_innerHTML && Native.HTMLElement_innerHTML.get) {
        patch_innerHTML(HTMLElement.prototype, Native.HTMLElement_innerHTML);
      } else {
        var rawDiv = Native.Document_createElement.call(document, "div");
        internals.addPatch(function(element) {
          patch_innerHTML(element, {enumerable:true, configurable:true, get:function() {
            return Native.Node_cloneNode.call(this, true).innerHTML;
          }, set:function(assignedValue) {
            var content = this.localName === "template" ? (this).content : this;
            rawDiv.innerHTML = assignedValue;
            while (content.childNodes.length > 0) {
              Native.Node_removeChild.call(content, content.childNodes[0]);
            }
            while (rawDiv.childNodes.length > 0) {
              Native.Node_appendChild.call(content, rawDiv.childNodes[0]);
            }
          }});
        });
      }
    }
    setPropertyUnchecked(Element.prototype, "setAttribute", function(name, newValue) {
      if (this.__CE_state !== CustomElementState.custom) {
        return Native.Element_setAttribute.call(this, name, newValue);
      }
      var oldValue = Native.Element_getAttribute.call(this, name);
      Native.Element_setAttribute.call(this, name, newValue);
      newValue = Native.Element_getAttribute.call(this, name);
      internals.attributeChangedCallback(this, name, oldValue, newValue, null);
    });
    setPropertyUnchecked(Element.prototype, "setAttributeNS", function(namespace, name, newValue) {
      if (this.__CE_state !== CustomElementState.custom) {
        return Native.Element_setAttributeNS.call(this, namespace, name, newValue);
      }
      var oldValue = Native.Element_getAttributeNS.call(this, namespace, name);
      Native.Element_setAttributeNS.call(this, namespace, name, newValue);
      newValue = Native.Element_getAttributeNS.call(this, namespace, name);
      internals.attributeChangedCallback(this, name, oldValue, newValue, namespace);
    });
    setPropertyUnchecked(Element.prototype, "removeAttribute", function(name) {
      if (this.__CE_state !== CustomElementState.custom) {
        return Native.Element_removeAttribute.call(this, name);
      }
      var oldValue = Native.Element_getAttribute.call(this, name);
      Native.Element_removeAttribute.call(this, name);
      if (oldValue !== null) {
        internals.attributeChangedCallback(this, name, oldValue, null, null);
      }
    });
    setPropertyUnchecked(Element.prototype, "removeAttributeNS", function(namespace, name) {
      if (this.__CE_state !== CustomElementState.custom) {
        return Native.Element_removeAttributeNS.call(this, namespace, name);
      }
      var oldValue = Native.Element_getAttributeNS.call(this, namespace, name);
      Native.Element_removeAttributeNS.call(this, namespace, name);
      var newValue = Native.Element_getAttributeNS.call(this, namespace, name);
      if (oldValue !== newValue) {
        internals.attributeChangedCallback(this, name, oldValue, newValue, namespace);
      }
    });
    function patch_insertAdjacentElement(destination, baseMethod) {
      setPropertyUnchecked(destination, "insertAdjacentElement", function(where, element) {
        var wasConnected = isConnected(element);
        var insertedElement = (baseMethod.call(this, where, element));
        if (wasConnected) {
          internals.disconnectTree(element);
        }
        if (isConnected(insertedElement)) {
          internals.connectTree(element);
        }
        return insertedElement;
      });
    }
    if (Native.HTMLElement_insertAdjacentElement) {
      patch_insertAdjacentElement(HTMLElement.prototype, Native.HTMLElement_insertAdjacentElement);
    } else {
      if (Native.Element_insertAdjacentElement) {
        patch_insertAdjacentElement(Element.prototype, Native.Element_insertAdjacentElement);
      } else {
        console.warn("Custom Elements: `Element#insertAdjacentElement` was not patched.");
      }
    }
    PatchParentNode(internals, Element.prototype, {prepend:Native.Element_prepend, append:Native.Element_append});
    PatchChildNode(internals, Element.prototype, {before:Native.Element_before, after:Native.Element_after, replaceWith:Native.Element_replaceWith, remove:Native.Element_remove});
  };
  var priorCustomElements = window["customElements"];
  if (!priorCustomElements || priorCustomElements["forcePolyfill"] || typeof priorCustomElements["define"] != "function" || typeof priorCustomElements["get"] != "function") {
    var internals = new CustomElementInternals;
    PatchHTMLElement(internals);
    PatchDocument(internals);
    PatchNode(internals);
    PatchElement(internals);
    document.__CE_hasRegistry = true;
    var customElements = new CustomElementRegistry(internals);
    Object.defineProperty(window, "customElements", {configurable:true, enumerable:true, value:customElements});
  }
  var StyleNode = function() {
    this["start"] = 0;
    this["end"] = 0;
    this["previous"] = null;
    this["parent"] = null;
    this["rules"] = null;
    this["parsedCssText"] = "";
    this["cssText"] = "";
    this["atRule"] = false;
    this["type"] = 0;
    this["keyframesName"] = "";
    this["selector"] = "";
    this["parsedSelector"] = "";
  };
  function parse(text) {
    text = clean(text);
    return parseCss(lex(text), text);
  }
  function clean(cssText) {
    return cssText.replace(RX.comments, "").replace(RX.port, "");
  }
  function lex(text) {
    var root = new StyleNode;
    root["start"] = 0;
    root["end"] = text.length;
    var n = root;
    for (var i = 0, l = text.length;i < l;i++) {
      if (text[i] === OPEN_BRACE) {
        if (!n["rules"]) {
          n["rules"] = [];
        }
        var p$44 = n;
        var previous = p$44["rules"][p$44["rules"].length - 1] || null;
        n = new StyleNode;
        n["start"] = i + 1;
        n["parent"] = p$44;
        n["previous"] = previous;
        p$44["rules"].push(n);
      } else {
        if (text[i] === CLOSE_BRACE) {
          n["end"] = i + 1;
          n = n["parent"] || root;
        }
      }
    }
    return root;
  }
  function parseCss(node, text) {
    var t = text.substring(node["start"], node["end"] - 1);
    node["parsedCssText"] = node["cssText"] = t.trim();
    if (node["parent"]) {
      var ss = node["previous"] ? node["previous"]["end"] : node["parent"]["start"];
      t = text.substring(ss, node["start"] - 1);
      t = _expandUnicodeEscapes(t);
      t = t.replace(RX.multipleSpaces, " ");
      t = t.substring(t.lastIndexOf(";") + 1);
      var s = node["parsedSelector"] = node["selector"] = t.trim();
      node["atRule"] = s.indexOf(AT_START) === 0;
      if (node["atRule"]) {
        if (s.indexOf(MEDIA_START) === 0) {
          node["type"] = types.MEDIA_RULE;
        } else {
          if (s.match(RX.keyframesRule)) {
            node["type"] = types.KEYFRAMES_RULE;
            node["keyframesName"] = node["selector"].split(RX.multipleSpaces).pop();
          }
        }
      } else {
        if (s.indexOf(VAR_START) === 0) {
          node["type"] = types.MIXIN_RULE;
        } else {
          node["type"] = types.STYLE_RULE;
        }
      }
    }
    var r$ = node["rules"];
    if (r$) {
      for (var i = 0, l = r$.length, r;i < l && (r = r$[i]);i++) {
        parseCss(r, text);
      }
    }
    return node;
  }
  function _expandUnicodeEscapes(s) {
    return s.replace(/\\([0-9a-f]{1,6})\s/gi, function() {
      var code = arguments[1], repeat = 6 - code.length;
      while (repeat--) {
        code = "0" + code;
      }
      return "\\" + code;
    });
  }
  function stringify(node, preserveProperties, text) {
    text = text === undefined ? "" : text;
    var cssText = "";
    if (node["cssText"] || node["rules"]) {
      var r$ = node["rules"];
      if (r$ && !_hasMixinRules(r$)) {
        for (var i = 0, l = r$.length, r;i < l && (r = r$[i]);i++) {
          cssText = stringify(r, preserveProperties, cssText);
        }
      } else {
        cssText = preserveProperties ? node["cssText"] : removeCustomProps(node["cssText"]);
        cssText = cssText.trim();
        if (cssText) {
          cssText = "  " + cssText + "\n";
        }
      }
    }
    if (cssText) {
      if (node["selector"]) {
        text += node["selector"] + " " + OPEN_BRACE + "\n";
      }
      text += cssText;
      if (node["selector"]) {
        text += CLOSE_BRACE + "\n\n";
      }
    }
    return text;
  }
  function _hasMixinRules(rules) {
    var r = rules[0];
    return Boolean(r) && Boolean(r["selector"]) && r["selector"].indexOf(VAR_START) === 0;
  }
  function removeCustomProps(cssText) {
    cssText = removeCustomPropAssignment(cssText);
    return removeCustomPropApply(cssText);
  }
  function removeCustomPropAssignment(cssText) {
    return cssText.replace(RX.customProp, "").replace(RX.mixinProp, "");
  }
  function removeCustomPropApply(cssText) {
    return cssText.replace(RX.mixinApply, "").replace(RX.varApply, "");
  }
  var types = {STYLE_RULE:1, KEYFRAMES_RULE:7, MEDIA_RULE:4, MIXIN_RULE:1000};
  var OPEN_BRACE = "{";
  var CLOSE_BRACE = "}";
  var RX = {comments:/\/\*[^*]*\*+([^/*][^*]*\*+)*\//gim, port:/@import[^;]*;/gim, customProp:/(?:^[^;\-\s}]+)?--[^;{}]*?:[^{};]*?(?:[;\n]|$)/gim, mixinProp:/(?:^[^;\-\s}]+)?--[^;{}]*?:[^{};]*?{[^}]*?}(?:[;\n]|$)?/gim, mixinApply:/@apply\s*\(?[^);]*\)?\s*(?:[;\n]|$)?/gim, varApply:/[^;:]*?:[^;]*?var\([^;]*\)(?:[;\n]|$)?/gim, keyframesRule:/^@[^\s]*keyframes/, multipleSpaces:/\s+/g};
  var VAR_START = "--";
  var MEDIA_START = "@media";
  var AT_START = "@";
  var nativeShadow = !(window["ShadyDOM"] && window["ShadyDOM"]["inUse"]);
  var nativeCssVariables;
  function calcCssVariables(settings) {
    if (settings && settings["shimcssproperties"]) {
      nativeCssVariables = false;
    } else {
      nativeCssVariables = nativeShadow || Boolean(!navigator.userAgent.match("AppleWebKit/601") && window.CSS && CSS.supports && CSS.supports("box-shadow", "0 0 0 var(--foo)"));
    }
  }
  if (window.ShadyCSS && window.ShadyCSS.nativeCss !== undefined) {
    nativeCssVariables = window.ShadyCSS.nativeCss;
  } else {
    if (window.ShadyCSS) {
      calcCssVariables(window.ShadyCSS);
      window.ShadyCSS = undefined;
    } else {
      calcCssVariables(window["WebComponents"] && window["WebComponents"]["flags"]);
    }
  }
  var VAR_ASSIGN = /(?:^|[;\s{]\s*)(--[\w-]*?)\s*:\s*(?:((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*?\)|[^};{])+)|\{([^}]*)\}(?:(?=[;\s}])|$))/gi;
  var MIXIN_MATCH = /(?:^|\W+)@apply\s*\(?([^);\n]*)\)?/gi;
  var VAR_CONSUMED = /(--[\w-]+)\s*([:,;)]|$)/gi;
  var ANIMATION_MATCH = /(animation\s*:)|(animation-name\s*:)/;
  var MEDIA_MATCH = /@media\s(.*)/;
  var BRACKETED = /\{[^}]*\}/g;
  var HOST_PREFIX = "(?:^|[^.#[:])";
  var HOST_SUFFIX = "($|[.:[\\s>+~])";
  function toCssText(rules, callback) {
    if (!rules) {
      return "";
    }
    if (typeof rules === "string") {
      rules = parse(rules);
    }
    if (callback) {
      forEachRule(rules, callback);
    }
    return stringify(rules, nativeCssVariables);
  }
  function rulesForStyle(style) {
    if (!style["__cssRules"] && style.textContent) {
      style["__cssRules"] = parse(style.textContent);
    }
    return style["__cssRules"] || null;
  }
  function isKeyframesSelector(rule) {
    return Boolean(rule["parent"]) && rule["parent"]["type"] === types.KEYFRAMES_RULE;
  }
  function forEachRule(node, styleRuleCallback, keyframesRuleCallback, onlyActiveRules) {
    if (!node) {
      return;
    }
    var skipRules = false;
    var type = node["type"];
    if (onlyActiveRules) {
      if (type === types.MEDIA_RULE) {
        var matchMedia = node["selector"].match(MEDIA_MATCH);
        if (matchMedia) {
          if (!window.matchMedia(matchMedia[1]).matches) {
            skipRules = true;
          }
        }
      }
    }
    if (type === types.STYLE_RULE) {
      styleRuleCallback(node);
    } else {
      if (keyframesRuleCallback && type === types.KEYFRAMES_RULE) {
        keyframesRuleCallback(node);
      } else {
        if (type === types.MIXIN_RULE) {
          skipRules = true;
        }
      }
    }
    var r$ = node["rules"];
    if (r$ && !skipRules) {
      for (var i = 0, l = r$.length, r;i < l && (r = r$[i]);i++) {
        forEachRule(r, styleRuleCallback, keyframesRuleCallback, onlyActiveRules);
      }
    }
  }
  function applyCss(cssText, moniker, target, contextNode) {
    var style = createScopeStyle(cssText, moniker);
    applyStyle(style, target, contextNode);
    return style;
  }
  function createScopeStyle(cssText, moniker) {
    var style = (document.createElement("style"));
    if (moniker) {
      style.setAttribute("scope", moniker);
    }
    style.textContent = cssText;
    return style;
  }
  var lastHeadApplyNode = null;
  function applyStylePlaceHolder(moniker) {
    var placeHolder = document.createComment(" Shady DOM styles for " + moniker + " ");
    var after = lastHeadApplyNode ? lastHeadApplyNode["nextSibling"] : null;
    var scope = document.head;
    scope.insertBefore(placeHolder, after || scope.firstChild);
    lastHeadApplyNode = placeHolder;
    return placeHolder;
  }
  function applyStyle(style, target, contextNode) {
    target = target || document.head;
    var after = contextNode && contextNode.nextSibling || target.firstChild;
    target.insertBefore(style, after);
    if (!lastHeadApplyNode) {
      lastHeadApplyNode = style;
    } else {
      var position = style.compareDocumentPosition(lastHeadApplyNode);
      if (position === Node.DOCUMENT_POSITION_PRECEDING) {
        lastHeadApplyNode = style;
      }
    }
  }
  function findMatchingParen(text, start) {
    var level = 0;
    for (var i = start, l = text.length;i < l;i++) {
      if (text[i] === "(") {
        level++;
      } else {
        if (text[i] === ")") {
          if (--level === 0) {
            return i;
          }
        }
      }
    }
    return -1;
  }
  function processVariableAndFallback(str, callback) {
    var start = str.indexOf("var(");
    if (start === -1) {
      return callback(str, "", "", "");
    }
    var end = findMatchingParen(str, start + 3);
    var inner = str.substring(start + 4, end);
    var prefix = str.substring(0, start);
    var suffix = processVariableAndFallback(str.substring(end + 1), callback);
    var comma = inner.indexOf(",");
    if (comma === -1) {
      return callback(prefix, inner.trim(), "", suffix);
    }
    var value = inner.substring(0, comma).trim();
    var fallback = inner.substring(comma + 1).trim();
    return callback(prefix, value, fallback, suffix);
  }
  function setElementClassRaw(element, value) {
    if (nativeShadow) {
      element.setAttribute("class", value);
    } else {
      window["ShadyDOM"]["nativeMethods"]["setAttribute"].call(element, "class", value);
    }
  }
  function getIsExtends(element) {
    var localName = element["localName"];
    var is = "", typeExtension = "";
    if (localName) {
      if (localName.indexOf("-") > -1) {
        is = localName;
      } else {
        typeExtension = localName;
        is = element.getAttribute && element.getAttribute("is") || "";
      }
    } else {
      is = (element).is;
      typeExtension = (element).extends;
    }
    return {is:is, typeExtension:typeExtension};
  }
  var SCOPE_NAME = "style-scope";
  var StyleTransformer = function() {
  };
  StyleTransformer.prototype.SCOPE_NAME;
  StyleTransformer.prototype.dom = function(node, scope, shouldRemoveScope) {
    if (node["__styleScoped"]) {
      node["__styleScoped"] = null;
    } else {
      this._transformDom(node, scope || "", shouldRemoveScope);
    }
  };
  StyleTransformer.prototype._transformDom = function(node, selector, shouldRemoveScope) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      this.element(node, selector, shouldRemoveScope);
    }
    var c$ = node.localName === "template" ? (node.content || node._content).childNodes : node.children || node.childNodes;
    if (c$) {
      for (var i = 0;i < c$.length;i++) {
        this._transformDom(c$[i], selector, shouldRemoveScope);
      }
    }
  };
  StyleTransformer.prototype.element = function(element, scope, shouldRemoveScope) {
    if (scope) {
      if (element.classList) {
        if (shouldRemoveScope) {
          element.classList.remove(SCOPE_NAME);
          element.classList.remove(scope);
        } else {
          element.classList.add(SCOPE_NAME);
          element.classList.add(scope);
        }
      } else {
        if (element.getAttribute) {
          var c = element.getAttribute(CLASS);
          if (shouldRemoveScope) {
            if (c) {
              var newValue = c.replace(SCOPE_NAME, "").replace(scope, "");
              setElementClassRaw(element, newValue);
            }
          } else {
            var newValue$45 = (c ? c + " " : "") + SCOPE_NAME + " " + scope;
            setElementClassRaw(element, newValue$45);
          }
        }
      }
    }
  };
  StyleTransformer.prototype.elementStyles = function(element, styleRules, callback) {
    var cssBuildType = element["__cssBuild"];
    var cssText = "";
    if (nativeShadow || cssBuildType === "shady") {
      cssText = toCssText(styleRules, callback);
    } else {
      var $jscomp$destructuring$var1 = getIsExtends(element);
      var is = $jscomp$destructuring$var1.is;
      var typeExtension = $jscomp$destructuring$var1.typeExtension;
      cssText = this.css(styleRules, is, typeExtension, callback) + "\n\n";
    }
    return cssText.trim();
  };
  StyleTransformer.prototype.css = function(rules, scope, ext, callback) {
    var hostScope = this._calcHostScope(scope, ext);
    scope = this._calcElementScope(scope);
    var self = this;
    return toCssText(rules, function(rule) {
      if (!rule.isScoped) {
        self.rule(rule, scope, hostScope);
        rule.isScoped = true;
      }
      if (callback) {
        callback(rule, scope, hostScope);
      }
    });
  };
  StyleTransformer.prototype._calcElementScope = function(scope) {
    if (scope) {
      return CSS_CLASS_PREFIX + scope;
    } else {
      return "";
    }
  };
  StyleTransformer.prototype._calcHostScope = function(scope, ext) {
    return ext ? "[is=" + scope + "]" : scope;
  };
  StyleTransformer.prototype.rule = function(rule, scope, hostScope) {
    this._transformRule(rule, this._transformComplexSelector, scope, hostScope);
  };
  StyleTransformer.prototype._transformRule = function(rule, transformer, scope, hostScope) {
    rule["selector"] = rule.transformedSelector = this._transformRuleCss(rule, transformer, scope, hostScope);
  };
  StyleTransformer.prototype._transformRuleCss = function(rule, transformer, scope, hostScope) {
    var p$ = rule["selector"].split(COMPLEX_SELECTOR_SEP);
    if (!isKeyframesSelector(rule)) {
      for (var i = 0, l = p$.length, p;i < l && (p = p$[i]);i++) {
        p$[i] = transformer.call(this, p, scope, hostScope);
      }
    }
    return p$.join(COMPLEX_SELECTOR_SEP);
  };
  StyleTransformer.prototype._transformComplexSelector = function(selector, scope, hostScope) {
    var $jscomp$this = this;
    var stop = false;
    selector = selector.trim();
    selector = selector.replace(NTH, function(m, type, inner) {
      return ":" + type + "(" + inner.replace(/\s/g, "") + ")";
    });
    selector = selector.replace(SLOTTED_START, HOST + " $1");
    selector = selector.replace(SIMPLE_SELECTOR_SEP, function(m, c, s) {
      if (!stop) {
        var info = $jscomp$this._transformCompoundSelector(s, c, scope, hostScope);
        stop = stop || info.stop;
        c = info.combinator;
        s = info.value;
      }
      return c + s;
    });
    return selector;
  };
  StyleTransformer.prototype._transformCompoundSelector = function(selector, combinator, scope, hostScope) {
    var slottedIndex = selector.indexOf(SLOTTED);
    if (selector.indexOf(HOST) >= 0) {
      selector = this._transformHostSelector(selector, hostScope);
    } else {
      if (slottedIndex !== 0) {
        selector = scope ? this._transformSimpleSelector(selector, scope) : selector;
      }
    }
    var slotted = false;
    if (slottedIndex >= 0) {
      combinator = "";
      slotted = true;
    }
    var stop;
    if (slotted) {
      stop = true;
      if (slotted) {
        selector = selector.replace(SLOTTED_PAREN, function(m, paren) {
          return " > " + paren;
        });
      }
    }
    selector = selector.replace(DIR_PAREN, function(m, before, dir) {
      return '[dir="' + dir + '"] ' + before + ", " + before + '[dir="' + dir + '"]';
    });
    return {value:selector, combinator:combinator, stop:stop};
  };
  StyleTransformer.prototype._transformSimpleSelector = function(selector, scope) {
    var p$ = selector.split(PSEUDO_PREFIX);
    p$[0] += scope;
    return p$.join(PSEUDO_PREFIX);
  };
  StyleTransformer.prototype._transformHostSelector = function(selector, hostScope) {
    var m = selector.match(HOST_PAREN);
    var paren = m && m[2].trim() || "";
    if (paren) {
      if (!paren[0].match(SIMPLE_SELECTOR_PREFIX)) {
        var typeSelector = paren.split(SIMPLE_SELECTOR_PREFIX)[0];
        if (typeSelector === hostScope) {
          return paren;
        } else {
          return SELECTOR_NO_MATCH;
        }
      } else {
        return selector.replace(HOST_PAREN, function(m, host, paren) {
          return hostScope + paren;
        });
      }
    } else {
      return selector.replace(HOST, hostScope);
    }
  };
  StyleTransformer.prototype.documentRule = function(rule) {
    rule["selector"] = rule["parsedSelector"];
    this.normalizeRootSelector(rule);
    this._transformRule(rule, this._transformDocumentSelector);
  };
  StyleTransformer.prototype.normalizeRootSelector = function(rule) {
    if (rule["selector"] === ROOT) {
      rule["selector"] = "html";
    }
  };
  StyleTransformer.prototype._transformDocumentSelector = function(selector) {
    return selector.match(SLOTTED) ? this._transformComplexSelector(selector, SCOPE_DOC_SELECTOR) : this._transformSimpleSelector(selector.trim(), SCOPE_DOC_SELECTOR);
  };
  var NTH = /:(nth[-\w]+)\(([^)]+)\)/;
  var SCOPE_DOC_SELECTOR = ":not(." + SCOPE_NAME + ")";
  var COMPLEX_SELECTOR_SEP = ",";
  var SIMPLE_SELECTOR_SEP = /(^|[\s>+~]+)((?:\[.+?\]|[^\s>+~=[])+)/g;
  var SIMPLE_SELECTOR_PREFIX = /[[.:#*]/;
  var HOST = ":host";
  var ROOT = ":root";
  var SLOTTED = "::slotted";
  var SLOTTED_START = new RegExp("^(" + SLOTTED + ")");
  var HOST_PAREN = /(:host)(?:\(((?:\([^)(]*\)|[^)(]*)+?)\))/;
  var SLOTTED_PAREN = /(?:::slotted)(?:\(((?:\([^)(]*\)|[^)(]*)+?)\))/;
  var DIR_PAREN = /(.*):dir\((?:(ltr|rtl))\)/;
  var CSS_CLASS_PREFIX = ".";
  var PSEUDO_PREFIX = ":";
  var CLASS = "class";
  var SELECTOR_NO_MATCH = "should_not_match";
  var StyleTransformer$1 = new StyleTransformer;
  var infoKey = "__styleInfo";
  var StyleInfo = function(ast, placeholder, ownStylePropertyNames, elementName, typeExtension, cssBuild) {
    this.styleRules = ast || null;
    this.placeholder = placeholder || null;
    this.ownStylePropertyNames = ownStylePropertyNames || [];
    this.overrideStyleProperties = null;
    this.elementName = elementName || "";
    this.cssBuild = cssBuild || "";
    this.typeExtension = typeExtension || "";
    this.styleProperties = null;
    this.scopeSelector = null;
    this.customStyle = null;
  };
  StyleInfo.get = function(node) {
    if (node) {
      return node[infoKey];
    } else {
      return null;
    }
  };
  StyleInfo.set = function(node, styleInfo) {
    node[infoKey] = styleInfo;
    return styleInfo;
  };
  StyleInfo.prototype._getStyleRules = function() {
    return this.styleRules;
  };
  StyleInfo.prototype["_getStyleRules"] = StyleInfo.prototype._getStyleRules;
  var matchesSelector$1 = function(p) {
    return p.matches || p.matchesSelector || p.mozMatchesSelector || p.msMatchesSelector || p.oMatchesSelector || p.webkitMatchesSelector;
  }(window.Element.prototype);
  var IS_IE = navigator.userAgent.match("Trident");
  var XSCOPE_NAME = "x-scope";
  var StyleProperties = function() {
  };
  StyleProperties.prototype.XSCOPE_NAME;
  StyleProperties.prototype.decorateStyles = function(rules) {
    var self = this, props = {}, keyframes = [], ruleIndex = 0;
    forEachRule(rules, function(rule) {
      self.decorateRule(rule);
      rule.index = ruleIndex++;
      self.collectPropertiesInCssText(rule.propertyInfo.cssText, props);
    }, function onKeyframesRule(rule) {
      keyframes.push(rule);
    });
    rules._keyframes = keyframes;
    var names = [];
    for (var i in props) {
      names.push(i);
    }
    return names;
  };
  StyleProperties.prototype.decorateRule = function(rule) {
    if (rule.propertyInfo) {
      return rule.propertyInfo;
    }
    var info = {}, properties = {};
    var hasProperties = this.collectProperties(rule, properties);
    if (hasProperties) {
      info.properties = properties;
      rule["rules"] = null;
    }
    info.cssText = this.collectCssText(rule);
    rule.propertyInfo = info;
    return info;
  };
  StyleProperties.prototype.collectProperties = function(rule, properties) {
    var info = rule.propertyInfo;
    if (info) {
      if (info.properties) {
        Object.assign(properties, info.properties);
        return true;
      }
    } else {
      var m, rx = VAR_ASSIGN;
      var cssText = rule["parsedCssText"];
      var value;
      var any;
      while (m = rx.exec(cssText)) {
        value = (m[2] || m[3]).trim();
        if (value !== "inherit" || value !== "unset") {
          properties[m[1].trim()] = value;
        }
        any = true;
      }
      return any;
    }
  };
  StyleProperties.prototype.collectCssText = function(rule) {
    return this.collectConsumingCssText(rule["parsedCssText"]);
  };
  StyleProperties.prototype.collectConsumingCssText = function(cssText) {
    return cssText.replace(BRACKETED, "").replace(VAR_ASSIGN, "");
  };
  StyleProperties.prototype.collectPropertiesInCssText = function(cssText, props) {
    var m;
    while (m = VAR_CONSUMED.exec(cssText)) {
      var name = m[1];
      if (m[2] !== ":") {
        props[name] = true;
      }
    }
  };
  StyleProperties.prototype.reify = function(props) {
    var names = Object.getOwnPropertyNames(props);
    for (var i = 0, n;i < names.length;i++) {
      n = names[i];
      props[n] = this.valueForProperty(props[n], props);
    }
  };
  StyleProperties.prototype.valueForProperty = function(property, props) {
    if (property) {
      if (property.indexOf(";") >= 0) {
        property = this.valueForProperties(property, props);
      } else {
        var self$46 = this;
        var fn = function(prefix, value, fallback, suffix) {
          if (!value) {
            return prefix + suffix;
          }
          var propertyValue = self$46.valueForProperty(props[value], props);
          if (!propertyValue || propertyValue === "initial") {
            propertyValue = self$46.valueForProperty(props[fallback] || fallback, props) || fallback;
          } else {
            if (propertyValue === "apply-shim-inherit") {
              propertyValue = "inherit";
            }
          }
          return prefix + (propertyValue || "") + suffix;
        };
        property = processVariableAndFallback(property, fn);
      }
    }
    return property && property.trim() || "";
  };
  StyleProperties.prototype.valueForProperties = function(property, props) {
    var parts = property.split(";");
    for (var i = 0, p, m;i < parts.length;i++) {
      if (p = parts[i]) {
        MIXIN_MATCH.lastIndex = 0;
        m = MIXIN_MATCH.exec(p);
        if (m) {
          p = this.valueForProperty(props[m[1]], props);
        } else {
          var colon = p.indexOf(":");
          if (colon !== -1) {
            var pp = p.substring(colon);
            pp = pp.trim();
            pp = this.valueForProperty(pp, props) || pp;
            p = p.substring(0, colon) + pp;
          }
        }
        parts[i] = p && p.lastIndexOf(";") === p.length - 1 ? p.slice(0, -1) : p || "";
      }
    }
    return parts.join(";");
  };
  StyleProperties.prototype.applyProperties = function(rule, props) {
    var output = "";
    if (!rule.propertyInfo) {
      this.decorateRule(rule);
    }
    if (rule.propertyInfo.cssText) {
      output = this.valueForProperties(rule.propertyInfo.cssText, props);
    }
    rule["cssText"] = output;
  };
  StyleProperties.prototype.applyKeyframeTransforms = function(rule, keyframeTransforms) {
    var input = rule["cssText"];
    var output = rule["cssText"];
    if (rule.hasAnimations == null) {
      rule.hasAnimations = ANIMATION_MATCH.test(input);
    }
    if (rule.hasAnimations) {
      var transform;
      if (rule.keyframeNamesToTransform == null) {
        rule.keyframeNamesToTransform = [];
        for (var keyframe in keyframeTransforms) {
          transform = keyframeTransforms[keyframe];
          output = transform(input);
          if (input !== output) {
            input = output;
            rule.keyframeNamesToTransform.push(keyframe);
          }
        }
      } else {
        for (var i = 0;i < rule.keyframeNamesToTransform.length;++i) {
          transform = keyframeTransforms[rule.keyframeNamesToTransform[i]];
          input = transform(input);
        }
        output = input;
      }
    }
    rule["cssText"] = output;
  };
  StyleProperties.prototype.propertyDataFromStyles = function(rules, element) {
    var props = {}, self = this;
    var o = [];
    forEachRule(rules, function(rule) {
      if (!rule.propertyInfo) {
        self.decorateRule(rule);
      }
      var selectorToMatch = rule.transformedSelector || rule["parsedSelector"];
      if (element && rule.propertyInfo.properties && selectorToMatch) {
        if (matchesSelector$1.call(element, selectorToMatch)) {
          self.collectProperties(rule, props);
          addToBitMask(rule.index, o);
        }
      }
    }, null, true);
    return {properties:props, key:o};
  };
  StyleProperties.prototype.whenHostOrRootRule = function(scope, rule, cssBuild, callback) {
    if (!rule.propertyInfo) {
      this.decorateRule(rule);
    }
    if (!rule.propertyInfo.properties) {
      return;
    }
    var $jscomp$destructuring$var2 = getIsExtends(scope);
    var is = $jscomp$destructuring$var2.is;
    var typeExtension = $jscomp$destructuring$var2.typeExtension;
    var hostScope = is ? StyleTransformer$1._calcHostScope(is, typeExtension) : "html";
    var parsedSelector = rule["parsedSelector"];
    var isRoot = parsedSelector === ":host > *" || parsedSelector === "html";
    var isHost = parsedSelector.indexOf(":host") === 0 && !isRoot;
    if (cssBuild === "shady") {
      isRoot = parsedSelector === hostScope + " > *." + hostScope || parsedSelector.indexOf("html") !== -1;
      isHost = !isRoot && parsedSelector.indexOf(hostScope) === 0;
    }
    if (cssBuild === "shadow") {
      isRoot = parsedSelector === ":host > *" || parsedSelector === "html";
      isHost = isHost && !isRoot;
    }
    if (!isRoot && !isHost) {
      return;
    }
    var selectorToMatch = hostScope;
    if (isHost) {
      if (nativeShadow && !rule.transformedSelector) {
        rule.transformedSelector = StyleTransformer$1._transformRuleCss(rule, StyleTransformer$1._transformComplexSelector, StyleTransformer$1._calcElementScope(is), hostScope);
      }
      selectorToMatch = rule.transformedSelector || hostScope;
    }
    callback({selector:selectorToMatch, isHost:isHost, isRoot:isRoot});
  };
  StyleProperties.prototype.hostAndRootPropertiesForScope = function(scope, rules) {
    var hostProps = {}, rootProps = {}, self = this;
    var cssBuild = rules && rules["__cssBuild"];
    forEachRule(rules, function(rule) {
      self.whenHostOrRootRule(scope, rule, cssBuild, function(info) {
        var element = scope._element || scope;
        if (matchesSelector$1.call(element, info.selector)) {
          if (info.isHost) {
            self.collectProperties(rule, hostProps);
          } else {
            self.collectProperties(rule, rootProps);
          }
        }
      });
    }, null, true);
    return {rootProps:rootProps, hostProps:hostProps};
  };
  StyleProperties.prototype.transformStyles = function(element, properties, scopeSelector) {
    var self = this;
    var $jscomp$destructuring$var3 = getIsExtends(element);
    var is = $jscomp$destructuring$var3.is;
    var typeExtension = $jscomp$destructuring$var3.typeExtension;
    var hostSelector = StyleTransformer$1._calcHostScope(is, typeExtension);
    var rxHostSelector = element.extends ? "\\" + hostSelector.slice(0, -1) + "\\]" : hostSelector;
    var hostRx = new RegExp(HOST_PREFIX + rxHostSelector + HOST_SUFFIX);
    var rules = StyleInfo.get(element).styleRules;
    var keyframeTransforms = this._elementKeyframeTransforms(element, rules, scopeSelector);
    return StyleTransformer$1.elementStyles(element, rules, function(rule) {
      self.applyProperties(rule, properties);
      if (!nativeShadow && !isKeyframesSelector(rule) && rule["cssText"]) {
        self.applyKeyframeTransforms(rule, keyframeTransforms);
        self._scopeSelector(rule, hostRx, hostSelector, scopeSelector);
      }
    });
  };
  StyleProperties.prototype._elementKeyframeTransforms = function(element, rules, scopeSelector) {
    var keyframesRules = rules._keyframes;
    var keyframeTransforms = {};
    if (!nativeShadow && keyframesRules) {
      for (var i = 0, keyframesRule = keyframesRules[i];i < keyframesRules.length;keyframesRule = keyframesRules[++i]) {
        this._scopeKeyframes(keyframesRule, scopeSelector);
        keyframeTransforms[keyframesRule["keyframesName"]] = this._keyframesRuleTransformer(keyframesRule);
      }
    }
    return keyframeTransforms;
  };
  StyleProperties.prototype._keyframesRuleTransformer = function(keyframesRule) {
    return function(cssText) {
      return cssText.replace(keyframesRule.keyframesNameRx, keyframesRule.transformedKeyframesName);
    };
  };
  StyleProperties.prototype._scopeKeyframes = function(rule, scopeId) {
    rule.keyframesNameRx = new RegExp(rule["keyframesName"], "g");
    rule.transformedKeyframesName = rule["keyframesName"] + "-" + scopeId;
    rule.transformedSelector = rule.transformedSelector || rule["selector"];
    rule["selector"] = rule.transformedSelector.replace(rule["keyframesName"], rule.transformedKeyframesName);
  };
  StyleProperties.prototype._scopeSelector = function(rule, hostRx, hostSelector, scopeId) {
    rule.transformedSelector = rule.transformedSelector || rule["selector"];
    var selector = rule.transformedSelector;
    var scope = "." + scopeId;
    var parts = selector.split(",");
    for (var i = 0, l = parts.length, p;i < l && (p = parts[i]);i++) {
      parts[i] = p.match(hostRx) ? p.replace(hostSelector, scope) : scope + " " + p;
    }
    rule["selector"] = parts.join(",");
  };
  StyleProperties.prototype.applyElementScopeSelector = function(element, selector, old) {
    var c = element.getAttribute("class") || "";
    var v = c;
    if (old) {
      v = c.replace(new RegExp("\\s*" + XSCOPE_NAME + "\\s*" + old + "\\s*", "g"), " ");
    }
    v += (v ? " " : "") + XSCOPE_NAME + " " + selector;
    if (c !== v) {
      setElementClassRaw(element, v);
    }
  };
  StyleProperties.prototype.applyElementStyle = function(element, properties, selector, style) {
    var cssText = style ? style.textContent || "" : this.transformStyles(element, properties, selector);
    var styleInfo = StyleInfo.get(element);
    var s = styleInfo.customStyle;
    if (s && !nativeShadow && s !== style) {
      s["_useCount"]--;
      if (s["_useCount"] <= 0 && s.parentNode) {
        s.parentNode.removeChild(s);
      }
    }
    if (nativeShadow) {
      if (styleInfo.customStyle) {
        styleInfo.customStyle.textContent = cssText;
        style = styleInfo.customStyle;
      } else {
        if (cssText) {
          style = applyCss(cssText, selector, element.shadowRoot, styleInfo.placeholder);
        }
      }
    } else {
      if (!style) {
        if (cssText) {
          style = applyCss(cssText, selector, null, styleInfo.placeholder);
        }
      } else {
        if (!style.parentNode) {
          if (IS_IE && cssText.indexOf("@media") > -1) {
            style.textContent = cssText;
          }
          applyStyle(style, null, styleInfo.placeholder);
        }
      }
    }
    if (style) {
      style["_useCount"] = style["_useCount"] || 0;
      if (styleInfo.customStyle != style) {
        style["_useCount"]++;
      }
      styleInfo.customStyle = style;
    }
    return style;
  };
  StyleProperties.prototype.applyCustomStyle = function(style, properties) {
    var rules = rulesForStyle((style));
    var self = this;
    style.textContent = toCssText(rules, function(rule) {
      var css = rule["cssText"] = rule["parsedCssText"];
      if (rule.propertyInfo && rule.propertyInfo.cssText) {
        css = removeCustomPropAssignment((css));
        rule["cssText"] = self.valueForProperties(css, properties);
      }
    });
  };
  function addToBitMask(n, bits) {
    var o = parseInt(n / 32, 10);
    var v = 1 << n % 32;
    bits[o] = (bits[o] || 0) | v;
  }
  var StyleProperties$1 = new StyleProperties;
  var placeholderMap = {};
  var ce = window["customElements"];
  if (ce && !nativeShadow) {
    var origDefine = ce["define"];
    var wrappedDefine = function(name, clazz, options) {
      placeholderMap[name] = applyStylePlaceHolder(name);
      return origDefine.call((ce), name, clazz, options);
    };
    ce["define"] = wrappedDefine;
  }
  var StyleCache = function(typeMax) {
    typeMax = typeMax === undefined ? 100 : typeMax;
    this.cache = {};
    this.typeMax = typeMax;
  };
  StyleCache.prototype._validate = function(cacheEntry, properties, ownPropertyNames) {
    for (var idx = 0;idx < ownPropertyNames.length;idx++) {
      var pn = ownPropertyNames[idx];
      if (cacheEntry.properties[pn] !== properties[pn]) {
        return false;
      }
    }
    return true;
  };
  StyleCache.prototype.store = function(tagname, properties, styleElement, scopeSelector) {
    var list = this.cache[tagname] || [];
    list.push({properties:properties, styleElement:styleElement, scopeSelector:scopeSelector});
    if (list.length > this.typeMax) {
      list.shift();
    }
    this.cache[tagname] = list;
  };
  StyleCache.prototype.fetch = function(tagname, properties, ownPropertyNames) {
    var list = this.cache[tagname];
    if (!list) {
      return;
    }
    for (var idx = list.length - 1;idx >= 0;idx--) {
      var entry = list[idx];
      if (this._validate(entry, properties, ownPropertyNames)) {
        return entry;
      }
    }
  };
  var flush$1 = function() {
  };
  function getClasses(element) {
    var classes = [];
    if (element.classList) {
      classes = Array.from(element.classList);
    } else {
      if (element instanceof window["SVGElement"] && element.hasAttribute("class")) {
        classes = element.getAttribute("class").split(/\s+/);
      }
    }
    return classes;
  }
  function getCurrentScope(element) {
    var classes = getClasses(element);
    var idx = classes.indexOf(StyleTransformer$1.SCOPE_NAME);
    if (idx > -1) {
      return classes[idx + 1];
    }
    return "";
  }
  function handler(mxns) {
    for (var x = 0;x < mxns.length;x++) {
      var mxn = mxns[x];
      if (mxn.target === document.documentElement || mxn.target === document.head) {
        continue;
      }
      for (var i = 0;i < mxn.addedNodes.length;i++) {
        var n = mxn.addedNodes[i];
        if (n.nodeType !== Node.ELEMENT_NODE) {
          continue;
        }
        n = (n);
        var root = n.getRootNode();
        var currentScope = getCurrentScope(n);
        if (currentScope && root === n.ownerDocument) {
          StyleTransformer$1.dom(n, currentScope, true);
        } else {
          if (root.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
            var newScope = undefined;
            var host = (root).host;
            if (!host) {
              continue;
            }
            newScope = getIsExtends(host).is;
            if (currentScope === newScope) {
              continue;
            }
            if (currentScope) {
              StyleTransformer$1.dom(n, currentScope, true);
            }
            StyleTransformer$1.dom(n, newScope);
          }
        }
      }
    }
  }
  if (!nativeShadow) {
    var observer = new MutationObserver(handler);
    var start = function(node) {
      observer.observe(node, {childList:true, subtree:true});
    };
    var nativeCustomElements = window["customElements"] && !window["customElements"]["polyfillWrapFlushCallback"];
    if (nativeCustomElements) {
      start(document);
    } else {
      var delayedStart = function() {
        start(document.body);
      };
      if (window["HTMLImports"]) {
        window["HTMLImports"]["whenReady"](delayedStart);
      } else {
        requestAnimationFrame(function() {
          if (document.readyState === "loading") {
            var listener = function() {
              delayedStart();
              document.removeEventListener("readystatechange", listener);
            };
            document.addEventListener("readystatechange", listener);
          } else {
            delayedStart();
          }
        });
      }
    }
    flush$1 = function() {
      handler(observer.takeRecords());
    };
  }
  var templateMap = {};
  var CURRENT_VERSION = "_applyShimCurrentVersion";
  var NEXT_VERSION = "_applyShimNextVersion";
  var VALIDATING_VERSION = "_applyShimValidatingVersion";
  var promise = Promise.resolve();
  function invalidate(elementName) {
    var template = templateMap[elementName];
    if (template) {
      invalidateTemplate(template);
    }
  }
  function invalidateTemplate(template) {
    template[CURRENT_VERSION] = template[CURRENT_VERSION] || 0;
    template[VALIDATING_VERSION] = template[VALIDATING_VERSION] || 0;
    template[NEXT_VERSION] = (template[NEXT_VERSION] || 0) + 1;
  }
  function templateIsValid(template) {
    return template[CURRENT_VERSION] === template[NEXT_VERSION];
  }
  function templateIsValidating(template) {
    return !templateIsValid(template) && template[VALIDATING_VERSION] === template[NEXT_VERSION];
  }
  function startValidatingTemplate(template) {
    template[VALIDATING_VERSION] = template[NEXT_VERSION];
    if (!template._validating) {
      template._validating = true;
      promise.then(function() {
        template[CURRENT_VERSION] = template[NEXT_VERSION];
        template._validating = false;
      });
    }
  }
  var readyPromise = null;
  var whenReady = window["HTMLImports"] && window["HTMLImports"]["whenReady"] || null;
  var resolveFn;
  function documentWait(callback) {
    requestAnimationFrame(function() {
      if (whenReady) {
        whenReady(callback);
      } else {
        if (!readyPromise) {
          readyPromise = new Promise(function(resolve) {
            resolveFn = resolve;
          });
          if (document.readyState === "complete") {
            resolveFn();
          } else {
            document.addEventListener("readystatechange", function() {
              if (document.readyState === "complete") {
                resolveFn();
              }
            });
          }
        }
        readyPromise.then(function() {
          callback && callback();
        });
      }
    });
  }
  function updateNativeProperties(element, properties) {
    for (var p$47 in properties) {
      if (p$47 === null) {
        element.style.removeProperty(p$47);
      } else {
        element.style.setProperty(p$47, properties[p$47]);
      }
    }
  }
  function detectMixin(cssText) {
    var has = MIXIN_MATCH.test(cssText) || VAR_ASSIGN.test(cssText);
    MIXIN_MATCH.lastIndex = 0;
    VAR_ASSIGN.lastIndex = 0;
    return has;
  }
  var SEEN_MARKER = "__seenByShadyCSS";
  var CACHED_STYLE = "__shadyCSSCachedStyle";
  var transformFn = null;
  var validateFn = null;
  var CustomStyleInterface$1 = function() {
    this["customStyles"] = [];
    this["enqueued"] = false;
  };
  CustomStyleInterface$1.prototype.enqueueDocumentValidation = function() {
    if (this["enqueued"] || !validateFn) {
      return;
    }
    this["enqueued"] = true;
    documentWait(validateFn);
  };
  CustomStyleInterface$1.prototype.addCustomStyle = function(style) {
    if (!style[SEEN_MARKER]) {
      style[SEEN_MARKER] = true;
      this["customStyles"].push(style);
      this.enqueueDocumentValidation();
    }
  };
  CustomStyleInterface$1.prototype.getStyleForCustomStyle = function(customStyle) {
    if (customStyle[CACHED_STYLE]) {
      return customStyle[CACHED_STYLE];
    }
    var style;
    if (customStyle["getStyle"]) {
      style = customStyle["getStyle"]();
    } else {
      style = customStyle;
    }
    return style;
  };
  CustomStyleInterface$1.prototype.processStyles = function() {
    var cs = this["customStyles"];
    for (var i = 0;i < cs.length;i++) {
      var customStyle = cs[i];
      if (customStyle[CACHED_STYLE]) {
        continue;
      }
      var style = this.getStyleForCustomStyle(customStyle);
      if (style) {
        var styleToTransform = (style["__appliedElement"] || style);
        if (transformFn) {
          transformFn(styleToTransform);
        }
        customStyle[CACHED_STYLE] = styleToTransform;
      }
    }
    return cs;
  };
  CustomStyleInterface$1.prototype["addCustomStyle"] = CustomStyleInterface$1.prototype.addCustomStyle;
  CustomStyleInterface$1.prototype["getStyleForCustomStyle"] = CustomStyleInterface$1.prototype.getStyleForCustomStyle;
  CustomStyleInterface$1.prototype["processStyles"] = CustomStyleInterface$1.prototype.processStyles;
  Object.defineProperties(CustomStyleInterface$1.prototype, {"transformCallback":{get:function() {
    return transformFn;
  }, set:function(fn) {
    transformFn = fn;
  }}, "validateCallback":{get:function() {
    return validateFn;
  }, set:function(fn) {
    var needsEnqueue = false;
    if (!validateFn) {
      needsEnqueue = true;
    }
    validateFn = fn;
    if (needsEnqueue) {
      this.enqueueDocumentValidation();
    }
  }}});
  var styleCache = new StyleCache;
  var ScopingShim = function() {
    var $jscomp$this = this;
    this._scopeCounter = {};
    this._documentOwner = document.documentElement;
    var ast = new StyleNode;
    ast["rules"] = [];
    this._documentOwnerStyleInfo = StyleInfo.set(this._documentOwner, new StyleInfo(ast));
    this._elementsHaveApplied = false;
    this._applyShim = null;
    this._customStyleInterface = null;
    documentWait(function() {
      $jscomp$this._ensure();
    });
  };
  ScopingShim.prototype.flush = function() {
    flush$1();
  };
  ScopingShim.prototype._generateScopeSelector = function(name) {
    var id = this._scopeCounter[name] = (this._scopeCounter[name] || 0) + 1;
    return name + "-" + id;
  };
  ScopingShim.prototype.getStyleAst = function(style) {
    return rulesForStyle(style);
  };
  ScopingShim.prototype.styleAstToString = function(ast) {
    return toCssText(ast);
  };
  ScopingShim.prototype._gatherStyles = function(template) {
    var styles = template.content.querySelectorAll("style");
    var cssText = [];
    for (var i = 0;i < styles.length;i++) {
      var s = styles[i];
      cssText.push(s.textContent);
      s.parentNode.removeChild(s);
    }
    return cssText.join("").trim();
  };
  ScopingShim.prototype._getCssBuild = function(template) {
    var style = template.content.querySelector("style");
    if (!style) {
      return "";
    }
    return style.getAttribute("css-build") || "";
  };
  ScopingShim.prototype.prepareTemplate = function(template, elementName, typeExtension) {
    if (template._prepared) {
      return;
    }
    template._prepared = true;
    template.name = elementName;
    template.extends = typeExtension;
    templateMap[elementName] = template;
    var cssBuild = this._getCssBuild(template);
    var cssText = this._gatherStyles(template);
    var info = {is:elementName, extends:typeExtension, __cssBuild:cssBuild};
    if (!nativeShadow) {
      StyleTransformer$1.dom(template.content, elementName);
    }
    this._ensure();
    var hasMixins = detectMixin(cssText);
    var ast = parse(cssText);
    if (hasMixins && nativeCssVariables && this._applyShim) {
      this._applyShim["transformRules"](ast, elementName);
    }
    template["_styleAst"] = ast;
    template._cssBuild = cssBuild;
    var ownPropertyNames = [];
    if (!nativeCssVariables) {
      ownPropertyNames = StyleProperties$1.decorateStyles(template["_styleAst"], info);
    }
    if (!ownPropertyNames.length || nativeCssVariables) {
      var root = nativeShadow ? template.content : null;
      var placeholder = placeholderMap[elementName];
      var style = this._generateStaticStyle(info, template["_styleAst"], root, placeholder);
      template._style = style;
    }
    template._ownPropertyNames = ownPropertyNames;
  };
  ScopingShim.prototype._generateStaticStyle = function(info, rules, shadowroot, placeholder) {
    var cssText = StyleTransformer$1.elementStyles(info, rules);
    if (cssText.length) {
      return applyCss(cssText, info.is, shadowroot, placeholder);
    }
  };
  ScopingShim.prototype._prepareHost = function(host) {
    var $jscomp$destructuring$var4 = getIsExtends(host);
    var is = $jscomp$destructuring$var4.is;
    var typeExtension = $jscomp$destructuring$var4.typeExtension;
    var placeholder = placeholderMap[is];
    var template = templateMap[is];
    var ast;
    var ownStylePropertyNames;
    var cssBuild;
    if (template) {
      ast = template["_styleAst"];
      ownStylePropertyNames = template._ownPropertyNames;
      cssBuild = template._cssBuild;
    }
    return StyleInfo.set(host, new StyleInfo(ast, placeholder, ownStylePropertyNames, is, typeExtension, cssBuild));
  };
  ScopingShim.prototype._ensureApplyShim = function() {
    if (this._applyShim) {
      return;
    } else {
      if (window.ShadyCSS && window.ShadyCSS.ApplyShim) {
        this._applyShim = window.ShadyCSS.ApplyShim;
        this._applyShim["invalidCallback"] = invalidate;
      }
    }
  };
  ScopingShim.prototype._ensureCustomStyleInterface = function() {
    var $jscomp$this = this;
    if (this._customStyleInterface) {
      return;
    } else {
      if (window.ShadyCSS && window.ShadyCSS.CustomStyleInterface) {
        this._customStyleInterface = (window.ShadyCSS.CustomStyleInterface);
        this._customStyleInterface["transformCallback"] = function(style) {
          $jscomp$this.transformCustomStyleForDocument(style);
        };
        this._customStyleInterface["validateCallback"] = function() {
          requestAnimationFrame(function() {
            if ($jscomp$this._customStyleInterface["enqueued"] || $jscomp$this._elementsHaveApplied) {
              $jscomp$this.flushCustomStyles();
            }
          });
        };
      }
    }
  };
  ScopingShim.prototype._ensure = function() {
    this._ensureApplyShim();
    this._ensureCustomStyleInterface();
  };
  ScopingShim.prototype.flushCustomStyles = function() {
    this._ensure();
    if (!this._customStyleInterface) {
      return;
    }
    var customStyles = this._customStyleInterface["processStyles"]();
    if (!this._customStyleInterface["enqueued"]) {
      return;
    }
    if (!nativeCssVariables) {
      this._updateProperties(this._documentOwner, this._documentOwnerStyleInfo);
      this._applyCustomStyles(customStyles);
    } else {
      this._revalidateCustomStyleApplyShim(customStyles);
    }
    this._customStyleInterface["enqueued"] = false;
    if (this._elementsHaveApplied && !nativeCssVariables) {
      this.styleDocument();
    }
  };
  ScopingShim.prototype.styleElement = function(host, overrideProps) {
    var $jscomp$destructuring$var5 = getIsExtends(host);
    var is = $jscomp$destructuring$var5.is;
    var styleInfo = StyleInfo.get(host);
    if (!styleInfo) {
      styleInfo = this._prepareHost(host);
    }
    if (!this._isRootOwner(host)) {
      this._elementsHaveApplied = true;
    }
    if (overrideProps) {
      styleInfo.overrideStyleProperties = styleInfo.overrideStyleProperties || {};
      Object.assign(styleInfo.overrideStyleProperties, overrideProps);
    }
    if (!nativeCssVariables) {
      this._updateProperties(host, styleInfo);
      if (styleInfo.ownStylePropertyNames && styleInfo.ownStylePropertyNames.length) {
        this._applyStyleProperties(host, styleInfo);
      }
    } else {
      if (styleInfo.overrideStyleProperties) {
        updateNativeProperties(host, styleInfo.overrideStyleProperties);
      }
      var template = templateMap[is];
      if (!template && !this._isRootOwner(host)) {
        return;
      }
      if (template && template._style && !templateIsValid(template)) {
        if (!templateIsValidating(template)) {
          this._ensure();
          this._applyShim && this._applyShim["transformRules"](template["_styleAst"], is);
          template._style.textContent = StyleTransformer$1.elementStyles(host, styleInfo.styleRules);
          startValidatingTemplate(template);
        }
        if (nativeShadow) {
          var root = host.shadowRoot;
          if (root) {
            var style = root.querySelector("style");
            style.textContent = StyleTransformer$1.elementStyles(host, styleInfo.styleRules);
          }
        }
        styleInfo.styleRules = template["_styleAst"];
      }
    }
  };
  ScopingShim.prototype._styleOwnerForNode = function(node) {
    var root = node.getRootNode();
    var host = root.host;
    if (host) {
      if (StyleInfo.get(host)) {
        return host;
      } else {
        return this._styleOwnerForNode(host);
      }
    }
    return this._documentOwner;
  };
  ScopingShim.prototype._isRootOwner = function(node) {
    return node === this._documentOwner;
  };
  ScopingShim.prototype._applyStyleProperties = function(host, styleInfo) {
    var is = getIsExtends(host).is;
    var cacheEntry = styleCache.fetch(is, styleInfo.styleProperties, styleInfo.ownStylePropertyNames);
    var cachedScopeSelector = cacheEntry && cacheEntry.scopeSelector;
    var cachedStyle = cacheEntry ? cacheEntry.styleElement : null;
    var oldScopeSelector = styleInfo.scopeSelector;
    styleInfo.scopeSelector = cachedScopeSelector || this._generateScopeSelector(is);
    var style = StyleProperties$1.applyElementStyle(host, styleInfo.styleProperties, styleInfo.scopeSelector, cachedStyle);
    if (!nativeShadow) {
      StyleProperties$1.applyElementScopeSelector(host, styleInfo.scopeSelector, oldScopeSelector);
    }
    if (!cacheEntry) {
      styleCache.store(is, styleInfo.styleProperties, style, styleInfo.scopeSelector);
    }
    return style;
  };
  ScopingShim.prototype._updateProperties = function(host, styleInfo) {
    var owner = this._styleOwnerForNode(host);
    var ownerStyleInfo = StyleInfo.get(owner);
    var ownerProperties = ownerStyleInfo.styleProperties;
    var props = Object.create(ownerProperties || null);
    var hostAndRootProps = StyleProperties$1.hostAndRootPropertiesForScope(host, styleInfo.styleRules);
    var propertyData = StyleProperties$1.propertyDataFromStyles(ownerStyleInfo.styleRules, host);
    var propertiesMatchingHost = propertyData.properties;
    Object.assign(props, hostAndRootProps.hostProps, propertiesMatchingHost, hostAndRootProps.rootProps);
    this._mixinOverrideStyles(props, styleInfo.overrideStyleProperties);
    StyleProperties$1.reify(props);
    styleInfo.styleProperties = props;
  };
  ScopingShim.prototype._mixinOverrideStyles = function(props, overrides) {
    for (var p$48 in overrides) {
      var v = overrides[p$48];
      if (v || v === 0) {
        props[p$48] = v;
      }
    }
  };
  ScopingShim.prototype.styleDocument = function(properties) {
    this.styleSubtree(this._documentOwner, properties);
  };
  ScopingShim.prototype.styleSubtree = function(host, properties) {
    var root = host.shadowRoot;
    if (root || this._isRootOwner(host)) {
      this.styleElement(host, properties);
    }
    var shadowChildren = root && (root.children || root.childNodes);
    if (shadowChildren) {
      for (var i = 0;i < shadowChildren.length;i++) {
        var c = (shadowChildren[i]);
        this.styleSubtree(c);
      }
    } else {
      var children$49 = host.children || host.childNodes;
      if (children$49) {
        for (var i$50 = 0;i$50 < children$49.length;i$50++) {
          var c$51 = (children$49[i$50]);
          this.styleSubtree(c$51);
        }
      }
    }
  };
  ScopingShim.prototype._revalidateCustomStyleApplyShim = function(customStyles) {
    for (var i = 0;i < customStyles.length;i++) {
      var c = customStyles[i];
      var s = this._customStyleInterface["getStyleForCustomStyle"](c);
      if (s) {
        this._revalidateApplyShim(s);
      }
    }
  };
  ScopingShim.prototype._applyCustomStyles = function(customStyles) {
    for (var i = 0;i < customStyles.length;i++) {
      var c = customStyles[i];
      var s = this._customStyleInterface["getStyleForCustomStyle"](c);
      if (s) {
        StyleProperties$1.applyCustomStyle(s, this._documentOwnerStyleInfo.styleProperties);
      }
    }
  };
  ScopingShim.prototype.transformCustomStyleForDocument = function(style) {
    var $jscomp$this = this;
    var ast = rulesForStyle(style);
    forEachRule(ast, function(rule) {
      if (nativeShadow) {
        StyleTransformer$1.normalizeRootSelector(rule);
      } else {
        StyleTransformer$1.documentRule(rule);
      }
      if (nativeCssVariables) {
        $jscomp$this._ensure();
        $jscomp$this._applyShim && $jscomp$this._applyShim["transformRule"](rule);
      }
    });
    if (nativeCssVariables) {
      style.textContent = toCssText(ast);
    } else {
      this._documentOwnerStyleInfo.styleRules.rules.push(ast);
    }
  };
  ScopingShim.prototype._revalidateApplyShim = function(style) {
    if (nativeCssVariables && this._applyShim) {
      var ast = rulesForStyle(style);
      this._ensure();
      this._applyShim["transformRules"](ast);
      style.textContent = toCssText(ast);
    }
  };
  ScopingShim.prototype.getComputedStyleValue = function(element, property) {
    var value;
    if (!nativeCssVariables) {
      var styleInfo = StyleInfo.get(element) || StyleInfo.get(this._styleOwnerForNode(element));
      value = styleInfo.styleProperties[property];
    }
    value = value || window.getComputedStyle(element).getPropertyValue(property);
    return value ? value.trim() : "";
  };
  ScopingShim.prototype.setElementClass = function(element, classString) {
    var root = element.getRootNode();
    var classes = classString ? classString.split(/\s/) : [];
    var scopeName = root.host && root.host.localName;
    if (!scopeName) {
      var classAttr = element.getAttribute("class");
      if (classAttr) {
        var k$ = classAttr.split(/\s/);
        for (var i = 0;i < k$.length;i++) {
          if (k$[i] === StyleTransformer$1.SCOPE_NAME) {
            scopeName = k$[i + 1];
            break;
          }
        }
      }
    }
    if (scopeName) {
      classes.push(StyleTransformer$1.SCOPE_NAME, scopeName);
    }
    if (!nativeCssVariables) {
      var styleInfo = StyleInfo.get(element);
      if (styleInfo && styleInfo.scopeSelector) {
        classes.push(StyleProperties$1.XSCOPE_NAME, styleInfo.scopeSelector);
      }
    }
    setElementClassRaw(element, classes.join(" "));
  };
  ScopingShim.prototype._styleInfoForNode = function(node) {
    return StyleInfo.get(node);
  };
  ScopingShim.prototype["flush"] = ScopingShim.prototype.flush;
  ScopingShim.prototype["prepareTemplate"] = ScopingShim.prototype.prepareTemplate;
  ScopingShim.prototype["styleElement"] = ScopingShim.prototype.styleElement;
  ScopingShim.prototype["styleDocument"] = ScopingShim.prototype.styleDocument;
  ScopingShim.prototype["styleSubtree"] = ScopingShim.prototype.styleSubtree;
  ScopingShim.prototype["getComputedStyleValue"] = ScopingShim.prototype.getComputedStyleValue;
  ScopingShim.prototype["setElementClass"] = ScopingShim.prototype.setElementClass;
  ScopingShim.prototype["_styleInfoForNode"] = ScopingShim.prototype._styleInfoForNode;
  ScopingShim.prototype["transformCustomStyleForDocument"] = ScopingShim.prototype.transformCustomStyleForDocument;
  ScopingShim.prototype["getStyleAst"] = ScopingShim.prototype.getStyleAst;
  ScopingShim.prototype["styleAstToString"] = ScopingShim.prototype.styleAstToString;
  ScopingShim.prototype["flushCustomStyles"] = ScopingShim.prototype.flushCustomStyles;
  Object.defineProperties(ScopingShim.prototype, {"nativeShadow":{get:function() {
    return nativeShadow;
  }}, "nativeCss":{get:function() {
    return nativeCssVariables;
  }}});
  var scopingShim$1 = new ScopingShim;
  var ApplyShim;
  var CustomStyleInterface;
  if (window["ShadyCSS"]) {
    ApplyShim = window["ShadyCSS"]["ApplyShim"];
    CustomStyleInterface = window["ShadyCSS"]["CustomStyleInterface"];
  }
  window.ShadyCSS = {ScopingShim:scopingShim$1, prepareTemplate:function(template, elementName, elementExtends) {
    scopingShim$1.flushCustomStyles();
    scopingShim$1.prepareTemplate(template, elementName, elementExtends);
  }, styleSubtree:function(element, properties) {
    scopingShim$1.flushCustomStyles();
    scopingShim$1.styleSubtree(element, properties);
  }, styleElement:function(element) {
    scopingShim$1.flushCustomStyles();
    scopingShim$1.styleElement(element);
  }, styleDocument:function(properties) {
    scopingShim$1.flushCustomStyles();
    scopingShim$1.styleDocument(properties);
  }, getComputedStyleValue:function(element, property) {
    return scopingShim$1.getComputedStyleValue(element, property);
  }, nativeCss:nativeCssVariables, nativeShadow:nativeShadow};
  if (ApplyShim) {
    window.ShadyCSS.ApplyShim = ApplyShim;
  }
  if (CustomStyleInterface) {
    window.ShadyCSS.CustomStyleInterface = CustomStyleInterface;
  }
  (function() {
    var customElements = window["customElements"];
    var HTMLImports = window["HTMLImports"];
    window.WebComponents = window.WebComponents || {};
    if (customElements && customElements["polyfillWrapFlushCallback"]) {
      var flushCallback;
      var runAndClearCallback = function runAndClearCallback() {
        if (flushCallback) {
          var cb = flushCallback;
          flushCallback = null;
          cb();
          return true;
        }
      };
      var origWhenReady = HTMLImports["whenReady"];
      customElements["polyfillWrapFlushCallback"](function(cb) {
        flushCallback = cb;
        origWhenReady(runAndClearCallback);
      });
      HTMLImports["whenReady"] = function(cb) {
        origWhenReady(function() {
          if (runAndClearCallback()) {
            HTMLImports["whenReady"](cb);
          } else {
            cb();
          }
        });
      };
    }
    HTMLImports["whenReady"](function() {
      requestAnimationFrame(function() {
        window.WebComponents.ready = true;
        document.dispatchEvent(new CustomEvent("WebComponentsReady", {bubbles:true}));
      });
    });
  })();
  (function() {
    var style = document.createElement("style");
    style.textContent = "" + "body {" + "transition: opacity ease-in 0.2s;" + " } \n" + "body[unresolved] {" + "opacity: 0; display: block; overflow: hidden; position: relative;" + " } \n";
    var head = document.querySelector("head");
    head.insertBefore(style, head.firstChild);
  })();
})();
}).call(this);

//# sourceMappingURL=webcomponents-lite.js.map
