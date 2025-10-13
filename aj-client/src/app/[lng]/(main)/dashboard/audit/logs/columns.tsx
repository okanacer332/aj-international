// aj-client/src/app/[lng]/(main)/dashboard/audit/logs/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { AuditLog } from "@/types/audit-log";
import { Badge } from "@/components/ui/badge";

// Bu bileşen action'ı alır ancak çevirisi statik değil,
// backend'den gelen action key'ine (USER_LOGIN_SUCCESS, USER_DELETED vb.) göre renk verir.
// Action metninin kendisi (action) backend'den geldiği için sadece renk ayarı çeviriye ihtiyaç duymaz.
const ActionBadge = ({ action }: { action: string }) => {
  let variant: "secondary" | "destructive" | "default" = "default";
  if (action.includes("SUCCESS")) {
    variant = "secondary";
  } else if (action.includes("FAILURE") || action.includes("DELETED")) {
    variant = "destructive";
  }
  return <Badge variant={variant}>{action}</Badge>;
};

// KRİTİK DEĞİŞİKLİK: columns array'i bir fonksiyona dönüştürüldü.
export const createAuditLogColumns = (t: (key: string) => string): ColumnDef<AuditLog>[] => [
  {
    accessorKey: "timestamp",
    // ÇEVİRİ: Sütun Başlığı
    header: t("audit.log.column.timestamp"),
    cell: ({ row }) => {
      const date = new Date(row.getValue("timestamp"));
      // KRİTİK DÜZELTME: toLocaleString dil kodunu (lng) almadığı için,
      // her iki dil için de (tr ve en) doğru formatta görünmesi için
      // basitçe toLocaleString() çağırılabilir ya da 'en-US' formatı zorlanabilir.
      // Şimdilik tr-TR kuralını koruyalım.
      return <span>{date.toLocaleString('tr-TR')}</span>; 
    },
  },
  {
    accessorKey: "username",
    // ÇEVİRİ: Sütun Başlığı
    header: t("audit.log.column.username"),
  },
  {
    accessorKey: "action",
    // ÇEVİRİ: Sütun Başlığı
    header: t("audit.log.column.action"),
    cell: ({ row }) => <ActionBadge action={row.getValue("action")} />,
  },
  {
    accessorKey: "details",
    // ÇEVİRİ: Sütun Başlığı
    header: t("audit.log.column.details"),
  },
  {
    accessorKey: "ipAddress",
    // ÇEVİRİ: Sütun Başlığı
    header: t("audit.log.column.ipAddress"),
  },
];