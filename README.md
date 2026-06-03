# Deskhub

## Put the project on GitHub (recommended)

Do **not** use **Add file → Upload files** with the whole project folder. That tries to upload every file, including `node_modules` (often 10,000+ files), and GitHub shows: *“Try uploading fewer than 100 at a time.”*

This repo is set up so **`node_modules` is not part of Git**. Dependencies are restored with npm from `package.json` / `package-lock.json`.

From this folder in a terminal:

```bash
git remote add origin https://github.com/pratham-160i/Deskhub.git
git branch -M main
git push -u origin main
```

If `origin` already exists, skip `git remote add`. After the first push, use normal `git add`, `git commit`, and `git push` — still no `node_modules` in the repo.

## GitHub Pages URL

The login page is **`index.html` at the repository root**, so a project site looks like:

`https://<your-username>.github.io/<RepositoryName>/`

(Example: `https://vaseem369.github.io/DeskHub/` — match your repo name’s casing in the URL.)

In the repo **Settings → Pages**, set the source to your branch (usually `main`) and **folder `/ (root)`**. Static assets stay under `public/`.

## Run locally

```bash
npm install
npm run dev
```

Then open **`http://localhost:3055/`** (root) or **`http://localhost:3055/public/index.html`**. Demo login (change in `server/index.js` for production):

- **Email:** `pratham.bankar@g10x.com`
- **Password:** `PrathamBankar@1604`

## Phase 1 & 2 (what is implemented)

**Phase 1 — Foundations & login**

| Item | Where |
|------|--------|
| `npm run dev` runs API + static site | `package.json` → API `:3040`, `serve` `:3055` |
| Login page (semantic form + CSS) | `index.html` (root), `public/index.html` |
| Storage prefix helpers | `public/utils/storage.js` (`get` / `set` / `remove` / `clear`) |
| HTTP client | `public/api/client.js` (`request`, `get`, `post`, `patch`, `del`) |
| Auth API | `public/api/auth.js` (`login`, `logout`, `getCurrentUser`, `isAuthenticated`) |
| Form wiring + redirect | `public/modules/auth.js` |
| Wrong password → inline error; submit stays enabled | `public/modules/auth.js` |
| Session survives reload | token + user in `localStorage` via `storage.js` |
| Demo user | `server/index.js` (`VALID.email` / `VALID.password`) |

**Phase 2 — Tickets list**

| Item | Where |
|------|--------|
| Dashboard placeholder | `public/dashboard.html` |
| Tickets UI (table, filters, pagination) | `public/tickets.html`, `public/modules/tickets.js` |
| Tickets REST + 30 seed rows | `server/tickets.js`, mounted in `server/index.js` |
| Client `listTickets`, `getTicket`, CRUD, comments | `public/api/tickets.js` |
| Dates | `public/utils/formatDate.js` |
| Loading / empty / error + retry | `public/tickets.html`, `public/modules/tickets.js` |
| Loading helpers (stub) | `public/utils/ui.js` |

## If you must use the website upload

Only select these paths (not `node_modules`): `.gitignore`, `package.json`, `package-lock.json`, `README.md`, `index.html`, `public/`, `server/`. That stays under GitHub’s per-upload limit.
