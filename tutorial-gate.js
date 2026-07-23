(function () {
  const identityKey = "pecTrainingVisitor";
  const returnToKey = "pecTrainingReturnTo";
  const trackingEndpoint = window.TUTORIAL_CONFIG?.trackingEndpoint || "";

  function readVisitor() {
    try {
      const visitor = JSON.parse(localStorage.getItem(identityKey) || "null");
      if (!visitor?.name || !visitor?.department) return null;
      return visitor;
    } catch {
      return null;
    }
  }

  function formatLocalTime(date = new Date()) {
    return new Intl.DateTimeFormat("zh-Hant-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  }

  function trackTutorialView(visitor) {
    if (!trackingEndpoint) return;
    if (["localhost", "127.0.0.1"].includes(window.location.hostname)) return;
    const payload = {
      type: "tutorial_view",
      occurredAt: new Date().toISOString(),
      occurredAtLocal: formatLocalTime(),
      visitor,
      page: {
        title: document.title,
        url: window.location.href,
        path: window.location.pathname,
      },
      detail: {
        referrer: document.referrer || "",
      },
      userAgent: navigator.userAgent,
      language: navigator.language,
    };

    try {
      fetch(trackingEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Tracking must never block the lesson page.
    }
  }

  function rootPrefix() {
    return window.location.pathname.includes("/pec-training/")
      || window.location.pathname.includes("/tutorials/")
      || window.location.pathname.includes("/previews/")
      ? "../"
      : "./";
  }

  function homePath() {
    return `${rootPrefix()}index.html`;
  }

  function addSiteNav() {
    if (document.querySelector(".training-site-nav")) return;

    const style = document.createElement("style");
    style.textContent = `
      .training-site-nav {
        position: fixed;
        top: 14px;
        right: 14px;
        z-index: 1000;
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif;
      }
      .training-site-nav a,
      .training-site-nav button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 38px;
        padding: 0 14px;
        border: 1px solid rgba(220, 235, 242, 0.22);
        border-radius: 8px;
        background: rgba(7, 11, 14, 0.84);
        color: #f4f7f8;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.26);
        backdrop-filter: blur(14px);
        font: 900 13px/1 system-ui, -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif;
        text-decoration: none;
      }
      .training-site-nav a:hover,
      .training-site-nav button:hover,
      .training-site-nav button[aria-expanded="true"] {
        border-color: rgba(40, 198, 226, 0.52);
        color: #28c6e2;
      }
      .training-site-nav button {
        cursor: pointer;
      }
      .training-site-menu-wrap {
        position: relative;
      }
      .training-site-menu {
        position: absolute;
        right: 0;
        top: 46px;
        display: grid;
        gap: 6px;
        width: min(320px, calc(100vw - 28px));
        max-height: min(70vh, 520px);
        overflow: auto;
        padding: 10px;
        border: 1px solid rgba(220, 235, 242, 0.18);
        border-radius: 10px;
        background: rgba(7, 11, 14, 0.94);
        box-shadow: 0 22px 58px rgba(0, 0, 0, 0.34);
        backdrop-filter: blur(16px);
      }
      .training-site-menu[hidden] {
        display: none;
      }
      .training-site-menu a {
        justify-content: flex-start;
        min-height: 36px;
        padding: 0 11px;
        box-shadow: none;
        background: rgba(220, 235, 242, 0.06);
      }
      @media (max-width: 640px) {
        .training-site-nav {
          top: 10px;
          right: 10px;
        }
        .training-site-nav a,
        .training-site-nav button {
          min-height: 34px;
          padding: 0 11px;
          font-size: 12px;
        }
        .training-site-menu {
          top: 42px;
        }
      }
    `;

    const prefix = rootPrefix();
    const links = [
      ["教材入口", `${prefix}tutorial-library.html`],
      ["GitHub", `${prefix}github-skills.html`],
      ["Hermes Agent 熱門 Skill", `${prefix}github-skills.html`],
      ["Hermes Agent 熱門新聞", `${prefix}ai-agent-daily.html`],
      ["Hermes Agent 熱門 Logo", `${prefix}local-agent-radar.html`],
      ["OpenCloud 使用案例", `${prefix}openclaw-cases.html`],
      ["YouTube AI 影片精選", `${prefix}ai-video-library.html`],
      ["Hermes Agent 學習資料庫", `${prefix}hermes-agent-resources.html`],
      ["AI 大神", `${prefix}ai-gods.html`],
    ];

    const nav = document.createElement("nav");
    nav.className = "training-site-nav";
    nav.setAttribute("aria-label", "網站分頁入口");

    const link = document.createElement("a");
    link.className = "training-home-button";
    link.href = homePath();
    link.textContent = "回首頁";

    const menuWrap = document.createElement("div");
    menuWrap.className = "training-site-menu-wrap";
    const button = document.createElement("button");
    button.className = "training-site-menu-button";
    button.type = "button";
    button.setAttribute("aria-expanded", "false");
    button.textContent = "分頁入口";

    const menu = document.createElement("div");
    menu.className = "training-site-menu";
    menu.hidden = true;
    for (const [label, href] of links) {
      const item = document.createElement("a");
      item.href = href;
      item.textContent = label;
      menu.append(item);
    }

    button.addEventListener("click", () => {
      menu.hidden = !menu.hidden;
      button.setAttribute("aria-expanded", String(!menu.hidden));
    });
    document.addEventListener("click", (event) => {
      if (menu.hidden || menuWrap.contains(event.target)) return;
      menu.hidden = true;
      button.setAttribute("aria-expanded", "false");
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      menu.hidden = true;
      button.setAttribute("aria-expanded", "false");
    });

    menuWrap.append(button, menu);
    nav.append(link, menuWrap);

    document.head.append(style);
    if (document.body) {
      document.body.append(nav);
    } else {
      document.addEventListener("DOMContentLoaded", () => document.body.append(nav), { once: true });
    }
  }

  addSiteNav();

  const visitor = readVisitor();
  if (!visitor) {
    sessionStorage.setItem(returnToKey, window.location.href);
    window.location.replace(homePath());
    return;
  }

  trackTutorialView(visitor);
}());
