import test from "node:test";
import assert from "node:assert/strict";
import { SYNTHETIC_CONFIG } from "../scripts/synthetic-traffic/config.mjs";
import { requestPolicy } from "../scripts/synthetic-traffic/safety.mjs";

test("管理対象オリジンのDocumentを許可する", () => {
  assert.deepEqual(
    requestPolicy(`${SYNTHETIC_CONFIG.targetUrl}products/index.html`, "document", SYNTHETIC_CONFIG.targetUrl),
    { action: "continue", reason: "allowed_origin" },
  );
});

test("対象外オリジンと不正URLのDocumentを拒否する", () => {
  assert.deepEqual(
    requestPolicy("https://example.com/redirect", "document", SYNTHETIC_CONFIG.targetUrl),
    { action: "abort", reason: "external_document" },
  );
  assert.deepEqual(
    requestPolicy("not a url", "document", SYNTHETIC_CONFIG.targetUrl),
    { action: "abort", reason: "invalid_document_url" },
  );
});

test("GA4 collectを含む非Document通信は許可する", () => {
  assert.deepEqual(
    requestPolicy("https://www.google-analytics.com/g/collect", "fetch", SYNTHETIC_CONFIG.targetUrl),
    { action: "continue", reason: "non_document" },
  );
});
