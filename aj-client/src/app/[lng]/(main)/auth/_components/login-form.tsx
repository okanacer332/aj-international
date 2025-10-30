// src/app/[lng]/(main)/auth/_components/login-form.tsx
"use client";

import { useState, useEffect } from "react"; 
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
// GÜNCELLEME: Globe (Küre) ikonu eklendi
import { User, Lock, Loader2, Eye, EyeOff, Globe } from "lucide-react"; 

import { useTranslation } from "@/lib/i18n-client"; 

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// GÜNCELLEME: Select bileşenleri import edildi
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// GÜNCELLEME: Tenant (Ülke) seçeneklerini tanımladık
const tenants = [
  { value: "TR", label: "Türkiye" },
  { value: "RU", label: "Rusya" },
  { value: "DU", label: "Dubai" },
  // Not: superadmin, "SYSTEM" tenant'ı ile giriş yapmalı
  { value: "SYSTEM", label: "Süper Admin" }, 
];

// GÜNCELLEME: Zod şemasına tenantId eklendi
const createFormSchema = (t: (key: string) => string) => z.object({
  username: z.string().min(1, t('validation.usernameRequired')),
  password: z.string().min(1, t('validation.passwordRequired')),
  // "iam.user.validation.tenantRequired" anahtarını i18n dosyalarınızdan yeniden kullanıyoruz
  tenantId: z.string().min(1, t('iam.user.validation.tenantRequired')), 
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
    // GÜNCELLEME: tenantId için varsayılan değer eklendi
    defaultValues: { username: "", password: "", tenantId: "TR" },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        // GÜNCELLEME: API isteğine tenantId eklendi
        body: JSON.stringify({ 
          username: data.username, 
          password: data.password, 
          tenantId: data.tenantId // Tenant ID'yi gönder
        }),
      });
      const json = await res.json();

      document.cookie = `auth-token=${encodeURIComponent(json.accessToken)}; Path=/; SameSite=Lax`;

      toast.success(t('toast.loginSuccess'));
      router.replace(`/${lng}/dashboard/default`); 
    } catch (e: any) {
      // GÜNCELLEME: Backend'den gelen "BadCredentialsException" (örn: yanlış tenant) hatasını yakala
      const errorDesc = e.message.includes("yetkili değil") 
        ? t('toast.loginErrorTenant') // Yeni i18n anahtarı (aşağıya bakınız)
        : t('toast.loginErrorDescription');
      
      toast.error(t('toast.loginErrorTitle'), { description: errorDesc });
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready || !isMounted) {
    // ... iskelet (skeleton) kısmı aynı kaldı ...
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <Skeleton className="h-8 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full" />
          </div>
          {/* GÜNCELLEME: Tenant select için iskelet eklendi */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
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
                        aria-label={showPassword ? t("password.hide") : t("password.show")}
                    >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* YENİ EKLENEN FORM ALANI: Tenant (Ülke) Seçimi */}
            <FormField
              control={form.control}
              name="tenantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('login.tenantLabel')}</FormLabel> {/* Yeni i18n anahtarı */}
                  <div className="relative">
                    <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="pl-8">
                          <SelectValue placeholder={t('login.tenantPlaceholder')} /> {/* Yeni i18n anahtarı */}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tenants.map((tenant) => (
                          <SelectItem key={tenant.value} value={tenant.value}>
                            {tenant.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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