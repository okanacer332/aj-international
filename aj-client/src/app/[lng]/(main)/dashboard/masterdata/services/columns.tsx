"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ServiceDefinition } from "@/types/service-definition";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Users } from "lucide-react";
// 1. YENİ İMPORT: Sıralama için başlık bileşeni
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";

export const createServiceDefinitionColumns = ({
  onEdit,
  onDelete,
  t,
}: {
  onEdit: (service: ServiceDefinition) => void;
  onDelete: (service: ServiceDefinition) => void;
  t: (key: string) => string;
}): ColumnDef<ServiceDefinition>[] => [
  {
    accessorKey: "driverName",
    // 2. GÜNCELLEME: Başlık 'DataTableColumnHeader' ile sarıldı
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.service.column.driverName")}
        t={t} // 't' fonksiyonu aktarıldı
      />
    ),
  },
  {
    accessorKey: "phone",
    // 3. GÜNCELLEME: Başlık 'DataTableColumnHeader' ile sarıldı
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.service.column.phone")}
        t={t} // 't' fonksiyonu aktarıldı
      />
    ),
  },
  {
    accessorKey: "vehiclePlate",
    // 4. GÜNCELLEME: Başlık 'DataTableColumnHeader' ile sarıldı
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.service.column.vehiclePlate")}
        t={t} // 't' fonksiyonu aktarıldı
      />
    ),
    cell: ({ row }) => {
      return (
        <Badge variant="secondary" className="font-mono">
          {row.original.vehiclePlate}
        </Badge>
      );
    },
  },
  {
    accessorKey: "vehicleCapacity",
    // 5. GÜNCELLEME: Başlık 'DataTableColumnHeader' ile sarıldı
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.service.column.vehicleCapacity")}
        className="justify-end"
        t={t} // 't' fonksiyonu aktarıldı
      />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex items-center justify-end space-x-1 text-right">
          <span className="font-medium">{row.original.vehicleCapacity}</span>
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
      );
    },
    // 6. YENİ EKLEME: Filtreleme fonksiyonu (Aralığa göre)
    filterFn: (row, id, value: string[]) => {
      const capacity = row.original.vehicleCapacity;
      if (value.length === 0) return true;

      return value.some(range => {
        if (range === "0-10") return capacity <= 10;
        if (range === "11-20") return capacity > 10 && capacity <= 20;
        if (range === "21+") return capacity > 20;
        return false;
      });
    },
  },
  {
    id: "actions",
    header: () => (
      <div className="text-right">{t("masterdata.service.column.actions")}</div>
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