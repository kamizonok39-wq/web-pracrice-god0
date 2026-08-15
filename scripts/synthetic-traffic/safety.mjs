const FORBIDDEN_REPORT_KEYS = /(?:authorization|cookie|setcookie|headers?|requesturl|fullurl|postdata|requestbody|rawbody|email|password|accesstoken|oauthtoken|privatekey|clientid|sessionid|ipaddress)/i;
const SENSITIVE_VALUE_PATTERNS = Object.freeze([
  /\bBearer\s+[A-Za-z0-9._~+/=-]+/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bAIza[0-9A-Za-z_-]{30,}\b/,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
]);

export function requestPolicy(requestUrl, resourceType, targetUrl) {
  if (resourceType !== "document") return Object.freeze({ action: "continue", reason: "non_document" });
  try {
    const requested = new URL(requestUrl);
    const target = new URL(targetUrl);
    if (requested.origin === target.origin) {
      return Object.freeze({ action: "continue", reason: "allowed_origin" });
    }
    return Object.freeze({ action: "abort", reason: "external_document" });
  } catch {
    return Object.freeze({ action: "abort", reason: "invalid_document_url" });
  }
}

export function safeErrorCode(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (/Execution stop requested/i.test(message)) return "execution_stop_requested";
  if (/GA4 collect not observed/i.test(message)) return "ga4_collect_not_observed";
  if (/duplicate event/i.test(message)) return "duplicate_event_observed";
  if (/event count mismatch/i.test(message)) return "event_count_mismatch";
  if (/CTA did not reach/i.test(message)) return "cta_destination_mismatch";
  if (/Unknown scenario/i.test(message)) return "unknown_scenario";
  if (/timeout/i.test(message)) return "operation_timeout";
  return "operation_failed";
}

export function inspectReportSafety(payload) {
  const violations = [];

  function visit(value, path) {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }
    if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        const normalizedKey = key.replace(/[^a-z0-9]/gi, "");
        const childPath = path ? `${path}.${key}` : key;
        if (FORBIDDEN_REPORT_KEYS.test(normalizedKey)) violations.push(`${childPath}: forbidden key`);
        visit(child, childPath);
      }
      return;
    }
    if (typeof value !== "string") return;
    if (SENSITIVE_VALUE_PATTERNS.some((pattern) => pattern.test(value))) {
      violations.push(`${path}: credential or personal-data shaped value`);
    }
    if (/^https?:\/\//i.test(value) && path !== "config.targetUrl") {
      violations.push(`${path}: complete URL is not allowed`);
    }
  }

  visit(payload, "");
  return Object.freeze([...new Set(violations)]);
}

export function assertSafeReportPayload(payload) {
  const violations = inspectReportSafety(payload);
  if (violations.length) {
    throw new Error(`Unsafe report payload rejected: ${violations.join("; ")}`);
  }
  return payload;
}
