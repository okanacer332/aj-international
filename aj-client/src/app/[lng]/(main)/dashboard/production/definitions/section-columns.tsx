"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ProductionUnitDefinition } from "@/types/production-unit-definition";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

// Bu, sadece Bölümleri (alt birimleri) listelemek için basit bir tanımdır
export const createSectionColumns = ({
  onEdit,
  onDelete,
  t,
}: {
  onEdit: (unit: ProductionUnitDefinition) => void;
  onDelete: (unit: ProductionUnitDefinition) => void;
  t: (key: string) => string;
}): ColumnDef<ProductionUnitDefinition>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        // "Grup / Bölüm Adı" yerine "Bölüm Adı"
        title={t("production.unit.field.name", "Bölüm Adı")} 
        t={t}
      />
    ),
    cell: ({ row }) => {
      return (
        <span className="font-medium">{row.original.name}</span>
      );
    },
  },
  {
    id: "actions",
    header: () => (
      <div className="text-right">{t("masterdata.unit.column.actions")}</div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-end space-x-1">
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(row.original);
          }}
          aria-label={t("masterdata.product.aria.edit")}
        >
          <Edit className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(row.original);
          }}
          aria-label={t("masterdata.product.aria.delete")}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 80,
  },
];