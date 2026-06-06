/**
 * Headless verification of the full generation pipeline.
 * Provides minimal DOM + Canvas shims so generator + image processor run in Node.
 */
import { JSDOM } from "jsdom";
import { SiteData, DEFAULT_DATA } from "../app/lib/types";
import { generateSite } from "../app/lib/siteGenerator";

function setupDomAndCanvas() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    pretendToBeVisual: true,
    resources: "usable",
  });

  global.window = dom.window as any;
  global.document = dom.window.document as any;
  global.HTMLCanvasElement = dom.window.HTMLCanvasElement as any;

  // Minimal canvas context + toBlob/toDataURL implementation
  const proto = dom.window.HTMLCanvasElement.prototype as unknown as any;

  proto.getContext = function () {
    const ctx: Record<string, unknown> = {};
    ctx.canvas = this;

    ctx.fillStyle = "#000";
    ctx.strokeStyle = "#fff";
    ctx.font = "16px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;

    ctx.fillRect = () => {};
    ctx.clearRect = () => {};
    ctx.drawImage = () => {};
    ctx.beginPath = () => {};
    ctx.closePath = () => {};
    ctx.moveTo = () => {};
    ctx.lineTo = () => {};
    ctx.arc = () => {};
    ctx.fill = () => {};
    ctx.stroke = () => {};
    ctx.createLinearGradient = () => ({ addColorStop() {} });

    ctx.fillText = () => {};

    this.width = this.width || 400;
    this.height = this.height || 300;

    this.toDataURL = () => {
      // 1x1 transparent png
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    };

    this.toBlob = (cb: (b: Blob | null) => void, type = "image/png") => {
      const dataUrl = this.toDataURL(type);
      const base64 = dataUrl.split(",")[1];
      const bytes = Buffer.from(base64, "base64");
      const blob = new Blob([bytes], { type });
      cb(blob);
    };

    return ctx;
  };
}

async function main() {
  console.log("Setting up DOM + Canvas shims for Node...");
  setupDomAndCanvas();

  const testData: SiteData = {
    ...DEFAULT_DATA,
    logo: null,
    hero: null,
    favicon: null,
    services: DEFAULT_DATA.services.map((s) => ({ ...s, image: null })),
    team: DEFAULT_DATA.team.map((t) => ({ ...t, photo: null })),
  };

  console.log("Invoking generateSite() with minimal data (text only)...");
  const t0 = Date.now();
  const { files } = await generateSite(testData);
  const duration = Date.now() - t0;

  const paths = Object.keys(files).sort();

  console.log(`\n✅ generateSite() produced ${paths.length} resources in ${duration}ms\n`);

  const mustHave = [
    "index.html",
    "services.html",
    "about.html",
    "contact.html",
    "assets/styles.css",
    "robots.txt",
    "sitemap.xml",
    ".htaccess",
    "README.md",
    "404.html",
  ];

  console.log("Core files:");
  mustHave.forEach((f) => {
    const ok = paths.includes(f);
    let size = 0;
    const entry = files[f];
    if (entry) {
      size = typeof entry === "string" ? entry.length : (entry as Blob).size;
    }
    console.log(`  ${ok ? "✓" : "✗"} ${f.padEnd(22)} ${size.toLocaleString().padStart(7)} bytes`);
  });

  // Validate content of index
  const indexBlob = files["index.html"] as Blob;
  const html = await indexBlob.text();

  console.log("\nContent validation (index.html):");
  const assertions: Array<[string, string]> = [
    ["<html lang=\"el\">", "Greek lang attribute"],
    [testData.legalName, "Legal name present"],
    [testData.gemi, "GEMI number present"],
    [testData.afm, "AFM present"],
    [testData.registeredAddress, "Registered address present"],
    ["assets/styles.css", "Stylesheet link"],
    ["<footer", "Footer exists"],
    ["Γ.Ε.ΜΗ.", "Greek legal footer text"],
  ];

  let passed = 0;
  assertions.forEach(([needle, desc]) => {
    const ok = html.includes(needle);
    console.log(`  ${ok ? "✓" : "✗"} ${desc}`);
    if (ok) passed++;
    else process.exitCode = 1;
  });

  // Styles
  const cssBlob = files["assets/styles.css"] as Blob;
  const css = await cssBlob.text();
  const colorOk = css.includes(testData.primaryColor) && css.includes("--primary");
  console.log(`  ${colorOk ? "✓" : "✗"} Primary color variables injected`);

  // Sitemap sanity
  const sm = await (files["sitemap.xml"] as Blob).text();
  const sitemapOk = sm.includes("YOUR-DOMAIN-HERE") && sm.includes("<urlset");
  console.log(`  ${sitemapOk ? "✓" : "✗"} Sitemap is valid XML skeleton`);

  // README contains hosting notes
  const readme = await (files["README.md"] as Blob).text();
  const readmeOk = readme.includes("Hostinger") && readme.includes("public_html");
  console.log(`  ${readmeOk ? "✓" : "✗"} README has hosting instructions`);

  console.log(`\n${passed}/${assertions.length} content checks passed.`);
  console.log("Verification complete.\n");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
