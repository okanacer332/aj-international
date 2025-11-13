"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ChevronsUpDown, Check } from "lucide-react";
import { apiFetchAuth } from "@/lib/api-auth";
import { useTranslation } from "@/lib/i18n-client";
import { cn } from "@/lib/utils";
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
import { Switch } from "@/components/ui/switch";
import {
  UnitDefinition,
  UnitDefinitionFormValues,
} from "@/types/unit-definition";

// 1. Zod şeması yeni modele göre güncellendi
const createFormSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().optional(),
    name: z.string().min(2, t("masterdata.unit.validation.nameRequired")),
    parentUnitId: z.string().nullable().optional(),
    competencyRequired: z.boolean().default(false),
  });

// Combobox için tip
type ComboboxOption = {
  value: string | null;
  label: string;
  level: number;
  disabled?: boolean;
};

// 2. Props güncellendi: Artık tüm birimleri (departmanları) alıyor
type UnitFormProps = {
  initialData: UnitDefinition | null;
  onSuccess: () => void;
  allUnits: UnitDefinition[]; // Hiyerarşik liste
  lng: string;
};

export function UnitDefinitionForm({
  initialData,
  onSuccess,
  allUnits,
  lng,
}: UnitFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const { t, ready } = useTranslation(lng, "common");

  const formSchema = createFormSchema(t);

  const form = useForm<UnitDefinitionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: initialData?.id || undefined,
      name: initialData?.name || "",
      parentUnitId: initialData?.parentUnitId || null,
      competencyRequired: initialData?.competencyRequired || false,
    },
  });

  // 3. Formu veri değişiminde resetle
  useEffect(() => {
    if (ready) {
      form.reset({
        id: initialData?.id || undefined,
        name: initialData?.name || "",
        parentUnitId: initialData?.parentUnitId || null,
        competencyRequired: initialData?.competencyRequired || false,
      });
    }
  }, [initialData, form.reset, ready]);

  // --- 4. Hiyerarşik Combobox Seçeneklerini Oluşturma (Product'tan kopyalandı) ---
  const generateOptions = (
    units: UnitDefinition[],
    level = 0,
    disabledIds: Set<string> = new Set()
  ): ComboboxOption[] => {
    let options: ComboboxOption[] = [];
    units.forEach((unit) => {
      const isDisabled = disabledIds.has(unit.id);
      options.push({
        value: unit.id,
        label: `${"    ".repeat(level)}${unit.name}`,
        level: level,
        disabled: isDisabled,
      });
      if (unit.subUnits && unit.subUnits.length > 0) {
        options = options.concat(
          generateOptions(unit.subUnits, level + 1, disabledIds)
        );
      }
    });
    return options;
  };

  const getDisabledIds = (unit: UnitDefinition | null): Set<string> => {
    const ids = new Set<string>();
    if (!unit) return ids;
    ids.add(unit.id);
    const stack = [...(unit.subUnits || [])];
    while (stack.length > 0) {
      const current = stack.pop();
      if (current) {
        ids.add(current.id);
        if (current.subUnits) {
          stack.push(...current.subUnits);
        }
      }
    }
    return ids;
  };

  const disabledUnitIds = useMemo(
    () => getDisabledIds(initialData),
    [initialData]
  );
  
  const comboboxOptions = useMemo(
    () => [
      {
        value: null,
        // YENİ ÇEVİRİ ANAHTARI (veya masterdata.product.selectOptionMaster kullanılabilir)
        label: t("masterdata.unit.selectOptionMaster"), 
        level: 0,
      },
      ...generateOptions(allUnits, 0, disabledUnitIds),
    ],
    [allUnits, t, disabledUnitIds]
  );
  // --- Hiyerarşik Seçenekler Bitti ---

  const onSubmit = async (values: UnitDefinitionFormValues) => {
    setIsLoading(true);
    
    // "null" string'ini gerçek null'a çevir
    const payload = {
        ...values,
        parentUnitId: values.parentUnitId === "null" ? null : values.parentUnitId
    };

    try {
      await apiFetchAuth("/api/masterdata/units", {
        method: "POST",
        body: JSON.stringify(payload),
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

  if (!ready) return null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* 5. 'Ad' Alanı (Yeni) */}
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("masterdata.unit.field.name")}</FormLabel>
              <FormControl>
                <Input placeholder="Örn: Muhasebe veya Bordro" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* 6. 'ParentUnit' Combobox (Yeni) */}
        <FormField
          control={form.control}
          name="parentUnitId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t("masterdata.unit.field.parent")}</FormLabel>
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
                      {comboboxOptions
                        .find((option) => option.value === field.value)
                        ?.label.trimStart() ||
                        t("masterdata.unit.placeholderParent")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command
                    filter={(value, search) => {
                      const option = comboboxOptions.find(
                        (opt) => opt.value === value
                      );
                      return option?.label
                        .toLowerCase()
                        .includes(search.toLowerCase())
                        ? 1
                        : 0;
                    }}
                  >
                    <CommandInput
                      placeholder={t("masterdata.unit.placeholderParent")}
                    />
                    <CommandList>
                      <CommandEmpty>Birim bulunamadı.</CommandEmpty>
                      <CommandGroup>
                        {comboboxOptions.map((option) => (
                          <CommandItem
                            value={option.value ?? "null"}
                            key={option.value ?? "null"}
                            disabled={option.disabled}
                            onSelect={() => {
                              form.setValue("parentUnitId", option.value);
                              setComboboxOpen(false);
                            }}
                            style={{
                              paddingLeft: `${option.level * 1.5 + 0.5}rem`,
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === option.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {option.label.trimStart()}
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

        {/* 7. 'CompetencyRequired' Alanı (Switch olarak güncellendi) */}
        <FormField
          control={form.control}
          name="competencyRequired"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>
                  {t("masterdata.unit.field.isCompetencyRequired")}
                </FormLabel>
                <FormDescription>
                  {t("masterdata.unit.field.isCompetencyRequiredDesc")}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData
            ? t("masterdata.unit.updateButton")
            : t("masterdata.unit.createButton")}
        </Button>
      </form>
    </Form>
  );
}