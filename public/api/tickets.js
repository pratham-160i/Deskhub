import * as client from "./client.js";

export function listTickets() {
  return client.get("/api/tickets");
}

export function getTicket(id) {
  return client.get("/api/tickets/" + encodeURIComponent(id));
}

export function createTicket(body) {
  return client.post("/api/tickets", body);
}

export function updateTicket(id, body) {
  return client.patch("/api/tickets/" + encodeURIComponent(id), body);
}

export function deleteTicket(id) {
  return client.del("/api/tickets/" + encodeURIComponent(id));
}

export function listComments(ticketId) {
  return client.get("/api/tickets/" + encodeURIComponent(ticketId) + "/comments");
}

export function addComment(ticketId, payload) {
  return client.post(
    "/api/tickets/" + encodeURIComponent(ticketId) + "/comments",
    payload
  );
}
