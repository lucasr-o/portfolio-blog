import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Markdown, { safeLink } from "@portfolio/blog-ui/Markdown";
import Article from "@portfolio/blog-ui/Article";

describe("shared article rendering", () => {
  it("renders semantic Markdown without executing embedded HTML or unsafe links", () => {
    const body = '# Heading\n\n- Item\n\n> Quote\n\n| Col |\n| --- |\n| Cell |\n\n[safe](https://example.com) [bad](javascript:alert%281%29)\n\n<script>alert(1)</script>\n<iframe src="https://evil.test"></iframe>\n\n```html\n<script>example only</script>\n```';
    const { container } = render(<Markdown body={body} />);
    expect(screen.getByRole("heading", { level: 2, name: "Heading" })).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "safe" })).toHaveAttribute("href", "https://example.com");
    expect(screen.queryByRole("link", { name: "bad" })).not.toBeInTheDocument();
    expect(container.querySelector("script,iframe")).toBeNull();
    expect(container.querySelector("pre code")).toHaveTextContent("<script>example only</script>");
  });
  it.each(["javascript:alert(1)", "data:text/html,x", "//evil.test", "\\evil.test", "java\nscript:x", "https://example.com/%0ax"])("rejects unsafe URL %s", (url) => {
    expect(safeLink(url)).toBe("");
  });
  it("only resolves images in the trusted manifest, preserving alt text and dimensions", () => {
    const { container } = render(<Markdown body="![Diagram](/media/diagram.png) ![Remote](https://example.com/a.png)" media={{ "/media/diagram.png": { url: "/media/posts/hash.png", width: 100, height: 50 } }} />);
    const image = screen.getByRole("img", { name: "Diagram" });
    expect(image).toHaveAttribute("width", "100");
    expect(image).toHaveAttribute("height", "50");
    expect(image).toHaveAttribute("src", "/media/posts/hash.png");
    expect(container.querySelectorAll("img")).toHaveLength(1);
  });
  it("does not impose a placeholder label or reveal motion on real articles", () => {
    const { container } = render(<Article post={{ title: "Real article", summary: "Summary", author: "Lucas", tags: [], body: "Text", readingTime: "1 min read", isPlaceholder: false }} />);
    expect(screen.queryByText("Placeholder article")).not.toBeInTheDocument();
    expect(container.querySelector('[class*="reveal"]')).toBeNull();
  });
});
