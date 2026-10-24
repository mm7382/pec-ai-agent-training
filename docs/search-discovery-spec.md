# Michael Agent Lab：Google 與 AI 搜尋曝光改版規格

日期：2026-10-24。狀態：待確認執行切片。網站：<https://mm7382.github.io/pec-ai-agent-training/>。

## 問題描述 / Problem Statement

Michael 希望個人網站的 AI Agent 教學與免費 App 能被 Google 和 AI 搜尋找到，增加有興趣的訪客。網站已有內容和作品，但教材目錄主要靠 JavaScript 載入；只讀原始 HTML 的搜尋工具看不到多數教材入口。內容量增加後，頁面摘要、站內連結與主題層級也未同步整理。

### 2026-10-24 公開站基線

- `sitemap-lab.xml` 列 84 個個人網站公開網址，逐頁檢查全部回傳 200；另有 13 個未列入網站地圖的範本、短網址或轉址頁，需逐一保留其既有用途。
- 84 頁均有標題，43 頁缺少獨立的 meta description，2 頁沒有靜態 H1。81 頁沒有明示 canonical；這是需要檢查的重複網址風險，不等於全部有收錄問題。
- 以原始 HTML 的 `<a href>` 計算，84 頁中有 48 頁沒有其他公開頁面的靜態站內連結，其中 45 頁為教材。教材目錄原始 HTML 只有回首頁的連結，主要內容顯示「載入中」。JavaScript 啟用後使用者可看到教材，但不應把搜尋發現完全押在渲染上。
- 根目錄 `robots.txt` 允許 Googlebot、OAI-SearchBot 等讀取，也指向個人網站與 App 的兩份 sitemap。四款 App 入口已在首頁。公開搜尋結果不等於 Search Console 收錄或流量資料；目前沒有站主驗證數據可作基線。

## 解決方案 / Solution

以「用工程思維學 AI Agent」作 Michael Agent Lab 的首頁與教學主軸，保留四款免費命理工具作作品入口。整站先建立可直接讀取的教材與作品連結，再把教學頁依新手入門、可靠工作流、工程實作等搜尋意圖串成清楚路徑。逐頁修正必要的標題、摘要、正文開頭、相關閱讀與圖片文字；維持既有內容真實性和網站風格。最後以 Google Search Console 的實際查詢、曝光、點擊和收錄資料決定後續內容更新，不承諾排名或收錄時間。

## 用戶故事 / User Stories

1. 想學 AI Agent 的工程師能從搜尋結果看懂此站教什麼，進站後快速找到適合程度的教材。
2. 只讀原始 HTML 的搜尋工具能沿著站內連結找到每篇應公開的教材與相關主題。
3. 想找免費排盤／起卦工具的人能找到對應 App，並清楚知道這些作品與 Michael Agent Lab 的關係。
4. Michael 能看到真實搜尋曝光與流量變化，依證據決定下一輪內容，而非憑「SEO 分數」猜測。

## 實作決策 / Implementation Decisions

- 保留既有網址和現有雜誌式視覺；不把教材頁一律重做成同一種模板，不改動 App 排盤與個人資料邏輯。
- 教材目錄保留搜尋與篩選，但在 HTML 中輸出依主題分組、可點擊的教材連結。JavaScript 是增強功能，不是唯一入口。
- 首頁與學習頁的文字先服務真人，清楚區分 AI 教學主軸與免費作品；App 各自已有專屬介紹頁，個人網站負責導覽和作者脈絡。
- 依頁面意圖人工校對摘要與內文，不用關鍵字堆疊、批量生成空泛文章、假評論或不實權威宣稱。Canonical 只在重複／別名頁或需明確指定主網址時使用。
- 沿用現有 robots 與兩份 sitemap；現有 `llms.txt` 可保留作補充，但不把它視為 Google AI 搜尋的排名捷徑。
- 搜尋衡量需區分可公開驗證的抓取狀態，與只有站主工具能提供的實際收錄、查詢、曝光與點擊。

## 測試決策 / Testing Decisions

- 每個切片檢查正式頁 200、有效站內連結、標題／摘要／主內容一致，且 sitemap 只列應索引頁。
- 教材目錄分別以不執行 JavaScript 的 HTML 讀取與手機瀏覽器操作驗證；搜尋、篩選和原有互動不得退化。
- 首頁、教學頁與作品入口檢查繁體中文自然口吻、英文輔助文字、圖片替代文字、鍵盤操作與手機版面。
- 發布後記錄正式網址與部署成功；Search Console 可用時，以 28 天查詢、曝光、點擊、收錄頁數作後續基線。短期不以排名波動宣稱成功或失敗。

## 邊界條件 / Boundaries

- 範圍內：個人網站公開的 84 個頁面之內容架構與必要逐頁修訂、作品導流、網站地圖與搜尋量測準備。
- 另行驗收：四款 App 的公開介紹頁及回連個人網站；不得改動排盤演算法、私人資料儲存或未核准文案。
- 不做：購買連結、垃圾外鏈、偽造流量、網站外代發貼文、無來源的專業／療效聲稱，或把未公開教材加入搜尋。
- 需要 Michael 配合：若 Search Console 尚未驗證網站，需由站主完成帳戶／所有權步驟；沒有此資料時只能報告公開可觀察的狀態。

## 參考依據

- Google：<https://developers.google.com/search/docs/fundamentals/ai-optimization-guide>；<https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview>；<https://developers.google.com/search/docs/appearance/title-link>。
- OpenAI 搜尋爬蟲：<https://developers.openai.com/api/docs/bots>。
