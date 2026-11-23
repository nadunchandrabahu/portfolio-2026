"use client";

import { useEffect } from "react";

/**
 * Adds `data-revealed` to `[data-reveal]` elements as they scroll into view.
 * The hidden-until-revealed CSS only applies once <html data-reveal-ready> is
 * set here, so content is visible without JS and under reduced motion.
 */
export function RevealObserver() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const reveal = (el: Element) => el.setAttribute("data-revealed", "");

    if (reduced || !("IntersectionObserver" in window)) {
      elements.forEach(reveal);
      return;
    }

    // Anything already on screen stays visible: no flash on load.
    const viewport = window.innerHeight;
    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      if (rect.top < viewport && rect.bottom > 0) reveal(el);
    }
    document.documentElement.setAttribute("data-reveal-ready", "");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal(entry.target);
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    elements.filter((el) => !el.hasAttribute("data-revealed")).forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      document.documentElement.removeAttribute("data-reveal-ready");
    };
  }, []);

  return null;
}
