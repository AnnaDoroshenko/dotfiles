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

Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
'use strict';(function() {
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
          var content$0 = n.textContent + ("\n//# sourceURL=" + url + num + ".js\n");
          n.setAttribute("src", "data:text/javascript;charset=utf-8," + encodeURIComponent(content$0));
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

//# sourceMappingURL=webcomponents-hi.js.map
