"use strict";
(self.webpackChunk = self.webpackChunk || []).push([[8372], {
  5939: function (a, e, t) {
    t.r(e);
    e.default = `
<div id="indexPage" style="outline:0;padding:0!important" data-role="page" data-dom-cache="true"
  class="page homePage libraryPage allLibraryPage backdropPage pageWithAbsoluteTabs withTabs"
  data-backdroptype="movie,series,book">

  <style>
    .featurediframe {
      width: 100%; display: block; border: 0; margin: 0; padding: 0;
      height: 70vh; min-height: 420px; max-height: 680px;
    }
    @media (min-width: 1400px) {
      .featurediframe { height: 72vh; max-height: 760px; }
    }
    @media (min-width: 1920px) {
      .featurediframe { height: 68vh; max-height: 860px; }
    }
    @media (max-width: 1024px) and (orientation: portrait) {
      .featurediframe { height: 90vh; min-height: 320px; max-height: 720px; }
    }
    @media (max-width: 1024px) and (orientation: landscape) {
      .featurediframe { height: 100vh; min-height: 280px; max-height: 420px; }
    }
    @media (max-width: 600px) and (orientation: portrait) {
      .featurediframe { height: 90vh; min-height: 260px; max-height: 720px; }
    }
    @media (max-width: 900px) and (orientation: landscape) and (max-height: 500px) {
      .featurediframe { height: 100vh; min-height: 200px;}
    }
  </style>

  <div class="tabContent pageTabContent" id="homeTab" data-index="0">
    <iframe class="featurediframe" src="ui/spotlight.html" title="Abyss Spotlight"></iframe>
    <div class="sections"></div>
  </div>

  <div class="tabContent pageTabContent" id="favoritesTab" data-index="1">
    <div class="sections"></div>
  </div>

</div>`;
  }
}]);

// Force dark theme
(function () {
  Object.keys(localStorage)
    .filter(k => k.endsWith('-appTheme'))
    .forEach(k => localStorage.setItem(k, 'dark'));

  const _setItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function (key, value) {
    if (key.endsWith('-appTheme')) value = 'dark';
    _setItem(key, value);
  };
})();

function setupAbyssSpotlightLifecycle() {
  const indexPage = document.getElementById("indexPage");
  const homeTab = document.getElementById("homeTab");
  const favoritesTab = document.getElementById("favoritesTab");
  const iframe = homeTab?.querySelector(".featurediframe");
  if (!indexPage || !homeTab || !iframe) return;

  let lastAction = "";
  const sync = () => {
    const favoritesActive = favoritesTab?.classList.contains("is-active");
    const pageHidden = indexPage.classList.contains("hide") || indexPage.hidden;
    const active = !document.hidden && !pageHidden && !favoritesActive;
    const action = active ? "resume" : "pause";
    iframe.style.display = active ? "block" : "none";
    if (action !== lastAction && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: "abyss-spotlight", action }, window.location.origin);
      lastAction = action;
    }
  };

  const observer = new MutationObserver(sync);
  observer.observe(indexPage, { attributes: true, attributeFilter: ["class", "hidden"] });
  observer.observe(homeTab, { attributes: true, attributeFilter: ["class"] });
  if (favoritesTab) observer.observe(favoritesTab, { attributes: true, attributeFilter: ["class"] });
  iframe.addEventListener("load", () => { lastAction = ""; sync(); });
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
  sync();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupAbyssSpotlightLifecycle, { once: true });
} else {
  setupAbyssSpotlightLifecycle();
}
