import * as storage from "../utils/storage.js";
import * as ticketsApi from "../api/tickets.js";
import * as auth from "../api/auth.js";
import * as formatDate from "../utils/formatDate.js";
import { showLoading, hideLoading } from "../utils/ui.js";

/** @type {{ q: string, status: string, priority: string, sort: string, order: string, page: number, pageSize: number }} */
const params = {
  q: "",
  status: "",
  priority: "",
  sort: "createdAt",
  order: "desc",
  page: 1,
  pageSize: 30,
};

/** @type {{ items: any[], total: number, page: number, pageSize: number, totalPages: number } | null} */
let listData = null;

/** @type {ReturnType<typeof setTimeout> | null} */
let searchTimer = null;

/**
 * @param {unknown} err
 */
function friendlyMessage(err) {
  if (err && typeof err === "object" && "status" in err) {
    const status = /** @type {{ status?: number }} */ (err).status;
    if (status === 401) {
      return "Your session expired. Sign in again and retry.";
    }
    if (status === 403) {
      return "You do not have permission to view tickets.";
    }
  }
  const msg =
    err && typeof err === "object" && "message" in err
      ? String(/** @type {{ message?: string }} */ (err).message)
      : "Something went wrong while loading tickets.";
  if (/failed to fetch|network/i.test(msg)) {
    return "We could not reach the server. Check that the API is running (npm run dev) and try again.";
  }
  return msg;
}

function readParamsFromDom() {
  const qEl = /** @type {HTMLInputElement | null} */ (
    document.getElementById("tickets-search")
  );
  const statusEl = /** @type {HTMLSelectElement | null} */ (
    document.getElementById("tickets-filter-status")
  );
  const priorityEl = /** @type {HTMLSelectElement | null} */ (
    document.getElementById("tickets-filter-priority")
  );
  const sortEl = /** @type {HTMLSelectElement | null} */ (
    document.getElementById("tickets-sort")
  );
  const orderEl = /** @type {HTMLSelectElement | null} */ (
    document.getElementById("tickets-order")
  );
  const pageSizeEl = /** @type {HTMLSelectElement | null} */ (
    document.getElementById("tickets-page-size")
  );
  params.q = (qEl?.value ?? "").trim();
  params.status = statusEl?.value ?? "";
  params.priority = priorityEl?.value ?? "";
  params.sort = sortEl?.value ?? "createdAt";
  params.order = orderEl?.value ?? "desc";
  const ps = parseInt(pageSizeEl?.value ?? "30", 10);
  params.pageSize = Number.isFinite(ps) ? ps : 30;
}

function updatePaginationUi() {
  const info = document.getElementById("tickets-page-info");
  const prev = /** @type {HTMLButtonElement | null} */ (
    document.getElementById("tickets-prev")
  );
  const next = /** @type {HTMLButtonElement | null} */ (
    document.getElementById("tickets-next")
  );
  if (!listData) {
    if (info) info.textContent = "";
    if (prev) prev.disabled = true;
    if (next) next.disabled = true;
    return;
  }
  const { page, totalPages, total } = listData;
  if (info) {
    info.textContent = `Page ${page} of ${totalPages} · ${total} ticket${total === 1 ? "" : "s"}`;
  }
  if (prev) prev.disabled = page <= 1;
  if (next) next.disabled = page >= totalPages;
}

/**
 * @param {boolean} loading
 */
function setPanels(loading) {
  const loadingEl = document.getElementById("tickets-loading");
  const errorEl = document.getElementById("tickets-error");
  const emptyEl = document.getElementById("tickets-empty");
  const wrap = document.getElementById("tickets-table-wrap");

  if (loading) {
    showLoading(loadingEl);
    if (errorEl) errorEl.hidden = true;
    if (emptyEl) emptyEl.hidden = true;
    if (wrap) wrap.hidden = true;
  } else {
    hideLoading(loadingEl);
  }
}

