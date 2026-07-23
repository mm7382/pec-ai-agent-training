(function () {
  const params = new URLSearchParams(window.location.search);
  const idParam = params.get("id") || "";
  const main = document.querySelector("#godMain");
  const side = document.querySelector("#godSide");

  function formatDate(value) {
    if (!value) return "未知";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    return new Intl.DateTimeFormat("zh-Hant-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }

  function section(titleText, className = "") {
    const node = document.createElement("section");
    node.className = ["god-section", className].filter(Boolean).join(" ");
    const title = document.createElement("h2");
    title.textContent = titleText;
    node.append(title);
    return node;
  }

  function paragraphs(titleText, rows) {
    const node = section(titleText);
    for (const text of rows || []) {
      const p = document.createElement("p");
      p.textContent = text;
      node.append(p);
    }
    return node;
  }

  function bulletList(titleText, rows) {
    const node = section(titleText);
    const list = document.createElement("ul");
    for (const text of rows || []) {
      const li = document.createElement("li");
      li.textContent = text;
      list.append(li);
    }
    node.append(list);
    return node;
  }

  function cardList(titleText, rows, options = {}) {
    const node = section(titleText);
    const list = document.createElement("div");
    list.className = "god-info-grid";
    for (const row of rows || []) {
      const card = document.createElement("article");
      card.className = "god-info-card";
      const title = document.createElement("h3");
      title.textContent = row.name || row.title || row.label || "項目";
      const summary = document.createElement("p");
      summary.textContent = row.summary || row.description || row.detail || "";
      card.append(title, summary);
      if (row.category || row.type || row.url) {
        const meta = document.createElement("div");
        meta.className = "god-info-meta";
        meta.textContent = [row.category, row.type].filter(Boolean).join(" · ");
        if (row.url) {
          const link = document.createElement("a");
          link.href = row.url;
          link.target = "_blank";
          link.rel = "noreferrer";
          link.textContent = options.linkText || "來源連結";
          meta.append(meta.textContent ? " · " : "", link);
        }
        card.append(meta);
      }
      list.append(card);
    }
    node.append(list);
    return node;
  }

  function scorePanel(item, data) {
    const node = section("為什麼入選 AI 大神", "god-score-section");
    const reason = document.createElement("p");
    reason.textContent = item.score?.reason || "符合本資料庫的技術、作品、可學性與社群聲量門檻。";
    const grid = document.createElement("div");
    grid.className = "god-score-grid";
    const weights = data.method?.weights || {};
    const rows = [
      ["技術專精", item.score?.technicalDepth, weights.technicalDepth],
      ["作品影響力", item.score?.workImpact, weights.workImpact],
      ["實戰可學性", item.score?.learnability, weights.learnability],
      ["社群聲量", item.score?.communitySignal, weights.communitySignal],
    ];
    for (const [label, value, weight] of rows) {
      const card = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = `${value || 0} / 5`;
      const span = document.createElement("span");
      span.textContent = `${label}${weight ? ` · 權重 ${weight}%` : ""}`;
      card.append(strong, span);
      grid.append(card);
    }
    node.append(reason, grid);
    return node;
  }

  function sourceSection(item) {
    const node = section("來源");
    const list = document.createElement("ul");
    for (const source of item.sources || []) {
      const li = document.createElement("li");
      if (source.url) {
        const link = document.createElement("a");
        link.href = source.url;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.textContent = source.title || source.label || source.url;
        li.append(link);
      } else {
        li.textContent = source.title || source.label || source.note || "來源";
      }
      if (source.note) li.append(`：${source.note}`);
      list.append(li);
    }
    node.append(list);
    const note = document.createElement("p");
    note.textContent = "本頁整理公開資料與 Michael 提供的截圖線索；原始內容與著作權歸來源網站與原作者所有。";
    node.append(note);
    return node;
  }

  function sideMetric(label, value) {
    const row = document.createElement("div");
    const span = document.createElement("span");
    span.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = value || "未知";
    row.append(span, strong);
    return row;
  }

  function render(item, data) {
    document.title = `${item.name} - AI 大神`;
    main.replaceChildren();
    side.replaceChildren();

    const hero = document.createElement("section");
    hero.className = "god-detail-hero";
    const avatar = document.createElement("div");
    avatar.className = "gods-avatar god-detail-avatar";
    avatar.textContent = item.avatarText || item.name.slice(0, 2);
    const kicker = document.createElement("p");
    kicker.className = "section-label";
    kicker.textContent = [item.primaryDomain, ...(item.regions || [])].filter(Boolean).join(" · ");
    const title = document.createElement("h1");
    title.className = "god-detail-title";
    title.textContent = item.name;
    const handle = document.createElement("p");
    handle.className = "gods-handle";
    handle.textContent = item.handle || "";
    const summary = document.createElement("p");
    summary.className = "god-detail-summary";
    summary.textContent = item.headline || item.summary || "";
    hero.append(avatar, kicker, title, handle, summary);

    const tags = document.createElement("div");
    tags.className = "gods-tag-row god-detail-tags";
    for (const tag of item.tags || []) {
      const chip = document.createElement("span");
      chip.textContent = tag;
      tags.append(chip);
    }
    hero.append(tags);

    main.append(
      hero,
      paragraphs("人物簡介", item.profile?.intro || [item.summary]),
      paragraphs("背景與代表經歷", item.profile?.background || []),
      cardList("發布的平台與網站", item.platforms || [], { linkText: "開啟網站" }),
      cardList("Skill Map", item.skillMap || []),
      cardList("代表作品 / 專案", item.works || [], { linkText: "查看作品" }),
      cardList("Workflow 分析", item.workflowAnalysis || []),
      cardList("文章與影片整理", item.articles || [], { linkText: "閱讀來源" }),
      scorePanel(item, data),
      bulletList("建議學習順序", item.learningPath || []),
      sourceSection(item),
    );

    const sideTitle = document.createElement("h2");
    sideTitle.textContent = "人物資訊";
    const metrics = document.createElement("div");
    metrics.className = "god-side-metrics";
    metrics.append(
      sideMetric("領域", item.primaryDomain),
      sideMetric("角色", item.role),
      sideMetric("入選分數", `${Number(item.score?.weightedScore || 0).toFixed(2)} / 5`),
      sideMetric("更新時間", formatDate(data.updatedAt || data.generatedAt)),
    );
    const action = document.createElement("div");
    action.className = "god-side-actions";
    const back = document.createElement("a");
    back.href = "./ai-gods.html";
    back.textContent = "回 AI 大神";
    const primaryPlatform = (item.platforms || []).find((platform) => platform.url);
    if (primaryPlatform) {
      const source = document.createElement("a");
      source.href = primaryPlatform.url;
      source.target = "_blank";
      source.rel = "noreferrer";
      source.textContent = "開啟主要網站";
      action.append(source);
    }
    action.append(back);
    side.append(sideTitle, metrics, action);
  }

  async function init() {
    const response = await fetch("./ai-gods.json", { cache: "no-store" });
    if (!response.ok) throw new Error("無法載入 AI 大神資料");
    const data = await response.json();
    const item = (data.items || []).find((entry) => entry.id === idParam);
    if (!item) throw new Error("找不到指定人物資料");
    render(item, data);
  }

  init().catch((error) => {
    main.replaceChildren();
    const title = document.createElement("h1");
    title.className = "god-detail-title";
    title.textContent = error.message;
    const back = document.createElement("a");
    back.className = "god-detail-back";
    back.href = "./ai-gods.html";
    back.textContent = "返回 AI 大神";
    main.append(title, back);
    side.replaceChildren();
  });
}());
