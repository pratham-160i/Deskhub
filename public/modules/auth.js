import * as auth from "../api/auth.js";

const form = document.getElementById("login-form");
const errorEl = document.getElementById("login-error");

const dashboardHref = window.location.pathname.includes("/public/")
  ? "./dashboard.html"
  : "./public/dashboard.html";

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
  window.location.replace(dashboardHref);
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();

    const emailInput = /** @type {HTMLInputElement | null} */ (
      form.querySelector('[name="email"]')
    );
    const email = (emailInput?.value ?? "").trim();
    const password = /** @type {HTMLInputElement} */ (
      form.querySelector('[name="password"]')
    ).value;

    try {
      await auth.login({ email, password });
      window.location.assign(dashboardHref);
    } catch (err) {
      const submit = /** @type {HTMLButtonElement | null} */ (
        document.getElementById("login-submit")
      );
      if (submit) submit.disabled = false;
      const msg =
        err && typeof err.message === "string"
          ? err.message
          : "Sign-in failed.";
      showError(msg);
    }
  });
}
