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
  Building, // Departman ikonu
  Users,    // Ünite ikonu
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

// Hiyerarşi için arayüz (Product'tan kopyalandı)
interface HierarchicalUnitDefinition extends UnitDefinition {
  level: number;
  originalSubUnits?: UnitDefinition[]; // 'subProducts' yerine 'subUnits'
}

export const createUnitDefinitionColumns = ({
  onEdit,
  onDelete,
  onToggleExpand, // Hiyerarşi için eklendi
  t,
}: {
  onEdit: (unit: UnitDefinition) => void;
  onDelete: (unit: UnitDefinition) => void;
  onToggleExpand: (id: string) => void; // Hiyerarşi için eklendi
  t: (key: string) => string;
}): ColumnDef<HierarchicalUnitDefinition>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        // YENİ ÇEVİRİ ANAHTARI
        title={t("masterdata.unit.column.nameHierarchy")}
      />
    ),
    cell: ({ row }: { row: Row<HierarchicalUnitDefinition> }) => {
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
              // Product'tan çeviri anahtarı ödünç alındı
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
        <div className="size-6 mr-2 shrink-0" /> // Boşluk
      );

      // Departman için 'Building', Ünite için 'Users' ikonu
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
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.unit.column.isCompetencyRequired")}
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
          onClick={(e) => {
            e.stopPropagation();
            onEdit(row.original);
          }}
          // Product'tan çeviri anahtarı ödünç alındı
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
          // Product'tan çeviri anahtarı ödünç alındı
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