(function () {
  "use strict";

  const config = window.GA4_CONFIG || { measurementId: "", debug: true };
  const consentKey = "ga4-learning-consent";
  let tagPromise = null;
  let pageViewSent = false;

  /**
   * Central event contract.
   * Each key is the exact GA4 event name; `condition` explains when it fires.
   */
  const EVENT_CONTRACT = Object.freeze({
    page_view: {
      condition: "Once per page display after analytics consent",
      required: ["page_title", "page_location", "page_path", "page_type"],
    },
    cta_click: {
      condition: "A link or button with data-ga-event=cta_click is activated",
      required: [
        "cta_id",
        "cta_text",
        "cta_position",
        "destination_path",
        "experiment_id",
        "variant_id",
      ],
    },
    article_navigation: {
      condition: "A measured link opens an article detail page",
      required: ["source_content_id", "destination_article_id", "link_position"],
    },
    outbound_click: {
      condition: "An HTTP(S) link points to a different host",
      required: ["link_url", "link_domain", "link_text", "link_position"],
    },
    scroll_depth: {
      condition: "The page first reaches 25, 50, 75, 90, or 100 percent",
      required: ["percent_scrolled", "page_type"],
    },
    experiment_impression: {
      condition: "An experiment CTA becomes available to a consented visitor",
      required: ["experiment_id", "variant_id", "cta_id", "cta_position"],
    },
  });

  const prohibitedKey = /(email|e-mail|phone|tel|name|address|user_?id|message|comment|query|search)/i;
  const looksLikeEmail = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const looksLikePhone = /(?:\+?\d[\s().-]*){8,}/;

  function getConsent() {
    return window.localStorage.getItem(consentKey) || "denied";
  }

  function isMeasurementIdValid() {
    return /^G-[A-Z0-9]{6,}$/i.test(config.measurementId)
      && config.measurementId !== "G-XXXXXXXXXX";
  }

  function gtag() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(arguments);
  }

  window.dataLayer = window.dataLayer || [];
  gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });

  function updateConsentUI() {
    const granted = getConsent() === "granted";
    document.querySelectorAll("[data-consent-status]").forEach((element) => {
      element.textContent = granted ? "解析：有効" : "解析：無効";
    });
    document.querySelectorAll('[data-analytics-consent="grant"]').forEach((button) => {
      button.setAttribute("aria-pressed", String(granted));
    });
    document.querySelectorAll('[data-analytics-consent="deny"]').forEach((button) => {
      button.setAttribute("aria-pressed", String(!granted));
    });
  }

  function loadGoogleTag() {
    if (!isMeasurementIdValid()) {
      if (config.debug) {
        console.info("[GA4 learning] Measurement ID is not configured; no GA4 request was made.");
      }
      return Promise.resolve(false);
    }

    if (tagPromise) return tagPromise;

    tagPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.measurementId)}`;
      script.addEventListener("load", () => {
        gtag("js", new Date());
        gtag("consent", "update", { analytics_storage: "granted" });
        const configParameters = { send_page_view: false };
        if (config.debug) configParameters.debug_mode = true;
        gtag("config", config.measurementId, configParameters);
        resolve(true);
      });
      script.addEventListener("error", () => {
        console.warn("[GA4 learning] Google tag was blocked or failed to load. Site navigation remains available.");
        resolve(false);
      });
      document.head.appendChild(script);
    });

    return tagPromise;
  }

  function validatePayload(eventName, parameters) {
    const contract = EVENT_CONTRACT[eventName];
    if (!contract) throw new Error(`Unknown analytics event: ${eventName}`);

    const missing = contract.required.filter((key) => parameters[key] === undefined || parameters[key] === "");
    if (missing.length) throw new Error(`${eventName} is missing: ${missing.join(", ")}`);

    Object.entries(parameters).forEach(([key, value]) => {
      if (prohibitedKey.test(key)) throw new Error(`Prohibited personal-data key: ${key}`);
      const text = String(value);
      if (looksLikeEmail.test(text) || looksLikePhone.test(text)) {
        throw new Error(`Possible personal data rejected from ${eventName}.${key}`);
      }
    });
  }

  async function track(eventName, parameters, reason) {
    const payload = { ...parameters, transport_type: "beacon" };

    try {
      validatePayload(eventName, parameters);
    } catch (error) {
      console.error("[GA4 learning] Event rejected:", error.message);
      return false;
    }

    if (config.debug) {
      console.groupCollapsed(`[GA4 learning] ${eventName} — ${reason}`);
      console.table(parameters);
      console.info("Condition:", EVENT_CONTRACT[eventName].condition);
      console.groupEnd();
    }

    if (getConsent() !== "granted") return false;
    const loaded = await loadGoogleTag();
    if (!loaded) return false;
    gtag("event", eventName, payload);
    return true;
  }

  function sendPageView() {
    if (pageViewSent || getConsent() !== "granted") return;
    pageViewSent = true;
    const safeLocation = `${window.location.origin}${window.location.pathname}`;
    track("page_view", {
      page_title: document.title,
      page_location: safeLocation,
      page_path: window.location.pathname,
      page_type: document.body.dataset.pageType || "unknown",
    }, "page displayed after analytics consent");
  }

  async function setConsent(nextState) {
    window.localStorage.setItem(consentKey, nextState);
    updateConsentUI();

    if (nextState === "granted") {
      gtag("consent", "update", { analytics_storage: "granted" });
      await loadGoogleTag();
      sendPageView();
      document.dispatchEvent(new CustomEvent("ga4-consent-granted"));
    } else {
      gtag("consent", "update", { analytics_storage: "denied" });
    }
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-analytics-consent]");
    if (!button) return;
    setConsent(button.dataset.analyticsConsent === "grant" ? "granted" : "denied");
  });

  window.GA4Learning = Object.freeze({
    EVENT_CONTRACT,
    getConsent,
    isMeasurementIdValid,
    setConsent,
    track,
  });

  document.addEventListener("DOMContentLoaded", () => {
    updateConsentUI();
    if (getConsent() === "granted") {
      loadGoogleTag().then(sendPageView);
    }
  });
}());
