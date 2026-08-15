import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, extname, join, normalize, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const errors = [];
const ignoredDirectories = new Set([
  ".git",
  ".codex",
  ".playwright-output",
  ".venv",
  "node_modules",
  "openspec",
]);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

function report(condition, message) {
  if (!condition) errors.push(message);
}

const files = await walk(root);
const htmlFiles = files.filter((file) => extname(file) === ".html");
const requiredPages = [
  "index.html",
  "products/index.html",
  "products/journey-kit.html",
  "products/content-kit.html",
  "articles/index.html",
  "articles/event-design.html",
  "articles/ab-testing.html",
  "contact/complete.html",
].map((path) => normalize(join(root, path)));

for (const required of requiredPages) {
  report(files.includes(required), `Missing required page: ${relative(root, required)}`);
}

report(htmlFiles.length >= 8, "Expected at least eight HTML pages.");

const hrefPattern = /\bhref="([^"]+)"/g;
const srcPattern = /\bsrc="([^"]+)"/g;

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const label = relative(root, file);

  report(/<!doctype html>/i.test(html), `${label}: missing doctype`);
  report(/<html lang="ja">/i.test(html), `${label}: missing Japanese language`);
  report(/<meta name="viewport"/i.test(html), `${label}: missing viewport`);
  report(/<main\b/i.test(html), `${label}: missing main landmark`);
  report(/class="skip-link"/i.test(html), `${label}: missing skip link`);
  report(/data-page-type="[^"]+"/i.test(html), `${label}: missing page type`);
  report(/ga4-config\.js/.test(html), `${label}: missing GA4 config script`);
  report(/analytics\.js/.test(html), `${label}: missing analytics script`);
  report(/tracking\.js/.test(html), `${label}: missing tracking script`);
  report(!/<form\b/i.test(html), `${label}: forms are prohibited in this demo`);

  for (const pattern of [hrefPattern, srcPattern]) {
    pattern.lastIndex = 0;
    for (const match of html.matchAll(pattern)) {
      const target = match[1];
      if (/^(https?:|mailto:|tel:|#)/i.test(target)) continue;
      const pathOnly = target.split(/[?#]/)[0];
      if (!pathOnly) continue;
      const resolved = normalize(resolve(dirname(file), pathOnly));
      try {
        const info = await stat(resolved);
        report(info.isFile() || info.isDirectory(), `${label}: invalid local target ${target}`);
      } catch {
        errors.push(`${label}: broken local target ${target}`);
      }
    }
  }
}

const analytics = await readFile(join(root, "assets/js/analytics.js"), "utf8");
const tracking = await readFile(join(root, "assets/js/tracking.js"), "utf8");
const experiment = await readFile(join(root, "assets/js/experiment.js"), "utf8");
const allScripts = `${analytics}\n${tracking}\n${experiment}`;

for (const eventName of [
  "page_view",
  "cta_click",
  "article_navigation",
  "outbound_click",
  "scroll_depth",
  "experiment_impression",
]) {
  report(analytics.includes(`${eventName}: {`), `Event contract missing ${eventName}`);
}

for (const forbidden of ["user_id", "email_address", "phone_number", "form_value"]) {
  report(!new RegExp(`\\b${forbidden}\\b`, "i").test(allScripts), `Forbidden personal-data field found: ${forbidden}`);
}

report(analytics.includes("send_page_view: false"), "Automatic GA4 page views are not disabled.");
report(analytics.includes('analytics_storage: "denied"'), "Default denied analytics consent missing.");
report(experiment.includes('candidate === "a" || candidate === "b"'), "Safe variant override validation missing.");
report(tracking.includes("const thresholds = [25, 50, 75, 90, 100]"), "Scroll thresholds do not match the specification.");

const productPages = await Promise.all([
  readFile(join(root, "products/journey-kit.html"), "utf8"),
  readFile(join(root, "products/content-kit.html"), "utf8"),
]);

for (const [index, html] of productPages.entries()) {
  const destinations = [...html.matchAll(/data-experiment-id="product-detail-primary-cta-v1"[^>]*href="([^"]+)"|href="([^"]+)"[^>]*data-experiment-id="product-detail-primary-cta-v1"/g)]
    .map((match) => match[1] || match[2]);
  report(destinations.length === 2, `Product detail ${index + 1}: expected two experiment CTA destinations.`);
  report(new Set(destinations).size === 1, `Product detail ${index + 1}: A/B destinations differ.`);
}

const journeyPage = productPages[0];
const journeyVariantACta = journeyPage.indexOf(">詳しく相談する</a>");
const journeyRelatedArticle = journeyPage.indexOf(">イベント名から始めない計測設計</a>");
report(journeyVariantACta >= 0, "Journey detail: Variant A CTA is missing.");
report(journeyRelatedArticle >= 0, "Journey detail: related article link is missing.");
report(
  journeyVariantACta < journeyRelatedArticle,
  "Journey detail: Variant A CTA must appear before the related article link.",
);
report(
  journeyPage.includes('class="next-step-card"'),
  "Journey detail: shared next-step section is missing.",
);

if (errors.length) {
  console.error(`Site validation failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Site validation passed: ${htmlFiles.length} HTML pages, links, event contract, privacy, and experiment structure.`);
}
