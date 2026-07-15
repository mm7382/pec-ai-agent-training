#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const workspaceRoot = resolve(new URL("..", import.meta.url).pathname);

const outputPath = join(workspaceRoot, "ai-agent-daily.json");
const requestTimeoutMs = Number(process.env.RADAR_REQUEST_TIMEOUT_MS || 15000);
const redditDelayMs = Number(process.env.REDDIT_RSS_DELAY_MS || 6000);
const enableTranslation = process.env.ENABLE_RADAR_TRANSLATION === "1";

const redditSubreddits = [
  "LocalLLaMA",
  "AI_Agents",
  "ClaudeAI",
  "CursorAI",
  "OpenAI",
];

const relevanceTerms = [
  "agent",
  "agents",
  "ai agent",
  "llm",
  "language model",
  "openai",
  "anthropic",
  "claude",
  "chatgpt",
  "gpt",
  "mcp",
  "model context protocol",
  "cursor",
  "ai ide",
  "coding agent",
  "codex",
  "automation",
  "local llm",
  "rag",
  "tool use",
  "agent skill",
  "agent skills",
  "ai agent skills",
  "skill.md",
  "openclaw",
  "pokerskill",
  "poker skill",
  "workflow",
  "multi-agent",
  "inference",
  "embedding",
  "embeddings",
  "reranker",
  "rerankers",
  "vllm",
  "llama.cpp",
  "qwen",
  "glm",
  "deepseek",
  "hugging face",
  "huggingface",
  "fine-tuning",
  "fine tuning",
  "speculative decoding",
];

const excludedTerms = [
  "stock",
  "stocks",
  "shares",
  "election",
  "politics",
  "crypto",
  "bitcoin",
  "profit",
  "profits",
  "quarterly",
  "singularity",
  "agi will",
  "job loss",
  "model collapse",
  "fearmongering",
  "medical",
  "clinical",
  "medgemma",
  "takeout",
];

function daysAgoTimestamp(days) {
  return Math.floor((Date.now() - days * 86400000) / 1000);
}

