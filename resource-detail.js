(function () {
  const config = window.RESOURCE_DETAIL_CONFIG || {};
  const main = document.querySelector("#resourceMain");
  const side = document.querySelector("#resourceSide");
  const params = new URLSearchParams(window.location.search);
  const idParam = params.get("id") || "";

  function formatDate(value) {
    if (!value) return "未知";
    if (/^\d{8}$/.test(String(value))) {
      return `${String(value).slice(0, 4)}/${String(value).slice(4, 6)}/${String(value).slice(6, 8)}`;
    }
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

  function formatNumber(value) {
    if (!value) return "0";
    return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));
  }

  function addMetric(parent, label, value) {
    const row = document.createElement("div");
    const labelNode = document.createElement("span");
    labelNode.textContent = label;
    const valueNode = document.createElement("strong");
    valueNode.textContent = value || "未知";
    row.append(labelNode, valueNode);
    parent.append(row);
  }

  function section(titleText) {
    const node = document.createElement("section");
    node.className = "resource-section";
    const title = document.createElement("h2");
    title.textContent = titleText;
    node.append(title);
    return node;
  }

  function paragraphSection(titleText, paragraphs) {
    const node = section(titleText);
    for (const text of paragraphs || []) {
      const p = document.createElement("p");
      p.textContent = text;
      node.append(p);
    }
    return node;
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

  function render(item, data) {
    document.title = `${item.title} - ${data.title || config.title}`;
    main.replaceChildren();
    side.replaceChildren();

    const kicker = document.createElement("p");
    kicker.className = "resource-kicker";
    kicker.textContent = [item.sourceType, item.category].filter(Boolean).join(" · ");
    const title = document.createElement("h1");
    title.className = "resource-detail-title";
    title.textContent = item.title;
    const summary = document.createElement("p");
    summary.className = "resource-detail-summary";
    summary.textContent = item.summary || "公開學習資源。";
    const tags = document.createElement("div");
    tags.className = "resource-detail-tags";
    for (const tag of item.tags || []) {
      const span = document.createElement("span");
      span.textContent = tag;
      tags.append(span);
    }

    main.append(kicker, title, summary, tags);

    if (item.thumbnail) {
      const media = document.createElement("a");
      media.className = "resource-detail-media";
      media.href = item.url;
      media.target = "_blank";
      media.rel = "noreferrer";
      const fallback = document.createElement("span");
      fallback.className = "resource-thumb-fallback";
      fallback.textContent = item.channel || item.sourceName || item.category || "Video";
      const image = document.createElement("img");
      image.src = item.thumbnail;
      image.alt = "";
      image.addEventListener("error", () => {
        image.hidden = true;
      });
      media.append(fallback, image);
      main.append(media);
    }

    main.append(
      listSection("重點整理", item.highlights || []),
      listSection("適合誰", item.audience || []),
      paragraphSection("詳細說明", item.detail || []),
    );

    const source = section("來源與著作權");
    const list = document.createElement("ul");
    const rows = [
      ["來源", item.url],
      ["資料庫說明", data.description],
    ];
    for (const [label, value] of rows) {
      if (!value) continue;
      const li = document.createElement("li");
      if (String(value).startsWith("http")) {
        const link = document.createElement("a");
        link.href = value;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.textContent = value;
        li.append(`${label}：`, link);
      } else {
        li.textContent = `${label}：${value}`;
      }
      list.append(li);
    }
    source.append(list);
    const note = document.createElement("p");
    note.textContent = config.copyrightNote || "本頁為學習整理入口，原始內容與著作權歸來源網站與原作者所有。";
    source.append(note);

    const back = document.createElement("a");
    back.className = "resource-back-link";
    back.href = config.listUrl || "./index.html";
    back.textContent = `返回 ${data.title || config.title}`;
    main.append(source, back);

    const sideTitle = document.createElement("h2");
    sideTitle.textContent = "資料資訊";
    const metrics = document.createElement("div");
    metrics.className = "resource-metrics";
    addMetric(metrics, "分類", item.category);
    addMetric(metrics, "來源類型", item.sourceType);
    addMetric(metrics, "來源", item.channel || item.sourceName);
    addMetric(metrics, "日期", formatDate(item.publishedAt));
    if (item.language) addMetric(metrics, "語言", item.language);
    if (item.duration) addMetric(metrics, "長度", item.duration);
    if (item.viewCount) addMetric(metrics, "觀看數", `${formatNumber(item.viewCount)} views`);
    addMetric(metrics, "整理時間", formatDateTime(data.generatedAt));
    const actions = document.createElement("div");
    actions.className = "resource-side-actions";
    const primary = document.createElement("a");
    primary.className = "resource-primary";
    primary.href = item.url;
    primary.target = "_blank";
    primary.rel = "noreferrer";
    primary.textContent = item.sourceType === "YouTube" ? "開啟 YouTube" : "開啟來源";
    const secondary = document.createElement("a");
    secondary.className = "resource-secondary";
    secondary.href = config.listUrl || "./index.html";
    secondary.textContent = "回資料庫";
    actions.append(primary, secondary);
    side.append(sideTitle, metrics, actions);
  }

  async function init() {
    if (!config.dataUrl) throw new Error("缺少資料來源");
    const response = await fetch(config.dataUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`無法載入 ${config.title || "資料"}`);
    const data = await response.json();
    const item = (data.items || []).find((entry) => entry.id === idParam);
    if (!item) throw new Error("找不到指定資料。");
    render(item, data);
  }

  init().catch((error) => {
    main.replaceChildren();
    const title = document.createElement("h1");
    title.className = "resource-detail-title";
    title.textContent = error.message;
    const back = document.createElement("a");
    back.className = "resource-back-link";
    back.href = config.listUrl || "./index.html";
    back.textContent = "返回資料庫";
    main.append(title, back);
    side.replaceChildren();
  });
}());
