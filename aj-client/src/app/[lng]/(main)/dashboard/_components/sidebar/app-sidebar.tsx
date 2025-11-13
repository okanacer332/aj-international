// src/app/[lng]/(main)/dashboard/_components/sidebar/app-sidebar.tsx
"use client";

import { Sidebar, SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { NavMain } from "./nav-main";
import { useAuthStore } from "@/stores/auth-store";
import { useTranslation } from "@/lib/i18n-client";
import { Skeleton } from "@/components/ui/skeleton";

// --- YENİ İMPORTLAR ---
import { Power } from "lucide-react"; // LogOut -> Power olarak değişti
import { Button } from "@/components/ui/button";
// Tooltip importları kaldırıldı
import { logout } from "@/lib/auth";
// --- YENİ İMPORTLAR SONU ---

type TenantInfo = { label: string; flag: string };

const getTenantDisplayMap = (): Record<string, TenantInfo> => ({
  "TR": { label: "Türkiye", flag: "🇹🇷" },
  "RU": { label: "Rusya", flag: "🇷🇺" },
  "DU": { label: "Dubai", flag: "🇦🇪" },
  "SYSTEM": { label: "Süper Admin", flag: "⚙️" },
});

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  lng: string;
}

export function AppSidebar({ lng, ...props }: AppSidebarProps) {
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const { t, ready } = useTranslation(lng, "common");

  const isLoading = !ready || isAuthLoading;

  const TENANT_MAP = getTenantDisplayMap();
  const currentTenantInfo = user
    ? TENANT_MAP[user.tenantId] || { label: user.tenantId, flag: "🌐" }
    : null;

  return (
    <Sidebar {...props}>
      <SidebarContent>
        {/* === DEĞİŞİKLİK BURADA BAŞLIYOR === */}
        {/* Tenant (Ülke) Görüntüleme Alanı */}
        <div className="p-2 border-b border-sidebar-border">
          {isLoading ? (
            // Yüklenirken Skeleton göster
            <div className="flex items-center gap-2 p-2 h-[40px]">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ) : currentTenantInfo ? (
            <div
              className="flex items-center justify-between p-2 h-[40px]"
              title={`Mevcut Operasyon Ülkesi: ${currentTenantInfo.label}`}
            >
              {/* Sol taraf (Bayrak ve İsim) */}
              <div className="flex items-center gap-2 truncate">
                <span className="text-lg leading-none">
                  {currentTenantInfo.flag}
                </span>
                <span className="text-sm font-medium text-sidebar-foreground truncate">
                  {currentTenantInfo.label}
                </span>
              </div>

              {/* YENİ BUTON EKLENDİ (Sağ Taraf) - TOOLTIP KALDIRILDI VE İKON DEĞİŞTİ */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
                onClick={() => logout()}
                aria-label={t("auth.logout")}
              >
                <Power className="h-4 w-4" /> {/* İKON DEĞİŞTİ */}
              </Button>
              {/* BUTON SONU */}

            </div>
          ) : (
            // Kullanıcı yoksa (bir hata oluştuysa)
            <div className="flex items-center gap-2 p-2 h-[40px]">
              <span className="text-lg leading-none">❓</span>
              <span className="text-sm font-medium text-sidebar-foreground/50">
                Kullanıcı bilgisi yok
              </span>
            </div>
          )}
        </div>
        {/* === DEĞİŞİKLİK SONA ERDİ === */}

        <NavMain items={sidebarItems} lng={lng} />
      </SidebarContent>

      <SidebarFooter className="py-3 px-4 text-center">
        {/* Çıkış butonu buradan kaldırıldı */}
        <div className="flex flex-col items-center justify-center text-[10px] font-medium text-sidebar-foreground/50">
          Powered By
          <span className="pt-0.5 text-sm font-semibold text-sidebar-foreground/80">
            acrtech
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}