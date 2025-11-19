"use client";

import { ColumnDef } from "@tanstack/react-table";
import { GiftRecord } from "@/types/gift-record";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
// i18n için locale importlarını ekleyebilirsin, 
// ama basitlik için şimdilik numerik tarih (dd.MM.yyyy) kullanacağız veya page'den locale geçirebiliriz.
// Burada basitlik adına "dd.MM.yyyy" kullanıyorum, bu evrenseldir.

export const createGiftColumns = ({
  onDelete,
  t,
}: {
  onDelete: (item: GiftRecord) => void;
  t: (key: string) => string;
}): ColumnDef<GiftRecord>[] => [
  {
    accessorKey: "date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t("hr.gifts.table.date")} t={t} />
    ),
    cell: ({ row }) => format(new Date(row.original.date), "dd.MM.yyyy"),
  },
  {
    accessorKey: "recipientName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t("hr.gifts.table.recipient")} t={t} />
    ),
  },
  {
    accessorKey: "recipientType",
    header: t("hr.gifts.table.type"),
    cell: ({ row }) => (
      <Badge variant={row.original.recipientType === "USER" ? "secondary" : "outline"}>
        {row.original.recipientType === "USER" 
          ? t("hr.gifts.form.type.user") 
          : t("hr.gifts.form.type.personnel")}
      </Badge>
    ),
  },
  {
    accessorKey: "description",
    header: t("hr.gifts.table.description"),
    cell: ({ row }) => <span className="text-muted-foreground text-sm truncate max-w-[200px] block">{row.original.description || "-"}</span>,
  },
  {
    id: "products",
    header: t("hr.gifts.table.products"),
    cell: ({ row }) => {
      const count = row.original.lines.length;
      const firstItem = row.original.lines[0]?.productName || t("hr.gifts.form.product");
      return (
        <span className="text-sm">
          {firstItem} {count > 1 && `(+${count - 1} ${t("hr.gifts.table.otherProducts")})`}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(row.original)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];