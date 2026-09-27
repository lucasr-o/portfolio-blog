export const EDITORIAL_TIME_ZONE = "America/Sao_Paulo";

export function formatPostDate(value) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "long", timeZone: EDITORIAL_TIME_ZONE,
  }).format(new Date(value));
}

export function readingTime(body) {
  const words = body.trim().split(/\s+/u).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}
