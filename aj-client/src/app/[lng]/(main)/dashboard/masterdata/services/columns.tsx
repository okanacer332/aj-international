"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ServiceDefinition } from "@/types/service-definition";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Users } from "lucide-react";
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
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.service.column.driverName")}
      />
    ),
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.service.column.phone")}
      />
    ),
  },
  {
    accessorKey: "vehiclePlate",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.service.column.vehiclePlate")}
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
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.service.column.vehicleCapacity")}
        className="justify-end" // Sağa yasla
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