import * as storage from "../utils/storage.js";
import * as api from "../api/tickets.js";
import * as fmt from "../utils/formatDate.js";
import { showLoading, hideLoading } from "../utils/ui.js";

let data = /** @type {{ items: any[], total: number } | null} */ (null);

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderTable() {
  const tbody = document.querySelector("#ticket-rows");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (!data || !data.items.length) return;
  for (const row of data.items) {
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" +
      esc(row.id) +
      "</td><td>" +
      esc(row.title) +
      "</td><td>" +
      esc(row.customer) +
      "</td><td>" +
      esc(row.priority) +
      "</td><td>" +
      esc(row.status) +
      "</td><td>" +
      esc(row.assignee?.name || "—") +
      "</td><td>" +
      esc(fmt.formatDateTime(row.createdAt)) +
      "<br><small>" +
      esc(fmt.formatRelative(row.createdAt)) +
      "</small></td>";
    tbody.appendChild(tr);
  }
}

export async function refresh() {
  const load = document.getElementById("loading");
  const err = document.getElementById("error");
  const empty = document.getElementById("empty");
  const wrap = document.getElementById("table-wrap");
  const errMsg = document.getElementById("error-msg");

  showLoading(load);
  if (err) err.hidden = true;
  if (empty) empty.hidden = true;
  if (wrap) wrap.hidden = true;

  try {
    data = await api.listTickets();
    hideLoading(load);
    if (!data.items.length) {
      if (empty) empty.hidden = false;
      renderTable();
      return;
    }
    if (wrap) wrap.hidden = false;
    renderTable();
  } catch (e) {
    data = null;
    hideLoading(load);
    if (err) err.hidden = false;
    if (errMsg) {
      errMsg.textContent =
        e && typeof e === "object" && "message" in e
          ? String(/** @type {{message:string}} */ (e).message)
          : "Error loading tickets.";
    }
    renderTable();
  }
}

export function initTicketsList() {
  if (!storage.get("token")) {
    location.replace("./index.html");
    return;
  }
  document.getElementById("retry")?.addEventListener("click", () => {
    void refresh();
  });
  void refresh();
}
