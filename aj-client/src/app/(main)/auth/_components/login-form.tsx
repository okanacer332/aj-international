"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { User, Lock, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
// Checkbox kaldırıldı
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const FormSchema = z.object({
  username: z.string().min(1, "Kullanıcı adı boş bırakılamaz."),
  password: z.string().min(1, "Şifre boş bırakılamaz."),
  // remember alanı kaldırıldı
});

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    // defaultValues'dan remember kaldırıldı
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

      // remember mantığı ve maxAge kaldırıldı, cookie her zaman session bazlı olacak veya default kalacak
      document.cookie = `auth-token=${encodeURIComponent(json.accessToken)}; Path=/; SameSite=Lax`;

      toast.success("Giriş başarılı");
      router.replace("/dashboard/default");
    } catch (e: any) {
      toast.error("Giriş başarısız", { description: "Kullanıcı adı veya şifre hatalı." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Giriş Yap</CardTitle>
        {/* CardDescription kaldırıldı */}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="username"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kullanıcı Adı</FormLabel>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input type="text" placeholder="kullanici.adi" autoComplete="username" {...field} className="pl-8" />
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
                  <FormLabel>Şifre</FormLabel>
                   <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                        <Input type="password" placeholder="••••••••" autoComplete="current-password" {...field} className="pl-8" />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Remember me Checkbox kaldırıldı */}
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Giriş Yap
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}