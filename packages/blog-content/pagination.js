import { blogPath } from "./locale.js";

export const POSTS_PER_PAGE = 6;

export function pageCount(postCount) {
  if (!Number.isSafeInteger(postCount) || postCount < 0) return 1;
  return Math.max(1, Math.ceil(postCount / POSTS_PER_PAGE));
}

export function postsOnPage(posts, page) {
  if (!Number.isSafeInteger(page) || page < 1) return [];
  return posts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);
}

export function blogPagePath(locale, page) {
  const base = blogPath(locale);
  return !Number.isSafeInteger(page) || page <= 1 ? base : `${base}page/${page}/`;
}

export function parseArchivePage(value, totalPages) {
  if (typeof value !== "string" || !/^[1-9]\d{0,5}$/.test(value)) return null;
  const page = Number(value);
  return page > 1 && page <= totalPages ? page : null;
}

export function paginationItems(currentPage, totalPages) {
  if (!Number.isSafeInteger(currentPage) || !Number.isSafeInteger(totalPages) ||
      currentPage < 1 || totalPages < 1 || currentPage > totalPages) return [];
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const visible = new Set([1, totalPages, currentPage]);
  for (let distance = 1; visible.size < Math.min(5, totalPages); distance += 1) {
    if (currentPage - distance > 1) visible.add(currentPage - distance);
    if (visible.size < 5 && currentPage + distance < totalPages) visible.add(currentPage + distance);
  }
  const pages = [...visible].sort((a, b) => a - b);
  return pages.flatMap((page, index) => index > 0 && page - pages[index - 1] > 1 ? ["ellipsis", page] : [page]);
}
