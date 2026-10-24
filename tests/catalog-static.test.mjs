import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('../tutorial-library.html', import.meta.url), 'utf8');
const index = JSON.parse(readFileSync(new URL('../tutorial-index.json', import.meta.url), 'utf8'));
const pageUrl = 'https://mm7382.github.io/pec-ai-agent-training/tutorial-library.html';

test('every public tutorial is linked in the catalog HTML before JavaScript runs', () => {
  const links = new Set(
    [...page.matchAll(/<a\b[^>]*href="([^"]+)"/g)]
      .map((match) => new URL(match[1], pageUrl).href),
  );
  const missing = index.items
    .filter((item) => !links.has(new URL(item.url, pageUrl).href))
    .map((item) => item.title);

  assert.deepEqual(missing, [], `Tutorials missing from static catalog: ${missing.join(', ')}`);
});
