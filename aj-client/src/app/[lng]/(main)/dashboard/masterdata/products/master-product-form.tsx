// aj-client/src/app/[lng]/(main)/dashboard/masterdata/products/master-product-form.tsx
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
  FormDescription, // FormDescription eklendi
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  MasterProduct,
  MasterProductFormValues,
} from "@/types/master-product";
// YENİ İMPORTLAR
import { MeasureDefinition } from "@/types/measure-definition";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
// BİTTİ

// ZOD ŞEMASI GÜNCELLENDİ
const createFormSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().optional(),
    name: z.string().min(2, t("masterdata.product.validation.nameMinLength")),
    code: z.string().min(2, t("masterdata.product.validation.codeMinLength")),
    description: z.string().optional(),
    parentProductId: z.string().nullable().optional(),
    // YENİ ALANLAR
    active: z.boolean().default(true),
    targetValue: z.coerce.number().nullable().optional(), // Input'tan gelen string'i sayıya zorla
    measureDefinitionId: z.string().nullable().optional(),
    wasteRate: z.coerce.number().nullable().optional(),
    premiumValue: z.coerce.number().nullable().optional(),
  });
// BİTTİ

type MasterProductFormProps = {
  initialData: MasterProduct | null;
  onSuccess: () => void;
  masterProducts: MasterProduct[];
  lng: string;
};

type ComboboxOption = {
  value: string | null; 
  label: string;
  level: number; 
  disabled?: boolean; 
};

