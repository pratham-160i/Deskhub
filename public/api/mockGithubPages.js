/**
 * In-browser API for GitHub Pages (no Node server). Same demo login + ticket shapes as localhost.
 * Data lives in localStorage under keys prefixed with deskhub:mock:
 */

const VALID_EMAIL = "priya@deskhub.in";
const VALID_PASSWORD = "demo123";

const K = {
  sessions: "deskhub:mock:sessions",
  tickets: "deskhub:mock:tickets",
  comments: "deskhub:mock:comments",
  nextTicket: "deskhub:mock:nextTicketId",
  nextComment: "deskhub:mock:nextCommentId",
};

function read(key, fallback) {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function seedTicketsList() {
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

function getTickets() {
  let tickets = read(K.tickets, null);
  if (!Array.isArray(tickets) || tickets.length === 0) {
    tickets = seedTicketsList();
    write(K.tickets, tickets);
    if (!localStorage.getItem(K.nextTicket)) {
      localStorage.setItem(K.nextTicket, "31");
    }
    if (!localStorage.getItem(K.nextComment)) {
      localStorage.setItem(K.nextComment, "1");
    }
  }
  return tickets;
}

function saveTickets(tickets) {
  write(K.tickets, tickets);
}

function getComments() {
  return read(K.comments, {});
}

function saveComments(obj) {
  write(K.comments, obj);
}

function bearerFromOpts(opts) {
  const h = opts.headers || {};
  const a = h.Authorization || h.authorization;
  if (!a || !String(a).startsWith("Bearer ")) return null;
  return String(a).slice(7).trim();
}

function requireUser(opts) {
  const token = bearerFromOpts(opts);
  if (!token) throw err(401, "Unauthorized");
  const sessions = read(K.sessions, {});
  const user = sessions[token];
  if (!user) throw err(401, "Unauthorized");
  return { token, user };
}

function err(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function parseBody(body) {
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

export function shouldUseGithubMock() {
  if (typeof window === "undefined") return false;
  if (window.DESKHUB_API_BASE) return false;
  const h = window.location.hostname;
  return h.endsWith("github.io") || h.endsWith("github.dev");
}

/**
 * @param {string} method
 * @param {string} path
 * @param {{ body?: unknown, headers?: Record<string,string>, auth?: boolean }} opts
 */
export async function mockRequest(method, path, opts = {}) {
  const auth = opts.auth !== false;
  const body = parseBody(opts.body);

  if (method === "POST" && path === "/api/auth/login") {
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "").trim();
    if (email !== VALID_EMAIL || password !== VALID_PASSWORD) {
      throw err(401, "Invalid email or password.");
    }
    const token = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const user = { id: "1", email: VALID_EMAIL, name: "Priya" };
    const sessions = read(K.sessions, {});
    sessions[token] = user;
    write(K.sessions, sessions);
    return { token, user };
  }

  if (method === "GET" && path === "/api/auth/me") {
    if (!auth) throw err(401, "Unauthorized");
    const { user } = requireUser(opts);
    return { user };
  }

  if (method === "POST" && path === "/api/auth/logout") {
    if (auth) {
      const token = bearerFromOpts(opts);
      if (token) {
        const sessions = read(K.sessions, {});
        delete sessions[token];
        write(K.sessions, sessions);
      }
    }
    return null;
  }

  if (path.startsWith("/api/tickets")) {
    requireUser(opts);
    const tickets = getTickets();
    const comments = getComments();

    if (method === "GET" && path === "/api/tickets") {
      return { items: [...tickets], total: tickets.length };
    }

    if (method === "POST" && path === "/api/tickets") {
      const title = String(body.title || "").trim();
      const customer = String(body.customer || "").trim();
      if (!title || !customer) throw err(400, "Title and customer required.");
      let nextId = parseInt(localStorage.getItem(K.nextTicket) || "31", 10);
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
      localStorage.setItem(K.nextTicket, String(nextId));
      tickets.push(t);
      saveTickets(tickets);
      return t;
    }

    const mComments = path.match(/^\/api\/tickets\/([^/]+)\/comments$/);
    if (mComments) {
      const id = mComments[1];
      if (!tickets.some((x) => x.id === id)) throw err(404, "Not found");
      if (method === "GET") {
        return { items: comments[id] || [] };
      }
      if (method === "POST") {
        const text = String(body.body || "").trim();
        if (!text) throw err(400, "Body required");
        const { user } = requireUser(opts);
        let nc = parseInt(localStorage.getItem(K.nextComment) || "1", 10);
        const c = {
          id: String(nc),
          ticketId: id,
          authorName: user.name || "User",
          body: text,
          createdAt: new Date().toISOString(),
        };
        nc += 1;
        localStorage.setItem(K.nextComment, String(nc));
        const list = comments[id] || [];
        list.push(c);
        comments[id] = list;
        saveComments(comments);
        return c;
      }
    }

    const mId = path.match(/^\/api\/tickets\/([^/]+)$/);
    if (mId) {
      const id = mId[1];
      const idx = tickets.findIndex((x) => x.id === id);
      if (idx === -1) throw err(404, "Not found");

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
        saveTickets(tickets);
        return t;
      }
      if (method === "DELETE") {
        tickets.splice(idx, 1);
        saveTickets(tickets);
        const c2 = getComments();
        delete c2[id];
        saveComments(c2);
        return null;
      }
    }
  }

  throw err(404, "Not found");
}
