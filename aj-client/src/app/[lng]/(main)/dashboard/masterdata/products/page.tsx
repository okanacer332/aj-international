// aj-client/src/app/[lng]/(main)/dashboard/masterdata/products/page.tsx
"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { MasterProduct } from "@/types/master-product";
import { createMasterProductColumns } from "./columns";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, FileDown } from "lucide-react"; // İkonlar güncellendi
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
import { MasterProductForm } from "./master-product-form";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n-client";
import { useParams } from "next/navigation";
import { MeasureDefinition } from "@/types/measure-definition";

// YENİ İMPORTLAR
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

// Interface (Aynı)
interface FlatMasterProduct extends MasterProduct {
  level: number;
  originalSubProducts?: MasterProduct[];
}

// flattenProductsRecursive (Aynı)
function flattenProductsRecursive(
  products: MasterProduct[],
  level = 0
): FlatMasterProduct[] {
  const flatList: FlatMasterProduct[] = [];

  products.forEach((product) => {
    flatList.push({
      ...product,
      level: level,
      isExpanded: product.isExpanded ?? false,
      originalSubProducts: product.subProducts,
    });

    if (
      product.isExpanded &&
      product.subProducts &&
      product.subProducts.length > 0
    ) {
      flatList.push(
        ...flattenProductsRecursive(product.subProducts, level + 1)
      );
    }
  });

  return flatList;
}

export default function MasterDataProductsPage() {
  const [products, setProducts] = useState<MasterProduct[]>([]);
  const [measures, setMeasures] = useState<MeasureDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // YENİ STATE'LER (Birimler sayfasından kopyalandı)
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

  // fetchData (Aynı)
  const fetchData = useCallback(async () => {
    if (!getAuthToken()) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [productsRes, measuresRes] = await Promise.all([
        apiFetchAuth("/api/masterdata/products"),
        apiFetchAuth("/api/masterdata/measures"),
      ]);
      
      const data: MasterProduct[] = await productsRes.json();
      const measuresData: MeasureDefinition[] = await measuresRes.json();
      setMeasures(measuresData);

      setProducts((prevProducts) => {
        const expandedIds = new Map<string, boolean>();
        const findExpanded = (prods: MasterProduct[]) => {
          prods.forEach((p) => {
            if (p.isExpanded) expandedIds.set(p.id, true);
            if (p.subProducts) findExpanded(p.subProducts);
          });
        };
        findExpanded(prevProducts);

        const mapNewData = (prods: MasterProduct[]): MasterProduct[] => {
          return prods.map((p) => ({
            ...p,
            isExpanded: expandedIds.get(p.id) ?? !p.parentProductId,
            subProducts: p.subProducts ? mapNewData(p.subProducts) : [],
          }));
        };
        return mapNewData(data);
      });
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

  // Handler Fonksiyonları (Aynı)
  const handleToggle = useCallback((id: string) => {
    const toggleProductExpansion = (
      prods: MasterProduct[]
    ): MasterProduct[] => {
      return prods.map((p) => {
        if (p.id === id) {
          return { ...p, isExpanded: !p.isExpanded };
        }
        if (p.subProducts && p.subProducts.length > 0) {
          return { ...p, subProducts: toggleProductExpansion(p.subProducts) };
        }
        return p;
      });
    };
    setProducts((prevProducts) => toggleProductExpansion(prevProducts));
  }, []);

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
      const errorMessage = e.message || "";
      const isChildrenError =
        errorMessage.includes("alt ürünleri") ||
        errorMessage.includes("children");
      const errorMessageKey = isChildrenError
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
  
  // YENİ: Arama çubuğu için Effect
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);
  
  // YENİ: Filtreleme handler'ı
  const handleStatusFilterChange = (value: string, isChecked: boolean) => {
    const currentFilters = table.getState().columnFilters;
    // Filtre 'active' kolonuna uygulanacak
    const statusFilter = currentFilters.find((f) => f.id === "active");
    let newStatusValues: string[] = [];

    if (statusFilter) {
      newStatusValues = (statusFilter.value as string[]) || [];
    }

    if (isChecked) {
      newStatusValues = [...newStatusValues, value];
    } else {
      newStatusValues = newStatusValues.filter((v) => v !== value);
    }

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

  // Veri ve Sütunlar
  const flatData = useMemo(() => flattenProductsRecursive(products), [products]);

  const measureMap = useMemo(() => {
    return new Map(measures.map((m) => [m.id, m.name]));
  }, [measures]);

  const columnsWithHandlers = useMemo(
    () =>
      createMasterProductColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onToggleExpand: handleToggle,
        t: t,
        measureMap: measureMap,
      }),
    [handleEdit, handleDelete, handleToggle, t, measureMap]
  );

  // GÜNCELLEME: Table Instance
  const table = useDataTableInstance({
    data: flatData,
    columns: columnsWithHandlers,
    getRowId: (row) => row.id.toString(),
    state: {
      globalFilter: globalFilter,
      columnFilters: columnFilters, // Filtre state'i eklendi
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters, // Filtre setter'ı eklendi
  });
  
  // YENİ: Filtre menüsü için yardımcı değişken
  const statusFilterValues =
    (table.getColumn("active")?.getFilterValue() as string[]) || [];

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
              {t("masterdata.product.pageTitle")}
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
                {t("masterdata.product.pageTitle")}
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-2.5 py-1 text-sm">
                  <strong className="mr-1.5 font-semibold">
                    {t("datatable.total", "Toplam")}
                  </strong>
                  {flatData.length}
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
                  <DialogContent className="sm:max-w-md">
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
                    <MasterProductForm
                      initialData={productInForm}
                      onSuccess={() => {
                        setIsFormOpen(false);
                        fetchData();
                      }}
                      masterProducts={products}
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

              {/* Filtre (Durum için) */}
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
                  <DropdownMenuItem
                    disabled={statusFilterValues.length === 0}
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
            <DataTable table={table} columns={columnsWithHandlers} />
          </div>
        </CardContent>

        {/* 4. SAYFALAMA */}
        <CardFooter className="p-4 sm:p-6 border-t">
          <DataTablePagination table={table} t={t} />
        </CardFooter>
      </Card>

      {/* 5. MODALLAR (Aynı) */}
      {isFormOpen && (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-md">
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
            <MasterProductForm
              initialData={productInForm}
              onSuccess={() => {
                setIsFormOpen(false);
                fetchData();
              }}
              masterProducts={products}
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
                <b className="font-semibold">
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