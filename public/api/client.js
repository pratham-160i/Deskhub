import * as storage from "../utils/storage.js";

/* ---------- GitHub Pages / static in-browser API (no localhost) ---------- */

const MOCK_EMAIL = "priya@deskhub.in";
const MOCK_PASSWORD = "demo123";

const MOCK_KEYS = {
  sessions: "deskhub:mock:sessions",
  tickets: "deskhub:mock:tickets",
  comments: "deskhub:mock:comments",
  nextTicket: "deskhub:mock:nextTicketId",
  nextComment: "deskhub:mock:nextCommentId",
};

function mockRead(key, fallback) {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : fallback;
  } catch {
    return fallback;
  }
}

function mockWrite(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function mockSeedTickets() {
  const priorities = ["low", "medium", "high"];
  const statuses = ["open", "pending", "closed"];
  const customers = ["Acme", "Globex", "Initech"];
  const assignees = [
    { id: "1", name: "Alex Kim" },
    { id: "2", name: "Sam Lee" },
  ];
  const list = [];
  const base = Date.now();
  for (let i = 1; i <= 30; i += 1) {
    list.push({
      id: String(i),
      title: `Ticket ${i}: support request`,
      customer: customers[i % customers.length],
      priority: priorities[i % priorities.length],
      status: statuses[i % statuses.length],
      assignee: assignees[i % assignees.length],
      createdAt: new Date(base - i * 36e5).toISOString(),
    });
  }
  return list;
}

function mockGetTickets() {
  let tickets = mockRead(MOCK_KEYS.tickets, null);
  if (!Array.isArray(tickets) || tickets.length === 0) {
    tickets = mockSeedTickets();
    mockWrite(MOCK_KEYS.tickets, tickets);
    if (!localStorage.getItem(MOCK_KEYS.nextTicket)) {
      localStorage.setItem(MOCK_KEYS.nextTicket, "31");
    }
    if (!localStorage.getItem(MOCK_KEYS.nextComment)) {
      localStorage.setItem(MOCK_KEYS.nextComment, "1");
    }
  }
  return tickets;
}

function mockSaveTickets(tickets) {
  mockWrite(MOCK_KEYS.tickets, tickets);
}

function mockGetComments() {
  return mockRead(MOCK_KEYS.comments, {});
}

function mockSaveComments(obj) {
  mockWrite(MOCK_KEYS.comments, obj);
}

function mockBearer(opts) {
  const h = opts.headers || {};
  const a = h.Authorization || h.authorization;
  if (!a || !String(a).startsWith("Bearer ")) return null;
  return String(a).slice(7).trim();
}

function mockErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function mockParseBody(body) {
  if (body == null || body === "") return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return /** @type {Record<string, unknown>} */ (body);
}

function mockRequireUser(opts) {
  const token = mockBearer(opts);
  if (!token) throw mockErr(401, "Unauthorized");
  const sessions = mockRead(MOCK_KEYS.sessions, {});
  const user = sessions[token];
  if (!user) throw mockErr(401, "Unauthorized");
  return { token, user };
}

function shouldUseGithubMock() {
  if (typeof window === "undefined") return false;
  if (window.DESKHUB_API_BASE) return false;
  if (window.DESKHUB_USE_STATIC_API === true) return true;
  const h = (window.location.hostname || "").toLowerCase();
  if (h === "localhost" || h === "127.0.0.1") return false;
  return h.endsWith("github.io") || h.endsWith("github.dev");
}

/**
 * @param {string} method
 * @param {string} path
 * @param {{ body?: unknown, headers?: Record<string,string>, auth?: boolean }} opts
 */
async function mockRequest(method, path, opts = {}) {
  const auth = opts.auth !== false;
  const body = mockParseBody(opts.body);

  if (method === "POST" && path === "/api/auth/login") {
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "").trim();
    if (email !== MOCK_EMAIL || password !== MOCK_PASSWORD) {
      throw mockErr(401, "Invalid email or password.");
    }
    const token = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const user = { id: "1", email: MOCK_EMAIL, name: "Priya" };
    const sessions = mockRead(MOCK_KEYS.sessions, {});
    sessions[token] = user;
    mockWrite(MOCK_KEYS.sessions, sessions);
    return { token, user };
  }

  if (method === "GET" && path === "/api/auth/me") {
    if (!auth) throw mockErr(401, "Unauthorized");
    const { user } = mockRequireUser(opts);
    return { user };
  }

  if (method === "POST" && path === "/api/auth/logout") {
    if (auth) {
      const token = mockBearer(opts);
      if (token) {
        const sessions = mockRead(MOCK_KEYS.sessions, {});
        delete sessions[token];
        mockWrite(MOCK_KEYS.sessions, sessions);
      }
    }
    return null;
  }

  if (path.startsWith("/api/tickets")) {
    mockRequireUser(opts);
    const tickets = mockGetTickets();
    const comments = mockGetComments();

    if (method === "GET" && path === "/api/tickets") {
      return { items: [...tickets], total: tickets.length };
    }

    if (method === "POST" && path === "/api/tickets") {
      const title = String(body.title || "").trim();
      const customer = String(body.customer || "").trim();
      if (!title || !customer) throw mockErr(400, "Title and customer required.");
      let nextId = parseInt(localStorage.getItem(MOCK_KEYS.nextTicket) || "31", 10);
      const t = {
        id: String(nextId),
        title,
        customer,
        priority: String(body.priority || "medium"),
        status: String(body.status || "open"),
        assignee: { id: "1", name: "Alex Kim" },
        createdAt: new Date().toISOString(),
      };
      nextId += 1;
      localStorage.setItem(MOCK_KEYS.nextTicket, String(nextId));
      tickets.push(t);
      mockSaveTickets(tickets);
      return t;
    }

    const mComments = path.match(/^\/api\/tickets\/([^/]+)\/comments$/);
    if (mComments) {
      const id = mComments[1];
      if (!tickets.some((x) => x.id === id)) throw mockErr(404, "Not found");
      if (method === "GET") {
        return { items: comments[id] || [] };
      }
      if (method === "POST") {
        const text = String(body.body || "").trim();
        if (!text) throw mockErr(400, "Body required");
        const { user } = mockRequireUser(opts);
        let nc = parseInt(localStorage.getItem(MOCK_KEYS.nextComment) || "1", 10);
        const c = {
          id: String(nc),
          ticketId: id,
          authorName: user.name || "User",
          body: text,
          createdAt: new Date().toISOString(),
        };
        nc += 1;
        localStorage.setItem(MOCK_KEYS.nextComment, String(nc));
        const list = comments[id] || [];
        list.push(c);
        comments[id] = list;
        mockSaveComments(comments);
        return c;
      }
    }

    const mId = path.match(/^\/api\/tickets\/([^/]+)$/);
    if (mId) {
      const id = mId[1];
      const idx = tickets.findIndex((x) => x.id === id);
      if (idx === -1) throw mockErr(404, "Not found");

      if (method === "GET") {
        return tickets[idx];
      }
      if (method === "PATCH") {
        const t = tickets[idx];
        if (body.title != null) t.title = String(body.title).trim();
        if (body.customer != null) t.customer = String(body.customer).trim();
        if (body.priority != null) t.priority = String(body.priority).trim();
        if (body.status != null) t.status = String(body.status).trim();
        if (body.assignee && typeof body.assignee === "object" && body.assignee.name) {
          t.assignee = {
            id: String(body.assignee.id || t.assignee.id),
            name: String(body.assignee.name),
          };
        }
        mockSaveTickets(tickets);
        return t;
      }
      if (method === "DELETE") {
        tickets.splice(idx, 1);
        mockSaveTickets(tickets);
        const c2 = mockGetComments();
        delete c2[id];
        mockSaveComments(c2);
        return null;
      }
    }
  }

  throw mockErr(404, "Not found");
}

/* ---------- HTTP client ---------- */

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
    return mockRequest(method, path, opts || {});
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
