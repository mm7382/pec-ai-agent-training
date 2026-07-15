#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const workspaceRoot = resolve(new URL("..", import.meta.url).pathname);

const outputPath = join(workspaceRoot, "local-agent-radar.json");
const githubApi = "https://api.github.com";

const periods = [
  {
    key: "daily",
    label: "每日前五",
    description: "偏近期更新、可下載試跑、適合今天研究的 Local Agent。",
    repos: [
      "browser-use/browser-use",
      "OpenHands/OpenHands",
      "cline/cline",
      "kortix-ai/suna",
      "openinterpreter/openinterpreter",
    ],
  },
  {
    key: "weekly",
    label: "每週前五",
    description: "偏成熟度、討論度與可長期研究價值的 Local Agent / Agent 框架。",
    repos: [
      "Significant-Gravitas/AutoGPT",
      "crewAIInc/crewAI",
      "bytedance/UI-TARS-desktop",
      "simular-ai/Agent-S",
      "langgenius/dify",
    ],
  },
];

const details = {
  "browser-use/browser-use": {
    titleZh: "browser-use",
    oneLineZh: "把瀏覽器操作變成 Agent 可以理解與執行的自動化工具，適合研究本機瀏覽器任務代理。",
    difficulty: "中階",
    runType: ["Python", "Playwright", "Browser Agent"],
    modelSupport: ["OpenAI-compatible API", "Claude", "Gemini", "Local LLM 視設定而定"],
    audience: [
      "Agent 類型：瀏覽器操作型 / Web automation agent",
      "核心功能：讀取頁面狀態、點擊、輸入、跳轉與等待",
      "運用場景：把查詢、填表、比價、後台巡檢等重複網頁流程交給 agent 試跑",
    ],
    notFor: ["只想看教學、不想安裝 Python 的人", "完全不想碰瀏覽器自動化設定的人"],
    useCases: ["自動填表與瀏覽網站", "整理搜尋結果與網頁資料", "把重複性後台操作交給 Agent", "研究 browser agent loop", "搭配 local model 測試網頁任務"],
    installConcept: "通常以 Python 套件方式使用，搭配 Playwright 控制瀏覽器；需要準備模型 API 或可相容的 local model endpoint。",
    strengths: ["社群討論度高", "任務範圍清楚，專注 browser automation", "適合拿來做 Local Operator 類實驗"],
    limitations: ["真實網站常會遇到登入、驗證碼、版面變動與反自動化限制", "Local LLM 是否好用取決於模型能力與視覺/DOM 表示方式"],
    contentZh: [
      "browser-use 的重點是把網站操作整理成 Agent 可以執行的流程。它通常會讓模型讀取目前瀏覽器狀態，決定下一步要點擊、輸入、跳轉或等待，然後再把新的狀態回傳給模型，形成一個 browser agent loop。",
      "它適合研究「Local Operator」這類任務：在自己的電腦上跑瀏覽器，讓 Agent 幫你完成重複性網頁操作。和純 API workflow 不同，browser agent 必須面對真實網頁的不穩定性，例如按鈕位置、登入狀態、彈窗、cookie banner 和頁面載入時間。",
      "如果要試用，建議先從低風險網站和明確任務開始，例如開頁、搜尋、整理結果、填簡單表單。不要一開始就讓它處理付款、帳號設定或重要資料提交。教學上可以把它當成瀏覽器工具調用與任務回圈的代表案例。",
    ],
  },
  "OpenHands/OpenHands": {
    titleZh: "OpenHands",
    oneLineZh: "開源 AI coding agent，可 self-host，目標是讓 Agent 像工程師一樣讀程式、改程式、跑指令。",
    difficulty: "進階",
    runType: ["Self-host", "Python", "Docker", "Coding Agent"],
    modelSupport: ["OpenAI", "Claude", "OpenAI-compatible API", "部分 local model 可透過相容 API 接入"],
    audience: [
      "Agent 類型：完整 AI coding / software engineering agent",
      "核心功能：讀 repo、改檔、跑 shell、測試與修 bug",
      "運用場景：把明確的工程任務放進 sandbox，讓 agent 迭代到可審查的 diff",
    ],
    notFor: ["沒有 Docker / 開發環境經驗的人", "只想要簡單聊天工具的人"],
    useCases: ["修 bug", "讀 repo 並修改程式", "跑測試與命令", "重構小範圍模組", "研究 coding agent 的沙箱與任務流程"],
    installConcept: "通常以 Docker 或本機開發環境啟動，讓 Agent 在隔離環境中操作程式碼、shell 與工具。",
    strengths: ["開源度高", "社群大", "適合研究完整 coding agent 架構", "可 self-host"],
    limitations: ["系統較大，安裝與資源需求比輕量 CLI 工具高", "對模型能力、沙箱設定與任務描述品質很敏感"],
    contentZh: [
      "OpenHands 是目前最有代表性的開源 AI coding agent 之一。它不是單純幫你補程式碼，而是嘗試建立一個能讀 repo、改檔、執行 shell、跑測試、回報結果的工程代理環境。",
      "它的核心價值在於完整度：你可以觀察 coding agent 如何接收任務、規劃、操作檔案、執行命令、處理錯誤，再把結果交回給使用者。這對想理解 Agent 軟體工程的人很有價值。",
      "導入時要注意它不是最輕量的工具。OpenHands 適合有工程背景的人用來研究或 self-host，不適合完全不想碰 Docker、terminal、repo 權限與模型設定的人。教學上可以用它說明「完整 Agent 工作台」和「簡單 AI 助手」的差異。",
    ],
  },
  "cline/cline": {
    titleZh: "Cline",
    oneLineZh: "可在 IDE、SDK 或 CLI 使用的自主 coding agent，適合日常工程任務與 local provider 實驗。",
    difficulty: "中階",
    runType: ["IDE Extension", "CLI", "SDK", "Coding Agent"],
    modelSupport: ["Claude", "OpenAI", "OpenAI-compatible API", "Local provider 視設定而定"],
    audience: [
      "Agent 類型：IDE 內的 AI coding pair agent",
      "核心功能：讀檔、改檔、產生測試、解釋錯誤與執行小任務",
      "運用場景：日常開發中把單一 bug、單一功能或測試補齊交給 agent 協作",
    ],
    notFor: ["不寫程式的人", "不想讓工具讀寫專案檔案的人"],
    useCases: ["修改程式碼", "讀 repo", "產生測試", "解釋錯誤", "把小型工程任務交給 Agent", "用 local provider 測試 coding workflow"],
    installConcept: "可作為 IDE extension 或 CLI/SDK 使用；通常需要設定模型 provider 與專案權限。",
    strengths: ["接近實際工程工作流", "適合日常開發", "可搭配不同模型 provider", "使用門檻比大型 self-host 平台低"],
    limitations: ["需要嚴格 review 改動", "大型任務仍可能走偏", "local model 品質會明顯影響結果"],
    contentZh: [
      "Cline 的定位是讓 coding agent 進入實際開發環境。它可以讀專案、提出修改、操作檔案，並在使用者確認下執行任務。比起完整 self-host 平台，它更貼近日常工程師的 IDE 工作流。",
      "它適合拿來練習如何和 coding agent 協作：把需求拆小、限制修改範圍、要求它說明計畫、檢查 diff、跑測試，再決定是否接受。這種節奏比一次丟大型需求更可靠。",
      "如果使用 local provider，Cline 可以成為本機模型實驗入口；但模型如果指令遵守能力不足，就容易產生不穩定修改。教學上應強調：Agent 可以加速工程工作，但不應跳過 code review 和測試。",
    ],
  },
  "kortix-ai/suna": {
    titleZh: "Suna",
    oneLineZh: "開源通用型 Agent 工作台，目標是把研究、瀏覽、工具操作與任務執行整合成公司 AI command center。",
    difficulty: "進階",
    runType: ["Self-host", "Web App", "Agent Workspace"],
    modelSupport: ["OpenAI-compatible API", "雲端模型", "Local/self-host model 視部署設定"],
    audience: [
      "Agent 類型：通用工作台 / AI command center agent",
      "核心功能：研究、瀏覽器任務、工具操作與多步驟任務追蹤",
      "運用場景：公司內部 AI 工作台原型，讓 agent 協助找資料、整理結論、操作工具",
    ],
    notFor: ["只想要單一 CLI 工具的人", "不想處理部署與帳號設定的人"],
    useCases: ["研究與資料整理", "多步驟任務執行", "公司內部 AI 工作台原型", "連接工具與瀏覽器任務", "做跨系統資料查找與報告草稿"],
    installConcept: "通常需要 self-host web app 與後端服務，並設定模型、工具、資料庫或任務執行環境。",
    strengths: ["產品形態完整", "適合觀察通用 Agent 工作台設計", "可作為公司 AI command center 參考"],
    limitations: ["部署比單一 CLI 複雜", "需要確認資料、權限與工具邊界", "本機化程度取決於部署方式"],
    contentZh: [
      "Suna 偏向通用 Agent 工作台，而不是單一 coding tool。它的目標是讓使用者在一個介面裡交辦研究、瀏覽、工具操作與多步驟任務，接近公司 AI command center 的概念。",
      "它適合研究 Agent 產品化：如何讓使用者建立任務、追蹤進度、查看輸出、管理工具權限，以及把 Agent 放進日常工作。對 PM 或想設計內部 AI 平台的人，Suna 比單純框架更容易理解產品形態。",
      "導入時要先釐清資料與權限。通用 Agent 可能會接觸瀏覽器、文件、帳號與外部 API，如果沒有明確的工具範圍與審核流程，風險會比單一用途工具高。",
    ],
  },
  "openinterpreter/openinterpreter": {
    titleZh: "Open Interpreter",
    oneLineZh: "輕量 coding / computer agent，可用自然語言讓模型寫程式、執行程式與操作本機任務。",
    difficulty: "中階",
    runType: ["CLI", "Rust", "Local Computer Agent"],
    modelSupport: ["DeepSeek", "Kimi", "Qwen", "Open model", "OpenAI-compatible API"],
    audience: [
      "Agent 類型：本機命令列 / computer-use coding agent",
      "核心功能：寫程式、執行程式、處理本機檔案與快速產生腳本",
      "運用場景：在低風險資料夾中讓 agent 幫你整理檔案、分析資料、產生小工具",
    ],
    notFor: ["不想讓 Agent 執行本機命令的人", "沒有基本終端機概念的人"],
    useCases: ["執行程式碼", "本機檔案處理", "快速腳本", "資料整理與轉檔", "local model coding agent 實驗"],
    installConcept: "以 CLI/TUI 形式使用，設定模型後讓 Agent 在本機產生與執行程式碼；務必先用低風險目錄測試。",
    strengths: ["輕量", "概念清楚", "適合 local model 實驗", "能直接操作本機任務"],
    limitations: ["本機命令執行有安全風險", "需要使用者理解它做了什麼", "複雜任務仍需人工檢查"],
    contentZh: [
      "Open Interpreter 的核心概念是讓語言模型不只回答，而是能寫程式、執行程式、讀寫本機檔案，成為一個自然語言介面的本機電腦助手。",
      "它適合做 local agent 入門實驗，因為形式比大型平台簡單：你可以從一個小任務開始，例如整理 CSV、產生腳本、讀資料夾、寫小工具。這能快速理解 Agent 操作電腦的好處與風險。",
      "最大的注意點是安全。只要 Agent 能執行本機命令，就必須限制工作目錄、避免敏感資料、先看它要執行什麼，再允許它動作。教學上可以用它示範「本機能力」與「本機風險」是同一件事的兩面。",
    ],
  },
  "Significant-Gravitas/AutoGPT": {
    titleZh: "AutoGPT",
    oneLineZh: "早期代表性的自主 Agent 專案，現在更像一套讓使用者建立與執行 Agent 工作流的開源平台。",
    difficulty: "進階",
    runType: ["Self-host", "Python", "Agent Platform"],
    modelSupport: ["OpenAI", "Claude", "Llama API", "OpenAI-compatible API"],
    audience: [
      "Agent 類型：自主任務規劃 / agent workflow 平台",
      "核心功能：目標拆解、任務規劃、工具執行與長流程管理",
      "運用場景：研究 autonomous agent 如何把大目標拆成可執行步驟與檢查點",
    ],
    notFor: ["只想要簡單本機工具的人", "不想處理平台部署的人"],
    useCases: ["自主任務代理研究", "Agent workflow 實驗", "多步驟任務規劃", "開源 Agent 平台研究", "比較自主規劃和人工審核流程的差異"],
    installConcept: "通常需要 clone repo 並依官方文件啟動平台與後端服務；不同版本架構可能變動，需看最新 README。",
    strengths: ["知名度高", "社群大", "適合理解自主 Agent 演進", "功能範圍廣"],
    limitations: ["專案龐大", "不一定是最簡單的本機入門工具", "需要確認最新架構與維護狀態"],
    contentZh: [
      "AutoGPT 是自主 Agent 浪潮中最具代表性的開源專案之一。它的價值不只是工具本身，而是讓很多人第一次看到：AI 可以被設計成會規劃、執行、檢查與迭代的代理。",
      "現在看 AutoGPT，應該把它當成 Agent 平台與工作流案例，而不是只當成一個命令列小工具。它涉及任務拆解、工具連接、長流程管理與使用者控制，適合研究 Agent 從 demo 走向平台化的過程。",
      "導入時要務實：AutoGPT 知名度高，但不代表最適合所有本機任務。若只是想快速試 local agent，可能先用輕量工具；若想研究自主 Agent 平台和工作流，AutoGPT 才更有價值。",
    ],
  },
  "crewAIInc/crewAI": {
    titleZh: "CrewAI",
    oneLineZh: "多代理協作框架，可以讓不同角色的 Agent 一起完成任務，適合研究 agent team 和 workflow。",
    difficulty: "中階",
    runType: ["Python", "Agent Framework", "Multi-agent"],
    modelSupport: ["OpenAI", "Claude", "OpenAI-compatible API", "Local LLM 視整合方式"],
    audience: [
      "Agent 類型：多代理協作 / agent team framework",
      "核心功能：角色分工、task 串接、tool 設定與流程封裝",
      "運用場景：把研究、寫作、審查、分析拆成多個 agent 角色協作",
    ],
    notFor: ["只想要現成桌面 app 的人", "不想寫 Python 的人"],
    useCases: ["多角色任務分工", "研究 agent team", "自動化研究/寫作/分析流程", "把流程封裝成 crew", "設計 reviewer / researcher / writer 協作流程"],
    installConcept: "以 Python framework 方式使用，需要寫 crew、agent、task 與 tool 設定；可接不同模型 provider。",
    strengths: ["多代理概念清楚", "文件與社群活躍", "適合教學 agent role / task / tool", "可擴充"],
    limitations: ["需要寫程式", "多代理不一定比單代理更好", "流程設計不好會增加複雜度"],
    contentZh: [
      "CrewAI 是多代理協作框架，核心概念是把任務拆給不同角色的 Agent，例如 researcher、writer、reviewer 或 planner，讓它們按照流程協作完成任務。",
      "它適合教學「Agent 不一定只有一個」。當任務需要不同能力時，可以設計角色、任務順序、工具與交接方式。但也要注意，多代理不是越多越好，角色不清楚只會讓流程變慢、成本變高。",
      "如果要試用 CrewAI，建議先做小流程：一個 agent 找資料、一個 agent 整理、一個 agent 審查。等流程穩定後再增加工具與記憶。這比一開始就設計大型 autonomous team 更容易成功。",
    ],
  },
  "bytedance/UI-TARS-desktop": {
    titleZh: "UI-TARS Desktop",
    oneLineZh: "開源 multimodal computer-use agent stack，聚焦 GUI / browser / desktop 操作代理。",
    difficulty: "進階",
    runType: ["Desktop", "GUI Agent", "TypeScript", "Computer-use"],
    modelSupport: ["UI-TARS 系列模型", "Multimodal model", "OpenAI-compatible API 視整合"],
    audience: [
      "Agent 類型：桌面 GUI / multimodal computer-use agent",
      "核心功能：看畫面、理解 UI、點擊、輸入與操作桌面或瀏覽器",
      "運用場景：研究本機 Operator 類任務，例如操作軟體、瀏覽器與桌面流程",
    ],
    notFor: ["只想要簡單文字 agent 的人", "沒有 multimodal / 桌面自動化概念的人"],
    useCases: ["桌面操作代理", "GUI automation", "browser/computer-use 研究", "本機 Operator 類實驗", "測試 multimodal agent 對真實 UI 的理解能力"],
    installConcept: "以桌面/前端與 agent infra stack 方式使用，需依 README 設定模型、執行環境與桌面控制權限。",
    strengths: ["GUI agent 主題明確", "適合研究 computer-use", "開源 stack 完整", "本機操作方向強"],
    limitations: ["安裝與模型要求較高", "GUI 任務容易受環境影響", "安全與權限要特別小心"],
    contentZh: [
      "UI-TARS Desktop 聚焦 multimodal computer-use agent，也就是讓 Agent 看懂畫面、理解 UI，再像人一樣操作桌面或瀏覽器。這和只處理文字或程式碼的 Agent 很不同。",
      "它適合研究本機 Operator 類應用：Agent 可以根據畫面狀態決定點哪裡、輸入什麼、下一步做什麼。這類系統通常需要視覺模型、GUI grounding、動作執行與安全控制一起配合。",
      "導入時要注意環境不穩定性。不同作業系統、解析度、語言、視窗狀態都可能影響結果。教學上可以用它示範 GUI agent 為什麼困難，以及為什麼需要 sandbox、權限限制和人工確認。",
    ],
  },
  "simular-ai/Agent-S": {
    titleZh: "Agent S",
    oneLineZh: "開源 computer-use agent framework，目標是讓 Agent 像人一樣操作電腦介面。",
    difficulty: "進階",
    runType: ["Python", "GUI Agent", "Computer-use Framework"],
    modelSupport: ["Multimodal model", "OpenAI-compatible API", "Local model 視模型能力"],
    audience: [
      "Agent 類型：computer-use / GUI 操作研究型 agent",
      "核心功能：畫面理解、動作決策、桌面任務執行與 benchmark",
      "運用場景：研究 agent 如何像人一樣操作真實軟體介面",
    ],
    notFor: ["只想快速下載 app 的人", "沒有 Python / agent framework 經驗的人"],
    useCases: ["桌面任務代理", "GUI 操作研究", "computer-use benchmark", "自動化真實軟體操作", "比較不同 multimodal model 的操作能力"],
    installConcept: "以 Python framework 使用，需要設定模型、環境與可操作的 GUI 任務；適合研究與實驗，不是零設定 app。",
    strengths: ["computer-use 主題明確", "適合研究 agent-computer interface", "可作為 GUI agent 教材"],
    limitations: ["門檻較高", "需要視覺/GUI 任務設計", "真實桌面操作風險比文字任務高"],
    contentZh: [
      "Agent S 是 computer-use agent framework，重點在讓 Agent 操作圖形介面，而不是只在文字環境裡回答或寫程式。它關注的是 agent-computer interface：Agent 如何看畫面、理解任務、選擇動作並完成操作。",
      "這類框架很適合研究未來桌面自動化，但也比一般 coding agent 更難。因為 GUI 任務會受到視覺辨識、座標、視窗狀態、應用程式差異影響，失敗模式比 API 工具多很多。",
      "教學上可以把 Agent S 放在進階章節：先理解文字工具調用，再進入瀏覽器代理，最後才研究完整 computer-use。不要一開始就讓初學者處理桌面自動化。"
    ],
  },
  "langgenius/dify": {
    titleZh: "Dify",
    oneLineZh: "可 self-host 的 agentic workflow 平台，用來建立、管理與部署 AI app / agent workflow。",
    difficulty: "中階",
    runType: ["Self-host", "Web Platform", "Workflow Agent"],
    modelSupport: ["OpenAI", "Claude", "Gemini", "OpenAI-compatible API", "Local model provider 視設定"],
    audience: [
      "Agent 類型：self-host AI app / agentic workflow 平台",
      "核心功能：流程編排、知識庫、模型 provider、工具節點與應用部署",
      "運用場景：建立內部知識助理、客服助手、文件問答或可管理的 AI workflow",
    ],
    notFor: ["只想要單一 CLI agent 的人", "完全不想部署服務的人"],
    useCases: ["建立 AI app", "設計 agentic workflow", "內部知識助理", "自架 AI 工作流平台", "把 prompt、知識庫、工具與權限整合成團隊可用服務"],
    installConcept: "通常以 Docker/self-host 方式部署，透過 web UI 設計 workflow、agent、模型 provider 與資料來源。",
    strengths: ["產品成熟度高", "適合非純工程使用者", "可 self-host", "workflow 視覺化"],
    limitations: ["偏平台，不是單一桌面 agent", "要處理部署、權限、資料庫與模型 provider", "Local model 品質與整合方式會影響體驗"],
    contentZh: [
      "Dify 是可 self-host 的 AI app / agentic workflow 平台。它不是只給工程師寫 code 的框架，而是讓團隊用 web UI 建立 workflow、接模型、接知識庫，並把 AI app 部署出去。",
      "如果你的目標是讓公司同事也能建立或使用 AI Agent，Dify 這種平台型工具會比純 CLI 更容易推廣。它可以把 prompt、流程、資料來源、工具和模型 provider 組成可管理的應用。",
      "導入時要注意它屬於平台，不是單一 local desktop agent。你需要考慮部署、帳號、資料權限、模型費用和維護責任。教學上可以用它說明從個人工具走向團隊 AI 平台的差異。",
    ],
  },
};

function githubHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "pec-local-agent-radar",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: githubHeaders() });
  const body = await response.text();
  if (!response.ok) throw new Error(`GitHub request failed ${response.status}: ${body.slice(0, 300)}`);
  return JSON.parse(body);
}

function slugForRepo(fullName = "") {
  return fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function getReactionStats(fullName) {
  try {
    const url = new URL(`${githubApi}/search/issues`);
    url.searchParams.set("q", `repo:${fullName} reactions:>0`);
    url.searchParams.set("sort", "reactions");
    url.searchParams.set("order", "desc");
    url.searchParams.set("per_page", "8");
    const data = await fetchJson(url);
    const samples = (data.items || []).slice(0, 3).map((item) => ({
      title: item.title,
      url: item.html_url,
      likes: Number(item.reactions?.["+1"] || 0),
      hearts: Number(item.reactions?.heart || 0),
      comments: Number(item.comments || 0),
    }));
    const totals = samples.reduce((acc, item) => {
      acc.likes += item.likes;
      acc.hearts += item.hearts;
      acc.comments += item.comments;
      return acc;
    }, { likes: 0, hearts: 0, comments: 0 });
    return { ...totals, samples };
  } catch {
    return { likes: 0, hearts: 0, comments: 0, samples: [] };
  }
}

function buildDiscussionZh(samples = [], titleZh) {
  if (!samples.length) return [`目前沒有抓到足夠的公開 Issue / PR reaction。可以先看 README、更新時間、stars 與 open issues 判斷 ${titleZh} 的活躍度。`];
  return samples.map((item) => {
    const metrics = [`👍 ${item.likes}`, `❤️ ${item.hearts}`, `留言 ${item.comments}`].join("、");
    return `「${item.title}」是目前互動較高的公開討論之一（${metrics}）。這通常代表使用者正在關心安裝、功能缺口、模型支援、穩定性或專案方向，導入前值得先看。`;
  });
}

async function enrich(fullName, periodKey, rank) {
  const repo = await fetchJson(`${githubApi}/repos/${fullName}`);
  const meta = details[repo.full_name] || details[fullName];
  if (!meta) throw new Error(`Missing manual detail for ${repo.full_name}`);
  const reactions = await getReactionStats(repo.full_name);
  const releaseUrl = `${repo.html_url}/releases`;
  return {
    id: slugForRepo(repo.full_name),
    rank,
    period: periodKey,
    fullName: repo.full_name,
    name: repo.name,
    owner: repo.owner?.login || repo.full_name.split("/")[0],
    titleZh: meta.titleZh,
    oneLineZh: meta.oneLineZh,
    difficulty: meta.difficulty,
    runType: meta.runType,
    modelSupport: meta.modelSupport,
    audience: meta.audience,
    notFor: meta.notFor,
    useCases: meta.useCases,
    installConcept: meta.installConcept,
    strengths: meta.strengths,
    limitations: meta.limitations,
    contentZh: meta.contentZh,
    discussionZh: buildDiscussionZh(reactions.samples, meta.titleZh),
    language: repo.language || "Unknown",
    topics: repo.topics || [],
    stars: Number(repo.stargazers_count || 0),
    forks: Number(repo.forks_count || 0),
    watchers: Number(repo.watchers_count || 0),
    openIssues: Number(repo.open_issues_count || 0),
    likes: reactions.likes,
    hearts: reactions.hearts,
    comments: reactions.comments,
    reactionSamples: reactions.samples,
    updatedAt: repo.updated_at,
    pushedAt: repo.pushed_at,
    createdAt: repo.created_at,
    homepage: repo.homepage || "",
    url: repo.html_url,
    releaseUrl,
    downloadUrl: `${repo.html_url}/archive/refs/heads/${repo.default_branch || "main"}.zip`,
    cloneUrl: repo.clone_url,
    license: repo.license?.spdx_id || repo.license?.name || "未標示",
  };
}

async function main() {
  const payload = {
    generatedAt: new Date().toISOString(),
    title: "Local Agent 熱門",
    source: "GitHub API + manual quality review",
    notes: [
      "只收錄可 clone、self-host、本機執行，或可接 local / self-host model 的 Agent 工具與框架。",
      "排除純 SaaS、純聊天 UI、純模型、純 prompt collection。",
      "第一版由 Codex 手動確認品質後上架；後續可重跑腳本更新。",
    ],
    periods: [],
  };
  for (const period of periods) {
    const agents = [];
    for (let index = 0; index < period.repos.length; index += 1) {
      agents.push(await enrich(period.repos[index], period.key, index + 1));
    }
    payload.periods.push({
      key: period.key,
      label: period.label,
      description: period.description,
      agents,
    });
  }
  mkdirSync(workspaceRoot, { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outputPath}`);
  for (const period of payload.periods) {
    console.log(`${period.label}: ${period.agents.map((item) => item.fullName).join(", ")}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