export function MasterProductForm({
  initialData,
  onSuccess,
  masterProducts, 
  lng,
}: MasterProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false); 
  // YENİ STATE: Ölçü birimlerini tutmak için
  const [measures, setMeasures] = useState<MeasureDefinition[]>([]);
  // BİTTİ
  const { t, ready } = useTranslation(lng, "common");

  const formSchema = createFormSchema(t);

  const form = useForm<MasterProductFormValues>({
    resolver: zodResolver(formSchema),
    // VARSAYILAN DEĞERLER GÜNCELLENDİ
    defaultValues: {
      id: initialData?.id || undefined,
      name: initialData?.name || "",
      code: initialData?.code || "",
      description: initialData?.description || "",
      parentProductId: initialData?.parentProductId || null,
      // YENİ ALANLAR
      active: initialData?.active ?? true, // Varsayılan olarak true
      targetValue: initialData?.targetValue || undefined, // Boş input için null yerine undefined
      measureDefinitionId: initialData?.measureDefinitionId || null,
      wasteRate: initialData?.wasteRate || undefined,
      premiumValue: initialData?.premiumValue || undefined,
    },
  });
  // BİTTİ

  // YENİ EFFECT: Ölçü birimlerini çekmek için
  useEffect(() => {
    if (!ready) return;
    const fetchMeasures = async () => {
      try {
        const res = await apiFetchAuth("/api/masterdata/measures");
        const data = await res.json();
        setMeasures(data);
      } catch (error) {
        toast.error(t("masterdata.measure.toast.fetchError"));
      }
    };
    fetchMeasures();
  }, [ready, t]);
  // BİTTİ

  useEffect(() => {
    if (ready) {
      form.reset({
        id: initialData?.id || undefined,
        name: initialData?.name || "",
        code: initialData?.code || "",
        description: initialData?.description || "",
        parentProductId: initialData?.parentProductId || null,
        // YENİ ALANLAR
        active: initialData?.active ?? true,
        targetValue: initialData?.targetValue || undefined,
        measureDefinitionId: initialData?.measureDefinitionId || null,
        wasteRate: initialData?.wasteRate || undefined,
        premiumValue: initialData?.premiumValue || undefined,
      });
    }
  }, [initialData, form.reset, ready]);
  // BİTTİ

  // ... (generateOptions, getDisabledIds, comboboxOptions kodları aynı kalır)...
  // --- YENİ KISIM: Hiyerarşik seçenek listesi oluşturma ---
  const generateOptions = (
    products: MasterProduct[],
    level = 0,
    disabledIds: Set<string> = new Set()
  ): ComboboxOption[] => {
    let options: ComboboxOption[] = [];
    products.forEach((product) => {
      const isDisabled = disabledIds.has(product.id);
      options.push({
        value: product.id,
        // Girinti için boşluk ekleyelim (ya da CSS ile stil verilebilir)
        label: `${"    ".repeat(level)}${product.name} (${product.code})`,
        level: level,
        disabled: isDisabled,
      });
      if (product.subProducts && product.subProducts.length > 0) {
        options = options.concat(
          generateOptions(product.subProducts, level + 1, disabledIds)
        );
      }
    });
    return options;
  };

  // Düzenleme sırasında yasaklanacak ID'leri bul (kendisi ve alt öğeleri)
  const getDisabledIds = (product: MasterProduct | null): Set<string> => {
    const ids = new Set<string>();
    if (!product) return ids;
    ids.add(product.id);
    const stack = [...(product.subProducts || [])];
    while (stack.length > 0) {
      const current = stack.pop();
      if (current) {
        ids.add(current.id);
        if (current.subProducts) {
          stack.push(...current.subProducts);
        }
      }
    }
    return ids;
  };

  const disabledProductIds = useMemo(
    () => getDisabledIds(initialData),
    [initialData]
  );
  const comboboxOptions = useMemo(
    () => [
      // Ana ürün seçeneği
      {
        value: null,
        label: t("masterdata.product.selectOptionMaster"),
        level: 0,
      },
      ...generateOptions(masterProducts, 0, disabledProductIds),
    ],
    [masterProducts, t, disabledProductIds]
  );
  // --- Hiyerarşik seçenek listesi sonu ---

  // YENİ: Formdaki parentProductId değişikliğini izle
  const parentId = form.watch("parentProductId");
  const isSubProduct = !!parentId;
  // BİTTİ

  const onSubmit = async (values: MasterProductFormValues) => {
    setIsLoading(true);

    // Değerleri temizle (null veya "null" string'ini null objesine çevir)
    const payload: MasterProductFormValues = {
      ...values,
      parentProductId: values.parentProductId === "null" ? null : values.parentProductId,
      measureDefinitionId: values.measureDefinitionId === "null" ? null : values.measureDefinitionId,
      // Eğer ana ürün olarak ayarlanıyorsa, alt ürün alanlarını sıfırla
      targetValue: isSubProduct ? values.targetValue : null,
      measureDefinitionId: isSubProduct ? (values.measureDefinitionId === "null" ? null : values.measureDefinitionId) : null,
      active: isSubProduct ? values.active : true, // Ana ürünler hep aktif
      wasteRate: isSubProduct ? values.wasteRate : null,
      premiumValue: isSubProduct ? values.premiumValue : null,
    };

    console.log("API'a Gönderilen Veri (Payload):", payload);

    try {
      await apiFetchAuth("/api/masterdata/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const successMsgKey = initialData
        ? "masterdata.product.toast.updateSuccess"
        : "masterdata.product.toast.creationSuccess";
      toast.success(t(successMsgKey));
      onSuccess();
    } catch (error: any) {
      const isUniqueError = error.message.includes("Benzersiz") || error.message.includes("already exists");
      const errorMessageKey = isUniqueError
        ? "masterdata.product.toast.codeUniqueError"
        : "masterdata.product.toast.unknownError";

      toast.error(t("masterdata.product.toast.operationFailed"), {
        description: t(errorMessageKey),
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
              <FormLabel>{t("masterdata.product.fieldName")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("masterdata.product.placeholderNameExample")}
                  {...field}
                />
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
              <FormLabel>{t("masterdata.product.fieldCode")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("masterdata.product.placeholderCodeExample")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* --- Parent Product Seçimi Combobox (Aynen kalır) --- */}
        <FormField
          control={form.control}
          name="parentProductId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t("masterdata.product.fieldParent")}</FormLabel>
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
                      {comboboxOptions.find(
                        (option) => option.value === field.value
                      )?.label.trimStart() 
                      || t("masterdata.product.placeholderParent")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] overflow-y-auto p-0">
                  <Command
                   filter={(value, search) => {
                      const option = comboboxOptions.find(opt => opt.value === value);
                      return option?.label.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
                    }}
                  >
                    <CommandInput
                      placeholder={t("masterdata.product.placeholderParent")}
                    />
                    <CommandList>
                      <CommandEmpty>No product found.</CommandEmpty>
                      <CommandGroup>
                        {comboboxOptions.map((option) => (
                          <CommandItem
                            value={option.value ?? "null"} 
                            key={option.value ?? "null"}
                            disabled={option.disabled}
                            onSelect={() => {
                              form.setValue("parentProductId", option.value);
                              setComboboxOpen(false);
                            }}
                            style={{ paddingLeft: `${option.level * 1.5 + 0.5}rem` }}
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
        {/* --- Combobox Son --- */}

        <FormField
          name="description"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("masterdata.product.fieldDescription")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("masterdata.product.placeholderDescription")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* --- YENİ ALANLAR (Sadece Alt Ürün ise göster) --- */}
        {isSubProduct && (
          <div className="space-y-4 rounded-md border p-4">
            {/* 1. Hedef ve Ölçü Birimi */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                name="targetValue"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>{t("masterdata.product.fieldTarget")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t("masterdata.product.placeholderTarget")}
                        {...field}
                        value={field.value ?? ""} // null/undefined ise boş string göster
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="measureDefinitionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("masterdata.product.fieldMeasureUnit")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? "null"} // null için "null" string'i
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("masterdata.product.placeholderMeasureUnit")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">{t("masterdata.product.placeholderMeasureUnit")}</SelectItem>
                        {measures.map((measure) => (
                          <SelectItem key={measure.id} value={measure.id}>
                            {measure.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* 2. Aktif/Pasif Durumu */}
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t("masterdata.product.fieldActiveStatus")}</FormLabel>
                    <FormDescription>
                      {t("masterdata.product.fieldActiveStatusDesc")}
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
            {/* 3. Fire ve Prim Oranları */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="wasteRate"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("masterdata.product.fieldWasteRate")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t("masterdata.product.placeholderWasteRate")}
                        {...field}
                        value={field.value ?? ""}
                        step="0.01" // Ondalıklı girişe izin ver
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="premiumValue"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("masterdata.product.fieldPremium")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t("masterdata.product.placeholderPremium")}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
        {/* --- YENİ ALANLAR BİTTİ --- */}

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