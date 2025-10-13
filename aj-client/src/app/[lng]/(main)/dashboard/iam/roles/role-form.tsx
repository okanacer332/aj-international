// aj-client/src/app/[lng]/(main)/dashboard/iam/roles/role-form.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { apiFetchAuth } from "@/lib/api-auth";
import { Role } from "@/types/role";
// YENİ IMPORT: i18n desteği için
import { useTranslation } from "@/lib/i18n-client"; 

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// KRİTİK DEĞİŞİKLİK 1: permissionTranslations nesnesi KALDIRILDI.
// Yetkiler için çeviri key'leri eklenecek (iam.permission.PAGE_...)

// KRİTİK DEĞİŞİKLİK 2: formSchema artık t fonksiyonunu alarak dinamik hale getirildi.
const createFormSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(2, t("iam.role.validation.nameMinLength")),
  permissions: z.array(z.string()),
});

// KRİTİK DEĞİŞİKLİK 3: lng prop'u eklendi
type RoleFormProps = {
  initialData?: Role | null;
  onSuccess: () => void;
  lng: string;
};

// YENİ YARDIMCI FONKSİYON: Yetki Key'inin çevirisini bulur.
const getPermissionTranslation = (pageKey: string, t: (key: string) => string): string => {
    // Örn: PAGE_USERS key'i için iam.permission.PAGE_USERS çevirisini arar.
    return t(`iam.permission.${pageKey}`) || pageKey;
};


export function RoleForm({ initialData, onSuccess, lng }: RoleFormProps) {
  const [allPermissions, setAllPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // KRİTİK DEĞİŞİKLİK: i18n Hook'u eklendi
  const { t, ready } = useTranslation(lng, 'common');

  // Hook çağrıları
  const formSchema = createFormSchema(t);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      permissions: initialData?.permissions || [],
    },
  });

  useEffect(() => {
    // Rol verisi değiştiğinde formu resetle
    if (ready) {
        form.reset({
            name: initialData?.name || "",
            permissions: initialData?.permissions || [],
        });
    }
  }, [initialData, form.reset, ready]);

  useEffect(() => {
    // Yetki listesini backend'den çek
    if (!ready) return;
      
    apiFetchAuth("/api/iam/permissions")
      .then(res => res.json())
      .then(data => setAllPermissions(data.sort()))
      .catch((error: any) => toast.error(t("iam.permission.toast.fetchError"), { description: error.message }));
  }, [ready, t]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    const apiPath = initialData ? `/api/iam/roles/${initialData.id}` : "/api/iam/roles";
    const method = initialData ? "PUT" : "POST";

    try {
      await apiFetchAuth(apiPath, {
        method: method,
        body: JSON.stringify(values),
      });
      // ÇEVİRİ: Başarı mesajı
      const successMsgKey = initialData ? "iam.role.toast.updateSuccess" : "iam.role.toast.creationSuccess";
      toast.success(t(successMsgKey));
      onSuccess();
    } catch (error: any) {
      // ÇEVİRİ: Hata mesajı ayrıştırma
      const errorMessageKey = error.message.includes("rol adı zaten mevcut") ? "iam.role.toast.nameUniqueError" : "iam.role.toast.unknownError";
      toast.error(t("iam.role.toast.operationFailed"), { description: t(errorMessageKey) });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Yetki gruplarını oluştur
  const pagePermissions = allPermissions.reduce((acc, permission) => {
    const [pageKey, action] = permission.split(':');
    if (!acc[pageKey]) {
      acc[pageKey] = {};
    }
    acc[pageKey][action] = true;
    return acc;
  }, {} as Record<string, Record<string, boolean>>);

  const handlePermissionChange = (permission: string, checked: boolean) => {
    const currentPermissions = form.getValues("permissions");
    let newPermissions: string[];
    if (checked) {
      newPermissions = [...currentPermissions, permission];
    } else {
      newPermissions = currentPermissions.filter(p => p !== permission);
    }
    form.setValue("permissions", newPermissions, { shouldDirty: true });
  };
  
  if (!ready) return null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
              {/* ÇEVİRİ: Rol Adı Etiketi */}
              <FormLabel>{t('iam.role.form.nameLabel')}</FormLabel>
              {/* ÇEVİRİ: Rol Adı Placeholder'ı */}
              <FormControl><Input placeholder={t('iam.role.form.namePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        
        <Card>
            <CardHeader><CardTitle>{t('iam.role.form.permissionsTitle')}</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            {/* ÇEVİRİ: Tablo Başlıkları */}
                            <TableHead>{t('iam.role.form.tableHeader.module')}</TableHead>
                            <TableHead className="text-center">{t('iam.role.form.tableHeader.read')}</TableHead>
                            <TableHead className="text-center">
                              {t('iam.role.form.tableHeader.write')}
                              <span className="hidden sm:inline"> {t('iam.role.form.tableHeader.writeSub')}</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.keys(pagePermissions).map(pageKey => (
                            <TableRow key={pageKey}>
                                {/* ÇEVİRİ: Modül Adı */}
                                <TableCell className="font-medium">{getPermissionTranslation(pageKey, t)}</TableCell>
                                <TableCell className="text-center">
                                    {pagePermissions[pageKey]['READ'] && (
                                        <Checkbox
                                            checked={form.watch("permissions").includes(`${pageKey}:READ`)}
                                            onCheckedChange={(checked) => handlePermissionChange(`${pageKey}:READ`, !!checked)}
                                        />
                                    )}
                                </TableCell>
                                <TableCell className="text-center">
                                    {pagePermissions[pageKey]['WRITE'] && (
                                         <Checkbox
                                            checked={form.watch("permissions").includes(`${pageKey}:WRITE`)}
                                            onCheckedChange={(checked) => handlePermissionChange(`${pageKey}:WRITE`, !!checked)}
                                        />
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {/* ÇEVİRİ: Buton Metni */}
          {initialData ? t("iam.role.updateButton") : t("iam.role.createButton")}
        </Button>
      </form>
    </Form>
  );
}