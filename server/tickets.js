const express = require("express");

function seedTickets() {
  const priorities = ["low", "medium", "high"];
  const statuses = ["open", "pending", "closed"];
  const customers = ["Acme", "Globex", "Initech"];
  const assignees = [
    { id: "1", name: "Alex Kim" },
    { id: "2", name: "Sam Lee" },
  ];
  const list = [];
  for (let i = 1; i <= 30; i += 1) {
    list.push({
      id: String(i),
      title: `Ticket ${i}: support request`,
      customer: customers[i % customers.length],
      priority: priorities[i % priorities.length],
      status: statuses[i % statuses.length],
      assignee: assignees[i % assignees.length],
      createdAt: new Date(Date.now() - i * 36e5).toISOString(),
    });
  }
  return list;
}

function createTicketsRouter({ requireAuth }) {
  const router = express.Router();
  const tickets = seedTickets();
  const comments = new Map();
  let nextTicketId = 31;
  let nextCommentId = 1;

  router.use(requireAuth);

  router.get("/", (_req, res) => {
    res.json({ items: [...tickets], total: tickets.length });
  });

  router.post("/", (req, res) => {
    const title = String(req.body?.title || "").trim();
    const customer = String(req.body?.customer || "").trim();
    if (!title || !customer) {
      return res.status(400).json({ message: "Title and customer required." });
    }
    const t = {
      id: String(nextTicketId++),
      title,
      customer,
      priority: String(req.body?.priority || "medium"),
      status: String(req.body?.status || "open"),
      assignee: { id: "1", name: "Alex Kim" },
      createdAt: new Date().toISOString(),
    };
    tickets.push(t);
    res.status(201).json(t);
  });

  router.get("/:id/comments", (req, res) => {
    if (!tickets.some((x) => x.id === req.params.id)) {
      return res.status(404).json({ message: "Not found" });
    }
    res.json({ items: comments.get(req.params.id) || [] });
  });

  router.post("/:id/comments", (req, res) => {
    const t = tickets.find((x) => x.id === req.params.id);
    if (!t) return res.status(404).json({ message: "Not found" });
    const body = String(req.body?.body || "").trim();
    if (!body) return res.status(400).json({ message: "Body required" });
    const c = {
      id: String(nextCommentId++),
      ticketId: req.params.id,
      authorName: req.user?.name || "User",
      body,
      createdAt: new Date().toISOString(),
    };
    const list = comments.get(req.params.id) || [];
    list.push(c);
    comments.set(req.params.id, list);
    res.status(201).json(c);
  });

  router.get("/:id", (req, res) => {
    const t = tickets.find((x) => x.id === req.params.id);
    if (!t) return res.status(404).json({ message: "Not found" });
    res.json(t);
  });

  router.patch("/:id", (req, res) => {
    const t = tickets.find((x) => x.id === req.params.id);
    if (!t) return res.status(404).json({ message: "Not found" });
    const b = req.body || {};
    if (b.title != null) t.title = String(b.title).trim();
    if (b.customer != null) t.customer = String(b.customer).trim();
    if (b.priority != null) t.priority = String(b.priority).trim();
    if (b.status != null) t.status = String(b.status).trim();
    if (b.assignee?.name) t.assignee = { id: String(b.assignee.id || t.assignee.id), name: b.assignee.name };
    res.json(t);
  });

  router.delete("/:id", (req, res) => {
    const i = tickets.findIndex((x) => x.id === req.params.id);
    if (i === -1) return res.status(404).json({ message: "Not found" });
    tickets.splice(i, 1);
    comments.delete(req.params.id);
    res.status(204).end();
  });

  return router;
}

module.exports = { createTicketsRouter };
