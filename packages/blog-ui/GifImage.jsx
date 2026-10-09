"use client";

import React, { useState, useSyncExternalStore } from "react";
import styles from "./article.module.css";

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(onChange) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
function motionAllowed() { return !window.matchMedia(motionQuery).matches; }

export default function GifImage({ image, alt, locale = "en" }) {
  const allowedByPreference = useSyncExternalStore(subscribeMotion, motionAllowed, () => false);
  const [userChoice, setUserChoice] = useState(null);
  const playing = userChoice ?? allowedByPreference;
  const label = locale === "pt-BR" ? playing ? "Pausar animação" : "Reproduzir animação" : playing ? "Pause animation" : "Play animation";
  return <figure className={styles.gifFigure}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className={styles.image} src={playing ? image.url : image.posterUrl} alt={alt || image.alt} width={image.width} height={image.height} loading="lazy" decoding="async" />
    <figcaption><button className={styles.gifToggle} type="button" onClick={() => setUserChoice(!playing)} aria-pressed={playing}>{label}</button></figcaption>
  </figure>;
}
