import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BackgroundGrid from "@/components/ui/BackgroundGrid";

describe("BackgroundGrid", () => {
  it("stays decorative and hidden from the accessibility tree", () => {
    const { container } = render(<BackgroundGrid />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});
