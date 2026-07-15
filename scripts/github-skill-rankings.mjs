#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const workspaceRoot = resolve(new URL("..", import.meta.url).pathname);

const outputPath = join(workspaceRoot, "github-skill-rankings.json");
const githubApi = "https://api.github.com";
const maxCandidatesPerQuery = Number(process.env.GITHUB_SKILL_CANDIDATES_PER_QUERY || 40);
const rankingLimit = Number(process.env.GITHUB_SKILL_RANK_LIMIT || 5);
const searchDelayMs = Number(process.env.GITHUB_SEARCH_DELAY_MS || 2200);
const localAgentPath = join(workspaceRoot, "local-agent-radar.json");
const readmeCache = new Map();
const reactionCache = new Map();

const categories = [
  {
    key: "skill-workflow",
    label: "GitHub 熱門 Skill / Workflow",
    shortLabel: "Skill / Workflow",
    cardLabel: "Skill / Workflow",
    description: "看方法、流程、Skill 設計、AGENTS.md / CLAUDE.md、context engineering 與工作流模板。",
    include: ["skill", "skills", "skill.md", "agent-skills", "ai-agent-skills", "openclaw", "workflow", "prompt", "agent", "claude", "codex", "context", "memory", "agents.md", "claude.md", "rules", "knowledge", "pokerskill", "poker skill"],
    primary: ["skill", "skills", "skill.md", "agent-skills", "ai-agent-skills", "openclaw", "workflow", "prompt", "context", "memory", "agents.md", "claude.md", "rules", "pokerskill"],
    queries(sinceDate) {
      return [
        `ai agent skill workflow in:name,description,readme pushed:>=${sinceDate} fork:false archived:false`,
        `claude codex skill in:name,description,readme pushed:>=${sinceDate} fork:false archived:false`,
        `agents.md claude.md agent workflow in:readme,description pushed:>=${sinceDate} fork:false archived:false`,
        `context engineering agent workflow in:name,description,readme pushed:>=${sinceDate} fork:false archived:false`,
        `prompt workflow ai agent in:name,description,readme pushed:>=${sinceDate} fork:false archived:false`,
        `ai agent skills in:name,description,readme pushed:>=${sinceDate} fork:false archived:false`,
        `agent-skills skill.md in:name,description,readme pushed:>=${sinceDate} fork:false archived:false`,
        `openclaw skills agent in:name,description,readme pushed:>=${sinceDate} fork:false archived:false`,
        `pokerskill agent skill in:name,description,readme pushed:>=${sinceDate} fork:false archived:false`,
        `topic:ai-agent-skills pushed:>=${sinceDate} fork:false archived:false`,
      ];
    },
  },
  {
    key: "ai-open-source",
    label: "GitHub 熱門 AI 開源工具",
    shortLabel: "AI 開源工具",
    cardLabel: "AI 開源工具",
    description: "看 GitHub 上值得研究的 AI framework、SDK、MCP、AI coding 工具與 automation toolkit。",
    include: ["ai", "agent", "llm", "mcp", "coding", "automation", "sdk", "framework", "rag", "workflow", "tool", "agentic", "autonomous"],
    primary: ["mcp", "sdk", "framework", "coding", "automation", "rag", "toolkit", "developer", "workflow", "agentic"],
    queries(sinceDate) {
      return [
        `ai agent framework sdk in:name,description,readme pushed:>=${sinceDate} fork:false archived:false`,
        `mcp server ai tools in:name,description,readme pushed:>=${sinceDate} fork:false archived:false`,
        `ai coding tool agent in:name,description,readme pushed:>=${sinceDate} fork:false archived:false`,
        `llm automation toolkit in:name,description,readme pushed:>=${sinceDate} fork:false archived:false`,
        `rag agent workflow tool in:name,description,readme pushed:>=${sinceDate} fork:false archived:false`,
        `autonomous agent ai coding in:name,description,readme pushed:>=${sinceDate} fork:false archived:false`,
        `agentic workflow open source in:name,description,readme pushed:>=${sinceDate} fork:false archived:false`,
      ];
    },
  },
];

