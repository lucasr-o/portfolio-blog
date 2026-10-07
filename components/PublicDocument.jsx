/* eslint-disable @next/next/no-head-element -- The reveal state must be set before hydration to prevent a visible blur flash. */
import BackgroundGrid from "@/components/ui/BackgroundGrid";
import ScrollRevealManager from "@/components/ScrollRevealManager";

const scrollRevealBootstrap = `
  (() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const supportsObserver = "IntersectionObserver" in window;
    document.documentElement.dataset.scrollReveal = reducedMotion || !supportsObserver
      ? "disabled"
      : "enabled";
  })();
`;

export default function PublicDocument({ children, lang = "en", skipLabel = "Skip to content" }) {
  return (
    <html lang={lang} data-scroll-behavior="smooth" data-scroll-reveal="disabled" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: scrollRevealBootstrap }} /></head>
      <body>
        <BackgroundGrid />
        <ScrollRevealManager />
        <a className="skip-link touch-feedback" href="#main-content">{skipLabel}</a>
        {children}
      </body>
    </html>
  );
}
