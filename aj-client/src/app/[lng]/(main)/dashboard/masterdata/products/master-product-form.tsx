// aj-client/src/app/[lng]/(main)/dashboard/masterdata/products/master-product-form.tsx
"use client"; 

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { apiFetchAuth } from "@/lib/api-auth";
// YENİ IMPORT: i18n desteği için
import { useTranslation } from "@/lib/i18n-client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MasterProduct, MasterProductFormValues } from "@/types/master-product";

// KRİTİK DEĞİŞİKLİK: formSchema artık t fonksiyonunu alarak dinamik hale getirildi.
const createFormSchema = (t: (key: string) => string) => z.object({
  id: z.string().optional(),
  name: z.string().min(2, t("masterdata.product.validation.nameMinLength")),
  code: z.string().min(2, t("masterdata.product.validation.codeMinLength")),
  description: z.string().optional(),
  
  parentProductId: z.string().nullable().optional(), 
});

// KRİTİK DEĞİŞİKLİK: lng prop'u eklendi
type MasterProductFormProps = {
  initialData: MasterProduct | null;
  onSuccess: () => void;
  masterProducts: MasterProduct[]; 
  lng: string;
};

export function MasterProductForm({ initialData, onSuccess, masterProducts, lng }: MasterProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // KRİTİK DEĞİŞİKLİK: useTranslation Hook'u eklendi
  const { t, ready } = useTranslation(lng, 'common');
  
  const parentProducts = masterProducts.filter(p => !p.parentProductId);

  // Hook çağrıları koşulsuz alanda yapılmalı
  const formSchema = createFormSchema(t);

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
    // Çeviriler hazır olana kadar formun resetlenmesini beklemek gerekli değildir.
    // Ancak initialData değişirse resetlemeliyiz.
    if (ready) {
        form.reset({
            id: initialData?.id || undefined,
            name: initialData?.name || "",
            code: initialData?.code || "",
            description: initialData?.description || "",
            parentProductId: initialData?.parentProductId || "ana_urun", 
        });
    }
  }, [initialData, form.reset, ready]);


  const onSubmit = async (values: MasterProductFormValues) => {
    setIsLoading(true);
    
    // Alt ürün seçimi yapılmamışsa (ana_urun gelmişse) null yap.
    const finalParentId = values.parentProductId === "ana_urun" ? null : values.parentProductId;

    const payload = {
        ...values,
        parentProductId: finalParentId,
    };
    
    console.log("API'a Gönderilen Veri (Payload):", payload); 

    try {
      await apiFetchAuth("/api/masterdata/products", {
        method: "POST", 
        body: JSON.stringify(payload),
      });
      
      // ÇEVİRİ: Başarı mesajı
      const successMsgKey = initialData ? "masterdata.product.toast.updateSuccess" : "masterdata.product.toast.creationSuccess";
      toast.success(t(successMsgKey));
      onSuccess();
    } catch (error: any) {
      // ÇEVİRİ: Hata mesajı ayrıştırma
      const isUniqueError = error.message.includes("Benzersiz");
      const errorMessageKey = isUniqueError ? "masterdata.product.toast.codeUniqueError" : "masterdata.product.toast.unknownError";
      
      toast.error(t("masterdata.product.toast.operationFailed"), { description: t(errorMessageKey) });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Çeviriler yüklenene kadar bekleyelim (Hook'lar zaten koşulsuz çağrıldı)
  if (!ready) return null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <FormField name="name" control={form.control} render={({ field }) => (
          <FormItem>
            {/* ÇEVİRİ: Etiket */}
            <FormLabel>{t('masterdata.product.fieldName')}</FormLabel>
            <FormControl>
                {/* ÇEVİRİ: Placeholder */}
                <Input placeholder={t('masterdata.product.placeholderNameExample')} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}/>
        
        <FormField name="code" control={form.control} render={({ field }) => (
          <FormItem>
             {/* ÇEVİRİ: Etiket */}
            <FormLabel>{t('masterdata.product.fieldCode')}</FormLabel>
            <FormControl>
                {/* ÇEVİRİ: Placeholder */}
                <Input placeholder={t('masterdata.product.placeholderCodeExample')} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}/>
        
        <FormField name="parentProductId" control={form.control} render={({ field }) => (
          <FormItem>
             {/* ÇEVİRİ: Etiket */}
            <FormLabel>{t('masterdata.product.fieldParent')}</FormLabel> 
            <Select 
                onValueChange={field.onChange} 
                value={field.value || "ana_urun"} 
                disabled={!!initialData?.parentProductId && !initialData.id}
            >
              <FormControl>
                <SelectTrigger>
                   {/* ÇEVİRİ: Placeholder */}
                  <SelectValue placeholder={t('masterdata.product.placeholderParent')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                 {/* ÇEVİRİ: Kendi Başına seçeneği */}
                <SelectItem value="ana_urun">{t('masterdata.product.selectOptionMaster')}</SelectItem> 
                
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
             {/* ÇEVİRİ: Etiket */}
            <FormLabel>{t('masterdata.product.fieldDescription')}</FormLabel>
            <FormControl>
                {/* ÇEVİRİ: Placeholder */}
                <Textarea placeholder={t('masterdata.product.placeholderDescription')} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}/>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {/* ÇEVİRİ: Buton Metni */}
          {initialData ? t('masterdata.product.updateButton') : t('masterdata.product.createButton')}
        </Button>
      </form>
    </Form>
  );
}