"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { UnitDefinition } from "@/types/unit-definition";
import { createUnitDefinitionColumns } from "./columns";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthToken } from "@/lib/auth"; // Eklendi
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
import { UnitDefinitionForm } from "./unit-definition-form"; // Form importu güncellendi
import { useTranslation } from "@/lib/i18n-client";
import { useParams } from "next/navigation";
// Pagination eklendi
import { DataTablePagination } from "@/components/data-table/data-table-pagination"; 

// Hiyerarşi için Arayüz (Product'tan kopyalandı)
interface FlatUnitDefinition extends UnitDefinition {
  level: number;
  originalSubUnits?: UnitDefinition[];
  isExpanded?: boolean;
}

// Hiyerarşiyi Düzleştirme Fonksiyonu (Product'tan kopyalandı)
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
      originalSubUnits: unit.subUnits, // subProducts değil, subUnits
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
  // State'ler (Product'tan uyarlandı)
  const [units, setUnits] = useState<UnitDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<UnitDefinition | null>(null);
  const [itemToDelete, setItemToDelete] = useState<UnitDefinition | null>(null);

  const { lng } = useParams() as { lng: string };
  const { t, ready } = useTranslation(lng, "common");

  // Veri Çekme (Product'tan uyarlandı)
  const fetchData = useCallback(async () => {
    if (!getAuthToken()) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // Sadece birimleri çekiyoruz
      const res = await apiFetchAuth("/api/masterdata/units");
      const data: UnitDefinition[] = await res.json();
      
      // Genişletme (expansion) durumunu koru
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
            // Kök öğeler (departmanlar) varsayılan olarak açık gelsin
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

  // --- Handler Fonksiyonları (Product'tan kopyalandı) ---

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
      // Backend'den gelen 'IllegalStateException' mesajını yakala
      const isChildrenError = e.message.includes("altında tanımlı") || e.message.includes("atanmış personel");
      const errorMessageKey = isChildrenError
        ? e.message // Direkt backend'den gelen mesajı göster
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

  const table = useDataTableInstance({
    data: flatData,
    columns: columns,
    getRowId: (row) => row.id.toString(), // Tree table için ID'ler önemli
    state: {
      globalFilter: globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  // --- Render (Yükleme) ---
  if (isLoading || !ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-6 w-2/3" />
        <div className="flex justify-end gap-2 py-4">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // --- Render (Sayfa) ---
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("masterdata.unit.pageTitle")}
          </h1>
          <p className="text-muted-foreground">
            {t("masterdata.unit.pageDescription")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              // Arama çevirisini Product'tan alıyoruz, ikisi de aynı işi yapıyor
              placeholder={t("masterdata.product.searchPlaceholder")}
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="h-9 w-full sm:w-64 pl-8"
            />
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedItem(null)} className="h-9">
                <Plus className="mr-2 h-4 w-4" />
                {t("masterdata.unit.newButton")}
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
              {/* FORMA 'allUnits' PROP'UNU EKLİYORUZ */}
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

      <div className="rounded-md border">
        {/* 'data' yerine 'flatData' kullanılıyor */}
        <DataTable table={table} columns={columns} />
      </div>
      {/* Pagination eklendi */}
      <DataTablePagination table={table} /> 

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
    </div>
  );
}