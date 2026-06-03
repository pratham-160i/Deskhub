const dateFmt = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/**
 * @param {string | number | Date | null | undefined} value
 * @returns {string}
 */
export function formatDate(value) {
  const d = toDate(value);
  if (!d) return "—";
  return dateFmt.format(d);
}

/**
 * @param {string | number | Date | null | undefined} value
 * @returns {string}
 */
export function formatDateTime(value) {
  const d = toDate(value);
  if (!d) return "—";
  return dateTimeFmt.format(d);
}

/**
 * @param {string | number | Date | null | undefined} value
 * @returns {string}
 */
export function formatRelative(value) {
  const d = toDate(value);
  if (!d) return "—";
  const sec = Math.round((Date.now() - d.getTime()) / 1000);
  if (sec < 45) return "just now";
  if (sec < 3600) {
    const m = Math.floor(sec / 60);
    return `${m} min ago`;
  }
  if (sec < 86400) {
    const h = Math.floor(sec / 3600);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  if (sec < 604800) {
    const days = Math.floor(sec / 86400);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }
  if (sec < 2592000) {
    const w = Math.floor(sec / 604800);
    return `${w} week${w === 1 ? "" : "s"} ago`;
  }
  return formatDate(d);
}

/**
 * @param {string | number | Date | null | undefined} value
 * @returns {Date | null}
 */
function toDate(value) {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
