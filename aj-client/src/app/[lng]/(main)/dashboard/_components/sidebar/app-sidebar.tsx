// src/app/[lng]/(main)/dashboard/_components/sidebar/app-sidebar.tsx
"use client";

import { Sidebar, SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { NavMain } from "./nav-main";
// GÜNCELLEME 1: Gerekli importlar eklendi
import { useAuthStore } from "@/stores/auth-store";
import { useTranslation } from "@/lib/i18n-client";
import { Skeleton } from "@/components/ui/skeleton";

// GÜNCELLEME 2: Tenant (Ülke) bilgisini bayrak ve isme dönüştürmek için harita
type TenantInfo = { label: string; flag: string };

// login-form.tsx'deki tenant listesini/(main)/auth/_components/login-form.tsx: 25-30] temel alıyoruz.
const getTenantDisplayMap = (): Record<string, TenantInfo> => ({
  "TR": { label: "Türkiye", flag: "🇹🇷" },
  "RU": { label: "Rusya", flag: "🇷🇺" },
  "DU": { label: "Dubai", flag: "🇦🇪" },
  // Süper Admin'in label'ı login-form'dan/(main)/auth/_components/login-form.tsx: 30]
  "SYSTEM": { label: "Süper Admin", flag: "⚙️" }, 
});

// DEĞİŞİKLİK BURADA: 'lng' prop'unu alacak şekilde tipi güncelliyoruz
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  lng: string;
}

export function AppSidebar({ lng, ...props }: AppSidebarProps) {
  
  // GÜNCELLEME 3: Auth state'i ve i18n'i çağır
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const { ready } = useTranslation(lng, 'common'); // Sadece 'ready' durumunu alıyoruz
  
  const isLoading = !ready || isAuthLoading;

  // GÜNCELLEME 4: Görüntülenecek tenant bilgisini hesapla
  const TENANT_MAP = getTenantDisplayMap();
  const currentTenantInfo = user 
    ? TENANT_MAP[user.tenantId] || { label: user.tenantId, flag: "🌐" } 
    : null;

  return (
    <Sidebar {...props}>
      <SidebarContent>
        
        {/* GÜNCELLEME 5: Tenant (Ülke) Görüntüleme Alanı */}
        <div className="p-2 border-b border-sidebar-border">
          {isLoading ? (
            // Yüklenirken Skeleton göster
            <div className="flex items-center gap-2 p-2 h-[40px]">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ) : currentTenantInfo ? (
            // Yüklendiğinde Tenant bilgisini göster
            <div 
              className="flex items-center gap-2 p-2 h-[40px]"
              title={`Mevcut Operasyon Ülkesi: ${currentTenantInfo.label}`}
            >
              <span className="text-lg leading-none">{currentTenantInfo.flag}</span>
              <span className="text-sm font-medium text-sidebar-foreground truncate">
                {currentTenantInfo.label}
              </span>
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
        
        {/* DEĞİŞİKLİK BURADA: NavMain'e 'lng' prop'unu aktarıyoruz */}
        <NavMain items={sidebarItems} lng={lng} />
      </SidebarContent>
      
      <SidebarFooter className="py-3 px-4 text-center">
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