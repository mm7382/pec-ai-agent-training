(function () {
  const state = { data: null, period: "weekly" };
  const grid = document.querySelector("#rankGrid");
  const empty = document.querySelector("#emptyState");
  const source = document.querySelector("#rankSource");
  const method = document.querySelector("#rankMethod");
  const generatedAt = document.querySelector("#generatedAt");
  const notes = document.querySelector("#dataNotes");

  function formatNumber(value) {
    return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));
  }

  function formatDate(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat("zh-Hant-TW", { dateStyle: "medium", timeStyle: "short", hour12: false }).format(new Date(value));
  }

  function activePeriod() {
    return state.data?.periods?.find((period) => period.key === state.period) || state.data?.periods?.[0];
  }

  function createCard(repo) {
    const article = document.createElement("article");
    article.className = "rank-card";
    const topics = (repo.topics || []).slice(0, 4).map((topic) => `<span>${topic}</span>`).join("");
    article.innerHTML = `
      <div class="rank-number">${repo.rank}</div>
      <div>
        <h2 class="repo-name">${repo.fullName}</h2>
        <p class="repo-desc">${repo.descriptionZh || repo.description || "暫無簡介。"}</p>
      </div>
      <div class="repo-tags">${topics}</div>
      <div class="repo-metrics">
        <div><strong>⭐ ${formatNumber(repo.stars)}</strong><span>Stars / 讚數</span></div>
        <div><strong>👍 ${formatNumber(repo.likes)}</strong><span>Issue/PR 讚</span></div>
        <div><strong>❤️ ${formatNumber(repo.hearts)}</strong><span>Issue/PR 愛心</span></div>
      </div>
      <p class="repo-source">${repo.url}</p>
      <a class="repo-link" href="./github-skill-detail.html?period=${encodeURIComponent(repo.period)}&repo=${encodeURIComponent(repo.fullName)}">查看詳細內容</a>
    `;
    return article;
  }

  function render() {
    const period = activePeriod();
    const repos = period?.repos || [];
    source.textContent = `資料來源：${state.data?.source || "GitHub"}`;
    method.textContent = period?.rankingMethod || "";
    generatedAt.textContent = state.data?.generatedAt ? `更新時間：${formatDate(state.data.generatedAt)}` : "更新時間：未知";
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
        document.querySelectorAll(".rank-tab").forEach((item) => {
          item.setAttribute("aria-pressed", String(item === button));
        });
        render();
      });
    });
  }

  async function init() {
    setupTabs();
    const response = await fetch("./github-skill-rankings.json", { cache: "no-store" });
    if (!response.ok) throw new Error("無法載入 GitHub Skill 排行資料");
    state.data = await response.json();
    render();
  }

  init().catch((error) => {
    source.textContent = error.message;
    empty.hidden = false;
  });
}());
