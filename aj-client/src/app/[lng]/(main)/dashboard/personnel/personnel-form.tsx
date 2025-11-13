"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { CalendarIcon, Loader2, Plus, Trash2, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { UnitDefinition } from "@/types/unit-definition";
import { SkillDefinition } from "@/types/skill-definition";
import { ServiceDefinition } from "@/types/service-definition";
import { Personnel } from "@/types/personnel";
import { BonusDefinition } from "@/types/bonus-definition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

// Zod şeması artık çeviri anahtarlarını kullanıyor
const createFormSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().optional(),
    hireDate: z.date({
      required_error: t("hr.personnel.validation.hireDateRequired"),
    }),
    onxCode: z.string().min(2, t("hr.personnel.validation.onxCodeRequired")),
    fullName: z.string().min(3, t("validation.fullNameMinLength")),
    phone: z.string().min(10, t("masterdata.service.validation.phoneRequired")),
    
    departmentId: z.string().min(1, "Departman seçimi zorunludur."), 
    unitDefinitionId: z.string().min(1, t("hr.personnel.validation.unitRequired")),
    
    skillDefinitionId: z.string().nullable().optional(),
    serviceDefinitionId: z.string().nullable().optional(),

    // YENİ: Prim Listesi Validasyonu (Çevirili)
    bonuses: z.array(z.object({
        bonusDefinitionId: z.string().min(1, t("hr.personnel.bonus.validation.select")),
        amount: z.coerce.number().min(0, t("hr.personnel.bonus.validation.amount"))
    })).optional()
  });

type FormSchema = z.infer<ReturnType<typeof createFormSchema>>;

type PersonnelFormProps = {
  onSuccess: () => void;
  lng: string;
  initialData: Personnel | null;
};

