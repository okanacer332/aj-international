"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { MasterProduct } from "@/types/master-product";
import { createMasterProductColumns, UnitMap } from "./columns"; // Güncellendi
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
import { ProductionProductForm } from "./production-product-form"; // Yeni Form
import { useTranslation } from "@/lib/i18n-client";
import { useParams } from "next/navigation";
import { MeasureDefinition } from "@/types/measure-definition";
import { ProductionUnitDefinition } from "@/types/production-unit-definition"; // Yeni Tip

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

// Hiyerarşik listeyi düz bir haritaya çevir (Grup/Bölüm isimlerini bulmak için)
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

export default function ProductionProductsPage() {
  const [products, setProducts] = useState<MasterProduct[]>([]);
  const [measures, setMeasures] = useState<MeasureDefinition[]>([]);
  const [productionUnits, setProductionUnits] = useState<ProductionUnitDefinition[]>([]); // Grup/Bölüm hiyerarşisi
  const [isLoading, setIsLoading] = useState(true);
  
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productInForm, setProductInForm] = useState<MasterProduct | null>(null);
  const [productToDelete, setProductToDelete] =
    useState<MasterProduct | null>(null);

  const { lng } = useParams() as { lng: string };
  const { t, ready } = useTranslation(lng, "common");

  const fetchData = useCallback(async () => {
    if (!getAuthToken()) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // Üç API'yi paralel çağır
      const [productsRes, measuresRes, unitsRes] = await Promise.all([
        apiFetchAuth("/api/masterdata/products"),
        apiFetchAuth("/api/masterdata/measures"),
        apiFetchAuth("/api/masterdata/production-units") // Yeni API
      ]);
      
      const productsData: MasterProduct[] = await productsRes.json();
      const measuresData: MeasureDefinition[] = await measuresRes.json();
      const unitsData: ProductionUnitDefinition[] = await unitsRes.json();
      
      setProducts(productsData); // Düz liste
      setMeasures(measuresData);
      setProductionUnits(unitsData); // Hiyerarşik liste (Form için)

    } catch (error) {
      toast.error(t("masterdata.product.toast.fetchError"));
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

  // handleToggle kaldırıldı.

  const handleEdit = useCallback((product: MasterProduct) => {
    setProductInForm(product);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback((product: MasterProduct) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!productToDelete) return;
    try {
      await apiFetchAuth(`/api/masterdata/products/${productToDelete.id}`, {
        method: "DELETE",
      });
      toast.success(
        t("masterdata.product.toast.deleteSuccess", {
          productName: productToDelete.code,
        })
      );
      fetchData();
    } catch (e: any) {
      // Hata mesajı aynı, backend değişmedi
      const errorMessageKey = e.message.includes("children")
        ? "masterdata.product.toast.deleteHasChildrenError"
        : "masterdata.product.toast.deleteUnknownError";
      toast.error(t("masterdata.product.toast.deleteFailed"), {
        description: t(errorMessageKey),
      });
    } finally {
      setProductToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  }, [productToDelete, t, fetchData]);
  
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchData();
  };
  
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);
  
  // Durum Filtresi
  const handleStatusFilterChange = (value: string, isChecked: boolean) => {
    const currentFilters = table.getState().columnFilters;
    const statusFilter = currentFilters.find((f) => f.id === "active");
    let newStatusValues: string[] = [];
    if (statusFilter) newStatusValues = (statusFilter.value as string[]) || [];
    if (isChecked) newStatusValues = [...newStatusValues, value];
    else newStatusValues = newStatusValues.filter((v) => v !== value);
    const otherFilters = currentFilters.filter((f) => f.id !== "active");
    if (newStatusValues.length > 0) {
      table.setColumnFilters([
        ...otherFilters,
        { id: "active", value: newStatusValues },
      ]);
    } else {
      table.setColumnFilters(otherFilters);
    }
  };
  
  // Grup/Bölüm Filtresi
  const handleParentFilterChange = (value: string, isChecked: boolean) => {
    const currentFilters = table.getState().columnFilters;
    const filter = currentFilters.find((f) => f.id === "productionUnitId");
    let newValues: string[] = [];
    if (filter) newValues = (filter.value as string[]) || [];

    if (isChecked) newValues = [...newValues, value];
    else newValues = newValues.filter((v) => v !== value);

    const otherFilters = currentFilters.filter((f) => f.id !== "productionUnitId");

    if (newValues.length > 0) {
      table.setColumnFilters([
        ...otherFilters,
        { id: "productionUnitId", value: newValues },
      ]);
    } else {
      table.setColumnFilters(otherFilters);
    }
  };

  // Veri ve Sütunlar
  const measureMap = useMemo(() => {
    return new Map(measures.map((m) => [m.id, m.name]));
  }, [measures]);
  
  const unitMap = useMemo(() => createUnitMap(productionUnits), [productionUnits]);
  const groups = useMemo(() => productionUnits.filter(u => !u.parentProductionUnitId), [productionUnits]);

  const columns = useMemo(
    () =>
      createMasterProductColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        t: t,
        measureMap: measureMap,
        unitMap: unitMap, // Yeni haritayı yolla
      }),
    [handleEdit, handleDelete, t, measureMap, unitMap]
  );

  const table = useDataTableInstance({
    data: products, // Düz 'products' listesi
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
    (table.getColumn("active")?.getFilterValue() as string[]) || [];
  const parentFilterValues =
    (table.getColumn("productionUnitId")?.getFilterValue() as string[]) || [];

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
      {/* 1. BREADCRUMB (Yeni yol) */}
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
              {t("sidebar.modules.production.products")}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        {/* 2. KONTROL ÇUBUĞU (Yeni başlıklar) */}
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">
                {t("masterdata.product.pageTitle.production")}
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-2.5 py-1 text-sm">
                  <strong className="mr-1.5 font-semibold">
                    {t("datatable.total", "Toplam")}
                  </strong>
                  {products.length}
                </Badge>
                <Dialog
                  open={isFormOpen}
                  onOpenChange={setIsFormOpen}
                >
                  <DialogTrigger asChild>
                    <Button onClick={() => setProductInForm(null)} size="sm" className="h-8">
                      <Plus className="mr-1.5 h-4 w-4" />
                      {t("datatable.add_new", "Yeni")}
                    </Button>
                  </DialogTrigger>
                  {/* Form artık daha geniş (sm:max-w-2xl) */}
                  <DialogContent className="sm:max-w-2xl"> 
                    <DialogHeader>
                      <DialogTitle>
                        {productInForm
                          ? t("masterdata.product.dialogTitleEdit")
                          : t("masterdata.product.dialogTitleNew")}
                      </DialogTitle>
                      <DialogDescription>
                        {productInForm
                          ? t("masterdata.product.dialogDescriptionEdit", {
                              productName: productInForm.name,
                            })
                          : t("masterdata.product.dialogDescriptionNew")}
                      </DialogDescription>
                    </DialogHeader>
                    {/* Yeni Formu Çağır */}
                    <ProductionProductForm 
                      initialData={productInForm}
                      onSuccess={handleFormSuccess}
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

              {/* Filtre (Durum ve Grup/Bölüm için) */}
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
                  {/* Grup Filtresi */}
                  <DropdownMenuLabel>
                    {t("production.unit.column.parentName")}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {groups.map(group => (
                     <DropdownMenuCheckboxItem
                        key={group.id}
                        checked={parentFilterValues.includes(group.id)}
                        onCheckedChange={(isChecked) =>
                          handleParentFilterChange(group.id, isChecked)
                        }
                      >
                        {group.name}
                      </DropdownMenuCheckboxItem>
                  ))}
                  
                  {/* Durum Filtresi */}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>
                    {t("masterdata.product.column.status")}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={statusFilterValues.includes("true")}
                    onCheckedChange={(isChecked) =>
                      handleStatusFilterChange("true", isChecked)
                    }
                  >
                    {t("masterdata.product.status.active")}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilterValues.includes("false")}
                    onCheckedChange={(isChecked) =>
                      handleStatusFilterChange("false", isChecked)
                    }
                  >
                    {t("masterdata.product.status.passive")}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  
                  {/* Filtre Temizle */}
                  <DropdownMenuItem
                    disabled={statusFilterValues.length === 0 && parentFilterValues.length === 0}
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
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {productInForm
                  ? t("masterdata.product.dialogTitleEdit")
                  : t("masterdata.product.dialogTitleNew")}
              </DialogTitle>
              <DialogDescription>
                {productInForm
                  ? t("masterdata.product.dialogDescriptionEdit", {
                      productName: productInForm.name,
                    })
                  : t("masterdata.product.dialogDescriptionNew")}
              </DialogDescription>
            </DialogHeader>
            <ProductionProductForm
              initialData={productInForm}
              onSuccess={handleFormSuccess}
              lng={lng}
            />
          </DialogContent>
        </Dialog>
      )}

      {productToDelete && (
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("masterdata.product.deleteDialogTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                <b>
                  {productToDelete?.name} ({productToDelete?.code})
                </b>{" "}
                {t("masterdata.product.deleteDialogText1")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setProductToDelete(null);
                  setIsDeleteDialogOpen(false);
                }}
              >
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