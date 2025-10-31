// aj-client/src/app/[lng]/(main)/dashboard/iam/users/page.tsx
"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { User } from "@/types/user";
import { Role } from "@/types/role";
import { DataTable } from "@/components/data-table/data-table";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddUserForm } from "./add-user-form";
import { EditUserForm } from "./edit-user-form";

// 1. YENİ İMPORT: Filtre state tipi
import { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  FileDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem, // YENİ İMPORT
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { API_BASE } from "@/lib/api";
import { useTranslation } from "@/lib/i18n-client";
import { useParams } from "next/navigation";
import { createIAMUserColumns } from "./columns";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // 2. YENİ STATE'LER: Filtreleme için
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { lng } = useParams() as { lng: string };
  const { t, ready } = useTranslation(lng, "common");

  // fetchData, handleSuccess, vb. fonksiyonlar...
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        apiFetchAuth("/api/iam/users"),
        apiFetchAuth("/api/iam/roles"),
      ]);
      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error: any) {
      toast.error(t("iam.user.toast.fetchError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (ready) {
      fetchData();
    }
  }, [ready, t]);

  const handleSuccess = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedUser(null);
    fetchData();
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await apiFetchAuth(`/api/iam/users/${userId}`, { method: "DELETE" });
      toast.success(t("iam.user.toast.deleteSuccess"));
      fetchData();
    } catch (error: any) {
      toast.error(t("iam.user.toast.deleteFailed"), {
        description: error.message,
      });
    } finally {
      setUserToDelete(null);
    }
  };

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // 3. YENİ FONKSİYON: "Durum" filtresini yönetmek için
  const handleStatusFilterChange = (value: string, isChecked: boolean) => {
    const currentFilters = table.getState().columnFilters;
    const statusFilter = currentFilters.find((f) => f.id === "active");
    let newStatusValues: string[] = [];

    if (statusFilter) {
      newStatusValues = (statusFilter.value as string[]) || [];
    }

    if (isChecked) {
      // Değeri ekle
      newStatusValues = [...newStatusValues, value];
    } else {
      // Değeri çıkar
      newStatusValues = newStatusValues.filter((v) => v !== value);
    }

    // Diğer tüm filtreleri koru ve 'active' filtresini güncelle
    const otherFilters = currentFilters.filter((f) => f.id !== "active");

    if (newStatusValues.length > 0) {
      table.setColumnFilters([
        ...otherFilters,
        { id: "active", value: newStatusValues },
      ]);
    } else {
      // Eğer "Aktif" ve "Pasif" ikisi de seçili değilse, filtreyi kaldır
      table.setColumnFilters(otherFilters);
    }
  };

  // AvatarColumn, DeleteConfirmationDialog, roleMap...
  const AvatarColumn: ColumnDef<User> = {
    id: "avatar",
    header: "",
    cell: ({ row }) => {
      const user = row.original;
      const avatarSrc = user.avatarUrl
        ? `${API_BASE}${user.avatarUrl}`
        : undefined;
      return (
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatarSrc} alt={user.fullName} />
          <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
        </Avatar>
      );
    },
    size: 32,
  };

  const DeleteConfirmationDialog = ({ user }: { user: User }) => (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{t("iam.user.deleteDialogTitle")}</AlertDialogTitle>
        <AlertDialogDescription>
          <b className="font-semibold">{user.fullName}</b>{" "}
          {t("iam.user.deleteDialogText")}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{t("iam.user.cancelButton")}</AlertDialogCancel>
        <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
          {t("iam.user.deleteButton")}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );

  const roleMap = useMemo(() => {
    return new Map(roles.map((role) => [role.id, role.name]));
  }, [roles]);

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      AvatarColumn,
      ...createIAMUserColumns({
        openEditDialog: openEditDialog,
        openDeleteDialog: openDeleteDialog,
        t: t,
        roleMap: roleMap,
      }),
    ],
    [t, roleMap, openEditDialog, openDeleteDialog]
  );

  // 4. GÜNCELLEME: useDataTableInstance'a yeni state'ler bağlandı
  const table = useDataTableInstance({
    data: users,
    columns,
    state: {
      globalFilter: globalFilter,
      columnFilters: columnFilters, // Filtre state'i eklendi
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters, // Filtre state setter'ı eklendi
  });

  // 5. YENİ YARDIMCI DEĞİŞKEN: Filtre menüsü için
  const statusFilterValues =
    (table.getColumn("active")?.getFilterValue() as string[]) || [];

  if (!ready || isLoading) {
    // ... (Skeleton aynı kalır) ...
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. BREADCRUMB (Aynı) */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${lng}/dashboard/default`}>
              {t("sidebar.managementPanel.home")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-sm font-medium">
              {t("sidebar.modules.systemManagement")}
            </span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {t("sidebar.modules.userManagement")}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        {/* 2. KONTROL ÇUBUĞU */}
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Sol Taraf (Aynı) */}
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">
                {t("iam.user.pageTitle")}
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-2.5 py-1 text-sm">
                  <strong className="mr-1.5 font-semibold">
                    {t("datatable.total", "Toplam")}
                  </strong>
                  {users.length}
                </Badge>
                <Dialog
                  open={isAddDialogOpen}
                  onOpenChange={setIsAddDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8">
                      <Plus className="mr-1.5 h-4 w-4" />
                      {t("datatable.add_new", "Yeni")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>
                        {t("iam.user.addDialogTitle")}
                      </DialogTitle>
                      <DialogDescription>
                        {t("iam.user.addDialogDescription")}
                      </DialogDescription>
                    </DialogHeader>
                    <AddUserForm onSuccess={handleSuccess} lng={lng} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Sağ Taraf: Aksiyonlar */}
            <div className="flex w-full sm:w-auto items-center gap-2">
              {/* Arama (Aynı) */}
              {isSearchOpen ? (
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    placeholder={t("datatable.search", "Ara...")}
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    onBlur={() => {
                      if (globalFilter === "") {
                        setIsSearchOpen(false);
                      }
                    }}
                    className="h-9 pl-8 w-full"
                  />
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setIsSearchOpen(true)}
                  aria-label={t("datatable.search", "Ara...")}
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}

              {/* 6. GÜNCELLEME: Filtre Butonu (DropdownMenu) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="mr-2 h-4 w-4" />
                    {t("datatable.filter", "Filtrele")}
                    {statusFilterValues.length > 0 && (
                      <Badge variant="secondary" className="ml-2 rounded-full px-1.5">
                        {statusFilterValues.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {t("iam.user.column.status")}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={statusFilterValues.includes("true")}
                    onCheckedChange={(isChecked) =>
                      handleStatusFilterChange("true", isChecked)
                    }
                  >
                    {t("iam.user.status.active")}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilterValues.includes("false")}
                    onCheckedChange={(isChecked) =>
                      handleStatusFilterChange("false", isChecked)
                    }
                  >
                    {t("iam.user.status.inactive")}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={statusFilterValues.length === 0}
                    onClick={() => table.setColumnFilters([])}
                    className="text-destructive focus:text-destructive"
                  >
                    {t("datatable.clear_filters", "Filtreleri Temizle")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Dışa Aktar (Aynı) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <FileDown className="mr-2 h-4 w-4" />
                    {t("datatable.export", "Dışa Aktar")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    {t("datatable.exportPdf", "PDF olarak aktar")}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    {t("datatable.exportExcel", "Excel olarak aktar")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        {/* 4. DATA TABLOSU (Aynı) */}
        <CardContent className="p-0">
          <div className="rounded-t-none border-t">
            <DataTable table={table} columns={columns} />
          </div>
        </CardContent>

        {/* 5. SAYFALAMA (Aynı) */}
        <CardFooter className="p-4 sm:p-6 border-t">
          {/* 't' prop'u buraya eklendi */}
          <DataTablePagination table={table} t={t} />
        </CardFooter>
      </Card>

      {/* 6. MODALLAR (Aynı) */}
      {selectedUser && isEditDialogOpen && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t("iam.user.editDialogTitle")}</DialogTitle>
              <DialogDescription>
                {selectedUser.fullName}{" "}
                {t("iam.user.editDialogDescription")}
              </DialogDescription>
            </DialogHeader>
            <EditUserForm
              user={selectedUser}
              onSuccess={handleSuccess}
              lng={lng}
            />
          </DialogContent>
        </Dialog>
      )}

      {userToDelete && (
        <AlertDialog open={true} onOpenChange={() => setUserToDelete(null)}>
          {DeleteConfirmationDialog({ user: userToDelete })}
        </AlertDialog>
      )}
    </div>
  );
}