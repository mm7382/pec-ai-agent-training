(function () {
  const endpoint = window.TUTORIAL_CONFIG?.trackingEndpoint || "";
  const excludedKey = "mal.analyticsExcluded.v1";
  const status = document.querySelector("#dashboardStatus");
  const controls = [...document.querySelectorAll("[data-days]")];
  const refreshButton = document.querySelector("#refreshButton");
  const excludeDevice = document.querySelector("#excludeDevice");
  let activeDays = 7;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      "\"": "&quot;",
    })[character]);
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("zh-Hant-TW").format(Number(value || 0));
  }

  function formatDuration(seconds) {
    const value = Math.max(0, Number(seconds || 0));
    if (value < 60) return `${Math.round(value)} 秒`;
    return `${Math.floor(value / 60)} 分 ${Math.round(value % 60)} 秒`;
  }

  function formatTime(value) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("zh-Hant-TW", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(value));
  }

  function empty(text) {
    return `<p class="empty-state">${escapeHtml(text)}</p>`;
  }

  function renderTrend(items) {
    const target = document.querySelector("#trendChart");
    if (!items?.length) {
      target.innerHTML = empty("目前還沒有足夠資料畫出趨勢。");
      return;
    }
    const width = 800;
    const height = 190;
    const left = 38;
    const right = 18;
    const top = 16;
    const bottom = 32;
    const max = Math.max(...items.flatMap((item) => [item.views, item.visitors]), 1);
    const x = (index) => left + (items.length === 1 ? (width - left - right) / 2 : index * ((width - left - right) / (items.length - 1)));
    const y = (value) => top + (height - top - bottom) * (1 - value / max);
    const line = (key) => items.map((item, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(item[key])}`).join(" ");
    const grid = [0, .5, 1].map((ratio) => {
      const yValue = top + (height - top - bottom) * ratio;
      return `<line class="grid-line" x1="${left}" y1="${yValue}" x2="${width - right}" y2="${yValue}"></line>`;
    }).join("");
    const labels = items.map((item, index) => `<text x="${x(index)}" y="${height - 7}" text-anchor="middle">${escapeHtml(item.date.slice(5))}</text>`).join("");
    const viewDots = items.map((item, index) => `<circle class="views" cx="${x(index)}" cy="${y(item.views)}" r="4"><title>${item.date}：${item.views} 次瀏覽</title></circle>`).join("");
    const visitorDots = items.map((item, index) => `<circle class="visitors" cx="${x(index)}" cy="${y(item.visitors)}" r="3"><title>${item.date}：${item.visitors} 位訪客</title></circle>`).join("");
    target.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
        ${grid}
        <path class="view-line" d="${line("views")}"></path>
        <path class="visitor-line" d="${line("visitors")}"></path>
        ${viewDots}${visitorDots}${labels}
      </svg>
      <div class="chart-legend"><span><i style="background:var(--cyan)"></i>瀏覽</span><span><i style="background:var(--gold)"></i>訪客</span></div>
    `;
  }

  function renderPopular(items) {
    const target = document.querySelector("#popularPages");
    if (!items?.length) {
      target.innerHTML = empty("目前還沒有熱門內容資料。");
      return;
    }
    target.innerHTML = items.slice(0, 10).map((item, index) => `
      <article class="rank-row">
        <span class="rank-number">${String(index + 1).padStart(2, "0")}</span>
        <div class="rank-copy">
          <a href="${escapeHtml(item.path)}" target="_blank" rel="noopener">${escapeHtml(item.title)}</a>
          <div class="rank-meta">
            <span class="content-label" data-type="${escapeHtml(item.contentType)}">${escapeHtml(item.contentType)}</span>
            <span>${formatNumber(item.uniqueVisitors)} 人</span>
            <span>${formatNumber(item.views)} 次</span>
            <span>${formatDuration(item.averageDuration)}</span>
            <span>完成 ${Math.round(item.completionRate * 100)}%</span>
          </div>
        </div>
        <div class="score-block"><strong>${item.score}</strong><span>熱門分數</span></div>
      </article>
    `).join("");
  }

  function renderCampaigns(items) {
    const target = document.querySelector("#linkedinCampaigns");
    if (!items?.length) {
      target.innerHTML = empty("目前還沒有 LinkedIn UTM 導流。發布貼文時使用專屬 UTM 連結後，這裡就會開始分開統計。");
      return;
    }
    target.innerHTML = items.map((item) => `
      <article class="campaign-row">
        <strong>${escapeHtml(item.campaign)}</strong>
        <p>來源：${escapeHtml(item.source)}</p>
        <div class="campaign-metrics">
          <span>訪客<b>${formatNumber(item.visitors)}</b></span>
          <span>有效閱讀<b>${formatNumber(item.engagedViews)}</b></span>
          <span>平均時間<b>${formatDuration(item.averageDuration)}</b></span>
        </div>
      </article>
    `).join("");
  }

  function renderSearchList(selector, items, countKey, emptyText) {
    const target = document.querySelector(selector);
    if (!items?.length) {
      target.innerHTML = empty(emptyText);
      return;
    }
    target.innerHTML = items.slice(0, 10).map((item) => `
      <div class="simple-row"><span>${escapeHtml(item.term)}</span><b>${formatNumber(item[countKey])}</b></div>
    `).join("");
  }

  function renderRecent(items) {
    const target = document.querySelector("#recentVisits");
    if (!items?.length) {
      target.innerHTML = empty("目前還沒有最近瀏覽資料。");
      return;
    }
    target.innerHTML = items.map((item) => `
      <article class="visit-row">
        <div class="visit-head"><strong>${escapeHtml(item.visitor)}</strong><time>${escapeHtml(formatTime(item.occurredAt))}</time></div>
        <p>${escapeHtml(item.source)} · ${escapeHtml(item.device)}</p>
        <p class="visit-route">${item.routes.map((route) => escapeHtml(route.title)).join(" → ")}</p>
      </article>
    `).join("");
  }

  function render(data) {
    document.querySelector("#metricVisitors").textContent = formatNumber(data.totals.uniqueVisitors);
    document.querySelector("#metricViews").textContent = formatNumber(data.totals.views);
    document.querySelector("#metricDuration").textContent = formatDuration(data.totals.averageDuration);
    document.querySelector("#metricCompletion").textContent = `${formatNumber(data.totals.completionRate)}%`;
    document.querySelector("#updatedAt").textContent = `更新 ${formatTime(data.generatedAt)}`;
    renderTrend(data.trend);
    renderPopular(data.topPages);
    renderCampaigns(data.linkedinCampaigns);
    renderSearchList("#searchTerms", data.searchTerms, "searches", "目前沒有搜尋資料。");
    renderSearchList("#zeroResultSearches", data.zeroResultSearches, "zeroResults", "目前沒有零結果搜尋。");
    renderRecent(data.recentVisits);
  }

  async function loadAnalytics(fresh = false) {
    if (!endpoint) {
      status.textContent = "尚未設定分析端點。";
      return;
    }
    status.textContent = `正在讀取最近 ${activeDays} 天資料...`;
    refreshButton.disabled = true;
    try {
      const url = new URL(endpoint);
      url.pathname = `${url.pathname.replace(/\/$/, "")}/analytics-v2`;
      url.searchParams.set("days", String(activeDays));
      if (fresh) url.searchParams.set("fresh", "1");
      const response = await fetch(url, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || data.ok === false) throw new Error(data.error || "無法讀取分析資料。");
      render(data);
      status.textContent = `顯示最近 ${data.rangeDays} 天匿名資料；超過 15 天會自動刪除。`;
    } catch (error) {
      status.textContent = `載入失敗：${error.message}`;
    } finally {
      refreshButton.disabled = false;
    }
  }

  controls.forEach((button) => {
    button.addEventListener("click", () => {
      activeDays = Number(button.dataset.days || 7);
      controls.forEach((control) => control.setAttribute("aria-pressed", String(control === button)));
      loadAnalytics();
    });
  });
  refreshButton.addEventListener("click", () => loadAnalytics(true));
  excludeDevice.checked = localStorage.getItem(excludedKey) === "true";
  excludeDevice.addEventListener("change", () => {
    localStorage.setItem(excludedKey, String(excludeDevice.checked));
    status.textContent = excludeDevice.checked
      ? "這台裝置已排除；之後瀏覽網站不會送出分析資料。"
      : "這台裝置已恢復計入匿名流量。";
  });

  loadAnalytics();
}());
