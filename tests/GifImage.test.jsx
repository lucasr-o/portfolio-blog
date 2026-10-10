import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import GifImage from "../packages/blog-ui/GifImage.jsx";

const image = {
  url: "/media/posts/example.gif",
  posterUrl: "/media/posts/example.png",
  width: 320,
  height: 180,
};

describe("animated article media", () => {
  it("shows a still poster first, allows keyboard-operable playback and stops when reduced motion is requested", async () => {
    let onChange;
    const removeEventListener = vi.fn();
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
      addEventListener: (_type, callback) => { onChange = callback; },
      removeEventListener,
    });
    render(<GifImage image={image} alt="Pepe" />);
    const rendered = screen.getByRole("img", { name: "Pepe" });
    const button = screen.getByRole("button", { name: "Play animation" });
    expect(rendered).toHaveAttribute("src", image.posterUrl);
    expect(rendered).toHaveAttribute("width", "320");
    expect(rendered).toHaveAttribute("height", "180");
    expect(rendered).toHaveAttribute("loading", "lazy");
    await userEvent.setup().keyboard("{Tab}{Enter}");
    expect(button).toHaveFocus();
    expect(rendered).toHaveAttribute("src", image.url);
    expect(screen.getByRole("button", { name: "Pause animation" })).toHaveAttribute("aria-pressed", "true");
    act(() => onChange({ matches: true }));
    expect(rendered).toHaveAttribute("src", image.posterUrl);
    expect(screen.getByRole("button", { name: "Play animation" })).toHaveAttribute("aria-pressed", "false");
    expect(removeEventListener).not.toHaveBeenCalled();
  });

  it("keeps Portuguese controls understandable with reduced motion already enabled", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    });
    render(<GifImage image={image} alt="Pepe" locale="pt-BR" />);
    expect(screen.getByRole("img", { name: "Pepe" })).toHaveAttribute("src", image.posterUrl);
    expect(screen.getByRole("button", { name: "Reproduzir animação" })).toBeVisible();
  });
});
