import * as auth from "../api/auth.js";

const form = document.getElementById("login-form");
const errorEl = document.getElementById("login-error");

function showError(message) {
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function clearError() {
  if (!errorEl) return;
  errorEl.textContent = "";
  errorEl.hidden = true;
}

if (auth.isAuthenticated()) {
  window.location.replace("public/dashboard.html");
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();

    const username = /** @type {HTMLInputElement} */ (
      form.querySelector('[name="username"]')
    ).value.trim();
    const password = /** @type {HTMLInputElement} */ (
      form.querySelector('[name="password"]')
    ).value;

    try {
      await auth.login({ username, password });
      window.location.assign("public/dashboard.html");
    } catch (err) {
      const msg =
        err && typeof err.message === "string"
          ? err.message
          : "Sign-in failed.";
      showError(msg);
    }
  });
}
