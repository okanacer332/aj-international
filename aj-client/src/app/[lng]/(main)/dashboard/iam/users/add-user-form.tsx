// aj-client/src/app/[lng]/(main)/dashboard/iam/users/add-user-form.tsx
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

// KRİTİK DEĞİŞİKLİK: formSchema t fonksiyonunu alarak dinamik hale getirildi
const createFormSchema = (t: (key: string) => string) => z.object({
  fullName: z.string().min(3, t("validation.fullNameMinLength")),
  email: z.string().email(t("validation.emailInvalid")),
  tenantId: z.string().min(1, t("iam.user.validation.tenantRequired")),
  roleId: z.string({ required_error: t("iam.user.validation.roleRequired") }),
});

// KRİTİK DEĞİŞİKLİK: lng prop'u eklendi
type AddUserFormProps = {
  onSuccess: () => void; // Form başarıyla gönderildiğinde çağrılacak fonksiyon
  lng: string;
};

export function AddUserForm({ onSuccess, lng }: AddUserFormProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // KRİTİK DEĞİŞİKLİK: i18n Hook'u eklendi
  const { t, ready } = useTranslation(lng, 'common');

  // Component yüklendiğinde rolleri backend'den çek
  useEffect(() => {
    if (!ready) return; // Çeviriler hazır değilse API çağrısı yapma

    const fetchRoles = async () => {
      try {
        const res = await apiFetchAuth("/api/iam/roles");
        const data = await res.json();
        setRoles(data);
      } catch (error) {
        // ÇEVİRİ: Hata mesajı
        toast.error(t("iam.role.toast.fetchError"));
      }
    };
    fetchRoles();
  }, [ready, t]);
  
  // Hook çağrıları koşulsuz alanda yapılmalı
  const formSchema = createFormSchema(t);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", email: "", tenantId: "TR" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const payload = {
        fullName: values.fullName,
        email: values.email,
        tenantId: values.tenantId,
        roleIds: [values.roleId], 
        password: "1234" 
      };
      
      await apiFetchAuth("/api/iam/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // ÇEVİRİ: Başarı mesajı
      toast.success(t("iam.user.toast.creationSuccess"));
      onSuccess(); 
    } catch (error: any) {
      // ÇEVİRİ: Hata mesajı
      toast.error(t("iam.user.toast.creationFailed"), { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready) return null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              {/* ÇEVİRİ: Etiket */}
              <FormLabel>{t("iam.user.label.fullName")}</FormLabel>
              <FormControl>
                {/* ÇEVİRİ: Placeholder */}
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
              {/* ÇEVİRİ: Etiket */}
              <FormLabel>{t("iam.user.label.email")}</FormLabel>
              <FormControl>
                {/* ÇEVİRİ: Placeholder */}
                <Input placeholder={t("iam.user.placeholder.email")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="tenantId"
          render={({ field }) => (
            <FormItem>
              {/* ÇEVİRİ: Etiket */}
              <FormLabel>{t("iam.user.label.tenantId")}</FormLabel>
              <FormControl>
                {/* ÇEVİRİ: Placeholder */}
                <Input placeholder={t("iam.user.placeholder.tenantId")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="roleId"
          render={({ field }) => (
            <FormItem>
              {/* ÇEVİRİ: Etiket */}
              <FormLabel>{t("iam.user.label.role")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    {/* ÇEVİRİ: Placeholder */}
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
          {/* ÇEVİRİ: Buton Metni */}
          {t("iam.user.createButton")}
        </Button>
      </form>
    </Form>
  );
}