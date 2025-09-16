"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const FormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  remember: z.boolean().optional(),
});

export function LoginForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: data.email, password: data.password }),
      });
      const json = await res.json(); // { accessToken, refreshToken }

      // Token'ı cookie'ye yaz (middleware bunu okuyacak)
      const maxAge = data.remember ? 60 * 60 * 24 * 30 : undefined; // 30 gün
      document.cookie = `auth-token=${encodeURIComponent(json.accessToken)}; Path=/; SameSite=Lax${maxAge ? `; Max-Age=${maxAge}` : ""}`;

      toast.success("Giriş başarılı");
      router.replace("/dashboard/default");
    } catch (e: any) {
      toast.error("Giriş başarısız", { description: e?.message ?? "Bilinmeyen hata" });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField name="email" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Email Address</FormLabel>
            <FormControl><Input type="email" autoComplete="email" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}/>
        <FormField name="password" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl><Input type="password" autoComplete="current-password" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}/>
        <FormField name="remember" control={form.control} render={({ field }) => (
          <FormItem className="flex items-center gap-2">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormLabel className="text-sm">Remember me for 30 days</FormLabel>
          </FormItem>
        )}/>
        <Button className="w-full" type="submit">Login</Button>
      </form>
    </Form>
  );
}
