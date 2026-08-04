(function () {
  function rootPrefix() {
    return window.location.pathname.includes("/pec-training/")
      || window.location.pathname.includes("/tutorials/")
      || window.location.pathname.includes("/previews/")
      ? "../"
      : "./";
  }

  function loadAnalyticsTracker() {
    if (window.MALAnalytics || document.querySelector("script[data-mal-analytics]")) return;
    const script = document.createElement("script");
    script.src = `${rootPrefix()}analytics-tracker.js?v=20260804-d1`;
    script.dataset.malAnalytics = "true";
    document.head.append(script);
  }

  function homePath() {
    return `${rootPrefix()}index.html`;
  }

  function addSiteNav() {
    if (document.querySelector(".training-site-nav")) return;

    const prefix = rootPrefix();
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = `${prefix}editorial-system.css?v=20260730-ai-gods-contrast`;
    document.head.append(stylesheet);

    const links = [
      ["GitHub 熱門 Skill", `${prefix}github-skills.html`],
      ["AI Agent 熱門新聞", `${prefix}ai-agent-daily.html`],
      ["Local Agent 熱門", `${prefix}local-agent-radar.html`],
      ["OpenClaw 使用案例", `${prefix}openclaw-cases.html`],
      ["YouTube AI 影片精選", `${prefix}ai-video-library.html`],
      ["Hermes Agent 資料庫", `${prefix}hermes-agent-resources.html`],
      ["AI 大神", `${prefix}ai-gods.html`],
      ["所有教材", `${prefix}tutorial-library.html`],
    ];

    const nav = document.createElement("header");
    nav.className = "training-site-nav";
    nav.setAttribute("aria-label", "網站導覽");

    const brand = document.createElement("a");
    brand.className = "training-site-brand";
    brand.href = homePath();
    brand.textContent = "Michael Agent Lab";

    const primary = document.createElement("nav");
    primary.className = "training-primary-links";
    primary.setAttribute("aria-label", "主要分頁");

    const home = document.createElement("a");
    home.href = homePath();
    home.textContent = "Home";

    const learning = document.createElement("a");
    learning.href = `${prefix}learning.html`;
    learning.textContent = "Learning";

    const explore = document.createElement("details");
    explore.className = "training-explore-menu";
    const summary = document.createElement("summary");
    summary.textContent = "Explore";
    summary.setAttribute("aria-label", "開啟分頁選單");
    const panel = document.createElement("div");
    panel.className = "training-explore-panel";
    for (const [label, href] of links) {
      const item = document.createElement("a");
      item.href = href;
      item.textContent = label;
      if (new URL(item.href, window.location.href).pathname === window.location.pathname) {
        item.setAttribute("aria-current", "page");
      }
      panel.append(item);
    }
    explore.append(summary, panel);

    const about = document.createElement("a");
    about.href = `${prefix}about.html`;
    about.textContent = "About";
    primary.append(home, learning, explore, about);

    nav.append(brand, primary);

    const mountNav = () => {
      if (document.querySelector(".training-site-nav")) return;
      document.body.classList.add("site-editorial-system");
      if (prefix === "../") {
        document.body.classList.add("lesson-editorial-page");
      }
      document.body.prepend(nav);
    };

    if (document.body) {
      mountNav();
    } else {
      document.addEventListener("DOMContentLoaded", mountNav, { once: true });
    }
  }

  addSiteNav();
  loadAnalyticsTracker();
}());
