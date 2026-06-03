/**
 * Lightweight loading helpers (expand later for shared UI).
 * @param {HTMLElement | null} el
 */
export function showLoading(el) {
  if (el) el.hidden = false;
}

/**
 * @param {HTMLElement | null} el
 */
export function hideLoading(el) {
  if (el) el.hidden = true;
}
