const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { createTicketsRouter } = require("./tickets");

const PORT = process.env.PORT || 3040;
const app = express();
const sessions = new Map();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

function bearerToken(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return null;
  return h.slice(7).trim();
}

/** Demo only — replace for production */
const VALID_EMAIL = "priya@deskhub.in";
const VALID_PASSWORD = "demo123";

app.post("/api/auth/login", (req, res) => {
  const email = (req.body?.email || "").trim().toLowerCase();
  const password = (req.body?.password || "").trim();
  if (email !== VALID_EMAIL || password !== VALID_PASSWORD) {
    return res.status(401).json({ message: "Invalid email or password." });
  }
  const token = crypto.randomBytes(24).toString("hex");
  const user = { id: "1", email: VALID_EMAIL, name: "Priya" };
  sessions.set(token, user);
  res.json({ token, user });
});

app.get("/api/auth/me", (req, res) => {
  const token = bearerToken(req);
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  res.json({ user: sessions.get(token) });
});

app.post("/api/auth/logout", (req, res) => {
  const token = bearerToken(req);
  if (token) sessions.delete(token);
  res.status(204).end();
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

function requireAuth(req, res, next) {
  const token = bearerToken(req);
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  req.user = sessions.get(token);
  next();
}

app.use("/api/tickets", createTicketsRouter({ requireAuth }));

app.listen(PORT, () => {
  console.log(`API http://localhost:${PORT}`);
});