const manualRepoOverrides = {
  "affaan-m/ecc": {
    oneLineZh: "把 Claude Code、Codex、Cursor 等 AI coding agent 的 skills、記憶、安全檢查與研究流程整理成一套工程化工作法。",
    introZh: "ECC 是給 AI coding agent 使用的工程工作流工具包。它不是單一聊天工具，而是把 skills、記憶、研究優先、安全掃描與多工具設定整理成可重複使用的 agent harness。",
  },
  "thedotmack/claude-mem": {
    oneLineZh: "替 Claude Code 類 agent 補上跨對話記憶，把重要上下文壓縮後帶到未來任務。",
    introZh: "claude-mem 聚焦在 agent 記憶管理。它會捕捉工作過程中的重要資訊，壓縮成可重用上下文，讓下一次任務不必從零開始。",
  },
  "ruvnet/ruflo": {
    oneLineZh: "面向多代理工作流的 agent harness，重點在記憶、協調、安全帶與自主流程管理。",
    introZh: "ruflo 把多代理協作、記憶、RAG、工具與 Claude Code / OpenAI 類工作流放在一起，適合用來研究 agent workflow 如何被工程化管理。",
  },
  "zhayujie/cowagent": {
    oneLineZh: "開源 AI 助理與 agent harness，可規劃任務、使用工具與技能，並結合記憶和知識。",
    introZh: "CowAgent 是偏完整助理架構的開源專案。它把任務規劃、工具使用、技能、記憶與知識放進同一個 agent harness，適合研究完整 agent 系統如何組合。",
  },
  "mksglu/context-mode": {
    oneLineZh: "幫 AI coding agent 管理 context window，壓縮工具輸出並降低上下文浪費。",
    introZh: "context-mode 的重點是上下文管理。它把工具輸出、session memory 與跨平台路由整理成一套機制，適合學習如何讓 agent 在長任務中不被雜訊拖慢。",
  },
  "activepieces/activepieces": {
    oneLineZh: "開源工作流程自動化平台，結合 AI agent、MCP server 與大量第三方工具整合。",
    introZh: "Activepieces 是開源 automation 平台。它的價值在於把 AI agent、MCP 與各種 SaaS/工具連接起來，適合觀察 AI 自動化如何落地到日常工作流程。",
  },
  "headroomlabs-ai/headroom": {
    oneLineZh: "在內容送進 LLM 前先壓縮工具輸出、log、檔案與 RAG 區塊，降低 token 消耗。",
    introZh: "Headroom 解決的是 LLM/agent 工作流常見的上下文爆量問題。它可用在工具輸出、log、檔案與 RAG 區塊進入模型前的壓縮與整理。",
  },
  "bytedance/deer-flow": {
    oneLineZh: "開源 long-running agent 工具，面向研究、coding 與內容生成等較長時間任務。",
    introZh: "deer-flow 是用來研究 long-running agent 的開源工具。它結合 sandbox、memory、tools、skills、sub-agents 與 message gateway，適合觀察複雜任務如何拆解與執行。",
  },
  "n8n-io/n8n": {
    oneLineZh: "開源 workflow automation 平台，近年加入 AI 能力，適合把 AI 放進跨工具流程。",
    introZh: "n8n 是成熟的工作流程自動化平台。它不是單純 AI agent，但很適合學習如何把 AI 節點、API、資料來源和各種工作工具接成可執行流程。",
  },
  "langchain-ai/langchain": {
    oneLineZh: "建立 LLM 應用與 agent workflow 的主流開源框架，適合研究 agent 工程基礎。",
    introZh: "LangChain 是 LLM application 與 agent engineering 的主流開源框架之一。它適合用來理解工具調用、chain、retrieval、agent orchestration 等基礎概念。",
  },
  "run-llama/llama_index": {
    oneLineZh: "主流 LLM 資料框架，常用來做 RAG、文件索引與 agent 可查詢的知識工具。",
    introZh: "LlamaIndex 是常見的 LLM data framework，重點在把文件、資料庫與外部知識整理成模型或 agent 可以查詢的結構。它適合用來理解 RAG、資料索引與知識工具如何支援 AI workflow。",
  },
};

function githubHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "adlink-github-skill-rankings",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: githubHeaders() });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`GitHub request failed ${response.status}: ${body.slice(0, 500)}`);
  }
  return JSON.parse(body);
}

