(function () {
  const main = document.querySelector("#detailMain");
  const side = document.querySelector("#sideCard");
  const params = new URLSearchParams(window.location.search);
  const repoParam = params.get("repo") || "";
  const periodParam = params.get("period") || "";
  const categoryParam = params.get("category") || "";

  function formatNumber(value) {
    return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));
  }

  function formatDate(value) {
    if (!value) return "未知";
    return new Intl.DateTimeFormat("zh-Hant-TW", { dateStyle: "medium", timeStyle: "short", hour12: false }).format(new Date(value));
  }

  function escapeHtml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function dataCategories(data) {
    if (data.categories?.length) return data.categories;
    return [{
      key: "skill-workflow",
      label: "GitHub 熱門 Skill / Workflow",
      shortLabel: "Skill / Workflow",
      periods: data.periods || [],
    }];
  }

  function findRepo(data) {
    for (const category of dataCategories(data)) {
      if (categoryParam && category.key !== categoryParam) continue;
      for (const period of category.periods || []) {
        if (periodParam && period.key !== periodParam) continue;
        const repo = (period.repos || []).find((item) => item.fullName === repoParam || item.id === repoParam);
        if (repo) return { repo, period, category };
      }
    }
    for (const category of dataCategories(data)) {
      for (const period of category.periods || []) {
        const repo = (period.repos || []).find((item) => item.fullName === repoParam || item.id === repoParam);
        if (repo) return { repo, period, category };
      }
    }
    return {};
  }

  function fallbackContent(repo, category) {
    if (category.key === "ai-open-source") {
      return [
        repo.introZh || repo.descriptionZh || "這是一個和 AI 開源工具相關的 GitHub 專案。",
        "可以先把它當成趨勢觀察，不一定要立刻安裝。重點是理解它解決什麼痛點、需要哪些前置條件，以及是否能放進自己的 AI Agent 工作流。",
      ];
    }
    return [
      repo.introZh || repo.descriptionZh || "這是一個和 AI Agent Skill / Workflow 相關的 GitHub 專案。",
      "可以先學它的流程設計，再決定要不要改寫成自己的 AGENTS.md、Skill 或團隊 SOP。",
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

  function renderListSection(title, items) {
    const list = (items || []).filter(Boolean);
    if (!list.length) return "";
    return `
      <section class="detail-section">
        <h2>${escapeHtml(title)}</h2>
        <ul>${list.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </section>
    `;
  }

  function renderFeedback(repo) {
    const samples = repo.reactionSamples || [];
    if (!samples.length) return "<p>目前沒有抓到足夠的公開 Issue / PR reaction 資料。</p>";
    return `<ul class="feedback-list">${samples.map((item) => `
      <li>
        <a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.title)}</a>
        <p>👍 ${formatNumber(item.likes)}　❤️ ${formatNumber(item.hearts)}　留言 ${formatNumber(item.comments)}</p>
      </li>
    `).join("")}</ul>`;
  }

  function render({ repo, period, category, data }) {
    document.title = `${repo.fullName} - GitHub 熱門 Skill / AI 工具`;
    const topics = (repo.topics || []).map((topic) => `<span>${escapeHtml(topic)}</span>`).join("");
    const introText = repo.introZh || repo.descriptionZh || "暫無 README 摘要。";
    const content = (repo.contentZh?.length ? repo.contentZh : fallbackContent(repo, category))
      .filter((item, index) => index !== 0 || item !== introText);
    const discussion = repo.discussionZh?.length ? repo.discussionZh : fallbackDiscussion(repo);
    main.innerHTML = `
      <p class="detail-kicker">${escapeHtml(category.shortLabel || category.label)} · ${escapeHtml(period.label)} · Rank ${repo.rank}</p>
      <h1 class="repo-title">${escapeHtml(repo.fullName)}</h1>
      <p class="repo-summary">${escapeHtml(repo.oneLineZh || repo.descriptionZh || repo.description || "暫無簡介。")}</p>
      <div class="topic-row">${topics}</div>

      ${renderParagraphSection("這是什麼", [introText])}
      ${renderParagraphSection("可以怎麼用", content)}
      ${renderListSection("適合誰", repo.audience || [])}
      ${renderListSection("不適合誰", repo.notFor || [])}
      ${renderListSection("導入前要注意", repo.attentionNotes || [])}

      <section class="detail-section">
        <h2>GitHub 討論重點</h2>
        ${renderFeedback(repo)}
      </section>

      ${renderParagraphSection("熱門討論整理", discussion, true)}

      <section class="detail-section">
        <h2>來源與下載</h2>
        <ul>
          <li>GitHub 專案頁：<a href="${escapeHtml(repo.url)}" target="_blank" rel="noreferrer">${escapeHtml(repo.url)}</a></li>
          <li>ZIP 下載：<a href="${escapeHtml(repo.downloadUrl)}" target="_blank" rel="noreferrer">${escapeHtml(repo.downloadUrl)}</a></li>
          <li>Git clone：<code>git clone ${escapeHtml(repo.cloneUrl)}</code></li>
          <li>資料產生時間：${formatDate(data.generatedAt)}</li>
        </ul>
      </section>

      <a class="back-link" href="./github-skills.html">返回 GitHub 熱門</a>
    `;
    side.innerHTML = `
      <h2>Repo 資訊</h2>
      <div class="metric-list">
        <div><span>分類</span><strong>${escapeHtml(repo.typeLabel || category.shortLabel || category.label)}</strong></div>
        <div><span>Stars</span><strong>⭐ ${formatNumber(repo.stars)}</strong></div>
        <div><span>Forks</span><strong>${formatNumber(repo.forks)}</strong></div>
        <div><span>Open Issues</span><strong>${formatNumber(repo.openIssues)}</strong></div>
        <div><span>語言</span><strong>${escapeHtml(repo.language || "Unknown")}</strong></div>
        <div><span>授權</span><strong>${escapeHtml(repo.license || "未標示")}</strong></div>
        <div><span>更新</span><strong>${formatDate(repo.pushedAt || repo.updatedAt)}</strong></div>
        <div><span>討論互動</span><strong>👍 ${formatNumber(repo.likes)} / ❤️ ${formatNumber(repo.hearts)}</strong></div>
      </div>
      <div class="action-list">
        <a class="primary-action" href="${escapeHtml(repo.url)}" target="_blank" rel="noreferrer">開啟 GitHub</a>
        <a class="secondary-action" href="${escapeHtml(repo.downloadUrl)}" target="_blank" rel="noreferrer">下載 ZIP</a>
      </div>
    `;
  }

  async function init() {
    const response = await fetch("./github-skill-rankings.json", { cache: "no-store" });
    if (!response.ok) throw new Error("無法載入 GitHub 熱門 Skill / AI 工具詳細資料");
    const data = await response.json();
    const found = findRepo(data);
    if (!found.repo) throw new Error("找不到指定的 GitHub repo。");
    render({ ...found, data });
  }

  init().catch((error) => {
    main.innerHTML = `<p class="detail-kicker">Error</p><h1 class="repo-title">${escapeHtml(error.message)}</h1><a class="back-link" href="./github-skills.html">返回 GitHub 熱門</a>`;
    side.innerHTML = "";
  });
}());
