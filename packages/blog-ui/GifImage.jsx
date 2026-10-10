"use client";

import React, { useEffect, useState } from "react";
import styles from "./article.module.css";

const motionQuery = "(prefers-reduced-motion: reduce)";

export default function GifImage({ image, alt, locale = "en" }) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(motionQuery);
    const stopOnReducedMotion = (event) => { if (event.matches) setPlaying(false); };
    query.addEventListener("change", stopOnReducedMotion);
    return () => query.removeEventListener("change", stopOnReducedMotion);
  }, []);
  const label = locale === "pt-BR" ? playing ? "Pausar animação" : "Reproduzir animação" : playing ? "Pause animation" : "Play animation";
  return <figure className={styles.gifFigure}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className={styles.image} src={playing ? image.url : image.posterUrl} alt={alt || image.alt} width={image.width} height={image.height} loading="lazy" decoding="async" />
    <figcaption><button className={styles.gifToggle} type="button" onClick={() => setPlaying(!playing)} aria-pressed={playing}>{label}</button></figcaption>
  </figure>;
}
