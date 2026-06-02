const API_BASE = "http://localhost:3040";

import * as storage from "../utils/storage.js";

async function parseBody(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * @param {string} method
 * @param {string} path - path starting with /api/...
 * @param {{ body?: unknown, headers?: Record<string,string>, auth?: boolean }} [options]
 */
export async function request(method, path, options = {}) {
  const { body, headers = {}, auth = true } = options;
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const reqHeaders = { ...headers };
  if (body !== undefined && !reqHeaders["Content-Type"]) {
    reqHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = storage.get("token");
    if (typeof token === "string" && token) {
      reqHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(url, {
    method,
    headers: reqHeaders,
    body:
      body === undefined
        ? undefined
        : typeof body === "string"
          ? body
          : JSON.stringify(body),
  });

  const data = await parseBody(res);
  if (!res.ok) {
    const err = new Error(
      (data && data.message) || res.statusText || "Request failed"
    );
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export function get(path, options) {
  return request("GET", path, { ...options, body: undefined });
}

export function post(path, body, options) {
  return request("POST", path, { ...options, body });
}

export function patch(path, body, options) {
  return request("PATCH", path, { ...options, body });
}

export function del(path, options) {
  return request("DELETE", path, { ...options, body: undefined });
}
