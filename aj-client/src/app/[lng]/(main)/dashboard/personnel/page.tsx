// aj-client/src/app/[lng]/(main)/dashboard/personnel/page.tsx
"use client"; // Client Component'e çevrildi

import { useTranslation } from "@/lib/i18n-client"; // i18n eklendi
import { useParams } from "next/navigation"; // lng parametresi için eklendi

export default function Page() {
  const { lng } = useParams() as { lng: string };
  const { t, ready } = useTranslation(lng, 'common');

  if (!ready) {
    // Yüklenirken basit bir iskelet döndürelim
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center space-y-2 text-center">
      {/* ÇEVİRİ: Ana Başlık */}
      <h1 className="text-2xl font-semibold">{t('hr.personnelManagement.title')}</h1>
      {/* ÇEVİRİ: Açıklama / Yer Tutucu Metin */}
      <p className="text-muted-foreground">{t('hr.personnelManagement.placeholder')}</p>
    </div>
  );
}