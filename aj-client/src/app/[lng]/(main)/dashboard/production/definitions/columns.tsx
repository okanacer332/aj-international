"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { ProductionUnitDefinition } from "@/types/production-unit-definition";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  Package, // Grup ikonu
  ClipboardList, // Bölüm ikonu
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

// Arayüz aynı kalır
export interface FlatProductionUnitDefinition extends ProductionUnitDefinition {
  level: number;
}

export type UnitMap = Map<string, { name: string; parentName?: string }>;

export const createProductionUnitColumns = ({
  onEdit,
  onDelete,
  t,
  unitMap,
}: {
  onEdit: (unit: ProductionUnitDefinition) => void;
  onDelete: (unit: ProductionUnitDefinition) => void;
  t: (key: string) => string;
  unitMap: UnitMap;
  // onToggleExpand prop'u kaldırıldı
}): ColumnDef<FlatProductionUnitDefinition>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("production.unit.column.name")}
        t={t}
      />
    ),
    cell: ({ row }: { row: Row<FlatProductionUnitDefinition> }) => {
      const unit = row.original;
      const level = unit.level ?? 0;
      // DÜZELTME: Girinti için artık 1.5rem (level 1) veya 0 (level 0) kullanıyoruz
      const indentPadding = `${level * 1.5}rem`;

      // Akordiyon butonu kaldırıldı.
      // Sadece ikonu gösteriyoruz.
      const icon =
        level === 0 ? (
          <Package className="size-4 text-primary mr-2" />
        ) : (
          <ClipboardList className="size-4 text-muted-foreground mr-2" />
        );

      return (
        <div
          className={cn(
            "flex items-center space-x-1",
            level > 0 ? "text-muted-foreground font-normal" : "font-semibold"
          )}
          style={{ paddingLeft: indentPadding }} // Girinti burada uygulanıyor
        >
          {/* toggleButton kaldırıldı */}
          {icon}
          <span className="truncate">{unit.name}</span>
        </div>
      );
    },
    minSize: 300,
  },
  {
    id: "type",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("production.unit.column.type")}
        t={t}
      />
    ),
    cell: ({ row }) => {
      const isGroup = row.original.level === 0;
      return isGroup ? (
        <Badge variant="default">
          {t("production.unit.type.group")}
        </Badge>
      ) : (
        <Badge variant="outline">
          {t("production.unit.type.section")}
        </Badge>
      );
    },
    size: 150,
    filterFn: (row, id, value: string[]) => {
      const rowValue = row.original.level === 0 ? "group" : "section";
      return value.includes(rowValue);
    },
  },
  {
    id: "parentName",
    accessorKey: "parentProductionUnitId",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("production.unit.column.parentName")}
        t={t}
      />
    ),
    cell: ({ row }) => {
      const parentId = row.original.parentProductionUnitId;
      if (!parentId) {
        return <span className="text-muted-foreground">---</span>;
      }
      const parent = unitMap.get(parentId);
      return parent ? parent.name : <span className="text-muted-foreground">?</span>;
    },
    filterFn: (row, id, value: string[]) => {
        const rowValue = row.original.parentProductionUnitId || "null";
        return value.includes(rowValue);
    },
  },
  {
    id: "actions",
    header: () => (
      <div className="text-right">{t("masterdata.unit.column.actions")}</div>
    ),
    cell: ({ row }: { row: Row<FlatProductionUnitDefinition> }) => (
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