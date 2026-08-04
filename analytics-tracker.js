(function () {
  const endpoint = window.TUTORIAL_CONFIG?.trackingEndpoint || "";
  const visitorKey = "mal.analyticsVisitor.v1";
  const sessionKey = "mal.analyticsSession.v1";
  const campaignKey = "mal.analyticsCampaign.v1";
  const referrerKey = "mal.analyticsReferrer.v1";
  const excludedKey = "mal.analyticsExcluded.v1";
  const visitorLifetime = 90 * 24 * 60 * 60 * 1000;
  const localHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);
  const botPattern = /(bot|crawler|spider|slurp|bingpreview|headlesschrome|lighthouse|pagespeed|pingdom|uptimerobot|facebookexternalhit|linkedinbot|whatsapp|telegrambot)/i;

  function createId(prefix) {
    const value = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `${prefix}-${value}`;
  }

  function readJson(storage, key) {
    try {
      return JSON.parse(storage.getItem(key) || "null");
    } catch {
      return null;
    }
  }

  function visitorIdentity() {
    const now = Date.now();
    const existing = readJson(localStorage, visitorKey);
    if (existing?.id && Number(existing.expiresAt) > now) {
      return { id: existing.id, returning: true };
    }
    const value = { id: createId("v"), expiresAt: now + visitorLifetime };
    localStorage.setItem(visitorKey, JSON.stringify(value));
    return { id: value.id, returning: false };
  }

  function sessionIdentity() {
    let value = sessionStorage.getItem(sessionKey);
    if (!value) {
      value = createId("s");
      sessionStorage.setItem(sessionKey, value);
    }
    return value;
  }

  function campaignContext() {
    const params = new URLSearchParams(window.location.search);
    const current = {
      source: params.get("utm_source") || "",
      medium: params.get("utm_medium") || "",
      campaign: params.get("utm_campaign") || "",
      content: params.get("utm_content") || "",
    };
    if (Object.values(current).some(Boolean)) {
      sessionStorage.setItem(campaignKey, JSON.stringify(current));
      return current;
    }
    return readJson(sessionStorage, campaignKey) || current;
  }

  function landingReferrer() {
    const stored = sessionStorage.getItem(referrerKey);
    if (stored) return stored;
    const value = document.referrer || "";
    sessionStorage.setItem(referrerKey, value);
    return value;
  }

  function deviceType() {
    const width = Math.min(window.innerWidth || 0, window.screen?.width || 0);
    if (/ipad|tablet/i.test(navigator.userAgent) || (width >= 768 && width < 1100)) return "tablet";
    if (/mobile|iphone|android/i.test(navigator.userAgent) || width < 768) return "mobile";
    return "desktop";
  }

  function contentType(path) {
    const value = String(path || "").toLowerCase();
    if (value.includes("/pec-training/") || value.includes("/tutorials/")) return "tutorial";
    if (value.includes("github")) return "github";
    if (value.includes("ai-agent-daily")) return "news";
    if (value.includes("local-agent")) return "local-agent";
    if (value.includes("ai-video") || value.includes("youtube")) return "youtube";
    if (value.includes("openclaw")) return "openclaw";
    if (value.includes("hermes")) return "hermes";
    if (value.includes("ai-god")) return "people";
    if (value.includes("learning") || value.includes("tutorial-library")) return "library";
    if (/\/(index\.html)?$/.test(value)) return "home";
    return "other";
  }

  const state = {
    activeStartedAt: document.visibilityState === "visible" ? Date.now() : null,
    activeMilliseconds: 0,
    maxScrollDepth: 0,
    outboundClicks: 0,
    outboundTargets: new Set(),
    actions: {},
    searches: new Map(),
    sent: false,
  };

  function updateActiveTime() {
    if (state.activeStartedAt !== null) {
      state.activeMilliseconds += Date.now() - state.activeStartedAt;
      state.activeStartedAt = null;
    }
  }

  function updateScrollDepth() {
    const root = document.documentElement;
    const scrollable = Math.max(root.scrollHeight - window.innerHeight, 0);
    const depth = scrollable === 0 ? 100 : Math.round((window.scrollY / scrollable) * 100);
    state.maxScrollDepth = Math.max(state.maxScrollDepth, Math.min(100, depth));
  }

  function recordAction(type) {
    const key = String(type || "action").slice(0, 60);
    state.actions[key] = Math.min((state.actions[key] || 0) + 1, 1000);
  }

  function recordSearch(term, resultCount) {
    const value = String(term || "").replace(/\s+/g, " ").trim();
    if (!value) return;
    state.searches.set(value.slice(0, 200), Math.max(0, Number(resultCount) || 0));
  }

  function isExcluded() {
    return localStorage.getItem(excludedKey) === "true";
  }

  function setExcluded(excluded) {
    localStorage.setItem(excludedKey, String(Boolean(excluded)));
  }

  function canTrack() {
    return endpoint
      && !localHosts.has(window.location.hostname)
      && !isExcluded()
      && !botPattern.test(navigator.userAgent);
  }

  function buildPayload() {
    updateActiveTime();
    updateScrollDepth();
    const visitor = visitorIdentity();
    return {
      type: "page_summary",
      occurredAt: new Date().toISOString(),
      page: {
        title: document.title,
        path: window.location.pathname,
      },
      detail: {
        visitorId: visitor.id,
        sessionId: sessionIdentity(),
        contentType: contentType(window.location.pathname),
        referrer: landingReferrer(),
        utm: campaignContext(),
        deviceType: deviceType(),
        durationSeconds: Math.round(state.activeMilliseconds / 1000),
        maxScrollDepth: state.maxScrollDepth,
        completed: state.maxScrollDepth >= 80,
        returnVisit: visitor.returning,
        outboundClicks: state.outboundClicks,
        outboundTargets: [...state.outboundTargets],
        actions: state.actions,
        searches: [...state.searches.entries()].map(([term, resultCount]) => ({ term, resultCount })),
      },
      userAgent: navigator.userAgent,
      language: navigator.language,
    };
  }

  function flush() {
    if (state.sent || !canTrack()) return;
    state.sent = true;
    try {
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify(buildPayload()),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Analytics must never block navigation.
    }
  }

  function resetForRestoredPage() {
    state.activeStartedAt = Date.now();
    state.activeMilliseconds = 0;
    state.maxScrollDepth = 0;
    state.outboundClicks = 0;
    state.outboundTargets.clear();
    state.actions = {};
    state.searches.clear();
    state.sent = false;
  }

  function addPrivacyNotice() {
    if (document.querySelector(".mal-privacy-notice")) return;
    const style = document.createElement("style");
    style.textContent = `
      .mal-privacy-notice{box-sizing:border-box;width:100%;margin-top:32px;padding:18px 20px;border-top:1px solid rgba(127,127,127,.24);color:inherit;font:500 12px/1.7 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;text-align:center;opacity:.66;letter-spacing:0}
      .mal-privacy-notice a{color:inherit;text-decoration:underline;text-underline-offset:3px}
    `;
    const footer = document.createElement("footer");
    footer.className = "mal-privacy-notice";
    const text = document.createTextNode("本站使用匿名流量資料了解熱門內容與使用趨勢，資料保留 15 天。 ");
    const link = document.createElement("a");
    link.href = window.location.pathname.includes("/pec-training/") ? "../privacy.html" : "./privacy.html";
    link.textContent = "隱私說明";
    footer.append(text, link);
    document.head.append(style);
    document.body.append(footer);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      updateActiveTime();
    } else if (state.activeStartedAt === null) {
      state.activeStartedAt = Date.now();
    }
  });
  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("a[href]");
    if (!link) return;
    try {
      const target = new URL(link.href, window.location.href);
      if (target.origin !== window.location.origin) {
        state.outboundClicks += 1;
        state.outboundTargets.add(target.hostname.replace(/^www\./, ""));
      }
    } catch {
      // Ignore malformed links.
    }
  }, { capture: true });
  window.addEventListener("scroll", updateScrollDepth, { passive: true });
  window.addEventListener("pagehide", flush);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) resetForRestoredPage();
  });
  updateScrollDepth();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addPrivacyNotice, { once: true });
  } else {
    addPrivacyNotice();
  }

  window.MALAnalytics = {
    flush,
    isExcluded,
    recordAction,
    recordSearch,
    setExcluded,
  };
}());
