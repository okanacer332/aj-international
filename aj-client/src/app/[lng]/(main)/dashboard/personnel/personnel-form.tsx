"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { UnitDefinition } from "@/types/unit-definition";
import { SkillDefinition } from "@/types/skill-definition";
import { ServiceDefinition } from "@/types/service-definition";
import { Personnel } from "@/types/personnel"; // Personnel tipini import et

// --- ZOD ŞEMASI GÜNCELLENDİ: Hem Create hem Update için ortak ---
const createFormSchema = (t: (key: string) => string) =>
  z.object({
    // ID alanı (sadece update'te dolu olacak)
    id: z.string().optional(),
    
    hireDate: z.date({
      required_error: t("hr.personnel.validation.hireDateRequired"),
    }),
    
    // ONXCode (username) alanı (Sadece create'te kullanılacak, update'te disable olacak)
    onxCode: z.string().min(2, t("hr.personnel.validation.onxCodeRequired")),
    
    fullName: z.string().min(3, t("validation.fullNameMinLength")),
    phone: z.string().min(10, t("masterdata.service.validation.phoneRequired")),
    unitDefinitionId: z
      .string()
      .min(1, t("hr.personnel.validation.unitRequired")),
      
    // 'null' (string) veya ID (string) veya null (object) alabilir
    skillDefinitionId: z.string().nullable().optional(),
    serviceDefinitionId: z.string().nullable().optional(),
  });
// --- BİTTİ ---

type FormSchema = z.infer<ReturnType<typeof createFormSchema>>;

type PersonnelFormProps = {
  onSuccess: () => void;
  lng: string;
  initialData: Personnel | null; // <-- GÜNCELLENDİ
};

export function PersonnelForm({
  onSuccess,
  lng,
  initialData, // <-- GÜNCELLENDİ
}: PersonnelFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [definitions, setDefinitions] = useState<{
    units: UnitDefinition[];
    skills: SkillDefinition[];
    services: ServiceDefinition[];
  }>({ units: [], skills: [], services: [] });

  const { t, ready } = useTranslation(lng, "common");
  const isEditMode = !!initialData; // <-- GÜNCELLENDİ

  const formSchema = createFormSchema(t);
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: initialData?.id || undefined,
      hireDate: initialData?.hireDate ? new Date(initialData.hireDate) : new Date(),
      onxCode: initialData?.onxCode || "",
      fullName: initialData?.user?.fullName || "", // <-- Düzeltildi
      phone: initialData?.phone || "",
      unitDefinitionId: initialData?.unitDefinitionId || undefined,
      skillDefinitionId: initialData?.skillDefinitionId || null,
      serviceDefinitionId: initialData?.serviceDefinitionId || null,
    },
  });

  // --- Koşullu Alan Mantığı (Aynı kaldı) ---
  const watchedUnitId = form.watch("unitDefinitionId");
  const [isCompetencyVisible, setIsCompetencyVisible] = useState(false);

  useEffect(() => {
    const selectedUnit = definitions.units.find(
      (u) => u.id === watchedUnitId
    );
    setIsCompetencyVisible(!!selectedUnit?.competencyRequired);
    if (!selectedUnit?.competencyRequired) {
      form.setValue("skillDefinitionId", null);
    }
  }, [watchedUnitId, definitions.units, form]);
  // --- Bitti ---

  // Tanım verilerini çek (Aynı kaldı)
  useEffect(() => {
    if (!ready) return;
    const fetchDefinitions = async () => {
      try {
        const [unitsRes, skillsRes, servicesRes] = await Promise.all([
          apiFetchAuth("/api/masterdata/units"),
          apiFetchAuth("/api/masterdata/skills"),
          apiFetchAuth("/api/masterdata/services"),
        ]);
        setDefinitions({
          units: await unitsRes.json(),
          skills: await skillsRes.json(),
          services: await servicesRes.json(),
        });
      } catch (error) {
        toast.error(t("hr.personnel.toast.definitionsFetchError"));
      }
    };
    fetchDefinitions();
  }, [ready, t]);

  // --- onSubmit GÜNCELLENDİ (Create vs Update) ---
  const onSubmit = async (values: FormSchema) => {
    setIsLoading(true);

    const apiPath = isEditMode
      ? `/api/hr/personnel/${initialData.id}`
      : "/api/hr/personnel";
      
    const method = isEditMode ? "PUT" : "POST";

    // "null" (string) ise 'null' (object) yap
    const cleanValues = {
      ...values,
      hireDate: format(values.hireDate, "yyyy-MM-dd"),
      skillDefinitionId: values.skillDefinitionId === "null" ? null : values.skillDefinitionId,
      serviceDefinitionId: values.serviceDefinitionId === "null" ? null : values.serviceDefinitionId,
    };
    
    // Güncelleme (PUT) isteği DTO'su 'onxCode' içermemeli
    if (isEditMode) {
      delete (cleanValues as any).onxCode;
      delete (cleanValues as any).id;
    }

    try {
      await apiFetchAuth(apiPath, {
        method: method,
        body: JSON.stringify(cleanValues),
      });
      
      const successMessage = isEditMode 
        ? t("hr.personnel.toast.updateSuccess") 
        : t("hr.personnel.toast.createSuccess");
      toast.success(successMessage);
      onSuccess();
      
    } catch (error: any) {
      const errorMessage = isEditMode
        ? t("hr.personnel.toast.updateError")
        : t("hr.personnel.toast.createError");
      toast.error(errorMessage, {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="hireDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t("hr.personnel.field.hireDate")}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>{t("hr.personnel.placeholder.hireDate")}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="onxCode"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("hr.personnel.field.onxCode")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("hr.personnel.placeholder.onxCode")}
                    {...field}
                    disabled={isEditMode} // <-- GÜNCELLENDİ: Düzenleme modunda değiştirilemez
                  />
                </FormControl>
                {/* Güncelleme modundaysa açıklamayı gizle */}
                {!isEditMode && (
                  <FormDescription>
                    {t("hr.personnel.desc.onxCode")}
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          name="fullName"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("hr.personnel.field.fullName")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("iam.user.placeholder.fullName")}
                  {...field}
                />
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
              <FormLabel>{t("hr.personnel.field.phone")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("masterdata.service.field.phone")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="unitDefinitionId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("hr.personnel.field.unit")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("hr.personnel.placeholder.unit")}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {definitions.units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.departmentName} / {unit.unitName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {isCompetencyVisible && (
          <FormField
            control={form.control}
            name="skillDefinitionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("hr.personnel.field.skill")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? "null"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("hr.personnel.placeholder.skill")}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="null">
                      {t("hr.personnel.placeholder.skill")}
                    </SelectItem>
                    {definitions.skills.map((skill) => (
                      <SelectItem key={skill.id} value={skill.id}>
                        {skill.skillName} (%{skill.targetExperiencePercent})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <FormField
          control={form.control}
          name="serviceDefinitionId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("hr.personnel.field.service")}</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? "null"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("hr.personnel.placeholder.service")}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="null">
                    {t("hr.personnel.placeholder.noService")}
                  </SelectItem>
                  {definitions.services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.vehiclePlate} ({service.driverName})
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
          {isEditMode
            ? t("hr.personnel.updateButton") // <-- GÜNCELLENDİ
            : t("hr.personnel.createButton")}
        </Button>
      </form>
    </Form>
  );
}