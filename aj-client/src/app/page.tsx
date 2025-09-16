// src/app/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();            // <-- await
  const token = cookieStore.get("auth-token")?.value;

  redirect(token ? "/dashboard/default" : "/auth/v1/login");
}
