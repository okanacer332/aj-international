"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { ProductionUnitDefinition } from "@/types/production-unit-definition";
import { createSectionColumns } from "./section-columns";
import {
  createProductionUnitColumns,
  FlatProductionUnitDefinition,
  UnitMap,
} from "./columns";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, FileDown, Package, ClipboardList } from "lucide-react";
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
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

// Hiyerarşiyi Düzleştirme Fonksiyonu (Alttaki tablo için)
function flattenUnitsRecursive(
  units: ProductionUnitDefinition[],
  level = 0
): FlatProductionUnitDefinition[] {
  const flatList: FlatProductionUnitDefinition[] = [];
  units.forEach((unit) => {
    flatList.push({
      ...unit,
      level: level,
    });
    if (unit.subUnits && unit.subUnits.length > 0) {
      flatList.push(...flattenUnitsRecursive(unit.subUnits, level + 1));
    }
  });
  return flatList;
}

// Hiyerarşik listeyi düz bir haritaya çevir (Alttaki tablo için)
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

// Form modu için tip
type FormMode = "newGroup" | "newSection" | "edit";

export default function ProductionDefinitionsPage() {
  // --- STATE TANIMLAMALARI ---
  const [units, setUnits] = useState<ProductionUnitDefinition[]>([]); // Hiyerarşik ana veri
  const [isLoading, setIsLoading] = useState(true);
  
  // Master-Detail paneli için seçili grup
  const [selectedGroup, setSelectedGroup] = useState<ProductionUnitDefinition | null>(null);

  // Alttaki tam datatable için filtreler
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Form ve Dialog yönetimi
  const [formMode, setFormMode] = useState<FormMode>("edit");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ProductionUnitDefinition | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ProductionUnitDefinition | null>(null);

  const { lng } = useParams() as { lng: string };
  const { t, ready } = useTranslation(lng, "common");

  // --- VERİ ÇEKME ---
  const fetchData = useCallback(async () => {
    if (!getAuthToken()) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiFetchAuth("/api/masterdata/production-units");
      const data: ProductionUnitDefinition[] = await res.json();
      setUnits(data);
    } catch (error) {
      toast.error(t("production.unit.toast.fetchError"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (ready) fetchData();
  }, [ready, fetchData]);

  // --- FORM VE SİLME AKSİYONLARI ---
  const handleOpenForm = (mode: FormMode, item: ProductionUnitDefinition | null) => {
    setFormMode(mode);
    setItemToEdit(item); // 'edit' ise 'item' dolu, 'new' ise 'null' olacak
    setIsFormOpen(true);
  };

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
      fetchData(); // Veriyi yenile
      if (selectedGroup && selectedGroup.id === itemToDelete.id) {
         setSelectedGroup(null); // Eğer silinen grup seçili ise
      }
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
  }, [itemToDelete, t, fetchData, selectedGroup]);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setItemToEdit(null);
    fetchData(); // Ana veriyi yenile
    
    // Eğer bir grubu güncellediysek veya yeni bölüm eklediysek,
    // seçili grubu da taze veriyle güncelleyelim.
    if (selectedGroup) {
        apiFetchAuth("/api/masterdata/production-units")
            .then(res => res.json())
            .then(data => {
                // TypeScript için cast işlemi
                const allUnits = data as ProductionUnitDefinition[];
                // Ana listeyi de güncelle (fetchData zaten yapıyor ama senkron olması için)
                setUnits(allUnits); 
                // Seçili grubu yeni veride bul
                const updatedGroup = allUnits.find(g => g.id === selectedGroup.id);
                setSelectedGroup(updatedGroup || null);
            });
    }
  };

  // --- MEMOIZED DEĞERLER (TABLOLAR İÇİN) ---
  
  // Sol panel için Gruplar (Ana birimler)
  const groups = useMemo(() => units.filter(u => !u.parentProductionUnitId), [units]);
  // Sağ panel için Bölümler (Seçili grubun alt birimleri)
  const sections = useMemo(() => selectedGroup?.subUnits || [], [selectedGroup]);

  // Alttaki tam tablo için Düz Veri ve Harita
  const flatData = useMemo(() => flattenUnitsRecursive(units), [units]);
  const unitMap = useMemo(() => createUnitMap(units), [units]);

  // Sağ paneldeki "Bölüm" tablosu için sütunlar
  const sectionColumns = useMemo(
    () => createSectionColumns({
        onEdit: (item) => handleOpenForm('edit', item),
        onDelete: handleDelete,
        t,
    }), [handleDelete, t]
  );
  const sectionTable = useDataTableInstance({ data: sections, columns: sectionColumns });

  // Alttaki "Tüm Birimler" tablosu için sütunlar
  const fullHierarchyColumns = useMemo(
    () => createProductionUnitColumns({
        onEdit: (item) => handleOpenForm('edit', item),
        onDelete: handleDelete,
        t,
        unitMap,
    }), [handleDelete, t, unitMap]
  );
  
  const fullTable = useDataTableInstance({
    data: flatData,
    columns: fullHierarchyColumns,
    getRowId: (row) => row.id.toString(),
    state: { globalFilter, columnFilters },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
  });
  
  // Filtreler için yardımcı değişkenler
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleParentFilterChange = (value: string, isChecked: boolean) => {
    const currentFilters = fullTable.getState().columnFilters;
    const filter = currentFilters.find((f) => f.id === "parentName");
    let newValues: string[] = [];
    if (filter) newValues = (filter.value as string[]) || [];

    if (isChecked) newValues = [...newValues, value];
    else newValues = newValues.filter((v) => v !== value);

    const otherFilters = currentFilters.filter((f) => f.id !== "parentName");

    if (newValues.length > 0) {
      fullTable.setColumnFilters([
        ...otherFilters,
        { id: "parentName", value: newValues },
      ]);
    } else {
      fullTable.setColumnFilters(otherFilters);
    }
  };

  const parentFilterValues = (fullTable.getColumn("parentName")?.getFilterValue() as string[]) || [];

  if (isLoading || !ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-48 w-full" /> {/* Master-Detail Paneli için */}
        <Skeleton className="h-64 w-full" /> {/* Tam Tablo için */}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. BREADCRUMB */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${lng}/dashboard/default`}>{t("sidebar.managementPanel.home")}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-sm font-medium">{t("sidebar.modules.production")}</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("sidebar.modules.productionDefinitions")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 2. MASTER-DETAIL PANELLERİ (Hızlı Yönetim) */}
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-[300px] max-h-[500px] w-full rounded-lg border"
      >
        {/* SOL PANEL (GRUPLAR) */}
        <ResizablePanel defaultSize={35} minSize={30}>
          <Card className="h-full rounded-r-none border-0 border-r shadow-none">
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <CardTitle className="text-lg">Gruplar</CardTitle>
              <Button
                size="sm"
                className="h-8"
                onClick={() => handleOpenForm('newGroup', null)}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Yeni Grup
              </Button>
            </CardHeader>
            <CardContent className="p-0 border-t">
              <ScrollArea className="h-[calc(500px-6.5rem)]"> {/* Yüksekliği ayarla */}
                {groups.map((group) => (
                  <Button
                    key={group.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start rounded-none border-b p-4 h-auto",
                      selectedGroup?.id === group.id && "bg-accent"
                    )}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-primary" />
                      <div className="flex flex-col items-start">
                        <span className="font-semibold">{group.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {group.subUnits?.length || 0} Bölüm
                        </span>
                      </div>
                    </div>
                  </Button>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* SAĞ PANEL (BÖLÜMLER DATATABLE) */}
        <ResizablePanel defaultSize={65} minSize={40}>
          <Card className="h-full rounded-l-none border-0 shadow-none">
            
            {/* BAŞLIK GÜNCELLEMESİ: Kırmızı Vurgu */}
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <span>Bölümler:</span>
                {selectedGroup ? (
                  <Badge
                    variant="destructive" // Kırmızı vurgu
                    className="text-base font-semibold px-2 py-0.5" 
                  >
                    {selectedGroup.name}
                  </Badge>
                ) : (
                  <span className="text-base font-normal text-muted-foreground">
                    (Grup Seçilmedi)
                  </span>
                )}
              </CardTitle>
              <Button
                size="sm"
                className="h-8"
                onClick={() => handleOpenForm('newSection', null)}
                disabled={!selectedGroup}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Yeni Bölüm
              </Button>
            </CardHeader>
            {/* BAŞLIK SONU */}

            <CardContent className="p-0 border-t">
              {selectedGroup ? (
                <DataTable table={sectionTable} columns={sectionColumns} />
              ) : (
                <div className="flex h-[calc(500px-6.5rem)] items-center justify-center">
                  <p className="text-muted-foreground">Bölümleri görmek için soldan bir grup seçin.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* 3. TÜM BİRİMLER TABLOSU (Genel Bakış) */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">Tüm Birimler (Genel Bakış)</h2>
              <Badge variant="outline" className="px-2.5 py-1 text-sm w-fit">
                <strong className="mr-1.5 font-semibold">{t("datatable.total", "Toplam")}</strong>
                {flatData.length}
              </Badge>
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
                    onBlur={() => { if (globalFilter === "") setIsSearchOpen(false); }}
                    className="h-9 pl-8 w-full"
                  />
                </div>
              ) : (
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setIsSearchOpen(true)}>
                  <Search className="h-4 w-4" />
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="mr-2 h-4 w-4" />
                    {t("datatable.filter", "Filtrele")}
                    {parentFilterValues.length > 0 && (
                      <Badge variant="secondary" className="ml-2 rounded-full px-1.5">{parentFilterValues.length}</Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
                  <DropdownMenuLabel>{t("production.unit.column.parentName")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {groups.map(group => (
                     <DropdownMenuCheckboxItem
                        key={group.id}
                        checked={parentFilterValues.includes(group.id)}
                        onCheckedChange={(isChecked) => handleParentFilterChange(group.id, isChecked)}
                      >
                        {group.name}
                      </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={parentFilterValues.length === 0}
                    onClick={() => fullTable.setColumnFilters([])}
                    className="text-destructive focus:text-destructive"
                  >
                    {t("datatable.clear_filters", "Filtreleri Temizle")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="rounded-t-none border-t">
            <DataTable table={fullTable} columns={fullHierarchyColumns} />
          </div>
        </CardContent>

        <CardFooter className="p-4 sm:p-6 border-t">
          <DataTablePagination table={fullTable} t={t} />
        </CardFooter>
      </Card>

      {/* 4. MODALLAR */}
      {isFormOpen && (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {formMode === 'newGroup' ? "Yeni Grup Oluştur" : 
                 formMode === 'newSection' ? "Yeni Bölüm Oluştur" : 
                 t("production.unit.dialogTitleEdit")}
              </DialogTitle>
              <DialogDescription>
                {t("production.unit.dialogDescription")}
              </DialogDescription>
            </DialogHeader>
            <ProductionUnitDefinitionForm
              initialData={itemToEdit}
              onSuccess={handleFormSuccess}
              allUnits={units} // Hiyerarşik tam liste
              lng={lng}
              formMode={formMode}
              parentGroupIdForNewSection={selectedGroup?.id || null}
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