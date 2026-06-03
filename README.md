# Deskhub

## Run locally

```bash
npm install
npm run dev
```

- Site: **http://localhost:3055/** (serves the `public` folder)
- API: **http://localhost:3040**

Demo login:

- **Email:** `priya@deskhub.in`
- **Password:** `demo123`

After login you see the ticket list (dashboard). Keep `npm run dev` running while developing.

## GitHub Pages (`*.github.io`)

GitHub Pages only hosts **static files** — the Node API on port **3040 does not run there**.

For **`github.io` / `github.dev`** hosts, the app uses a **small in-browser mock** (same demo email/password and the same ticket list behaviour) stored in **localStorage**. Sign-in and tickets work without `localhost`.

**Optional:** To use a real API on Pages, deploy the Express server (e.g. Render, Railway) and set the base URL in **`public/config.js`**:

```js
window.DESKHUB_API_BASE = "https://your-api.example.com";
```

**Pages settings:** publish from branch **`main`**, folder **`/public`**, so the site URL is `https://<user>.github.io/<repo>/` and `index.html` loads correctly.

## GitHub

Do not commit `node_modules`. Use `git push`, not bulk file upload.
