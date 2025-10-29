// aj-client/src/app/[lng]/(main)/dashboard/iam/users/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { User } from "@/types/user";
import { MoreHorizontal, Globe } from "lucide-react"; // Globe ikonu eklendi
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
// DataTableColumnHeader'ı import edelim (sıralama/gizleme için)
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

// Ülke seçenekleri (AddUserForm'daki ile aynı)
const tenantOptions = [
  { value: "TR", label: "Türkiye", flag: "🇹🇷" },
  { value: "RU", label: "Россия", flag: "🇷🇺" },
  { value: "AE", label: "Dubai (UAE)", flag: "🇦🇪" },
  // İhtiyaç olursa 'SYSTEM' veya bilinmeyen tenantlar için bir fallback ekleyebiliriz
  { value: "SYSTEM", label: "Sistem", flag: "⚙️" },
];

// Helper fonksiyonu tenant bilgisini almak için
const getTenantInfo = (tenantId: string | null | undefined) => {
    if (!tenantId) return { label: "??", flag: "❓" };
    return tenantOptions.find(opt => opt.value === tenantId) || { label: tenantId, flag: '🌐' };
};

export const createIAMUserColumns = ({ t, openEditDialog, openDeleteDialog }: {
  t: (key: string) => string;
  openEditDialog: (user: User) => void;
  openDeleteDialog: (user: User) => void;
}): ColumnDef<User>[] => [
  {
    accessorKey: "fullName",
    // Sıralama/gizleme için DataTableColumnHeader kullanıldı
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t("iam.user.column.fullName")} />
    ),
    cell: ({ row }) => row.getValue("fullName"), // Hücre içeriği basitçe değer
  },
  {
    accessorKey: "username",
    header: ({ column }) => (
       <DataTableColumnHeader column={column} title={t("iam.user.column.username")} />
    ),
     cell: ({ row }) => row.getValue("username"),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
       <DataTableColumnHeader column={column} title={t("iam.user.column.email")} />
    ),
    cell: ({ row }) => row.getValue("email") || t("iam.user.noEmail"),
  },
  // --- YENİ SÜTUN: Tenant ID ---
  {
    accessorKey: "tenantId",
    header: ({ column }) => (
      // Yeni çeviri anahtarı: "iam.user.column.tenantId"
      <DataTableColumnHeader column={column} title={t("iam.user.column.tenantId", "Ülke")} />
    ),
    cell: ({ row }) => {
      const tenantId = row.getValue("tenantId") as string;
      const tenantInfo = getTenantInfo(tenantId);
      return (
        <div className="flex items-center gap-2">
           <span title={tenantInfo.label}>{tenantInfo.flag}</span>
           <span className="hidden sm:inline">{tenantInfo.label}</span> {/* Küçük ekranlarda sadece bayrak */}
        </div>
      );
    },
    // Filtreleme veya sıralama istenirse eklenebilir
    enableSorting: true,
    enableHiding: true,
  },
  // --- YENİ SÜTUN SONU ---
  {
    accessorKey: "roleIds",
    header: t("iam.user.column.roles"), // Rollerde sıralama/gizleme genellikle istenmez
    cell: ({ row }) => { /* ... rol hücre içeriği aynı ... */
      const roleIds = row.getValue("roleIds") as string[] | undefined;
      if (!roleIds || roleIds.length === 0) {
        return <span className="text-muted-foreground">{t("iam.user.roleNotAssigned")}</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {roleIds.map((roleId) => (
            // Rol ID yerine Rol Adını göstermek daha iyi olabilir (Backend'den User'a rol isimleri eklenmeli)
            <Badge key={roleId} variant="outline">{roleId}</Badge>
          ))}
        </div>
      );
     },
     enableSorting: false, // Rollere göre sıralama mantıklı değil
     enableHiding: true,
  },
  {
    accessorKey: "active",
    header: ({ column }) => (
       <DataTableColumnHeader column={column} title={t("iam.user.column.status")} />
    ),
    cell: ({ row }) => { /* ... durum hücre içeriği aynı ... */
      const isActive = row.getValue("active");
      return <Badge variant={isActive ? "secondary" : "destructive"}>{isActive ? t("iam.user.status.active") : t("iam.user.status.inactive")}</Badge>;
    },
    enableSorting: true,
    enableHiding: true,
    // Duruma göre filtreleme eklemek istersen:
    // filterFn: (row, id, value) => {
    //   return value.includes(row.getValue(id) ? 'active' : 'inactive')
    // },
  },
  {
    id: "actions",
    cell: ({ row }) => { /* ... aksiyon hücre içeriği aynı ... */
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
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                    {t("iam.user.actions.copyID")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openEditDialog(user)}>
                   {t("iam.user.actions.edit")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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
     enableSorting: false,
     enableHiding: false, // Aksiyonları gizlememek lazım
  },
];