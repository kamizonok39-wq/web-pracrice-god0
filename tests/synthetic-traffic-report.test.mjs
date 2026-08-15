import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { assertSafeReportPayload, inspectReportSafety } from "../scripts/synthetic-traffic/safety.mjs";
import { writeReports } from "../scripts/synthetic-traffic/report.mjs";

function safePayload() {
  return {
    runId: "pw-report-test",
    config: { targetUrl: "https://kamizonok39-wq.github.io/web-pracrice-god0/" },
    plan: [],
    attempts: [],
    summary: {
      status: "completed",
      startedAt: "2026-08-15T00:00:00.000Z",
      endedAt: "2026-08-15T00:00:01.000Z",
      durationSeconds: 1,
      plannedSessions: 0,
      completedSessions: 0,
      failedSessions: 0,
      remainingSessions: 0,
      retryAttempts: 0,
      externalDocumentsBlocked: 0,
      variants: {
        a: { impressions: 0, clicks: 0, clickRate: "n/a" },
        b: { impressions: 0, clicks: 0, clickRate: "n/a" },
      },
      observedEvents: {},
    },
  };
}

test("安全な許可フィールドだけのレポートを保存する", async () => {
  const root = await mkdtemp(join(tmpdir(), "measure-garden-report-"));
  try {
    const payload = safePayload();
    const output = await writeReports(root, payload.runId, payload);
    const json = await readFile(join(output, "results.json"), "utf8");
    const markdown = await readFile(join(output, "summary.md"), "utf8");
    assert.equal(JSON.parse(json).runId, payload.runId);
    assert.match(markdown, /Playwright合成アクセス実行結果/);
    assert.deepEqual(inspectReportSafety(JSON.parse(json)), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("認証情報・個人情報・Network生データを拒否する", () => {
  for (const unsafe of [
    { authorization: "Bearer TEST_SECRET_VALUE" },
    { cookie: "session=TEST_COOKIE" },
    { email: "test@example.com" },
    { requestUrl: "https://example.com/path?token=TEST_TOKEN" },
    { postData: "raw-network-body" },
  ]) {
    assert.throws(() => assertSafeReportPayload({ ...safePayload(), unsafe }), /Unsafe report payload rejected/);
  }
});
