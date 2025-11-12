"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { UnitDefinition } from "@/types/unit-definition";
import {
  createDepartmentColumns,
  FlatUnitDefinition,
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
// Formu yeni konumundan import et
import { UnitDefinitionForm } from "./department-definition-form";
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

// Hiyerarşiyi Düzleştirme Fonksiyonu
function flattenUnitsRecursive(
  units: UnitDefinition[],
  level = 0
): FlatUnitDefinition[] {
  const flatList: FlatUnitDefinition[] = [];
  units.forEach((unit) => {
    flatList.push({ ...unit, level: level });
    if (unit.subUnits && unit.subUnits.length > 0) {
      flatList.push(...flattenUnitsRecursive(unit.subUnits, level + 1));
    }
  });
  return flatList;
}

// Hiyerarşik listeyi düz bir haritaya çevir (İsimleri bulmak için)
function createUnitMap(units: UnitDefinition[]): UnitMap {
  const map: UnitMap = new Map();
  const recursiveAdd = (unitList: UnitDefinition[], parentName?: string) => {
    for (const unit of unitList) {
      map.set(unit.id, { name: unit.name, parentName });
      if (unit.subUnits) {
        recursiveAdd(unit.subUnits, unit.name); // Parent ismi aktar
      }
    }
  };
  recursiveAdd(units);
  return map;
}

export default function DepartmentDefinitionsPage() {
  const [units, setUnits] = useState<UnitDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<UnitDefinition | null>(
    null
  );
  const [itemToDelete, setItemToDelete] = useState<UnitDefinition | null>(
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
      // API hala aynı, backend'e dokunmuyoruz
      const res = await apiFetchAuth("/api/masterdata/units");
      const data: UnitDefinition[] = await res.json();
      setUnits(data); // Hiyerarşik veriyi sakla (Form için)
    } catch (error) {
      toast.error(t("masterdata.unit.toast.fetchError"));
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

  // Handler Fonksiyonları (Edit, Delete, Success)
  const handleEdit = useCallback((item: UnitDefinition) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback((item: UnitDefinition) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;
    try {
      await apiFetchAuth(`/api/masterdata/units/${itemToDelete.id}`, {
        method: "DELETE",
      });
      toast.success(t("masterdata.unit.toast.deleteSuccess"));
      fetchData();
    } catch (e: any) {
        const errorMessageKey = e.message.includes("atanmış personel")
            ? e.message
            : t("masterdata.unit.toast.deleteError");
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

  // Filtreleme Handler (Yetkinlik durumu için)
  const handleStatusFilterChange = (value: string, isChecked: boolean) => {
    const currentFilters = table.getState().columnFilters;
    const statusFilter = currentFilters.find((f) => f.id === "competencyRequired");
    let newStatusValues: string[] = [];
    if (statusFilter) newStatusValues = (statusFilter.value as string[]) || [];
    if (isChecked) newStatusValues = [...newStatusValues, value];
    else newStatusValues = newStatusValues.filter((v) => v !== value);
    const otherFilters = currentFilters.filter((f) => f.id !== "competencyRequired");
    if (newStatusValues.length > 0) {
      table.setColumnFilters([
        ...otherFilters,
        { id: "competencyRequired", value: newStatusValues },
      ]);
    } else {
      table.setColumnFilters(otherFilters);
    }
  };
  
  // Filtreleme Handler (Departman için)
  const handleParentFilterChange = (value: string, isChecked: boolean) => {
    const currentFilters = table.getState().columnFilters;
    const filter = currentFilters.find((f) => f.id === "parentName"); // Sütun ID'si 'parentName'
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
  const departments = useMemo(() => units.filter(u => !u.parentUnitId), [units]);

  const columns = useMemo(
    () =>
      createDepartmentColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        t: t,
        unitMap: unitMap,
      }),
    [handleEdit, handleDelete, t, unitMap]
  );

  const table = useDataTableInstance({
    data: flatData,
    columns: columns,
    getRowId: (row) => row.id.toString(),
    state: {
      globalFilter: globalFilter,
      columnFilters: columnFilters,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
  });

  const statusFilterValues =
    (table.getColumn("competencyRequired")?.getFilterValue() as string[]) || [];
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
              {t("sidebar.modules.humanResources")}
            </span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {t("sidebar.modules.departmentDefinitions")}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">
                {t("sidebar.modules.departmentDefinitions")}
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
                          ? t("masterdata.unit.dialogTitleEdit")
                          : t("masterdata.unit.dialogTitleNew")}
                      </DialogTitle>
                      <DialogDescription>
                        {t("masterdata.unit.dialogDescription")}
                      </DialogDescription>
                    </DialogHeader>
                    <UnitDefinitionForm
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

              {/* Filtre Butonu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="mr-2 h-4 w-4" />
                    {t("datatable.filter", "Filtrele")}
                    {(statusFilterValues.length > 0 || parentFilterValues.length > 0) && (
                      <Badge variant="secondary" className="ml-2 rounded-full px-1.5">
                        {statusFilterValues.length + parentFilterValues.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
                  <DropdownMenuLabel>
                    {t("masterdata.unit.column.parentName")}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {/* Departmanları (Ana Kökleri) Filtrele */}
                  {departments.map(dept => (
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
                  <DropdownMenuLabel>
                    {t("masterdata.unit.column.isCompetencyRequired")}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={statusFilterValues.includes("true")}
                    onCheckedChange={(isChecked) =>
                      handleStatusFilterChange("true", isChecked)
                    }
                  >
                    {t("masterdata.unit.status.required")}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilterValues.includes("false")}
                    onCheckedChange={(isChecked) =>
                      handleStatusFilterChange("false", isChecked)
                    }
                  >
                    {t("masterdata.unit.status.notRequired")}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={statusFilterValues.length === 0 && parentFilterValues.length === 0}
                    onClick={() => table.setColumnFilters([])}
                    className="text-destructive focus:text-destructive"
                  >
                    {t("datatable.clear_filters", "Filtreleri Temizle")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
                  ? t("masterdata.unit.dialogTitleEdit")
                  : t("masterdata.unit.dialogTitleNew")}
              </DialogTitle>
              <DialogDescription>
                {t("masterdata.unit.dialogDescription")}
              </DialogDescription>
            </DialogHeader>
            <UnitDefinitionForm
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
                {t("masterdata.unit.deleteDialogTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                <b>{itemToDelete?.name}</b>{" "}
                {t("masterdata.unit.deleteDialogText")}
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