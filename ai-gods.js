(function () {
  const state = {
    data: null,
    items: [],
    selectedDomain: "全部",
    query: "",
  };

  const elements = {
    stats: document.querySelector("#godsStats"),
    methodSummary: document.querySelector("#methodSummary"),
    methodNotes: document.querySelector("#methodNotes"),
    searchInput: document.querySelector("#searchInput"),
    domainFilters: document.querySelector("#domainFilters"),
    resultCount: document.querySelector("#resultCount"),
    updatedAt: document.querySelector("#updatedAt"),
    grid: document.querySelector("#godsGrid"),
    emptyState: document.querySelector("#emptyState"),
  };

  function normalizeText(value) {
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

  function renderStats() {
    const passed = state.items.filter((item) => item.score?.passed).length;
    const domains = new Set(state.items.map((item) => item.primaryDomain).filter(Boolean)).size;
    const rows = [
      ["收錄人物", state.items.length],
      ["通過門檻", passed],
      ["專精領域", domains],
    ];
    elements.stats.replaceChildren(...rows.map(([label, value]) => {
      const node = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = String(value);
      const span = document.createElement("span");
      span.textContent = label;
      node.append(strong, span);
      return node;
    }));
  }

  function renderMethod() {
    const method = state.data.method || {};
    const weights = method.weights || {};
    elements.methodSummary.textContent = method.summary || "以技術專精、作品影響力、實戰可學性與社群聲量加權評估。";
    const rows = [
      `技術專精 ${weights.technicalDepth ?? 35}%`,
      `作品影響力 ${weights.workImpact ?? 35}%`,
      `實戰可學性 ${weights.learnability ?? 25}%`,
      `社群聲量 ${weights.communitySignal ?? 5}%`,
      ...(method.notes || []),
    ];
    elements.methodNotes.replaceChildren(...rows.map((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      return li;
    }));
  }

  function renderFilters() {
    const domains = ["全部", ...new Set(state.items.map((item) => item.primaryDomain).filter(Boolean))];
    elements.domainFilters.replaceChildren(...domains.map((domain) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gods-pill";
      button.textContent = domain;
      button.setAttribute("aria-pressed", String(domain === state.selectedDomain));
      button.addEventListener("click", () => {
        state.selectedDomain = domain;
        renderFilters();
        renderGrid();
      });
      return button;
    }));
  }

  function searchText(item) {
    return normalizeText([
      item.name,
      item.handle,
      item.role,
      item.headline,
      item.summary,
      item.primaryDomain,
      ...(item.regions || []),
      ...(item.tags || []),
      ...(item.skillMap || []).map((skill) => `${skill.name} ${skill.summary}`).join(" "),
      ...(item.works || []).map((work) => `${work.name} ${work.summary}`).join(" "),
    ].join(" "));
  }

  function filteredItems() {
    const terms = normalizeText(state.query).split(/[\s,，、]+/).filter(Boolean);
    return state.items
      .filter((item) => state.selectedDomain === "全部" || item.primaryDomain === state.selectedDomain)
      .filter((item) => !terms.length || terms.every((term) => searchText(item).includes(term)))
      .sort((a, b) => (b.score?.weightedScore || 0) - (a.score?.weightedScore || 0));
  }

  function createCard(item) {
    const article = document.createElement("article");
    article.className = "gods-card";

    const top = document.createElement("div");
    top.className = "gods-card-top";
    const avatar = document.createElement("div");
    avatar.className = "gods-avatar";
    avatar.textContent = item.avatarText || item.name.slice(0, 2);
    const score = document.createElement("span");
    score.className = "gods-score";
    score.textContent = `入選分數 ${Number(item.score?.weightedScore || 0).toFixed(2)}`;
    top.append(avatar, score);

    const titleWrap = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = item.name;
    const handle = document.createElement("p");
    handle.className = "gods-handle";
    handle.textContent = item.handle || "";
    titleWrap.append(title, handle);

    const role = document.createElement("p");
    role.className = "gods-role";
    role.textContent = item.role || item.headline || "";
    const summary = document.createElement("p");
    summary.className = "gods-summary";
    summary.textContent = item.summary || "";

    const tags = document.createElement("div");
    tags.className = "gods-tag-row";
    for (const tag of (item.tags || []).slice(0, 6)) {
      const chip = document.createElement("span");
      chip.textContent = tag;
      tags.append(chip);
    }

    const skillList = document.createElement("ul");
    skillList.className = "gods-skill-list";
    for (const skill of (item.skillMap || []).slice(0, 4)) {
      const li = document.createElement("li");
      li.textContent = skill.name;
      skillList.append(li);
    }

    const why = document.createElement("p");
    why.className = "gods-why";
    why.textContent = item.score?.reason || "";

    const link = document.createElement("a");
    link.className = "gods-card-action";
    link.href = `./ai-god-detail.html?id=${encodeURIComponent(item.id)}`;
    link.textContent = "查看人物資料";

    article.append(top, titleWrap, role, summary, tags, skillList, why, link);
    return article;
  }

  function renderGrid() {
    const items = filteredItems();
    elements.grid.replaceChildren(...items.map(createCard));
    elements.resultCount.textContent = `顯示 ${items.length} / ${state.items.length} 位人物`;
    elements.emptyState.hidden = items.length > 0;
  }

  async function init() {
    const response = await fetch("./ai-gods.json", { cache: "no-store" });
    if (!response.ok) throw new Error("無法載入 AI 大神資料");
    state.data = await response.json();
    state.items = Array.isArray(state.data.items) ? state.data.items : [];
    elements.updatedAt.textContent = `更新時間：${formatDate(state.data.updatedAt || state.data.generatedAt)}`;
    renderStats();
    renderMethod();
    renderFilters();
    renderGrid();
    elements.searchInput.addEventListener("input", (event) => {
      state.query = event.target.value;
      renderGrid();
    });
  }

  init().catch((error) => {
    elements.grid.replaceChildren();
    elements.resultCount.textContent = error.message;
    elements.emptyState.hidden = false;
  });
}());
