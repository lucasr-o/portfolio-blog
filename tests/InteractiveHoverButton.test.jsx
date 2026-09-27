import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

describe("InteractiveHoverButton", () => {
  it("keeps navigation controls as accessible links", () => {
    render(<InteractiveHoverButton href="/#contact" text="Contact" />);

    const link = screen.getByRole("link", { name: "Contact" });
    expect(link).toHaveAttribute("href", "/#contact");
    expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("falls back to a native button outside navigation", () => {
    render(<InteractiveHoverButton text="Send" />);

    expect(screen.getByRole("button", { name: "Send" })).toHaveAttribute("type", "button");
  });
});
