export const EDITORIAL_TIME_ZONE = "America/Sao_Paulo";

export function formatPostDate(value, locale = "en") {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long", timeZone: EDITORIAL_TIME_ZONE,
  }).format(new Date(value));
}

export function readingTime(body, locale = "en") {
  const words = body.trim().split(/\s+/u).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return locale === "pt-BR" ? `${minutes} min de leitura` : `${minutes} min read`;
}
