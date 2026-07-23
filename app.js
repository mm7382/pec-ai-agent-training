const identityKey = "pecTrainingVisitor";
const selectedCategoryKey = "pecTrainingSelectedCategory";
const returnToKey = "pecTrainingReturnTo";
const trackingEndpoint = window.TUTORIAL_CONFIG?.trackingEndpoint || "";

const state = {
  items: [],
  categories: [],
  resourceMeta: {},
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
  featureEntryGrid: document.querySelector("#featureEntryGrid"),
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

const searchAliases = new Map(Object.entries({
  default: ["default", "預設", "默認"],
  defaults: ["defaults", "default", "預設", "默認"],
  preset: ["preset", "預設"],
  local: ["local", "本機", "本地"],
  cloud: ["cloud", "雲端"],
  memory: ["memory", "記憶"],
  skill: ["skill", "skills", "技能"],
  workflow: ["workflow", "工作流", "流程"],
  prompt: ["prompt", "提示詞"],
  context: ["context", "上下文"],
  mcp: ["mcp", "model context protocol"],
  agent: ["agent", "代理"],
}));

function queryGroups(query) {
  return normalizeText(query)
    .split(/[\s,，、]+/)
    .filter(Boolean)
    .map((term) => searchAliases.get(term) || [term]);
}

function itemSearchText(item) {
  return normalizeText([
    item.title,
    item.category,
    item.level,
    item.summary,
    item.searchText,
    ...(item.tags || []),
  ].join(" "));
}

function fieldScore(value, groups, weight) {
  const text = normalizeText(value);
  if (!text) return 0;
  return groups.reduce((score, aliases) => (
    score + (aliases.some((alias) => text.includes(alias)) ? weight : 0)
  ), 0);
}

function itemSearchScore(item, groups) {
  return fieldScore(item.title, groups, 40)
    + fieldScore((item.tags || []).join(" "), groups, 28)
    + fieldScore(item.summary, groups, 18)
    + fieldScore(`${item.category} ${item.level}`, groups, 10)
    + fieldScore(item.searchText, groups, 4);
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

async function fetchResourceMeta(id, url) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      id,
      generatedAt: data.generatedAt || data.updatedAt || "",
      itemCount: Array.isArray(data.items) ? data.items.length : 0,
    };
  } catch {
    return null;
  }
}

async function loadResourceMeta() {
  const entries = await Promise.all([
    fetchResourceMeta("github-skill-rankings", "./github-skill-rankings.json"),
    fetchResourceMeta("ai-agent-daily-radar", "./ai-agent-daily.json"),
    fetchResourceMeta("local-agent-radar", "./local-agent-radar.json"),
    fetchResourceMeta("ai-video-library", "./ai-video-library.json"),
    fetchResourceMeta("openclaw-cases", "./openclaw-cases.json"),
    fetchResourceMeta("hermes-agent-resources", "./hermes-agent-resources.json"),
    fetchResourceMeta("ai-gods", "./ai-gods.json"),
  ]);
  state.resourceMeta = Object.fromEntries(entries.filter(Boolean).map((entry) => [entry.id, entry]));
}

