"use strict";

(function () {
  var STYLE_ID = "abyss-spotlight-frame-style";
  var FRAME_CLASS = "featurediframe";

  var spotlightUrl = "ui/spotlight.html";
  try {
    var cs = document.currentScript;
    if (cs && cs.src) {
      spotlightUrl = new URL("spotlight.html", cs.src).href;
    }
  } catch (e) {
    // Fall back to the relative default above.
  }

  var lifecycleObserver = null;
  var lifecycleCleanup = function () {};
  var currentIndexPage = null;
  var currentHomeTab = null;
  var currentFavoritesTab = null;
  var currentIframe = null;

  function safe(fn) {
    // Runs fn and swallows/reports any error so one failure never kills the loader.
    try {
      fn();
    } catch (err) {
      try {
        console.warn("[abyss-spotlight]", err);
      } catch (e2) {
        // console unavailable, nothing more we can do
      }
    }
  }

  function installFrameStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      "#indexPage:has(." + FRAME_CLASS + ") { padding: 0 !important; }" +
      "." + FRAME_CLASS + " { width:100%;display:block;border:0;margin:0;padding:0;height:70vh;min-height:420px;max-height:680px; }" +
      "@media (min-width:1400px) { ." + FRAME_CLASS + " { height:72vh;max-height:760px; } }" +
      "@media (min-width:1920px) { ." + FRAME_CLASS + " { height:68vh;max-height:860px; } }" +
      "@media (max-width:1024px) and (orientation:portrait) and (hover:none) and (pointer:coarse) { ." + FRAME_CLASS + " { height:90vh;min-height:320px;max-height:720px; } }" +
      "@media (max-width:1024px) and (orientation:landscape) and (hover:none) and (pointer:coarse) { ." + FRAME_CLASS + " { height:100vh;min-height:280px;max-height:420px; } }" +
      "@media (max-width:600px) and (orientation:portrait) and (hover:none) and (pointer:coarse) { ." + FRAME_CLASS + " { height:90vh;min-height:260px;max-height:720px; } }" +
      "@media (max-width:900px) and (orientation:landscape) and (max-height:500px) and (hover:none) and (pointer:coarse) { ." + FRAME_CLASS + " { height:100vh;min-height:200px; } }";
    document.head.appendChild(style);
  }

  function forceDarkTheme() {
    if (typeof Storage === "undefined" || !window.localStorage) return;

    var keys = [];
    try {
      keys = Object.keys(localStorage);
    } catch (e) {
      return; // localStorage inaccessible (privacy mode, sandboxed webview, etc.)
    }

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (key && key.indexOf("-appTheme", key.length - "-appTheme".length) !== -1) {
        safe(function (k) {
          localStorage.setItem(k, "dark");
        }.bind(null, key));
      }
    }

    safe(function () {
      if (Storage.prototype.setItem.__abyssWrapped) return;
      var setItem = Storage.prototype.setItem;
      var wrapped = function (key, value) {
        var isTheme = typeof key === "string" && key.indexOf("-appTheme", key.length - "-appTheme".length) !== -1;
        setItem.call(this, key, isTheme ? "dark" : value);
      };
      wrapped.__abyssWrapped = true;
      Storage.prototype.setItem = wrapped;
    });
  }

  function postToFrame(iframe, action) {
    if (!iframe || !iframe.contentWindow) return;
    var targetOrigin = "*";
    try {
      if (window.location && window.location.origin && window.location.origin !== "null") {
        targetOrigin = window.location.origin;
      }
    } catch (e) {
      // keep "*" fallback
    }
    safe(function () {
      iframe.contentWindow.postMessage({ type: "abyss-spotlight", action: action }, targetOrigin);
    });
  }

  function isRouteVisible(indexPage, homeTab) {
    if (!indexPage || !indexPage.isConnected || !homeTab || !homeTab.isConnected) return false;
    if (document.hidden) return false;
    if (indexPage.classList.contains("hide") || indexPage.hidden) return false;
    var style = window.getComputedStyle(homeTab);
    if (style.display === "none" || style.visibility === "hidden") return false;
    return homeTab.offsetParent !== null || homeTab.getClientRects().length > 0;
  }

  function connectLifecycle(indexPage, homeTab, favoritesTab, iframe) {
    safe(lifecycleCleanup);
    var lastAction = "";

    var sync = function () {
      safe(function () {
        var favoritesActive = !!(favoritesTab && favoritesTab.classList && favoritesTab.classList.contains("is-active"));
        var active = isRouteVisible(indexPage, homeTab) && !favoritesActive;
        var action = active ? "resume" : "pause";
        iframe.style.display = active ? "block" : "none";
        if (action !== lastAction) {
          postToFrame(iframe, action);
          lastAction = action;
        }
      });
    };

    if (typeof MutationObserver === "function") {
      safe(function () {
        lifecycleObserver = new MutationObserver(sync);
        lifecycleObserver.observe(indexPage, { attributes: true, attributeFilter: ["class", "hidden"] });
        lifecycleObserver.observe(homeTab, { attributes: true, attributeFilter: ["class", "style"] });
        if (favoritesTab) lifecycleObserver.observe(favoritesTab, { attributes: true, attributeFilter: ["class"] });
      });
    }

    var handleLoad = function () {
      lastAction = "";
      sync();
    };
    iframe.addEventListener("load", handleLoad);
    document.addEventListener("visibilitychange", sync);

    lifecycleCleanup = function () {
      if (lifecycleObserver) safe(function () { lifecycleObserver.disconnect(); });
      iframe.removeEventListener("load", handleLoad);
      document.removeEventListener("visibilitychange", sync);
    };

    sync();

    return sync;
  }

  var currentSync = null;

  function installSpotlight() {
    var installed = false;
    safe(function () {
      var indexPage = document.getElementById("indexPage");
      var homeTab = document.getElementById("homeTab");
      if (!indexPage || !homeTab) return;
      var favoritesTab = document.getElementById("favoritesTab");

      installFrameStyle();

      var iframe = homeTab.querySelector ? homeTab.querySelector("." + FRAME_CLASS) : null;
      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.className = FRAME_CLASS;
        iframe.src = spotlightUrl;
        iframe.title = "Abyss Spotlight";
        var sections = homeTab.querySelector ? homeTab.querySelector(".sections") : null;
        homeTab.insertBefore(iframe, sections || homeTab.firstChild);
      }

      if (
        indexPage !== currentIndexPage ||
        homeTab !== currentHomeTab ||
        favoritesTab !== currentFavoritesTab ||
        iframe !== currentIframe
      ) {
        currentIndexPage = indexPage;
        currentHomeTab = homeTab;
        currentFavoritesTab = favoritesTab;
        currentIframe = iframe;
        currentSync = connectLifecycle(indexPage, homeTab, favoritesTab, iframe);
      }
      installed = true;
    });
    return installed;
  }

  function boot() {
    safe(forceDarkTheme);

    var installScheduled = false;

    var scheduleInstall = function () {
      var alreadyGood =
        currentIndexPage && currentIndexPage.isConnected &&
        currentHomeTab && currentHomeTab.isConnected &&
        currentIframe && currentIframe.isConnected &&
        (!currentFavoritesTab || currentFavoritesTab.isConnected);
      if (alreadyGood) return;
      if (installScheduled) return;
      installScheduled = true;

      var run = function () {
        installScheduled = false;
        installSpotlight();
      };

      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(run);
      } else {
        setTimeout(run, 16);
      }
    };

    if (typeof MutationObserver === "function" && document.body) {
      safe(function () {
        var observer = new MutationObserver(function () {
          scheduleInstall();
        });
        observer.observe(document.body, { childList: true, subtree: true });
      });
    }

    // Safety-net poll: re-verifies element connectivity AND forces a fresh
    // visibility sync every 2s, so any stale is-active/hide state left over
    // from an SPA nav-button route change self-corrects without needing a
    // hard refresh.
    setInterval(function () {
      scheduleInstall();
      if (currentSync) safe(currentSync);
    }, 2000);

    installSpotlight();
  }

  function start() {
    safe(function () {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
      } else {
        boot();
      }
    });
  }

  start();
})();