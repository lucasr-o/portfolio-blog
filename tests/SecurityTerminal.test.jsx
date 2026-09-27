import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SecurityTerminal from "@/components/SecurityTerminal";
import { terminalSteps } from "@/data/profile";

describe("SecurityTerminal", () => {
  it("renders the completed transcript when enhancement is unavailable", () => {
    const { container } = render(<SecurityTerminal steps={terminalSteps} />);
    expect(container).toHaveTextContent("nmap -sV --script http-title app.test");
    expect(container).toHaveTextContent("does not appear to be injectable");
    expect(container).toHaveTextContent("0 findings");
    expect(screen.getByText(/Decorative security terminal/)).toHaveClass("visually-hidden");
    expect(screen.getByText("lucas@security — zsh")).toBeInTheDocument();
    expect(screen.getByTestId("macos-window-controls").children).toHaveLength(3);
    expect(container.querySelector("button, input, textarea")).toBeNull();
  });

  it("renders the completed transcript immediately for reduced motion", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    const { container } = render(<SecurityTerminal steps={terminalSteps} />);
    expect(container).toHaveTextContent("semgrep scan --config auto src/");
  });

  it("runs the visual sequence once after entering the viewport", () => {
    vi.useFakeTimers();
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    let callback;
    const disconnect = vi.fn();
    window.IntersectionObserver = class IntersectionObserverMock {
      constructor(observerCallback) {
        callback = observerCallback;
      }

      observe = vi.fn();
      disconnect = disconnect;
    };

    const { container } = render(<SecurityTerminal steps={terminalSteps} />);
    act(() => callback([{ isIntersecting: true }]));
    act(() => vi.runAllTimers());

    expect(screen.getByTestId("animated-terminal-transcript")).toHaveTextContent("0 findings");
    expect(disconnect).toHaveBeenCalled();
  });
});
