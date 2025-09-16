import { apiFetchAuth } from "./api-auth";

export type MeResponse = {
  email: string;
  roles: { authority: string }[];
  tenantId: string | null;
};

export async function fetchMe(): Promise<MeResponse> {
  const res = await apiFetchAuth("/api/me", { method: "GET" });
  return res.json();
}
