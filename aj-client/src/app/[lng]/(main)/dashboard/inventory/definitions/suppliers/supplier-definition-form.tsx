// aj-client/src/app/[lng]/(main)/dashboard/inventory/definitions/suppliers/supplier-definition-form.tsx
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

// SupplierDefinition için tip
export type SupplierDefinition = {
  id: string;
  tenantId: string;
  name: string;
};

// Zod şeması
const createFormSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().optional(),
    name: z.string().min(1, t("masterdata.supplier.validation.nameRequired")),
  });

type SupplierFormProps = {
  initialData: SupplierDefinition | null;
  onSuccess: () => void;
  lng: string;
};

export function SupplierDefinitionForm({
  initialData,
  onSuccess,
  lng,
}: SupplierFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation(lng, "common");

  const formSchema = createFormSchema(t);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: initialData?.id || undefined,
      name: initialData?.name || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      await apiFetchAuth("/api/inventory/definitions/suppliers", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success(t("masterdata.supplier.toast.saveSuccess"));
      onSuccess();
    } catch (error: any) {
      toast.error(t("masterdata.supplier.toast.saveError"), {
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
              <FormLabel>{t("masterdata.supplier.field.name")}</FormLabel>
              <FormControl>
                <Input placeholder={t("inventory.definitions.suppliers.title")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData
            ? t("masterdata.supplier.updateButton")
            : t("masterdata.supplier.createButton")}
        </Button>
      </form>
    </Form>
  );
}