// aj-client/src/app/[lng]/(main)/dashboard/masterdata/products/page.tsx
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { MasterProduct } from "@/types/master-product";
import { createMasterProductColumns } from "./columns";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Input importu
import { Plus, Search } from "lucide-react"; // Search ikonu eklendi
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
// YENİ İMPORT
import { MeasureDefinition } from "@/types/measure-definition";

// Interface (Aynen kalır)
interface FlatMasterProduct extends MasterProduct {
  level: number;
  originalSubProducts?: MasterProduct[];
}

// flattenProductsRecursive (Aynen kalır)
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
  // YENİ STATE: Ölçü birimlerini tutmak için
  const [measures, setMeasures] = useState<MeasureDefinition[]>([]);
  // BİTTİ
  const [isLoading, setIsLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState(""); 

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productInForm, setProductInForm] = useState<MasterProduct | null>(null);
  const [productToDelete, setProductToDelete] =
    useState<MasterProduct | null>(null);

  const { lng } = useParams() as { lng: string };
  const { t, ready } = useTranslation(lng, "common");

  // GÜNCELLENDİ: fetchData hem ürünleri hem de ölçü birimlerini çeker
  const fetchData = useCallback(async () => {
    if (!getAuthToken()) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // Promise.all ile ikisini aynı anda çek
      const [productsRes, measuresRes] = await Promise.all([
        apiFetchAuth("/api/masterdata/products"),
        apiFetchAuth("/api/masterdata/measures"), // Yeni API çağrısı
      ]);
      
      const data: MasterProduct[] = await productsRes.json();
      const measuresData: MeasureDefinition[] = await measuresRes.json(); // Yeni veri
      setMeasures(measuresData); // State'i ayarla

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
  // BİTTİ

  useEffect(() => {
    if (ready) {
      fetchData();
    }
  }, [ready, fetchData]);

  // handleToggle, handleEdit, handleDelete (Aynen kalır)
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

  const flatData = useMemo(() => flattenProductsRecursive(products), [products]);

  // YENİ: Ölçü birimi haritası oluştur
  const measureMap = useMemo(() => {
    return new Map(measures.map((m) => [m.id, m.name]));
  }, [measures]);
  // BİTTİ

  // Sütunlar güncellendi: measureMap eklendi
  const columnsWithHandlers = useMemo(
    () =>
      createMasterProductColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onToggleExpand: handleToggle,
        t: t,
        measureMap: measureMap, // Haritayı yolla
      }),
    [handleEdit, handleDelete, handleToggle, t, measureMap] // measureMap eklendi
  );

  const table = useDataTableInstance({
    data: flatData,
    columns: columnsWithHandlers,
    getRowId: (row) => row.id.toString(),
    state: {
      globalFilter: globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });
  
  // Yükleme ve Render kısımları (Aynen kalır)
  if (isLoading || !ready) {
    return (
      <div className="space-y-2">
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("masterdata.product.pageTitle")}
          </h1>
          <p className="text-muted-foreground">
            {t("masterdata.product.pageDescription")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                t("masterdata.product.searchPlaceholder") || "Ürünlerde ara..."
              }
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="h-9 w-full sm:w-64 pl-8" 
            />
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setProductInForm(null)}
                className="h-9 shrink-0"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("masterdata.product.newProductButton")}
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

      <div className="rounded-md border">
        <DataTable table={table} columns={columnsWithHandlers} />
      </div>

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
    </div>
  );
}