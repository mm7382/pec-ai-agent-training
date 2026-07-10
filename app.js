const identityKey = "pecTrainingVisitor";
const selectedCategoryKey = "pecTrainingSelectedCategory";
const returnToKey = "pecTrainingReturnTo";
const trackingEndpoint = window.TUTORIAL_CONFIG?.trackingEndpoint || "";

const state = {
  items: [],
  categories: [],
  selectedCategory: localStorage.getItem(selectedCategoryKey) || "全部",
  query: "",
  visitor: null,
};

const elements = {
  identityChip: document.querySelector("#identityChip"),
  identityText: document.querySelector("#identityText"),
  switchUserButton: document.querySelector("#switchUserButton"),
  signinDialog: document.querySelector("#signinDialog"),
  signinForm: document.querySelector("#signinForm"),
  visitorName: document.querySelector("#visitorName"),
  visitorDepartment: document.querySelector("#visitorDepartment"),
  searchInput: document.querySelector("#searchInput"),
  categoryFilters: document.querySelector("#categoryFilters"),
  tutorialGrid: document.querySelector("#tutorialGrid"),
  githubHotList: document.querySelector("#githubHotList"),
  dailyHotList: document.querySelector("#dailyHotList"),
  recentUpdateList: document.querySelector("#recentUpdateList"),
  resultCount: document.querySelector("#resultCount"),
  totalCount: document.querySelector("#totalCount"),
  emptyState: document.querySelector("#emptyState"),
  clearFiltersButton: document.querySelector("#clearFiltersButton"),
};

function loadVisitor() {
  try {
    const value = JSON.parse(localStorage.getItem(identityKey) || "null");
    if (!value?.name || !value?.department) return null;
    return value;
  } catch {
    return null;
  }
}

