"use client";

import { useEffect, useState } from "react";
import { User } from "@/types/user";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "./profile-form";
import { SecurityForm } from "./security-form";
import { AvatarForm } from "./avatar-form";


export default function AccountSettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await apiFetchAuth("/api/account/me");
      const data = await res.json();
      setUser(data);
    } catch (error) {
      toast.error("Kullanıcı bilgileri getirilirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUser();
  }, []);

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
        <p className="text-muted-foreground">Profil bilgilerinizi ve güvenlik ayarlarınızı yönetin.</p>
      </div>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3"> {/* Grid yapısı güncellendi */}
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="security">Güvenlik</TabsTrigger>
          <TabsTrigger value="avatar">Fotoğraf</TabsTrigger> {/* Yeni sekme eklendi */}
        </TabsList>
        <TabsContent value="profile" className="pt-4">
          <ProfileForm user={user} onSuccess={fetchUser} />
        </TabsContent>
        <TabsContent value="security" className="pt-4">
          <SecurityForm />
        </TabsContent>
        <TabsContent value="avatar" className="pt-4">
          <AvatarForm user={user} onSuccess={fetchUser} /> {/* Yeni form render ediliyor */}
        </TabsContent>
      </Tabs>
    </div>
  );
}