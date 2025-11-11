// aj-client/src/app/[lng]/(main)/dashboard/inventory/definitions/materials/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { MaterialDefinition } from "./material-definition-form"; // Formdan tipi al

export const createMaterialDefinitionColumns = ({
  onEdit,
  onDelete,
  t,
}: {
  onEdit: (item: MaterialDefinition) => void;
  onDelete: (item: MaterialDefinition) => void;
  t: (key: string) => string;
}): ColumnDef<MaterialDefinition>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.material.column.name")}
        t={t}
      />
    ),
  },
  {
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.material.column.code")}
        t={t}
      />
    ),
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.material.column.description")}
        t={t}
      />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground truncate">
        {row.original.description || "---"}
      </span>
    ),
  },
  {
    id: "actions",
    header: () => (
      <div className="text-right">{t("masterdata.material.column.actions")}</div>
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