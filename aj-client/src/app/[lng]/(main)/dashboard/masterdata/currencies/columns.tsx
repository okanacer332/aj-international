"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CurrencyDefinition } from "@/types/currency-definition";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";

export const createCurrencyDefinitionColumns = ({
  onEdit,
  onDelete,
  t,
}: {
  onEdit: (currency: CurrencyDefinition) => void;
  onDelete: (currency: CurrencyDefinition) => void;
  t: (key: string) => string;
}): ColumnDef<CurrencyDefinition>[] => [
  {
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.currency.column.code")}
        t={t}
      />
    ),
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono">
        {row.original.code}
      </Badge>
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.currency.column.name")}
        t={t}
      />
    ),
  },
  {
    id: "actions",
    header: () => (
      <div className="text-right">{t("masterdata.currency.column.actions")}</div>
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