const express = require("express");

/** @typedef {{ id: string, title: string, customer: string, priority: string, status: string, assignee: { id: string, name: string }, createdAt: string }} Ticket */
/** @typedef {{ id: string, ticketId: string, authorName: string, body: string, createdAt: string }} Comment */

function seedData() {
  const priorities = ["low", "medium", "high", "critical"];
  const statuses = ["open", "in progress", "resolved", "closed"];
  const customers = [
    "Acme Corp",
    "Globex",
    "Initech",
    "Umbrella LLC",
    "Stark Industries",
    "Wayne Enterprises",
    "Hooli",
    "Soylent Co",
  ];
  const assignees = [
    { id: "1", name: "Alice Chen" },
    { id: "2", name: "Bob Singh" },
    { id: "3", name: "Carol Diaz" },
    { id: "4", name: "Dan Okafor" },
    { id: "5", name: "Eve Park" },
  ];

  /** @type {Ticket[]} */
  const tickets = [];
  for (let i = 1; i <= 30; i += 1) {
    tickets.push({
      id: String(i),
      title: `Support request ${i}: ${["billing", "access", "bug", "feature", "onboarding"][i % 5]} issue`,
      customer: customers[i % customers.length],
      priority: priorities[i % priorities.length],
      status: statuses[i % statuses.length],
      assignee: assignees[i % assignees.length],
      createdAt: new Date(Date.now() - i * 36e5 * 7).toISOString(),
    });
  }

  /** @type {Map<string, Comment[]>} */
  const commentsByTicket = new Map();
  let commentId = 1;
  for (const t of tickets) {
    if (Number(t.id) % 3 === 0) {
      commentsByTicket.set(t.id, [
        {
          id: String(commentId++),
          ticketId: t.id,
          authorName: "System",
          body: "Ticket created from portal.",
          createdAt: new Date(new Date(t.createdAt).getTime() + 6e4).toISOString(),
        },
      ]);
    }
  }

  return { tickets, commentsByTicket, nextTicketId: 31, nextCommentId: commentId };
}

/**
 * @param {{ requireAuth: import("express").RequestHandler }} deps
 */
