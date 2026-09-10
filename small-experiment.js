(() => {
  const root = document.querySelector('#small-experiment');
  if (!root) return;
  // Deliberately curated examples: no model call, text input, or remote storage.
  const examples = {
    meeting: {
      note: '會議結束了，幫我整理誰要做什麼。沒講清楚的地方先留著，不要猜，也先不要寄出去。',
      english: 'Turn the meeting into action items. Keep unknowns open. Do not send anything yet.',
      fragments: ['誰負責？', '何時完成？', '先確認'],
      workflow: [
        ['先整理已知事實', '只使用會議中明確說出的決定與待辦，保留對應原句。', 'Use only stated decisions and tasks. Keep their source lines.'],
        ['把缺口留下來', '列出任務、負責人、期限；沒說到的欄位標示「待確認」。', 'List the task, owner, and due date. Mark missing fields as unconfirmed.'],
        ['確認後再交付', '先產出待辦草稿，由與會者確認，再決定是否寄送。', 'Create a draft for review. Send it only after people confirm it.']
      ],
      checks: [
        ['每一項都找得到出處', '抽查待辦與會議原句，確認沒有新增討論中不存在的決定。', 'Trace each task back to the meeting. Do not invent decisions.'],
        ['沒有偷偷補上答案', '未提到的負責人與日期都維持待確認，不用看似合理的猜測補齊。', 'Unknown owners and dates stay unknown.'],
        ['結果仍是一份草稿', '確認沒有寄信、建立正式任務或更新外部系統。', 'Check that nothing was sent or written to a live system.']
      ],
      boundaries: [
        ['不替別人承諾', '指派人選和交期由人決定，整理工具不能代替承諾。', 'People own commitments, assignments, and deadlines.'],
        ['不擅自對外傳送', '若接上郵件工具，送出前仍須顯示收件人與內容，取得確認。', 'Show recipients and content for approval before sending.'],
        ['會議資料先確認權限', '真實使用時，先確認資料可否交給所選工具處理。', 'Check permission before giving real meeting data to a tool.']
      ]
    },
    learning: {
      note: '這週存了很多 AI 文章，幫我整理三個值得試的想法。不要只看標題，下週只想先做一件事。',
      english: 'I saved too many AI articles. Find three ideas worth testing, then help me pick one.',
      fragments: ['讀原文', '挑三個', '先試一件'],
      workflow: [
        ['先讀內容，再去重複', '從已提供的文章內容整理重點；讀不到全文時，明確標示資訊不足。', 'Use the provided article text. Flag missing content instead of guessing.'],
        ['整理三個可驗證想法', '每個想法列出適用任務、最小試驗、資料來源與尚未確認的限制。', 'Give each idea a task, small test, source, and open questions.'],
        ['選一個小範圍試做', '依目前需求與可用時間，選一個試驗，事先定義完成條件。', 'Choose one test that fits the need and time. Define done first.']
      ],
      checks: [
        ['不是標題的改寫', '每個想法都能回到原文內容，並區分作者說法與自己的推論。', 'Trace ideas to the text. Separate claims from interpretations.'],
        ['真的可以開始做', '試驗有明確輸入、操作步驟與可觀察的結果。', 'Each test has an input, steps, and an observable result.'],
        ['知道什麼時候停', '設定投入時間上限；條件不符時，留下原因而不是一直追新工具。', 'Set a time limit. Record why a test stops.']
      ],
      boundaries: [
        ['來源不等於證明', '文章中的效果宣稱仍要自己驗證，不直接當成已測試結果。', 'A claim in an article is not your own verified result.'],
        ['不自動安裝或付費', '下載、安裝、授權與購買，另外取得使用者同意。', 'Ask before installing, granting access, or paying.'],
        ['先用非敏感資料', '最初的工具試驗使用公開或人工範例，不直接放入工作機密。', 'Start with public or made-up examples, not confidential data.']
      ]
    },
    publishing: {
      note: '把這段學習筆記整理成網站文章，再寫一段 LinkedIn 短文。兩邊要一致，寫完先給我看，不要直接發布。',
      english: 'Turn a learning note into a full article and a short LinkedIn post. Let me review both first.',
      fragments: ['保留原意', '長短兩版', '先審稿'],
      workflow: [
        ['確認原始筆記', '先分清楚實際做過的事、引用的資訊，以及還在思考的想法。', 'Separate firsthand work, sourced information, and open ideas.'],
        ['產出一致的兩個版本', '網站版保留背景、過程與限制；短文只保留核心心得與文章連結。', 'Keep context in the article and the main lesson in the short post.'],
        ['排版預覽與審稿', '檢查手機閱讀、圖片和連結，把兩版草稿交給作者確認。', 'Check mobile layout, images, and links. Present both drafts for review.']
      ],
      checks: [
        ['沒有誇大經驗', '文章不能把看過、規劃中或示範中的事情寫成已經完成的成果。', 'Do not present research, plans, or demos as completed work.'],
        ['長短版說法一致', '確認標題、重點與限制一致，中英文不出現不同的承諾。', 'Keep facts and limits consistent across both versions and languages.'],
        ['連結與圖片都正確', '檢查文章網址、圖片使用權及手機版，避免把本機預覽網址當公開連結。', 'Check URLs, image rights, and mobile layout. Never share a local URL as public.']
      ],
      boundaries: [
        ['發布由作者決定', '整理完成只代表草稿完成，並不代表已取得發布授權。', 'A finished draft is not permission to publish.'],
        ['移除不該公開的資料', '檢查 API key、私人聯絡資訊、客戶資料與未核准的工作內容。', 'Check for keys, private contacts, customer data, and unapproved work details.'],
        ['原文意思不能被代換', '需要改變觀點或補上不確定經歷時，回頭向作者確認。', 'Ask the author before changing a position or filling in uncertain experience.']
      ]
    }
  };
  const select = root.querySelector('#experiment-scenario');
  const bench = root.querySelector('.experiment-workbench');
  const result = root.querySelector('#experiment-result');
  const panel = root.querySelector('#experiment-panel');
  const run = root.querySelector('#experiment-run');
  const resetButton = root.querySelector('#experiment-reset');
  const status = root.querySelector('#experiment-status');
  const tabs = [...root.querySelectorAll('[role=tab]')];
  let view = 'workflow';
  let revision = 0;
  const paragraph = (text, lang) => {
    const p = document.createElement('p');
    p.textContent = text;
    if (lang) p.lang = lang;
    return p;
  };
  function renderPanel() {
    const list = document.createElement('ol');
    list.className = 'experiment-result-list';
    examples[select.value][view].forEach(([title, chinese, english], index) => {
      const item = document.createElement('li');
      const number = document.createElement('span');
      number.className = 'experiment-step-number';
      number.textContent = String(index + 1).padStart(2, '0');
      number.setAttribute('aria-hidden', 'true');
      const body = document.createElement('div');
      const heading = document.createElement('h3');
      heading.textContent = title;
      body.append(heading, paragraph(chinese), paragraph(english, 'en'));
      item.append(number, body);
      list.append(item);
    });
    panel.replaceChildren(list);
    panel.setAttribute('aria-labelledby', `experiment-tab-${view}`);
    tabs.forEach(tab => {
      const active = tab.dataset.view === view;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
  }
  function reset(announce = false) {
    revision++;
    const example = examples[select.value];
    const note = root.querySelector('#experiment-note');
    const english = document.createElement('span');
    english.className = 'experiment-note-en';
    english.lang = 'en';
    english.textContent = example.english;
    note.replaceChildren(document.createTextNode(example.note), english);
    root.querySelector('#experiment-fragments').replaceChildren(...example.fragments.map(text => {
      const span = document.createElement('span'); span.textContent = text; return span;
    }));
    root.querySelector('.experiment-paper-number').textContent = `${String(select.selectedIndex + 1).padStart(2, '0')} / 03`;
    view = 'workflow';
    result.hidden = true;
    panel.replaceChildren();
    root.querySelector('#experiment-idle').hidden = false;
    resetButton.hidden = true;
    run.disabled = false;
    bench.classList.remove('is-resolved');
    status.textContent = announce ? '已重新開始。 / Ready for another look.' : '';
  }
  select.addEventListener('change', () => reset());
  resetButton.addEventListener('click', () => { reset(true); run.focus(); });
  run.addEventListener('click', () => {
    renderPanel();
    result.hidden = false;
    root.querySelector('#experiment-idle').hidden = true;
    resetButton.hidden = false;
    run.disabled = true;
    bench.classList.add('is-resolved');
    status.textContent = '範例已展開，未呼叫 AI 服務。 / Example opened. No AI service was called.';
    tabs[0].focus({preventScroll:true});
    if (matchMedia('(max-width:700px)').matches) result.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
  });
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => { view = tab.dataset.view; renderPanel(); });
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      tabs[next].click();
      tabs[next].focus();
    });
  });
  root.querySelector('#experiment-copy').addEventListener('click', async () => {
    const currentRevision = revision;
    const example = examples[select.value];
    const sections = [['workflow','流程 / Steps'],['checks','驗收 / Checks'],['boundaries','界線 / Boundaries']];
    const text = ['預設教學範例 / Prepared teaching example', example.note, example.english, ...sections.flatMap(([key, label]) => [label, ...example[key].map(([title, zh, en], i) => `${i + 1}. ${title}\n${zh}\n${en}`)])].join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      if (currentRevision === revision) status.textContent = '已複製完整範例。 / Full example copied.';
    } catch {
      if (currentRevision === revision) status.textContent = '瀏覽器未允許複製，請選取文字複製。 / Select the text to copy it manually.';
    }
  });
  reset();
  bench.hidden = false;
})();
