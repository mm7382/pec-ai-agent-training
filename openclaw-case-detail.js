(function () {
  const main = document.querySelector("#caseMain");
  const side = document.querySelector("#caseSide");
  const params = new URLSearchParams(window.location.search);
  const idParam = params.get("id") || "";

  function formatDate(value) {
    if (!value) return "未知";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    return new Intl.DateTimeFormat("zh-Hant-TW", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  }

  function formatDateTime(value) {
    if (!value) return "未知";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("zh-Hant-TW", { dateStyle: "medium", timeStyle: "short", hour12: false }).format(date);
  }

  function formatViews(value) {
    return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));
  }

  function addText(parent, text, className) {
    if (!text) return null;
    const p = document.createElement("p");
    if (className) p.className = className;
    p.textContent = text;
    parent.append(p);
    return p;
  }

  function section(titleText) {
    const node = document.createElement("section");
    node.className = "case-section";
    const title = document.createElement("h2");
    title.textContent = titleText;
    node.append(title);
    return node;
  }

  function paragraphsFromLongText(text) {
    return String(text || "")
      .split(/\n{2,}/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function fallbackDetails(item) {
    const tags = (item.tags || []).slice(0, 5).join("、") || "OpenClaw、AI Agent、自動化";
    return [
      `這個案例可以先從「${item.category}」角度理解：它不是只看工具名稱，而是觀察 OpenClaw 如何被放進實際任務中。重點是看清楚案例要解決什麼問題、需要哪些工具或 API，以及 Agent 在流程中負責判斷、執行還是整理。`,
      `可參考的學習方向包含：${tags}。閱讀時可以把它拆成三件事：輸入資料是什麼、OpenClaw 被要求完成什麼動作、最後產出如何被人檢查或接續使用。這樣會比只看影片標題更容易轉成自己的工作流程。`,
      `如果要套用到自己的環境，建議先做小範圍測試：只接一個明確任務、一個資料來源與一個輸出格式。確認 prompt、權限與錯誤處理穩定後，再逐步加入更多工具或自動化步驟。`,
    ];
  }

  function listSection(titleText, items) {
    const node = section(titleText);
    const list = document.createElement("ul");
    for (const item of items || []) {
      const li = document.createElement("li");
      li.textContent = item;
      list.append(li);
    }
    node.append(list);
    return node;
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

  function normalizePrompt(prompt) {
    if (typeof prompt === "string") return prompt;
    if (!prompt || typeof prompt !== "object") return JSON.stringify(prompt, null, 2);
    return prompt.prompt || prompt.text || prompt.content || JSON.stringify(prompt, null, 2);
  }

  function renderPrompts(item) {
    const prompts = item.prompts || [];
    if (!prompts.length) return null;
    const node = section("可複製 Prompt");
    prompts.forEach((prompt, index) => {
      const text = normalizePrompt(prompt);
      const block = document.createElement("pre");
      block.className = "case-prompt";
      block.textContent = text;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "case-copy";
      button.textContent = prompts.length > 1 ? `複製 Prompt ${index + 1}` : "複製 Prompt";
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(text);
          button.textContent = "已複製";
          window.setTimeout(() => {
            button.textContent = prompts.length > 1 ? `複製 Prompt ${index + 1}` : "複製 Prompt";
          }, 1400);
        } catch {
          button.textContent = "無法複製，請手動選取";
        }
      });
      node.append(block, button);
    });
    return node;
  }

  function render(item, data) {
    document.title = `${item.titleHighlight || item.title} - OpenClaw 使用案例`;
    main.replaceChildren();
    side.replaceChildren();

    const kicker = document.createElement("p");
    kicker.className = "case-kicker";
    kicker.textContent = `OpenClaw Use Case · ${item.category}`;
    const title = document.createElement("h1");
    title.className = "case-title";
    title.textContent = item.titleHighlight || item.title;
    const summary = document.createElement("p");
    summary.className = "case-summary";
    summary.textContent = item.summary || "OpenClaw 相關使用案例。";
    const tags = document.createElement("div");
    tags.className = "case-tags";
    for (const tag of item.tags || []) {
      const span = document.createElement("span");
      span.textContent = tag;
      tags.append(span);
    }

    const media = document.createElement("a");
    media.className = "case-media";
    media.href = item.url;
    media.target = "_blank";
    media.rel = "noreferrer";
    const image = document.createElement("img");
    image.src = item.thumbnail;
    image.alt = "";
    media.append(image);

    const intro = section("簡介");
    addText(intro, item.summary);

    const detail = section("詳細說明");
    const longParagraphs = paragraphsFromLongText(item.summaryLong);
    for (const paragraph of longParagraphs.length ? longParagraphs : fallbackDetails(item)) {
      addText(detail, paragraph);
    }

    const learning = listSection("可以怎麼學", [
      "先確認這個案例解決的是哪一類工作問題，而不是只記工具名稱。",
      "把影片中的流程拆成輸入、Agent 任務、工具權限、輸出與人工檢查五個部分。",
      "如果要實作，先做小型測試，再把可重複的步驟整理成自己的 prompt 或 SOP。",
    ]);

    const source = section("來源與著作權");
    const sourceList = document.createElement("ul");
    const sourceRows = [
      ["YouTube 原始影片", item.url],
      ["來源資料庫", data.sourceSite],
      ["來源頻道", data.youtubeChannel],
    ];
    for (const [label, href] of sourceRows) {
      if (!href) continue;
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = href;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = href;
      li.append(`${label}：`, link);
      sourceList.append(li);
    }
    source.append(sourceList);
    addText(source, "本頁為學習整理入口，影片與原始資料著作權歸原作者與來源網站所有。");

    const back = document.createElement("a");
    back.className = "back-link";
    back.href = "./openclaw-cases.html";
    back.textContent = "返回 OpenClaw 使用案例";

    const promptSection = renderPrompts(item);
    main.append(kicker, title, summary, tags, media, intro, detail, learning);
    if (promptSection) main.append(promptSection);
    main.append(source, back);

    const sideTitle = document.createElement("h2");
    sideTitle.textContent = "案例資訊";
    const metrics = document.createElement("div");
    metrics.className = "case-metrics";
    addMetric(metrics, "分類", item.category);
    addMetric(metrics, "觀看數", `${formatViews(item.viewCount)} views`);
    addMetric(metrics, "影片日期", formatDate(item.publishedAt));
    addMetric(metrics, "影片長度", item.duration || "未知");
    addMetric(metrics, "Prompt", item.prompts?.length ? `${item.prompts.length} 組` : "無");
    addMetric(metrics, "來源更新", formatDateTime(data.sourceLastUpdated));
    const actions = document.createElement("div");
    actions.className = "case-actions";
    const primary = document.createElement("a");
    primary.className = "case-primary";
    primary.href = item.url;
    primary.target = "_blank";
    primary.rel = "noreferrer";
    primary.textContent = "開啟 YouTube";
    const secondary = document.createElement("a");
    secondary.className = "case-secondary";
    secondary.href = "./openclaw-cases.html";
    secondary.textContent = "回案例庫";
    actions.append(primary, secondary);
    side.append(sideTitle, metrics, actions);
  }

  async function init() {
    const response = await fetch("./openclaw-cases.json", { cache: "no-store" });
    if (!response.ok) throw new Error("無法載入 OpenClaw 使用案例資料");
    const data = await response.json();
    const item = (data.videos || []).find((video) => video.id === idParam);
    if (!item) throw new Error("找不到指定的 OpenClaw 使用案例。");
    render(item, data);
  }

  init().catch((error) => {
    main.replaceChildren();
    const kicker = document.createElement("p");
    kicker.className = "case-kicker";
    kicker.textContent = "Error";
    const title = document.createElement("h1");
    title.className = "case-title";
    title.textContent = error.message;
    const back = document.createElement("a");
    back.className = "back-link";
    back.href = "./openclaw-cases.html";
    back.textContent = "返回 OpenClaw 使用案例";
    main.append(kicker, title, back);
    side.replaceChildren();
  });
}());