export function renderTable() {
  const tbody = document.querySelector("#tickets-table tbody");
  if (!tbody) return;
  tbody.replaceChildren();
  if (!listData || !listData.items || listData.items.length === 0) {
    return;
  }
  const frag = document.createDocumentFragment();
  for (const row of listData.items) {
    const tr = document.createElement("tr");
    const pri = String(row.priority || "").toLowerCase().replace(/\s+/g, "-");
    tr.innerHTML = `
      <td class="num">${escapeHtml(String(row.id))}</td>
      <td>${escapeHtml(String(row.title ?? ""))}</td>
      <td>${escapeHtml(String(row.customer ?? ""))}</td>
      <td><span class="badge pri-${escapeHtml(pri)}">${escapeHtml(String(row.priority ?? ""))}</span></td>
      <td><span class="badge status-pill">${escapeHtml(String(row.status ?? ""))}</span></td>
      <td>${escapeHtml(String(row.assignee?.name ?? "—"))}</td>
      <td>
        <div>${escapeHtml(formatDate.formatDateTime(row.createdAt))}</div>
        <div class="muted small">${escapeHtml(formatDate.formatRelative(row.createdAt))}</div>
      </td>
    `;
    frag.appendChild(tr);
  }
  tbody.appendChild(frag);
}

/**
 * @param {string} s
 */
function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function refresh() {
  if (!storage.get("token")) {
    window.location.replace("./index.html");
    return;
  }

  setPanels(true);

  const query = {
    q: params.q || undefined,
    status: params.status || undefined,
    priority: params.priority || undefined,
    sort: params.sort,
    order: params.order,
    page: params.page,
    pageSize: params.pageSize,
  };

  try {
    listData = await ticketsApi.listTickets(query);
    params.page = listData.page;
    setPanels(false);
    const errorEl = document.getElementById("tickets-error");
    const emptyEl = document.getElementById("tickets-empty");
    const wrap = document.getElementById("tickets-table-wrap");
    if (errorEl) errorEl.hidden = true;

    if (!listData.items.length) {
      if (emptyEl) emptyEl.hidden = false;
      if (wrap) wrap.hidden = true;
      renderTable();
      updatePaginationUi();
      return;
    }

    if (emptyEl) emptyEl.hidden = true;
    if (wrap) wrap.hidden = false;
    renderTable();
    updatePaginationUi();
  } catch (err) {
    listData = null;
    setPanels(false);
    const errorEl = document.getElementById("tickets-error");
    const emptyEl = document.getElementById("tickets-empty");
    const wrap = document.getElementById("tickets-table-wrap");
    const msgEl = document.getElementById("tickets-error-message");
    if (errorEl) errorEl.hidden = false;
    if (msgEl) msgEl.textContent = friendlyMessage(err);
    if (emptyEl) emptyEl.hidden = true;
    if (wrap) wrap.hidden = true;
    renderTable();
    updatePaginationUi();

    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      /** @type {{ status?: number }} */ (err).status === 401
    ) {
      setTimeout(() => {
        window.location.replace("./index.html");
      }, 1600);
    }
  }
}

function scheduleSearchRefresh() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchTimer = null;
    params.page = 1;
    readParamsFromDom();
    void refresh();
  }, 320);
}

export function initTicketsList() {
  if (!storage.get("token")) {
    window.location.replace("./index.html");
    return;
  }

  const search = document.getElementById("tickets-search");
  const status = document.getElementById("tickets-filter-status");
  const priority = document.getElementById("tickets-filter-priority");
  const sort = document.getElementById("tickets-sort");
  const order = document.getElementById("tickets-order");
  const pageSize = document.getElementById("tickets-page-size");
  const prev = document.getElementById("tickets-prev");
  const next = document.getElementById("tickets-next");
  const retry = document.getElementById("tickets-retry");

  search?.addEventListener("input", () => {
    readParamsFromDom();
    scheduleSearchRefresh();
  });

  for (const el of [status, priority, sort, order, pageSize]) {
    el?.addEventListener("change", () => {
      readParamsFromDom();
      params.page = 1;
      void refresh();
    });
  }

  prev?.addEventListener("click", () => {
    readParamsFromDom();
    if (params.page > 1) {
      params.page -= 1;
      void refresh();
    }
  });

  next?.addEventListener("click", () => {
    readParamsFromDom();
    if (listData && params.page < listData.totalPages) {
      params.page += 1;
      void refresh();
    }
  });

  retry?.addEventListener("click", () => {
    void refresh();
  });

  document.getElementById("tickets-sign-out")?.addEventListener("click", async (e) => {
    e.preventDefault();
    await auth.logout();
    window.location.assign("./index.html");
  });

  readParamsFromDom();
  void refresh();
}
