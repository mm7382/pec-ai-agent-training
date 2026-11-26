import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const learning = readFileSync(new URL('../learning.html', import.meta.url), 'utf8');
const index = JSON.parse(readFileSync(new URL('../tutorial-index.json', import.meta.url), 'utf8'));
const categories = new Set(index.items.map((item) => item.category));

test('the home entry highlights AI worlds and keeps the primary site destinations', () => {
  assert.match(home, /<title>[^<]*AI 自主世界[^<]*<\/title>/);
  assert.match(home, /<h1[^>]*>[^<]*AI 自主世界[^<]*<\/h1>/);
  for (const target of ['worlds.html', 'learning.html', 'yijian-app.html', 'ziwei-app.html']) {
    assert.ok(home.includes(`href="${target}"`));
  }
  assert.match(home, /<footer class="home-meta mal-privacy-notice">\s*<a href="privacy\.html">/);
  assert.doesNotMatch(home, /更多資源/);
});

test('the learning entry leads with tasks and shows the catalog counts', () => {
  assert.match(learning, /<h1[^>]*>學習資源<\/h1>/);
  assert.match(learning, /<h2[^>]*>今天想完成什麼？<\/h2>/);
  assert.match(learning, new RegExp(`<dt id="totalCount">${index.items.length}<\\/dt>`));
  assert.match(learning, new RegExp(`<dt>${categories.size}<\\/dt>`));
});
