"use client";

import { ColumnDef } from "@tanstack/react-table";
import { AuditLog } from "@/types/audit-log";
import { Badge } from "@/components/ui/badge";

const ActionBadge = ({ action }: { action: string }) => {
  let variant: "secondary" | "destructive" | "default" = "default";
  if (action.includes("SUCCESS")) {
    variant = "secondary";
  } else if (action.includes("FAILURE") || action.includes("DELETED")) {
    variant = "destructive";
  }
  return <Badge variant={variant}>{action}</Badge>;
};


export const columns: ColumnDef<AuditLog>[] = [
  {
    accessorKey: "timestamp",
    header: "Zaman Damgası",
    cell: ({ row }) => {
      const date = new Date(row.getValue("timestamp"));
      return <span>{date.toLocaleString('tr-TR')}</span>;
    },
  },
  {
    accessorKey: "username",
    header: "Kullanıcı",
  },
  {
    accessorKey: "action",
    header: "Eylem",
    cell: ({ row }) => <ActionBadge action={row.getValue("action")} />,
  },
  {
    accessorKey: "details",
    header: "Detaylar",
  },
  {
    accessorKey: "ipAddress",
    header: "IP Adresi",
  },
];