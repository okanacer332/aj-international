// aj-client/src/app/[lng]/(main)/dashboard/_components/sidebar/account-switcher.tsx
"use client";

import Link from "next/link";
// CreditCard ve Bell kaldırıldı
import { BadgeCheck, LogOut } from "lucide-react"; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";
import { logout } from "@/lib/auth";
import { API_BASE } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth-store";
// YENİ IMPORT: i18n desteği için
import { useTranslation } from "@/lib/i18n-client"; 

// AccountSwitcher artık dil (lng) parametresini almalı
export function AccountSwitcher({ lng }: { lng: string }) {
  const { user } = useAuthStore();
  // YENİ KULLANIM: Çeviri hook'u eklendi
  const { t, ready } = useTranslation(lng, 'common');

  if (!user || !ready) { // ready kontrolü eklendi
    return <Skeleton className="h-9 w-9 rounded-lg" />;
  }
  
  const avatarSrc = user.avatarUrl ? `${API_BASE}${user.avatarUrl}` : undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-9 cursor-pointer rounded-lg">
          <AvatarImage src={avatarSrc} alt={user.fullName} />
          <AvatarFallback className="rounded-lg">{getInitials(user.fullName)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56 space-y-1 rounded-lg" side="bottom" align="end" sideOffset={4}>
        <div className="p-2">
            <p className="font-semibold">{user.fullName}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href={`/${lng}/dashboard/account/settings`} passHref> 
            <DropdownMenuItem>
              <BadgeCheck className="mr-2 h-4 w-4" />
              {/* Çeviri anahtarı kullanıldı */}
              {t('account.myAccount')} 
            </DropdownMenuItem>
          </Link>
          {/* "Billing" ve "Notifications" öğeleri KALDIRILDI */}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); logout(); }}>
          <LogOut className="mr-2 h-4 w-4" />
          {/* Çeviri anahtarı kullanıldı */}
          {t('auth.logout')} 
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 