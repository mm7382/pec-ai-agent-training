(function () {
  const main = document.querySelector("#articleMain");
  const side = document.querySelector("#articleSide");
  const params = new URLSearchParams(window.location.search);
  const idParam = params.get("id") || "";
  const periodParam = params.get("period") || "";

  function formatDateTime(value) {
    if (!value) return "未知";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "未知";
    return new Intl.DateTimeFormat("zh-Hant-TW", {
      dateStyle: "medium",
      timeStyle: "short",
      hour12: false,
    }).format(date);
  }

  function findItem(data) {
    for (const period of data.periods || []) {
      if (periodParam && period.key !== periodParam) continue;
      for (const groupKey of ["hn", "reddit"]) {
        const item = (period[groupKey] || []).find((entry) => entry.id === idParam);
        if (item) return { item, period };
      }
    }
    for (const period of data.periods || []) {
      for (const groupKey of ["hn", "reddit"]) {
        const item = (period[groupKey] || []).find((entry) => entry.id === idParam);
        if (item) return { item, period };
      }
    }
    return {};
  }

  function addMetric(parent, label, value) {
    const row = document.createElement("div");
    const labelNode = document.createElement("span");
    labelNode.textContent = label;
    const valueNode = document.createElement("strong");
    valueNode.textContent = value;
    row.append(labelNode, valueNode);
    parent.append(row);
  }

  function render({ item, period, data }) {
    document.title = `${item.titleZh || item.originalTitle} - AI Agent 熱門文章`;
    main.replaceChildren();
    side.replaceChildren();

    const source = document.createElement("p");
    source.className = "article-source";
    source.textContent = `${period.label} · ${item.source}`;

    const title = document.createElement("h1");
    title.className = "article-title";
    title.textContent = item.titleZh || item.originalTitle;

    const original = document.createElement("p");
    original.className = "article-original";
    original.textContent = item.originalTitle;

    const summary = document.createElement("p");
    summary.className = "article-summary";
    summary.textContent = item.summaryZh || "這篇文章和 AI Agent / LLM 實作趨勢有關。";

    const why = document.createElement("section");
    why.className = "article-section";
    const whyTitle = document.createElement("h2");
    whyTitle.textContent = "為什麼值得看";
    const whyText = document.createElement("p");
    whyText.textContent = item.summaryZh || "可用來快速掌握社群正在討論的工具、模型或工作流程。";
    why.append(whyTitle, whyText);

    const sourceSection = document.createElement("section");
    sourceSection.className = "article-section";
    const sourceTitle = document.createElement("h2");
    sourceTitle.textContent = "來源網址";
    const sourceList = document.createElement("ul");
    const sourceItem = document.createElement("li");
    const sourceLink = document.createElement("a");
    sourceLink.href = item.url;
    sourceLink.target = "_blank";
    sourceLink.rel = "noreferrer";
    sourceLink.textContent = item.url;
    sourceItem.append(sourceLink);
    sourceList.append(sourceItem);
    if (item.discussionUrl && item.discussionUrl !== item.url) {
      const discussionItem = document.createElement("li");
      const discussionLink = document.createElement("a");
      discussionLink.href = item.discussionUrl;
      discussionLink.target = "_blank";
      discussionLink.rel = "noreferrer";
      discussionLink.textContent = item.discussionUrl;
      discussionItem.append("討論頁：", discussionLink);
      sourceList.append(discussionItem);
    }
    sourceSection.append(sourceTitle, sourceList);

    const back = document.createElement("a");
    back.className = "back-link";
    back.href = `./ai-agent-daily.html`;
    back.textContent = "返回每日熱門";

    main.append(source, title, original, summary, why, sourceSection, back);

    const sideTitle = document.createElement("h2");
    sideTitle.textContent = "文章資訊";
    const metrics = document.createElement("div");
    metrics.className = "article-metrics";
    addMetric(metrics, "來源", item.source);
    addMetric(metrics, "區間", period.label);
    addMetric(metrics, "排名", `#${item.rank}`);
    addMetric(metrics, "發布時間", formatDateTime(item.createdAt));
    if (item.sourceKey === "hn") {
      addMetric(metrics, "HN points", String(item.points || 0));
      addMetric(metrics, "HN comments", String(item.comments || 0));
    }
    if (item.subreddit) addMetric(metrics, "Subreddit", `r/${item.subreddit}`);
    addMetric(metrics, "資料更新", formatDateTime(data.generatedAt));

    const actions = document.createElement("div");
    actions.className = "article-actions";
    const primary = document.createElement("a");
    primary.className = "article-primary";
    primary.href = item.url;
    primary.target = "_blank";
    primary.rel = "noreferrer";
    primary.textContent = "開啟來源";
    const secondary = document.createElement("a");
    secondary.className = "article-secondary";
    secondary.href = "./ai-agent-daily.html";
    secondary.textContent = "回熱門列表";
    actions.append(primary, secondary);

    side.append(sideTitle, metrics, actions);
  }

  async function init() {
    const response = await fetch("./ai-agent-daily.json", { cache: "no-store" });
    if (!response.ok) throw new Error("無法載入 AI Agent 熱門文章資料");
    const data = await response.json();
    const found = findItem(data);
    if (!found.item) throw new Error("找不到指定的熱門文章。");
    render({ ...found, data });
  }

  init().catch((error) => {
    main.replaceChildren();
    const source = document.createElement("p");
    source.className = "article-source";
    source.textContent = "Error";
    const title = document.createElement("h1");
    title.className = "article-title";
    title.textContent = error.message;
    const back = document.createElement("a");
    back.className = "back-link";
    back.href = "./ai-agent-daily.html";
    back.textContent = "返回每日熱門";
    main.append(source, title, back);
    side.replaceChildren();
  });
}());
