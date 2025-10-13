// aj-client/src/app/[lng]/(main)/dashboard/masterdata/products/page.tsx
"use client"; 

import { useEffect, useState, useMemo } from "react";
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
// YENİ IMPORTLAR: i18n ve lng için
import { useTranslation } from "@/lib/i18n-client";
import { useParams } from "next/navigation";


function flattenProducts(products: MasterProduct[]): MasterProduct[] {
  // ... (fonksiyon içeriği aynı)
  const flatList: MasterProduct[] = [];
  
  products.forEach(parent => {
    flatList.push(parent); 

    if (parent.isExpanded && parent.subProducts?.length) {
      parent.subProducts.forEach(child => {
        flatList.push({ 
          ...child, 
          parentProductId: parent.id,
          subProducts: undefined 
        });
      });
    }
  });

  return flatList;
}

export default function MasterDataProductsPage() {
  const [products, setProducts] = useState<MasterProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productInForm, setProductInForm] = useState<MasterProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<MasterProduct | null>(null);
  
  // KRİTİK DEĞİŞİKLİK: i18n Hook'ları eklendi
  const { lng } = useParams() as { lng: string };
  const { t, ready } = useTranslation(lng, 'common');
  
  const fetchData = async () => {
    if (!getAuthToken()) {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    try {
      const res = await apiFetchAuth("/api/masterdata/products");
      const data: MasterProduct[] = await res.json();
      
      setProducts(prevProducts => {
        const expandedIds = new Set(prevProducts.filter(p => p.isExpanded).map(p => p.id));
        return data.map(p => ({ 
            ...p, 
            isExpanded: expandedIds.has(p.id) || !p.parentProductId 
        }));
      });
    } catch (error) {
      // ÇEVİRİ: Hata mesajı güncellendi
      toast.error(t("masterdata.product.toast.fetchError"));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Çeviriler hazır olduğunda veri çek
    if(ready) {
        fetchData();
    }
  }, [ready, t]); // ready ve t eklendi
  
  const handleToggle = (id: string) => {
    setProducts(prevProducts => prevProducts.map(p => 
        p.id === id ? { ...p, isExpanded: !p.isExpanded } : p
    ));
  };
  
  const handleEdit = (product: MasterProduct) => {
    if (product.parentProductId) {
        setProducts(prevProducts => prevProducts.map(p => 
            p.id === product.parentProductId ? { ...p, isExpanded: true } : p
        ));
    }
    setProductInForm(product);
    setIsFormOpen(true);
  };
  
  const handleDelete = (product: MasterProduct) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
      if (!productToDelete) return;
      try {
          await apiFetchAuth(`/api/masterdata/products/${productToDelete.id}`, { method: 'DELETE' });
          // ÇEVİRİ: Başarı mesajı güncellendi
          toast.success(t('masterdata.product.toast.deleteSuccess', { productName: productToDelete.code }));
          fetchData(); 
      } catch (e: any) {
          // ÇEVİRİ: Hata mesajı güncellendi
          const errorMessageKey = e.message.includes("alt ürünleri") ? "masterdata.product.toast.deleteHasChildrenError" : "masterdata.product.toast.deleteUnknownError";
          toast.error(t("masterdata.product.toast.deleteFailed"), { description: t(errorMessageKey) });
      } finally {
          setProductToDelete(null);
          setIsDeleteDialogOpen(false);
      }
  }

  const flatData = useMemo(() => flattenProducts(products), [products]);
  
  const columnsWithHandlers = useMemo(() => createMasterProductColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onToggleExpand: handleToggle, 
    // YENİ EKLEME: Çeviri fonksiyonu columns'a iletilmeli
    t: t
  }), [products, t]); // t'yi bağımlılıklara ekle

  const table = useDataTableInstance({
    data: flatData,
    columns: columnsWithHandlers,
    getRowId: (row) => row.id.toString(),
  });

  if (isLoading || !ready) {
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
          {/* ÇEVİRİ: Ana Başlık */}
          <h1 className="text-2xl font-bold tracking-tight">{t('masterdata.product.pageTitle')}</h1>
          {/* ÇEVİRİ: Açıklama */}
          <p className="text-muted-foreground">{t('masterdata.product.pageDescription')}</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => setProductInForm(null)}> 
                    <Plus className="mr-2 h-4 w-4" />
                    {/* ÇEVİRİ: Buton Metni */}
                    {t('masterdata.product.newProductButton')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    {/* ÇEVİRİ: Diyalog Başlığı */}
                    <DialogTitle>
                        {productInForm ? t("masterdata.product.dialogTitleEdit") : t("masterdata.product.dialogTitleNew")}
                    </DialogTitle>
                    {/* ÇEVİRİ: Diyalog Açıklaması */}
                    <DialogDescription>
                        {productInForm ? 
                            t("masterdata.product.dialogDescriptionEdit", { productName: productInForm.name }) : 
                            t("masterdata.product.dialogDescriptionNew")}
                    </DialogDescription>
                </DialogHeader>
                <MasterProductForm 
                    initialData={productInForm} 
                    onSuccess={() => { setIsFormOpen(false); fetchData(); }} 
                    masterProducts={products} 
                    lng={lng} // lng prop'u forma iletildi
                />
            </DialogContent>
        </Dialog>
      </div>
      
      <div className="rounded-md border">
          <DataTable table={table} columns={columnsWithHandlers} /> 
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            {/* ÇEVİRİ: Silme Başlığı */}
            <AlertDialogTitle>{t('masterdata.product.deleteDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {/* ÇEVİRİ: Silme Açıklaması */}
              <b className="font-semibold">{productToDelete?.name} ({productToDelete?.code})</b> {t('masterdata.product.deleteDialogText1')}
              {productToDelete?.subProducts?.length ? t('masterdata.product.deleteDialogTextHasChildren') : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {/* ÇEVİRİ: İptal Butonu */}
            <AlertDialogCancel>{t('masterdata.product.cancelButton')}</AlertDialogCancel>
            {/* ÇEVİRİ: Silme Butonu */}
            <AlertDialogAction onClick={confirmDelete}>{t('masterdata.product.deleteButton')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}