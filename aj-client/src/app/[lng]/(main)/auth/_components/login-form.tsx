// src/app/[lng]/(main)/auth/_components/login-form.tsx
"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
// İkonlar: Globe eklendi
import { User, Lock, Loader2, Eye, EyeOff, Globe } from "lucide-react";

import { useTranslation } from "@/lib/i18n-client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
// Select bileşenleri import edildi
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Ülke seçenekleri (Tenant'lar)
const tenantOptions = [
  { value: "TR", label: "Türkiye", flag: "🇹🇷" },
  { value: "RU", label: "Россия", flag: "🇷🇺" },
  { value: "AE", label: "Dubai (UAE)", flag: "🇦🇪" },
];

// Form şemasına tenantId eklendi
const createFormSchema = (t: (key: string) => string) => z.object({
  tenantId: z.string({ required_error: t('validation.tenantRequired') }), // Tenant ID zorunlu
  username: z.string().min(1, t('validation.usernameRequired')),
  password: z.string().min(1, t('validation.passwordRequired')),
});

export function LoginForm({ lng }: { lng: string }) {
  const { t, ready } = useTranslation(lng, 'common');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const FormSchema = createFormSchema(t);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    // tenantId için varsayılan değer (örn: Türkiye)
    defaultValues: { tenantId: "TR", username: "", password: "" },
  });

  // onSubmit fonksiyonu tenantId'yi içerecek şekilde güncellendi
  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        // tenantId payload'a eklendi
        body: JSON.stringify({
          tenantId: data.tenantId,
          username: data.username,
          password: data.password
        }),
      });
      const json = await res.json();

      document.cookie = `auth-token=${encodeURIComponent(json.accessToken)}; Path=/; SameSite=Lax`;
      // Seçilen tenantId'yi de cookie'ye veya local storage'a kaydedebiliriz (opsiyonel)
      // document.cookie = `tenant-id=${encodeURIComponent(data.tenantId)}; Path=/; SameSite=Lax`;

      toast.success(t('toast.loginSuccess'));
      router.replace(`/${lng}/dashboard/default`);
    } catch (e: any) {
      toast.error(t('toast.loginErrorTitle'), { description: t('toast.loginErrorDescription') });
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready || !isMounted) {
    // Skeleton yapısı güncellendi (Tenant alanı için)
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <Skeleton className="h-8 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
           {/* Tenant Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full" />
          </div>
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">{t('loginTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             {/* Ülke Seçimi (Tenant) Alanı Eklendi */}
            <FormField
              control={form.control}
              name="tenantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('tenantLabel', 'Operasyon Ülkesi')}</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                          {/* Seçili değeri bayrakla göster */}
                          <SelectValue placeholder={t('tenantPlaceholder', 'Ülke Seçin...')}>
                              <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4 text-muted-foreground" />
                                  {tenantOptions.find(opt => opt.value === field.value)?.label ?? t('tenantPlaceholder', 'Ülke Seçin...')}
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

            {/* Mevcut Kullanıcı Adı Alanı */}
            <FormField
              name="username"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('usernameLabel')}</FormLabel>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input type="text" placeholder={t('usernamePlaceholder')} autoComplete="username" {...field} className="pl-8" />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mevcut Şifre Alanı */}
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('passwordLabel')}</FormLabel>
                   <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                        <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            {...field}
                            className="pl-8 pr-10"
                        />
                    </FormControl>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 size-9 text-muted-foreground hover:bg-transparent"
                        onClick={() => setShowPassword(prev => !prev)}
                        aria-label={showPassword ? t("password.hide") : t("password.show")}
                    >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mevcut Giriş Butonu */}
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('loginButton')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}