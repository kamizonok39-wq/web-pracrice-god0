import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSessionPlan,
  createRunId,
  selectDryRunPlan,
  summarizePlan,
  validateRunId,
} from "../scripts/synthetic-traffic/plan.mjs";

test("50セッションの配分が仕様と一致する", () => {
  const plan = buildSessionPlan("pw-20260805T120000Z-test01");
  assert.deepEqual(summarizePlan(plan), {
    sessions: 50,
    variants: { a: 25, b: 25 },
    scenarios: { "article-focused": 25, "mixed-deep": 17, "product-short": 8 },
    scrollDepths: { 25: 5, 50: 5, 75: 10, 90: 5, 100: 25 },
    devices: { desktop: 25, mobile: 20, tablet: 5 },
    plannedClicks: summarizePlan(plan).plannedClicks,
  });
});

test("同じrun_idから同じ計画を再現する", () => {
  const first = buildSessionPlan("pw-20260805T120000Z-repeat");
  const second = buildSessionPlan("pw-20260805T120000Z-repeat");
  assert.deepEqual(first, second);
});

test("3件dry-runは3種類の行動を含む", () => {
  const plan = buildSessionPlan("pw-20260805T120000Z-dryrun");
  const dryRun = selectDryRunPlan(plan, 3);
  assert.deepEqual(new Set(dryRun.map((item) => item.scenarioId)), new Set([
    "product-short",
    "article-focused",
    "mixed-deep",
  ]));
});

test("run_idはURL安全な形式だけを許可する", () => {
  assert.equal(validateRunId("pw-safe_123-test"), "pw-safe_123-test");
  assert.throws(() => validateRunId("unsafe/token"));
  assert.match(createRunId(new Date("2026-08-05T12:00:00Z"), "a1b2c3"), /^pw-[A-Za-z0-9_-]+$/);
});
