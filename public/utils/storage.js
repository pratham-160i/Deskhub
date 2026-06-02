const PREFIX = "deskhub:";

function key(name) {
  return `${PREFIX}${name}`;
}

/**
 * @param {string} name
 * @returns {string | null}
 */
export function get(name) {
  try {
    return localStorage.getItem(key(name));
  } catch {
    return null;
  }
}

/**
 * @param {string} name
 * @param {string} value
 */
export function set(name, value) {
  localStorage.setItem(key(name), value);
}

/**
 * @param {string} name
 */
export function remove(name) {
  localStorage.removeItem(key(name));
}

export function clear() {
  try {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
