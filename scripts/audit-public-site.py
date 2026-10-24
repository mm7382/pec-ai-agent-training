#!/usr/bin/env python3
"""Audit public Pages URLs and write a reviewable, page-by-page snapshot."""

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from xml.etree import ElementTree
import re

ROOT = 'https://mm7382.github.io'
SITE = f'{ROOT}/pec-ai-agent-training/'
SITEMAP = f'{ROOT}/sitemap-lab.xml'
APPS = [f'{ROOT}/{name}-web/' for name in ('bazi', 'ziwei', 'astrology', 'yijian')]
OUTPUT = Path(__file__).resolve().parents[1] / 'docs/search-discovery-audit-2026-10-24.md'


def fetch(url):
    try:
        req = Request(url, headers={'User-Agent': 'Michael-Agent-Lab-public-site-audit/1.0'})
        with urlopen(req, timeout=35) as response:
            return response.status, response.geturl(), response.read().decode('utf-8', 'replace')
    except HTTPError as error:
        return error.code, url, ''
    except (URLError, TimeoutError) as error:
        return 0, url, str(error)


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ''
        self.h1 = ''
        self.description = ''
        self.canonical = ''
        self.robots = ''
        self.links = []
        self.active = ''

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag in ('title', 'h1') and not getattr(self, tag):
            self.active = tag
        if tag == 'meta':
            name = attributes.get('name', '').lower()
            if name in ('description', 'robots'):
                setattr(self, name, attributes.get('content', ''))
        if tag == 'link' and attributes.get('rel', '').lower() == 'canonical':
            self.canonical = attributes.get('href', '')
        if tag == 'a' and attributes.get('href'):
            self.links.append(attributes['href'])

    def handle_endtag(self, tag):
        if tag == self.active:
            self.active = ''

    def handle_data(self, data):
        if self.active:
            setattr(self, self.active, getattr(self, self.active) + data.strip())


def audit(url):
    status, final, html = fetch(url)
    page = Page()
    if status == 200:
        page.feed(html)
    problems = []
    if status != 200:
        problems.append(f'HTTP {status}')
    if not page.title:
        problems.append('缺標題')
    if not page.h1:
        problems.append('缺主標題')
    if not page.description:
        problems.append('缺搜尋摘要')
    if 'noindex' in page.robots.lower():
        problems.append('誤設 noindex')
    if page.canonical and page.canonical.rstrip('/') != url.rstrip('/'):
        problems.append('canonical 不一致')
    if final.rstrip('/') != url.rstrip('/'):
        problems.append('轉址')
    return url, status, page, problems


def main():
    status, _, xml = fetch(SITEMAP)
    if status != 200:
        raise SystemExit(f'Sitemap unavailable: HTTP {status}')
    sitemap = ElementTree.fromstring(xml)
    urls = [node.text for node in sitemap.findall('.//{*}loc')]
    if len(urls) < 80 or any(not url.startswith(SITE) for url in urls):
        raise SystemExit(f'Unexpected sitemap: {len(urls)} site URLs')
    with ThreadPoolExecutor(max_workers=8) as pool:
        rows = list(pool.map(audit, urls + APPS))
    desc_missing = sum('缺搜尋摘要' in problems for _, _, _, problems in rows)
    failed = sum(status != 200 for _, status, _, _ in rows)
    changed = sum(bool(problems) for _, _, _, problems in rows)
    lines = [
        '# 正式網站公開頁稽核', '',
        f'查核時間：{datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")}。',
        f'來源：公開的 [個人網站 sitemap]({SITEMAP})（{len(urls)} 頁）及四款 App 首頁。',
        f'結果：{len(rows)} 頁，HTTP 非 200：{failed}；缺搜尋摘要：{desc_missing}；需修訂：{changed}。',
        '「保留」只代表這輪公開 HTML 基本項目通過，不代表 Google 已收錄或有曝光。', '',
        '| 公開網址 | 狀態 | 檢查結果 |', '|---|---:|---|',
    ]
    for url, status, page, problems in rows:
        path = url.removeprefix(ROOT)
        result = '；'.join(problems) if problems else '保留'
        lines.append(f'| [{path}]({url}) | {status} | {result} |')
    lines += ['', '## 需修訂的頁面', '']
    lines += [f'- {url}: {"；".join(problems)}' for url, _, _, problems in rows if problems]
    if not changed:
        lines.append('這輪未發現基本 HTML 問題。')
    OUTPUT.write_text('\n'.join(lines) + '\n')
    print(f'Audited {len(rows)} URLs: {failed} HTTP failures, {desc_missing} missing descriptions, {changed} pages need review')
    for url, _, _, problems in rows:
        if problems:
            print(url.removeprefix(ROOT), ':', '；'.join(problems))


if __name__ == '__main__':
    main()
