"use client";

export function logout() {
  document.cookie = "auth-token=; Path=/; Max-Age=0; SameSite=Lax";
  localStorage.removeItem("auth-user");
  localStorage.removeItem("auth-token");
  window.location.href = "/auth/v1/login";
}