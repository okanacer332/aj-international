"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { apiFetchAuth } from "@/lib/api-auth";
import { Role } from "@/types/role";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Form validasyon şeması
const formSchema = z.object({
  fullName: z.string().min(3, "Ad Soyad en az 3 karakter olmalıdır."),
  email: z.string().email("Geçerli bir email adresi giriniz."),
  tenantId: z.string().min(1, "Tenant ID boş bırakılamaz."),
  roleId: z.string({ required_error: "Lütfen bir rol seçin." }),
});

type AddUserFormProps = {
  onSuccess: () => void; // Form başarıyla gönderildiğinde çağrılacak fonksiyon
};

export function AddUserForm({ onSuccess }: AddUserFormProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Component yüklendiğinde rolleri backend'den çek
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await apiFetchAuth("/api/iam/roles");
        const data = await res.json();
        setRoles(data);
      } catch (error) {
        toast.error("Roller getirilirken bir hata oluştu.");
      }
    };
    fetchRoles();
  }, []);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", email: "", tenantId: "TR" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      // Backend'in beklediği yapıya dönüştür
      const payload = {
        fullName: values.fullName,
        email: values.email,
        tenantId: values.tenantId,
        roleIds: [values.roleId], // Şimdilik tek rol seçimi
        password: "1234" // Varsayılan şifre
      };
      
      await apiFetchAuth("/api/iam/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success("Kullanıcı başarıyla oluşturuldu.");
      onSuccess(); // Başarılı olduğunda ana component'i bilgilendir
    } catch (error: any) {
      toast.error("Kullanıcı oluşturulamadı.", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ad Soyad</FormLabel>
              <FormControl>
                <Input placeholder="Okan Umut Acer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="kullanici@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="tenantId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ülke Kodu (Tenant)</FormLabel>
              <FormControl>
                <Input placeholder="TR" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="roleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rol</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Bir rol seçin..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Kullanıcıyı Oluştur
        </Button>
      </form>
    </Form>
  );
}