function createTicketsRouter(deps) {
  const { requireAuth } = deps;
  const router = express.Router();
  const store = seedData();
  const tickets = store.tickets;
  const commentsByTicket = store.commentsByTicket;
  let nextTicketId = store.nextTicketId;
  let nextCommentId = store.nextCommentId;

  router.use(requireAuth);

  function parseListQuery(req) {
    const q = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";
    const status =
      typeof req.query.status === "string" && req.query.status
        ? req.query.status.split(",").map((s) => s.trim().toLowerCase())
        : [];
    const priority =
      typeof req.query.priority === "string" && req.query.priority
        ? req.query.priority.split(",").map((s) => s.trim().toLowerCase())
        : [];
    const sort = typeof req.query.sort === "string" ? req.query.sort : "createdAt";
    const order = req.query.order === "asc" ? "asc" : "desc";
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize), 10) || 10));
    return { q, status, priority, sort, order, page, pageSize };
  }

  function sortKey(ticket, sort) {
    switch (sort) {
      case "id":
        return Number(ticket.id) || 0;
      case "title":
        return ticket.title.toLowerCase();
      case "customer":
        return ticket.customer.toLowerCase();
      case "priority": {
        const orderMap = { low: 0, medium: 1, high: 2, critical: 3 };
        return orderMap[ticket.priority] ?? 0;
      }
      case "status":
        return ticket.status.toLowerCase();
      case "assignee":
        return ticket.assignee.name.toLowerCase();
      case "createdAt":
      default:
        return new Date(ticket.createdAt).getTime();
    }
  }

  router.get("/", (req, res) => {
    const { q, status, priority, sort, order, page, pageSize } = parseListQuery(req);

    let filtered = tickets.filter((t) => {
      if (q) {
        const hay = `${t.title} ${t.customer}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (status.length && !status.includes(t.status.toLowerCase())) return false;
      if (priority.length && !priority.includes(t.priority.toLowerCase())) return false;
      return true;
    });

    const mult = order === "asc" ? 1 : -1;
    filtered = [...filtered].sort((a, b) => {
      const ka = sortKey(a, sort);
      const kb = sortKey(b, sort);
      if (ka < kb) return -1 * mult;
      if (ka > kb) return 1 * mult;
      return 0;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    res.json({
      items,
      total,
      page: safePage,
      pageSize,
      totalPages,
    });
  });

  router.get("/:ticketId/comments", (req, res) => {
    const { ticketId } = req.params;
    if (!tickets.some((t) => t.id === ticketId)) {
      return res.status(404).json({ message: "Ticket not found." });
    }
    const list = commentsByTicket.get(ticketId) || [];
    res.json({ items: list });
  });

  router.post("/:ticketId/comments", (req, res) => {
    const { ticketId } = req.params;
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return res.status(404).json({ message: "Ticket not found." });
    const bodyText =
      typeof req.body?.body === "string" ? req.body.body.trim() : "";
    if (!bodyText) {
      return res.status(400).json({ message: "Comment body is required." });
    }
    const authorName =
      typeof req.body?.authorName === "string" && req.body.authorName.trim()
        ? req.body.authorName.trim()
        : req.user?.username || "User";
    const c = {
      id: String(nextCommentId++),
      ticketId,
      authorName,
      body: bodyText,
      createdAt: new Date().toISOString(),
    };
    const list = commentsByTicket.get(ticketId) || [];
    list.push(c);
    commentsByTicket.set(ticketId, list);
    res.status(201).json(c);
  });

  router.post("/", (req, res) => {
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const customer = typeof req.body?.customer === "string" ? req.body.customer.trim() : "";
    if (!title || !customer) {
      return res.status(400).json({ message: "Title and customer are required." });
    }
    const priority =
      typeof req.body?.priority === "string" ? req.body.priority.trim() : "medium";
    const status = typeof req.body?.status === "string" ? req.body.status.trim() : "open";
    let assignee = { id: "1", name: "Alice Chen" };
    if (req.body?.assignee && typeof req.body.assignee.name === "string") {
      assignee = {
        id: String(req.body.assignee.id || nextTicketId),
        name: req.body.assignee.name,
      };
    }
    const ticket = {
      id: String(nextTicketId++),
      title,
      customer,
      priority,
      status,
      assignee,
      createdAt: new Date().toISOString(),
    };
    tickets.push(ticket);
    res.status(201).json(ticket);
  });

  router.get("/:ticketId", (req, res) => {
    const ticket = tickets.find((t) => t.id === req.params.ticketId);
    if (!ticket) return res.status(404).json({ message: "Ticket not found." });
    res.json(ticket);
  });

  router.patch("/:ticketId", (req, res) => {
    const ticket = tickets.find((t) => t.id === req.params.ticketId);
    if (!ticket) return res.status(404).json({ message: "Ticket not found." });
    const patch = req.body || {};
    if (typeof patch.title === "string") ticket.title = patch.title.trim();
    if (typeof patch.customer === "string") ticket.customer = patch.customer.trim();
    if (typeof patch.priority === "string") ticket.priority = patch.priority.trim();
    if (typeof patch.status === "string") ticket.status = patch.status.trim();
    if (patch.assignee && typeof patch.assignee.name === "string") {
      ticket.assignee = {
        id: String(patch.assignee.id || ticket.assignee.id),
        name: patch.assignee.name,
      };
    }
    res.json(ticket);
  });

  router.delete("/:ticketId", (req, res) => {
    const idx = tickets.findIndex((t) => t.id === req.params.ticketId);
    if (idx === -1) return res.status(404).json({ message: "Ticket not found." });
    tickets.splice(idx, 1);
    commentsByTicket.delete(req.params.ticketId);
    res.status(204).send();
  });

  return router;
}

module.exports = { createTicketsRouter };
