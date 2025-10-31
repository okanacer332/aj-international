// aj-client/src/app/[lng]/(main)/dashboard/account/settings/page.tsx
"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
// 1. YENİ İMPORTLAR: 'Tabs' gitti, 'Breadcrumb', 'Button', ikonlar ve 'cn' geldi
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { User as UserIcon, Lock, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

import { ProfileForm } from "./profile-form";
import { SecurityForm } from "./security-form";
import { AvatarForm } from "./avatar-form";
// 'CompetenciesForm' importu kaldırıldı
import { useAuthStore } from "@/stores/auth-store";
import { useTranslation } from "@/lib/i18n-client";
import { useParams } from "next/navigation";

// 2. YENİ TİP: Hangi ayar panelinin aktif olduğunu tutmak için
type ActiveView = "profile" | "security" | "avatar";

export default function AccountSettingsPage() {
  const { lng } = useParams() as { lng: string };
  const { t, ready } = useTranslation(lng, "common");
  const { user, isLoading, fetchUser } = useAuthStore();
  
  // 3. YENİ STATE: Aktif paneli yönetmek için
  const [activeView, setActiveView] = useState<ActiveView>("profile");

  if (isLoading || !ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" /> {/* Breadcrumb skeleton */}
        <Skeleton className="h-10 w-1/3" /> {/* Başlık skeleton */}
        <Skeleton className="h-64 w-full" /> {/* İçerik skeleton */}
      </div>
    );
  }

  if (!user) {
    return <p>Kullanıcı bilgileri yüklenemedi.</p>;
  }

  // 4. YENİ NAVİGASYON MENÜSÜ
  const navItems = [
    {
      id: "profile",
      label: t("account.settings.tab.profile"),
      icon: UserIcon,
    },
    {
      id: "security",
      label: t("account.settings.tab.security"),
      icon: Lock,
    },
    {
      id: "avatar",
      label: t("account.settings.tab.avatar"),
      icon: Camera,
    },
    // "Yetkinliklerim" kaldırıldı
  ];

  // 5. YENİ RENDER YAPISI
  return (
    // 'Tabs' yapısı kaldırıldı, 'gap-6' ile normal akış kullanıldı
    <div className="flex flex-col gap-6">
      
      {/* BREADCRUMB EKLENDİ */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${lng}/dashboard/default`}>
              {t("sidebar.managementPanel.home")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("account.settings.title")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* BAŞLIK (Aynı) */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("account.settings.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("account.settings.description")}
        </p>
      </div>

      {/* YENİ RESPONSIVE GRİD DÜZENİ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Sol Panel (Navigasyon) */}
        <div className="md:col-span-1">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeView === item.id ? "secondary" : "ghost"}
                className="justify-start"
                onClick={() => setActiveView(item.id as ActiveView)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </nav>
        </div>

        {/* Sağ Panel (İçerik) */}
        <div className="md:col-span-3">
          {/* Hangi formun gösterileceğini state belirler */}
          {/* Form bileşenleri zaten kendi içlerinde <Card> içeriyor */}
          {activeView === "profile" && (
            <ProfileForm user={user} onSuccess={fetchUser} lng={lng} />
          )}
          {activeView === "security" && <SecurityForm lng={lng} />}
          {activeView === "avatar" && (
            <AvatarForm user={user} onSuccess={fetchUser} lng={lng} />
          )}
        </div>
      </div>
    </div>
  );
}