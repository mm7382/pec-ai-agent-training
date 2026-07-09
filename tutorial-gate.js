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

  function homePath() {
    return window.location.pathname.includes("/pec-training/")
      || window.location.pathname.includes("/tutorials/")
      || window.location.pathname.includes("/previews/")
      ? "../index.html"
      : "./index.html";
  }

  function addHomeButton() {
    if (document.querySelector(".training-home-button")) return;

    const style = document.createElement("style");
    style.textContent = `
      .training-home-button {
        position: fixed;
        top: 14px;
        right: 14px;
        z-index: 1000;
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
      .training-home-button:hover {
        border-color: rgba(40, 198, 226, 0.52);
        color: #28c6e2;
      }
      @media (max-width: 640px) {
        .training-home-button {
          top: 10px;
          right: 10px;
          min-height: 34px;
          padding: 0 11px;
          font-size: 12px;
        }
      }
    `;

    const link = document.createElement("a");
    link.className = "training-home-button";
    link.href = homePath();
    link.textContent = "回首頁";

    document.head.append(style);
    if (document.body) {
      document.body.append(link);
    } else {
      document.addEventListener("DOMContentLoaded", () => document.body.append(link), { once: true });
    }
  }

  addHomeButton();

  const visitor = readVisitor();
  if (!visitor) {
    sessionStorage.setItem(returnToKey, window.location.href);
    window.location.replace(homePath());
    return;
  }

  trackTutorialView(visitor);
}());
