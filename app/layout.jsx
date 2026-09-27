import "./globals.css";
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

export const metadata = {
  metadataBase: new URL("https://lucas-reis.com"),
  title: {
    default: "Lucas Reis — Application Security Engineer",
    template: "%s | Lucas Reis",
  },
  description:
    "Application security, threat modeling, penetration testing, and practical security engineering notes by Lucas Reis.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      data-scroll-reveal="disabled"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: scrollRevealBootstrap }} />
      </head>
      <body>
        <BackgroundGrid />
        <ScrollRevealManager />
        <a className="skip-link touch-feedback" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
