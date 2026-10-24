import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const index = JSON.parse(readFileSync(new URL('../tutorial-index.json', import.meta.url), 'utf8'));
const coveredCategories = new Set([
  'AI Agent 入門與學習路線',
  '工具選型與上手',
]);

test('selected tutorials explain themselves and link to more reading in raw HTML', () => {
  const selected = index.items.filter((item) => coveredCategories.has(item.category));
  assert.equal(selected.length, 13);

  for (const item of selected) {
    const page = readFileSync(new URL(`../${item.url.slice(2)}`, import.meta.url), 'utf8');
    const head = page.slice(0, page.toLowerCase().indexOf('</head>'));
    const description = head.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)/i)?.[1];
    assert.ok(description?.includes(item.summary.slice(0, 12)), `${item.title}: missing specific summary`);
    const related = page.match(/<nav class="mal-related"[\s\S]*?<\/nav>/)?.[0];
    assert.ok(related, `${item.title}: missing related reading`);
    assert.ok(related.includes('tutorial-library.html'), `${item.title}: missing catalog return`);
    assert.ok((related.match(/<a\b/g) || []).length >= 2, `${item.title}: missing peer lesson`);
  }
});
