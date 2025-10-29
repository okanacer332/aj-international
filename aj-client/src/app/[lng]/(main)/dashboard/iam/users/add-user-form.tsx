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
// Globe ikonu eklendi
import { Loader2, Globe } from "lucide-react";

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
// --- DEĞİŞİKLİK: Auth Store import edildi (opsiyonel - admin kontrolü için) ---
import { useAuthStore } from "@/stores/auth-store";

// Ülke seçenekleri (Tenant'lar) - LoginForm'daki ile aynı
const tenantOptions = [
  { value: "TR", label: "Türkiye", flag: "🇹🇷" },
  { value: "RU", label: "Россия", flag: "🇷🇺" },
  { value: "AE", label: "Dubai (UAE)", flag: "🇦🇪" },
];

const createFormSchema = (t: (key: string) => string) => z.object({
  fullName: z.string().min(3, t("validation.fullNameMinLength")),
  email: z.string().email(t("validation.emailInvalid")),
  // tenantId tipi değişmedi, sadece component değişecek
  tenantId: z.string({ required_error: t("iam.user.validation.tenantRequired") }),
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
  // --- DEĞİŞİKLİK: Mevcut kullanıcı bilgisi alındı ---
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.username === 'admin';

  useEffect(() => {
    if (!ready) return;
    const fetchRoles = async () => { /* ... rol fetch etme kodu aynı ... */
      try {
        const res = await apiFetchAuth("/api/iam/roles");
        const data = await res.json();
        setRoles(data);
      } catch (error) {
        toast.error(t("iam.role.toast.fetchError"));
      }
    };
    fetchRoles();
  }, [ready, t]);

  const formSchema = createFormSchema(t);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    // Varsayılan tenantId: Süper admin değilse mevcut kullanıcının tenant'ı, süper admin ise TR
    defaultValues: {
      fullName: "",
      email: "",
      tenantId: !isSuperAdmin && currentUser ? currentUser.tenantId : "TR",
    },
  });

  // onSubmit kodu aynı kalıyor
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const payload = { /* ... payload aynı ... */
        fullName: values.fullName,
        email: values.email,
        tenantId: values.tenantId,
        roleIds: [values.roleId],
        password: "1234"
      };
      await apiFetchAuth("/api/iam/users", { /* ... API çağrısı aynı ... */
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

  if (!ready) return null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Ad Soyad alanı aynı */}
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
        {/* Email alanı aynı */}
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

        {/* --- DEĞİŞİKLİK: Tenant ID Alanı (Input yerine Select) --- */}
         <FormField
          control={form.control}
          name="tenantId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("iam.user.label.tenantId")}</FormLabel>
               {/* Sadece süper admin tenant değiştirebilir */}
               <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={!isSuperAdmin} // Süper admin değilse disable
                >
                <FormControl>
                  <SelectTrigger>
                    {/* Seçili değeri bayrakla göster */}
                    <SelectValue placeholder={t("tenantPlaceholder", "Ülke Seçin...")}>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        {tenantOptions.find(opt => opt.value === field.value)?.label ?? t("tenantPlaceholder", "Ülke Seçin...")}
                        <span className="ml-auto">{tenantOptions.find(opt => opt.value === field.value)?.flag}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tenantOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span>{option.flag}</span>
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* --- DEĞİŞİKLİK SONU --- */}

        {/* Rol alanı aynı */}
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
        {/* Buton aynı */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("iam.user.createButton")}
        </Button>
      </form>
    </Form>
  );
}