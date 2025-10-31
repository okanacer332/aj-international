"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { MasterProduct } from "@/types/master-product";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  BookText,
  Package,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
// 1. YENİ İMPORT: Sıralama için başlık bileşeni
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { MeasureDefinition } from "@/types/measure-definition";

interface HierarchicalMasterProduct extends MasterProduct {
  level: number;
  originalSubProducts?: MasterProduct[];
}

export const createMasterProductColumns = ({
  onEdit,
  onDelete,
  onToggleExpand,
  t,
  measureMap,
}: {
  onEdit: (product: MasterProduct) => void;
  onDelete: (product: MasterProduct) => void;
  onToggleExpand: (id: string) => void;
  t: (key: string) => string;
  measureMap: Map<string, string>;
}): ColumnDef<HierarchicalMasterProduct>[] => [
  {
    accessorKey: "name",
    // 2. GÜNCELLEME: Başlık 'DataTableColumnHeader' ile sarıldı
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.product.column.name")}
        t={t} // 't' fonksiyonu aktarıldı
      />
    ),
    cell: ({ row }: { row: Row<HierarchicalMasterProduct> }) => {
      // ... (cell içeriği aynı kalır) ...
      const product = row.original;
      const level = product.level ?? 0;
      const hasChildren =
        !!product.originalSubProducts &&
        product.originalSubProducts.length > 0;
      const isExpanded = product.isExpanded ?? false;
      const indentPadding = `${level * 1.5 + 1}rem`;

      const toggleButton = hasChildren ? (
        <Button
          variant="ghost"
          size="icon"
          className="size-6 p-0 mr-2 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(product.id);
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

      const icon = hasChildren ? (
        <Package className="size-4 text-primary mr-1" />
      ) : (
        <BookText className="size-4 text-muted-foreground mr-1" />
      );

      return (
        <div
          className={cn(
            "flex items-center space-x-1",
            level > 0
              ? "text-muted-foreground font-normal"
              : "font-semibold"
          )}
          style={{ paddingLeft: indentPadding }}
        >
          {toggleButton}
          {icon}
          <span className="truncate">{product.name}</span>
        </div>
      );
    },
    minSize: 300,
    size: 400,
  },
  {
    accessorKey: "code",
    // 3. GÜNCELLEME: Başlık 'DataTableColumnHeader' ile sarıldı
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.product.column.code")}
        t={t}
      />
    ),
    cell: ({ row }: { row: Row<HierarchicalMasterProduct> }) => {
      // ... (cell içeriği aynı kalır) ...
      const isRoot = (row.original.level ?? 0) === 0;
      return (
        <Badge
          variant={isRoot ? "default" : "outline"}
          className={cn(
            "uppercase",
            isRoot ? "font-semibold" : "font-normal"
          )}
        >
          {row.original.code}
        </Badge>
      );
    },
    size: 150,
  },
  {
    accessorKey: "active",
    // 4. GÜNCELLEME: Başlık 'DataTableColumnHeader' ile sarıldı
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.product.column.status")}
        t={t}
      />
    ),
    cell: ({ row }) => {
      // ... (cell içeriği aynı kalır) ...
      const product = row.original;
      if (product.level === 0) return null;
      const isActive = product.active;
      
      return isActive ? (
        <Badge variant="secondary" className="text-green-600">
          <CheckCircle className="mr-1 h-3 w-3" />
          {t("masterdata.product.status.active")}
        </Badge>
      ) : (
        <Badge variant="outline">
          <XCircle className="mr-1 h-3 w-3 text-muted-foreground" />
          {t("masterdata.product.status.passive")}
        </Badge>
      );
    },
    // 5. YENİ EKLEME: Filtreleme fonksiyonu
    filterFn: (row, id, value: string[]) => {
      const rowValue = row.getValue(id) ? "true" : "false";
      return value.includes(rowValue);
    },
    size: 100,
  },
  {
    accessorKey: "targetValue",
    // 6. GÜNCELLEME: Başlık 'DataTableColumnHeader' ile sarıldı
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.product.column.target")}
        t={t}
      />
    ),
    cell: ({ row }) => {
      // ... (cell içeriği aynı kalır) ...
      const product = row.original;
      if (product.level === 0 || !product.targetValue)
        return <span className="text-muted-foreground">---</span>;
      
      const unitName =
        measureMap.get(product.measureDefinitionId ?? "") || "";
      return (
        <span className="font-medium">
          {product.targetValue} {unitName}
        </span>
      );
    },
    size: 150,
  },
  {
    accessorKey: "wasteRate",
    // 7. GÜNCELLEME: Başlık 'DataTableColumnHeader' ile sarıldı
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.product.column.waste")}
        t={t}
      />
    ),
    cell: ({ row }) => {
      // ... (cell içeriği aynı kalır) ...
      const product = row.original;
      if (
        product.level === 0 ||
        product.wasteRate === null ||
        product.wasteRate === undefined
      )
        return <span className="text-muted-foreground">---</span>;
      return <span>{product.wasteRate}%</span>;
    },
    size: 100,
  },
  {
    accessorKey: "premiumValue",
    // 8. GÜNCELLEME: Başlık 'DataTableColumnHeader' ile sarıldı
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.product.column.premium")}
        t={t}
      />
    ),
    cell: ({ row }) => {
      // ... (cell içeriği aynı kalır) ...
      const product = row.original;
      if (
        product.level === 0 ||
        product.premiumValue === null ||
        product.premiumValue === undefined
      )
        return <span className="text-muted-foreground">---</span>;
      return <span className="font-medium">{product.premiumValue}</span>;
    },
    size: 100,
  },
  {
    accessorKey: "description",
    // 9. GÜNCELLEME: Başlık 'DataTableColumnHeader' ile sarıldı
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.product.column.description")}
        t={t}
      />
    ),
    cell: ({ row }: { row: Row<HierarchicalMasterProduct> }) => (
      // ... (cell içeriği aynı kalır) ...
      <span
        className="text-muted-foreground text-sm block max-w-xs truncate"
        title={row.original.description}
      >
        {row.original.description || t("masterdata.product.noDescription")}
      </span>
    ),
    size: 200,
  },
  {
    id: "actions",
    header: () => (
      <div className="text-right">{t("masterdata.product.column.actions")}</div>
    ),
    cell: ({ row }: { row: Row<HierarchicalMasterProduct> }) => (
      // ... (cell içeriği aynı kalır) ...
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