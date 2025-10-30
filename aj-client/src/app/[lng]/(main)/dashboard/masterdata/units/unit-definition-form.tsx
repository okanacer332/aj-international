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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  UnitDefinition,
  UnitDefinitionFormValues,
} from "@/types/unit-definition"; // Bu tip zaten güncellendi

// Form şeması alanı da güncellendi
const createFormSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().optional(),
    departmentName: z
      .string()
      .min(2, t("masterdata.unit.validation.nameRequired")),
    unitName: z.string().min(2, t("masterdata.unit.validation.nameRequired")),
    competencyRequired: z.boolean(), // <-- 'isCompetencyRequired' idi, 'competencyRequired' olarak değişti
  });

type UnitFormProps = {
  initialData: UnitDefinition | null;
  onSuccess: () => void;
  lng: string;
};

export function UnitDefinitionForm({
  initialData,
  onSuccess,
  lng,
}: UnitFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation(lng, "common");

  const formSchema = createFormSchema(t);

  const form = useForm<UnitDefinitionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: initialData?.id || undefined,
      departmentName: initialData?.departmentName || "",
      unitName: initialData?.unitName || "",
      competencyRequired: initialData?.competencyRequired || false, // <-- 'isCompetencyRequired' idi, 'competencyRequired' olarak değişti
    },
  });

  const onSubmit = async (values: UnitDefinitionFormValues) => {
    setIsLoading(true);
    try {
      await apiFetchAuth("/api/masterdata/units", {
        method: "POST", 
        body: JSON.stringify(values),
      });
      toast.success(t("masterdata.unit.toast.saveSuccess"));
      onSuccess();
    } catch (error: any) {
      toast.error(t("masterdata.unit.toast.saveError"), {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* DepartmentName ve UnitName FormField'ları aynı kalır... */}
        <FormField
          name="departmentName"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("masterdata.unit.field.departmentName")}
              </FormLabel>
              <FormControl>
                <Input placeholder="Örn: İnsan Kaynakları" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="unitName"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("masterdata.unit.field.unitName")}</FormLabel>
              <FormControl>
                <Input placeholder="Örn: Bordro" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Checkbox FormField'ı güncellendi */}
        <FormField
          control={form.control}
          name="competencyRequired" // <-- 'isCompetencyRequired' idi, 'competencyRequired' olarak değişti
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  {t("masterdata.unit.field.isCompetencyRequired")}
                </FormLabel>
                <FormDescription>
                  {t("masterdata.unit.field.isCompetencyRequiredDesc")}
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData
            ? t("masterdata.product.updateButton")
            : t("masterdata.product.createButton")}
        </Button>
      </form>
    </Form>
  );
}