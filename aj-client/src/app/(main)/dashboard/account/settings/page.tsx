"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "./profile-form";
import { SecurityForm } from "./security-form";
import { AvatarForm } from "./avatar-form";
import { CompetenciesForm } from "./competencies-form";
import { useAuthStore } from "@/stores/auth-store"; // Zustand store import edildi

export default function AccountSettingsPage() {
  // --- DEĞİŞİKLİK: Yerel state yerine global store'u kullan ---
  const { user, isLoading, fetchUser } = useAuthStore();

  if (isLoading) {
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
        <h1 className="text-2xl font-bold tracking-tight">Hesap Ayarları</h1>
        <p className="text-muted-foreground">Profil, güvenlik ve yetkinlik ayarlarınızı yönetin.</p>
      </div>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4"> 
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="security">Güvenlik</TabsTrigger>
          <TabsTrigger value="avatar">Fotoğraf</TabsTrigger>
          <TabsTrigger value="competencies">Yetkinliklerim</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="pt-4">
          {/* --- DEĞİŞİKLİK: onSuccess'e global fetchUser'ı ver --- */}
          <ProfileForm user={user} onSuccess={fetchUser} />
        </TabsContent>
        <TabsContent value="security" className="pt-4">
          <SecurityForm />
        </TabsContent>
        <TabsContent value="avatar" className="pt-4">
          {/* --- DEĞİŞİKLİK: onSuccess'e global fetchUser'ı ver --- */}
          <AvatarForm user={user} onSuccess={fetchUser} />
        </TabsContent>
        <TabsContent value="competencies" className="pt-4">
          <CompetenciesForm user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}