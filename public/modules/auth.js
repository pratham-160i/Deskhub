import * as auth from "../api/auth.js";

const form = document.getElementById("login-form");
const errEl = document.getElementById("login-error");

function show(msg) {
  if (!errEl) return;
  errEl.textContent = msg;
  errEl.hidden = false;
}

function hide() {
  if (!errEl) return;
  errEl.textContent = "";
  errEl.hidden = true;
}

if (auth.isAuthenticated()) {
  location.replace("./dashboard.html");
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hide();
    const email = (
      /** @type {HTMLInputElement} */ (form.querySelector('[name="email"]'))
    ).value
      .trim()
      .toLowerCase();
    const password = (
      /** @type {HTMLInputElement} */ (form.querySelector('[name="password"]'))
    ).value.trim();

    try {
      await auth.login({ email, password });
      location.assign("./dashboard.html");
    } catch (ex) {
      const m =
        ex && typeof ex === "object" && "message" in ex
          ? String(/** @type {{message:string}} */ (ex).message)
          : "Sign-in failed.";
      if (/failed to fetch/i.test(m)) {
        show("Cannot reach API. Run: npm run dev");
      } else {
        show(m);
      }
    }
  });
}
