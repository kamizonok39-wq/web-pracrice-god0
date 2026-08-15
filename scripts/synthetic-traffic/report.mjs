import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { assertSafeReportPayload } from "./safety.mjs";

function rate(clicks, impressions) {
  return impressions ? `${((clicks / impressions) * 100).toFixed(1)}%` : "n/a";
}

export function aggregateResults(plan, attempts, status, startedAt, endedAt) {
  const finalAttempts = plan.map((session) =>
    [...attempts].reverse().find((attempt) => attempt.sessionIndex === session.sessionIndex),
  ).filter(Boolean);
  const completed = finalAttempts.filter((attempt) => attempt.success);
  const variants = Object.fromEntries(["a", "b"].map((variant) => {
    const group = completed.filter((attempt) => attempt.variant === variant);
    const clicks = group.filter((attempt) => attempt.ctaClicked).length;
    return [variant, { impressions: group.length, clicks, clickRate: rate(clicks, group.length) }];
  }));
  const observedEvents = attempts.flatMap((attempt) => attempt.events || []).reduce((counts, event) => {
    counts[event.observedEvent] = (counts[event.observedEvent] || 0) + 1;
    return counts;
  }, {});

  return {
    status,
    startedAt,
    endedAt,
    durationSeconds: Math.round((new Date(endedAt) - new Date(startedAt)) / 1000),
    plannedSessions: plan.length,
    completedSessions: completed.length,
    failedSessions: finalAttempts.filter((attempt) => !attempt.success).length,
    remainingSessions: plan.length - finalAttempts.length,
    retryAttempts: attempts.filter((attempt) => attempt.attempt > 1).length,
    variants,
    observedEvents,
    externalDocumentsBlocked: attempts.reduce(
      (total, attempt) => total + (attempt.externalDocumentsBlocked || 0),
      0,
    ),
  };
}

function toMarkdown(runId, summary) {
  const lines = [
    "# Playwright合成アクセス実行結果",
    "",
    `- run_id: \`${runId}\``,
    `- 状態: ${summary.status}`,
    `- 開始: ${summary.startedAt}`,
    `- 終了: ${summary.endedAt}`,
    `- 所要時間: ${summary.durationSeconds}秒`,
    `- 計画セッション: ${summary.plannedSessions}`,
    `- 完了セッション: ${summary.completedSessions}`,
    `- 失敗セッション: ${summary.failedSessions}`,
    `- 未開始セッション: ${summary.remainingSessions}`,
    `- 再試行: ${summary.retryAttempts}`,
    `- 外部Document遮断: ${summary.externalDocumentsBlocked}`,
    "",
    "## CTA A/B",
    "",
    "| Variant | Impression | Click | Click rate |",
    "|---|---:|---:|---:|",
    `| A | ${summary.variants.a.impressions} | ${summary.variants.a.clicks} | ${summary.variants.a.clickRate} |`,
    `| B | ${summary.variants.b.impressions} | ${summary.variants.b.clicks} | ${summary.variants.b.clickRate} |`,
    "",
    "## 観測イベント",
    "",
  ];
  for (const [eventName, count] of Object.entries(summary.observedEvents).sort()) {
    lines.push(`- \`${eventName}\`: ${count}`);
  }
  return `${lines.join("\n")}\n`;
}

export async function writeReports(outputRoot, runId, payload) {
  assertSafeReportPayload(payload);
  const outputDir = join(outputRoot, runId);
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, "results.json"), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await writeFile(join(outputDir, "summary.md"), toMarkdown(runId, payload.summary), "utf8");
  return outputDir;
}
