(function () {
  const trackingEndpoint = window.TUTORIAL_CONFIG?.trackingEndpoint || "";

  function formatLocalTime(date = new Date()) {
    return new Intl.DateTimeFormat("zh-Hant-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  }

  function pageContext() {
    return {
      title: document.title,
      url: window.location.href,
      path: window.location.pathname,
    };
  }

  async function sendFeedback({ category, message }) {
    if (!trackingEndpoint) throw new Error("目前沒有設定回饋接收端。");
    const trimmed = message.trim();
    if (trimmed.length < 4) throw new Error("請輸入至少 4 個字的回饋內容。");

    const payload = {
      type: "feedback",
      occurredAt: new Date().toISOString(),
      occurredAtLocal: formatLocalTime(),
      page: pageContext(),
      detail: {
        category,
        message: trimmed.slice(0, 1800),
        referrer: document.referrer || "",
      },
      userAgent: navigator.userAgent,
      language: navigator.language,
    };
    const response = await fetch(trackingEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.ok === false) {
      throw new Error(body.error || `回饋送出失敗：HTTP ${response.status}`);
    }
    return body;
  }

  function injectStyles() {
    if (document.querySelector("#feedbackWidgetStyle")) return;
    const style = document.createElement("style");
    style.id = "feedbackWidgetStyle";
    style.textContent = `
      .feedback-launcher{position:fixed;right:18px;bottom:18px;z-index:20;border:1px solid rgba(220,235,242,.28);border-radius:999px;background:#28c6e2;color:#041216;box-shadow:0 16px 42px rgba(0,0,0,.34);padding:11px 15px;font-weight:950}
      .feedback-panel{position:fixed;right:18px;bottom:72px;z-index:21;width:min(420px,calc(100vw - 24px));border:1px solid rgba(220,235,242,.18);border-radius:10px;background:#10171d;color:#f4f7f8;box-shadow:0 24px 70px rgba(0,0,0,.44);padding:16px}
      .feedback-panel[hidden]{display:none!important}
      .feedback-panel h2{margin:0 0 8px;font-size:20px}
      .feedback-panel p{margin:0 0 12px;color:#9ba8af;line-height:1.5}
      .feedback-panel label{display:grid;gap:7px;margin-top:10px;color:#f4f7f8;font-size:13px;font-weight:850}
      .feedback-panel select,.feedback-panel textarea{width:100%;border:1px solid rgba(220,235,242,.22);border-radius:8px;background:#070b0e;color:#f4f7f8;padding:10px;font:inherit}
      .feedback-panel textarea{min-height:116px;resize:vertical;line-height:1.5}
      .feedback-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}
      .feedback-actions button{border:1px solid rgba(220,235,242,.22);border-radius:8px;padding:9px 12px;font-weight:900}
      .feedback-cancel{background:rgba(220,235,242,.08);color:#f4f7f8}
      .feedback-submit{background:#28c6e2;color:#041216}
      .feedback-status{min-height:20px;margin-top:10px;color:#9bd23c;font-size:13px;font-weight:800}
      .feedback-status[data-error="true"]{color:#ff8c91}
      @media(max-width:640px){.feedback-launcher{right:12px;bottom:12px}.feedback-panel{right:12px;bottom:62px}}
    `;
    document.head.append(style);
  }

  function init() {
    injectStyles();
    const launcher = document.createElement("button");
    launcher.type = "button";
    launcher.className = "feedback-launcher";
    launcher.textContent = "留言 / 討論";

    const panel = document.createElement("section");
    panel.className = "feedback-panel";
    panel.hidden = true;
    panel.innerHTML = `
      <h2>留言 / 討論</h2>
      <p>回饋會送到 Michael，包含你主動填寫的內容與目前頁面。</p>
      <label>
        類型
        <select id="feedbackCategory">
          <option value="內容建議">內容建議</option>
          <option value="錯誤回報">錯誤回報</option>
          <option value="想學主題">想學主題</option>
          <option value="GitHub Skill 討論">GitHub Skill 討論</option>
          <option value="其他">其他</option>
        </select>
      </label>
      <label>
        留言內容
        <textarea id="feedbackMessage" maxlength="1800" placeholder="請寫下你想討論、建議或回報的內容。"></textarea>
      </label>
      <div class="feedback-actions">
        <button class="feedback-cancel" type="button">取消</button>
        <button class="feedback-submit" type="button">送出</button>
      </div>
      <div class="feedback-status" aria-live="polite"></div>
    `;
    document.body.append(panel, launcher);

    const category = panel.querySelector("#feedbackCategory");
    const message = panel.querySelector("#feedbackMessage");
    const submit = panel.querySelector(".feedback-submit");
    const cancel = panel.querySelector(".feedback-cancel");
    const status = panel.querySelector(".feedback-status");

    launcher.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      if (!panel.hidden) message.focus();
    });
    cancel.addEventListener("click", () => {
      panel.hidden = true;
    });
    submit.addEventListener("click", async () => {
      submit.disabled = true;
      status.dataset.error = "false";
      status.textContent = "送出中...";
      try {
        await sendFeedback({ category: category.value, message: message.value });
        message.value = "";
        status.textContent = "已送出，謝謝你的回饋。";
      } catch (error) {
        status.dataset.error = "true";
        status.textContent = error.message;
      } finally {
        submit.disabled = false;
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}());
