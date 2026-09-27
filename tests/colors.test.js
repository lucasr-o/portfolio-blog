import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");

function colorVariable(name) {
  return css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1];
}

function luminance(hex) {
  const rgb = hex.slice(1).match(/.{2}/g).map((channel) => Number.parseInt(channel, 16) / 255);
  const linear = rgb.map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((left, right) => right - left);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe("color tokens", () => {
  const surface = colorVariable("color-surface");

  it.each([
    ["primary text", colorVariable("color-text"), 4.5],
    ["muted text", colorVariable("color-text-muted"), 4.5],
    ["tertiary links", colorVariable("color-tertiary"), 4.5],
    ["focus indicator", colorVariable("color-focus"), 3],
  ])("keeps %s at the required contrast", (_label, foreground, minimum) => {
    expect(contrast(foreground, surface)).toBeGreaterThanOrEqual(minimum);
  });

  it("keeps terminal text readable", () => {
    expect(contrast(colorVariable("color-terminal-text"), colorVariable("color-terminal"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colorVariable("color-terminal-muted"), colorVariable("color-terminal"))).toBeGreaterThanOrEqual(4.5);
  });
});
