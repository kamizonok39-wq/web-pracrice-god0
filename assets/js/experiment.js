(function () {
  "use strict";

  const experimentId = "product-detail-primary-cta-v1";
  const storageKey = `experiment:${experimentId}`;

  function requestedVariant() {
    const candidate = new URLSearchParams(window.location.search).get("variant");
    return candidate === "a" || candidate === "b" ? candidate : null;
  }

  function chooseVariant() {
    const forced = requestedVariant();
    if (forced) {
      window.sessionStorage.setItem(storageKey, forced);
      return forced;
    }

    const stored = window.sessionStorage.getItem(storageKey);
    if (stored === "a" || stored === "b") return stored;

    const selected = Math.random() < 0.5 ? "a" : "b";
    window.sessionStorage.setItem(storageKey, selected);
    return selected;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const experiments = [...document.querySelectorAll(`[data-experiment="${experimentId}"]`)];
    if (!experiments.length) return;

    const variant = chooseVariant();
    document.documentElement.dataset.experimentVariant = variant;

    experiments.forEach((experiment) => {
      experiment.querySelectorAll("[data-experiment-variant]").forEach((element) => {
        const active = element.dataset.experimentVariant === variant;
        element.hidden = !active;
        if (active) {
          const cta = element.querySelector("[data-ga-event='cta_click']");
          if (cta) cta.dataset.variantId = variant;
        }
      });
    });

    let impressionSent = false;
    function sendImpression() {
      if (impressionSent || window.GA4Learning.getConsent() !== "granted") return;
      const cta = [...document.querySelectorAll(
        `[data-experiment="${experimentId}"] [data-experiment-variant="${variant}"]:not([hidden])`,
      )]
        .map((element) => element.querySelector("[data-ga-event='cta_click']"))
        .find(Boolean);
      if (!cta) return;
      impressionSent = true;
      window.GA4Learning.track("experiment_impression", {
        experiment_id: experimentId,
        variant_id: variant,
        cta_id: cta.dataset.ctaId,
        cta_position: cta.dataset.ctaPosition,
      }, "experiment CTA became available");
    }

    sendImpression();
    document.addEventListener("ga4-consent-granted", sendImpression, { once: true });
  });
}());
