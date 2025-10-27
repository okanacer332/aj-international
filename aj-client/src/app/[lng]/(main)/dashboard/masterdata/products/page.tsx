// aj-client/src/app/[lng]/(main)/dashboard/masterdata/products/page.tsx
"use client";

import { useEffect, useState, useMemo, useCallback } from "react"; // useCallback eklendi
import { MasterProduct } from "@/types/master-product";
import { createMasterProductColumns } from "./columns";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthToken } from "@/lib/auth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MasterProductForm } from "./master-product-form";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n-client";
import { useParams } from "next/navigation";

// --- YENİ Interface ---
// DataTable'a gönderilecek düzleştirilmiş veri için tip
interface FlatMasterProduct extends MasterProduct {
  level: number;
  // Orijinal subProducts'ı koruyalım ki columns.tsx kontrol edebilsin
  // ama DataTable'ın kendisi bu alanı kullanmayacak.
  originalSubProducts?: MasterProduct[];
}

// --- GÜNCELLENMİŞ flattenProducts Fonksiyonu ---
function flattenProductsRecursive(
    products: MasterProduct[],
    level = 0,
    // expandedIds: Set<string> // Artık isExpanded state'ten geliyor
): FlatMasterProduct[] {
  const flatList: FlatMasterProduct[] = [];

  products.forEach(product => {
    // Ürünü düz listeye ekle, level bilgisini ve isExpanded durumunu ata
    flatList.push({
        ...product,
        level: level,
        isExpanded: product.isExpanded ?? false, // State'ten gelen isExpanded'ı kullan
        originalSubProducts: product.subProducts // Orijinal alt ürünleri koru
    });

    // Eğer ürün 'expanded' ise ve alt ürünleri varsa, rekürsif olarak devam et
    if (product.isExpanded && product.subProducts && product.subProducts.length > 0) {
      flatList.push(...flattenProductsRecursive(product.subProducts, level + 1));
    }
  });

  return flatList;
}

