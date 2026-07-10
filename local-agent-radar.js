(function () {
  const state = { data: null, period: "daily" };
  const grid = document.querySelector("#agentGrid");
  const empty = document.querySelector("#emptyState");
  const sourceText = document.querySelector("#sourceText");
  const periodDescription = document.querySelector("#periodDescription");
  const generatedAt = document.querySelector("#generatedAt");
  const notesList = document.querySelector("#notesList");

  function formatNumber(value) {
    return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));
  }

  function formatDateTime(value) {
    if (!value) return "未知";
    return new Intl.DateTimeFormat("zh-Hant-TW", { dateStyle: "medium", timeStyle: "short", hour12: false }).format(new Date(value));
  }

  function activePeriod() {
    return state.data?.periods?.find((period) => period.key === state.period) || state.data?.periods?.[0];
  }

  function createCard(agent) {
    const article = document.createElement("article");
    article.className = "local-card";
    const tags = [agent.difficulty, ...(agent.runType || []).slice(0, 3)].filter(Boolean);
    article.innerHTML = `
      <div class="local-card-top">
        <span class="local-rank">${agent.rank}</span>
        <span class="local-ready">Local-ready</span>
      </div>
      <div>
        <h2 class="local-name">${agent.titleZh || agent.name}</h2>
        <p class="local-summary">${agent.oneLineZh || "可本機研究的 Agent 工具。"}</p>
      </div>
      <div class="local-tags">${tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
      <div class="local-metrics">
        <span>⭐ ${formatNumber(agent.stars)}</span>
        <span>Fork ${formatNumber(agent.forks)}</span>
        <span>${agent.language || "Unknown"}</span>
      </div>
      <p class="local-summary">適合：${(agent.audience || []).slice(0, 3).join("、")}</p>
      <div class="local-actions">
        <a class="local-detail-link" href="./local-agent-detail.html?period=${encodeURIComponent(agent.period)}&id=${encodeURIComponent(agent.id)}">查看詳細內容</a>
        <a class="local-source-link" href="${agent.url}" target="_blank" rel="noreferrer">GitHub / 下載</a>
      </div>
    `;
    return article;
  }

  function render() {
    const period = activePeriod();
    const agents = period?.agents || [];
    sourceText.textContent = `資料來源：${state.data?.source || "GitHub"}`;
    periodDescription.textContent = period?.description || "";
    generatedAt.textContent = state.data?.generatedAt ? `更新時間：${formatDateTime(state.data.generatedAt)}` : "更新時間：未知";
    notesList.replaceChildren(...(state.data?.notes || []).map((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      return li;
    }));
    grid.replaceChildren(...agents.map(createCard));
    empty.hidden = agents.length > 0;
  }

  function setupTabs() {
    document.querySelectorAll(".local-tab").forEach((button) => {
      button.addEventListener("click", () => {
        state.period = button.dataset.period || "daily";
        document.querySelectorAll(".local-tab").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
        render();
      });
    });
  }

  async function init() {
    setupTabs();
    const response = await fetch("./local-agent-radar.json", { cache: "no-store" });
    if (!response.ok) throw new Error("無法載入 Local Agent 資料");
    state.data = await response.json();
    render();
  }

  init().catch((error) => {
    sourceText.textContent = error.message;
    empty.hidden = false;
  });
}());
