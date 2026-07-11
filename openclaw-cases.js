(function () {
  const state = {
    data: null,
    category: "全部",
    query: "",
    sort: "latest",
    page: 1,
    pageSize: 24,
  };

  const grid = document.querySelector("#caseGrid");
  const empty = document.querySelector("#emptyState");
  const searchInput = document.querySelector("#searchInput");
  const categoryFilters = document.querySelector("#categoryFilters");
  const resultCount = document.querySelector("#resultCount");
  const pagination = document.querySelector("#pagination");
  const sourceText = document.querySelector("#sourceText");
  const updatedAt = document.querySelector("#updatedAt");
  const notesList = document.querySelector("#notesList");
  const caseTotal = document.querySelector("#caseTotal");
  const categoryTotal = document.querySelector("#categoryTotal");
  const promptTotal = document.querySelector("#promptTotal");

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

  function formatViews(value) {
    return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));
  }

  function searchText(item) {
    return normalize([
      item.title,
      item.titleHighlight,
      item.category,
      item.summary,
      item.summaryLong,
      ...(item.tags || []),
    ].join(" "));
  }

  function filteredCases() {
    const query = normalize(state.query);
    const items = (state.data?.videos || []).filter((item) => {
      const categoryMatch = state.category === "全部" || item.category === state.category;
      const queryMatch = !query || searchText(item).includes(query);
      return categoryMatch && queryMatch;
    });

    return items.sort((a, b) => {
      if (state.sort === "views_desc") return Number(b.viewCount || 0) - Number(a.viewCount || 0);
      if (state.sort === "views_asc") return Number(a.viewCount || 0) - Number(b.viewCount || 0);
      const dateDiff = new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
      return dateDiff || Number(b.viewCount || 0) - Number(a.viewCount || 0);
    });
  }

  function renderFilters() {
    const categories = ["全部", ...(state.data?.categories || []).map((category) => category.name)];
    categoryFilters.replaceChildren(...categories.map((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "openclaw-pill";
      button.textContent = category;
      button.setAttribute("aria-pressed", String(category === state.category));
      button.addEventListener("click", () => {
        state.category = category;
        state.page = 1;
        renderFilters();
        renderCards();
      });
      return button;
    }));
  }

  function createCard(item) {
    const article = document.createElement("article");
    article.className = "openclaw-card";
    const tags = (item.tags || []).slice(0, 4).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
    const summary = item.summary || "這是一個 OpenClaw 相關使用案例，可作為 AI Agent 工作流程參考。";
    article.innerHTML = `
      <a class="openclaw-thumb" href="./openclaw-case-detail.html?id=${encodeURIComponent(item.id)}" aria-label="查看 ${escapeHtml(item.title)}">
        <img src="${escapeHtml(item.thumbnail)}" alt="" loading="lazy">
      </a>
      <div class="openclaw-card-body">
        <div class="openclaw-card-top">
          <span class="openclaw-category">${escapeHtml(item.category)}</span>
          <span class="openclaw-date">${formatDate(item.publishedAt)}</span>
        </div>
        <h2 class="openclaw-title">${escapeHtml(item.titleHighlight || item.title)}</h2>
        <p class="openclaw-summary">${escapeHtml(summary)}</p>
        <div class="openclaw-tags">${tags}</div>
        <div class="openclaw-card-meta">
          <span>${formatViews(item.viewCount)} views</span>
          <span>${escapeHtml(item.duration || "")}</span>
          ${item.prompts?.length ? `<span>${item.prompts.length} prompts</span>` : ""}
        </div>
        <div class="openclaw-actions">
          <a class="openclaw-detail-link" href="./openclaw-case-detail.html?id=${encodeURIComponent(item.id)}">查看詳細內容</a>
          <a class="openclaw-source-link" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">YouTube 來源</a>
        </div>
      </div>
    `;
    return article;
  }

  function renderCards() {
    const items = filteredCases();
    const pageCount = Math.max(1, Math.ceil(items.length / state.pageSize));
    state.page = Math.min(state.page, pageCount);
    const start = (state.page - 1) * state.pageSize;
    const currentItems = items.slice(start, start + state.pageSize);
    grid.replaceChildren(...currentItems.map(createCard));
    resultCount.textContent = `顯示 ${items.length ? start + 1 : 0}-${Math.min(start + currentItems.length, items.length)} / ${items.length} 個符合案例，共 ${state.data?.total || 0} 筆`;
    empty.hidden = items.length > 0;
    renderPagination(pageCount, items.length);
  }

  function pageButton(label, page, options = {}) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "openclaw-page";
    button.textContent = label;
    if (options.current) button.setAttribute("aria-current", "page");
    if (options.disabled) button.disabled = true;
    button.addEventListener("click", () => {
      if (button.disabled) return;
      state.page = page;
      renderCards();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    return button;
  }

  function renderPagination(pageCount, itemCount) {
    if (!itemCount || pageCount <= 1) {
      pagination.replaceChildren();
      return;
    }

    const pages = new Set([1, pageCount, state.page, state.page - 1, state.page + 1]);
    const sortedPages = [...pages].filter((page) => page >= 1 && page <= pageCount).sort((a, b) => a - b);
    const nodes = [
      pageButton("上一頁", Math.max(1, state.page - 1), { disabled: state.page === 1 }),
    ];
    let previous = 0;
    for (const page of sortedPages) {
      if (previous && page - previous > 1) {
        const spacer = document.createElement("span");
        spacer.className = "openclaw-page";
        spacer.textContent = "...";
        spacer.setAttribute("aria-hidden", "true");
        nodes.push(spacer);
      }
      nodes.push(pageButton(String(page), page, { current: page === state.page }));
      previous = page;
    }
    nodes.push(pageButton("下一頁", Math.min(pageCount, state.page + 1), { disabled: state.page === pageCount }));
    pagination.replaceChildren(...nodes);
  }

  function renderMeta() {
    const videos = state.data?.videos || [];
    caseTotal.textContent = String(state.data?.total || videos.length);
    categoryTotal.textContent = String(state.data?.categories?.length || 0);
    promptTotal.textContent = String(videos.filter((item) => item.prompts?.length).length);
    updatedAt.textContent = `來源更新時間：${formatDateTime(state.data?.sourceLastUpdated)}；匯入時間：${formatDateTime(state.data?.importedAt)}`;
    sourceText.textContent = `資料來源：${state.data?.sourceName || "OplacLaw Use Cases"} · ${state.data?.sourceSite || ""}`;
    notesList.replaceChildren(...(state.data?.notes || []).map((note) => {
      const li = document.createElement("li");
      li.textContent = note;
      return li;
    }));
  }

  function setupEvents() {
    searchInput.addEventListener("input", () => {
      state.query = searchInput.value;
      state.page = 1;
      renderCards();
    });

    document.querySelectorAll(".openclaw-sort").forEach((button) => {
      button.addEventListener("click", () => {
        state.sort = button.dataset.sort || "latest";
        state.page = 1;
        document.querySelectorAll(".openclaw-sort").forEach((item) => {
          item.setAttribute("aria-pressed", String(item === button));
        });
        renderCards();
      });
    });
  }

  async function init() {
    setupEvents();
    const response = await fetch("./openclaw-cases.json", { cache: "no-store" });
    if (!response.ok) throw new Error("無法載入 OpenClaw 使用案例資料");
    state.data = await response.json();
    renderMeta();
    renderFilters();
    renderCards();
  }

  init().catch((error) => {
    resultCount.textContent = error.message;
    empty.hidden = false;
  });
}());
