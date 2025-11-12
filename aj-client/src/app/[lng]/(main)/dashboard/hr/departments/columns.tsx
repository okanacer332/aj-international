"use client";

import { ColumnDef } from "@tanstack/react-table";
import { UnitDefinition } from "@/types/unit-definition";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";

// Bu arayüz, page.tsx'ten düzleştirilmiş veriyi almak için kullanılır
export interface FlatUnitDefinition extends UnitDefinition {
  level: number;
}

// Bu arayüz, page.tsx'ten unitMap'i almak için kullanılır
export type UnitMap = Map<string, { name: string; parentName?: string }>;

export const createDepartmentColumns = ({
  onEdit,
  onDelete,
  t,
  unitMap,
}: {
  onEdit: (unit: UnitDefinition) => void;
  onDelete: (unit: UnitDefinition) => void;
  t: (key: string) => string;
  unitMap: UnitMap;
}): ColumnDef<FlatUnitDefinition>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.unit.column.name")} // "Adı"
        t={t}
      />
    ),
    cell: ({ row }) => {
      // Ünite ise (level > 0) adını biraz içeriden başlat
      const indentPadding = `${row.original.level * 1.5}rem`;
      return (
        <span style={{ paddingLeft: indentPadding }}>
          {row.original.name}
        </span>
      );
    },
    minSize: 300,
  },
  {
    id: "type",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.unit.column.type")} // YENİ: "Tipi"
        t={t}
      />
    ),
    cell: ({ row }) => {
      const isDepartment = row.original.level === 0;
      return isDepartment ? (
        <Badge variant="default">
          {t("masterdata.unit.type.department")}
        </Badge>
      ) : (
        <Badge variant="outline">
          {t("masterdata.unit.type.unit")}
        </Badge>
      );
    },
    size: 150,
    filterFn: (row, id, value: string[]) => {
      const rowValue = row.original.level === 0 ? "department" : "unit";
      return value.includes(rowValue);
    },
  },
  {
    id: "parentName",
    accessorKey: "parentUnitId",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.unit.column.parentName")} // YENİ: "Bağlı Olduğu Departman"
        t={t}
      />
    ),
    cell: ({ row }) => {
      const parentId = row.original.parentUnitId;
      if (!parentId) {
        return <span className="text-muted-foreground">---</span>;
      }
      const parent = unitMap.get(parentId);
      return parent ? parent.name : <span className="text-muted-foreground">?</span>;
    },
    filterFn: (row, id, value: string[]) => {
        // "null" filtresi Departmanları (parent'ı olmayanları) getirir
        const rowValue = row.original.parentUnitId || "null"; 
        return value.includes(rowValue);
    },
  },
  {
    accessorKey: "competencyRequired",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.unit.column.isCompetencyRequired")}
        t={t}
      />
    ),
    cell: ({ row }) => {
      const isRequired = row.original.competencyRequired;
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
    filterFn: (row, id, value: string[]) => {
      const rowValue = row.getValue(id) ? "true" : "false";
      return value.includes(rowValue);
    },
    size: 150,
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
          aria-label={t("masterdata.product.aria.edit")}
        >
          <Edit className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          onClick={() => onDelete(row.original)}
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