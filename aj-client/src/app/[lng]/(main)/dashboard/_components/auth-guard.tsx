"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

function hasToken() {
  return document.cookie.split("; ").some((c) => c.startsWith("auth-token="));
}

export default function AuthGuard() {
  const router = useRouter();

  useEffect(() => {
    const check = () => {
      if (!hasToken()) router.replace("/auth/v1/login");
    };

    // ilk yükleme + geri (bfcache) + sekme dönüşü
    check();
    const onShow = (e: PageTransitionEvent) => check();
    window.addEventListener("pageshow", onShow as any);
    document.addEventListener("visibilitychange", check);

    return () => {
      window.removeEventListener("pageshow", onShow as any);
      document.removeEventListener("visibilitychange", check);
    };
  }, [router]);

  return null;
}
