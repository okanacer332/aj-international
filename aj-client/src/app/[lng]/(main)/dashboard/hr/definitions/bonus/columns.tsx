"use client";

import { ColumnDef } from "@tanstack/react-table";
import { BonusDefinition } from "@/types/bonus-definition";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";

export const createBonusColumns = ({
  onEdit,
  onDelete,
  t,
}: {
  onEdit: (item: BonusDefinition) => void;
  onDelete: (item: BonusDefinition) => void;
  t: (key: string) => string;
}): ColumnDef<BonusDefinition>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t("hr.bonus.column.name")} t={t} />,
  },
  {
    id: "productionInfo",
    header: t("hr.bonus.column.production"),
    cell: ({ row }) => (
      <div className="flex flex-col text-sm">
        <span className="font-semibold">{row.original.groupName}</span>
        <span className="text-muted-foreground text-xs">{row.original.sectionName}</span>
      </div>
    ),
  },
  {
    accessorKey: "thresholdPercent",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t("hr.bonus.column.threshold")} t={t} />,
    cell: ({ row }) => <Badge variant="outline">%{row.original.thresholdPercent}</Badge>,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <DataTableColumnHeader column={column} title={t("hr.bonus.column.amount")} t={t} />,
    cell: ({ row }) => (
      <span className="font-mono font-medium">
        {row.original.amount} {row.original.currencyCode}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="sm" onClick={() => onEdit(row.original)}><Edit className="size-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(row.original)}><Trash2 className="size-4 text-destructive" /></Button>
      </div>
    ),
  },
];