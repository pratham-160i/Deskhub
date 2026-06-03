/**
 * Optional: hosted API URL (https only). When set, GitHub Pages uses this instead of the in-browser mock.
 * Example after deploying Express somewhere:
 *   window.DESKHUB_API_BASE = "https://your-api.onrender.com";
 */
if (typeof window !== "undefined" && typeof window.DESKHUB_API_BASE === "undefined") {
  window.DESKHUB_API_BASE = "";
}
