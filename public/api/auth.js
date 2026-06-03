import * as storage from "../utils/storage.js";
import * as client from "./client.js";

/**
 * @param {{ email: string, password: string }} credentials
 */
export async function login(credentials) {
  const data = await client.post(
    "/api/auth/login",
    { email: credentials.email, password: credentials.password },
    {
      auth: false,
    }
  );
  if (data && data.token) storage.set("token", data.token);
  if (data && data.user) storage.set("user", JSON.stringify(data.user));
  return data;
}

export async function logout() {
  try {
    await client.post("/api/auth/logout", {}, { auth: true });
  } catch {
    /* still clear local session */
  }
  storage.remove("token");
  storage.remove("user");
}

export async function getCurrentUser() {
  const data = await client.get("/api/auth/me");
  if (data && data.user) storage.set("user", JSON.stringify(data.user));
  return data?.user ?? null;
}

export function isAuthenticated() {
  const t = storage.get("token");
  return typeof t === "string" && t.length > 0;
}
