import { chromium } from "playwright";
import { SYNTHETIC_CONFIG, DEVICE_PROFILES } from "./config.mjs";
import {
  buildSessionPlan,
  createRunId,
  createSeededRandom,
  selectDryRunPlan,
  summarizePlan,
  validateRunId,
} from "./plan.mjs";
import {
  createNetworkObserver,
  validateSessionEvents,
  waitForEventCount,
  waitForObservedEvent,
} from "./network.mjs";
import { aggregateResults, writeReports } from "./report.mjs";
import { requestPolicy, safeErrorCode } from "./safety.mjs";

export function parseArguments(argv) {
  const options = {
    sessions: 50,
    concurrency: SYNTHETIC_CONFIG.defaultConcurrency,
    planOnly: false,
    headed: false,
    fast: false,
    runId: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--plan-only") options.planOnly = true;
    else if (argument === "--headed") options.headed = true;
    else if (argument === "--fast") options.fast = true;
    else if (argument === "--sessions") options.sessions = Number(argv[++index]);
    else if (argument === "--concurrency") options.concurrency = Number(argv[++index]);
    else if (argument === "--run-id") options.runId = argv[++index];
    else throw new Error(`Unknown argument: ${argument}`);
  }
  if (!Number.isInteger(options.sessions) || options.sessions < 1 || options.sessions > 50) {
    throw new Error("--sessions must be an integer between 1 and 50");
  }
  if (
    !Number.isInteger(options.concurrency)
    || options.concurrency < 1
    || options.concurrency > SYNTHETIC_CONFIG.maxConcurrency
  ) {
    throw new Error(`--concurrency must be an integer between 1 and ${SYNTHETIC_CONFIG.maxConcurrency}`);
  }
  if (options.fast && options.sessions > 3) {
    throw new Error("--fast is allowed only for dry-runs of 1 to 3 sessions");
  }
  return options;
}

