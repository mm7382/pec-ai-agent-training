import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const index = JSON.parse(readFileSync(resolve(root, 'tutorial-index.json'), 'utf8'));
const selectedCategories = new Set(process.argv.slice(2));
if (selectedCategories.size === 0) throw new Error('Pass one or more tutorial categories');

function escapeHtml(value = '') {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function href(from, to) {
  const path = relative(dirname(from), resolve(root, to)).replaceAll('\\', '/');
  return path.startsWith('.') ? path : `./${path}`;
}

function relatedItems(item) {
  const group = index.items.filter((other) => other.category === item.category);
  const current = group.findIndex((other) => other.url === item.url);
  const neighbors = [group[current - 1], group[current + 1], group[current + 2]]
    .filter((other) => other && other.url !== item.url).slice(0, 2);
  if (neighbors.length) return neighbors;
  const crossTopic = item.category === '設計與輸出工作流'
    ? '工具選型與上手' : 'Skill、蒸餾與能力沉澱';
  return index.items.filter((other) => other.category === crossTopic).slice(0, 2);
}

function updatePage(item) {
  const path = resolve(root, item.url.replace(/^\.\//, ''));
  let html = readFileSync(path, 'utf8');
  if (!/<meta\s+name=["']description["']/i.test(html.slice(0, html.toLowerCase().indexOf('</head>')))) {
    html = html.replace(/<\/title>/i, (close) => `${close}\n  <meta name="description" content="${escapeHtml(item.summary)}">`);
  }
  if (!html.includes('lesson-related.css')) {
    html = html.replace(/<\/head>/i, `  <link rel="stylesheet" href="${href(path, 'lesson-related.css')}?v=20261024">\n</head>`);
  }

  const peers = relatedItems(item);
  const block = `<!-- mal-related:start -->
<nav class="mal-related" aria-label="同主題教材">
  <div class="mal-related-inner">
    <p class="mal-related-label">接著讀 <span lang="en">/ Keep learning</span></p>
    <h2>${escapeHtml(item.category)}</h2>
    <ul>
      ${peers.map((peer) => `<li><a href="${escapeHtml(href(path, peer.url.replace(/^\.\//, '')))}">${escapeHtml(peer.title)}</a></li>`).join('\n      ')}
      <li><a href="${escapeHtml(href(path, 'tutorial-library.html'))}">返回所有分類教材</a></li>
    </ul>
  </div>
</nav>
<!-- mal-related:end -->`;
  const existing = /<!-- mal-related:start -->[\s\S]*?<!-- mal-related:end -->/;
  if (existing.test(html)) html = html.replace(existing, block);
  else {
    const end = html.toLowerCase().lastIndexOf('</body>');
    if (end < 0) throw new Error(`Missing body end: ${item.url}`);
    html = `${html.slice(0, end)}${block}\n${html.slice(end)}`;
  }
  writeFileSync(path, html);
}

const selected = index.items.filter((item) => selectedCategories.has(item.category));
if (selected.length === 0) throw new Error('No tutorials matched categories');
for (const item of selected) updatePage(item);
process.stdout.write(`Updated ${selected.length} tutorials\n`);
