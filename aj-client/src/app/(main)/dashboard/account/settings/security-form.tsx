"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { apiFetchAuth } from "@/lib/api-auth";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
    currentPassword: z.string().min(1, "Mevcut şifre boş olamaz."),
    newPassword: z.string().min(6, "Yeni şifre en az 6 karakter olmalıdır."),
  }).refine((data) => data.currentPassword !== data.newPassword, {
    message: "Yeni şifre, mevcut şifre ile aynı olamaz.",
    path: ["newPassword"],
  });

export function SecurityForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      await apiFetchAuth(`/api/account/change-password`, {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success("Şifre başarıyla değiştirildi.");
      form.reset(); // Formu temizle
    } catch (error: any) {
      toast.error("Şifre değiştirilemedi.", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Güvenlik</CardTitle>
        <CardDescription>Sisteme giriş yapmak için kullandığınız şifreyi buradan değiştirebilirsiniz.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="currentPassword" render={({ field }) => (
              <FormItem>
                <FormLabel>Mevcut Şifre</FormLabel>
                <FormControl><Input type="password" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="newPassword" render={({ field }) => (
              <FormItem>
                <FormLabel>Yeni Şifre</FormLabel>
                <FormControl><Input type="password" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Şifreyi Değiştir
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}