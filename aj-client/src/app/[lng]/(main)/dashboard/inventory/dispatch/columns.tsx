"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
// import { InventoryDispatchResponse } from "@/modules/inventory/dto/InventoryDispatchResponse"; // <--- KAPATILDI (HATA VERİYORDU)
import { format } from "date-fns";
import { tr, enUS, es, ru } from "date-fns/locale";

// --- BUILD HATALARINI AŞMAK İÇİN GEÇİCİ TİP TANIMLARI ---
type InventoryDispatchResponse = any;
type Locale = any;
// ---------------------------------------------------------

const locales: { [key: string]: Locale } = {
  tr: tr,
  en: enUS,
  es: es,
  ru: ru,
  ar: enUS, 
};

export const createDispatchColumns = ({
  onEdit,
  onDelete,
  t,
  lng,
}: {
  onEdit: (item: InventoryDispatchResponse) => void;
  onDelete: (item: InventoryDispatchResponse) => void;
  t: (key: string) => string;
  lng: string;
}): ColumnDef<InventoryDispatchResponse>[] => [
  {
    accessorKey: "dispatchDate",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("inventory.dispatch.column.date")}
        t={t}
      />
    ),
    cell: ({ row }) => {
        const date = format(new Date(row.original.dispatchDate), "PPP", { locale: locales[lng] || enUS });
        const time = row.original.dispatchTime.substring(0, 5);
        return (
            <div>
                <div>{date}</div>
                <div className="text-xs text-muted-foreground">{time}</div>
            </div>
        );
    },
  },
  {
    accessorKey: "customerName",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("inventory.dispatch.column.customer")}
        t={t}
      />
    ),
  },
  {
    accessorKey: "dispatchDepotName",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("inventory.dispatch.column.depot")}
        t={t}
      />
    ),
  },
  {
    accessorKey: "truckPlate",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("inventory.dispatch.column.truckPlate")}
        t={t}
      />
    ),
  },
  {
    accessorKey: "containerNo",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("inventory.dispatch.column.containerNo")}
        t={t}
      />
    ),
  },
  {
    id: "totalWeight",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("inventory.dispatch.column.totalWeight")}
        t={t}
      />
    ),
    cell: ({ row }) => {
        const total = row.original.lines.reduce((acc: any, line: any) => acc + (line.weightKg || 0), 0);
        return <span>{total.toFixed(3)}</span>;
    },
  },
  {
    id: "actions",
    header: () => (
      <div className="text-right">{t("inventory.dispatch.column.actions")}</div>
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