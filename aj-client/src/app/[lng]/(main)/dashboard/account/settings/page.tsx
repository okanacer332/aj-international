// aj-client/src/app/[lng]/(main)/dashboard/account/settings/page.tsx
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "./profile-form";
import { SecurityForm } from "./security-form";
import { AvatarForm } from "./avatar-form";
import { CompetenciesForm } from "./competencies-form";
import { useAuthStore } from "@/stores/auth-store"; // Zustand store import edildi
// YENİ IMPORT: i18n desteği için
import { useTranslation } from "@/lib/i18n-client"; 
// YENİ IMPORT: Next.js'in URL'den lng alması için
import { useParams } from "next/navigation"; 


export default function AccountSettingsPage() {
  const { lng } = useParams() as { lng: string }; // URL'den dil kodunu al
  const { t, ready } = useTranslation(lng, 'common'); // i18n hook'u kullanıldı
  const { user, isLoading, fetchUser } = useAuthStore();

  if (isLoading || !ready) { // ready kontrolü eklendi
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    return <p>Kullanıcı bilgileri yüklenemedi.</p>;
  }

   return (
    <div className="flex flex-col gap-6">
       <div>
        {/* ÇEVİRİ: Ana Başlık */}
        <h1 className="text-2xl font-bold tracking-tight">{t('account.settings.title')}</h1>
        {/* ÇEVİRİ: Alt Başlık */}
        <p className="text-muted-foreground">{t('account.settings.description')}</p>
      </div>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4"> 
          {/* ÇEVİRİ: Sekme İsimleri */}
          <TabsTrigger value="profile">{t('account.settings.tab.profile')}</TabsTrigger>
          <TabsTrigger value="security">{t('account.settings.tab.security')}</TabsTrigger>
          <TabsTrigger value="avatar">{t('account.settings.tab.avatar')}</TabsTrigger>
          <TabsTrigger value="competencies">{t('account.settings.tab.competencies')}</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="pt-4">
          <ProfileForm user={user} onSuccess={fetchUser} lng={lng} /> {/* lng prop'u eklendi */}
        </TabsContent>
        <TabsContent value="security" className="pt-4">
          <SecurityForm lng={lng} /> {/* lng prop'u eklendi */}
        </TabsContent>
        <TabsContent value="avatar" className="pt-4">
          <AvatarForm user={user} onSuccess={fetchUser} lng={lng} /> {/* lng prop'u eklendi */}
        </TabsContent>
        <TabsContent value="competencies" className="pt-4">
          <CompetenciesForm user={user} lng={lng} /> {/* lng prop'u eklendi */}
        </TabsContent>
      </Tabs>
    </div>
  );
}