export function PersonnelForm({ onSuccess, lng, initialData }: PersonnelFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  
  const [definitions, setDefinitions] = useState<{
    units: UnitDefinition[];
    skills: SkillDefinition[];
    services: ServiceDefinition[];
    bonuses: BonusDefinition[];
  }>({ units: [], skills: [], services: [], bonuses: [] });

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
      departmentId: "", 
      unitDefinitionId: initialData?.unitDefinitionId || "",
      skillDefinitionId: initialData?.skillDefinitionId || null,
      serviceDefinitionId: initialData?.serviceDefinitionId || null,
      bonuses: initialData?.assignedBonuses || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "bonuses",
  });

  // --- Cascading Select Logic ---
  const departments = useMemo(() => 
    definitions.units.filter(u => !u.parentUnitId), 
  [definitions.units]);

  const selectedDepartmentId = form.watch("departmentId");
  
  const subUnits = useMemo(() => {
    if (!selectedDepartmentId) return [];
    const dept = definitions.units.find(u => u.id === selectedDepartmentId);
    return dept?.subUnits || [];
  }, [selectedDepartmentId, definitions.units]);

  const watchedUnitId = form.watch("unitDefinitionId");
  const [isCompetencyVisible, setIsCompetencyVisible] = useState(false);

  useEffect(() => {
    const allUnitsFlat: UnitDefinition[] = [];
    const flatten = (list: UnitDefinition[]) => {
        list.forEach(u => {
            allUnitsFlat.push(u);
            if(u.subUnits) flatten(u.subUnits);
        })
    }
    flatten(definitions.units);

    const selectedUnit = allUnitsFlat.find(u => u.id === watchedUnitId);
    setIsCompetencyVisible(!!selectedUnit?.competencyRequired);
    
    if (!selectedUnit?.competencyRequired) {
        form.setValue("skillDefinitionId", null);
    }
  }, [watchedUnitId, definitions.units, form]);

  useEffect(() => {
    if (isEditMode && initialData && definitions.units.length > 0) {
        const parentDept = definitions.units.find(dept => 
            dept.subUnits?.some(sub => sub.id === initialData.unitDefinitionId)
        );
        if (parentDept) {
            form.setValue("departmentId", parentDept.id);
        }
    }
  }, [isEditMode, initialData, definitions.units, form]);

  useEffect(() => {
    if (!ready) return;
    const fetchDefinitions = async () => {
      try {
        const [unitsRes, skillsRes, servicesRes, bonusesRes] = await Promise.all([
          apiFetchAuth("/api/masterdata/units"),
          apiFetchAuth("/api/masterdata/skills"),
          apiFetchAuth("/api/masterdata/services"),
          apiFetchAuth("/api/hr/bonus-definitions"),
        ]);
        
        setDefinitions({
          units: await unitsRes.json(),
          skills: await skillsRes.json(),
          services: await servicesRes.json(),
          bonuses: await bonusesRes.json(),
        });
      } catch (error) {
        toast.error(t("hr.personnel.toast.definitionsFetchError"));
      }
    };
    fetchDefinitions();
  }, [ready, t]);

  const handleBonusChange = (index: number, bonusId: string) => {
    const bonusDef = definitions.bonuses.find(b => b.id === bonusId);
    if (bonusDef) {
        form.setValue(`bonuses.${index}.bonusDefinitionId`, bonusId);
        form.setValue(`bonuses.${index}.amount`, bonusDef.amount);
    }
  };

  const onSubmit = async (values: FormSchema) => {
    setIsLoading(true);

    const apiPath = isEditMode
      ? `/api/hr/personnel/${initialData.id}`
      : "/api/hr/personnel";
    const method = isEditMode ? "PUT" : "POST";

    const cleanValues = {
      ...values,
      hireDate: format(values.hireDate, "yyyy-MM-dd"),
      skillDefinitionId: values.skillDefinitionId === "null" ? null : values.skillDefinitionId,
      serviceDefinitionId: values.serviceDefinitionId === "null" ? null : values.serviceDefinitionId,
    };
    // @ts-ignore
    delete cleanValues.departmentId;

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
      toast.error(isEditMode ? t("hr.personnel.toast.updateError") : t("hr.personnel.toast.createError"), {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready) return null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
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
                      <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP") : <span>{t("hr.personnel.placeholder.hireDate")}</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
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
                  <Input placeholder={t("hr.personnel.placeholder.onxCode")} {...field} disabled={isEditMode} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            name="fullName"
            control={form.control}
            render={({ field }) => (
                <FormItem>
                <FormLabel>{t("hr.personnel.field.fullName")}</FormLabel>
                <FormControl>
                    <Input placeholder={t("iam.user.placeholder.fullName")} {...field} />
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
                    <Input placeholder={t("masterdata.service.field.phone")} {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        {/* BİRİM SEÇİMİ - COMBOMOX */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/10">
            <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Departman</FormLabel>
                    <Select 
                        onValueChange={(val) => {
                            field.onChange(val);
                            form.setValue("unitDefinitionId", "");
                        }} 
                        value={field.value}
                    >
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Departman Seçiniz" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="unitDefinitionId"
                render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Birim / Ünite</FormLabel>
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
                            disabled={!selectedDepartmentId}
                          >
                            {field.value
                              ? subUnits.find((unit) => unit.id === field.value)?.name
                              : "Birim Seçiniz"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Birim Ara..." />
                          <CommandList className="max-h-[200px] overflow-y-auto">
                            <CommandEmpty>{t("datatable.noResult")}</CommandEmpty>
                            <CommandGroup>
                              {subUnits.map((unit) => (
                                <CommandItem
                                  key={unit.id}
                                  value={unit.name}
                                  onSelect={() => {
                                    form.setValue("unitDefinitionId", unit.id);
                                    setComboboxOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === unit.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {unit.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isCompetencyVisible && (
            <FormField
                control={form.control}
                name="skillDefinitionId"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>{t("hr.personnel.field.skill")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? "null"}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder={t("hr.personnel.placeholder.skill")} />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="null">{t("hr.personnel.placeholder.skill")}</SelectItem>
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
                <Select onValueChange={field.onChange} value={field.value ?? "null"}>
                <FormControl>
                    <SelectTrigger>
                    <SelectValue placeholder={t("hr.personnel.placeholder.service")} />
                    </SelectTrigger>
                </FormControl>
                <SelectContent>
                    <SelectItem value="null">{t("hr.personnel.placeholder.noService")}</SelectItem>
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
        </div>

        {/* PRİM ATAMA TABLOSU */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
                {/* Çeviri: Personel Primleri */}
                <CardTitle className="text-base">{t("hr.personnel.bonus.title")}</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ bonusDefinitionId: "", amount: 0 })}>
                    <Plus className="mr-2 h-4 w-4" /> {t("hr.personnel.bonus.add")}
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {/* Çeviri: Prim Adı */}
                            <TableHead className="w-[50%]">{t("hr.personnel.bonus.header.name")}</TableHead>
                            {/* Çeviri: Tutar */}
                            <TableHead>{t("hr.personnel.bonus.header.amount")}</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.length === 0 && (
                            <TableRow>
                                {/* Çeviri: Henüz prim atanmamış */}
                                <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                                    {t("hr.personnel.bonus.empty")}
                                </TableCell>
                            </TableRow>
                        )}
                        {fields.map((field, index) => (
                            <TableRow key={field.id}>
                                <TableCell className="align-top">
                                    <FormField
                                        control={form.control}
                                        name={`bonuses.${index}.bonusDefinitionId`}
                                        render={({ field: selectField }) => (
                                            <FormItem>
                                                <Select 
                                                    onValueChange={(val) => handleBonusChange(index, val)} 
                                                    value={selectField.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={t("hr.personnel.bonus.validation.select")} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {definitions.bonuses.map((b) => (
                                                            <SelectItem key={b.id} value={b.id}>
                                                                {b.name} ({b.amount} {b.currencyCode})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell className="align-top">
                                    <FormField
                                        control={form.control}
                                        name={`bonuses.${index}.amount`}
                                        render={({ field: inputField }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input type="number" {...inputField} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell className="align-top text-right">
                                    <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? t("hr.personnel.updateButton") : t("hr.personnel.createButton")}
        </Button>
      </form>
    </Form>
  );
}