"use client";

import { ColumnDef } from "@tanstack/react-table";
import { AuditLog } from "@/types/audit-log";
import { Badge } from "@/components/ui/badge";
// 1. YENİ İMPORT: Sıralama için başlık bileşeni
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

const ActionBadge = ({ action }: { action: string }) => {
  let variant: "secondary" | "destructive" | "default" = "default";
  if (action.includes("SUCCESS")) {
    variant = "secondary";
  } else if (action.includes("FAILURE") || action.includes("DELETED")) {
    variant = "destructive";
  }
  return <Badge variant={variant}>{action}</Badge>;
};

export const createAuditLogColumns = (
  t: (key: string) => string
): ColumnDef<AuditLog>[] => [
  {
    accessorKey: "timestamp",
    // 2. GÜNCELLEME: Başlık 'DataTableColumnHeader' ile sarıldı
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("audit.log.column.timestamp")}
        t={t} // 't' fonksiyonu aktarıldı
      />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("timestamp"));
      // 'tr-TR' sabit kalabilir, veya 'lng' prop'u buraya da taşınabilir.
      // Şimdilik stabilite için 'tr-TR' bırakıyorum.
      return <span>{date.toLocaleString("tr-TR")}</span>;
    },
  },
  {
    accessorKey: "username",
    // 3. GÜNCELLEME: Başlık 'DataTableColumnHeader' ile sarıldı
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("audit.log.column.username")}
        t={t}
      />
    ),
  },
  {
    accessorKey: "action",
    // 4. GÜNCELLEME: Başlık 'DataTableColumnHeader' ile sarıldı
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("audit.log.column.action")}
        t={t}
      />
    ),
    cell: ({ row }) => <ActionBadge action={row.getValue("action")} />,
  },
  {
    accessorKey: "details",
    // 5. GÜNCELLEME: (Sıralanamaz)
    header: t("audit.log.column.details"),
    enableSorting: false,
  },
  {
    accessorKey: "ipAddress",
    // 6. GÜNCELLEME: Başlık 'DataTableColumnHeader' ile sarıldı
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("audit.log.column.ipAddress")}
        t={t}
      />
    ),
  },
];