"use client";

import Link from "next/link";
import { BadgeCheck, Bell, CreditCard, LogOut } from "lucide-react";
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
import { useAuthStore } from "@/stores/auth-store"; // Zustand store import edildi

export function AccountSwitcher() {
  // --- DEĞİŞİKLİK: Yerel state yerine global store'u kullan ---
  const { user } = useAuthStore();

  if (!user) {
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
          <Link href="/dashboard/account/settings" passHref>
            <DropdownMenuItem>
              <BadgeCheck className="mr-2 h-4 w-4" />
              Hesabım
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem>
            <CreditCard className="mr-2 h-4 w-4" />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); logout(); }}>
          <LogOut className="mr-2 h-4 w-4" />
          Çıkış Yap
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}