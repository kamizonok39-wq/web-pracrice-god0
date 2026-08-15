import test from "node:test";
import assert from "node:assert/strict";
import { validateSessionEvents } from "../scripts/synthetic-traffic/network.mjs";

function event(observedEvent, pagePath, safeParameters = {}) {
  return { observedEvent, pagePath, safeParameters };
}

function validMixedEvents() {
  return [
    event("page_view", "/"),
    event("page_view", "/products/index.html"),
    event("page_view", "/products/journey-kit.html"),
    event("experiment_impression", "/products/journey-kit.html", { experimentVariant: "a" }),
    event("article_navigation", "/products/journey-kit.html"),
    event("outbound_click", "/articles/event-design.html"),
    event("scroll_depth", "/articles/event-design.html", { percentScrolled: 25 }),
    event("scroll_depth", "/articles/event-design.html", { percentScrolled: 50 }),
    event("cta_click", "/products/journey-kit.html", { experimentVariant: "a" }),
  ];
}

test("シナリオ別の期待イベント件数を受け入れる", () => {
  assert.equal(validateSessionEvents(
    validMixedEvents(),
    { scenarioId: "mixed-deep" },
    true,
  ), true);
});

test("同一操作に由来するイベント件数の不一致を拒否する", () => {
  const events = validMixedEvents().filter((item) => item.observedEvent !== "outbound_click");
  assert.throws(
    () => validateSessionEvents(events, { scenarioId: "mixed-deep" }, true),
    /event count mismatch for outbound_click/,
  );
});

test("同一ページのpage_viewと同一スクロール閾値の重複を拒否する", () => {
  const duplicatePageView = [...validMixedEvents(), event("page_view", "/products/index.html")];
  assert.throws(
    () => validateSessionEvents(duplicatePageView, { scenarioId: "mixed-deep" }, true),
    /duplicate event observed: page_view/,
  );

  const duplicateScroll = [
    ...validMixedEvents(),
    event("scroll_depth", "/articles/event-design.html", { percentScrolled: 50 }),
  ];
  assert.throws(
    () => validateSessionEvents(duplicateScroll, { scenarioId: "mixed-deep" }, true),
    /duplicate event observed: scroll_depth/,
  );
});
