// src/app/[lng]/(main)/auth/_components/login-form.tsx
"use client";

// useEffect ve useState'i import ediyoruz
import { useState, useEffect } from "react"; 
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
// İKON GÜNCELLEMESİ: Eye ve EyeOff eklendi.
import { User, Lock, Loader2, Eye, EyeOff } from "lucide-react"; 

import { useTranslation } from "@/lib/i18n-client"; 

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const createFormSchema = (t: (key: string) => string) => z.object({
  username: z.string().min(1, t('validation.usernameRequired')),
  password: z.string().min(1, t('validation.passwordRequired')),
});

export function LoginForm({ lng }: { lng: string }) {
  const { t, ready } = useTranslation(lng, 'common');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // YENİ EKLENEN KISIM: Bileşenin istemcide mount edilip edilmediğini takip eden state
  const [isMounted, setIsMounted] = useState(false);
  
  // YENİ EKLENEN KISIM: Şifre görünürlüğünü yöneten state
  const [showPassword, setShowPassword] = useState(false); 

  // YENİ EKLENEN KISIM: Bileşen ilk kez mount olduğunda bu state'i true yap
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const FormSchema = createFormSchema(t);
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: data.username, password: data.password }),
      });
      const json = await res.json();

      document.cookie = `auth-token=${encodeURIComponent(json.accessToken)}; Path=/; SameSite=Lax`;

      toast.success(t('toast.loginSuccess'));
      router.replace(`/${lng}/dashboard/default`); 
    } catch (e: any) {
      toast.error(t('toast.loginErrorTitle'), { description: t('toast.loginErrorDescription') });
    } finally {
      setIsLoading(false);
    }
  };

  // GÜNCELLENEN KONTROL: Eğer çeviriler hazır değilse VEYA bileşen henüz client'ta mount edilmemişse iskeleti göster.
  if (!ready || !isMounted) {
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
                        {/* KRİTİK DEĞİŞİKLİK: Input type'ı dinamik hale getirildi. */}
                        <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            autoComplete="current-password" 
                            {...field} 
                            className="pl-8 pr-10" // Sağdan daha fazla boşluk bırakıldı
                        />
                    </FormControl>
                    {/* YENİ EKLEME: Göz ikonu butonu */}
                    <Button
                        type="button" // Formun submit olmasını engelle
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 size-9 text-muted-foreground hover:bg-transparent"
                        onClick={() => setShowPassword(prev => !prev)}
                        aria-label={showPassword ? "Şifreyi Gizle" : "Şifreyi Göster"}
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