async function fetchPublicJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json,text/plain,*/*",
      "User-Agent": "adlink-github-skill-rankings",
    },
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Request failed ${response.status}: ${body.slice(0, 500)}`);
  }
  return JSON.parse(body);
}

function daysAgo(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function compactText(value = "", max = 1800) {
  const clean = String(value || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s{0,3}[-*+]\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/[*_~#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}...` : clean;
}

async function translateToTraditionalChinese(text, fallback = "暫無簡介。") {
  if (!text) return fallback;
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "auto");
  url.searchParams.set("tl", "zh-TW");
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text.slice(0, 3900));
  try {
    const data = await fetchPublicJson(url);
    return normalizeChinese(data?.[0]?.map((part) => part?.[0]).filter(Boolean).join("").trim() || text);
  } catch {
    return normalizeChinese(text || fallback);
  }
}

function slugForRepo(fullName = "") {
  return fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function normalizeChinese(text = "") {
  return String(text || "")
    .replace(/座席/g, "agent")
    .replace(/克勞德/g, "Claude")
    .replace(/開放人工智慧/g, "OpenAI")
    .replace(/程式碼代理程式/g, "coding agent")
    .replace(/代理程式/g, "agent")
    .replace(/\s+/g, " ")
    .trim();
}

async function searchRepositories(query, sort = "stars") {
  const url = new URL(`${githubApi}/search/repositories`);
  url.searchParams.set("q", query);
  if (sort) url.searchParams.set("sort", sort);
  url.searchParams.set("order", "desc");
  url.searchParams.set("per_page", String(maxCandidatesPerQuery));
  const data = await fetchJson(url);
  await sleep(searchDelayMs);
  return data.items || [];
}

function loadLocalAgentRepoNames() {
  if (!existsSync(localAgentPath)) return new Set();
  try {
    const data = JSON.parse(readFileSync(localAgentPath, "utf8"));
    const names = new Set();
    for (const period of data.periods || []) {
      for (const agent of period.agents || []) {
        if (agent.fullName) names.add(agent.fullName.toLowerCase());
      }
    }
    return names;
  } catch {
    return new Set();
  }
}

function relevanceScore(repo, category) {
  const repoName = String(repo.full_name || "").toLowerCase();
  const blockedRepos = new Set([
    "anthropics/claude-code",
    "open-webui/open-webui",
    "shanraisshan/claude-code-best-practice",
  ]);
  if (category.key === "ai-open-source" && blockedRepos.has(repoName)) return 0;
  const haystack = [
    repo.full_name,
    repo.name,
    repo.description,
    ...(repo.topics || []),
  ].join(" ").toLowerCase();
  const weakExclusions = ["awesome-list", "awesome ", "awesome-", "papers", "paper-list", "dataset", "model zoo"];
  if (weakExclusions.some((term) => haystack.includes(term))) return 0;
  if (category.key === "ai-open-source" && (haystack.includes("best-practice") || haystack.includes("best practice"))) return 0;
  const includeHits = category.include.filter((term) => haystack.includes(term)).length;
  const primaryHits = category.primary.filter((term) => haystack.includes(term)).length;
  const aiHits = ["ai", "agent", "agents", "llm", "openai", "anthropic", "claude", "codex", "mcp"].filter((term) => haystack.includes(term)).length;
  if (primaryHits === 0 || aiHits === 0) return 0;
  return primaryHits * 9 + includeHits * 4 + aiHits * 5 + Math.log10((repo.stargazers_count || 0) + 1);
}

function rankScore(repo, periodDays, category) {
  const updatedAt = new Date(repo.pushed_at || repo.updated_at || 0).getTime();
  const ageDays = Number.isFinite(updatedAt) ? Math.max(0, (Date.now() - updatedAt) / 86400000) : periodDays;
  const recency = Math.max(0, periodDays - ageDays) / periodDays;
  const freshnessBoost = ageDays <= 2 ? 35 : ageDays <= 7 ? 18 : 0;
  return (Math.log10((repo.stargazers_count || 0) + 1) * 100)
    + (relevanceScore(repo, category) * 10)
    + (recency * 25)
    + Math.log10((repo.forks_count || 0) + 1) * 10
    + Math.log10((repo.open_issues_count || 0) + 1) * 6
    + freshnessBoost;
}

async function getReadme(repo) {
  if (readmeCache.has(repo.full_name)) return readmeCache.get(repo.full_name);
  try {
    const data = await fetchJson(`${githubApi}/repos/${repo.full_name}/readme`);
    const readme = Buffer.from(data.content || "", data.encoding || "base64").toString("utf8");
    readmeCache.set(repo.full_name, readme);
    return readme;
  } catch {
    readmeCache.set(repo.full_name, "");
    return "";
  }
}

async function getReactionStats(repo) {
  if (reactionCache.has(repo.full_name)) return reactionCache.get(repo.full_name);
  try {
    const url = new URL(`${githubApi}/search/issues`);
    url.searchParams.set("q", `repo:${repo.full_name} reactions:>0`);
    url.searchParams.set("sort", "reactions");
    url.searchParams.set("order", "desc");
    url.searchParams.set("per_page", "8");
    const data = await fetchJson(url);
    const items = data.items || [];
    const totals = items.reduce((acc, item) => {
      acc.likes += Number(item.reactions?.["+1"] || 0);
      acc.hearts += Number(item.reactions?.heart || 0);
      acc.total += Number(item.reactions?.total_count || 0);
      return acc;
    }, { likes: 0, hearts: 0, total: 0 });
    const stats = {
      ...totals,
      samples: items.slice(0, 3).map((item) => ({
        title: item.title,
        url: item.html_url,
        likes: Number(item.reactions?.["+1"] || 0),
        hearts: Number(item.reactions?.heart || 0),
        comments: Number(item.comments || 0),
      })),
    };
    reactionCache.set(repo.full_name, stats);
    return stats;
  } catch {
    const empty = { likes: 0, hearts: 0, total: 0, samples: [] };
    reactionCache.set(repo.full_name, empty);
    return empty;
  }
}

function repoSummarySource(repo, readme) {
  return [
    repo.description || "",
    compactText(readme, 1400),
  ].filter(Boolean).join("\n\n");
}

function buildOneLine(repo, descriptionZh, category) {
  const fallback = category.key === "skill-workflow"
    ? "整理 AI Agent 工作方法與流程設計的開源專案。"
    : "值得研究的 AI 開源工具或開發框架。";
  const text = compactText(descriptionZh || repo.description || fallback, 120);
  return text || fallback;
}

function buildAudience(repo, category) {
  const haystack = [repo.full_name, repo.description, ...(repo.topics || [])].join(" ").toLowerCase();
  if (category.key === "skill-workflow") {
    const audience = ["想建立 AI Agent 工作流程的人", "需要整理 prompt / rules / knowledge 的人"];
    if (haystack.includes("claude") || haystack.includes("codex")) audience.push("正在使用 Claude Code 或 Codex 的人");
    return audience;
  }
  const audience = ["想追 GitHub AI 工具趨勢的人", "想評估開源工具是否值得研究的人"];
  if (haystack.includes("mcp")) audience.push("正在研究 MCP / tool server 的人");
  if (haystack.includes("sdk") || haystack.includes("framework")) audience.push("想做 AI 應用或 agent prototype 的人");
  return audience;
}

function buildUseCases(repo, category) {
  if (category.key === "skill-workflow") {
    return [
      "拿來學習別人如何設計 AI Agent 的任務流程、規則與上下文。",
      "拆解 README 或範本，轉成自己的 AGENTS.md、Skill 或團隊 SOP。",
      "作為教學案例，練習判斷一個 workflow 是否能落地到真實工作。",
    ];
  }
  return [
    "快速了解 GitHub 上工程師正在關注哪些 AI 工具與開源框架。",
    "作為技術選型的第一輪觀察清單，再決定是否深入測試或交給 agent 研究。",
    "補充 Local Agent 之外的開源趨勢，例如 SDK、MCP、AI coding 與 automation toolkit。",
  ];
}

function buildNotFor(category) {
  if (category.key === "skill-workflow") {
    return [
      "只想直接下載一個現成 App、完全不想調整流程的人。",
      "沒有打算整理自己的任務規則、知識庫或交辦方式的人。",
    ];
  }
  return [
    "只想找可以立刻本機安裝的 Local Agent 使用者；這類請看 Local Agent 熱門分頁。",
    "完全不想看 README、授權、issues 或基本安裝條件的人。",
  ];
}

function buildAttentionNotes(category) {
  if (category.key === "skill-workflow") {
    return [
      "不要看到熱門就直接整包套用，先確認它的規則是否符合自己的工作方式。",
      "如果要放進公司或團隊流程，應先檢查是否會要求敏感資料、API key 或過高權限。",
      "Skill / Workflow 的價值通常在設計思路，不一定是安裝後立刻有工具可用。",
    ];
  }
  return [
    "先看 license、最近更新、open issues 與安全邊界，再決定是否下載或交給 agent 測試。",
    "這裡收錄的是 GitHub 開源趨勢，不代表每個專案都適合直接導入正式工作。",
    "如果專案主打本機安裝或 self-host Agent，會盡量留到 Local Agent 熱門分頁處理。",
  ];
}

function buildContentZh(repo, descriptionZh, introZh, category) {
  const topics = (repo.topics || []).slice(0, 8).join("、") || "AI Agent / coding workflow";
  const opener = introZh || descriptionZh || "這個專案和 AI Agent / AI coding 工作流有關。";
  if (category.key === "skill-workflow") {
    return [
      opener,
      `從 topics 來看，它和 ${topics} 有關。閱讀時可以先判斷它是在解決 prompt、rules、context、memory、workflow 還是團隊操作方法。`,
      "這類 repo 最值得學的通常不是照抄檔案，而是理解作者如何把模糊任務拆成可重複執行的流程。你可以把它當作範例，練習改寫成自己的 AGENTS.md、Skill 或團隊工作規則。",
      "導入前建議先用一個小任務驗證：讓 AI 依照它的流程完成一次真實工作，再看輸出品質、上下文消耗、風險邊界與維護成本。",
    ];
  }
  return [
    opener,
    `從 topics 來看，它和 ${topics} 有關。閱讀時可以先判斷它是 framework、SDK、MCP server、AI coding 工具、RAG 工具還是 automation toolkit。`,
    "這類 repo 適合用來看 GitHub 上的 AI 工具趨勢。你不一定要立刻安裝，而是先理解它解決什麼痛點、需要哪些前置條件，以及能不能放進自己的 AI Agent 工作流。",
    "導入前建議檢查授權、近期更新、open issues、安裝方式與資料存放位置。AI 工具通常會接觸程式碼、指令、資料或 API key，不能只看星數決定是否採用。",
  ];
}

function buildDiscussionZh(samples = []) {
  if (!samples.length) {
    return ["目前沒有抓到足夠的公開 Issue / PR reaction 資料。建議先看 README、更新時間與 open issues 判斷專案活躍度。"];
  }
  return samples.map((item) => {
    const signals = [];
    if (item.likes) signals.push(`👍 ${item.likes}`);
    if (item.hearts) signals.push(`❤️ ${item.hearts}`);
    if (item.comments) signals.push(`留言 ${item.comments}`);
    return `「${item.title}」是目前較多人互動的討論之一（${signals.join("、") || "有公開互動"}）。這代表使用者關注的可能是功能缺口、安裝問題、設定方式或專案方向，閱讀時可以把它當成導入前的風險與需求提示。`;
  });
}

async function enrichRepo(repo, category, period, rank) {
  const [readme, reactions] = await Promise.all([
    getReadme(repo),
    getReactionStats(repo),
  ]);
  const intro = repoSummarySource(repo, readme);
  const descriptionZh = await translateToTraditionalChinese(repo.description || intro, "暫無簡介。");
  const introZh = await translateToTraditionalChinese(intro, descriptionZh);
  const contentZh = buildContentZh(repo, descriptionZh, introZh, category);
  const discussionZh = buildDiscussionZh(reactions.samples);
  const override = manualRepoOverrides[repo.full_name.toLowerCase()] || {};
  const enriched = {
    id: slugForRepo(repo.full_name),
    rank,
    period,
    periodKey: period,
    categoryKey: category.key,
    categoryLabel: category.label,
    categoryShortLabel: category.shortLabel,
    typeLabel: category.cardLabel,
    fullName: repo.full_name,
    name: repo.name,
    owner: repo.owner?.login || repo.full_name.split("/")[0],
    description: repo.description || "",
    descriptionZh,
    oneLineZh: buildOneLine(repo, descriptionZh, category),
    introZh,
    contentZh,
    discussionZh,
    audience: buildAudience(repo, category),
    useCases: buildUseCases(repo, category),
    notFor: buildNotFor(category),
    attentionNotes: buildAttentionNotes(category),
    language: repo.language || "Unknown",
    topics: repo.topics || [],
    stars: Number(repo.stargazers_count || 0),
    forks: Number(repo.forks_count || 0),
    watchers: Number(repo.watchers_count || 0),
    openIssues: Number(repo.open_issues_count || 0),
    likes: reactions.likes,
    hearts: reactions.hearts,
    reactionTotal: reactions.total,
    reactionSamples: reactions.samples,
    updatedAt: repo.updated_at,
    pushedAt: repo.pushed_at,
    createdAt: repo.created_at,
    homepage: repo.homepage || "",
    url: repo.html_url,
    downloadUrl: `${repo.html_url}/archive/refs/heads/${repo.default_branch || "main"}.zip`,
    cloneUrl: repo.clone_url,
    license: repo.license?.spdx_id || repo.license?.name || "未標示",
  };
  return {
    ...enriched,
    ...override,
    contentZh: override.contentZh || buildContentZh(repo, override.descriptionZh || enriched.descriptionZh, override.introZh || enriched.introZh, category),
  };
}

async function collectPeriod({ category, key, label, days, localAgentRepoNames, excludedRepoNames = new Set() }) {
  const sinceDate = daysAgo(days);
  const byName = new Map();
  for (const query of category.queries(sinceDate)) {
    const repos = [
      ...(await searchRepositories(query, "stars")),
      ...(await searchRepositories(query, "updated")),
      ...(await searchRepositories(query, "")),
    ];
    for (const repo of repos) {
      if (excludedRepoNames.has(repo.full_name.toLowerCase())) continue;
      if (category.key === "ai-open-source" && localAgentRepoNames.has(repo.full_name.toLowerCase())) continue;
      const score = relevanceScore(repo, category);
      if (score <= 0) continue;
      const existing = byName.get(repo.full_name);
      if (!existing || rankScore(repo, days, category) > rankScore(existing, days, category)) {
        byName.set(repo.full_name, repo);
      }
    }
  }

  const ranked = [...byName.values()]
    .sort((a, b) => rankScore(b, days, category) - rankScore(a, days, category))
    .slice(0, rankingLimit);
  const repos = [];
  for (let index = 0; index < ranked.length; index += 1) {
    repos.push(await enrichRepo(ranked[index], category, key, index + 1));
  }
  return {
    key,
    label,
    days,
    sinceDate,
    rankingMethod: `GitHub Search API；條件為 ${category.label} 相關、pushed >= ${sinceDate}、非 fork、非 archived；依 stars、更新時間、forks、主題關聯度與人工品質檢查綜合排序。`,
    repos,
  };
}

async function main() {
  const localAgentRepoNames = loadLocalAgentRepoNames();
  const categoryPayloads = [];
  const selectedRepoNames = new Set();
  for (const category of categories) {
    const excludedRepoNames = category.key === "ai-open-source" ? selectedRepoNames : new Set();
    const periods = [
      await collectPeriod({ category, key: "weekly", label: `每週 Top ${rankingLimit}`, days: 7, localAgentRepoNames, excludedRepoNames }),
      await collectPeriod({ category, key: "monthly", label: `每月 Top ${rankingLimit}`, days: 30, localAgentRepoNames, excludedRepoNames }),
    ];
    for (const period of periods) {
      for (const repo of period.repos) selectedRepoNames.add(repo.fullName.toLowerCase());
    }
    categoryPayloads.push({
      key: category.key,
      label: category.label,
      shortLabel: category.shortLabel,
      description: category.description,
      periods,
    });
  }
  const payload = {
    generatedAt: new Date().toISOString(),
    title: "GitHub 熱門 Skill / AI 工具",
    source: "GitHub Search API + GitHub README + GitHub Issue/PR reactions",
    notes: [
      "只收錄與 AI Agent、Skill、AI coding、MCP、workflow、automation 相關的 GitHub 開源專案。",
      "Local 安裝型 Agent 會盡量保留到 Local Agent 熱門分頁，避免兩個分頁內容重複。",
      "卡片用白話導讀幫你快速判斷值不值得研究；詳細頁保留 GitHub URL、ZIP 與 clone 指令。",
      "排名不是官方推薦清單，而是 GitHub 搜尋資料加上人工品質確認後的學習入口。",
    ],
    categories: categoryPayloads,
    periods: categoryPayloads[0]?.periods || [],
  };
  mkdirSync(workspaceRoot, { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outputPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