export default function MasterDataProductsPage() {
  // products state'i backend'den gelen ham, hiyerarşik veriyi tutacak
  const [products, setProducts] = useState<MasterProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productInForm, setProductInForm] = useState<MasterProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<MasterProduct | null>(null);

  const { lng } = useParams() as { lng: string };
  const { t, ready } = useTranslation(lng, 'common');

  // --- fetchData Güncellemesi: isExpanded'ı ilk başta sadece kökler için true yap ---
  const fetchData = useCallback(async () => { // useCallback içine alındı
    if (!getAuthToken()) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiFetchAuth("/api/masterdata/products");
      // Backend'den gelen veri zaten hiyerarşik olmalı (MasterProductService güncellendiği için)
      const data: MasterProduct[] = await res.json();

      // Mevcut expanded durumlarını koruyarak yeni veriyi işle
      setProducts(prevProducts => {
          const expandedIds = new Map<string, boolean>();
          // Rekürsif olarak mevcut durumu tara
          const findExpanded = (prods: MasterProduct[]) => {
              prods.forEach(p => {
                  if (p.isExpanded) expandedIds.set(p.id, true);
                  if (p.subProducts) findExpanded(p.subProducts);
              });
          };
          findExpanded(prevProducts);

          // Yeni veriye expanded durumunu uygula
          const mapNewData = (prods: MasterProduct[]): MasterProduct[] => {
              return prods.map(p => ({
                  ...p,
                  // Kök ürünler varsayılan olarak açık veya önceden açıksa açık kalsın
                  isExpanded: expandedIds.get(p.id) ?? !p.parentProductId,
                  subProducts: p.subProducts ? mapNewData(p.subProducts) : []
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
  }, [t]); // Bağımlılıklara t eklendi

  useEffect(() => {
    if (ready) {
      fetchData();
    }
  }, [ready, fetchData]); // fetchData useCallback bağımlılığı oldu

  // --- GÜNCELLENMİŞ handleToggle Fonksiyonu ---
  const handleToggle = useCallback((id: string) => {
      // Rekürsif olarak state'i güncelle
      const toggleProductExpansion = (prods: MasterProduct[]): MasterProduct[] => {
          return prods.map(p => {
              if (p.id === id) {
                  return { ...p, isExpanded: !p.isExpanded };
              }
              if (p.subProducts && p.subProducts.length > 0) {
                  return { ...p, subProducts: toggleProductExpansion(p.subProducts) };
              }
              return p;
          });
      };
      setProducts(prevProducts => toggleProductExpansion(prevProducts));
  }, []); // Bağımlılık yok

  const handleEdit = useCallback((product: MasterProduct) => { // useCallback içine alındı
    // Parent'ı açma mantığına artık gerek yok, çünkü veri zaten hiyerarşik.
    setProductInForm(product);
    setIsFormOpen(true);
  }, []); // Bağımlılık yok

  const handleDelete = useCallback((product: MasterProduct) => { // useCallback içine alındı
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  }, []); // Bağımlılık yok

  const confirmDelete = useCallback(async () => { // useCallback içine alındı
    if (!productToDelete) return;
    try {
      await apiFetchAuth(`/api/masterdata/products/${productToDelete.id}`, { method: 'DELETE' });
      toast.success(t('masterdata.product.toast.deleteSuccess', { productName: productToDelete.code }));
      fetchData(); // Veriyi yeniden çek
    } catch (e: any) {
      const errorMessageKey = e.message.includes("alt ürünleri") || e.message.includes("children")
          ? "masterdata.product.toast.deleteHasChildrenError" // Backend'den gelen hataya göre ayarla
          : "masterdata.product.toast.deleteUnknownError";
      toast.error(t("masterdata.product.toast.deleteFailed"), { description: t(errorMessageKey) });
    } finally {
      setProductToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  }, [productToDelete, t, fetchData]); // Bağımlılıklara t ve fetchData eklendi

  // DataTable için düzleştirilmiş veriyi oluştur
  const flatData = useMemo(() => flattenProductsRecursive(products), [products]);

  // Columns tanımı artık useCallback ile sarmalanabilir veya doğrudan useMemo içinde kullanılabilir
  const columnsWithHandlers = useMemo(() => createMasterProductColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onToggleExpand: handleToggle,
    t: t
    // columns artık FlatMasterProduct tipini bekliyor
  }), [handleEdit, handleDelete, handleToggle, t]); // Fonksiyonlar ve t bağımlılık oldu

  const table = useDataTableInstance({
    data: flatData,
    columns: columnsWithHandlers,
    getRowId: (row) => row.id.toString(),
  });

  if (isLoading || !ready) {
    // Skeleton aynı kalabilir
    return (
      <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('masterdata.product.pageTitle')}</h1>
          <p className="text-muted-foreground">{t('masterdata.product.pageDescription')}</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => setProductInForm(null)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('masterdata.product.newProductButton')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {productInForm ? t("masterdata.product.dialogTitleEdit") : t("masterdata.product.dialogTitleNew")}
                    </DialogTitle>
                    <DialogDescription>
                        {productInForm ?
                            t("masterdata.product.dialogDescriptionEdit", { productName: productInForm.name }) :
                            t("masterdata.product.dialogDescriptionNew")}
                    </DialogDescription>
                </DialogHeader>
                {/* MasterProductForm'a hiyerarşik 'products' state'ini gönderiyoruz */}
                <MasterProductForm
                    initialData={productInForm}
                    onSuccess={() => { setIsFormOpen(false); fetchData(); }}
                    masterProducts={products} // Hiyerarşik listeyi gönder
                    lng={lng}
                />
            </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
          {/* DataTable düzleştirilmiş 'flatData'yı kullanıyor */}
          <DataTable table={table} columns={columnsWithHandlers} />
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('masterdata.product.deleteDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              <b className="font-semibold">{productToDelete?.name} ({productToDelete?.code})</b> {t('masterdata.product.deleteDialogText1')}
              {/* Alt ürün kontrolü için backend hatasına güveniyoruz, frontend'de göstermeye gerek yok */}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('masterdata.product.cancelButton')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t('masterdata.product.deleteButton')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}