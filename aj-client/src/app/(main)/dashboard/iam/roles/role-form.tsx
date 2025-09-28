"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { apiFetchAuth } from "@/lib/api-auth";
import { Role } from "@/types/role";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  name: z.string().min(2, "Rol adı en az 2 karakter olmalıdır."),
  permissions: z.array(z.string()),
});

type RoleFormProps = {
  initialData?: Role | null;
  onSuccess: () => void;
};

// Sayfa anahtarlarını daha anlaşılır isimlere çeviren bir harita
const pageNames: Record<string, string> = {
    PAGE_USERS: "Kullanıcı Yönetimi",
    PAGE_ROLES: "Rol Yönetimi",
    PAGE_LOGS: "Log Kayıtları",
    PAGE_TASKS: "Görev Yönetimi",
    PAGE_REPORTS: "Raporlar",
}

export function RoleForm({ initialData, onSuccess }: RoleFormProps) {
  const [allPermissions, setAllPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      permissions: initialData?.permissions || [],
    },
  });

  // HATA DÜZELTMESİ: initialData prop'u değiştiğinde formu resetle
  useEffect(() => {
    form.reset({
      name: initialData?.name || "",
      permissions: initialData?.permissions || [],
    });
  }, [initialData, form.reset]);

  useEffect(() => {
    apiFetchAuth("/api/iam/permissions")
      .then(res => res.json())
      .then(data => setAllPermissions(data.sort()));
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    const apiPath = initialData ? `/api/iam/roles/${initialData.id}` : "/api/iam/roles";
    const method = initialData ? "PUT" : "POST";

    try {
      await apiFetchAuth(apiPath, {
        method: method,
        body: JSON.stringify(values),
      });
      toast.success(initialData ? "Rol başarıyla güncellendi." : "Rol başarıyla oluşturuldu.");
      onSuccess();
    } catch (error: any) {
      toast.error("İşlem başarısız.", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };
  
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
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Rol Adı</FormLabel><FormControl><Input placeholder="Örn: Saha Operatörü" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        
        <Card>
            <CardHeader><CardTitle>Yetkiler</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sayfa / Modül</TableHead>
                            <TableHead className="text-center">Okuma</TableHead>
                            <TableHead className="text-center">Yazma (Ekleme/Düzenleme/Silme)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.keys(pagePermissions).map(pageKey => (
                            <TableRow key={pageKey}>
                                <TableCell className="font-medium">{pageNames[pageKey] || pageKey}</TableCell>
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
          {initialData ? "Değişiklikleri Kaydet" : "Rolü Oluştur"}
        </Button>
      </form>
    </Form>
  );
}