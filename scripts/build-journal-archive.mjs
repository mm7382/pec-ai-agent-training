import { writeFileSync } from "node:fs";

const entries = [
  {
    slug: "public-learning-website", category: "個人反思", categoryEn: "Reflection", date: "2026-07-30", id: "7488409171806236672",
    title: "把學習整理成一個公開入口", titleEn: "Turning My Learning into a Public Entrance",
    lede: "我想做的不是另一個資訊列表，而是把散落的 AI Agent 資料整理成能理解、比較，也能真正動手做的入口。",
    ledeEn: "I did not want another information list. I wanted a place where scattered AI Agent material becomes understandable, comparable, and practical.",
    image: "public-learning-website", alt: "從散落筆記、分類網站到公開學習入口的三段分鏡",
    frames: [["散落的資料與實作筆記", "Scattered notes and experiments"], ["整理成可瀏覽的知識庫", "An organized learning library"], ["成為公開學習入口", "A public learning entrance"]],
    sections: [
      ["為什麼做這個網站", "AI Agent 的資料很多，但資訊多不等於容易學。GitHub 專案、新聞、Local Agent、影片和實作筆記分散在不同地方，真正困難的是判斷先看什麼、哪些值得深入。", "Why Build This Site", "AI Agent material is abundant, but abundance does not make learning easy. Projects, news, tools, videos, and notes are scattered. The harder question is what to read first and what deserves deeper study."],
      ["從收藏變成學習入口", "我把內容依任務與使用情境整理，保留來源，也增加白話摘要與實作脈絡。網站的價值不在於收得最多，而在於幫助人更快形成判斷。", "From Collection to Learning Entrance", "I organize material by task and use case, preserve sources, and add plain-language context. The value is not collecting the most; it is helping people form judgment faster."],
      ["持續公開學習", "公開整理讓我必須重新說清楚自己學到什麼，也讓每一次實作成為下一次可以重用的知識。", "Learning in Public", "Publishing forces me to explain what I learned clearly and turns each experiment into knowledge that can be reused next time."]
    ], tags: ["Learning in Public", "AI Agents", "Knowledge Sharing"]
  },
  {
    slug: "one-brain-many-agents", category: "工具實驗", categoryEn: "Tool Experiment", date: "2026-07-28", id: "7487695620162408448",
    title: "One Brain, Many Agents", titleEn: "Memory Should Follow the Person",
    lede: "換一個 AI 工具，不應該等於重新介紹自己；記憶應該跟著人，而不是跟著聊天視窗消失。",
    ledeEn: "Changing AI tools should not require explaining yourself again. Memory should follow the person, not disappear with a chat window.",
    image: "one-brain-many-agents", alt: "分散筆記、共用知識庫與多個工作入口的三段分鏡",
    frames: [["每個 Agent 各自失憶", "Each agent starts without context"], ["建立可審核的共用大腦", "A reviewed shared brain"], ["授權不同 Agent 查詢", "Authorized access across agents"]],
    sections: [
      ["問題不是模型不夠聰明", "真正浪費的是每換一個工具，就要重新解釋偏好、決策和專案脈絡。聊天記錄散落，也很難控制哪些內容值得長期保留。", "The Problem Is Not Model Intelligence", "The waste comes from re-explaining preferences, decisions, and project context whenever tools change. Scattered chat history also makes long-term memory difficult to control."],
      ["一個自己擁有的知識庫", "One Brain, Many Agents 的核心是一份由使用者擁有、保留來源、可審核與可刪除的知識庫。Agent 只在獲得授權後查詢需要的內容。", "A User-Owned Knowledge Base", "The core is a user-owned knowledge base with sources, review, and deletion. Agents retrieve only what they are authorized to access."],
      ["記憶需要治理流程", "不是把每段聊天全部保存，而是經過 Capture、Review、Organize、Index、Recall，讓記憶有品質，也有邊界。", "Memory Needs Governance", "The goal is not saving every chat. Capture, Review, Organize, Index, and Recall create both quality and boundaries."]
    ], tags: ["Shared Memory", "Second Brain", "Knowledge Management"]
  },
  {
    slug: "pageindex-rag", category: "學習札記", categoryEn: "Learning Note", date: "2026-07-24", id: "7486241318860623872",
    title: "下一代 RAG，不只是更多 Chunks", titleEn: "Next-Generation RAG Is More Than More Chunks",
    lede: "大型知識庫搜尋不該只找到看起來相似的段落，而要能沿著文件結構找到真正相關的頁面與證據。",
    ledeEn: "Large knowledge bases should retrieve more than similar-looking paragraphs. They should follow document structure to the relevant pages and evidence.",
    image: "pageindex-rag", alt: "文件章節、樹狀索引與證據連結的三段分鏡",
    frames: [["保留原始章節結構", "Preserve document structure"], ["沿樹狀索引推理", "Reason through a tree index"], ["回到頁面與證據", "Return to pages and evidence"]],
    sections: [
      ["相似不代表相關", "傳統切塊搜尋容易找到語意相近的文字，卻可能失去章節關係、前後條件與完整證據。對大型技術文件來說，結構本身就是資訊。", "Similarity Is Not Relevance", "Chunk search can find semantically similar text while losing chapter relationships, conditions, and evidence. In technical documents, structure is information."],
      ["PageIndex 的做法", "PageIndex 保留文件的樹狀章節，讓 LLM 先判斷應該走到哪一個分支，再找出真正相關的頁面。這比先切成大量 chunks 更接近人閱讀長文件的方法。", "How PageIndex Works", "PageIndex preserves a chapter tree. The LLM first decides which branch to follow, then retrieves the relevant pages. This resembles how people navigate long documents."],
      ["搭配受控的知識循環", "再用 Wiki 累積經過驗證的摘要、概念和交叉連結，搜尋就不只是一次性回答，而能逐步形成可追溯的知識。", "A Controlled Knowledge Loop", "A wiki can accumulate reviewed summaries, concepts, and links. Retrieval then becomes traceable knowledge rather than a one-off answer."]
    ], tags: ["PageIndex", "RAG", "Knowledge Architecture"]
  },
  {
    slug: "engineering-procurement", category: "工作方法", categoryEn: "Work Method", date: "2025-07-31", id: "7356532240010432513",
    title: "工程設計與採購現實的三角平衡", titleEn: "Balancing Design, Cost, and Timing",
    lede: "最低報價不一定能製造；如果設計、價格與時效沒有一起看，工程與採購都會被流程卡住。",
    ledeEn: "The lowest quote may not be buildable. Design, cost, and timing must be evaluated together.", image: "engineering-procurement", alt: "設計圖、供應商報價與三角平衡的三段分鏡",
    frames: [["工程先提出可製造設計", "Engineering defines a buildable design"], ["採購比較供應能力與成本", "Procurement compares capability and cost"], ["共同平衡設計、成本與時程", "Balance design, cost, and timing"]],
    sections: [
      ["流程為什麼會卡住", "廠商尚未確定，料號就不能申請；設計圖先進報價流程，採購若只看價格，可能選到便宜但做不出來的供應商。設計一變，報價又要重跑。", "Why the Process Gets Stuck", "Without a selected supplier, part numbers may be blocked. If procurement sees only price, the cheapest supplier may not be able to build the design. A design change restarts quotation."],
      ["共同決策需要更多訊號", "除了單價，也要把製造能力、技術風險、交期、變更成本與客戶時程放在同一張決策表上。", "Shared Decisions Need Better Signals", "Unit price must be considered together with manufacturing capability, technical risk, lead time, change cost, and customer schedule."],
      ["三角平衡", "好的流程不是讓某一方更快，而是讓工程與採購更早共享條件，在設計、價格與時效之間做有意識的取捨。", "Balancing the Triangle", "A good process helps engineering and procurement share constraints earlier and make explicit trade-offs among design, cost, and timing."]
    ], tags: ["Systems Engineering", "Procurement", "Decision Making"]
  },
  {
    slug: "ipc-test-toolkit", category: "工具實驗", categoryEn: "Tool Experiment", date: "2025-07-17", id: "7351421507622928385",
    title: "把 IPC 測試指令整理成一個工具箱", titleEn: "Turning IPC Test Commands into a Toolkit",
    lede: "好的測試工具會把散落指令變成一鍵執行、選單與 API，讓驗證從記憶工作變成可靠流程。",
    ledeEn: "A good test toolkit turns scattered commands into one-click flows, menus, and APIs.", image: "ipc-test-toolkit", alt: "混亂測試指令、整合工具與自動驗證的三段分鏡",
    frames: [["指令散落、仰賴人工記憶", "Scattered commands and manual memory"], ["封裝成一致的測試入口", "A consistent test interface"], ["批次執行並保留結果", "Automated runs with retained results"]],
    sections: [
      ["測試摩擦不只來自技術", "工程師常花時間找文件、拼指令、確認參數與重跑相同步驟。這些動作本身沒有增加驗證品質。", "Testing Friction Is Not Only Technical", "Engineers spend time locating documents, assembling commands, checking parameters, and repeating the same setup. These actions do not improve verification quality."],
      ["把知識做進工具裡", "把常用功能封裝成清楚命令、選單與一鍵流程，再提供 API 給自動化使用，等於把個人經驗轉成團隊可以重用的介面。", "Put Knowledge into the Tool", "Commands, menus, one-click flows, and APIs turn personal experience into a reusable team interface."],
      ["好的工具留下證據", "除了執行方便，也應記錄版本、條件、結果與錯誤，讓每次測試可以回查，而不是只看當下是否亮綠燈。", "Good Tools Preserve Evidence", "A useful toolkit records version, conditions, results, and errors so each run remains traceable."]
    ], tags: ["Test Automation", "IPC", "Developer Experience"]
  },
  {
    slug: "dfmea-systems", category: "工作方法", categoryEn: "Work Method", date: "2024-09-04", id: "7237051326579257346",
    title: "把複雜需求拆成可執行的 DFMEA", titleEn: "Turning Complex Requirements into an Actionable DFMEA",
    lede: "DFMEA 不只是填表，而是從客戶需求、系統邊界與功能結構，走到風險與驗證計畫的共同語言。",
    ledeEn: "DFMEA is not form filling. It connects customer needs, system boundaries, functions, risks, and verification.", image: "dfmea-systems", alt: "客戶需求、系統風險樹與驗證結果的三段分鏡",
    frames: [["把需求與邊界畫清楚", "Clarify requirements and boundaries"], ["拆出功能、失效與風險", "Break down functions and failures"], ["連結特性與驗證計畫", "Connect characteristics and verification"]],
    sections: [
      ["從需求開始，而不是從表格開始", "先把客戶需求轉成參數圖、邊界圖與系統方塊圖，團隊才有共同的系統視圖。沒有這一層，後面的失效分析很容易只剩局部經驗。", "Start with Requirements, Not the Form", "Customer needs must first become parameter, boundary, and system block diagrams. Without a shared system view, failure analysis becomes fragmented."],
      ["用結構拆解風險", "透過樹狀分解把功能、失效模式、原因與影響連起來，再討論 Critical Characteristics、Special Characteristics 與風險控制。", "Decompose Risk Structurally", "Tree decomposition connects functions, failure modes, causes, effects, and the characteristics that require control."],
      ["讓 DFMEA 接到驗證", "DVP&R 應回應 DFMEA 找出的風險。分析與測試互相連結，才能把文件變成真正的產品可靠性工作。", "Connect DFMEA to Verification", "The DVP&R should answer the risks identified by DFMEA. Linking analysis and testing turns documents into reliability work."]
    ], tags: ["DFMEA", "Automotive", "Systems Engineering"]
  },
  {
    slug: "waterproof-cable", category: "工具實驗", categoryEn: "Tool Experiment", date: "2024-03-30", id: "7179658422970146816",
    title: "帶纜線防水裝置的設計思考", titleEn: "Designing a Waterproof Cable Enclosure",
    lede: "防水不是多加一個密封圈，而是讓外殼接面、溝槽、壓縮量與纜線通道共同形成可靠界面。",
    ledeEn: "Waterproofing is not merely adding a gasket. Covers, grooves, compression, and cable paths must form one reliable interface.", image: "waterproof-cable", alt: "防水外殼零件、密封溝槽與成品測試的三段分鏡",
    frames: [["上蓋、下蓋、密封圈與纜線", "Covers, gasket, and cable"], ["控制溝槽與密封壓縮", "Control groove and compression"], ["組裝後形成連續防水界面", "A continuous sealed interface"]],
    sections: [
      ["密封是一個系統", "上、下蓋的接面、突出結構、導溝與密封圈位置互相影響。只看單一零件，很難判斷組裝後是否能持續保持壓縮。", "Sealing Is a System", "Mating surfaces, protrusions, grooves, and gasket location influence one another. A single part cannot explain whether compression remains stable after assembly."],
      ["纜線通道是關鍵邊界", "連接元件除了固定纜線，也必須處理外力、間隙與水氣路徑。防水設計要同時考慮組裝與長期使用。", "The Cable Path Is a Critical Boundary", "The connector must manage cable retention, loads, gaps, and moisture paths. Assembly and long-term use both matter."],
      ["設計要能被驗證", "尺寸公差、密封壓縮、拉力與進水測試應成為設計證據，才能證明概念在實際製造後仍然成立。", "The Design Must Be Verifiable", "Tolerance, gasket compression, pull force, and ingress tests provide evidence that the concept survives manufacturing."]
    ], tags: ["Mechanical Design", "Waterproofing", "Product Reliability"]
  },
  {
    slug: "teamwork-award", category: "個人反思", categoryEn: "Reflection", date: "2023-12-28", id: "7146023721550422017",
    title: "團隊的每個小成就，都值得被看見", titleEn: "Every Small Team Win Deserves Recognition",
    lede: "困難工作裡，真誠而具體的鼓勵不是裝飾，而是讓團隊願意繼續往前的推進力。",
    ledeEn: "In difficult work, sincere and specific encouragement is not decoration. It helps teams keep moving.", image: "teamwork-award", alt: "共同計畫、階段里程碑與團隊成果的三段分鏡",
    frames: [["把不同貢獻放進共同計畫", "Bring contributions into one plan"], ["看見過程中的小里程碑", "Recognize small milestones"], ["共享成果，而不是只獎勵終點", "Share the achievement"]],
    sections: [
      ["鼓勵要具體", "只說做得很好很快就會消失；指出對方解決了什麼問題、減少了誰的負擔、帶來什麼影響，才讓肯定有真實重量。", "Make Encouragement Specific", "Generic praise fades quickly. Recognition gains weight when it names the problem solved, the burden reduced, and the impact created."],
      ["小成就維持動能", "大型專案的終點很遠，如果只有最後成功才值得被看見，團隊很容易在過程中失去動能。", "Small Wins Sustain Momentum", "Large projects have distant finish lines. If only final success counts, teams can lose momentum along the way."],
      ["共同的驕傲", "好的肯定不是製造英雄，而是讓每個人看見自己的工作如何接到共同成果。", "Shared Pride", "Good recognition does not manufacture heroes. It helps people see how their work connects to the shared result."]
    ], tags: ["Teamwork", "Leadership", "Recognition"]
  },
  {
    slug: "project-triangle", category: "學習札記", categoryEn: "Learning Note", date: "2023-11-12", id: "7129436420825378817",
    title: "專案管理裡，不可能同時最大化一切", titleEn: "Projects Cannot Maximize Everything at Once",
    lede: "預算、時程與範圍之間永遠存在限制；成熟的管理不是假裝沒有取捨，而是把取捨變成明確決策。",
    ledeEn: "Budget, schedule, and scope always constrain one another. Mature management makes trade-offs explicit.", image: "project-triangle", alt: "預算、時程與產品範圍三角的三段分鏡",
    frames: [["預算限制資源", "Budget constrains resources"], ["時程限制選擇", "Schedule constrains options"], ["範圍與品質需要取捨", "Scope and quality require trade-offs"]],
    sections: [
      ["三角不是藉口", "專案三角提醒我們，限制客觀存在。它不應被用來推卸責任，而應迫使團隊說清楚：這次優先守住什麼。", "The Triangle Is Not an Excuse", "The project triangle makes constraints visible. It should force the team to say what must be protected, not excuse poor decisions."],
      ["變更一定有代價", "範圍增加但預算與時程不變，代價往往被藏到品質、風險或團隊負荷裡。這些代價需要被看見。", "Change Has a Cost", "When scope grows without budget or schedule changes, the cost moves into quality, risk, or team load. That cost must be visible."],
      ["用目標決定取捨", "先理解產品與公司目標，再決定哪個限制可以調整。沒有共同目標，三角就只會變成部門之間的拉扯。", "Let Goals Drive Trade-offs", "Product and company goals should determine which constraint can move. Without shared goals, the triangle becomes departmental conflict."]
    ], tags: ["Project Management", "Trade-offs", "Decision Making"]
  },
  {
    slug: "professional-communication", category: "工作方法", categoryEn: "Work Method", date: "2023-10-26", id: "7123117891381575681",
    title: "專業被質疑時，先把對話帶回證據", titleEn: "When Expertise Is Questioned, Return to Evidence",
    lede: "冷靜、事實、傾聽與可執行方案，比立刻防衛更能建立信任，也更容易讓對話繼續。",
    ledeEn: "Calm, evidence, listening, and actionable solutions build more trust than immediate defensiveness.", image: "professional-communication", alt: "不同觀點、事實證據與共同方案的三段分鏡",
    frames: [["先分開質疑與情緒", "Separate the question from emotion"], ["用事實與證據對焦", "Focus on facts and evidence"], ["提出能往前走的方案", "Offer a way forward"]],
    sections: [
      ["先保持專業", "被質疑時，最快的反應通常是辯護。但先釐清對方擔心的是事實、風險、時程還是理解落差，才能避免對話變成人身對抗。", "Stay Professional First", "The fastest reaction is often defensiveness. Clarify whether the concern is fact, risk, schedule, or misunderstanding before the conversation becomes personal."],
      ["把證據放到共同桌面", "數據、測試條件、來源與限制應能被共同檢視。證據不是用來壓過對方，而是建立可以一起確認的基準。", "Put Evidence on the Shared Table", "Data, test conditions, sources, and limitations should be inspectable. Evidence creates a shared baseline rather than defeating the other person."],
      ["用方案結束爭論", "傾聽之後，提出下一步：補哪個測試、確認哪個假設、誰在何時做決定。好的專業溝通會把質疑轉成可解決的工作。", "End with a Solution", "After listening, define the next test, assumption, owner, and decision time. Good professional communication turns doubt into solvable work."]
    ], tags: ["Communication", "Engineering Judgment", "Leadership"]
  },
  {
    slug: "industrial-systems-engineer", category: "學習札記", categoryEn: "Learning Note", date: "2023-09-16", id: "7108811998204743680",
    title: "系統工程師看的，不只是硬體規格", titleEn: "A Systems Engineer Sees Beyond Hardware Specs",
    lede: "一個工業電腦系統能不能長期成立，取決於需求、架構、風險、可靠性、散熱、成本、生產與維護是否被一起考慮。",
    ledeEn: "An industrial computer succeeds only when requirements, architecture, risk, reliability, thermal design, cost, production, and maintenance are considered together.", image: "industrial-systems-engineer", alt: "系統架構、環境可靠性測試與量產維護的三段分鏡",
    frames: [["從客戶需求定義系統", "Define the system from customer needs"], ["驗證環境、散熱與可靠性", "Verify environment and reliability"], ["連結生產、成本與維護", "Connect production and maintenance"]],
    sections: [
      ["需求分析決定方向", "先理解功能、性能、可靠性、環境與安全需求，才能建立硬體、系統、功能和安全架構。太早選零件，容易把系統問題縮成規格比較。", "Requirements Set Direction", "Function, performance, reliability, environment, and safety requirements must precede architecture. Choosing parts too early reduces a system problem to a specification comparison."],
      ["風險與可靠性要提早進場", "溫度、震動、電源、散熱、零件壽命與失效模式，應在設計初期被評估，而不是等測試失敗才補救。", "Bring Risk and Reliability In Early", "Temperature, vibration, power, thermal behavior, component life, and failure modes belong in early design, not only after tests fail."],
      ["系統生命週期", "好的設計還要能被製造、維修、獲利並長期供應。系統工程師的工作，就是讓技術決策與整個產品生命週期接起來。", "The System Life Cycle", "A design must also be manufacturable, serviceable, profitable, and supportable. Systems engineering connects technical decisions to the product life cycle."]
    ], tags: ["Systems Engineering", "Industrial Computing", "Product Reliability"]
  }
];

