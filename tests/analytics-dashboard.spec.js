import { expect, test } from "@playwright/test";

const analyticsData = {
  ok: true,
  generatedAt: "2026-08-04T09:15:00.000Z",
  rangeDays: 7,
  totals: {
    views: 48,
    uniqueVisitors: 21,
    averageDuration: 94,
    completionRate: 67,
    outboundClicks: 12,
  },
  trend: [
    { date: "2026-07-29", views: 4, visitors: 3 },
    { date: "2026-07-30", views: 7, visitors: 5 },
    { date: "2026-07-31", views: 5, visitors: 4 },
    { date: "2026-08-01", views: 8, visitors: 6 },
    { date: "2026-08-02", views: 6, visitors: 5 },
    { date: "2026-08-03", views: 9, visitors: 7 },
    { date: "2026-08-04", views: 9, visitors: 6 },
  ],
  topPages: [
    {
      path: "/pec-ai-agent-training/pec-training/claude-md-agents-md.html",
      title: "CLAUDE.md 與 AGENTS.md：把 AI 協作規則寫在對的位置",
      contentType: "tutorial",
      views: 14,
      uniqueVisitors: 10,
      averageDuration: 168,
      completionRate: 0.74,
      returnVisitors: 3,
      outboundClicks: 1,
      score: 55.2,
    },
    {
      path: "/pec-ai-agent-training/github-skills.html",
      title: "GitHub 熱門 Skill",
      contentType: "github",
      views: 12,
      uniqueVisitors: 9,
      averageDuration: 72,
      completionRate: 0.45,
      returnVisitors: 2,
      outboundClicks: 7,
      score: 49.6,
    },
  ],
  linkedinCampaigns: [
    {
      campaign: "agent-lab-launch",
      source: "linkedin",
      views: 18,
      visitors: 13,
      averageDuration: 102,
      engagedViews: 11,
      completionRate: 61,
    },
  ],
  searchTerms: [{ term: "claude skill", searches: 7, zeroResults: 0 }],
  zeroResultSearches: [{ term: "default", searches: 3, zeroResults: 3 }],
  recentVisits: [
    {
      visitor: "A01724",
      occurredAt: "2026-08-04T09:10:00.000Z",
      source: "linkedin",
      device: "mobile",
      routes: [
        { path: "/index.html", title: "Michael Agent Lab" },
        { path: "/github-skills.html", title: "GitHub 熱門 Skill" },
      ],
    },
  ],
  devices: [{ label: "mobile", count: 29 }],
  countries: [{ label: "TW", count: 44 }],
};

async function openDashboard(page, width, height) {
  await page.setViewportSize({ width, height });
  await page.route("**/analytics-v2?**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(analyticsData),
  }));
  await page.goto("/insights-7f3a.html");
  await expect(page.getByRole("heading", { name: "網站觀察後臺" })).toBeVisible();
  await expect(page.locator("#metricVisitors")).toHaveText("21");
}

test("desktop dashboard renders the decision-first layout", async ({ page }) => {
  await openDashboard(page, 1440, 1000);
  await expect(page.getByRole("heading", { name: "熱門內容排行" })).toBeVisible();
  await expect(page.getByText("agent-lab-launch")).toBeVisible();
  await expect(page.getByText("A01724")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "/tmp/michael-agent-lab-analytics-desktop.png", fullPage: true });
});

test("mobile dashboard stacks cleanly and can exclude this device", async ({ page }) => {
  await openDashboard(page, 390, 844);
  const toggle = page.locator("#excludeDevice");
  await page.locator("label.device-toggle").click();
  await expect(toggle).toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem("mal.analyticsExcluded.v1"))).toBe("true");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "/tmp/michael-agent-lab-analytics-mobile.png", fullPage: true });
});

test("privacy page explains anonymous retention on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/privacy.html");
  await expect(page.getByRole("heading", { name: "隱私說明", exact: true })).toBeVisible();
  await expect(page.getByText("瀏覽事件與分析趨勢只保留最近")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
