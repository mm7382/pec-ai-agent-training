import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const indexPath = fileURLToPath(new URL('../tutorial-index.json', import.meta.url));
const pagePath = fileURLToPath(new URL('../tutorial-library.html', import.meta.url));
const data = JSON.parse(readFileSync(indexPath, 'utf8'));
const items = data.items || [];
const categories = [
  ...(data.categories || []),
  ...[...new Set(items.map((item) => item.category).filter(Boolean))]
    .filter((category) => !(data.categories || []).includes(category)),
];

function escapeHtml(value = '') {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function slug(value) {
  return `category-${String(value).toLowerCase().replace(/\s+/g, ' ').trim()
    .replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '')}`;
}

function replaceRegion(source, name, content) {
  const start = `<!-- static-catalog-${name}:start -->`;
  const end = `<!-- static-catalog-${name}:end -->`;
  const before = source.indexOf(start);
  const after = source.indexOf(end);
  if (before < 0 || after < before) throw new Error(`Missing ${name} region in catalog HTML`);
  return source.slice(0, before + start.length) + '\n' + content + '\n      '
    + source.slice(after);
}

const groups = categories.map((category) => [
  category,
  items.filter((item) => item.category === category),
]).filter(([, groupItems]) => groupItems.length);

const nav = groups.map(([category, groupItems]) =>
  `      <a href="#${escapeHtml(slug(category))}">${escapeHtml(category)} ${groupItems.length}</a>`
).join('\n');

const content = groups.map(([category, groupItems]) => `      <section class="catalog-group" id="${escapeHtml(slug(category))}">
        <div class="catalog-group-header">
          <div><p class="section-label">Category</p><h2>${escapeHtml(category)}</h2></div>
          <span>${groupItems.length} 份教材</span>
        </div>
        <div class="catalog-item-grid">
${groupItems.map((item) => `          <article class="catalog-item">
            <div class="catalog-item-top"><span>${escapeHtml(item.level || '教材')}</span></div>
            <h3><a href="${escapeHtml(item.url)}">${escapeHtml(item.title)}</a></h3>
            <p>${escapeHtml(item.summary || '')}</p>
          </article>`).join('\n')}
        </div>
      </section>`).join('\n');

let page = readFileSync(pagePath, 'utf8');
page = replaceRegion(page, 'nav', nav);
page = replaceRegion(page, 'groups', content);
page = page.replace(/(<dt id="catalogTotal">)[^<]*(<\/dt>)/, (_, open, close) => `${open}${items.length}${close}`);
page = page.replace(/(<dt id="catalogCategoryTotal">)[^<]*(<\/dt>)/, (_, open, close) => `${open}${groups.length}${close}`);
page = page.replace(/(<span id="catalogResultCount">)[^<]*(<\/span>)/, (_, open, close) => `${open}共 ${items.length} 份教材${close}`);
writeFileSync(pagePath, page);
