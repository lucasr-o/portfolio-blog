"use client";

import React, { useRef, useState } from "react";
import { insertMarkdownImage, stageInlineImage } from "./inline-media.js";
import styles from "./editorial-input.module.css";

export default function EditorialInput({ value, onChange }) {
  const current = useRef(value);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const data = value.data;
  const update = (next) => { current.current = next; onChange(next); };
  const change = (patch) => update({ ...current.current, data: { ...current.current.data, ...patch } });
  const changeLocale = (locale, patch) => change({ [locale]: { ...(current.current.data[locale] ?? { publish: false }), ...patch } });

  const queueFile = (file, locale, textarea) => {
    if (!file || !textarea) return;
    setError("");
    setPending({ file, locale, start: textarea.selectionStart, end: textarea.selectionEnd, alt: "" });
  };
  const insertPending = async () => {
    if (!pending) return;
    setBusy(true);
    setError("");
    try {
      const bytes = new Uint8Array(await pending.file.arrayBuffer());
      const staged = await stageInlineImage(bytes);
      const prior = current.current;
      const images = prior.data.images ?? [];
      const existing = images.find((image) => image.src.endsWith(`/${staged.filename}`));
      const src = existing?.src ?? staged.src;
      const body = prior.data[pending.locale]?.body ?? "";
      const updatedBody = insertMarkdownImage(body, pending.start, pending.end, pending.alt, src);
      const assets = new Map(prior.assets);
      assets.set(staged.filename, bytes);
      update({ ...prior, assets, data: {
        ...prior.data,
        images: existing ? images : [...images, { src }],
        [pending.locale]: { ...(prior.data[pending.locale] ?? { publish: false }), body: updatedBody },
      } });
      setPending(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not attach this image. Retry or choose a file.");
    } finally { setBusy(false); }
  };

  const field = (locale, key, label, multiline = false) => {
    const id = `editorial-${locale}-${key}`;
    const props = { id, value: data[locale]?.[key] ?? "", onChange: (event) => changeLocale(locale, { [key]: key === "title" && locale === "pt" && data.titleLocale === "pt" && !event.target.value.trim() ? undefined : event.target.value }) };
    return <label key={id} htmlFor={id} className={styles.field}>
      <span>{label}</span>
      {multiline ? <textarea {...props} className={`${styles.control} ${key === "body" ? styles.markdown : ""}`} rows={key === "body" ? 12 : 3} spellCheck={key !== "body"}
        onPaste={key === "body" ? (event) => {
          const file = [...event.clipboardData.items].map((item) => item.getAsFile()).find(Boolean);
          if (file) { event.preventDefault(); queueFile(file, locale, event.currentTarget); }
        } : undefined}
        onDrop={key === "body" ? (event) => {
          const file = [...event.dataTransfer.files][0];
          if (file) { event.preventDefault(); queueFile(file, locale, event.currentTarget); }
        } : undefined} /> : <input {...props} className={styles.control} type="text" />}
    </label>;
  };

  const mediaControls = (locale) => <div className={styles.mediaControls}>
    <p className={styles.hint}>{locale === "pt" ? "Cole uma imagem ou GIF no Markdown, arraste um arquivo, ou selecione abaixo. A descrição pode ser diferente em cada idioma." : "Paste or drop an image or GIF into Markdown, or choose a file below. Each language can have its own description."}</p>
    <label className={styles.fileLabel}>{locale === "pt" ? "Escolher imagem ou GIF" : "Choose image or GIF"}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => {
      const file = event.target.files?.[0];
      if (file) queueFile(file, locale, document.getElementById(`editorial-${locale}-body`));
      event.target.value = "";
    }} /></label>
    {pending?.locale === locale && <div className={styles.pending} role="group" aria-label={locale === "pt" ? "Inserir imagem no Markdown" : "Insert image into Markdown"}>
      <p>{pending.file.name || (locale === "pt" ? "Imagem copiada" : "Clipboard image")} · {locale === "pt" ? "Descreva o conteúdo antes de inserir." : "Describe the image before inserting."}</p>
      <label className={styles.field}>{locale === "pt" ? "Texto alternativo" : "Alternative text"}<input className={styles.control} value={pending.alt} onChange={(event) => setPending({ ...pending, alt: event.target.value })} /></label>
      <div className={styles.actions}><button className={styles.action} type="button" disabled={busy || !pending.alt.trim()} onClick={insertPending}>{busy ? "…" : locale === "pt" ? "Inserir no cursor" : "Insert at cursor"}</button>
      <button className={styles.secondaryAction} type="button" disabled={busy} onClick={() => setPending(null)}>{locale === "pt" ? "Cancelar" : "Cancel"}</button></div>
    </div>}
  </div>;

  return <div className={styles.editor}>
    <div className={styles.intro}><span className={styles.eyebrow}>EDITORIAL</span><p>Escreva em português primeiro. O título original define a URL; o título exibido pode mudar abaixo sem alterar o endereço. Conteúdo e imagens dos dois idiomas são salvos juntos.</p></div>
    <div className={styles.meta}>
    <label htmlFor="editorial-status" className={styles.field}>
      <span>Estado do artigo</span>
      <select className={styles.control} id="editorial-status" value={data.status} onChange={(event) => change({ status: event.target.value })}>
        <option value="draft">Rascunho</option><option value="published">Publicado</option>
      </select>
    </label>
    <label htmlFor="editorial-author" className={styles.field}>Autor <input className={styles.control} id="editorial-author" value={data.author ?? ""} onChange={(event) => change({ author: event.target.value })} /></label>
    </div>
    <section className={styles.section} aria-labelledby="editorial-pt-heading">
      <div className={styles.sectionHeader}><span className={styles.localeBadge}>01 / PRINCIPAL</span><h2 id="editorial-pt-heading">Português</h2></div>
      {field("pt", "title", data.titleLocale === "pt" ? "Título exibido em português (opcional)" : "Título em português")}
      {field("pt", "summary", "Resumo", true)}
      {field("pt", "body", "Markdown", true)}
      {mediaControls("pt")}
      <label className={styles.field}>Assuntos, separados por vírgula <input className={styles.control} value={(data.pt?.tags ?? []).join(", ")} onChange={(event) => changeLocale("pt", { tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} /></label>
      <label className={styles.approval}><input type="checkbox" checked={data.pt?.publish ?? false} onChange={(event) => changeLocale("pt", { publish: event.target.checked })} /><span><strong>Publicar versão em português</strong><small>Só aparecerá no site se o artigo estiver “Publicado”.</small></span></label>
    </section>
    <section className={styles.section} aria-labelledby="editorial-en-heading">
      <div className={styles.sectionHeader}><span className={styles.localeBadge}>02 / OPTIONAL</span><h2 id="editorial-en-heading">English</h2><p>You can add this version later without changing the Portuguese publication date.</p></div>
      {field("en", "title", "English title")}
      {field("en", "summary", "Summary", true)}
      {field("en", "body", "Markdown", true)}
      {mediaControls("en")}
      <label className={styles.field}>Topics, separated by commas <input className={styles.control} value={(data.en?.tags ?? []).join(", ")} onChange={(event) => changeLocale("en", { tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} /></label>
      <label className={styles.approval}><input type="checkbox" checked={data.en?.publish ?? false} onChange={(event) => changeLocale("en", { publish: event.target.checked })} /><span><strong>Publish English version</strong><small>Optional; add it whenever the translation is ready.</small></span></label>
    </section>
    {data.cover?.src && <div className={styles.section}><p>Capa: {data.cover.src}</p>
      <label className={styles.field}>Texto alternativo da capa <input className={styles.control} value={data.pt?.coverAlt ?? ""} onChange={(event) => changeLocale("pt", { coverAlt: event.target.value })} /></label>
      <label className={styles.field}>English cover description <input className={styles.control} value={data.en?.coverAlt ?? ""} onChange={(event) => changeLocale("en", { coverAlt: event.target.value })} /></label>
    </div>}
    {error && <p className={styles.error} role="alert">{error}</p>}
    <p className={styles.footnote}>A data de publicação vem automaticamente do commit que publicou cada idioma. Alterações ainda não salvas não recebem data.</p>
  </div>;
}
