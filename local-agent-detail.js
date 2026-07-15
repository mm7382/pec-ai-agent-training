(function () {
  const main = document.querySelector("#agentMain");
  const side = document.querySelector("#agentSide");
  const params = new URLSearchParams(window.location.search);
  const idParam = params.get("id") || "";
  const periodParam = params.get("period") || "";

  function formatNumber(value) {
    return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));
  }

  function formatDateTime(value) {
    if (!value) return "未知";
    return new Intl.DateTimeFormat("zh-Hant-TW", { dateStyle: "medium", timeStyle: "short", hour12: false }).format(new Date(value));
  }

  function findAgent(data) {
    for (const period of data.periods || []) {
      if (periodParam && period.key !== periodParam) continue;
      const agent = (period.agents || []).find((item) => item.id === idParam || item.fullName === idParam);
      if (agent) return { agent, period };
    }
    for (const period of data.periods || []) {
      const agent = (period.agents || []).find((item) => item.id === idParam || item.fullName === idParam);
      if (agent) return { agent, period };
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

  function sectionWithParagraphs(titleText, paragraphs, callout = false) {
    const section = document.createElement("section");
    section.className = "agent-section";
    const title = document.createElement("h2");
    title.textContent = titleText;
    section.append(title);
    for (const paragraph of paragraphs || []) {
      const p = document.createElement("p");
      if (callout) p.className = "agent-callout";
      p.textContent = paragraph;
      section.append(p);
    }
    return section;
  }

  function sectionWithList(titleText, items) {
    const section = document.createElement("section");
    section.className = "agent-section";
    const title = document.createElement("h2");
    title.textContent = titleText;
    const list = document.createElement("ul");
    for (const item of items || []) {
      const li = document.createElement("li");
      li.textContent = item;
      list.append(li);
    }
    section.append(title, list);
    return section;
  }

  function render({ agent, period, data }) {
    document.title = `${agent.titleZh || agent.name} - Local Agent 詳細內容`;
    main.replaceChildren();
    side.replaceChildren();

    const kicker = document.createElement("p");
    kicker.className = "agent-kicker";
    kicker.textContent = `${period.label} · Rank ${agent.rank} · Local-ready`;
    const title = document.createElement("h1");
    title.className = "agent-title";
    title.textContent = agent.titleZh || agent.name;
    const summary = document.createElement("p");
    summary.className = "agent-summary";
    summary.textContent = agent.oneLineZh || "可本機研究的 Agent 工具。";
    const tags = document.createElement("div");
    tags.className = "agent-tags";
    for (const tag of [agent.difficulty, ...(agent.runType || []), ...(agent.modelSupport || []).slice(0, 3)].filter(Boolean)) {
      const span = document.createElement("span");
      span.textContent = tag;
      tags.append(span);
    }

    const sourceSection = document.createElement("section");
    sourceSection.className = "agent-section";
    const sourceTitle = document.createElement("h2");
    sourceTitle.textContent = "下載與來源";
    const sourceList = document.createElement("ul");
    const links = [
      ["GitHub 專案頁", agent.url],
      ["Release 頁", agent.releaseUrl],
      ["ZIP 下載", agent.downloadUrl],
    ];
    for (const [label, href] of links) {
      if (!href) continue;
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = href;
      a.target = "_blank";
      a.rel = "noreferrer";
      a.textContent = href;
      li.append(`${label}：`, a);
      sourceList.append(li);
    }
    const clone = document.createElement("li");
    clone.append("Git clone：");
    const code = document.createElement("code");
    code.textContent = `git clone ${agent.cloneUrl}`;
    clone.append(code);
    sourceList.append(clone);
    sourceSection.append(sourceTitle, sourceList);

    const back = document.createElement("a");
    back.className = "back-link";
    back.href = "./local-agent-radar.html";
    back.textContent = "返回 Local Agent 熱門";

    main.append(
      kicker,
      title,
      summary,
      tags,
      sectionWithParagraphs("詳細介紹", agent.contentZh || []),
      sectionWithList("適合的 Agent / Workflow", agent.audience || []),
      sectionWithList("適合做什麼", agent.useCases || []),
      sectionWithParagraphs("如何開始試", [agent.installConcept || "請參考 GitHub README 安裝。"]),
      sectionWithList("優點", agent.strengths || []),
      sectionWithList("限制與風險", agent.limitations || []),
      sectionWithList("不適合誰", agent.notFor || []),
      sectionWithParagraphs("熱門討論整理", agent.discussionZh || [], true),
      sourceSection,
      back,
    );

    const sideTitle = document.createElement("h2");
    sideTitle.textContent = "Agent 資訊";
    const metrics = document.createElement("div");
    metrics.className = "agent-metrics";
    addMetric(metrics, "Repo", agent.fullName);
    addMetric(metrics, "難度", agent.difficulty || "未知");
    addMetric(metrics, "Stars", `⭐ ${formatNumber(agent.stars)}`);
    addMetric(metrics, "Forks", formatNumber(agent.forks));
    addMetric(metrics, "Open Issues", formatNumber(agent.openIssues));
    addMetric(metrics, "語言", agent.language || "Unknown");
    addMetric(metrics, "授權", agent.license || "未標示");
    addMetric(metrics, "更新", formatDateTime(agent.pushedAt || agent.updatedAt));
    addMetric(metrics, "資料更新", formatDateTime(data.generatedAt));
    const actions = document.createElement("div");
    actions.className = "agent-actions";
    const primary = document.createElement("a");
    primary.className = "agent-primary";
    primary.href = agent.url;
    primary.target = "_blank";
    primary.rel = "noreferrer";
    primary.textContent = "開啟 GitHub";
    const secondary = document.createElement("a");
    secondary.className = "agent-secondary";
    secondary.href = agent.downloadUrl;
    secondary.target = "_blank";
    secondary.rel = "noreferrer";
    secondary.textContent = "下載 ZIP";
    actions.append(primary, secondary);
    side.append(sideTitle, metrics, actions);
  }

  async function init() {
    const response = await fetch("./local-agent-radar.json", { cache: "no-store" });
    if (!response.ok) throw new Error("無法載入 Local Agent 詳細資料");
    const data = await response.json();
    const found = findAgent(data);
    if (!found.agent) throw new Error("找不到指定的 Local Agent。");
    render({ ...found, data });
  }

  init().catch((error) => {
    main.replaceChildren();
    const kicker = document.createElement("p");
    kicker.className = "agent-kicker";
    kicker.textContent = "Error";
    const title = document.createElement("h1");
    title.className = "agent-title";
    title.textContent = error.message;
    const back = document.createElement("a");
    back.className = "back-link";
    back.href = "./local-agent-radar.html";
    back.textContent = "返回 Local Agent 熱門";
    main.append(kicker, title, back);
    side.replaceChildren();
  });
}());
