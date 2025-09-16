// src/lib/api.ts
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers ?? {});
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  // auth-token cookie'sini header'a eklemiyoruz; sadece protected isteklerde ekleyeceğiz
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(await res.text());
  return res;
}
