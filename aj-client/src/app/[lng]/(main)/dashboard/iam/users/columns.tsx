"use client";

import { ColumnDef } from "@tanstack/react-table";
import { User } from "@/types/user";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { API_BASE } from "@/lib/api";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"; // Bu import zaten vardı

export const createIAMUserColumns = ({
  t,
  openEditDialog,
  openDeleteDialog,
  roleMap,
}: {
  t: (key: string) => string;
  openEditDialog: (user: User) => void;
  openDeleteDialog: (user: User) => void;
  roleMap: Map<string, string>;
}): ColumnDef<User>[] => [
  {
    accessorKey: "fullName",
    // 1. GÜNCELLEME: 't' prop'u eklendi
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("iam.user.column.fullName")}
        t={t}
      />
    ),
    cell: ({ row }) => {
      // ... (cell içeriği aynı kalır)
      const user = row.original;
      const avatarSrc = user.avatarUrl
        ? `${API_BASE}${user.avatarUrl}`
        : undefined;
      const userRoles =
        user.roleIds
          ?.map((roleId) => roleMap.get(roleId) || roleId)
          .join(", ") || t("iam.user.roleNotAssigned");

      return (
        <HoverCard openDelay={200} closeDelay={100}>
          <HoverCardTrigger asChild>
            <span className="font-medium cursor-pointer hover:underline">
              {user.fullName}
            </span>
          </HoverCardTrigger>
          <HoverCardContent className="w-64" side="top">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={avatarSrc} alt={user.fullName} />
                <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">{user.fullName}</h4>
                <p className="text-xs text-muted-foreground">
                  {user.email || t("iam.user.noEmail")}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Rol:</span>{" "}
                  {userRoles}
                </p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      );
    },
  },
  {
    accessorKey: "username",
    // 2. GÜNCELLEME: 't' prop'u eklendi
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("iam.user.column.username")}
        t={t}
      />
    ),
  },
  {
    accessorKey: "email",
    // 3. GÜNCELLEME: 't' prop'u eklendi
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("iam.user.column.email")}
        t={t}
      />
    ),
    cell: ({ row }) => row.getValue("email") || t("iam.user.noEmail"),
  },
  {
    accessorKey: "roleIds",
    // 4. GÜNCELLEME: 't' prop'u eklendi (enableSorting false olsa bile)
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("iam.user.column.roles")}
        t={t}
      />
    ),
    cell: ({ row }) => {
      // ... (cell içeriği aynı kalır)
      const roleIds = row.getValue("roleIds") as string[] | undefined;

      if (!roleIds || roleIds.length === 0) {
        return (
          <span className="text-muted-foreground">
            {t("iam.user.roleNotAssigned")}
          </span>
        );
      }

      return (
        <div className="flex flex-wrap gap-1">
          {roleIds.map((roleId) => (
            <Badge key={roleId} variant="outline">
              {roleMap.get(roleId) || roleId}
            </Badge>
          ))}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "active",
    // 5. GÜNCELLEME: 't' prop'u eklendi
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("iam.user.column.status")}
        t={t}
      />
    ),
    cell: ({ row }) => {
      // ... (cell içeriği aynı kalır)
      const isActive = row.getValue("active");
      return (
        <Badge variant={isActive ? "secondary" : "destructive"}>
          {isActive
            ? t("iam.user.status.active")
            : t("iam.user.status.inactive")}
        </Badge>
      );
    },
    filterFn: (row, id, value: string[]) => {
      const rowValue = row.getValue(id) ? "true" : "false";
      return value.includes(rowValue);
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      // ... (cell içeriği aynı kalır)
      const user = row.original;
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">
                  {t("iam.user.aria.openMenu")}
                </span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {t("iam.user.actions.label")}
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(user.id)}
              >
                {t("iam.user.actions.copyID")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openEditDialog(user)}>
                {t("iam.user.actions.edit")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => openDeleteDialog(user)}
                className="text-destructive focus:text-destructive"
              >
                {t("iam.user.actions.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    enableSorting: false,
  },
];