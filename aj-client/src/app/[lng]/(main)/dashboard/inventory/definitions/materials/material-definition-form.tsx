// aj-client/src/app/[lng]/(main)/dashboard/inventory/definitions/materials/material-definition-form.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { apiFetchAuth } from "@/lib/api-auth";
import { useTranslation } from "@/lib/i18n-client";
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
import { Textarea } from "@/components/ui/textarea"; // Açıklama için eklendi

// MaterialDefinition için tip (Backend modeline göre)
export type MaterialDefinition = {
  id: string;
  tenantId: string;
  name: string;
  code?: string;
  description?: string;
};

// Zod şeması
const createFormSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().optional(),
    name: z.string().min(1, t("masterdata.material.validation.nameRequired")),
    // Kod opsiyonel olabilir, plan öyle belirtmiş
    code: z.string().optional(), 
    description: z.string().optional(),
  });

type MaterialFormProps = {
  initialData: MaterialDefinition | null;
  onSuccess: () => void;
  lng: string;
};

export function MaterialDefinitionForm({
  initialData,
  onSuccess,
  lng,
}: MaterialFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation(lng, "common");

  const formSchema = createFormSchema(t);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: initialData?.id || undefined,
      name: initialData?.name || "",
      code: initialData?.code || "",
      description: initialData?.description || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      await apiFetchAuth("/api/inventory/definitions/materials", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success(t("masterdata.material.toast.saveSuccess"));
      onSuccess();
    } catch (error: any) {
      toast.error(t("masterdata.material.toast.saveError"), {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("masterdata.material.field.name")}</FormLabel>
              <FormControl>
                <Input placeholder={t("inventory.definitions.materials.title")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="code"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("masterdata.material.field.code")}</FormLabel>
              <FormControl>
                <Input placeholder="Örn: PLSTK-01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="description"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("masterdata.material.field.description")}</FormLabel>
              <FormControl>
                <Textarea placeholder="..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData
            ? t("masterdata.material.updateButton")
            : t("masterdata.material.createButton")}
        </Button>
      </form>
    </Form>
  );
}