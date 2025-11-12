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
// Yeni tipleri import et
import {
  ProductionUnitDefinition,
  ProductionUnitDefinitionFormValues,
} from "@/types/production-unit-definition";

// Zod şeması (Yetkinlik alanı kaldırıldı)
const createFormSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().optional(),
    name: z.string().min(2, t("production.unit.validation.nameRequired")),
    parentProductionUnitId: z.string().nullable().optional(),
  });

// Combobox tipi
type ComboboxOption = {
  value: string | null;
  label: string;
  level: number;
  disabled?: boolean;
};

type UnitFormProps = {
  initialData: ProductionUnitDefinition | null;
  onSuccess: () => void;
  allUnits: ProductionUnitDefinition[]; // Hiyerarşik liste
  lng: string;
};

export function ProductionUnitDefinitionForm({
  initialData,
  onSuccess,
  allUnits,
  lng,
}: UnitFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const { t, ready } = useTranslation(lng, "common");

  const formSchema = createFormSchema(t);

  const form = useForm<ProductionUnitDefinitionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: initialData?.id || undefined,
      name: initialData?.name || "",
      parentProductionUnitId: initialData?.parentProductionUnitId || null,
    },
  });

  useEffect(() => {
    if (ready) {
      form.reset({
        id: initialData?.id || undefined,
        name: initialData?.name || "",
        parentProductionUnitId: initialData?.parentProductionUnitId || null,
      });
    }
  }, [initialData, form.reset, ready]);

  // Hiyerarşik Combobox Seçeneklerini Oluşturma
  const generateOptions = (
    units: ProductionUnitDefinition[],
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

  const getDisabledIds = (unit: ProductionUnitDefinition | null): Set<string> => {
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
        label: t("production.unit.selectOptionMaster"),
        level: 0,
      },
      ...generateOptions(allUnits, 0, disabledUnitIds),
    ],
    [allUnits, t, disabledUnitIds]
  );

  const onSubmit = async (values: ProductionUnitDefinitionFormValues) => {
    setIsLoading(true);
    
    const payload = {
        ...values,
        parentProductionUnitId: values.parentProductionUnitId === "null" ? null : values.parentProductionUnitId
    };

    try {
      // API yolunu güncelle
      await apiFetchAuth("/api/masterdata/production-units", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success(t("production.unit.toast.saveSuccess"));
      onSuccess();
    } catch (error: any) {
      toast.error(t("production.unit.toast.saveError"), {
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
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("production.unit.field.name")}</FormLabel>
              <FormControl>
                <Input placeholder="Örn: Kalite veya Baby" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="parentProductionUnitId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t("production.unit.field.parent")}</FormLabel>
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
                        t("production.unit.placeholderParent")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] overflow-y-auto p-0">
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
                      placeholder={t("production.unit.placeholderParent")}
                    />
                    <CommandList>
                      <CommandEmpty>{t("datatable.noResult")}</CommandEmpty>
                      <CommandGroup>
                        {comboboxOptions.map((option) => (
                          <CommandItem
                            value={option.value ?? "null"}
                            key={option.value ?? "null"}
                            disabled={option.disabled}
                            onSelect={() => {
                              form.setValue("parentProductionUnitId", option.value);
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

        {/* Yetkinlik Switch'i kaldırıldı */}

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