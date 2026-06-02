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

## Run locally

```bash
npm install
npm run dev
```

## If you must use the website upload

Only select these paths (not `node_modules`): `.gitignore`, `package.json`, `package-lock.json`, `README.md`, `public/`, `server/`. That stays under GitHub’s per-upload limit.
