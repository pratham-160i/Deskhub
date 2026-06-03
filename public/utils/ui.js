/** @param {HTMLElement|null} el */
export function showLoading(el) {
  if (el) el.hidden = false;
}

/** @param {HTMLElement|null} el */
export function hideLoading(el) {
  if (el) el.hidden = true;
}
