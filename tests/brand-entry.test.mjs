import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const learning = readFileSync(new URL('../learning.html', import.meta.url), 'utf8');
const index = JSON.parse(readFileSync(new URL('../tutorial-index.json', import.meta.url), 'utf8'));
const categories = new Set(index.items.map((item) => item.category));

test('the home entry presents AI Agent learning before the free app portfolio', () => {
  assert.match(home, /<title>[^<]*AI Agent[^<]*<\/title>/);
  assert.match(home, /<h1[^>]*>[^<]*AI Agent[^<]*<\/h1>/);
  assert.match(home, /href="\.\/tutorial-library\.html"/);
  for (const app of ['yijian', 'bazi', 'ziwei', 'astrology']) {
    assert.match(home, new RegExp(`href="https://mm7382\\.github\\.io/${app}-web/"`));
  }
});

test('the learning entry shows an accurate, clear course count', () => {
  assert.match(learning, /<h1[^>]*>[^<]*AI Agent[^<]*<\/h1>/);
  assert.match(learning, new RegExp(`<dt id="totalCount">${index.items.length}<\\/dt>`));
  assert.match(learning, new RegExp(`<dt>${categories.size}<\\/dt>`));
});