function randomBetween([minimum, maximum], random) {
  return Math.round(minimum + random() * (maximum - minimum));
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function addUtm(targetUrl, runId) {
  const url = new URL(targetUrl);
  url.searchParams.set("utm_source", SYNTHETIC_CONFIG.utmSource);
  url.searchParams.set("utm_medium", SYNTHETIC_CONFIG.utmMedium);
  url.searchParams.set("utm_campaign", runId);
  return url.href;
}

function siteUrl(path, query = {}) {
  const url = new URL(path, SYNTHETIC_CONFIG.targetUrl);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  return url.href;
}

async function clickAndWait(page, locator) {
  await Promise.all([
    page.waitForLoadState("domcontentloaded"),
    locator.click(),
  ]);
}

async function clickMeasuredLink(page, observer, locator, eventName) {
  const beforeCount = observer.countEvent(eventName);
  const destination = await locator.getAttribute("href");
  await locator.evaluate((element) => {
    element.addEventListener("click", (event) => event.preventDefault(), { once: true });
  });
  await locator.click();
  await waitForEventCount(observer, eventName, beforeCount + 1, SYNTHETIC_CONFIG.eventWaitMs);
  await page.goto(new URL(destination, page.url()).href, { waitUntil: "domcontentloaded" });
}

async function stepDelay(random, fast) {
  await sleep(fast ? 100 : randomBetween(SYNTHETIC_CONFIG.operationDelayMs, random));
}

async function grantConsent(page, observer) {
  const beforeCount = observer.countEvent("page_view");
  await page.locator('[data-analytics-consent="grant"]').first().click();
  await page.locator('[data-consent-status]').first().filter({ hasText: /有効/ }).waitFor();
  await waitForEventCount(observer, "page_view", beforeCount + 1, SYNTHETIC_CONFIG.eventWaitMs);
}

async function scrollToMaximum(page, maximum, random, fast) {
  const thresholds = [25, 50, 75, 90, 100].filter((value) => value <= maximum);
  for (const threshold of thresholds) {
    await page.evaluate((depth) => {
      const root = document.documentElement;
      const target = Math.max(0, (root.scrollHeight * depth) / 100 - window.innerHeight);
      window.scrollTo({ top: target, behavior: "instant" });
    }, threshold);
    await stepDelay(random, fast);
  }
}

async function openVariantProduct(page, product, variant) {
  await page.goto(siteUrl(`products/${product}.html`, { variant }), { waitUntil: "domcontentloaded" });
  await page.locator(
    `div[data-experiment-variant="${variant}"]:not([hidden]) [data-ga-event="cta_click"]`,
  ).waitFor();
}

async function runProductShort(page, session, random, fast) {
  await page.goto(siteUrl("products/index.html"), { waitUntil: "domcontentloaded" });
  await stepDelay(random, fast);
  await openVariantProduct(page, "journey-kit", session.variant);
  await scrollToMaximum(page, session.maxScrollDepth, random, fast);
}

async function runArticleFocused(page, observer, session, random, fast) {
  await page.goto(siteUrl("articles/index.html"), { waitUntil: "domcontentloaded" });
  await stepDelay(random, fast);
  await clickMeasuredLink(
    page,
    observer,
    page.locator('a[href="event-design.html"][data-ga-event="article_navigation"]'),
    "article_navigation",
  );
  await stepDelay(random, fast);
  await clickMeasuredLink(
    page,
    observer,
    page.locator('a[href="ab-testing.html"][data-ga-event="article_navigation"]'),
    "article_navigation",
  );
  await scrollToMaximum(page, session.maxScrollDepth, random, fast);
  await openVariantProduct(page, "content-kit", session.variant);
}

async function runMixedDeep(context, page, session, random, fast) {
  await page.goto(siteUrl("products/index.html"), { waitUntil: "domcontentloaded" });
  await stepDelay(random, fast);
  await openVariantProduct(page, "journey-kit", session.variant);
  const related = page.locator('a[data-ga-event="article_navigation"][data-link-position="product-related"]');
  const articlePromise = context.waitForEvent("page");
  await related.click({ modifiers: ["Control"] });
  const articlePage = await articlePromise;
  await articlePage.waitForLoadState("domcontentloaded");
  await scrollToMaximum(articlePage, session.maxScrollDepth, random, fast);
  const external = articlePage.locator('a[href^="https://"][data-link-position="article-aside"]');
  await external.click();
  await stepDelay(random, fast);
  await articlePage.close();
  await page.bringToFront();
}

async function maybeClickCta(page, observer, session, random, fast) {
  if (!session.shouldClickCta) return false;
  await stepDelay(random, fast);
  const cta = page.locator(
    `div[data-experiment-variant="${session.variant}"]:not([hidden]) [data-ga-event="cta_click"]`,
  );
  const destination = await cta.getAttribute("href");
  const beforeCount = observer.countEvent("cta_click");
  await cta.evaluate((element) => {
    element.addEventListener("click", (event) => event.preventDefault(), { once: true });
  });
  await cta.click();
  await waitForEventCount(observer, "cta_click", beforeCount + 1, SYNTHETIC_CONFIG.eventWaitMs);
  await page.goto(new URL(destination, page.url()).href, { waitUntil: "domcontentloaded" });
  if (!new URL(page.url()).pathname.endsWith("/contact/complete.html")) {
    throw new Error("CTA did not reach the contact completion page");
  }
  return true;
}

async function executeSession(browser, session, runId, attempt, options, stopState) {
  const random = createSeededRandom(`${runId}-${session.sessionIndex}-${attempt}`);
  const profile = DEVICE_PROFILES[session.device];
  const context = await browser.newContext({ ...profile, locale: "ja-JP" });
  let externalDocumentsBlocked = 0;
  await context.route("**/*", async (route) => {
    const request = route.request();
    const policy = requestPolicy(request.url(), request.resourceType(), SYNTHETIC_CONFIG.targetUrl);
    if (policy.action === "abort") {
      externalDocumentsBlocked += 1;
      await route.abort("blockedbyclient");
      return;
    }
    await route.continue();
  });

  const page = await context.newPage();
  page.setDefaultTimeout(SYNTHETIC_CONFIG.navigationTimeoutMs);
  page.setDefaultNavigationTimeout(SYNTHETIC_CONFIG.navigationTimeoutMs);
  const observer = createNetworkObserver(context, session);
  const startedAt = new Date().toISOString();

  try {
    if (stopState.requested) throw new Error("Execution stop requested");
    await page.goto(addUtm(SYNTHETIC_CONFIG.targetUrl, runId), { waitUntil: "domcontentloaded" });
    await grantConsent(page, observer);
    await stepDelay(random, options.fast);

    if (session.scenarioId === "product-short") {
      await runProductShort(page, session, random, options.fast);
    } else if (session.scenarioId === "article-focused") {
      await runArticleFocused(page, observer, session, random, options.fast);
    } else if (session.scenarioId === "mixed-deep") {
      await runMixedDeep(context, page, session, random, options.fast);
    } else {
      throw new Error(`Unknown scenario: ${session.scenarioId}`);
    }

    await waitForObservedEvent(observer, "experiment_impression", SYNTHETIC_CONFIG.eventWaitMs);
    const ctaClicked = await maybeClickCta(page, observer, session, random, options.fast);
    if (ctaClicked) await waitForObservedEvent(observer, "cta_click", SYNTHETIC_CONFIG.eventWaitMs);
    if (session.scenarioId !== "product-short") {
      await waitForObservedEvent(observer, "article_navigation", SYNTHETIC_CONFIG.eventWaitMs);
    }
    if (session.scenarioId === "mixed-deep") {
      await waitForObservedEvent(observer, "outbound_click", SYNTHETIC_CONFIG.eventWaitMs);
    }
    await waitForObservedEvent(observer, "scroll_depth", SYNTHETIC_CONFIG.eventWaitMs);
    validateSessionEvents(observer.events, session, ctaClicked);

    return {
      sessionIndex: session.sessionIndex,
      attempt,
      success: true,
      variant: session.variant,
      scenarioId: session.scenarioId,
      maxScrollDepth: session.maxScrollDepth,
      device: session.device,
      userAgent: await page.evaluate(() => navigator.userAgent),
      viewport: page.viewportSize(),
      ctaClicked,
      externalDocumentsBlocked,
      startedAt,
      endedAt: new Date().toISOString(),
      events: observer.events,
    };
  } catch (error) {
    return {
      sessionIndex: session.sessionIndex,
      attempt,
      success: false,
      variant: session.variant,
      scenarioId: session.scenarioId,
      maxScrollDepth: session.maxScrollDepth,
      device: session.device,
      ctaClicked: false,
      externalDocumentsBlocked,
      startedAt,
      endedAt: new Date().toISOString(),
      errorCode: safeErrorCode(error),
      events: observer.events,
    };
  } finally {
    await context.close().catch(() => {});
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const runId = validateRunId(options.runId || createRunId());
  const fullPlan = buildSessionPlan(runId);
  const plan = selectDryRunPlan(fullPlan, options.sessions);
  const publicConfig = {
    targetUrl: SYNTHETIC_CONFIG.targetUrl,
    sessions: plan.length,
    concurrency: options.concurrency,
    headed: options.headed,
    maxRuntimeMinutes: SYNTHETIC_CONFIG.maxRuntimeMs / 60000,
    retryCount: SYNTHETIC_CONFIG.retryCount,
    utmSource: SYNTHETIC_CONFIG.utmSource,
    utmMedium: SYNTHETIC_CONFIG.utmMedium,
  };

  if (options.planOnly) {
    process.stdout.write(`${JSON.stringify({ runId, config: publicConfig, summary: summarizePlan(fullPlan), plan }, null, 2)}\n`);
    return;
  }

  const stopState = { requested: false, reason: null };
  const requestStop = (reason) => {
    stopState.requested = true;
    stopState.reason = reason;
  };
  process.once("SIGINT", () => requestStop("user_interrupt"));
  process.once("SIGTERM", () => requestStop("termination_signal"));

  const startedAt = new Date().toISOString();
  const deadline = Date.now() + SYNTHETIC_CONFIG.maxRuntimeMs;
  const attempts = [];
  const browser = await chromium.launch({ headless: !options.headed });
  let status = "completed";
  let latestOutputDir = null;
  let completedSessions = 0;
  let nextExecutionIndex = 0;
  let checkpointQueue = Promise.resolve();
  const persistCheckpoint = async (checkpointStatus) => {
    const checkpointEndedAt = new Date().toISOString();
    const checkpointSummary = aggregateResults(
      plan,
      attempts,
      checkpointStatus,
      startedAt,
      checkpointEndedAt,
    );
    latestOutputDir = await writeReports(SYNTHETIC_CONFIG.outputRoot, runId, {
      runId,
      config: publicConfig,
      plan,
      attempts,
      summary: checkpointSummary,
    });
    return checkpointSummary;
  };
  const deadlineTimer = setTimeout(() => {
    requestStop("max_runtime");
    browser.close().catch(() => {});
  }, SYNTHETIC_CONFIG.maxRuntimeMs);

  const queueCheckpoint = () => {
    checkpointQueue = checkpointQueue.then(() => persistCheckpoint("running"));
    return checkpointQueue;
  };
  const runWorker = async () => {
    while (true) {
      const executionIndex = nextExecutionIndex;
      nextExecutionIndex += 1;
      if (executionIndex >= plan.length) return;
      const session = plan[executionIndex];
      if (stopState.requested || Date.now() >= deadline) {
        status = stopState.requested ? "interrupted" : "completed_partial";
        return;
      }
      let finalResult;
      for (let attempt = 1; attempt <= SYNTHETIC_CONFIG.retryCount + 1; attempt += 1) {
        const attemptLabel = attempt > 1 ? `（再試行 ${attempt}/${SYNTHETIC_CONFIG.retryCount + 1}）` : "";
        process.stdout.write(
          `[実行中] 現在 ${executionIndex + 1}/${plan.length} セッション目を実行中です。完了済み: ${completedSessions}/${plan.length}${attemptLabel}\n`,
        );
        finalResult = await executeSession(browser, session, runId, attempt, options, stopState);
        attempts.push(finalResult);
        if (finalResult.success || stopState.requested) break;
      }
      completedSessions += 1;
      const label = finalResult.success ? "成功" : "失敗";
      process.stdout.write(
        `[完了] ${executionIndex + 1}/${plan.length} セッション目が${label}しました。完了済み: ${completedSessions}/${plan.length}\n`,
      );
      await queueCheckpoint();
      if (!options.fast && nextExecutionIndex < plan.length && Date.now() < deadline) {
        const random = createSeededRandom(`${runId}-delay-${session.sessionIndex}`);
        await sleep(randomBetween(SYNTHETIC_CONFIG.sessionDelayMs, random));
      }
    }
  };

  try {
    const workerCount = Math.min(options.concurrency, plan.length);
    process.stdout.write(
      `[開始] ブラウザ表示: ${options.headed ? "あり" : "なし"}、並列数: ${workerCount}、計画セッション: ${plan.length}\n`,
    );
    await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
    await checkpointQueue;
  } finally {
    clearTimeout(deadlineTimer);
    await browser.close().catch(() => {});
  }

  if (stopState.reason === "max_runtime") status = "completed_partial";
  else if (stopState.requested) status = "interrupted";

  if (status === "completed") {
    const hasFinalFailure = plan.some((session) => {
      const finalAttempt = [...attempts]
        .reverse()
        .find((attempt) => attempt.sessionIndex === session.sessionIndex);
      return !finalAttempt?.success;
    });
    if (hasFinalFailure) status = "completed_with_failures";
  }
  const endedAt = new Date().toISOString();
  const summary = aggregateResults(plan, attempts, status, startedAt, endedAt);
  const outputDir = await writeReports(SYNTHETIC_CONFIG.outputRoot, runId, {
    runId,
    config: publicConfig,
    plan,
    attempts,
    summary,
  });
  process.stdout.write(`Report: ${outputDir || latestOutputDir}\n`);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (summary.failedSessions > 0) process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
