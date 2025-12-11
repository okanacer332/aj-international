"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
// import { InventoryEntryResponse } from "@/modules/inventory/dto/InventoryEntryResponse"; // KAPATILDI
import { format } from "date-fns";
import { tr, enUS, es, ru } from "date-fns/locale";

// --- BUILD İÇİN GEÇİCİ TİPLER ---
type InventoryEntryResponse = any;
type Locale = any;
// --------------------------------

const locales: { [key: string]: Locale } = {
  tr: tr,
  en: enUS,
  es: es,
  ru: ru,
  ar: enUS, 
};

export const createEntryColumns = ({
  onEdit,
  onDelete,
  t,
  lng,
}: {
  onEdit: (item: InventoryEntryResponse) => void;
  onDelete: (item: InventoryEntryResponse) => void;
  t: (key: string) => string;
  lng: string;
}): ColumnDef<InventoryEntryResponse>[] => [
  {
    accessorKey: "entryDate",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("inventory.entry.column.date")}
        t={t}
      />
    ),
    cell: ({ row }) => {
        const date = format(new Date(row.original.entryDate), "PPP", { locale: locales[lng] || enUS });
        const time = row.original.entryTime.substring(0, 5);
        return (
            <div>
                <div>{date}</div>
                <div className="text-xs text-muted-foreground">{time}</div>
            </div>
        );
    },
  },
  {
    accessorKey: "supplierName",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("inventory.entry.column.supplier")}
        t={t}
      />
    ),
  },
  {
    accessorKey: "targetDepotName",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("inventory.entry.column.depot")}
        t={t}
      />
    ),
  },
  {
    accessorKey: "truckPlate",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("inventory.entry.column.truckPlate")}
        t={t}
      />
    ),
  },
  {
    id: "totalWeight",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("inventory.entry.column.totalWeight")}
        t={t}
      />
    ),
    cell: ({ row }) => {
        // ✅ DÜZELTME: acc ve line için açıkça 'any' tipi verildi
        const total = row.original.lines.reduce((acc: any, line: any) => acc + (line.scaleWeight || 0), 0);
        return <span>{total.toFixed(3)}</span>;
    },
  },
  {
    id: "actions",
    header: () => (
      <div className="text-right">{t("inventory.entry.column.actions")}</div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-end space-x-1">
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          onClick={() => onEdit(row.original)}
        >
          <Edit className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          onClick={() => onDelete(row.original)}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];