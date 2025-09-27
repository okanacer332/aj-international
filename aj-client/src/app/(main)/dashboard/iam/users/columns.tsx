"use client";

import { ColumnDef } from "@tanstack/react-table";
import { User } from "@/types/user";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "fullName",
    header: "Ad Soyad",
  },
  {
    accessorKey: "username",
    header: "Kullanıcı Adı",
  },
  {
    accessorKey: "email",
    header: "Email",
    // E-posta yoksa "---" göster
    cell: ({ row }) => row.getValue("email") || "---",
  },
  {
    accessorKey: "roleIds", // Backend'den gelen alanın adı 'roleIds'
    header: "Roller",
    cell: ({ row }) => {
      // DEĞİŞİKLİK BURADA: 'roleIds' tanımsız veya boş olabilir diye kontrol ekliyoruz.
      const roleIds = row.getValue("roleIds") as string[] | undefined;

      // Eğer roleIds yoksa veya boş bir diziyse, "Rol Atanmamış" yaz.
      if (!roleIds || roleIds.length === 0) {
        return <span className="text-muted-foreground">Rol Atanmamış</span>;
      }

      // Not: Şimdilik ID'leri gösteriyoruz. İleride rol isimlerini getireceğiz.
      return (
        <div className="flex flex-wrap gap-1">
          {roleIds.map((roleId) => (
            <Badge key={roleId} variant="outline">{roleId}</Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "active",
    header: "Durum",
    cell: ({ row }) => {
      const isActive = row.getValue("active");
      return <Badge variant={isActive ? "secondary" : "destructive"}>{isActive ? "Aktif" : "Pasif"}</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="text-right">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Menüyü aç</span>
                <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(user.id)}
                >
                Kullanıcı ID'sini kopyala
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Düzenle</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive">Sil</DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      );
    },
  },
];