(function () {
  const main = document.querySelector("#detailMain");
  const side = document.querySelector("#sideCard");
  const params = new URLSearchParams(window.location.search);
  const repoParam = params.get("repo") || "";
  const periodParam = params.get("period") || "";

  function formatNumber(value) {
    return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));
  }

  function formatDate(value) {
    if (!value) return "未知";
    return new Intl.DateTimeFormat("zh-Hant-TW", { dateStyle: "medium", timeStyle: "short", hour12: false }).format(new Date(value));
  }

  function findRepo(data) {
    for (const period of data.periods || []) {
      if (periodParam && period.key !== periodParam) continue;
      const repo = (period.repos || []).find((item) => item.fullName === repoParam || item.id === repoParam);
      if (repo) return { repo, period };
    }
    for (const period of data.periods || []) {
      const repo = (period.repos || []).find((item) => item.fullName === repoParam || item.id === repoParam);
      if (repo) return { repo, period };
    }
    return {};
  }

  function renderFeedback(repo) {
    const samples = repo.reactionSamples || [];
    if (!samples.length) return "<p>目前沒有抓到足夠的公開 Issue / PR reaction 資料。</p>";
    return `<ul class="feedback-list">${samples.map((item) => `
      <li>
        <a href="${item.url}" target="_blank" rel="noreferrer">${item.title}</a>
        <p>👍 ${formatNumber(item.likes)}　❤️ ${formatNumber(item.hearts)}　留言 ${formatNumber(item.comments)}</p>
      </li>
    `).join("")}</ul>`;
  }

  function escapeHtml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function fallbackContent(repo) {
    const topics = (repo.topics || []).slice(0, 8).join("、") || "AI Agent / AI coding";
    return [
      repo.introZh || repo.descriptionZh || "這個專案和 AI Agent / AI coding 工作流有關。",
      `從 topics 來看，它和 ${topics} 有關。閱讀時可以先判斷它是工具、框架、設定集合、記憶系統，還是安全治理，再決定是否適合放進自己的 Skill 或 Agent 工作流。`,
      "導入前建議檢查授權、近期更新、open issues、安裝方式與資料存放位置。AI Agent 工具通常會接觸程式碼、指令、記憶或 API key，不能只看星數決定是否採用。",
    ];
  }

  function fallbackDiscussion(repo) {
    const samples = repo.reactionSamples || [];
    if (!samples.length) return ["目前沒有抓到足夠的公開 Issue / PR reaction 資料。建議先看 README、更新時間與 open issues 判斷專案活躍度。"];
    return samples.map((item) => {
      const metrics = [`👍 ${formatNumber(item.likes)}`, `❤️ ${formatNumber(item.hearts)}`, `留言 ${formatNumber(item.comments)}`].join("　");
      return `「${item.title}」是較多人互動的討論之一（${metrics}）。這代表使用者正在關注功能缺口、安裝問題、設定方式或專案方向，可作為導入前的需求與風險提示。`;
    });
  }

  function renderParagraphSection(title, paragraphs, callout = false) {
    const list = (paragraphs || []).filter(Boolean);
    if (!list.length) return "";
    return `
      <section class="detail-section">
        <h2>${escapeHtml(title)}</h2>
        ${list.map((item) => `<p class="${callout ? "detail-callout" : ""}">${escapeHtml(item)}</p>`).join("")}
      </section>
    `;
  }

  function render({ repo, period, data }) {
    document.title = `${repo.fullName} - GitHub Skill 詳細內容`;
    const topics = (repo.topics || []).map((topic) => `<span>${topic}</span>`).join("");
    main.innerHTML = `
      <p class="detail-kicker">${period.label} · Rank ${repo.rank}</p>
      <h1 class="repo-title">${repo.fullName}</h1>
      <p class="repo-summary">${repo.descriptionZh || repo.description || "暫無簡介。"}</p>
      <div class="topic-row">${topics}</div>

      <section class="detail-section">
        <h2>專案介紹</h2>
        <p>${repo.introZh || repo.descriptionZh || "暫無 README 摘要。"}</p>
      </section>

      ${renderParagraphSection("中文內容整理", repo.contentZh?.length ? repo.contentZh : fallbackContent(repo))}

      <section class="detail-section">
        <h2>適合放進 Skill 知識庫的原因</h2>
        <ul>
          <li>它在 GitHub 上具備高星數與近期更新，代表有一定社群關注度。</li>
          <li>專案描述、README 或 topics 與 AI agent、Claude、Codex、LLM workflow 或 Skill engineering 有關。</li>
          <li>可作為 ADLINK 內部教材的案例：學員可以練習判斷 README、授權、Issues、下載方式與導入風險。</li>
        </ul>
      </section>

      <section class="detail-section">
        <h2>GitHub 熱門回饋</h2>
        ${renderFeedback(repo)}
      </section>

      ${renderParagraphSection("熱門討論整理", repo.discussionZh?.length ? repo.discussionZh : fallbackDiscussion(repo), true)}

      <section class="detail-section">
        <h2>下載與來源</h2>
        <ul>
          <li>GitHub 專案頁：<a href="${repo.url}" target="_blank" rel="noreferrer">${repo.url}</a></li>
          <li>ZIP 下載：<a href="${repo.downloadUrl}" target="_blank" rel="noreferrer">${repo.downloadUrl}</a></li>
          <li>Git clone：<code>${repo.cloneUrl}</code></li>
          <li>資料產生時間：${formatDate(data.generatedAt)}</li>
        </ul>
      </section>

      <a class="back-link" href="./github-skills.html">返回排行頁</a>
    `;
    side.innerHTML = `
      <h2>指標</h2>
      <div class="metric-list">
        <div><span>Stars / 讚數</span><strong>⭐ ${formatNumber(repo.stars)}</strong></div>
        <div><span>Issue/PR 讚</span><strong>👍 ${formatNumber(repo.likes)}</strong></div>
        <div><span>Issue/PR 愛心</span><strong>❤️ ${formatNumber(repo.hearts)}</strong></div>
        <div><span>Forks</span><strong>${formatNumber(repo.forks)}</strong></div>
        <div><span>Open Issues</span><strong>${formatNumber(repo.openIssues)}</strong></div>
        <div><span>語言</span><strong>${repo.language || "Unknown"}</strong></div>
        <div><span>授權</span><strong>${repo.license || "未標示"}</strong></div>
        <div><span>更新</span><strong>${formatDate(repo.pushedAt || repo.updatedAt)}</strong></div>
      </div>
      <div class="action-list">
        <a class="primary-action" href="${repo.url}" target="_blank" rel="noreferrer">開啟 GitHub</a>
        <a class="secondary-action" href="${repo.downloadUrl}" target="_blank" rel="noreferrer">下載 ZIP</a>
      </div>
    `;
  }

  async function init() {
    const response = await fetch("./github-skill-rankings.json", { cache: "no-store" });
    if (!response.ok) throw new Error("無法載入 GitHub Skill 詳細資料");
    const data = await response.json();
    const found = findRepo(data);
    if (!found.repo) throw new Error("找不到指定的 GitHub repo。");
    render({ ...found, data });
  }

  init().catch((error) => {
    main.innerHTML = `<p class="detail-kicker">Error</p><h1 class="repo-title">${error.message}</h1><a class="back-link" href="./github-skills.html">返回排行頁</a>`;
    side.innerHTML = "";
  });
}());
