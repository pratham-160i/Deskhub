import * as storage from "../utils/storage.js";

function apiBase() {
  if (typeof window === "undefined") return "http://localhost:3040";
  const { protocol, hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${protocol}//${hostname}:3040`;
  }
  return "http://localhost:3040";
}

const API_BASE = apiBase();

async function parseBody(res) {
  const t = await res.text();
  if (!t) return null;
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}

/**
 * @param {string} method
 * @param {string} path
 * @param {{ body?: unknown, headers?: Record<string,string>, auth?: boolean }} [opts]
 */
export async function request(method, path, opts = {}) {
  const { body, headers = {}, auth = true } = opts;
  const url = path.startsWith("http") ? path : API_BASE + path;
  const h = { ...headers };
  if (body !== undefined && !h["Content-Type"]) h["Content-Type"] = "application/json";
  if (auth) {
    const token = storage.get("token");
    if (token) h.Authorization = "Bearer " + token;
  }
  const res = await fetch(url, {
    method,
    headers: h,
    body:
      body === undefined
        ? undefined
        : typeof body === "string"
          ? body
          : JSON.stringify(body),
  });
  const data = await parseBody(res);
  if (!res.ok) {
    const err = new Error((data && data.message) || res.statusText || "Error");
    err.status = res.status;
    throw err;
  }
  return data;
}

export function get(path, opts) {
  return request("GET", path, { ...opts, body: undefined });
}

export function post(path, body, opts) {
  return request("POST", path, { ...opts, body });
}

export function patch(path, body, opts) {
  return request("PATCH", path, { ...opts, body });
}

export function del(path, opts) {
  return request("DELETE", path, { ...opts, body: undefined });
}
