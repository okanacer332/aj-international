"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Bu satır, Next.js'e bu sayfanın statik olarak oluşturulmaması gerektiğini söyler.
export const dynamic = "force-dynamic";

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        router.push("/dashboard/default");
    }, [router]);

    return null; // Bu sayfa hiçbir şey render etmeyecek, sadece yönlendirecek.
}