function cleanText(value = "", max = 500) {
  const clean = String(value || "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}...` : clean;
}

function hasCjk(value = "") {
  return /[\u3400-\u9fff]/.test(value);
}

async function fetchJson(url, headers = {}) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json,text/plain,*/*",
      "User-Agent": "pec-ai-agent-daily-radar",
      ...headers,
    },
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Request failed ${response.status}: ${body.slice(0, 240)}`);
  }
  return JSON.parse(body);
}

async function fetchText(url, headers = {}) {
  const requestHeaders = {
    Accept: "application/rss+xml,application/xml,text/xml,text/plain,*/*",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36",
    ...headers,
  };

  for (let attempt = 0; attempt < 1; attempt += 1) {
    const response = await fetch(url, {
      headers: requestHeaders,
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
    const body = await response.text();
    if (response.ok) return body;

    throw new Error(`Request failed ${response.status}: ${body.slice(0, 240)}`);
  }
  throw new Error("Request failed after retries");
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function decodeEntities(value = "") {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#32;/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripHtml(value = "") {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tagValue(entry, tag) {
  const match = entry.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeEntities(match[1]).trim() : "";
}

function tagAttribute(entry, tag, attribute) {
  const match = entry.match(new RegExp(`<${tag}[^>]*\\s${attribute}="([^"]+)"`, "i"));
  return match ? decodeEntities(match[1]).trim() : "";
}

function parseAtomEntries(xml) {
  return [...String(xml).matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((match) => match[1]);
}

async function translateToTraditionalChinese(text, fallback = "") {
  const source = cleanText(text, 1600);
  if (!source) return fallback;
  if (hasCjk(source)) return source;
  if (!enableTranslation) return fallback || source;

  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "auto");
  url.searchParams.set("tl", "zh-TW");
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", source.slice(0, 3900));

  try {
    const data = await fetchJson(url);
    return data?.[0]?.map((part) => part?.[0]).filter(Boolean).join("").trim() || source;
  } catch {
    return fallback || source;
  }
}

function relevanceScore(text = "") {
  const normalized = text.toLowerCase();
  if (excludedTerms.some((term) => normalized.includes(term))) return -10;
  const hits = relevanceTerms.filter((term) => normalized.includes(term)).length;
  return hits;
}

function hnUrlForObjectId(objectID) {
  return `https://news.ycombinator.com/item?id=${objectID}`;
}

async function fetchHn(period) {
  const numericFilters = [`created_at_i>${daysAgoTimestamp(period === "daily" ? 1 : 7)}`];
  const queries = [
    "AI agent",
    "LLM agent",
    "Claude Code",
    "OpenAI agent",
    "MCP",
    "local LLM",
    "AI coding",
    "RAG",
    "AI agent skills",
    "OpenClaw skills",
    "PokerSkill",
    "Claude skills",
    "Skill.md",
  ];
  const byId = new Map();

  for (const query of queries) {
    const url = new URL("https://hn.algolia.com/api/v1/search_by_date");
    url.searchParams.set("query", query);
    url.searchParams.set("tags", "story");
    url.searchParams.set("hitsPerPage", "30");
    url.searchParams.set("numericFilters", numericFilters.join(","));
    const data = await fetchJson(url);
    for (const item of data.hits || []) {
      const title = item.title || item.story_title || "";
      const targetUrl = item.url || hnUrlForObjectId(item.objectID);
      if (/^https?:\/\/([^/]+\.)?github\.com\//i.test(targetUrl)) continue;
      if (/^https?:\/\/([^/]+\.)?reddit\.com\//i.test(targetUrl)) continue;
      const haystack = `${title} ${item.url || ""}`;
      const relevance = relevanceScore(haystack);
      if (relevance <= 0) continue;
      const score = Number(item.points || 0) * 1.4 + Number(item.num_comments || 0) * 2 + relevance * 25;
      const existing = byId.get(item.objectID);
      if (!existing || score > existing.score) {
        byId.set(item.objectID, {
          id: `hn-${item.objectID}`,
          source: "Hacker News",
          sourceKey: "hn",
          period,
          originalTitle: title,
          url: targetUrl,
          discussionUrl: hnUrlForObjectId(item.objectID),
          points: Number(item.points || 0),
          comments: Number(item.num_comments || 0),
          createdAt: item.created_at,
          score,
        });
      }
    }
  }

  return [...byId.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

async function fetchReddit(period) {
  const time = period === "daily" ? "day" : "week";
  const byId = new Map();

  for (const subreddit of redditSubreddits) {
    const url = `https://www.reddit.com/r/${subreddit}/top.rss?t=${time}`;
    let xml = "";
    try {
      xml = await fetchText(url);
    } catch (error) {
      console.warn(`Skip r/${subreddit}: ${error.message}`);
      continue;
    }
    const entries = parseAtomEntries(xml);
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      const title = tagValue(entry, "title");
      const content = tagValue(entry, "content");
      const excerpt = cleanText(stripHtml(content), 500);
      const discussionUrl = tagAttribute(entry, "link", "href");
      const id = tagValue(entry, "id").replace(/^t3_/, "") || `${subreddit}-${index}`;
      const relevance = relevanceScore(`${title} ${excerpt}`);
      const titleRelevance = relevanceScore(title);
      if (relevance <= 0 || (titleRelevance <= 0 && relevance < 3)) continue;
      const score = (entries.length - index) * 8 + relevance * 20;
      byId.set(id, {
        id: `reddit-${id}`,
        source: `Reddit / r/${subreddit}`,
        sourceKey: "reddit",
        subreddit,
        period,
        originalTitle: title,
        originalExcerpt: excerpt,
        url: discussionUrl,
        discussionUrl,
        points: null,
        comments: null,
        createdAt: tagValue(entry, "published") || tagValue(entry, "updated"),
        rankSignal: "Reddit RSS top ranking",
        score,
      });
    }
    await sleep(redditDelayMs);
  }

  return [...byId.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function summarizeZh(item) {
  const source = item.sourceKey === "hn"
    ? "Hacker News 工程師討論"
    : `${item.source} 使用者討論`;
  const signals = [];
  const text = `${item.originalTitle} ${item.originalExcerpt || ""}`.toLowerCase();
  if (text.includes("mcp")) signals.push("MCP");
  if (text.includes("claude")) signals.push("Claude");
  if (text.includes("openai") || text.includes("gpt")) signals.push("OpenAI");
  if (text.includes("local") || text.includes("llm")) signals.push("LLM");
  if (text.includes("cursor")) signals.push("AI IDE");
  if (text.includes("agent")) signals.push("Agent");
  const topic = signals.length ? signals.slice(0, 3).join(" / ") : "AI Agent";
  return `這篇來自 ${source}，重點和 ${topic} 有關。適合用來快速了解社群正在討論的實作方向、工具變化或使用心得。`;
}

async function enrichItems(items) {
  const enriched = [];
  for (const item of items) {
    const titleZh = await translateToTraditionalChinese(item.originalTitle, item.originalTitle);
    const excerptZh = item.originalExcerpt
      ? await translateToTraditionalChinese(item.originalExcerpt, item.originalExcerpt)
      : "";
    enriched.push({
      ...item,
      titleZh,
      summaryZh: summarizeZh(item),
      excerptZh,
    });
  }
  return enriched.map((item, index) => ({ ...item, rank: index + 1 }));
}

function qualityReview(items) {
  const checks = [];
  for (const item of items) {
    const titleText = `${item.originalTitle} ${item.titleZh} ${item.originalExcerpt || ""}`;
    const relevance = relevanceScore(titleText);
    checks.push({
      id: item.id,
      pass: relevance > 0 && Boolean(item.url) && Boolean(item.titleZh) && Boolean(item.summaryZh),
      relevance,
      reason: relevance > 0 ? "AI Agent / LLM / AI coding 相關" : "相關性不足",
    });
  }
  return checks;
}

async function collectPeriod(period) {
  const [hnRaw, redditRaw] = await Promise.all([
    fetchHn(period),
    fetchReddit(period),
  ]);
  const [hn, reddit] = await Promise.all([
    enrichItems(hnRaw),
    enrichItems(redditRaw),
  ]);
  return {
    key: period,
    label: period === "daily" ? "每日前 5" : "每週前 5",
    hn,
    reddit,
    qualityReview: {
      hn: qualityReview(hn),
      reddit: qualityReview(reddit),
    },
  };
}

async function main() {
  const periods = [
    await collectPeriod("daily"),
    await collectPeriod("weekly"),
  ];
  const payload = {
    generatedAt: new Date().toISOString(),
    title: "AI Agent 每日熱門",
    source: "Hacker News Algolia API + Reddit public RSS",
    subreddits: redditSubreddits,
    criteria: [
      "只保留 AI Agent / LLM / AI coding / MCP / Local LLM / AI IDE / automation / agent skills 相關內容。",
      "排除股價、政治、純八卦與空泛未來論。",
      "Reddit 來源涵蓋 LocalLLaMA、AI_Agents、ClaudeAI、CursorAI、OpenAI，避免只看單一社群。",
      "每筆都保留原文標題、中文標題、中文簡介、來源網址；分數與留言數會在來源可提供時顯示。",
    ],
    periods,
  };
  mkdirSync(workspaceRoot, { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outputPath}`);
  for (const period of periods) {
    console.log(`${period.label}: HN ${period.hn.length}, Reddit ${period.reddit.length}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
