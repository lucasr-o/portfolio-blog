import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SiteHeader from "@/components/SiteHeader";

describe("SiteHeader", () => {
  it("exposes the requested top-bar destinations", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "lucas-reis — home" })).toHaveAttribute("href", "/#main-content");
    expect(screen.getByRole("link", { name: "Work" })).toHaveAttribute("href", "/#work");
    expect(screen.getByRole("link", { name: "Blog" })).toHaveAttribute("href", "/blog");
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/#about");
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/#contact");
  });

  it("keeps slash separators out of accessible link names", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Work \/ Blog/ })).not.toBeInTheDocument();
  });

  it("renders the supplied logo as a decorative part of the named home link", () => {
    const { container } = render(<SiteHeader />);
    const logo = container.querySelector('img[src="/lucas-reis-logo.svg"]');

    expect(logo).toHaveAttribute("alt", "");
    expect(logo).toHaveAttribute("aria-hidden", "true");
  });
});
