import { chromium } from "playwright-core";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const brandDir = __dirname;

const exports = [
  { svg: "logo-icon.svg", png: "logo-icon.png", width: 512, height: 512 },
  { svg: "logo-horizontal.svg", png: "logo-horizontal.png", width: 1280, height: 256 },
  { svg: "logo-vertical.svg", png: "logo-vertical.png", width: 512, height: 640 },
  { svg: "logo-full.svg", png: "logo-full.png", width: 1280, height: 256 },
  { svg: "favicon.svg", png: "favicon.png", width: 32, height: 32 },
  { svg: "app-icon.svg", png: "app-icon.png", width: 512, height: 512 }
];

async function svgToPng(browser, item) {
  const svgPath = path.join(brandDir, item.svg);
  const svg = readFileSync(svgPath, "utf8");
  const page = await browser.newPage();
  await page.setViewportSize({ width: item.width, height: item.height });
  await page.setContent(
    `<!DOCTYPE html><html><body style="margin:0;background:transparent;display:flex;align-items:center;justify-content:center;width:${item.width}px;height:${item.height}px;">${svg}</body></html>`,
    { waitUntil: "load" }
  );
  const el = await page.locator("svg").first();
  const buffer = await el.screenshot({ omitBackground: true, type: "png" });
  writeFileSync(path.join(brandDir, item.png), buffer);
  await page.close();
}

async function run() {
  const browser = await chromium.launch({ channel: "chrome" });
  for (const item of exports) {
    await svgToPng(browser, item);
    console.log("Generated", item.png);
  }
  writeFileSync(path.join(brandDir, "..", "..", "favicon.png"), readFileSync(path.join(brandDir, "favicon.png")));
  await browser.close();
  console.log("PNG assets generated.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
