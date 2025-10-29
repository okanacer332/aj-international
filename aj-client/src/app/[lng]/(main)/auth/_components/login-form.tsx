// src/app/[lng]/(main)/auth/_components/login-form.tsx
"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api"; // apiFetchAuth yerine apiFetch kullanılıyor
import { User, Lock, Loader2, Eye, EyeOff, Globe } from "lucide-react"; // Globe ikonu eklendi

import { useTranslation } from "@/lib/i18n-client";

// --- YENİ IMPORTLAR ---
import { useTenantStore, supportedTenants, TenantCode, defaultTenant } from "@/stores/tenant-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// --- YENİ IMPORTLAR SONU ---

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// --- Form Şeması Güncellemesi: tenantId eklendi ---
const createFormSchema = (t: (key: string) => string) => z.object({
  username: z.string().min(1, t('validation.usernameRequired')),
  password: z.string().min(1, t('validation.passwordRequired')),
  tenantId: z.custom<TenantCode>( // Özel tip kontrolü
      (val) => supportedTenants.some(t => t.code === val), // Geçerli tenant kodlarından biri mi?
      { message: t('validation.tenantRequired') || 'Lütfen geçerli bir operasyon ülkesi seçin.' } // Yeni çeviri anahtarı eklenebilir
  ),
});
// --- Form Şeması Güncellemesi Sonu ---

export function LoginForm({ lng }: { lng: string }) {
  const { t, ready } = useTranslation(lng, 'common');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // --- YENİ: Zustand store'dan fonksiyonu al ---
  const setCurrentTenantId = useTenantStore((state) => state.setCurrentTenantId);
  // --- YENİ SONU ---

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const FormSchema = createFormSchema(t);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    // --- Varsayılan Değerler Güncellemesi: tenantId eklendi ---
    defaultValues: {
        username: "",
        password: "",
        tenantId: defaultTenant // Varsayılan tenant ile başla
    },
    // --- Varsayılan Değerler Güncellemesi Sonu ---
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsLoading(true);
    try {
      // Login isteği tenantId göndermez, kullanıcıyı doğrular
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: data.username, password: data.password }),
        // X-Tenant-ID header'ı login için GEREKMEZ.
        // Tenant bilgisi başarılı giriş SONRASI set edilir.
      });
      const json = await res.json();

      // Token'ı cookie'ye yaz
      document.cookie = `auth-token=${encodeURIComponent(json.accessToken)}; Path=/; SameSite=Lax`;

      // --- YENİ: Başarılı giriş sonrası seçilen tenant'ı global state'e yaz ---
      setCurrentTenantId(data.tenantId);
      // --- YENİ SONU ---

      toast.success(t('toast.loginSuccess'));
      router.replace(`/${lng}/dashboard/default`);
    } catch (e: any) {
      toast.error(t('toast.loginErrorTitle'), { description: t('toast.loginErrorDescription') });
    } finally {
      setIsLoading(false);
    }
  };

  // İskelet gösterim kısmı aynı kalabilir
  if (!ready || !isMounted) {
     return (
       <Card className="w-full max-w-sm">
         <CardHeader>
           <Skeleton className="h-8 w-32" />
         </CardHeader>
         <CardContent className="space-y-4">
           {/* Tenant Select Skeleton */}
           <div className="space-y-2">
             <Skeleton className="h-4 w-28" />
             <Skeleton className="h-9 w-full" />
           </div>
           {/* Username Skeleton */}
           <div className="space-y-2">
             <Skeleton className="h-4 w-24" />
             <Skeleton className="h-9 w-full" />
           </div>
           {/* Password Skeleton */}
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
          {/* Form elemanları arasına space-y-4 eklendi */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* --- YENİ: Operasyon Ülkesi Seçimi --- */}
            <FormField
              control={form.control}
              name="tenantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('tenantSelection.label') || 'Operasyon Ülkesi'}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('tenantSelection.placeholder') || 'Ülke seçin...'} asChild>
                           {/* Seçili tenant'ın bayrağını ve adını göster */}
                           <div className="flex items-center gap-2">
                              <span className="text-lg leading-none">
                                {supportedTenants.find(t => t.code === field.value)?.flag || '🌐'}
                              </span>
                              <span>
                               {supportedTenants.find(t => t.code === field.value)?.name || field.value}
                              </span>
                           </div>
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {supportedTenants.map((tenant) => (
                        <SelectItem key={tenant.code} value={tenant.code}>
                           {/* Seçeneklerde de bayrak ve adı göster */}
                           <div className="flex items-center gap-2">
                              <span className="text-lg leading-none">{tenant.flag}</span>
                              <span>{tenant.name}</span>
                           </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* --- YENİ SONU --- */}

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
                        aria-label={t(showPassword ? 'password.hide' : 'password.show')}
                    >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
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