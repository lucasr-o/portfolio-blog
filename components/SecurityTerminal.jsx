"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./SecurityTerminal.module.css";

const TYPE_INTERVAL = 22;
const OUTPUT_PAUSE = 280;
const STEP_PAUSE = 420;

function TerminalPrompt() {
  return (
    <span className={styles.prompt}>
      <span className={styles.promptUser}>lucas@security</span>{" "}
      <span className={styles.promptPath}>~</span>{" "}
      <span className={styles.promptSymbol}>%</span>
    </span>
  );
}

export default function SecurityTerminal({ steps }) {
  const terminalRef = useRef(null);
  const timersRef = useRef([]);
  const startedRef = useRef(false);
  const [playback, setPlayback] = useState({ completedSteps: 0, currentCommand: "", done: false });

  useEffect(() => {
    const clearTimers = () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };
    const queue = (callback, delay) => {
      const timer = window.setTimeout(callback, delay);
      timersRef.current.push(timer);
    };
    const typeStep = (stepIndex, characterIndex = 0) => {
      const step = steps[stepIndex];
      if (!step) {
        setPlayback({ completedSteps: steps.length, currentCommand: "", done: true });
        return;
      }
      if (characterIndex <= step.command.length) {
        setPlayback({ completedSteps: stepIndex, currentCommand: step.command.slice(0, characterIndex), done: false });
        queue(() => typeStep(stepIndex, characterIndex + 1), TYPE_INTERVAL);
        return;
      }
      queue(() => {
        setPlayback({ completedSteps: stepIndex + 1, currentCommand: "", done: false });
        queue(() => typeStep(stepIndex + 1), STEP_PAUSE);
      }, OUTPUT_PAUSE);
    };

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || typeof window.IntersectionObserver !== "function") return clearTimers;

    terminalRef.current.dataset.enhanced = "true";
    const observer = new window.IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !startedRef.current) {
        startedRef.current = true;
        setPlayback({ completedSteps: 0, currentCommand: "", done: false });
        typeStep(0);
        observer.disconnect();
      }
    }, { threshold: 0.35 });

    if (terminalRef.current) observer.observe(terminalRef.current);
    return () => { observer.disconnect(); clearTimers(); };
  }, [steps]);

  return (
    <figure className={styles.figure} ref={terminalRef}>
      <div className={styles.window} aria-hidden="true">
        <div className={styles.chrome}>
          <div className={styles.trafficLights} data-testid="macos-window-controls">
            <span className={`${styles.trafficLight} ${styles.close}`} />
            <span className={`${styles.trafficLight} ${styles.minimize}`} />
            <span className={`${styles.trafficLight} ${styles.maximize}`} />
          </div>
          <p className={styles.windowTitle}>lucas@security — zsh</p>
          <span className={styles.chromeSpacer} />
        </div>
        <div className={`${styles.body} ${styles.staticTranscript}`}>
          {steps.map((step) => (
            <div className={styles.step} key={step.command}>
              <p className={styles.command}><TerminalPrompt /> {step.command}</p>
              {step.output.map((line) => <p className={styles.output} key={line}>{line}</p>)}
            </div>
          ))}
          <p className={styles.command}><TerminalPrompt /> <span className={styles.cursor} /></p>
        </div>
        <div className={`${styles.body} ${styles.animatedTranscript}`} data-testid="animated-terminal-transcript">
          {steps.slice(0, playback.completedSteps).map((step) => (
            <div className={styles.step} key={step.command}>
              <p className={styles.command}><TerminalPrompt /> {step.command}</p>
              {step.output.map((line) => <p className={styles.output} key={line}>{line}</p>)}
            </div>
          ))}
          <p className={styles.command}>
            <TerminalPrompt /> {!playback.done ? playback.currentCommand : ""}
            <span className={styles.cursor} />
          </p>
        </div>
      </div>
      <figcaption className="visually-hidden">
        Decorative security terminal showing safe scans against the reserved app.test domain. The examples report an HTTPS service, no injectable SQL parameters, and no blocking source-code findings.
      </figcaption>
    </figure>
  );
}
