// aj-client/src/app/[lng]/(main)/dashboard/iam/users/columns.tsx
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

// KRİTİK DEĞİŞİKLİK: columns array'i bir fonksiyona dönüştürüldü ve yeni prop'lar eklendi
export const createIAMUserColumns = ({ t, openEditDialog, openDeleteDialog }: {
  t: (key: string) => string;
  openEditDialog: (user: User) => void;
  openDeleteDialog: (user: User) => void;
}): ColumnDef<User>[] => [
  {
    accessorKey: "fullName",
    header: t("iam.user.column.fullName"),
  },
  {
    accessorKey: "username",
    header: t("iam.user.column.username"),
  },
  {
    accessorKey: "email",
    header: t("iam.user.column.email"),
    cell: ({ row }) => row.getValue("email") || t("iam.user.noEmail"),
  },
  {
    accessorKey: "roleIds", 
    header: t("iam.user.column.roles"),
    cell: ({ row }) => {
      const roleIds = row.getValue("roleIds") as string[] | undefined;

      if (!roleIds || roleIds.length === 0) {
        return <span className="text-muted-foreground">{t("iam.user.roleNotAssigned")}</span>;
      }

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
    header: t("iam.user.column.status"),
    cell: ({ row }) => {
      const isActive = row.getValue("active");
      return <Badge variant={isActive ? "secondary" : "destructive"}>{isActive ? t("iam.user.status.active") : t("iam.user.status.inactive")}</Badge>;
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
                <span className="sr-only">{t("iam.user.aria.openMenu")}</span>
                <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t("iam.user.actions.label")}</DropdownMenuLabel>
                <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(user.id)}
                >
                {t("iam.user.actions.copyID")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                
                {/* DÜZENLE: openEditDialog'u çağırır */}
                <DropdownMenuItem onClick={() => openEditDialog(user)}>
                   {t("iam.user.actions.edit")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                
                {/* KRİTİK DÜZELTME: Silme aksiyonunu çağırır, bu da ana sayfada AlertDialog'u tetikler. */}
                <DropdownMenuItem 
                    onClick={() => openDeleteDialog(user)}
                    className="text-destructive focus:text-destructive"
                >
                    {t("iam.user.actions.delete")}
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      );
    },
  },
];