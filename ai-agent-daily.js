(function () {
  const state = { data: null, period: "daily" };
  const hnList = document.querySelector("#hnList");
  const redditList = document.querySelector("#redditList");
  const hnEmpty = document.querySelector("#hnEmpty");
  const redditEmpty = document.querySelector("#redditEmpty");
  const sourceText = document.querySelector("#sourceText");
  const generatedAt = document.querySelector("#generatedAt");
  const criteriaList = document.querySelector("#criteriaList");

  function formatDateTime(value) {
    if (!value) return "未知";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "未知";
    return new Intl.DateTimeFormat("zh-Hant-TW", {
      dateStyle: "medium",
      timeStyle: "short",
      hour12: false,
    }).format(date);
  }

  function activePeriod() {
    return state.data?.periods?.find((period) => period.key === state.period) || state.data?.periods?.[0];
  }

  function metricText(item) {
    const parts = [formatDateTime(item.createdAt)];
    if (item.sourceKey === "hn") {
      parts.push(`${Number(item.points || 0)} points`);
      parts.push(`${Number(item.comments || 0)} comments`);
    } else {
      parts.push(item.subreddit ? `r/${item.subreddit}` : "Reddit");
      parts.push(item.rankSignal || "Top ranking");
    }
    return parts.filter(Boolean);
  }

  function createItem(item) {
    const row = document.createElement("li");
    const article = document.createElement("article");
    article.className = "daily-card";
    article.dataset.source = item.sourceKey;

    const top = document.createElement("div");
    top.className = "daily-card-top";

    const rank = document.createElement("span");
    rank.className = "daily-rank";
    rank.textContent = String(item.rank);

    const source = document.createElement("span");
    source.className = "daily-source";
    source.textContent = item.source;
    top.append(rank, source);

    const title = document.createElement("h3");
    title.className = "daily-title";
    title.textContent = item.titleZh || item.originalTitle;

    const original = document.createElement("p");
    original.className = "daily-original";
    original.textContent = item.originalTitle;

    const summary = document.createElement("p");
    summary.className = "daily-summary";
    summary.textContent = item.summaryZh || "這篇文章和 AI Agent / LLM 實作趨勢有關。";

    const meta = document.createElement("div");
    meta.className = "daily-card-meta";
    for (const text of metricText(item)) {
      const span = document.createElement("span");
      span.textContent = text;
      meta.append(span);
    }

    const actions = document.createElement("div");
    actions.className = "daily-actions";

    const detail = document.createElement("a");
    detail.className = "daily-detail-link";
    detail.href = `./ai-agent-daily-detail.html?period=${encodeURIComponent(item.period)}&id=${encodeURIComponent(item.id)}`;
    detail.textContent = "查看細節";

    const sourceLink = document.createElement("a");
    sourceLink.className = "daily-source-link";
    sourceLink.href = item.url;
    sourceLink.target = "_blank";
    sourceLink.rel = "noreferrer";
    sourceLink.textContent = "來源網址";

    actions.append(detail, sourceLink);
    article.append(top, title, original, summary, meta, actions);
    row.append(article);
    return row;
  }

  function renderList(listElement, emptyElement, items) {
    listElement.replaceChildren(...items.map(createItem));
    emptyElement.hidden = items.length > 0;
  }

  function render() {
    const period = activePeriod();
    const hn = period?.hn || [];
    const reddit = period?.reddit || [];
    sourceText.textContent = `資料來源：${state.data?.source || "Hacker News + Reddit"}`;
    generatedAt.textContent = state.data?.generatedAt ? `更新時間：${formatDateTime(state.data.generatedAt)}` : "更新時間：未知";
    criteriaList.replaceChildren(...(state.data?.criteria || []).map((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      return li;
    }));
    renderList(hnList, hnEmpty, hn);
    renderList(redditList, redditEmpty, reddit);
  }

  function setupTabs() {
    document.querySelectorAll(".daily-tab").forEach((button) => {
      button.addEventListener("click", () => {
        state.period = button.dataset.period || "daily";
        document.querySelectorAll(".daily-tab").forEach((item) => {
          item.setAttribute("aria-pressed", String(item === button));
        });
        render();
      });
    });
  }

  async function init() {
    setupTabs();
    const response = await fetch("./ai-agent-daily.json", { cache: "no-store" });
    if (!response.ok) throw new Error("無法載入 AI Agent 每日熱門資料");
    state.data = await response.json();
    render();
  }

  init().catch((error) => {
    sourceText.textContent = error.message;
    hnEmpty.hidden = false;
    redditEmpty.hidden = false;
  });
}());
