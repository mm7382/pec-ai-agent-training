import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { journalPaths } from './journal-discovery-data.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const selected = process.argv.slice(2);
if (!selected.length || selected.some((key) => !journalPaths[key])) {
  throw new Error('Pass one or more journal paths: ai, engineering');
}

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function article(slug) {
  const file = `journal-${slug}.html`;
  const html = readFileSync(resolve(root, file), 'utf8');
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]
    .replace(/\s+-\s+(Journal|學習日誌|Michael Chuang).*$/i, '') || slug;
  const summary = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1] || '';
  return { file, html, title, summary };
}

function replaceMarked(html, marker, block, anchor) {
  const start = `<!-- ${marker}:start -->`;
  const end = `<!-- ${marker}:end -->`;
  const existing = new RegExp(`${start}[\\s\\S]*?${end}`);
  const wrapped = `${start}\n${block}\n${end}`;
  if (existing.test(html)) return html.replace(existing, wrapped);
  if (!html.includes(anchor)) throw new Error(`Missing insertion anchor: ${marker}`);
  return html.replace(anchor, `${wrapped}\n${anchor}`);
}

let archive = readFileSync(resolve(root, 'journal.html'), 'utf8');
for (const key of selected) {
  const group = journalPaths[key];
  const items = group.slugs.map(article);
  const section = `<section class="journal-path" id="journal-path-${key}" aria-labelledby="journal-path-${key}-title">
  <div class="journal-path-head"><p class="journal-kicker">Reading path ${key === 'ai' ? '01' : '02'}</p><h2 id="journal-path-${key}-title">${escapeHtml(group.title)}<span class="journal-en" lang="en">${escapeHtml(group.english)}</span></h2><p>${escapeHtml(group.intro)}</p></div>
  <ol class="journal-path-list">${items.map((item) => `<li><a href="./${item.file}"><strong>${item.title}</strong><span>${item.summary}</span></a></li>`).join('')}</ol>
</section>`;
  archive = replaceMarked(archive, `journal-path:${key}`, section, '    <section class="journal-archive"');

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const neighbors = [items[i - 1], items[i + 1], items[i + 2]]
      .filter(Boolean).slice(0, 2);
    const nav = `<nav class="journal-related" aria-label="延伸閱讀 Related articles"><p>接著讀 <span lang="en">/ Keep reading</span></p><h2>${escapeHtml(group.title)}</h2><ul>${neighbors.map((other) => `<li><a href="./${other.file}">${other.title}</a></li>`).join('')}<li><a href="./journal.html#journal-path-${key}">回到學習日誌</a></li></ul></nav>`;
    const updated = replaceMarked(item.html, `journal-related:${key}`, nav, '</main>');
    writeFileSync(resolve(root, item.file), updated);
  }
}
writeFileSync(resolve(root, 'journal.html'), archive);
process.stdout.write(`Updated ${selected.join(', ')} journal paths\n`);
