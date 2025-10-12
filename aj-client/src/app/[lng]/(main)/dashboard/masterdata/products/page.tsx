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


function flattenProducts(products: MasterProduct[]): MasterProduct[] {
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
            isExpanded: expandedIds.has(p.id) || !p.parentProductId // Ana ürünleri varsayılan olarak açık getir
        }));
      });
    } catch (error) {
      toast.error("Ürün listesi getirilemedi.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  
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
          toast.success(`Ürün (${productToDelete.code}) başarıyla silindi.`);
          fetchData(); 
      } catch (e: any) {
          toast.error("Silme Başarısız", { description: e.message.includes("alt ürünleri") ? "Bu ana ürünün alt ürünleri mevcut. Önce alt ürünleri silmelisiniz." : "Bilinmeyen bir hata oluştu." });
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
  }), [products]);

  const table = useDataTableInstance({
    data: flatData,
    columns: columnsWithHandlers,
    getRowId: (row) => row.id.toString(),
  });

  if (isLoading) {
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
          <h1 className="text-2xl font-bold tracking-tight">Ürün Tanımları</h1>
          <p className="text-muted-foreground">Geri dönüştürülecek ana ürün türlerini ve kırılımlarını (Tree Table) yönetin.</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => setProductInForm(null)}> 
                    <Plus className="mr-2 h-4 w-4" />
                    Yeni Ürün Tanımla
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{productInForm ? "Ürünü Düzenle" : "Yeni Ürün Tanımla"}</DialogTitle>
                    <DialogDescription>
                        {productInForm ? 
                            `${productInForm.name} ürününün bilgilerini güncelleyin.` : 
                            "Yeni ana ürün veya alt ürün kaydı oluşturun."}
                    </DialogDescription>
                </DialogHeader>
                <MasterProductForm 
                    initialData={productInForm} 
                    onSuccess={() => { setIsFormOpen(false); fetchData(); }} 
                    masterProducts={products} 
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
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              <b className="font-semibold">{productToDelete?.name} ({productToDelete?.code})</b> ürününü kalıcı olarak silmek üzeresiniz. Bu işlem geri alınamaz. 
              {productToDelete?.subProducts?.length ? " (DİKKAT: Bu bir ana üründür ve alt ürünleri mevcuttur. Bu alt ürünler de silinecektir.)" : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}