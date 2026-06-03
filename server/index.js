const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { createTicketsRouter } = require("./tickets");

const PORT = process.env.PORT || 3040;
const app = express();

/** In-memory sessions for local dev */
const sessions = new Map();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

function bearerToken(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return null;
  return h.slice(7).trim();
}

/** Demo credentials — change in production */
const VALID = { username: "admin", password: "secret123" };

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username !== VALID.username ||
    password !== VALID.password
  ) {
    return res.status(401).json({ message: "Invalid username or password." });
  }
  const token = crypto.randomBytes(32).toString("hex");
  const user = { id: "1", username: VALID.username };
  sessions.set(token, user);
  return res.json({ token, user });
});

app.get("/api/auth/me", (req, res) => {
  const token = bearerToken(req);
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return res.json({ user: sessions.get(token) });
});

app.post("/api/auth/logout", (req, res) => {
  const token = bearerToken(req);
  if (token) sessions.delete(token);
  return res.status(204).send();
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "api" });
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
  console.log(`API listening on http://localhost:${PORT}`);
});
