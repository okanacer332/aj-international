"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { UnitDefinition } from "@/types/unit-definition";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  XCircle,
  Building,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
// 1. YENİ İMPORT: Sıralama için başlık bileşeni
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

// Hiyerarşi için Arayüz (Aynı)
interface HierarchicalUnitDefinition extends UnitDefinition {
  level: number;
  originalSubUnits?: UnitDefinition[];
  isExpanded?: boolean;
}

export const createUnitDefinitionColumns = ({
  onEdit,
  onDelete,
  onToggleExpand,
  t,
}: {
  onEdit: (unit: UnitDefinition) => void;
  onDelete: (unit: UnitDefinition) => void;
  onToggleExpand: (id: string) => void;
  t: (key: string) => string;
}): ColumnDef<HierarchicalUnitDefinition>[] => [
  {
    accessorKey: "name",
    // 2. GÜNCELLEME: Başlık 'DataTableColumnHeader' ile sarıldı
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.unit.column.nameHierarchy")}
        t={t} // 't' fonksiyonu aktarıldı
      />
    ),
    cell: ({ row }: { row: Row<HierarchicalUnitDefinition> }) => {
      // ... (cell içeriği aynı kalır)
      const unit = row.original;
      const level = unit.level ?? 0;
      const hasChildren =
        !!unit.originalSubUnits && unit.originalSubUnits.length > 0;
      const isExpanded = unit.isExpanded ?? false;
      const indentPadding = `${level * 1.5 + 1}rem`;

      const toggleButton = hasChildren ? (
        <Button
          variant="ghost"
          size="icon"
          className="size-6 p-0 mr-2 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(unit.id);
          }}
          aria-label={
            isExpanded
              ? t("masterdata.product.aria.collapse")
              : t("masterdata.product.aria.expand")
          }
        >
          {isExpanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </Button>
      ) : (
        <div className="size-6 mr-2 shrink-0" />
      );

      const icon =
        level === 0 ? (
          <Building className="size-4 text-primary mr-1" />
        ) : (
          <Users className="size-4 text-muted-foreground mr-1" />
        );

      return (
        <div
          className={cn(
            "flex items-center space-x-1",
            level > 0 ? "text-muted-foreground font-normal" : "font-semibold"
          )}
          style={{ paddingLeft: indentPadding }}
        >
          {toggleButton}
          {icon}
          <span className="truncate">{unit.name}</span>
        </div>
      );
    },
    minSize: 300,
  },
  {
    accessorKey: "competencyRequired",
    // 3. GÜNCELLEME: Başlık 'DataTableColumnHeader' ile sarıldı
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.unit.column.isCompetencyRequired")}
        t={t} // 't' fonksiyonu aktarıldı
      />
    ),
    cell: ({ row }) => {
      // ... (cell içeriği aynı kalır)
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
    // 4. YENİ EKLEME: Filtreleme fonksiyonu
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
    cell: ({ row }: { row: Row<HierarchicalUnitDefinition> }) => (
      // ... (cell içeriği aynı kalır)
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