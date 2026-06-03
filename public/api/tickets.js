import * as client from "./client.js";

function withQuery(path, params = {}) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const q = sp.toString();
  return q ? `${path}?${q}` : path;
}

/**
 * @param {{
 *   q?: string,
 *   status?: string,
 *   priority?: string,
 *   sort?: string,
 *   order?: string,
 *   page?: number,
 *   pageSize?: number
 * }} [params]
 */
export function listTickets(params) {
  return client.get(withQuery("/api/tickets", params || {}));
}

/**
 * @param {string} id
 */
export function getTicket(id) {
  return client.get(`/api/tickets/${encodeURIComponent(id)}`);
}

/**
 * @param {Record<string, unknown>} body
 */
export function createTicket(body) {
  return client.post("/api/tickets", body);
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} body
 */
export function updateTicket(id, body) {
  return client.patch(`/api/tickets/${encodeURIComponent(id)}`, body);
}

/**
 * @param {string} id
 */
export function deleteTicket(id) {
  return client.del(`/api/tickets/${encodeURIComponent(id)}`);
}

/**
 * @param {string} ticketId
 */
export function listComments(ticketId) {
  return client.get(
    `/api/tickets/${encodeURIComponent(ticketId)}/comments`
  );
}

/**
 * @param {string} ticketId
 * @param {{ body: string, authorName?: string }} payload
 */
export function addComment(ticketId, payload) {
  return client.post(
    `/api/tickets/${encodeURIComponent(ticketId)}/comments`,
    payload
  );
}
