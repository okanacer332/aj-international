"use client";

import { useEffect, useState, useMemo } from "react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { UnitDefinition } from "@/types/unit-definition";
import { SkillDefinition } from "@/types/skill-definition";
import { ServiceDefinition } from "@/types/service-definition";
import { Personnel } from "@/types/personnel";

const createFormSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().optional(),
    hireDate: z.date({
      required_error: t("hr.personnel.validation.hireDateRequired"),
    }),
    onxCode: z.string().min(2, t("hr.personnel.validation.onxCodeRequired")),
    fullName: z.string().min(3, t("validation.fullNameMinLength")),
    phone: z.string().min(10, t("masterdata.service.validation.phoneRequired")),
    unitDefinitionId: z
      .string()
      .min(1, t("hr.personnel.validation.unitRequired")),
    skillDefinitionId: z.string().nullable().optional(),
    serviceDefinitionId: z.string().nullable().optional(),
  });

type FormSchema = z.infer<ReturnType<typeof createFormSchema>>;

type PersonnelFormProps = {
  onSuccess: () => void;
  lng: string;
  initialData: Personnel | null;
};

export function PersonnelForm({
  onSuccess,
  lng,
  initialData,
}: PersonnelFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [definitions, setDefinitions] = useState<{
    units: UnitDefinition[];
    skills: SkillDefinition[];
    services: ServiceDefinition[];
  }>({ units: [], skills: [], services: [] });

  const [comboboxOpen, setComboboxOpen] = useState(false);

  const { t, ready } = useTranslation(lng, "common");
  const isEditMode = !!initialData;

  const formSchema = createFormSchema(t);
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: initialData?.id || undefined,
      hireDate: initialData?.hireDate ? new Date(initialData.hireDate) : new Date(),
      onxCode: initialData?.onxCode || "",
      fullName: initialData?.user?.fullName || "",
      phone: initialData?.phone || "",
      unitDefinitionId: initialData?.unitDefinitionId || undefined,
      skillDefinitionId: initialData?.skillDefinitionId || null,
      serviceDefinitionId: initialData?.serviceDefinitionId || null,
    },
  });

  const watchedUnitId = form.watch("unitDefinitionId");
  const [isCompetencyVisible, setIsCompetencyVisible] = useState(false);

  const unitMap = useMemo(() => {
    const map = new Map<string, { name: string; parentName?: string }>();
    definitions.units.forEach((dept) => {
      map.set(dept.id, { name: dept.name });
      dept.subUnits?.forEach((unit) => {
        map.set(unit.id, { name: unit.name, parentName: dept.name });
      });
    });
    return map;
  }, [definitions.units]);

  useEffect(() => {
    const allUnitsFlat: UnitDefinition[] = [];
    const flatten = (unitList: UnitDefinition[]) => {
      for (const unit of unitList) {
        allUnitsFlat.push(unit);
        if (unit.subUnits) {
          flatten(unit.subUnits);
        }
      }
    };
    flatten(definitions.units);

    const selectedUnitData = allUnitsFlat.find((u) => u.id === watchedUnitId);

    setIsCompetencyVisible(!!selectedUnitData?.competencyRequired);
    if (!selectedUnitData?.competencyRequired) {
      form.setValue("skillDefinitionId", null);
    }
  }, [watchedUnitId, definitions.units, form]);

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

  const onSubmit = async (values: FormSchema) => {
    setIsLoading(true);

    const apiPath = isEditMode
      ? `/api/hr/personnel/${initialData.id}`
      : "/api/hr/personnel";

    const method = isEditMode ? "PUT" : "POST";

    const cleanValues = {
      ...values,
      hireDate: format(values.hireDate, "yyyy-MM-dd"),
      skillDefinitionId:
        values.skillDefinitionId === "null" ? null : values.skillDefinitionId,
      serviceDefinitionId:
        values.serviceDefinitionId === "null"
          ? null
          : values.serviceDefinitionId,
    };

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
        {/* ... (hireDate, onxCode, fullName, phone alanları aynı kalır) ... */}
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
                    disabled={isEditMode}
                  />
                </FormControl>
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

        {/* --- BİRİM FORMU (COMBOMOX) --- */}
        <FormField
          control={form.control}
          name="unitDefinitionId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t("hr.personnel.field.unit")}</FormLabel>
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboboxOpen}
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? (() => {
                            const unit = unitMap.get(field.value);
                            if (!unit)
                              return t("hr.personnel.placeholder.unit");
                            return unit.parentName
                              ? `${unit.parentName} / ${unit.name}`
                              : `${unit.name} (${t(
                                  "hr.personnel.departmentGeneral"
                                )})`;
                          })()
                        : t("hr.personnel.placeholder.unit")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] overflow-y-auto p-0">
                  <Command>
                    <CommandInput
                      placeholder={t("hr.personnel.placeholder.unit")}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {t("datatable.noResult", "Sonuç bulunamadı.")}
                      </CommandEmpty>
                      {definitions.units.map((department) => (
                        <CommandGroup
                          key={department.id}
                          heading={department.name}
                        >
                          {/* === DEĞİŞİKLİK BURADA === */}
                          <CommandItem
                            // Arama değeri hem departman adını hem de "Genel" kelimesini içersin
                            value={`${department.name} ${t(
                              "hr.personnel.departmentGeneral"
                            )}`}
                            onSelect={() => {
                              form.setValue("unitDefinitionId", department.id);
                              setComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === department.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {/* Etiket artık "BABY (Genel)" şeklinde görünecek */}
                            {department.name} ({t("hr.personnel.departmentGeneral")})
                          </CommandItem>
                          {/* === DEĞİŞİKLİK SONU === */}
                          
                          {department.subUnits &&
                            department.subUnits.map((subUnit) => (
                              <CommandItem
                                key={subUnit.id}
                                // Arama değeri "DepartmanAdı BirimAdı" olsun
                                value={`${department.name} ${subUnit.name}`}
                                onSelect={() => {
                                  form.setValue("unitDefinitionId", subUnit.id);
                                  setComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === subUnit.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {subUnit.name}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* --- Değişiklik Sonu --- */}

        {isCompetencyVisible && (
          <FormField
            control={form.control}
            name="skillDefinitionId"
            render={({ field }) => (
              // ... (Yetenek alanı aynı kalır) ...
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
            // ... (Servis alanı aynı kalır) ...
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
            ? t("hr.personnel.updateButton")
            : t("hr.personnel.createButton")}
        </Button>
      </form>
    </Form>
  );
}