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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const formSchema = z.object({
  name: z.string().min(2, "Rol adı en az 2 karakter olmalıdır."),
  permissions: z.array(z.string()).optional(),
});

type RoleFormProps = {
  initialData?: Role | null; // Düzenleme için mevcut rol verisi
  onSuccess: () => void;
};

export function RoleForm({ initialData, onSuccess }: RoleFormProps) {
  const [allPermissions, setAllPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Component yüklendiğinde tüm sistem yetkilerini backend'den çek
  useEffect(() => {
    apiFetchAuth("/api/iam/permissions")
      .then(res => res.json())
      .then(data => setAllPermissions(data.sort()));
  }, []);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      permissions: initialData?.permissions || [],
    },
  });

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
  
  const permissionGroups = allPermissions.reduce((acc, permission) => {
    const group = permission.split(':')[0];
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(permission);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Rol Adı</FormLabel><FormControl><Input placeholder="Örn: Saha Operatörü" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        
        <div className="space-y-2">
            <FormLabel>Yetkiler</FormLabel>
            <div className="rounded-md border p-4 max-h-64 overflow-y-auto">
                <Accordion type="multiple" className="w-full">
                    {Object.entries(permissionGroups).map(([groupName, permissions]) => (
                        <AccordionItem value={groupName} key={groupName}>
                            <AccordionTrigger className="capitalize">{groupName.toLowerCase()} Yetkileri</AccordionTrigger>
                            <AccordionContent>
                                {permissions.map((permission) => (
                                    <FormField key={permission} control={form.control} name="permissions" render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 my-2">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value?.includes(permission)}
                                                    onCheckedChange={(checked) => {
                                                        return checked
                                                            ? field.onChange([...(field.value || []), permission])
                                                            : field.onChange(field.value?.filter((value) => value !== permission));
                                                    }}
                                                />
                                            </FormControl>
                                            <FormLabel className="font-normal">{permission.split(':')[1]}</FormLabel>
                                        </FormItem>
                                    )}/>
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Değişiklikleri Kaydet" : "Rolü Oluştur"}
        </Button>
      </form>
    </Form>
  );
}