"use client";

import { ColumnDef } from "@tanstack/react-table";
import { UnitDefinition } from "@/types/unit-definition"; // Bu tip zaten güncellendi
import { Button } from "@/components/ui/button";
import { Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";

export const createUnitDefinitionColumns = ({
  onEdit,
  onDelete,
  t,
}: {
  onEdit: (unit: UnitDefinition) => void;
  onDelete: (unit: UnitDefinition) => void;
  t: (key: string) => string;
}): ColumnDef<UnitDefinition>[] => [
  {
    accessorKey: "departmentName",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.unit.column.departmentName")}
      />
    ),
  },
  {
    accessorKey: "unitName",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.unit.column.unitName")}
      />
    ),
  },
  {
    accessorKey: "competencyRequired", // <-- 'isCompetencyRequired' idi, 'competencyRequired' olarak değişti
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.unit.column.isCompetencyRequired")}
      />
    ),
    cell: ({ row }) => {
      const isRequired = row.original.competencyRequired; // <-- 'isCompetencyRequired' idi, 'competencyRequired' olarak değişti
      return isRequired ? (
        <Badge variant="secondary" className="text-green-600">
          <CheckCircle className="mr-1 h-3 w-3" />
          {t("masterdata.unit.status.required")}
        </Badge>
      ) : (
        <Badge variant="outline">
          <XCircle className="mr-1 h-3 w-3 text-muted-foreground" />
          {t("masterdata.unit.status.notRequired")}
        </Badge>
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