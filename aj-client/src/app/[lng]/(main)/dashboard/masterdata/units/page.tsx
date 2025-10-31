"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { UnitDefinition } from "@/types/unit-definition";
import { createUnitDefinitionColumns } from "./columns";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, FileDown } from "lucide-react"; // İkonlar eklendi
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
import { UnitDefinitionForm } from "./unit-definition-form";
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
import { cn } from "@/lib/utils"; // cn importu eklendi

// Hiyerarşi için Arayüz (Aynı)
interface FlatUnitDefinition extends UnitDefinition {
  level: number;
  originalSubUnits?: UnitDefinition[];
  isExpanded?: boolean;
}

// Hiyerarşiyi Düzleştirme Fonksiyonu (Aynı)
function flattenUnitsRecursive(
  units: UnitDefinition[],
  level = 0
): FlatUnitDefinition[] {
  const flatList: FlatUnitDefinition[] = [];

  units.forEach((unit) => {
    flatList.push({
      ...unit,
      level: level,
      isExpanded: unit.isExpanded ?? false,
      originalSubUnits: unit.subUnits,
    });

    if (
      unit.isExpanded &&
      unit.subUnits &&
      unit.subUnits.length > 0
    ) {
      flatList.push(
        ...flattenUnitsRecursive(unit.subUnits, level + 1)
      );
    }
  });

  return flatList;
}

export default function UnitDefinitionsPage() {
  const [units, setUnits] = useState<UnitDefinition[]>([]); // 'units' olarak değiştirildi
  const [isLoading, setIsLoading] = useState(true);
  
  // YENİ STATE'LER (User sayfasından kopyalandı)
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<UnitDefinition | null>(null);
  const [itemToDelete, setItemToDelete] = useState<UnitDefinition | null>(null);

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
      const res = await apiFetchAuth("/api/masterdata/units");
      const data: UnitDefinition[] = await res.json();
      
      setUnits((prevUnits) => {
        const expandedIds = new Map<string, boolean>();
        const findExpanded = (prods: UnitDefinition[]) => {
          prods.forEach((p) => {
            if (p.isExpanded) expandedIds.set(p.id, true);
            if (p.subUnits) findExpanded(p.subUnits);
          });
        };
        findExpanded(prevUnits);

        const mapNewData = (prods: UnitDefinition[]): UnitDefinition[] => {
          return prods.map((p) => ({
            ...p,
            isExpanded: expandedIds.get(p.id) ?? !p.parentUnitId,
            subUnits: p.subUnits ? mapNewData(p.subUnits) : [],
          }));
        };
        return mapNewData(data);
      });
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

  // Handler Fonksiyonları (Aynı)
  const handleToggleExpand = useCallback((id: string) => {
    const toggleUnitExpansion = (
      prods: UnitDefinition[]
    ): UnitDefinition[] => {
      return prods.map((p) => {
        if (p.id === id) {
          return { ...p, isExpanded: !p.isExpanded };
        }
        if (p.subUnits && p.subUnits.length > 0) {
          return { ...p, subUnits: toggleUnitExpansion(p.subUnits) };
        }
        return p;
      });
    };
    setUnits((prevUnits) => toggleUnitExpansion(prevUnits));
  }, []);

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
      const isChildrenError = e.message.includes("altında tanımlı") || e.message.includes("atanmış personel");
      const errorMessageKey = isChildrenError
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

  // YENİ: Arama çubuğu için Effect
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // YENİ: Filtreleme handler'ı
  const handleStatusFilterChange = (value: string, isChecked: boolean) => {
    const currentFilters = table.getState().columnFilters;
    const statusFilter = currentFilters.find((f) => f.id === "competencyRequired");
    let newStatusValues: string[] = [];

    if (statusFilter) {
      newStatusValues = (statusFilter.value as string[]) || [];
    }

    if (isChecked) {
      newStatusValues = [...newStatusValues, value];
    } else {
      newStatusValues = newStatusValues.filter((v) => v !== value);
    }

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


  // Veri ve Sütunlar
  const flatData = useMemo(() => flattenUnitsRecursive(units), [units]);

  const columns = useMemo(
    () =>
      createUnitDefinitionColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onToggleExpand: handleToggleExpand,
        t: t,
      }),
    [handleEdit, handleDelete, handleToggleExpand, t]
  );

  // GÜNCELLEME: Table Instance
  const table = useDataTableInstance({
    data: flatData, // Düzleştirilmiş veriyi kullan
    columns: columns,
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
    (table.getColumn("competencyRequired")?.getFilterValue() as string[]) || [];

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
              {t("masterdata.unit.pageTitle")}
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
                {t("masterdata.unit.pageTitle")}
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-2.5 py-1 text-sm">
                  <strong className="mr-1.5 font-semibold">
                    {t("datatable.total", "Toplam")}
                  </strong>
                  {flatData.length} {/* Düzleştirilmiş veri uzunluğu */}
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
                      allUnits={units} // Hiyerarşik listeyi forma yolla
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

              {/* Filtre (Yetkinlik Durumu için) */}
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
            {/* Hiyerarşik tablo için 'flatData' ve 'onToggleExpand' kullanılıyor */}
            <DataTable table={table} columns={columns} />
          </div>
        </CardContent>

        {/* 4. SAYFALAMA */}
        <CardFooter className="p-4 sm:p-6 border-t">
          <DataTablePagination table={table} t={t} />
        </CardFooter>
      </Card>

      {/* 5. MODALLAR (Silme Diyaloğu güncellendi) */}
      {selectedItem && isFormOpen && (
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
                <b>
                  {itemToDelete?.name}
                </b>
                {" "}
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