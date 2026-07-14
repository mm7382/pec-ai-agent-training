(function () {
  const state = {
    items: [],
    categories: [],
    query: "",
    category: "全部",
  };

  const elements = {
    total: document.querySelector("#catalogTotal"),
    categoryTotal: document.querySelector("#catalogCategoryTotal"),
    resultCount: document.querySelector("#catalogResultCount"),
    searchInput: document.querySelector("#catalogSearchInput"),
    filters: document.querySelector("#catalogFilters"),
    clearButton: document.querySelector("#catalogClearButton"),
    jumpNav: document.querySelector("#catalogJumpNav"),
    groups: document.querySelector("#catalogGroups"),
    emptyState: document.querySelector("#catalogEmptyState"),
  };

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
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    return new Intl.DateTimeFormat("zh-Hant-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }

  function slug(value) {
    return `category-${normalize(value).replace(/[^\w\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "")}`;
  }

  function itemText(item) {
    return normalize([
      item.title,
      item.category,
      item.level,
      item.summary,
      ...(item.tags || []),
    ].join(" "));
  }

  function filteredItems() {
    const query = normalize(state.query);
    return state.items.filter((item) => {
      const categoryMatch = state.category === "全部" || item.category === state.category;
      const queryMatch = !query || itemText(item).includes(query);
      return categoryMatch && queryMatch;
    });
  }

  function renderFilters() {
    const categories = ["全部", ...state.categories];
    elements.filters.replaceChildren(...categories.map((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "catalog-filter-button";
      button.textContent = category;
      button.setAttribute("aria-pressed", String(category === state.category));
      button.addEventListener("click", () => {
        state.category = category;
        renderFilters();
        renderCatalog();
      });
      return button;
    }));
  }

  function createItem(item) {
    const tags = (item.tags || []).slice(0, 4).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
    return `
      <article class="catalog-item">
        <div class="catalog-item-top">
          <span>${escapeHtml(item.level || "教材")}</span>
          ${item.updatedAt ? `<time datetime="${escapeHtml(item.updatedAt)}">${escapeHtml(formatDate(item.updatedAt))}</time>` : ""}
        </div>
        <h3><a href="${escapeHtml(item.url)}">${escapeHtml(item.title)}</a></h3>
        <p>${escapeHtml(item.summary || "")}</p>
        <div class="catalog-tag-row">${tags}</div>
      </article>
    `;
  }

  function groupedByCategory(items) {
    const groups = new Map();
    for (const category of state.categories) groups.set(category, []);
    for (const item of items) {
      if (!groups.has(item.category)) groups.set(item.category, []);
      groups.get(item.category).push(item);
    }
    return [...groups.entries()].filter(([, groupItems]) => groupItems.length > 0);
  }

  function renderJumpNav(groups) {
    if (state.category !== "全部" || state.query) {
      elements.jumpNav.replaceChildren();
      elements.jumpNav.hidden = true;
      return;
    }
    elements.jumpNav.hidden = false;
    elements.jumpNav.replaceChildren(...groups.map(([category, items]) => {
      const link = document.createElement("a");
      link.href = `#${slug(category)}`;
      link.textContent = `${category} ${items.length}`;
      return link;
    }));
  }

  function renderCatalog() {
    const items = filteredItems();
    const groups = groupedByCategory(items);
    elements.resultCount.textContent = `顯示 ${items.length} / ${state.items.length} 份教材`;
    elements.emptyState.hidden = items.length > 0;
    renderJumpNav(groups);

    elements.groups.innerHTML = groups.map(([category, groupItems]) => `
      <section class="catalog-group" id="${escapeHtml(slug(category))}">
        <div class="catalog-group-header">
          <div>
            <p class="section-label">Category</p>
            <h2>${escapeHtml(category)}</h2>
          </div>
          <span>${groupItems.length} 份教材</span>
        </div>
        <div class="catalog-item-grid">
          ${groupItems.map(createItem).join("")}
        </div>
      </section>
    `).join("");
  }

  function setupEvents() {
    elements.searchInput.addEventListener("input", () => {
      state.query = elements.searchInput.value;
      renderCatalog();
    });

    elements.clearButton.addEventListener("click", () => {
      state.query = "";
      state.category = "全部";
      elements.searchInput.value = "";
      renderFilters();
      renderCatalog();
    });
  }

  async function init() {
    setupEvents();
    const response = await fetch("./tutorial-index.json", { cache: "no-store" });
    if (!response.ok) throw new Error("無法載入教材索引");
    const data = await response.json();
    state.items = data.items || [];
    state.categories = [
      ...(data.categories || []),
      ...[...new Set(state.items.map((item) => item.category).filter(Boolean))]
        .filter((category) => !(data.categories || []).includes(category)),
    ];
    elements.total.textContent = String(state.items.length);
    elements.categoryTotal.textContent = String(state.categories.length);
    renderFilters();
    renderCatalog();
  }

  init().catch((error) => {
    elements.resultCount.textContent = error.message;
    elements.emptyState.hidden = false;
  });
}());
