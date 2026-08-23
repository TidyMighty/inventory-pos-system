import client from "./client";

export async function login(username, password) {
  const { data } = await client.post("/auth/login/", { username, password });

  localStorage.setItem("access_token", data.access);
  localStorage.setItem("refresh_token", data.refresh);

  // Django already returns the authenticated user's details.
  if (data.user) {
    localStorage.setItem("current_user", JSON.stringify(data.user));
  }

  return data;
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("current_user");
}

export function getCurrentUser() {
  const raw = localStorage.getItem("current_user");

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem("current_user");
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem("access_token"));
}