"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { ProductionUnitDefinition } from "@/types/production-unit-definition";
import {
  createProductionUnitColumns,
  FlatProductionUnitDefinition,
  UnitMap,
} from "./columns";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, FileDown } from "lucide-react";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthToken } from "@/lib/auth";
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
import { ProductionUnitDefinitionForm } from "./production-unit-definition-form";
import { useTranslation } from "@/lib/i18n-client";
import { useParams } from "next/navigation";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
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

// DÜZELTME: Hiyerarşiyi Düzleştirme Fonksiyonu
// Artık 'isExpanded' kontrolü yapmıyor, her zaman tüm alt birimleri ekliyor.
function flattenUnitsRecursive(
  units: ProductionUnitDefinition[],
  level = 0
): FlatProductionUnitDefinition[] {
  const flatList: FlatProductionUnitDefinition[] = [];
  units.forEach((unit) => {
    flatList.push({
      ...unit,
      level: level,
      // originalSubUnits'i saklamaya gerek yok, çünkü artık genişletme/daraltma yapmıyoruz
    });
    // 'isExpanded' kontrolü kaldırıldı
    if (unit.subUnits && unit.subUnits.length > 0) {
      flatList.push(...flattenUnitsRecursive(unit.subUnits, level + 1));
    }
  });
  return flatList;
}

// Hiyerarşik listeyi düz bir haritaya çevir (Aynı)
function createUnitMap(units: ProductionUnitDefinition[]): UnitMap {
  const map: UnitMap = new Map();
  const recursiveAdd = (unitList: ProductionUnitDefinition[], parentName?: string) => {
    for (const unit of unitList) {
      map.set(unit.id, { name: unit.name, parentName });
      if (unit.subUnits) {
        recursiveAdd(unit.subUnits, unit.name);
      }
    }
  };
  recursiveAdd(units);
  return map;
}

