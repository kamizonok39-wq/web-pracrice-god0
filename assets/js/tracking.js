(function () {
  "use strict";

  const thresholds = [25, 50, 75, 90, 100];
  const reached = new Set();

  function textOf(element) {
    return (element.dataset.gaText || element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 100);
  }

  function trackMeasuredLink(link) {
    const eventName = link.dataset.gaEvent;

    if (eventName === "cta_click") {
      window.GA4Learning.track("cta_click", {
        cta_id: link.dataset.ctaId,
        cta_text: textOf(link),
        cta_position: link.dataset.ctaPosition,
        destination_path: new URL(link.href, window.location.href).pathname,
        experiment_id: link.dataset.experimentId || "none",
        variant_id: link.dataset.variantId || "none",
      }, "measured CTA activated");
      return;
    }

    if (eventName === "article_navigation") {
      window.GA4Learning.track("article_navigation", {
        source_content_id: link.dataset.sourceContentId,
        destination_article_id: link.dataset.destinationArticleId,
        link_position: link.dataset.linkPosition,
      }, "article link activated");
    }
  }

  function trackOutboundLink(link) {
    if (!/^https?:$/.test(link.protocol) || link.host === window.location.host) return;
    const safeUrl = `${link.protocol}//${link.host}${link.pathname}`;
    window.GA4Learning.track("outbound_click", {
      link_url: safeUrl,
      link_domain: link.hostname,
      link_text: textOf(link),
      link_position: link.dataset.linkPosition || "content",
    }, "cross-host HTTP(S) link activated");
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;
    trackMeasuredLink(link);
    trackOutboundLink(link);
  });

  function checkScrollDepth() {
    const root = document.documentElement;
    const scrollable = Math.max(root.scrollHeight - window.innerHeight, 0);
    const percent = scrollable === 0
      ? 100
      : Math.min(100, Math.round((window.scrollY / scrollable) * 100));

    thresholds.forEach((threshold) => {
      if (percent >= threshold && !reached.has(threshold)) {
        reached.add(threshold);
        window.GA4Learning.track("scroll_depth", {
          percent_scrolled: threshold,
          page_type: document.body.dataset.pageType || "unknown",
        }, `first ${threshold}% scroll-depth reach`);
      }
    });
  }

  let scheduled = false;
  window.addEventListener("scroll", () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      checkScrollDepth();
      scheduled = false;
    });
  }, { passive: true });

  document.addEventListener("DOMContentLoaded", checkScrollDepth);
}());
