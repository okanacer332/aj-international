"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MasterProduct } from "@/types/master-product";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { MeasureDefinition } from "@/types/measure-definition";

// YENİ: ProductionUnitDefinition hiyerarşik tipine ihtiyacımız var (ID'den isim bulmak için)
import { ProductionUnitDefinition } from "@/types/production-unit-definition";

// YENİ: Harita Tipi
export type UnitMap = Map<string, { name: string; parentName?: string }>;


export const createMasterProductColumns = ({
  onEdit,
  onDelete,
  t,
  measureMap,
  unitMap, // YENİ: Grup/Bölüm isimleri için
}: {
  onEdit: (product: MasterProduct) => void;
  onDelete: (product: MasterProduct) => void;
  t: (key: string) => string;
  measureMap: Map<string, string>;
  unitMap: UnitMap;
}): ColumnDef<MasterProduct>[] => [ // Artık hiyerarşik değil, düz MasterProduct
  {
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.product.column.code")}
        t={t}
      />
    ),
    cell: ({ row }) => {
      return (
        <Badge variant={"default"} className="uppercase font-semibold">
          {row.original.code}
        </Badge>
      );
    },
    size: 150,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.product.column.name")} // "Ürün Adı"
        t={t}
      />
    ),
    cell: ({ row }) => {
      return (
        <span className="font-medium">{row.original.name}</span>
      );
    },
    minSize: 250,
  },
  {
    // YENİ SÜTUN: GRUP / BÖLÜM
    accessorKey: "productionUnitId",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.product.column.productionUnit")}
        t={t}
      />
    ),
    cell: ({ row }) => {
      const unitId = row.original.productionUnitId;
      if (!unitId) {
        return <span className="text-muted-foreground">{t("masterdata.product.noGroupAssigned")}</span>;
      }
      const unitInfo = unitMap.get(unitId);
      if (!unitInfo) {
        return <span className="text-muted-foreground">?</span>;
      }
      
      // unitInfo { name: "Kalite", parentName: "Baby" }
      return (
        <div className="flex flex-col">
          <span className="font-medium">{unitInfo.parentName || unitInfo.name}</span>
          {unitInfo.parentName && (
             <span className="text-xs text-muted-foreground">{unitInfo.name}</span>
          )}
        </div>
      );
    },
    filterFn: (row, id, value: string[]) => {
        // Filtreleme (Grup veya Bölüm ID'sine göre)
        const unitId = row.original.productionUnitId;
        if (!unitId) return false;
        
        const unitInfo = unitMap.get(unitId);
        if (!unitInfo) return false;
        
        // Hem Bölüm ID'si (unitId) hem de Grup ID'si (unitInfo.parentName) filtrede var mı diye bak
        return value.includes(unitId) || (unitInfo.parentName && value.includes(unitMap.get(unitInfo.parentName)?.name ?? ""));
    },
    minSize: 200,
  },
  {
    accessorKey: "active",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.product.column.status")}
        t={t}
      />
    ),
    cell: ({ row }) => {
      const isActive = row.original.active;
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
    filterFn: (row, id, value: string[]) => {
      const rowValue = row.getValue(id) ? "true" : "false";
      return value.includes(rowValue);
    },
    size: 100,
  },
  {
    accessorKey: "targetValue",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.product.column.target")}
        t={t}
      />
    ),
    cell: ({ row }) => {
      const product = row.original;
      if (!product.targetValue)
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
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.product.column.waste")}
        t={t}
      />
    ),
    cell: ({ row }) => {
      const product = row.original;
      if (
        product.wasteRate === null ||
        product.wasteRate === undefined
      )
        return <span className="text-muted-foreground">---</span>;
      return <span>{product.wasteRate}%</span>;
    },
    size: 100,
  },
  {
    // YENİ SÜTUN: 'premiumValue' -> 'unitPrice'
    accessorKey: "unitPrice",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.product.column.unitPrice")} // Çeviri anahtarı değişti
        t={t}
      />
    ),
    cell: ({ row }) => {
      const product = row.original;
      if (
        product.unitPrice === null ||
        product.unitPrice === undefined
      )
        return <span className="text-muted-foreground">---</span>;
      // TODO: Para birimi formatlaması eklenebilir
      return <span className="font-medium">{product.unitPrice}</span>;
    },
    size: 100,
  },
  {
    id: "actions",
    header: () => (
      <div className="text-right">{t("masterdata.product.column.actions")}</div>
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