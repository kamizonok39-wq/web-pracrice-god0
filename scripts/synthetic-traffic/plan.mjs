import { createHash, randomBytes } from "node:crypto";

const DISTRIBUTIONS = Object.freeze({
  variant: Object.freeze({ a: 25, b: 25 }),
  scenario: Object.freeze({
    "product-short": 8,
    "article-focused": 25,
    "mixed-deep": 17,
  }),
  maxScrollDepth: Object.freeze({ 25: 5, 50: 5, 75: 10, 90: 5, 100: 25 }),
  device: Object.freeze({ desktop: 25, mobile: 20, tablet: 5 }),
});

function hashSeed(value) {
  return createHash("sha256").update(value).digest().readUInt32LE(0);
}

export function createSeededRandom(seedText) {
  let state = hashSeed(seedText) || 0x6d2b79f5;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function expandDistribution(distribution) {
  return Object.entries(distribution).flatMap(([value, count]) =>
    Array.from({ length: count }, () => value),
  );
}

function shuffle(values, random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function createRunId(now = new Date(), suffix = randomBytes(3).toString("hex")) {
  const timestamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return `pw-${timestamp}-${suffix}`;
}

export function validateRunId(runId) {
  if (!/^pw-[A-Za-z0-9_-]+$/.test(runId)) {
    throw new Error("run_id must start with pw- and contain only URL-safe characters");
  }
  return runId;
}

export function buildSessionPlan(runId) {
  validateRunId(runId);
  const random = createSeededRandom(runId);
  const variants = shuffle(expandDistribution(DISTRIBUTIONS.variant), random);
  const scenarios = shuffle(expandDistribution(DISTRIBUTIONS.scenario), random);
  const scrollDepths = shuffle(expandDistribution(DISTRIBUTIONS.maxScrollDepth), random);
  const devices = shuffle(expandDistribution(DISTRIBUTIONS.device), random);

  const plan = Array.from({ length: 50 }, (_, index) => {
    const variant = variants[index];
    const clickProbability = variant === "a" ? 0.7 : 0.3;
    return Object.freeze({
      sessionIndex: index + 1,
      variant,
      clickProbability,
      shouldClickCta: random() < clickProbability,
      scenarioId: scenarios[index],
      maxScrollDepth: Number(scrollDepths[index]),
      device: devices[index],
    });
  });
  return Object.freeze(plan);
}

export function selectDryRunPlan(plan, count) {
  if (count >= plan.length) return plan;
  if (count <= 0) throw new Error("sessions must be greater than zero");
  if (count === 1) return [plan[0]];

  const selected = [];
  const usedIndexes = new Set();
  const wantedScenarios = ["product-short", "article-focused", "mixed-deep"];
  for (const scenarioId of wantedScenarios) {
    const index = plan.findIndex(
      (item, itemIndex) => item.scenarioId === scenarioId && !usedIndexes.has(itemIndex),
    );
    if (index >= 0 && selected.length < count) {
      selected.push(plan[index]);
      usedIndexes.add(index);
    }
  }
  for (let index = 0; selected.length < count && index < plan.length; index += 1) {
    if (!usedIndexes.has(index)) selected.push(plan[index]);
  }
  return selected.map((item, index) => Object.freeze({ ...item, executionIndex: index + 1 }));
}

export function summarizePlan(plan) {
  const countBy = (key) =>
    plan.reduce((counts, item) => {
      const value = String(item[key]);
      counts[value] = (counts[value] || 0) + 1;
      return counts;
    }, {});
  return {
    sessions: plan.length,
    variants: countBy("variant"),
    scenarios: countBy("scenarioId"),
    scrollDepths: countBy("maxScrollDepth"),
    devices: countBy("device"),
    plannedClicks: {
      a: plan.filter((item) => item.variant === "a" && item.shouldClickCta).length,
      b: plan.filter((item) => item.variant === "b" && item.shouldClickCta).length,
    },
  };
}

export { DISTRIBUTIONS };
