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

  function compactText(value = "", max = 900) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (!text) return "";
    return text.length > max ? `${text.slice(0, max - 1)}...` : text;
  }

  function topicSignals(item) {
    const text = `${item.originalTitle} ${item.originalExcerpt || ""}`.toLowerCase();
    const signals = [];
    if (text.includes("agent")) signals.push("Agent 工作流程");
    if (text.includes("coding") || text.includes("codex") || text.includes("cursor") || text.includes("claude code")) signals.push("AI coding");
    if (text.includes("local") || text.includes("llm") || text.includes("glm") || text.includes("qwen") || text.includes("deepseek")) signals.push("LLM / Local LLM");
    if (text.includes("mcp") || text.includes("tool")) signals.push("工具串接");
    if (text.includes("embedding") || text.includes("reranker") || text.includes("rag")) signals.push("檢索與記憶");
    if (text.includes("benchmark") || text.includes("benchmarked")) signals.push("效能評估");
    if (text.includes("policy") || text.includes("safe") || text.includes("prompt injection")) signals.push("治理與安全");
    return signals.length ? [...new Set(signals)] : ["AI Agent / LLM 趨勢"];
  }

  function detailBullets(item) {
    const signals = topicSignals(item);
    const sourceTone = item.sourceKey === "hn"
      ? "Hacker News 的討論通常偏工程判斷，適合觀察開發者怎麼評估工具、風險與實作成本。"
      : "Reddit 的討論通常偏第一線使用心得，適合看實際配置、踩坑經驗與社群反應。";
    return [
      `主題焦點：${signals.join("、")}。先用這些關鍵字判斷它和你目前想學的 AI Agent 能力是否相關。`,
      sourceTone,
      "閱讀時建議優先看：它解決什麼問題、需要哪些工具或模型、實作門檻高不高，以及是否能轉成自己的工作流程。",
      "如果文章提到 benchmark、速度、成本或安全性，要把它當作參考訊號，不要直接當成最終結論；最好再看留言或原始來源交叉確認。",
    ];
  }

  function readingTips(item) {
    if (item.sourceKey === "hn") {
      return [
        "先看原文連結，再看 HN 討論頁的高分留言，通常能快速看到優點、疑慮與替代方案。",
        "如果是工具或服務，注意它是否需要帳號、API key、雲端環境，或能否在本機/公司環境使用。",
        "把有用的概念記成一句話：這個工具能讓哪一段 Agent 工作變得更可靠或更省時間。",
      ];
    }
    return [
      "先看貼文本文，再看前幾則留言，通常能看到真實使用者遇到的限制與設定細節。",
      "如果內容和硬體、模型速度或本機部署有關，注意作者的設備條件，不要直接套用到自己的環境。",
      "把可複製的部分拆出來：模型、工具、參數、流程、失敗原因，之後可以變成自己的測試清單。",
    ];
  }

  function discussionQuestions(item) {
    const signals = topicSignals(item);
    return [
      `這篇提到的 ${signals[0]}，能不能放進我們自己的 AI Agent 學習路線？`,
      "如果要做成內部教學，初學者需要先補哪些前置知識？",
      "它最值得實驗的是工具本身、工作流程，還是背後的判斷方法？",
    ];
  }

  function createListSection(titleText, items) {
    const section = document.createElement("section");
    section.className = "article-section";
    const title = document.createElement("h2");
    title.textContent = titleText;
    const list = document.createElement("ul");
    for (const item of items) {
      const li = document.createElement("li");
      li.textContent = item;
      list.append(li);
    }
    section.append(title, list);
    return section;
  }

  function createExcerptSection(item) {
    const excerpt = compactText(item.excerptZh || item.originalExcerpt || "", 900);
    if (!excerpt) return null;
    const section = document.createElement("section");
    section.className = "article-section";
    const title = document.createElement("h2");
    title.textContent = item.sourceKey === "reddit" ? "社群討論摘錄" : "原文摘要摘錄";
    const text = document.createElement("p");
    text.className = "article-callout";
    text.textContent = excerpt;
    section.append(title, text);
    return section;
  }

  function createContentSection(item) {
    const fallback = [
      item.excerptZh || item.originalExcerpt || "",
      `這篇內容和 ${topicSignals(item).join("、")} 有關。閱讀時可以先掌握它討論的問題、使用到的模型或工具，以及它對 AI Agent 工作流程的實際影響。`,
      "如果要把這篇變成學習材料，建議把可操作的部分拆成：背景問題、工具/模型、實作方法、限制風險、可以自己測試的任務。",
    ].map((text) => compactText(text, 900)).filter(Boolean);
    const paragraphs = Array.isArray(item.contentZh) && item.contentZh.length
      ? item.contentZh.filter(Boolean)
      : fallback;
    if (!paragraphs.length) return null;
    const section = document.createElement("section");
    section.className = "article-section";
    const title = document.createElement("h2");
    title.textContent = "中文內容整理";
    section.append(title);
    for (const paragraph of paragraphs) {
      const text = document.createElement("p");
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

    const breakdown = createListSection("重點拆解", detailBullets(item));
    const translatedContent = createContentSection(item);
    const excerpt = createExcerptSection(item);
    const tips = createListSection("閱讀建議", readingTips(item));
    const questions = createListSection("可以帶走的問題", discussionQuestions(item));

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

    const contentSections = [source, title, original, summary, why];
    if (translatedContent) contentSections.push(translatedContent);
    contentSections.push(breakdown);
    if (excerpt) contentSections.push(excerpt);
    contentSections.push(tips, questions, sourceSection, back);
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
