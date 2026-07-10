(function () {
  const pathMap = {
    "github-skills.html": "github-skill-rankings",
  };

  function basePath() {
    return window.location.pathname.includes("/pec-training/") ? "../" : "./";
  }

  function currentLessonId() {
    const file = window.location.pathname.split("/").pop() || "index.html";
    return pathMap[file] || file.replace(/\.html$/, "");
  }

  function escapeHtml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function resolveUrl(url) {
    if (!url) return "#";
    if (/^https?:\/\//.test(url)) return url;
    if (window.location.pathname.includes("/pec-training/") && url.startsWith("./pec-training/")) {
      return `./${url.replace("./pec-training/", "")}`;
    }
    if (window.location.pathname.includes("/pec-training/") && url.startsWith("./")) {
      return `../${url.slice(2)}`;
    }
    return url;
  }

  function flattenLessons(data) {
    return (data.stages || []).flatMap((stage) => (stage.lessons || []).map((lesson) => ({ ...lesson, stage })));
  }

  function ensureLearningCardStyles() {
    if (document.querySelector("#learningCardStyles")) return;
    const style = document.createElement("style");
    style.id = "learningCardStyles";
    style.textContent = `
      .lesson-learning-card {
        width: min(1120px, calc(100% - 32px));
        margin: 22px auto;
        border: 1px solid rgba(40, 198, 226, .28);
        border-radius: 8px;
        background: linear-gradient(135deg, rgba(8, 20, 27, .96), rgba(19, 31, 39, .94));
        color: #f4f7f8;
        box-shadow: 0 18px 45px rgba(0, 0, 0, .20);
        overflow: hidden;
      }
      .lesson-learning-card-inner { padding: 18px; }
      .lesson-learning-top {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: start;
        padding-bottom: 14px;
        border-bottom: 1px solid rgba(220, 235, 242, .14);
      }
      .lesson-learning-kicker {
        margin: 0 0 6px;
        color: #69e7f7;
        font-size: 12px;
        font-weight: 950;
      }
      .lesson-learning-title {
        margin: 0;
        font-size: clamp(20px, 3vw, 28px);
        line-height: 1.2;
        color: #fff;
      }
      .lesson-learning-stage {
        flex: 0 0 auto;
        border: 1px solid rgba(167, 139, 250, .42);
        border-radius: 999px;
        padding: 6px 10px;
        color: #c4b5fd;
        font-size: 12px;
        font-weight: 900;
      }
      .lesson-learning-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        margin-top: 14px;
      }
      .lesson-learning-item {
        border: 1px solid rgba(220, 235, 242, .12);
        border-radius: 8px;
        background: rgba(220, 235, 242, .055);
        padding: 13px;
      }
      .lesson-learning-item strong {
        display: block;
        margin-bottom: 6px;
        color: #f4f7f8;
        font-size: 13px;
      }
      .lesson-learning-item p {
        margin: 0;
        color: #b9c7ce;
        line-height: 1.65;
        font-size: 14px;
      }
      @media (max-width: 720px) {
        .lesson-learning-card { width: min(100% - 20px, 1120px); }
        .lesson-learning-top { display: grid; }
        .lesson-learning-grid { grid-template-columns: 1fr; }
      }
    `;
    document.head.append(style);
  }

  function lessonCardMarkup(lesson) {
    return `
      <section class="lesson-learning-card" aria-label="本篇學習卡">
        <div class="lesson-learning-card-inner">
          <div class="lesson-learning-top">
            <div>
              <p class="lesson-learning-kicker">Learning Card</p>
              <h2 class="lesson-learning-title">這篇要怎麼學</h2>
            </div>
            <span class="lesson-learning-stage">${escapeHtml(lesson.stage.number)} · ${escapeHtml(lesson.stage.title)}</span>
          </div>
          <div class="lesson-learning-grid">
            <div class="lesson-learning-item"><strong>你會學到什麼</strong><p>${escapeHtml(lesson.learn)}</p></div>
            <div class="lesson-learning-item"><strong>適合誰</strong><p>${escapeHtml(lesson.audience)}</p></div>
            <div class="lesson-learning-item"><strong>實作任務</strong><p>${escapeHtml(lesson.task)}</p></div>
            <div class="lesson-learning-item"><strong>完成標準</strong><p>${escapeHtml(lesson.completion)}</p></div>
            <div class="lesson-learning-item"><strong>下一步建議</strong><p>${escapeHtml(lesson.next)}</p></div>
          </div>
        </div>
      </section>
    `;
  }

  function insertLessonCard(data) {
    const lesson = flattenLessons(data).find((item) => item.id === currentLessonId());
    if (!lesson || document.querySelector(".lesson-learning-card")) return;
    ensureLearningCardStyles();
    const template = document.createElement("template");
    template.innerHTML = lessonCardMarkup(lesson).trim();
    const card = template.content.firstElementChild;
    if (currentLessonId() === "github-skill-rankings") {
      const hero = document.querySelector(".rank-hero");
      if (hero) hero.insertAdjacentElement("afterend", card);
      return;
    }
    const h1 = document.querySelector("h1");
    const hero = h1?.closest(".hero, .cover, .rank-hero, header");
    if (hero && hero.parentElement) {
      hero.insertAdjacentElement("afterend", card);
    } else if (h1) {
      h1.insertAdjacentElement("afterend", card);
    }
  }

  function renderHomePath(data) {
    const grid = document.querySelector("#learningPathGrid");
    if (!grid) return;
    const stageCards = (data.stages || []).map((stage) => `
      <article class="learning-stage-card">
        <div class="learning-stage-top">
          <span>${escapeHtml(stage.number)}</span>
          <strong>${escapeHtml(stage.label)}</strong>
        </div>
        <h3>${escapeHtml(stage.title)}</h3>
        <p>${escapeHtml(stage.goal)}</p>
        <ul>
          ${(stage.lessons || []).map((lesson) => `<li><a href="${escapeHtml(resolveUrl(lesson.url))}">${escapeHtml(lesson.title)}</a></li>`).join("")}
        </ul>
        <a class="learning-stage-action" href="${escapeHtml(resolveUrl(stage.lessons?.[0]?.url || "#"))}">${escapeHtml(stage.buttonLabel || "開始學這階段")}</a>
      </article>
    `).join("");
    grid.innerHTML = stageCards;
  }

  async function init() {
    const response = await fetch(`${basePath()}learning-path.json`, { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    renderHomePath(data);
    insertLessonCard(data);
  }

  init().catch(() => {});
}());