function renderRecentUpdates() {
  const githubMeta = state.resourceMeta["github-skill-rankings"];
  const dailyMeta = state.resourceMeta["ai-agent-daily-radar"];
  const localAgentMeta = state.resourceMeta["local-agent-radar"];
  const aiVideoMeta = state.resourceMeta["ai-video-library"];
  const openclawMeta = state.resourceMeta["openclaw-cases"];
  const hermesMeta = state.resourceMeta["hermes-agent-resources"];
  const aiGodsMeta = state.resourceMeta["ai-gods"];
  const githubItem = state.items.find((item) => item.id === "github-skill-rankings") || {
    id: "github-skill-rankings",
    title: "GitHub 熱門 Skill",
    category: "Skill · AI Open Source",
    updatedAt: githubMeta?.generatedAt || "2026-07-09T00:00:00+08:00",
    summary: "每週整理 GitHub 上值得學的 Skill、AI workflow 與 AI 開源工具，先看白話介紹，再決定要不要深入研究。",
    url: "./github-skills.html",
  };
  const dailyItem = {
    id: "ai-agent-daily-radar",
    title: "AI Agent 熱門新聞",
    category: "Hacker News · Reddit",
    updatedAt: dailyMeta?.generatedAt || "2026-07-10T03:59:32.766Z",
    summary: "每天整理非 GitHub 來源的 AI Agent、LLM、AI coding 熱門文章，點進去可看來源內容的繁中翻譯與原文網址。",
    url: "./ai-agent-daily.html",
  };
  const localAgentItem = {
    id: "local-agent-radar",
    title: "Local Agent 熱門",
    category: "Local-ready · Self-host",
    updatedAt: localAgentMeta?.generatedAt || "2026-07-10T11:22:02.560Z",
    summary: "整理可本機執行、自架或下載研究的 Agent 專案，先看中文介紹與難度，再決定要不要試跑。",
    url: "./local-agent-radar.html",
  };
  const openclawItem = {
    id: "openclaw-cases",
    title: "OpenClaw 使用案例",
    category: "YouTube · Use Cases",
    updatedAt: openclawMeta?.generatedAt || "2026-07-11T00:00:00+08:00",
    summary: "整理 604 個 OpenClaw 教學與應用案例，可搜尋分類、看中文詳細整理，部分案例也能直接複製 Prompt。",
    url: "./openclaw-cases.html",
  };
  const hermesItem = {
    id: "hermes-agent-resources",
    title: "Hermes Agent 學習資料庫",
    category: "Official · GitHub · YouTube",
    updatedAt: hermesMeta?.generatedAt || "2026-07-11T00:00:00+08:00",
    summary: "收集 Hermes Agent 官方文件、GitHub、NVIDIA 部署案例、影片教學與比較文章，先看中文重點再深入來源。",
    url: "./hermes-agent-resources.html",
  };
  const aiVideoItem = {
    id: "ai-video-library",
    title: "YouTube AI 影片精選",
    category: "YouTube · Global / Chinese",
    updatedAt: aiVideoMeta?.generatedAt || "2026-07-14T09:30:00+08:00",
    summary: "精選國內外近期 AI Agent、AI Coding、MCP、Local LLM、自動化與 Low-code / No-code 工具影片，附中文整理與學習重點。",
    url: "./ai-video-library.html",
  };
  const aiGodsItem = {
    id: "ai-gods",
    title: "AI 大神",
    category: "People · Skill · Open Source",
    updatedAt: aiGodsMeta?.generatedAt || aiGodsMeta?.updatedAt || "2026-07-23T09:10:00+08:00",
    summary: "整理值得追蹤的 AI 工程師、開源作者與教學者，看背景、作品、技能地圖與學習順序，再決定要追誰、學什麼。",
    url: "./ai-gods.html",
  };
  const featureItems = [
    { tone: "github", label: "Skill Radar", latestLabel: "最新 Skill", ...githubItem, title: "GitHub 熱門 Skill" },
    { tone: "daily", label: "News Radar", latestLabel: "最新新聞", ...dailyItem },
    { tone: "local", label: "Local Ready", latestLabel: "最新 Agent", ...localAgentItem },
    { tone: "openclaw", label: "Use Cases", latestLabel: "最新案例", ...openclawItem },
    { tone: "video", label: "Video Picks", latestLabel: "最新影片", ...aiVideoItem },
    { tone: "hermes", label: "Agent Database", latestLabel: "最新資料", ...hermesItem },
    { tone: "gods", label: "People Radar", latestLabel: "收錄人物", ...aiGodsItem },
  ];
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

  const createFeatureCard = (item) => {
    const article = document.createElement("article");
    article.className = `feature-entry-card feature-entry-card--${item.tone}`;

    const label = document.createElement("span");
    label.className = "feature-entry-label";
    label.textContent = item.label;

    const title = document.createElement("h3");
    title.textContent = item.title;

    const summary = document.createElement("p");
    summary.textContent = item.summary;

    const latest = document.createElement("div");
    latest.className = "feature-entry-latest";

    const latestLabel = document.createElement("span");
    latestLabel.textContent = item.latestLabel;

    const latestTitle = document.createElement("strong");
    latestTitle.textContent = [formatDate(item.updatedAt), item.category].filter(Boolean).join(" · ");

    latest.append(latestLabel, latestTitle);

    const link = document.createElement("a");
    link.href = item.url;
    link.className = "feature-entry-action";
    link.textContent = "進入分頁";
    link.addEventListener("click", () => {
      trackEvent("feature_entry_click", {
        id: item.id,
        title: item.title,
        url: item.url,
      });
    });

    article.append(label, title, summary, latest, link);
    return article;
  };

  elements.featureEntryGrid.replaceChildren(...featureItems.map(createFeatureCard));
  elements.recentUpdateList.replaceChildren(...recentItems.map(createRecentNode));
}

function filteredItems() {
  const groups = queryGroups(state.query);
  const query = groups.length > 0;
  const items = state.items.filter((item) => {
    const categoryMatch = state.selectedCategory === "全部" || item.category === state.selectedCategory;
    const text = itemSearchText(item);
    const queryMatch = !query || groups.every((aliases) => aliases.some((alias) => text.includes(alias)));
    return categoryMatch && queryMatch;
  });
  if (!query) return items;
  return items.sort((a, b) => {
    const scoreDiff = itemSearchScore(b, groups) - itemSearchScore(a, groups);
    if (scoreDiff) return scoreDiff;
    return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
  });
}

function renderItems() {
  const items = filteredItems();
  elements.tutorialGrid.replaceChildren(...items.map(createCard));
  elements.resultCount.textContent = `顯示 ${items.length} / ${state.items.length} 份教材`;
  elements.emptyState.hidden = items.length > 0;
}

async function loadIndex() {
  const [response] = await Promise.all([
    fetch("./tutorial-index.json", { cache: "no-store" }),
    loadResourceMeta(),
  ]);
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
