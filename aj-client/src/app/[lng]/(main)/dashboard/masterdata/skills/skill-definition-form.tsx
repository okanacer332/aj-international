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
import {
  SkillDefinition,
  SkillDefinitionFormValues,
} from "@/types/skill-definition";
import { Slider } from "@/components/ui/slider"; // Slider eklendi

const createFormSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().optional(),
    skillName: z
      .string()
      .min(2, t("masterdata.skill.validation.nameRequired")),
    targetExperiencePercent: z
      .number()
      .min(0, "0")
      .max(100, "100"),
  });

type SkillFormProps = {
  initialData: SkillDefinition | null;
  onSuccess: () => void;
  lng: string;
};

export function SkillDefinitionForm({
  initialData,
  onSuccess,
  lng,
}: SkillFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation(lng, "common");

  const formSchema = createFormSchema(t);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: initialData?.id || undefined,
      skillName: initialData?.skillName || "",
      targetExperiencePercent: initialData?.targetExperiencePercent || 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      await apiFetchAuth("/api/masterdata/skills", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success(t("masterdata.skill.toast.saveSuccess"));
      onSuccess();
    } catch (error: any) {
      toast.error(t("masterdata.skill.toast.saveError"), {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          name="skillName"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("masterdata.skill.field.skillName")}</FormLabel>
              <FormControl>
                <Input placeholder="Örn: Dokuma Operatörü" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="targetExperiencePercent"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("masterdata.skill.field.targetExperiencePercent")}
              </FormLabel>
              <FormControl>
                <div className="flex items-center space-x-4">
                  <Slider
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                    min={0}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    className="w-20"
                    min={0}
                    max={100}
                  />
                </div>
              </FormControl>
              <FormDescription>
                {t("masterdata.skill.field.targetExperiencePercentDesc")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData
            ? t("masterdata.skill.updateButton") // <-- Düzeltildi
            : t("masterdata.skill.createButton")} 
        </Button>
      </form>
    </Form>
  );
}