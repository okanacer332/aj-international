// aj-client/src/app/[lng]/(main)/dashboard/inventory/definitions/customers/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { CustomerDefinition } from "./customer-definition-form";

export const createCustomerDefinitionColumns = ({
  onEdit,
  onDelete,
  t,
}: {
  onEdit: (item: CustomerDefinition) => void;
  onDelete: (item: CustomerDefinition) => void;
  t: (key: string) => string;
}): ColumnDef<CustomerDefinition>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.customer.column.name")}
        t={t}
      />
    ),
  },
  {
    id: "actions",
    header: () => (
      <div className="text-right">{t("masterdata.customer.column.actions")}</div>
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