"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MeasureDefinition } from "@/types/measure-definition";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

export const createMeasureDefinitionColumns = ({
  onEdit,
  onDelete,
  t,
}: {
  onEdit: (measure: MeasureDefinition) => void;
  onDelete: (measure: MeasureDefinition) => void;
  t: (key: string) => string;
}): ColumnDef<MeasureDefinition>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.measure.column.name")}
      />
    ),
  },
  {
    id: "actions",
    header: () => (
      <div className="text-right">{t("masterdata.measure.column.actions")}</div>
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