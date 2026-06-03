const PREFIX = "deskhub:";

function k(name) {
  return PREFIX + name;
}

/** @param {string} name */
export function get(name) {
  try {
    return localStorage.getItem(k(name));
  } catch {
    return null;
  }
}

/** @param {string} name @param {string} value */
export function set(name, value) {
  localStorage.setItem(k(name), value);
}

/** @param {string} name */
export function remove(name) {
  localStorage.removeItem(k(name));
}

export function clear() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}
