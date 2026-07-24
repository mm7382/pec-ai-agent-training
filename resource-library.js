(function () {
  const config = window.RESOURCE_LIBRARY_CONFIG || {};
  const state = { data: null, category: "全部", query: "", sort: config.defaultSort || "relevance" };

  const grid = document.querySelector("#resourceGrid");
  const empty = document.querySelector("#emptyState");
  const searchInput = document.querySelector("#searchInput");
  const categoryFilters = document.querySelector("#categoryFilters");
  const resultCount = document.querySelector("#resultCount");
  const sourceText = document.querySelector("#sourceText");
  const updatedAt = document.querySelector("#updatedAt");
  const notesList = document.querySelector("#notesList");
  const totalCount = document.querySelector("#totalCount");
  const categoryTotal = document.querySelector("#categoryTotal");
  const methodText = document.querySelector("#methodText");

  function escapeHtml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function formatDate(value) {
    if (!value) return "未知日期";
    if (/^\d{8}$/.test(String(value))) {
      return `${String(value).slice(0, 4)}/${String(value).slice(4, 6)}/${String(value).slice(6, 8)}`;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    return new Intl.DateTimeFormat("zh-Hant-TW", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  }

  function formatDateTime(value) {
    if (!value) return "未知";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("zh-Hant-TW", { dateStyle: "medium", timeStyle: "short", hour12: false }).format(date);
  }

  function formatNumber(value) {
    if (value === undefined || value === null || value === "") return "";
    return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));
  }

  function searchText(item) {
    return normalize([
      item.title,
      item.channel,
      item.sourceName,
      item.sourceType,
      item.category,
      item.language,
      item.summary,
      ...(item.highlights || []),
      ...(item.audience || []),
      ...(item.tags || []),
    ].join(" "));
  }

  function filteredItems() {
    const query = normalize(state.query);
    const items = (state.data?.items || []).filter((item) => {
      const categoryMatch = state.category === "全部" || item.category === state.category;
      const queryMatch = !query || searchText(item).includes(query);
      return categoryMatch && queryMatch;
    });

    return items.sort((a, b) => {
      if (state.sort === "views") return Number(b.viewCount || 0) - Number(a.viewCount || 0);
      if (state.sort === "date") return String(b.publishedAt || "").localeCompare(String(a.publishedAt || ""));
      if (state.sort === "title") return String(a.title || "").localeCompare(String(b.title || ""));
      return 0;
    });
  }

  function renderFilters() {
    const categories = ["全部", ...(state.data?.categories || [])];
    categoryFilters.replaceChildren(...categories.map((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "resource-pill";
      button.textContent = category;
      button.setAttribute("aria-pressed", String(category === state.category));
      button.addEventListener("click", () => {
        state.category = category;
        renderFilters();
        renderCards();
      });
      return button;
    }));
  }

  function metricLine(item) {
    const pieces = [];
    if (item.sourceType) pieces.push(item.sourceType);
    if (item.channel) pieces.push(item.channel);
    if (item.sourceName) pieces.push(item.sourceName);
    if (item.language) pieces.push(item.language);
    if (item.viewCount) pieces.push(`${formatNumber(item.viewCount)} views`);
    if (item.publishedAt) pieces.push(formatDate(item.publishedAt));
    return pieces.filter(Boolean).join(" · ");
  }

  function createCard(item) {
    const article = document.createElement("article");
    article.className = item.thumbnail ? "resource-card has-media" : "resource-card";
    const tags = (item.tags || []).slice(0, 4).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
    const detailHref = `${config.detailUrl}?id=${encodeURIComponent(item.id)}`;
    const media = item.thumbnail ? `
      <a class="resource-thumb" href="${detailHref}" aria-label="查看 ${escapeHtml(item.title)}">
        <span class="resource-thumb-fallback">${escapeHtml(item.channel || item.sourceName || item.category || "Video")}</span>
        <img src="${escapeHtml(item.thumbnail)}" alt="" loading="lazy" onerror="this.hidden=true">
      </a>
    ` : `
      <a class="resource-symbol" href="${detailHref}" aria-label="查看 ${escapeHtml(item.title)}">
        <span>${escapeHtml(item.sourceType || item.category || "Resource")}</span>
      </a>
    `;
    article.innerHTML = `
      ${media}
      <div class="resource-card-body">
        <div class="resource-card-top">
          <span class="resource-category">${escapeHtml(item.category || "未分類")}</span>
          <span class="resource-date">${escapeHtml(formatDate(item.publishedAt))}</span>
        </div>
        <h2 class="resource-title">${escapeHtml(item.title)}</h2>
        <p class="resource-summary">${escapeHtml(item.summary || "公開學習資源。")}</p>
        <div class="resource-tags">${tags}</div>
        <div class="resource-meta">${escapeHtml(metricLine(item))}</div>
        <div class="resource-actions">
          <a class="resource-detail-link" href="${detailHref}">查看詳細內容</a>
          <a class="resource-source-link" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">來源連結</a>
        </div>
      </div>
    `;
    return article;
  }

  function renderCards() {
    const items = filteredItems();
    grid.replaceChildren(...items.map(createCard));
    resultCount.textContent = `顯示 ${items.length} / ${state.data?.items?.length || 0} 筆資料`;
    empty.hidden = items.length > 0;
  }

  function renderMeta() {
    const items = state.data?.items || [];
    totalCount.textContent = String(items.length);
    categoryTotal.textContent = String(state.data?.categories?.length || 0);
    updatedAt.textContent = `資料整理時間：${formatDateTime(state.data?.generatedAt)}`;
    sourceText.textContent = state.data?.description || "";
    methodText.textContent = state.data?.selectionMethod || "";
    notesList.replaceChildren(...(state.data?.notes || []).map((note) => {
      const li = document.createElement("li");
      li.textContent = note;
      return li;
    }));
  }

  function setupEvents() {
    searchInput.addEventListener("input", () => {
      state.query = searchInput.value;
      renderCards();
    });
    document.querySelectorAll(".resource-sort").forEach((button) => {
      button.addEventListener("click", () => {
        state.sort = button.dataset.sort || "relevance";
        document.querySelectorAll(".resource-sort").forEach((item) => {
          item.setAttribute("aria-pressed", String(item === button));
        });
        renderCards();
      });
    });
  }

  async function init() {
    if (!config.dataUrl || !config.detailUrl) throw new Error("缺少資料庫設定");
    setupEvents();
    const response = await fetch(config.dataUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`無法載入 ${config.title || "資料庫"}`);
    state.data = await response.json();
    document.title = `${state.data.title || config.title} - Michael AI Agent Lab`;
    renderMeta();
    renderFilters();
    renderCards();
  }

  init().catch((error) => {
    resultCount.textContent = error.message;
    empty.hidden = false;
  });
}());
