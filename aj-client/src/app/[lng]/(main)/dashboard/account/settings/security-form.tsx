// aj-client/src/app/[lng]/(main)/dashboard/account/settings/security-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { apiFetchAuth } from "@/lib/api-auth";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n-client"; 
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const createFormSchema = (t: (key: string) => string) => z.object({
    currentPassword: z.string().min(1, t("validation.currentPasswordRequired")),
    newPassword: z.string().min(6, t("validation.newPasswordMinLength")),
  }).refine((data) => data.currentPassword !== data.newPassword, {
    message: t("validation.newPasswordSameAsCurrent"),
    path: ["newPassword"],
  });

type SecurityFormProps = {
  lng: string;
};

export function SecurityForm({ lng }: SecurityFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({ current: false, new: false }); 
  
  // KRİTİK DÜZELTME: Hook'lar KOŞULSUZ olarak çağrılır.
  const { t, ready } = useTranslation(lng, 'common'); 
  
  const formSchema = createFormSchema(t);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });
  // KRİTİK DÜZELTME: Tüm Hook'lar çağrıldı, artık erken çıkış yapabiliriz.

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      await apiFetchAuth(`/api/account/change-password`, {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success(t("toast.passwordChangeSuccess"));
      form.reset(); 
    } catch (error: any) {
      toast.error(t("toast.passwordChangeError"), { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const ToggleButton = ({ fieldName }: { fieldName: 'current' | 'new' }) => {
    const isShowing = showPassword[fieldName];
    return (
        <Button
            type="button" 
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 size-9 text-muted-foreground hover:bg-transparent"
            onClick={() => setShowPassword(prev => ({ ...prev, [fieldName]: !isShowing }))}
            aria-label={t(isShowing ? "password.hide" : "password.show")}
        >
            {isShowing ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
    );
  };
  
  // KRİTİK DÜZELTME: Çeviriler hazır değilse boş bir iskelet göster.
  if (!ready) {
       return (
          <Card>
              <CardHeader><div className="h-6 w-1/3 bg-gray-200 animate-pulse rounded-md" /></CardHeader>
              <CardContent><div className="h-40 w-full bg-gray-200 animate-pulse rounded-md" /></CardContent>
          </Card>
      );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('account.settings.tab.security')}</CardTitle>
        <CardDescription>{t('account.security.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="currentPassword" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('account.security.currentPasswordLabel')}</FormLabel>
                <div className="relative">
                    <FormControl>
                        <Input type={showPassword['current'] ? "text" : "password"} {...field} className="pr-10" />
                    </FormControl>
                    <ToggleButton fieldName="current" />
                </div>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="newPassword" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('account.security.newPasswordLabel')}</FormLabel>
                <div className="relative">
                    <FormControl>
                        <Input type={showPassword['new'] ? "text" : "password"} {...field} className="pr-10" />
                    </FormControl>
                    <ToggleButton fieldName="new" />
                </div>
                <FormMessage />
              </FormItem>
            )}/>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('account.security.changePasswordButton')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}