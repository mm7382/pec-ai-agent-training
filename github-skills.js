(function () {
  const state = { data: null, category: "", period: "weekly" };
  const grid = document.querySelector("#rankGrid");
  const empty = document.querySelector("#emptyState");
  const source = document.querySelector("#rankSource");
  const method = document.querySelector("#rankMethod");
  const generatedAt = document.querySelector("#generatedAt");
  const notes = document.querySelector("#dataNotes");
  const categoryTabs = document.querySelector("#categoryTabs");

  function escapeHtml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));
  }

  function formatDate(value) {
    if (!value) return "未知";
    return new Intl.DateTimeFormat("zh-Hant-TW", { dateStyle: "medium", hour12: false }).format(new Date(value));
  }

  function formatDateTime(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat("zh-Hant-TW", { dateStyle: "medium", timeStyle: "short", hour12: false }).format(new Date(value));
  }

  function categories() {
    if (state.data?.categories?.length) return state.data.categories;
    return [{
      key: "skill-workflow",
      label: "GitHub 熱門 Skill / Workflow",
      shortLabel: "Skill / Workflow",
      description: "GitHub Skill 與 AI workflow 熱門排行。",
      periods: state.data?.periods || [],
    }];
  }

  function activeCategory() {
    return categories().find((category) => category.key === state.category) || categories()[0];
  }

  function activePeriod() {
    const category = activeCategory();
    return category?.periods?.find((period) => period.key === state.period) || category?.periods?.[0];
  }

  function createCategoryTab(category) {
    const button = document.createElement("button");
    button.className = "category-tab";
    button.type = "button";
    button.dataset.category = category.key;
    button.setAttribute("aria-pressed", String(category.key === state.category));
    button.innerHTML = `
      ${escapeHtml(category.label)}
      <span>${escapeHtml(category.description || "")}</span>
    `;
    button.addEventListener("click", () => {
      state.category = category.key;
      render();
    });
    return button;
  }

  function createCard(repo) {
    const article = document.createElement("article");
    article.className = "rank-card";
    const topics = (repo.topics || []).slice(0, 4).map((topic) => `<span>${escapeHtml(topic)}</span>`).join("");
    const audience = (repo.audience || []).slice(0, 2).join("、") || "想學 AI Agent 的人";
    article.innerHTML = `
      <div class="rank-card-top">
        <span class="rank-number">${repo.rank}</span>
        <span class="repo-type">${escapeHtml(repo.typeLabel || repo.categoryShortLabel || "GitHub")}</span>
      </div>
      <div>
        <h2 class="repo-name">${escapeHtml(repo.fullName)}</h2>
        <p class="repo-desc">${escapeHtml(repo.oneLineZh || repo.descriptionZh || repo.description || "暫無簡介。")}</p>
      </div>
      <div class="repo-tags">${topics}</div>
      <p class="repo-audience">適合：${escapeHtml(audience)}</p>
      <div class="repo-metrics">
        <div><strong>⭐ ${formatNumber(repo.stars)}</strong><span>Stars</span></div>
        <div><strong>${formatDate(repo.pushedAt || repo.updatedAt)}</strong><span>最近更新</span></div>
      </div>
      <a class="repo-link" href="./github-skill-detail.html?category=${encodeURIComponent(repo.categoryKey || state.category)}&period=${encodeURIComponent(repo.periodKey || repo.period)}&repo=${encodeURIComponent(repo.fullName)}">查看詳細內容</a>
    `;
    return article;
  }

  function renderCategoryTabs() {
    categoryTabs.replaceChildren(...categories().map(createCategoryTab));
  }

  function render() {
    if (!state.category) state.category = categories()[0]?.key || "";
    const category = activeCategory();
    const period = activePeriod();
    const repos = period?.repos || [];
    renderCategoryTabs();
    document.querySelectorAll(".rank-tab").forEach((item) => {
      item.setAttribute("aria-pressed", String(item.dataset.period === state.period));
    });
    source.textContent = `資料來源：${state.data?.source || "GitHub"} · ${category?.shortLabel || category?.label || ""}`;
    method.textContent = period?.rankingMethod || "";
    generatedAt.textContent = state.data?.generatedAt ? `更新時間：${formatDateTime(state.data.generatedAt)}` : "更新時間：未知";
    notes.replaceChildren(...(state.data?.notes || []).map((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      return li;
    }));
    grid.replaceChildren(...repos.map(createCard));
    empty.hidden = repos.length > 0;
  }

  function setupTabs() {
    document.querySelectorAll(".rank-tab").forEach((button) => {
      button.addEventListener("click", () => {
        state.period = button.dataset.period || "weekly";
        render();
      });
    });
  }

  async function init() {
    setupTabs();
    const response = await fetch("./github-skill-rankings.json", { cache: "no-store" });
    if (!response.ok) throw new Error("無法載入 GitHub 熱門 Skill / AI 工具資料");
    state.data = await response.json();
    state.category = categories()[0]?.key || "";
    render();
  }

  init().catch((error) => {
    source.textContent = error.message;
    empty.hidden = false;
  });
}());
