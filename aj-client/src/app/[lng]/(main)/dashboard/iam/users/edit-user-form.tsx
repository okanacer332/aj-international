// aj-client/src/app/[lng]/(main)/dashboard/iam/users/edit-user-form.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { apiFetchAuth } from "@/lib/api-auth";
import { Role } from "@/types/role";
import { User } from "@/types/user";
import { useTranslation } from "@/lib/i18n-client"; 

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

// KRİTİK DEĞİŞİKLİK: formSchema t fonksiyonunu alarak dinamik hale getirildi
const createFormSchema = (t: (key: string) => string) => z.object({
  fullName: z.string().min(3, t("validation.fullNameMinLength")),
  email: z.string().email(t("validation.emailInvalid")),
  roleId: z.string({ required_error: t("iam.user.validation.roleRequired") }), 
  active: z.boolean(),
});

// KRİTİK DEĞİŞİKLİK: lng prop'u eklendi
type EditUserFormProps = {
  user: User;
  onSuccess: () => void;
  lng: string;
};

export function EditUserForm({ user, onSuccess, lng }: EditUserFormProps) {
  // KRİTİK DÜZELTME: Hook'lar koşulsuz olarak en üstte çağrılır
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { t, ready } = useTranslation(lng, 'common'); // i18n hook'u

  useEffect(() => {
    if (!ready) return;
    
    apiFetchAuth("/api/iam/roles")
      .then(res => res.json())
      .then(setRoles)
      .catch(() => toast.error(t("iam.role.toast.fetchError")));
  }, [ready, t]);
  
  // Hook çağrıları
  const formSchema = createFormSchema(t);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: user.fullName,
      email: user.email || "", 
      roleId: user.roleIds[0] || "",
      active: user.active,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const payload = {
        ...values,
        roleIds: [values.roleId],
      };
      
      await apiFetchAuth(`/api/iam/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      toast.success(t("iam.user.toast.updateSuccess"));
      onSuccess();
    } catch (error: any) {
      toast.error(t("iam.user.toast.updateFailed"), { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!ready) return null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="fullName" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("iam.user.label.fullName")}</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
        )}/>
        <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("iam.user.label.email")}</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
        )}/>
        <FormField control={form.control} name="roleId" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("iam.user.label.role")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder={t("iam.user.placeholder.selectRole")} /></SelectTrigger></FormControl>
                <SelectContent>
                  {roles.map((role) => (<SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
        )}/>
        <FormField control={form.control} name="active" render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>{t("iam.user.label.activeStatus")}</FormLabel>
              </div>
              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
        )}/>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("iam.user.updateButton")}
        </Button>
      </form>
    </Form>
  );
}