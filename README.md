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

## If you must use the website upload

Only select these paths (not `node_modules`): `.gitignore`, `package.json`, `package-lock.json`, `README.md`, `index.html`, `public/`, `server/`. That stays under GitHub’s per-upload limit.
