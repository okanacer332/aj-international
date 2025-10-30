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
  ServiceDefinition,
  ServiceDefinitionFormValues,
} from "@/types/service-definition";

const createFormSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().optional(),
    driverName: z
      .string()
      .min(2, t("masterdata.service.validation.nameRequired")),
    phone: z.string().min(10, t("masterdata.service.validation.phoneRequired")),
    vehiclePlate: z
      .string()
      .min(2, t("masterdata.service.validation.plateRequired")),
    vehicleCapacity: z.coerce // coerce string|number to number
      .number()
      .int()
      .min(1, t("masterdata.service.validation.capacityRequired")),
  });

type ServiceFormProps = {
  initialData: ServiceDefinition | null;
  onSuccess: () => void;
  lng: string;
};

export function ServiceDefinitionForm({
  initialData,
  onSuccess,
  lng,
}: ServiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation(lng, "common");

  const formSchema = createFormSchema(t);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: initialData?.id || undefined,
      driverName: initialData?.driverName || "",
      phone: initialData?.phone || "",
      vehiclePlate: initialData?.vehiclePlate || "",
      vehicleCapacity: initialData?.vehicleCapacity || 1,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      await apiFetchAuth("/api/masterdata/services", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success(t("masterdata.service.toast.saveSuccess"));
      onSuccess();
    } catch (error: any) {
      toast.error(t("masterdata.service.toast.saveError"), {
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
          name="driverName"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("masterdata.service.field.driverName")}</FormLabel>
              <FormControl>
                <Input placeholder="Örn: Ahmet Yılmaz" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="phone"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("masterdata.service.field.phone")}</FormLabel>
              <FormControl>
                <Input placeholder="Örn: 555 123 4567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="vehiclePlate"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("masterdata.service.field.vehiclePlate")}</FormLabel>
              <FormControl>
                <Input placeholder="Örn: 34 ABC 123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="vehicleCapacity"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("masterdata.service.field.vehicleCapacity")}
              </FormLabel>
              <FormControl>
                <Input type="number" min="1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData
            ? t("masterdata.service.updateButton")
            : t("masterdata.service.createButton")} 
        </Button>
      </form>
    </Form>
  );
}