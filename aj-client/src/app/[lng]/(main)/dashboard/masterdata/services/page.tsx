"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { ServiceDefinition } from "@/types/service-definition";
import { createServiceDefinitionColumns } from "./columns";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, FileDown } from "lucide-react";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
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
import { ServiceDefinitionForm } from "./service-definition-form";
import { useTranslation } from "@/lib/i18n-client";
import { useParams } from "next/navigation";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";

// YENİ İMPORTLAR
import { ColumnFiltersState } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Badge } from "@/components/ui/badge";

export default function ServiceDefinitionsPage() {
  const [data, setData] = useState<ServiceDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // YENİ STATE'LER (User sayfasından kopyalandı)
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ServiceDefinition | null>(
    null
  );
  const [itemToDelete, setItemToDelete] = useState<ServiceDefinition | null>(
    null
  );

  const { lng } = useParams() as { lng: string };
  const { t, ready } = useTranslation(lng, "common");

  // fetchData (Aynı, URL güncellendi)
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetchAuth("/api/masterdata/services");
      const data: ServiceDefinition[] = await res.json();
      setData(data);
    } catch (error) {
      toast.error(t("masterdata.service.toast.fetchError"));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (ready) {
      fetchData();
    }
  }, [ready, fetchData]);

  // Handler Fonksiyonları (Aynı)
  const handleEdit = useCallback((item: ServiceDefinition) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback((item: ServiceDefinition) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;
    try {
      await apiFetchAuth(`/api/masterdata/services/${itemToDelete.id}`, {
        method: "DELETE",
      });
      toast.success(t("masterdata.service.toast.deleteSuccess"));
      fetchData();
    } catch (e: any) {
      toast.error(t("masterdata.service.toast.deleteError"), {
        description: e.message,
      });
    } finally {
      setItemToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  }, [itemToDelete, t, fetchData]);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedItem(null);
    fetchData();
  };
  
  // YENİ: Arama çubuğu için Effect
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);
  
  // YENİ: Filtreleme handler'ı (Kapasite için)
  const handleFilterChange = (value: string, isChecked: boolean) => {
    const currentFilters = table.getState().columnFilters;
    const filter = currentFilters.find((f) => f.id === "vehicleCapacity");
    let newValues: string[] = [];

    if (filter) {
      newValues = (filter.value as string[]) || [];
    }

    if (isChecked) {
      newValues = [...newValues, value];
    } else {
      newValues = newValues.filter((v) => v !== value);
    }

    const otherFilters = currentFilters.filter((f) => f.id !== "vehicleCapacity");

    if (newValues.length > 0) {
      table.setColumnFilters([
        ...otherFilters,
        { id: "vehicleCapacity", value: newValues },
      ]);
    } else {
      table.setColumnFilters(otherFilters);
    }
  };

  const columns = useMemo(
    () =>
      createServiceDefinitionColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        t: t,
      }),
    [handleEdit, handleDelete, t]
  );

  // GÜNCELLEME: Table Instance
  const table = useDataTableInstance({
    data: data,
    columns: columns,
    state: {
      globalFilter: globalFilter,
      columnFilters: columnFilters,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
  });
  
  // YENİ: Filtre menüsü için yardımcı değişken
  const filterValues =
    (table.getColumn("vehicleCapacity")?.getFilterValue() as string[]) || [];

  // Skeleton
  if (isLoading || !ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // --- YENİ RENDER YAPISI ---
  return (
    <div className="flex flex-col gap-6">
      {/* 1. BREADCRUMB */}
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
              {t("sidebar.modules.definitions")}
            </span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {t("masterdata.service.pageTitle")}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        {/* 2. KONTROL ÇUBUĞU */}
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            {/* Sol Taraf */}
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">
                {t("masterdata.service.pageTitle")}
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-2.5 py-1 text-sm">
                  <strong className="mr-1.5 font-semibold">
                    {t("datatable.total", "Toplam")}
                  </strong>
                  {data.length}
                </Badge>
                <Dialog
                  open={isFormOpen}
                  onOpenChange={setIsFormOpen}
                >
                  <DialogTrigger asChild>
                    <Button onClick={() => setSelectedItem(null)} size="sm" className="h-8">
                      <Plus className="mr-1.5 h-4 w-4" />
                      {t("datatable.add_new", "Yeni")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {selectedItem
                          ? t("masterdata.service.dialogTitleEdit")
                          : t("masterdata.service.dialogTitleNew")}
                      </DialogTitle>
                      <DialogDescription>
                        {t("masterdata.service.dialogDescription")}
                      </DialogDescription>
                    </DialogHeader>
                    <ServiceDefinitionForm
                      initialData={selectedItem}
                      onSuccess={handleFormSuccess}
                      lng={lng}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Sağ Taraf: Aksiyonlar */}
            <div className="flex w-full sm:w-auto items-center gap-2">
              {/* Arama */}
              {isSearchOpen ? (
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    placeholder={t("datatable.search", "Ara...")}
                    value={globalFilter ?? ""}
                    onChange={(event) => setGlobalFilter(event.target.value)}
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

              {/* Filtre (Kapasite için) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="mr-2 h-4 w-4" />
                    {t("datatable.filter", "Filtrele")}
                    {filterValues.length > 0 && (
                      <Badge variant="secondary" className="ml-2 rounded-full px-1.5">
                        {filterValues.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {t("masterdata.service.column.vehicleCapacity")}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={filterValues.includes("0-10")}
                    onCheckedChange={(isChecked) =>
                      handleFilterChange("0-10", isChecked)
                    }
                  >
                    {t("datatable.capacity.low", "Düşük (1-10)")}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filterValues.includes("11-20")}
                    onCheckedChange={(isChecked) =>
                      handleFilterChange("11-20", isChecked)
                    }
                  >
                    {t("datatable.capacity.medium", "Orta (11-20)")}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filterValues.includes("21+")}
                    onCheckedChange={(isChecked) =>
                      handleFilterChange("21+", isChecked)
                    }
                  >
                    {t("datatable.capacity.high", "Yüksek (21+)")}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={filterValues.length === 0}
                    onClick={() => table.setColumnFilters([])}
                    className="text-destructive focus:text-destructive"
                  >
                    {t("datatable.clear_filters", "Filtreleri Temizle")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Dışa Aktar */}
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

        {/* 3. DATA TABLOSU */}
        <CardContent className="p-0">
          <div className="rounded-t-none border-t">
            <DataTable table={table} columns={columns} />
          </div>
        </CardContent>

        {/* 4. SAYFALAMA */}
        <CardFooter className="p-4 sm:p-6 border-t">
          <DataTablePagination table={table} t={t} />
        </CardFooter>
      </Card>

      {/* 5. MODALLAR */}
      {isFormOpen && (
         <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedItem
                    ? t("masterdata.service.dialogTitleEdit")
                    : t("masterdata.service.dialogTitleNew")}
                </DialogTitle>
                <DialogDescription>
                  {t("masterdata.service.dialogDescription")}
                </DialogDescription>
              </DialogHeader>
              <ServiceDefinitionForm
                initialData={selectedItem}
                onSuccess={handleFormSuccess}
                lng={lng}
              />
            </DialogContent>
          </Dialog>
      )}

      {itemToDelete && (
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("masterdata.service.deleteDialogTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                <b>{itemToDelete?.vehiclePlate}</b>{" "}
                {t("masterdata.service.deleteDialogText")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setItemToDelete(null)}>
                {t("masterdata.product.cancelButton")}
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>
                {t("masterdata.product.deleteButton")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}