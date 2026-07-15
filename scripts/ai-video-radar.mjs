#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const publicRoot = resolve(new URL("..", import.meta.url).pathname);
const outputPath = join(publicRoot, "ai-video-library.json");
const perQuery = Number(process.env.YOUTUBE_RESULTS_PER_QUERY || 12);
const itemLimit = Number(process.env.YOUTUBE_ITEM_LIMIT || 60);
const minYear = Number(process.env.YOUTUBE_MIN_YEAR || 2026);

const searches = [
  ["AI Agent 趨勢 / 比較", "AI Agent tools 2026"],
  ["AI Agent 趨勢 / 比較", "best AI agents 2026"],
  ["AI Coding / Claude Code / Codex", "Claude Code Codex AI coding agent 2026"],
  ["AI Coding / Claude Code / Codex", "AI coding agents Claude Code Cursor Codex 2026"],
  ["MCP / Agent 工具協議", "MCP servers AI agents 2026 tutorial"],
  ["Local LLM / 本機 Agent", "local AI agent local LLM 2026"],
  ["自動化工作流", "AI agent workflow automation n8n 2026"],
  ["Low-code / No-code 工具", "AI no-code low-code tools 2026"],
  ["Low-code / No-code 工具", "no code AI agent builder 2026"],
  ["中文 AI 教學", "AI Agent 教學 2026"],
  ["中文 AI 教學", "Claude Code Codex 教學 AI Agent"],
];

const categories = [...new Set(searches.map(([category]) => category))];

function clean(value = "", max = 240) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function yyyymmddFromItem(item) {
  if (item.upload_date && /^\d{8}$/.test(item.upload_date)) return item.upload_date;
  if (item.timestamp) return new Date(item.timestamp * 1000).toISOString().slice(0, 10).replace(/-/g, "");
  return "";
}

function recencyScore(dateText) {
  if (!dateText || !/^\d{8}$/.test(dateText)) return 0;
  const year = Number(dateText.slice(0, 4));
  if (year < minYear) return -1000;
  const date = new Date(`${dateText.slice(0, 4)}-${dateText.slice(4, 6)}-${dateText.slice(6, 8)}T00:00:00Z`);
  const ageDays = Math.max(0, (Date.now() - date.getTime()) / 86400000);
  return Math.max(0, 120 - ageDays);
}

function relevanceScore(item, category) {
  const text = `${item.title || ""} ${item.description || ""} ${category}`.toLowerCase();
  const terms = [
    "ai agent",
    "agent",
    "claude",
    "codex",
    "cursor",
    "mcp",
    "local llm",
    "automation",
    "workflow",
    "no-code",
    "nocode",
    "low-code",
    "lowcode",
    "n8n",
  ];
  return terms.filter((term) => text.includes(term)).length * 25;
}

function scoreItem(item, category) {
  const dateText = yyyymmddFromItem(item);
  return Math.log10(Number(item.view_count || 0) + 1) * 90
    + recencyScore(dateText)
    + relevanceScore(item, category)
    + (item.channel_is_verified ? 20 : 0);
}

function runSearch(query) {
  const raw = execFileSync("yt-dlp", [
    "--dump-json",
    "--skip-download",
    "--flat-playlist",
    "--no-warnings",
    "--no-update",
    `ytsearch${perQuery}:${query}`,
  ], { encoding: "utf8", maxBuffer: 24 * 1024 * 1024 });
  return raw.split("\n").filter(Boolean).map((line) => JSON.parse(line));
}

