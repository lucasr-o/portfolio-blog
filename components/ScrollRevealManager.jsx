"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const selector = ".reveal-on-scroll";

export default function ScrollRevealManager() {
  const pathname = usePathname();

  useEffect(() => {
    const elements = [...document.querySelectorAll(selector)];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion || !("IntersectionObserver" in window)) {
      document.documentElement.dataset.scrollReveal = "disabled";
      elements.forEach((element) => element.classList.add("is-visible"));
      return undefined;
    }

    document.documentElement.dataset.scrollReveal = "enabled";

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    const activationFrame = window.requestAnimationFrame(() => {
      elements.forEach((element) => {
        element.classList.add("reveal-can-animate");
        observer.observe(element);
      });
    });

    return () => {
      window.cancelAnimationFrame(activationFrame);
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
