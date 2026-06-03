import * as storage from "../utils/storage.js";
import { shouldUseGithubMock, mockRequest } from "./mockGithubPages.js";

function apiBase() {
  if (typeof window !== "undefined" && window.DESKHUB_API_BASE) {
    return String(window.DESKHUB_API_BASE).replace(/\/$/, "");
  }
  if (typeof window === "undefined") return "http://localhost:3040";
  const { protocol, hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${protocol}//${hostname}:3040`;
  }
  return "";
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
  if (shouldUseGithubMock()) {
    const data = await mockRequest(method, path, opts || {});
    if (data === null && method === "POST" && path === "/api/auth/logout") {
      return undefined;
    }
    return data;
  }

  const base = API_BASE || "http://localhost:3040";
  const { body, headers = {}, auth = true } = opts || {};
  const url = path.startsWith("http") ? path : base + path;
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
    const e = new Error((data && data.message) || res.statusText || "Error");
    e.status = res.status;
    throw e;
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