function saveVisitor(visitor) {
  localStorage.setItem(identityKey, JSON.stringify(visitor));
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

async function trackEvent(type, detail = {}) {
  if (!trackingEndpoint || !state.visitor) return;
  if (["localhost", "127.0.0.1"].includes(window.location.hostname)) return;

  const payload = {
    type,
    occurredAt: new Date().toISOString(),
    occurredAtLocal: formatLocalTime(),
    visitor: state.visitor,
    page: {
      title: document.title,
      url: window.location.href,
      path: window.location.pathname,
    },
    detail,
    userAgent: navigator.userAgent,
    language: navigator.language,
  };

  try {
    await fetch(trackingEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Tracking must never block the learning page.
  }
}

function normalizeText(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function itemSearchText(item) {
  return normalizeText([
    item.title,
    item.category,
    item.level,
    item.summary,
    ...(item.tags || []),
  ].join(" "));
}

function updateIdentityUi() {
  if (!state.visitor) {
    elements.identityChip.hidden = true;
    return;
  }
  elements.identityText.textContent = `${state.visitor.name} · ${state.visitor.department}`;
  elements.identityChip.hidden = false;
}

function showSignin() {
  elements.signinDialog.showModal();
  window.setTimeout(() => elements.visitorName.focus(), 50);
}

function renderCategoryFilters() {
  const categories = ["全部", ...state.categories];
  elements.categoryFilters.replaceChildren(...categories.map((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-button";
    button.textContent = category;
    button.dataset.active = String(category === state.selectedCategory);
    button.addEventListener("click", () => {
      state.selectedCategory = category;
      localStorage.setItem(selectedCategoryKey, category);
      renderCategoryFilters();
      renderItems();
      trackEvent("filter", { category });
    });
    return button;
  }));
}

function createCard(item) {
  const article = document.createElement("article");
  article.className = "tutorial-card";

  const meta = document.createElement("div");
  meta.className = "card-meta";

  const category = document.createElement("span");
  category.textContent = item.category;

  const level = document.createElement("span");
  level.textContent = item.level;

  meta.append(category, level);

  const title = document.createElement("h3");
  title.textContent = item.title;

  const summary = document.createElement("p");
  summary.textContent = item.summary;

  const tags = document.createElement("div");
  tags.className = "tag-row";
  for (const tag of item.tags || []) {
    const chip = document.createElement("span");
    chip.textContent = tag;
    tags.append(chip);
  }

  const link = document.createElement("a");
  link.href = item.url;
  link.textContent = "打開教材";
  link.className = "card-link";
  link.addEventListener("click", () => {
    trackEvent("tutorial_click", {
      id: item.id,
      title: item.title,
      category: item.category,
      url: item.url,
    });
  });

  article.append(meta, title, summary, tags, link);
  return article;
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

function renderRecentUpdates() {
  const githubItems = state.items.filter((item) => item.id === "github-skill-rankings");
  const dailyItems = [{
    id: "ai-agent-daily-radar",
    title: "AI Agent 每日熱門",
    category: "Hacker News · Reddit",
    updatedAt: new Date().toISOString(),
    summary: "每天整理非 GitHub 來源的 AI Agent、LLM、AI coding 熱門文章，先看中文簡介，再點進來源細讀。",
    url: "./ai-agent-daily.html",
  }];
  const recentItems = [...state.items]
    .filter((item) => item.updatedAt && item.id !== "github-skill-rankings")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const createRecentNode = (item) => {
    const row = document.createElement("li");
    row.className = "recent-update-item";

    const link = document.createElement("a");
    link.href = item.url;
    link.addEventListener("click", () => {
      trackEvent("recent_update_click", {
        id: item.id,
        title: item.title,
        url: item.url,
      });
    });

    const title = document.createElement("strong");
    title.textContent = item.title;

    const meta = document.createElement("span");
    meta.textContent = [formatDate(item.updatedAt), item.category].filter(Boolean).join(" · ");

    const summary = document.createElement("p");
    summary.textContent = item.summary;

    link.append(title, meta);
    row.append(link, summary);
    return row;
  };

  elements.githubHotList.replaceChildren(...githubItems.map(createRecentNode));
  elements.dailyHotList.replaceChildren(...dailyItems.map(createRecentNode));
  elements.recentUpdateList.replaceChildren(...recentItems.map(createRecentNode));
}

function filteredItems() {
  const query = normalizeText(state.query);
  return state.items.filter((item) => {
    const categoryMatch = state.selectedCategory === "全部" || item.category === state.selectedCategory;
    const queryMatch = !query || itemSearchText(item).includes(query);
    return categoryMatch && queryMatch;
  });
}

function renderItems() {
  const items = filteredItems();
  elements.tutorialGrid.replaceChildren(...items.map(createCard));
  elements.resultCount.textContent = `顯示 ${items.length} / ${state.items.length} 份教材`;
  elements.emptyState.hidden = items.length > 0;
}

async function loadIndex() {
  const response = await fetch("./tutorial-index.json", { cache: "no-store" });
  if (!response.ok) throw new Error("無法載入教材索引");
  const data = await response.json();
  state.items = data.items || [];
  state.categories = data.categories || [];
  elements.totalCount.textContent = String(state.items.length);
  renderRecentUpdates();
  renderCategoryFilters();
  renderItems();
}

function setupEvents() {
  elements.searchInput.addEventListener("input", () => {
    state.query = elements.searchInput.value;
    renderItems();
  });

  elements.searchInput.addEventListener("change", () => {
    if (state.query.trim()) trackEvent("search", { query: state.query.trim() });
  });

  elements.clearFiltersButton.addEventListener("click", () => {
    state.selectedCategory = "全部";
    state.query = "";
    elements.searchInput.value = "";
    localStorage.setItem(selectedCategoryKey, "全部");
    renderCategoryFilters();
    renderItems();
    trackEvent("clear_filters");
  });

  elements.switchUserButton.addEventListener("click", () => {
    localStorage.removeItem(identityKey);
    state.visitor = null;
    updateIdentityUi();
    showSignin();
  });

  elements.signinForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = elements.visitorName.value.trim();
    const department = elements.visitorDepartment.value;
    if (!name || !department) return;

    state.visitor = {
      name,
      department,
      signedInAt: new Date().toISOString(),
      signedInAtLocal: formatLocalTime(),
    };
    saveVisitor(state.visitor);
    updateIdentityUi();
    elements.signinDialog.close();
    await trackEvent("signin", { source: "portal" });

    const returnTo = sessionStorage.getItem(returnToKey);
    if (returnTo) {
      sessionStorage.removeItem(returnToKey);
      window.location.href = returnTo;
    }
  });
}

async function init() {
  state.visitor = loadVisitor();
  updateIdentityUi();
  setupEvents();
  await loadIndex();

  if (!state.visitor) {
    showSignin();
  } else {
    trackEvent("portal_view", { source: "returning_visitor" });
  }
}

init().catch((error) => {
  elements.resultCount.textContent = error.message;
});
