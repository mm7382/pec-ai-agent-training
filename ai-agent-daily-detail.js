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

  function splitParagraphs(value = "") {
    return String(value || "")
      .split(/\n{2,}|\r?\n/)
      .map((text) => text.replace(/\s+/g, " ").trim())
      .filter(Boolean);
  }

  function createTranslatedOriginalSection(item) {
    const paragraphs = splitParagraphs(item.sourceTextZh || item.excerptZh || item.originalExcerpt || "");
    if (!paragraphs.length) return null;
    const section = document.createElement("section");
    section.className = "article-section";
    const title = document.createElement("h2");
    title.textContent = item.sourceKey === "hn" && item.sourceContentType === "hn-discussion"
      ? "Hacker News 原始討論繁中翻譯"
      : "原始內容繁中翻譯";
    section.append(title);
    for (const paragraph of paragraphs) {
      const text = document.createElement("p");
      text.textContent = paragraph;
      section.append(text);
    }
    return section;
  }

  function createOriginalTextSection(item) {
    const paragraphs = splitParagraphs(item.sourceOriginalText || item.originalExcerpt || "");
    if (!paragraphs.length) return null;
    const section = document.createElement("section");
    section.className = "article-section";
    const title = document.createElement("h2");
    title.textContent = "來源原文";
    section.append(title);
    for (const paragraph of paragraphs) {
      const text = document.createElement("p");
      text.className = "article-original-block";
      text.textContent = paragraph;
      section.append(text);
    }
    return section;
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

    const translatedContent = createTranslatedOriginalSection(item);
    const originalContent = createOriginalTextSection(item);

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

    const contentSections = [source, title, original];
    if (translatedContent) contentSections.push(translatedContent);
    if (originalContent) contentSections.push(originalContent);
    contentSections.push(sourceSection, back);
    main.append(...contentSections);

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
