#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const publicRoot = resolve(new URL("..", import.meta.url).pathname);
const indexPath = join(publicRoot, "tutorial-index.json");

function decodeEntities(value = "") {
  return String(value)
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripHtml(html = "") {
  return decodeEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function itemPath(url = "") {
  const clean = String(url).replace(/^\.\//, "").split("#")[0].split("?")[0];
  return join(publicRoot, clean);
}

const data = JSON.parse(readFileSync(indexPath, "utf8"));
let enriched = 0;

data.items = (data.items || []).map((item) => {
  const path = itemPath(item.url);
  if (!existsSync(path)) return item;
  const text = stripHtml(readFileSync(path, "utf8")).slice(0, 6000);
  enriched += 1;
  return { ...item, searchText: text };
});

writeFileSync(indexPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(`Enriched ${enriched} tutorial search records`);
