import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const gate = readFileSync(new URL('../tutorial-gate.js', import.meta.url), 'utf8');

function mount(pathname) {
  class Element {
    children = [];
    dataset = {};
    classList = { add() {} };
    setAttribute(name, value) { this[name] = value; }
    append(...items) {
      for (const item of items) {
        if (item.parent) item.parent.children = item.parent.children.filter(x => x !== item);
        this.children.push(item);
        item.parent = this;
      }
    }
    prepend(item) { this.children.unshift(item); }
  }
  const theme = new Element();
  theme.href = './sunlit.css?v=20261124b';
  const head = new Element();
  head.append(theme);
  const body = new Element();
  const document = {
    head, body,
    documentElement: { classList: { contains: name => name === 'sunlit' } },
    createElement: () => new Element(),
    querySelector: selector => selector.includes('sunlit.css') ? theme : null,
  };
  vm.runInNewContext(gate, {
    document, URL,
    window: { MALAnalytics: true, location: { pathname, href: `https://example.test${pathname}` } },
  });
  return { head, body, theme };
}

for (const pathname of ['/pec-ai-agent-training/journal.html', '/pec-ai-agent-training/pec-training/lesson.html', '/pec-ai-agent-training/previews/example.html']) {
  test(`return home keeps the new design from ${pathname}`, () => {
    const { head, body, theme } = mount(pathname);
    assert.equal(head.children.at(-1), theme, 'theme must follow dynamically inserted legacy styles');
    const nav = body.children[0];
    const brand = nav.children[0];
    const home = nav.children[1].children[0];
    for (const link of [brand, home]) {
      const url = new URL(link.href, `https://example.test${pathname}`);
      assert.equal(url.pathname, '/pec-ai-agent-training/index.html');
      assert.equal(url.searchParams.get('v'), '20261124b');
    }
  });
}
