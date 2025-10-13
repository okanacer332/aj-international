// aj-client/src/app/[lng]/(main)/dashboard/account/settings/profile-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { User } from "@/types/user";
import { apiFetchAuth } from "@/lib/api-auth";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n-client"; // İÇERİ AKIŞI KORU

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

// Hook dışı fonksiyon
const createFormSchema = (t: (key: string) => string) => z.object({
  fullName: z.string().min(3, t("validation.fullNameMinLength")),
  email: z.string().email(t("validation.emailInvalid")),
});

type ProfileFormProps = {
  user: User;
  onSuccess: () => void;
  lng: string; 
};

export function ProfileForm({ user, onSuccess, lng }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  // KRİTİK DÜZELTME: Hook'lar her zaman en üstte ve koşulsuz olmalı
  const { t, ready } = useTranslation(lng, 'common'); 
  
  const formSchema = createFormSchema(t);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: user.fullName || "",
      email: user.email || "",
    },
  });
  // KRİTİK DÜZELTME: Hook sonrası ilk kontrolü burada yapabiliriz.

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      await apiFetchAuth(`/api/account/me`, {
        method: "PUT",
        body: JSON.stringify(values),
      });
      toast.success(t("toast.profileUpdateSuccess")); 
      onSuccess();
    } catch (error: any) {
      toast.error(t("toast.profileUpdateError"), { description: error.message }); 
    } finally {
      setIsLoading(false);
    }
  };

  // KRİTİK DÜZELTME: Sadece render mantığı (return) en sona taşındı.
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
        <CardTitle>{t('account.settings.tab.profile')}</CardTitle>
        <CardDescription>{t('account.profile.description')}</CardDescription>
      </CardHeader>
      {/* ... JSX'in geri kalanı ... */}
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField name="username" render={() => (
              <FormItem>
                <FormLabel>{t('account.profile.usernameLabel')}</FormLabel>
                <FormControl>
                  <Input disabled value={user.username} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="fullName" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('account.profile.fullNameLabel')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('account.profile.fullNamePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('account.profile.emailLabel')}</FormLabel>
                <FormControl>
                  <Input type="email" placeholder={t('account.profile.emailPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('account.form.updateInfo')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}