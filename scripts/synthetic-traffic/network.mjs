import { ALLOWED_ANALYTICS_HOSTS } from "./config.mjs";

function safeParameters(parameters) {
  const percent = parameters.get("epn.percent_scrolled")
    || parameters.get("ep.percent_scrolled")
    || parameters.get("percent_scrolled");
  const variant = parameters.get("ep.variant_id")
    || parameters.get("variant_id");
  const result = {};
  if (percent && /^\d{1,3}$/.test(percent)) result.percentScrolled = Number(percent);
  if (variant === "a" || variant === "b") result.experimentVariant = variant;
  return result;
}

export function parseCollectRecords(request) {
  const records = [];
  try {
    const parsed = new URL(request.url());
    const fromUrl = parsed.searchParams.get("en") || parsed.searchParams.get("event_name");
    if (fromUrl) records.push({ eventName: fromUrl, safeParameters: safeParameters(parsed.searchParams) });
  } catch {}
  const postData = request.postData();
  if (postData) {
    for (const line of postData.split("\n")) {
      const parameters = new URLSearchParams(line);
      const fromBody = parameters.get("en") || parameters.get("event_name");
      if (fromBody) records.push({ eventName: fromBody, safeParameters: safeParameters(parameters) });
    }
  }
  if (!records.length) return [{ eventName: "unknown", safeParameters: {} }];
  return records.filter((record, index) => records.findIndex((candidate) =>
    candidate.eventName === record.eventName
    && JSON.stringify(candidate.safeParameters) === JSON.stringify(record.safeParameters)
  ) === index);
}

export function isAnalyticsCollect(url) {
  try {
    const parsed = new URL(url);
    return ALLOWED_ANALYTICS_HOSTS.includes(parsed.hostname) && /\/collect$/.test(parsed.pathname);
  } catch {
    return false;
  }
}

export function createNetworkObserver(context, session) {
  const events = [];
  const pending = new Map();

  context.on("request", (request) => {
    if (!isAnalyticsCollect(request.url())) return;
    const records = parseCollectRecords(request).map(({ eventName, safeParameters: parameters }) => ({
        sessionIndex: session.sessionIndex,
        observedAt: new Date().toISOString(),
        pagePath: (() => {
          try {
            return new URL(request.frame().url()).pathname;
          } catch {
            return "unknown";
          }
        })(),
        observedEvent: eventName,
        safeParameters: parameters,
        status: "sent",
        variant: session.variant,
        scenarioId: session.scenarioId,
      }));
    events.push(...records);
    pending.set(request, records);
  });

  context.on("response", (response) => {
    const records = pending.get(response.request());
    if (records) records.forEach((record) => { record.status = response.status(); });
  });

  context.on("requestfailed", (request) => {
    const records = pending.get(request);
    if (records) records.forEach((record) => {
      record.status = "failed";
      record.failureCode = "request_failed";
    });
  });

  return {
    events,
    hasEvent(eventName) {
      return events.some((event) => event.observedEvent === eventName);
    },
    countEvent(eventName) {
      return events.filter((event) => event.observedEvent === eventName).length;
    },
  };
}

export async function waitForObservedEvent(observer, eventName, timeoutMs) {
  return waitForEventCount(observer, eventName, 1, timeoutMs);
}

export async function waitForEventCount(observer, eventName, minimumCount, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (observer.countEvent(eventName) >= minimumCount) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`GA4 collect not observed for ${eventName} count ${minimumCount}`);
}

export function validateSessionEvents(events, session, ctaClicked) {
  const count = (eventName) => events.filter((event) => event.observedEvent === eventName).length;
  const expectedExact = {
    experiment_impression: 1,
    cta_click: ctaClicked ? 1 : 0,
    article_navigation: session.scenarioId === "product-short"
      ? 0
      : session.scenarioId === "article-focused" ? 2 : 1,
    outbound_click: session.scenarioId === "mixed-deep" ? 1 : 0,
  };
  for (const [eventName, expected] of Object.entries(expectedExact)) {
    const actual = count(eventName);
    if (actual !== expected) {
      throw new Error(`GA4 event count mismatch for ${eventName}: expected ${expected}, actual ${actual}`);
    }
  }
  if (count("page_view") < 1) throw new Error("GA4 event count mismatch for page_view: expected at least 1");
  if (count("scroll_depth") < 1) throw new Error("GA4 event count mismatch for scroll_depth: expected at least 1");

  const uniqueKeys = new Set();
  for (const event of events) {
    if (!['page_view', 'scroll_depth'].includes(event.observedEvent)) continue;
    const detail = event.observedEvent === "scroll_depth"
      ? event.safeParameters?.percentScrolled ?? "unknown"
      : "page";
    const key = `${event.observedEvent}|${event.pagePath}|${detail}`;
    if (uniqueKeys.has(key)) throw new Error(`GA4 duplicate event observed: ${key}`);
    uniqueKeys.add(key);
  }
  return true;
}
