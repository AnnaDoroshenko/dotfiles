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
          var importNode = (element.import);
          if (importNode instanceof Node && !visitedImports.has(importNode)) {
            visitedImports.add(importNode);
            for (var child = importNode.firstChild;child;child = child.nextSibling) {
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
          for (var child$1 = shadowRoot.firstChild;child$1;child$1 = child$1.nextSibling) {
            walkDeepDescendantElements(child$1, callback, visitedImports);
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
        var importNode = (element.import);
        if (importNode instanceof Node && importNode.readyState === "complete") {
          importNode.__CE_isImportDocument = true;
          importNode.__CE_hasRegistry = true;
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
    for (var i$2 = 0;i$2 < elements.length;i$2++) {
      this.upgradeElement(elements[i$2]);
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
          var element$3 = Native.Document_createElement.call(document, definition.localName);
          Object.setPrototypeOf(element$3, constructor.prototype);
          element$3.__CE_state = CustomElementState.custom;
          element$3.__CE_definition = definition;
          internals.patch(element$3);
          return element$3;
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
        var nodes$4 = $jscomp$restParams;
        var connectedBefore = (nodes$4.filter(function(node) {
          return node instanceof Node && isConnected(node);
        }));
        builtIn.prepend.apply(this, nodes$4);
        for (var i = 0;i < connectedBefore.length;i++) {
          internals.disconnectTree(connectedBefore[i]);
        }
        if (isConnected(this)) {
          for (var i$5 = 0;i$5 < nodes$4.length;i$5++) {
            var node = nodes$4[i$5];
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
        var nodes$6 = $jscomp$restParams;
        var connectedBefore = (nodes$6.filter(function(node) {
          return node instanceof Node && isConnected(node);
        }));
        builtIn.append.apply(this, nodes$6);
        for (var i = 0;i < connectedBefore.length;i++) {
          internals.disconnectTree(connectedBefore[i]);
        }
        if (isConnected(this)) {
          for (var i$7 = 0;i$7 < nodes$6.length;i$7++) {
            var node = nodes$6[i$7];
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
        var nativeResult$8 = Native.Node_insertBefore.call(this, node, refNode);
        if (isConnected(this)) {
          for (var i = 0;i < insertedNodes.length;i++) {
            internals.connectTree(insertedNodes[i]);
          }
        }
        return nativeResult$8;
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
        var nativeResult$9 = Native.Node_appendChild.call(this, node);
        if (isConnected(this)) {
          for (var i = 0;i < insertedNodes.length;i++) {
            internals.connectTree(insertedNodes[i]);
          }
        }
        return nativeResult$9;
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
        var nativeResult$10 = Native.Node_replaceChild.call(this, nodeToInsert, nodeToRemove);
        if (isConnected(this)) {
          internals.disconnectTree(nodeToRemove);
          for (var i = 0;i < insertedNodes.length;i++) {
            internals.connectTree(insertedNodes[i]);
          }
        }
        return nativeResult$10;
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
          var childNodes = this.childNodes;
          var childNodesLength = childNodes.length;
          if (childNodesLength > 0 && isConnected(this)) {
            removedNodes = new Array(childNodesLength);
            for (var i = 0;i < childNodesLength;i++) {
              removedNodes[i] = childNodes[i];
            }
          }
        }
        baseDescriptor.set.call(this, assignedValue);
        if (removedNodes) {
          for (var i$11 = 0;i$11 < removedNodes.length;i$11++) {
            internals.disconnectTree(removedNodes[i$11]);
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
        var nodes$12 = $jscomp$restParams;
        var connectedBefore = (nodes$12.filter(function(node) {
          return node instanceof Node && isConnected(node);
        }));
        builtIn.before.apply(this, nodes$12);
        for (var i = 0;i < connectedBefore.length;i++) {
          internals.disconnectTree(connectedBefore[i]);
        }
        if (isConnected(this)) {
          for (var i$13 = 0;i$13 < nodes$12.length;i$13++) {
            var node = nodes$12[i$13];
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
        var nodes$14 = $jscomp$restParams;
        var connectedBefore = (nodes$14.filter(function(node) {
          return node instanceof Node && isConnected(node);
        }));
        builtIn.after.apply(this, nodes$14);
        for (var i = 0;i < connectedBefore.length;i++) {
          internals.disconnectTree(connectedBefore[i]);
        }
        if (isConnected(this)) {
          for (var i$15 = 0;i$15 < nodes$14.length;i$15++) {
            var node = nodes$14[i$15];
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
        var nodes$16 = $jscomp$restParams;
        var connectedBefore = (nodes$16.filter(function(node) {
          return node instanceof Node && isConnected(node);
        }));
        var wasConnected = isConnected(this);
        builtIn.replaceWith.apply(this, nodes$16);
        for (var i = 0;i < connectedBefore.length;i++) {
          internals.disconnectTree(connectedBefore[i]);
        }
        if (wasConnected) {
          internals.disconnectTree(this);
          for (var i$17 = 0;i$17 < nodes$16.length;i$17++) {
            var node = nodes$16[i$17];
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

//# sourceMappingURL=webcomponents-hi-ce.js.map
