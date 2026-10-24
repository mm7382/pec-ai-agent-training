import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { journalPaths } from '../scripts/journal-discovery-data.mjs';

const selected = ['ai'];

test('journal topic paths are readable in HTML and preserve article dates', () => {
  const archive = readFileSync(new URL('../journal.html', import.meta.url), 'utf8');
  for (const key of selected) {
    const group = journalPaths[key];
    const section = archive.match(new RegExp(`<!-- journal-path:${key}:start -->([\\s\\S]*?)<!-- journal-path:${key}:end -->`))?.[1];
    assert.ok(section, `${key}: missing topic path`);
    for (const slug of group.slugs) {
      const filename = `journal-${slug}.html`;
      assert.ok(section.includes(filename), `${filename}: missing from topic path`);
      const article = readFileSync(new URL(`../${filename}`, import.meta.url), 'utf8');
      assert.match(article, /<time\s+datetime="\d{4}-\d\d-\d\d"/);
      assert.ok(article.includes('class="journal-related"'), `${filename}: missing related articles`);
      assert.ok(article.includes('journal.html'), `${filename}: missing journal return`);
    }
  }
});