const esc = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

for (const e of entries) {
  const frames = e.frames.map(([zh, en], i) => `<span>${String(i + 1).padStart(2, "0")} ${esc(zh)}<small lang="en">${esc(en)}</small></span>`).join("");
  const zh = e.sections.map(([h, p]) => `<h2>${esc(h)}</h2><p>${esc(p)}</p>`).join("");
  const en = e.sections.map(([, , h, p]) => `<h2>${esc(h)}</h2><p>${esc(p)}</p>`).join("");
  const tags = e.tags.map((t) => `<span>${esc(t)}</span>`).join("");
  const html = `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(e.title)} - Journal</title><meta name="description" content="${esc(e.lede)}"><link rel="icon" href="./favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="./journal-article.css?v=20260813-bilingual-2"><script src="./site-config.js"></script></head>
<body class="journal-article-page"><main class="journal-article-shell"><a class="journal-back" href="./journal.html">&larr; 回到學習日誌 Back to Journal</a>
<header class="journal-article-header"><div class="journal-article-meta"><span>${esc(e.category)} / ${esc(e.categoryEn)}</span><time datetime="${e.date}">${e.date.replaceAll("-", ".")}</time></div><h1>${esc(e.title)}<span class="journal-bilingual-title" lang="en">${esc(e.titleEn)}</span></h1><p class="journal-article-lede">${esc(e.lede)}<span class="journal-intro-en" lang="en">${esc(e.ledeEn)}</span></p></header>
<figure class="journal-storyboard"><img src="./assets/journal/${e.image}.webp" alt="${esc(e.alt)}" width="1774" height="887"><figcaption>${frames}</figcaption></figure>
<article class="journal-article-body"><span class="journal-language-label">中文版 Chinese version</span>${zh}<section class="journal-english" lang="en" aria-label="English version"><span class="journal-language-label">English version</span>${en}</section><div class="journal-source">原始貼文 Original post：<a href="https://www.linkedin.com/feed/update/urn:li:activity:${e.id}/" target="_blank" rel="noopener">LinkedIn</a><div class="journal-tags">${tags}</div></div></article></main><script src="./tutorial-gate.js?v=20260813-journal"></script></body></html>`;
  writeFileSync(new URL(`../journal-${e.slug}.html`, import.meta.url), html);
}

console.log(`Built ${entries.length} bilingual journal articles.`);