function fetchVideoDetails(id) {
  try {
    const raw = execFileSync("yt-dlp", [
      "--dump-json",
      "--skip-download",
      "--no-warnings",
      "--no-update",
      `https://www.youtube.com/watch?v=${id}`,
    ], { encoding: "utf8", maxBuffer: 24 * 1024 * 1024 });
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function languageFor(item) {
  return /[\u3400-\u9fff]/.test(`${item.title || ""} ${item.channel || ""}`) ? "中文" : "英文";
}

function buildSummary(item, category) {
  if (category.includes("Low-code") || category.includes("No-code")) {
    return "聚焦低程式碼／無程式碼 AI 工具，適合想快速做出自動化、AI app 或 agent prototype 的使用者。";
  }
  if (category.includes("AI Coding")) {
    return "聚焦 AI coding agent 與開發工作流，適合比較 Claude Code、Codex、Cursor 類工具的實作方式。";
  }
  if (category.includes("MCP")) {
    return "聚焦 MCP 與工具協議，適合理解 agent 如何連接外部工具、資料與服務。";
  }
  if (category.includes("Local")) {
    return "聚焦本機模型或可自架 Agent，適合評估資料留在本機、成本與部署限制。";
  }
  return "近期 AI Agent / AI 工具影片候選，適合先看主題方向，再決定是否深入原始內容。";
}

const byId = new Map();
for (const [category, query] of searches) {
  for (const item of runSearch(query)) {
    if (!item.id || !item.title) continue;
    const dateText = yyyymmddFromItem(item);
    if (dateText && Number(dateText.slice(0, 4)) < minYear) continue;
    const currentScore = scoreItem(item, category);
    const existing = byId.get(item.id);
    if (existing && existing._score >= currentScore) continue;
    byId.set(item.id, {
      id: item.id,
      title: item.title,
      channel: item.channel || item.uploader || "",
      url: item.webpage_url || item.url || `https://www.youtube.com/watch?v=${item.id}`,
      thumbnail: `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
      publishedAt: dateText || "",
      duration: item.duration_string || "",
      viewCount: Number(item.view_count || 0),
      category,
      language: languageFor(item),
      summary: buildSummary(item, category),
      highlights: [
        "依近期性、觀看數與主題關聯度納入候選。",
        `分類：${category}。`,
        item.view_count ? `公開觀看數約 ${new Intl.NumberFormat("en").format(item.view_count)}。` : "公開搜尋結果未提供完整觀看數。",
      ],
      audience: [
        "想追 AI Agent / AI 工具趨勢的使用者",
        "需要用影片快速建立工具雷達的人",
      ],
      detail: [
        clean(item.description || item.title, 500),
        "建議閱讀方式：先確認影片是否示範真實流程，再檢查工具限制、成本、資料安全與是否適合放進自己的工作流。",
      ],
      tags: category.includes("No-code") || category.includes("Low-code")
        ? ["Low-code", "No-code", "AI 工具"]
        : ["AI Agent", "AI 工具", "2026"],
      sourceType: "YouTube",
      _score: currentScore,
    });
  }
}

const preliminary = [...byId.values()]
  .sort((a, b) => b._score - a._score)
  .slice(0, itemLimit * 2);

const detailed = [];
for (const item of preliminary) {
  const details = fetchVideoDetails(item.id);
  const publishedAt = yyyymmddFromItem(details || item);
  if (publishedAt && Number(publishedAt.slice(0, 4)) < minYear) continue;
  const merged = {
    ...item,
    title: details?.title || item.title,
    channel: details?.channel || details?.uploader || item.channel,
    url: details?.webpage_url || item.url,
    publishedAt,
    duration: details?.duration_string || item.duration,
    viewCount: Number(details?.view_count || item.viewCount || 0),
    description: details?.description || item.description,
  };
  merged._score = scoreItem({
    ...merged,
    upload_date: publishedAt,
    view_count: merged.viewCount,
    channel_is_verified: details?.channel_is_verified,
  }, merged.category);
  detailed.push(merged);
  if (detailed.length >= itemLimit) break;
}

const items = detailed
  .sort((a, b) => b._score - a._score)
  .map(({ _score, description, ...item }) => item);

if (items.length < 10) {
  throw new Error(`YouTube radar returned too few items: ${items.length}`);
}

const payload = {
  generatedAt: new Date().toISOString(),
  title: "YouTube AI 影片精選",
  description: "依公開 YouTube 搜尋 metadata 整理近期 AI Agent、AI Coding、MCP、Local LLM、自動化與 Low-code / No-code 影片。",
  selectionMethod: "以 yt-dlp 擷取 YouTube 公開搜尋候選結果；依觀看數、近期性、頻道驗證狀態與 AI Agent / Skill / Low-code 主題關聯度排序。這不是 YouTube 官方 Trending API。",
  notes: [
    "無 YouTube Data API key 時，公開搜尋只能近似熱門排序，無法等同 YouTube 官方全站熱門。",
    "優先保留 2026 年內容；搜尋結果未提供發布日期時，不給近期加分。",
    "Low-code / No-code 已獨立分類，方便找不寫程式也能使用的工具影片。",
  ],
  categories,
  items,
};

mkdirSync(publicRoot, { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Wrote ${outputPath} with ${items.length} videos`);
