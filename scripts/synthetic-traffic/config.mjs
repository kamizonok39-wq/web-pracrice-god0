export const SYNTHETIC_CONFIG = Object.freeze({
  targetUrl: "https://kamizonok39-wq.github.io/web-pracrice-god0/",
  sessionCount: 50,
  defaultConcurrency: 1,
  maxConcurrency: 5,
  operationDelayMs: Object.freeze([1000, 3000]),
  sessionDelayMs: Object.freeze([10000, 20000]),
  maxRuntimeMs: 30 * 60 * 1000,
  retryCount: 1,
  eventWaitMs: 10000,
  navigationTimeoutMs: 20000,
  outputRoot: ".playwright-output/synthetic-traffic",
  utmSource: "playwright_test",
  utmMedium: "synthetic",
});

export const DEVICE_PROFILES = Object.freeze({
  desktop: Object.freeze({
    viewport: Object.freeze({ width: 1440, height: 900 }),
    isMobile: false,
    hasTouch: false,
  }),
  mobile: Object.freeze({
    viewport: Object.freeze({ width: 390, height: 844 }),
    isMobile: true,
    hasTouch: true,
  }),
  tablet: Object.freeze({
    viewport: Object.freeze({ width: 820, height: 1180 }),
    isMobile: true,
    hasTouch: true,
  }),
});

export const ALLOWED_ANALYTICS_HOSTS = Object.freeze([
  "www.google-analytics.com",
  "region1.google-analytics.com",
  "analytics.google.com",
]);
