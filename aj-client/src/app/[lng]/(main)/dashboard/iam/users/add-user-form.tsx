// aj-client/src/app/[lng]/(main)/dashboard/iam/users/add-user-form.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { apiFetchAuth } from "@/lib/api-auth";
import { Role } from "@/types/role";
import { useTranslation } from "@/lib/i18n-client";
// GÜNCELLEME 1: Global state'ten kullanıcıyı çekmek için
import { useAuthStore } from "@/stores/auth-store";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// GÜNCELLEME 2: Zod şeması artık 'isSuperAdmin' bayrağına göre dinamik
const createFormSchema = (t: (key: string) => string, isSuperAdmin: boolean) => z.object({
  fullName: z.string().min(3, t("validation.fullNameMinLength")),
  email: z.string().email(t("validation.emailInvalid")),
  // Süper Admin değilse, tenantId alanı formda olmayacağı için 'optional' olmalı
  tenantId: isSuperAdmin
    ? z.string().min(1, t("iam.user.validation.tenantRequired"))
    : z.string().optional(),
  roleId: z.string({ required_error: t("iam.user.validation.roleRequired") }),
});

type AddUserFormProps = {
  onSuccess: () => void;
  lng: string;
};

export function AddUserForm({ onSuccess, lng }: AddUserFormProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { t, ready } = useTranslation(lng, 'common');
  
  // GÜNCELLEME 3: Global state'ten kullanıcıyı ve auth durumunu al
  const { user, isLoading: isAuthLoading } = useAuthStore();
  
  // GÜNCELLEME 4: Süper Admin olup olmadığını belirle
  const isSuperAdmin = user?.tenantId === "SYSTEM";

  useEffect(() => {
    if (!ready) return; 

    const fetchRoles = async () => {
      try {
        // Not: Bu API çağrısı (RoleService.getAllRoles) zaten tenant-aware.
        // Süper Admin tüm rolleri, normal admin sadece kendi rollerini görür.
        const res = await apiFetchAuth("/api/iam/roles");
        const data = await res.json();
        setRoles(data);
      } catch (error) {
        toast.error(t("iam.role.toast.fetchError"));
      }
    };
    fetchRoles();
  }, [ready, t]);
  
  // GÜNCELLEME 5: Şemayı 'isSuperAdmin' durumuna göre oluştur
  const formSchema = createFormSchema(t, isSuperAdmin);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    // GÜNCELLEME 6: Default tenantId'yi dinamik olarak ayarla
    // Süper Admin ise "TR" ile başlasın, normal admin ise kendi ülkesi olsun.
    defaultValues: {
      fullName: "",
      email: "",
      tenantId: isSuperAdmin ? "TR" : user?.tenantId,
    },
  });
  
  // GÜNCELLEME 7: Formun 'defaultValues' değerini kullanıcı yüklendikten sonra sıfırla
  useEffect(() => {
    if (user) {
      form.reset({
        fullName: "",
        email: "",
        tenantId: isSuperAdmin ? "TR" : user.tenantId,
      });
    }
  }, [user, isSuperAdmin, form.reset]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      // GÜNCELLEME 8: Payload'daki tenantId'yi güvenli bir şekilde belirle
      // Süper Admin ise formdan gelen değeri, değilse state'ten gelen kendi tenantId'sini kullan
      const payloadTenantId = isSuperAdmin ? values.tenantId : user?.tenantId;

      // Güvenlik katmanı (kullanıcı state'i bir şekilde boşsa)
      if (!payloadTenantId) {
        toast.error(t("iam.user.toast.creationFailed"), { description: "User tenant could not be determined." });
        setIsLoading(false);
        return;
      }

      const payload = {
        fullName: values.fullName,
        email: values.email,
        tenantId: payloadTenantId, // Güvenli tenantId'yi kullan
        roleIds: [values.roleId], 
        password: "1234" 
      };
      
      await apiFetchAuth("/api/iam/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success(t("iam.user.toast.creationSuccess"));
      onSuccess(); 
    } catch (error: any) {
      toast.error(t("iam.user.toast.creationFailed"), { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // GÜNCELLEME 9: Formu göstermeden önce hem dilin hem de kullanıcının yüklenmesini bekle
  if (!ready || isAuthLoading || !user) {
    // Yükleniyor... (veya bir Skeleton)
    return <div className="h-48 w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("iam.user.label.fullName")}</FormLabel>
              <FormControl>
                <Input placeholder={t("iam.user.placeholder.fullName")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("iam.user.label.email")}</FormLabel>
              <FormControl>
                <Input placeholder={t("iam.user.placeholder.email")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* GÜNCELLEME 10: "Ülke Kodu" alanı artık koşullu */}
        {isSuperAdmin && (
          <FormField
            control={form.control}
            name="tenantId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("iam.user.label.tenantId")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("iam.user.placeholder.tenantId")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <FormField
          control={form.control}
          name="roleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("iam.user.label.role")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("iam.user.placeholder.selectRole")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("iam.user.createButton")}
        </Button>
      </form>
    </Form>
  );
}