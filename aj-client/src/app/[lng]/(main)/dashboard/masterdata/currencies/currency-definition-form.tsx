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
import {
  CurrencyDefinition,
  CurrencyDefinitionFormValues,
} from "@/types/currency-definition";

const createFormSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().optional(),
    name: z.string().min(1, t("masterdata.currency.validation.nameRequired")),
    code: z.string().min(1, t("masterdata.currency.validation.codeRequired")),
  });

type CurrencyFormProps = {
  initialData: CurrencyDefinition | null;
  onSuccess: () => void;
  lng: string;
};

export function CurrencyDefinitionForm({
  initialData,
  onSuccess,
  lng,
}: CurrencyFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation(lng, "common");

  const formSchema = createFormSchema(t);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: initialData?.id || undefined,
      name: initialData?.name || "",
      code: initialData?.code || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      await apiFetchAuth("/api/masterdata/currencies", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success(t("masterdata.currency.toast.saveSuccess"));
      onSuccess();
    } catch (error: any) {
      toast.error(t("masterdata.currency.toast.saveError"), {
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
              <FormLabel>{t("masterdata.currency.field.name")}</FormLabel>
              <FormControl>
                <Input placeholder="Örn: Amerikan Doları" {...field} />
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
              <FormLabel>{t("masterdata.currency.field.code")}</FormLabel>
              <FormControl>
                <Input placeholder="Örn: USD" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData
            ? t("masterdata.currency.updateButton")
            : t("masterdata.currency.createButton")}
        </Button>
      </form>
    </Form>
  );
}