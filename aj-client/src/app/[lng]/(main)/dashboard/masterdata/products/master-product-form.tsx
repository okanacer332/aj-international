"use client"; 

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { apiFetchAuth } from "@/lib/api-auth";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MasterProduct, MasterProductFormValues } from "@/types/master-product";


const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Ürün adı en az 2 karakter olmalıdır."),
  code: z.string().min(2, "Ürün kodu en az 2 karakter olmalıdır."),
  description: z.string().optional(),
  
  parentProductId: z.string().nullable().optional(), 
});

type MasterProductFormProps = {
  initialData: MasterProduct | null;
  onSuccess: () => void;
  masterProducts: MasterProduct[]; 
};

export function MasterProductForm({ initialData, onSuccess, masterProducts }: MasterProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const parentProducts = masterProducts.filter(p => !p.parentProductId);

  const form = useForm<MasterProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: initialData?.id || undefined,
      name: initialData?.name || "",
      code: initialData?.code || "",
      description: initialData?.description || "",
      parentProductId: initialData?.parentProductId || "ana_urun", 
    },
  });

  useEffect(() => {
    form.reset({
      id: initialData?.id || undefined,
      name: initialData?.name || "",
      code: initialData?.code || "",
      description: initialData?.description || "",
      parentProductId: initialData?.parentProductId || "ana_urun", 
    });
  }, [initialData, form.reset]);


  const onSubmit = async (values: MasterProductFormValues) => {
    setIsLoading(true);
    
    // Alt ürün seçimi yapılmamışsa (ana_urun gelmişse) null yap.
    const finalParentId = values.parentProductId === "ana_urun" ? null : values.parentProductId;

    const payload = {
        ...values,
        parentProductId: finalParentId,
    };
    
    // KRİTİK LOG: API'ye gönderilen son veriyi konsola yazdır
    console.log("API'a Gönderilen Veri (Payload):", payload); 

    try {
      await apiFetchAuth("/api/masterdata/products", {
        method: "POST", 
        body: JSON.stringify(payload),
      });
      
      toast.success(initialData ? "Ürün başarıyla güncellendi." : "Yeni ürün başarıyla kaydedildi.");
      onSuccess();
    } catch (error: any) {
      const errorMessage = error.message.includes("Benzersiz") ? "Bu ürün kodu zaten kullanılıyor." : error.message;
      toast.error("İşlem Başarısız", { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <FormField name="name" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Ürün Adı</FormLabel>
            <FormControl><Input placeholder="Örn: POLO Yaka T-Shirt" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}/>
        
        <FormField name="code" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Ürün Kodu</FormLabel>
            <FormControl><Input placeholder="Örn: PLY-01" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}/>
        
        <FormField name="parentProductId" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Ana Ürün (Parent)</FormLabel> 
            <Select 
                onValueChange={field.onChange} 
                value={field.value || "ana_urun"} 
                disabled={!!initialData?.parentProductId && !initialData.id}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Ana Ürün Değil (Bu bir ANA ÜRÜN olacak)" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="ana_urun">Ana Ürün Değil (Kendi Başına)</SelectItem> 
                
                {parentProducts
                    .filter(p => p.id !== initialData?.id)
                    .map(parent => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.name} ({parent.code})
                        </SelectItem>
                    ))
                }
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}/>

        <FormField name="description" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Açıklama</FormLabel>
            <FormControl><Textarea placeholder="Ürün ile ilgili detaylı açıklama..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}/>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Değişiklikleri Kaydet" : "Ürünü Oluştur"}
        </Button>
      </form>
    </Form>
  );
}