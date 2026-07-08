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
      });
    } catch {
      // Tracking must never block the lesson page.
    }
  }

  const visitor = readVisitor();
  if (!visitor) {
    sessionStorage.setItem(returnToKey, window.location.href);
    window.location.replace("../index.html");
    return;
  }

  trackTutorialView(visitor);
}());
