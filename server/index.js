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
const VALID = {
  email: "pratham.bankar@g10x.com",
  password: "PrathamBankar@1604",
};

app.post("/api/auth/login", (req, res) => {
  const body = req.body || {};
  const password = typeof body.password === "string" ? body.password : "";
  const emailRaw =
    typeof body.email === "string"
      ? body.email.trim()
      : typeof body.username === "string"
        ? body.username.trim()
        : "";
  const email = emailRaw.toLowerCase();
  if (
    !email ||
    typeof password !== "string" ||
    email !== VALID.email.toLowerCase() ||
    password !== VALID.password
  ) {
    return res.status(401).json({ message: "Invalid email or password." });
  }
  const token = crypto.randomBytes(32).toString("hex");
  const user = {
    id: "1",
    email: VALID.email,
    username: VALID.email.split("@")[0] || "User",
  };
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
