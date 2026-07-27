"use strict";

(() => {
  const STYLE_ID = "abyss-spotlight-frame-style";
  const FRAME_CLASS = "featurediframe";
  const spotlightUrl = document.currentScript?.src
    ? new URL("spotlight.html", document.currentScript.src).href
    : "ui/spotlight.html";
  let lifecycleObserver = null;
  let lifecycleCleanup = () => {};
  let currentIndexPage = null;
  let currentHomeTab = null;
  let currentFavoritesTab = null;
  let currentIframe = null;

  function installFrameStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .${FRAME_CLASS} { width:100%;display:block;border:0;margin:0;padding:0;height:70vh;min-height:420px;max-height:680px; }
      @media (min-width:1400px) { .${FRAME_CLASS} { height:72vh;max-height:760px; } }
      @media (min-width:1920px) { .${FRAME_CLASS} { height:68vh;max-height:860px; } }
      @media (max-width:1024px) and (orientation:portrait) { .${FRAME_CLASS} { height:90vh;min-height:320px;max-height:720px; } }
      @media (max-width:1024px) and (orientation:landscape) { .${FRAME_CLASS} { height:100vh;min-height:280px;max-height:420px; } }
      @media (max-width:600px) and (orientation:portrait) { .${FRAME_CLASS} { height:90vh;min-height:260px;max-height:720px; } }
      @media (max-width:900px) and (orientation:landscape) and (max-height:500px) { .${FRAME_CLASS} { height:100vh;min-height:200px; } }
    `;
    document.head.appendChild(style);
  }

  function forceDarkTheme() {
    Object.keys(localStorage)
      .filter(key => key.endsWith("-appTheme"))
      .forEach(key => localStorage.setItem(key, "dark"));
    if (Storage.prototype.setItem.__abyssWrapped) return;
    const setItem = Storage.prototype.setItem;
    const wrapped = function (key, value) {
      setItem.call(this, key, String(key).endsWith("-appTheme") ? "dark" : value);
    };
    wrapped.__abyssWrapped = true;
    Storage.prototype.setItem = wrapped;
  }

  function connectLifecycle(indexPage, homeTab, favoritesTab, iframe) {
    lifecycleCleanup();
    let lastAction = "";
    const sync = () => {
      const favoritesActive = favoritesTab?.classList.contains("is-active");
      const pageHidden = indexPage.classList.contains("hide") || indexPage.hidden;
      const homeActive = homeTab.classList.contains("is-active");
      const active = !document.hidden && !pageHidden && homeActive && !favoritesActive;
      const action = active ? "resume" : "pause";
      iframe.style.display = active ? "block" : "none";
      if (action !== lastAction && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: "abyss-spotlight", action }, window.location.origin);
        lastAction = action;
      }
    };

    lifecycleObserver = new MutationObserver(sync);
    lifecycleObserver.observe(indexPage, { attributes: true, attributeFilter: ["class", "hidden"] });
    lifecycleObserver.observe(homeTab, { attributes: true, attributeFilter: ["class"] });
    if (favoritesTab) lifecycleObserver.observe(favoritesTab, { attributes: true, attributeFilter: ["class"] });
    const handleLoad = () => { lastAction = ""; sync(); };
    iframe.addEventListener("load", handleLoad);
    document.addEventListener("visibilitychange", sync);
    lifecycleCleanup = () => {
      lifecycleObserver?.disconnect();
      iframe.removeEventListener("load", handleLoad);
      document.removeEventListener("visibilitychange", sync);
    };
    sync();
  }

  function installSpotlight() {
    const indexPage = document.getElementById("indexPage");
    const homeTab = document.getElementById("homeTab");
    if (!indexPage || !homeTab) return false;
    const favoritesTab = document.getElementById("favoritesTab");
    installFrameStyle();
    let iframe = homeTab.querySelector(`.${FRAME_CLASS}`);
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.className = FRAME_CLASS;
      iframe.src = spotlightUrl;
      iframe.title = "Abyss Spotlight";
      const sections = homeTab.querySelector(".sections");
      homeTab.insertBefore(iframe, sections || homeTab.firstChild);
    }
    if (indexPage !== currentIndexPage || homeTab !== currentHomeTab || favoritesTab !== currentFavoritesTab || iframe !== currentIframe) {
      currentIndexPage = indexPage;
      currentHomeTab = homeTab;
      currentFavoritesTab = favoritesTab;
      currentIframe = iframe;
      connectLifecycle(indexPage, homeTab, favoritesTab, iframe);
    }
    return true;
  }

  function boot() {
    forceDarkTheme();
    let installScheduled = false;
    const scheduleInstall = () => {
      if (currentIndexPage?.isConnected && currentHomeTab?.isConnected && currentIframe?.isConnected && (!currentFavoritesTab || currentFavoritesTab.isConnected)) return;
      if (installScheduled) return;
      installScheduled = true;
      requestAnimationFrame(() => {
        installScheduled = false;
        installSpotlight();
      });
    };
    const observer = new MutationObserver(() => {
      scheduleInstall();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    installSpotlight();
    window.addEventListener("pagehide", () => {
      observer.disconnect();
      lifecycleCleanup();
    }, { once: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
