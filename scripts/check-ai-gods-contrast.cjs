const { chromium } = require("playwright");

const targetUrl = process.argv[2]
  || "https://mm7382.github.io/pec-ai-agent-training/ai-gods.html";
const chromePath = process.env.CHROME_BIN
  || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const minimumRatio = 4.5;

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: chromePath,
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
    await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 30_000 });

    const results = await page.evaluate(
      ({ selectors, minimum }) => {
        function parse(value) {
          const channels = value.match(/[\d.]+/g)?.map(Number) || [];
          return {
            r: channels[0] || 0,
            g: channels[1] || 0,
            b: channels[2] || 0,
            a: channels.length > 3 ? channels[3] : 1,
          };
        }

        function over(foreground, background) {
          return {
            r: foreground.r * foreground.a + background.r * (1 - foreground.a),
            g: foreground.g * foreground.a + background.g * (1 - foreground.a),
            b: foreground.b * foreground.a + background.b * (1 - foreground.a),
            a: 1,
          };
        }

        function relativeLuminance(color) {
          const linear = (channel) => {
            const value = channel / 255;
            return value <= 0.04045
              ? value / 12.92
              : ((value + 0.055) / 1.055) ** 2.4;
          };

          return 0.2126 * linear(color.r)
            + 0.7152 * linear(color.g)
            + 0.0722 * linear(color.b);
        }

        function ratio(foreground, background) {
          const foregroundLuminance = relativeLuminance(foreground);
          const backgroundLuminance = relativeLuminance(background);
          return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
            / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
        }

        function backgroundFor(element) {
          const ancestors = [];
          for (let current = element; current; current = current.parentElement) {
            ancestors.unshift(current);
          }

          return ancestors.reduce(
            (background, current) => over(
              parse(getComputedStyle(current).backgroundColor),
              background,
            ),
            { r: 255, g: 255, b: 255, a: 1 },
          );
        }

        const checks = [];
        for (const selector of selectors) {
          for (const element of document.querySelectorAll(selector)) {
            const background = backgroundFor(element);
            const foreground = over(parse(getComputedStyle(element).color), background);
            checks.push({
              selector,
              text: element.textContent.trim().replace(/\s+/g, " ").slice(0, 80),
              ratio: Number(ratio(foreground, background).toFixed(2)),
            });
          }
        }

        const input = document.querySelector(".gods-search input");
        if (input) {
          const background = backgroundFor(input);
          const foreground = over(
            parse(getComputedStyle(input, "::placeholder").color),
            background,
          );
          checks.push({
            selector: ".gods-search input::placeholder",
            text: input.placeholder,
            ratio: Number(ratio(foreground, background).toFixed(2)),
          });
        }

        return {
          checks,
          failures: checks.filter((check) => check.ratio < minimum),
        };
      },
      {
        minimum: minimumRatio,
        selectors: [
          ".gods-stats strong",
          ".gods-stats span",
          ".gods-search > span",
          ".gods-filter-label",
          ".gods-skill-list li",
        ],
      },
    );

    if (!results.checks.length) {
      throw new Error("No AI Gods contrast targets were rendered.");
    }

    console.table(results.checks);
    if (results.failures.length) {
      console.error(`Contrast check failed: ${results.failures.length} item(s) below ${minimumRatio}:1.`);
      process.exitCode = 1;
    } else {
      console.log(`Contrast check passed: ${results.checks.length} item(s) meet ${minimumRatio}:1.`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