export default function ProductionDefinitionsPage() {
  const [units, setUnits] = useState<ProductionUnitDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProductionUnitDefinition | null>(
    null
  );
  const [itemToDelete, setItemToDelete] = useState<ProductionUnitDefinition | null>(
    null
  );

  const { lng } = useParams() as { lng: string };
  const { t, ready } = useTranslation(lng, "common");

  const fetchData = useCallback(async () => {
    if (!getAuthToken()) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiFetchAuth("/api/masterdata/production-units");
      const data: ProductionUnitDefinition[] = await res.json();
      setUnits(data); // Hiyerarşik veriyi sakla (Form ve Harita için)
    } catch (error) {
      toast.error(t("production.unit.toast.fetchError"));
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

  // Hiyerarşi Aç/Kapa (onToggleExpand) fonksiyonu SİLİNDİ.

  const handleEdit = useCallback((item: ProductionUnitDefinition) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback((item: ProductionUnitDefinition) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;
    try {
      await apiFetchAuth(`/api/masterdata/production-units/${itemToDelete.id}`, {
        method: "DELETE",
      });
      toast.success(t("production.unit.toast.deleteSuccess"));
      fetchData();
    } catch (e: any) {
      const errorMessageKey = e.message.includes("altında tanımlı")
            ? e.message
            : t("production.unit.toast.deleteError");
      toast.error(t("masterdata.product.toast.deleteFailed"), {
        description: errorMessageKey,
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

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Filtreleme Handler (Grup için)
  const handleParentFilterChange = (value: string, isChecked: boolean) => {
    const currentFilters = table.getState().columnFilters;
    const filter = currentFilters.find((f) => f.id === "parentName");
    let newValues: string[] = [];
    if (filter) newValues = (filter.value as string[]) || [];

    if (isChecked) newValues = [...newValues, value];
    else newValues = newValues.filter((v) => v !== value);

    const otherFilters = currentFilters.filter((f) => f.id !== "parentName");

    if (newValues.length > 0) {
      table.setColumnFilters([
        ...otherFilters,
        { id: "parentName", value: newValues },
      ]);
    } else {
      table.setColumnFilters(otherFilters);
    }
  };

  // Veriyi düzleştir ve haritala
  const flatData = useMemo(() => flattenUnitsRecursive(units), [units]);
  const unitMap = useMemo(() => createUnitMap(units), [units]);
  const groups = useMemo(() => units.filter(u => !u.parentProductionUnitId), [units]);

  const columns = useMemo(
    () =>
      createProductionUnitColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        t: t,
        unitMap: unitMap,
        // onToggleExpand prop'u kaldırıldı
      }),
    [handleEdit, handleDelete, t, unitMap] // Bağımlılıklardan 'handleToggleExpand' kaldırıldı
  );

  const table = useDataTableInstance({
    data: flatData, // DÜZ VERİYİ KULLAN
    columns: columns,
    getRowId: (row) => row.id.toString(),
    state: {
      globalFilter: globalFilter,
      columnFilters: columnFilters,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
  });

  const parentFilterValues =
    (table.getColumn("parentName")?.getFilterValue() as string[]) || [];

  if (isLoading || !ready) {
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
              {t("sidebar.modules.production")}
            </span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {t("sidebar.modules.productionDefinitions")}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">
                {t("production.unit.pageTitle")}
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-2.5 py-1 text-sm">
                  <strong className="mr-1.5 font-semibold">
                    {t("datatable.total", "Toplam")}
                  </strong>
                  {flatData.length}
                </Badge>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
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
                          ? t("production.unit.dialogTitleEdit")
                          : t("production.unit.dialogTitleNew")}
                      </DialogTitle>
                      <DialogDescription>
                        {t("production.unit.dialogDescription")}
                      </DialogDescription>
                    </DialogHeader>
                    <ProductionUnitDefinitionForm
                      initialData={selectedItem}
                      onSuccess={handleFormSuccess}
                      allUnits={units}
                      lng={lng}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="flex w-full sm:w-auto items-center gap-2">
              {isSearchOpen ? (
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    placeholder={t("datatable.search", "Ara...")}
                    value={globalFilter ?? ""}
                    onChange={(event) => setGlobalFilter(event.target.value)}
                    onBlur={() => {
                      if (globalFilter === "") setIsSearchOpen(false);
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

              {/* Filtre (Grup için) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="mr-2 h-4 w-4" />
                    {t("datatable.filter", "Filtrele")}
                    {parentFilterValues.length > 0 && (
                      <Badge variant="secondary" className="ml-2 rounded-full px-1.5">
                        {parentFilterValues.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
                  <DropdownMenuLabel>
                    {t("production.unit.column.parentName")}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {groups.map(dept => (
                     <DropdownMenuCheckboxItem
                        key={dept.id}
                        checked={parentFilterValues.includes(dept.id)}
                        onCheckedChange={(isChecked) =>
                          handleParentFilterChange(dept.id, isChecked)
                        }
                      >
                        {dept.name}
                      </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={parentFilterValues.length === 0}
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

        <CardContent className="p-0">
          <div className="rounded-t-none border-t">
            <DataTable table={table} columns={columns} />
          </div>
        </CardContent>

        <CardFooter className="p-4 sm:p-6 border-t">
          <DataTablePagination table={table} t={t} />
        </CardFooter>
      </Card>

      {/* Modallar */}
      {isFormOpen && (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedItem
                  ? t("production.unit.dialogTitleEdit")
                  : t("production.unit.dialogTitleNew")}
              </DialogTitle>
              <DialogDescription>
                {t("production.unit.dialogDescription")}
              </DialogDescription>
            </DialogHeader>
            <ProductionUnitDefinitionForm
              initialData={selectedItem}
              onSuccess={handleFormSuccess}
              allUnits={units}
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
                {t("production.unit.deleteDialogTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                <b>{itemToDelete?.name}</b>{" "}
                {t("production.unit.deleteDialogText")}
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