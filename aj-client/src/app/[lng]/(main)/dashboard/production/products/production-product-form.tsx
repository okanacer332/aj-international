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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  MasterProduct,
  MasterProductFormValues,
} from "@/types/master-product";
import { MeasureDefinition } from "@/types/measure-definition";
// YENİ TİP: Üretim birimlerini (Grup/Bölüm) çekmek için
import { ProductionUnitDefinition } from "@/types/production-unit-definition";

// ZOD ŞEMASI GÜNCELLENDİ
const createFormSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().optional(),
    name: z.string().min(2, t("masterdata.product.validation.nameMinLength")),
    code: z.string().min(2, t("masterdata.product.validation.codeMinLength")),
    description: z.string().optional(),
    
    // YENİ: Grup/Bölüm seçimi (Formda 2 adımda, API'ye 'productionUnitId' olarak tek ID gider)
    // 'productionUnitId' (Bölüm ID'si) zorunludur
    productionUnitId: z.string().min(1, t("masterdata.product.validation.sectionRequired")),
    
    active: z.boolean().default(true),
    targetValue: z.coerce.number().nullable().optional(),
    measureDefinitionId: z.string().nullable().optional(),
    wasteRate: z.coerce.number().nullable().optional(),
    
    // YENİ: 'premiumValue' yerine 'unitPrice'
    unitPrice: z.coerce.number().nullable().optional(),
  });

type MasterProductFormProps = {
  initialData: MasterProduct | null;
  onSuccess: () => void;
  lng: string;
};

// YENİ: Formda Grup seçimi için arayüz
interface GroupOption extends ProductionUnitDefinition {
  // 'subUnits' artık 'sections' (Bölüm) olarak adlandırılıyor
  sections: ProductionUnitDefinition[];
}

export function ProductionProductForm({
  initialData,
  onSuccess,
  lng,
}: MasterProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState({ group: false, section: false });
  const [measures, setMeasures] = useState<MeasureDefinition[]>([]);
  
  // YENİ: Üretim Birimlerini (Gruplar ve Bölümler) tutar
  const [groups, setGroups] = useState<GroupOption[]>([]);
  
  const { t, ready } = useTranslation(lng, "common");

  const formSchema = createFormSchema(t);

  const form = useForm<MasterProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: initialData?.id || undefined,
      name: initialData?.name || "",
      code: initialData?.code || "",
      description: initialData?.description || "",
      productionUnitId: initialData?.productionUnitId || null, // Bölüm ID'si
      active: initialData?.active ?? true,
      targetValue: initialData?.targetValue || undefined,
      measureDefinitionId: initialData?.measureDefinitionId || null,
      wasteRate: initialData?.wasteRate || undefined,
      unitPrice: initialData?.unitPrice || undefined, // 'premiumValue' yerine 'unitPrice'
    },
  });

  // YENİ: Formda Grup ID'sini geçici olarak tutmak için (Bölüm listesini filtrelemek için)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // YENİ EFFECT: Ölçü birimlerini VE Üretim birimlerini çeker
  useEffect(() => {
    if (!ready) return;
    const fetchDefinitions = async () => {
      try {
        const [measuresRes, productionUnitsRes] = await Promise.all([
          apiFetchAuth("/api/masterdata/measures"),
          apiFetchAuth("/api/masterdata/production-units")
        ]);
        
        setMeasures(await measuresRes.json());
        
        // Üretim birimlerini (Grup ve Bölümler) işle
        const productionUnits: ProductionUnitDefinition[] = await productionUnitsRes.json();
        const groupOptions: GroupOption[] = productionUnits
          .filter(u => !u.parentProductionUnitId) // Sadece ana Grupları al
          .map(group => ({
            ...group,
            // 'subUnits' listesini 'sections' olarak yeniden adlandır
            sections: group.subUnits || [] 
          }));
        setGroups(groupOptions);

      } catch (error) {
        toast.error(t("hr.personnel.toast.definitionsFetchError"));
      }
    };
    fetchDefinitions();
  }, [ready, t]);

  // YENİ EFFECT: Formu resetlerken veya 'initialData' yüklenirken
  // 'selectedGroupId'yi de (Bölümün parent'ı) doldurur
  useEffect(() => {
    if (ready && groups.length > 0) {
      const initialSectionId = initialData?.productionUnitId;
      let initialGroupId: string | null = null;

      if (initialSectionId) {
        // initialData'daki Bölümün (productionUnitId) hangi Gruba ait olduğunu bul
        for (const group of groups) {
          if (group.sections.some(section => section.id === initialSectionId)) {
            initialGroupId = group.id;
            break;
          }
        }
      }

      setSelectedGroupId(initialGroupId);
      
      form.reset({
        id: initialData?.id || undefined,
        name: initialData?.name || "",
        code: initialData?.code || "",
        description: initialData?.description || "",
        productionUnitId: initialSectionId || null,
        active: initialData?.active ?? true,
        targetValue: initialData?.targetValue || undefined,
        measureDefinitionId: initialData?.measureDefinitionId || null,
        wasteRate: initialData?.wasteRate || undefined,
        unitPrice: initialData?.unitPrice || undefined,
      });
    }
  }, [initialData, form.reset, ready, groups]); // 'groups' bağımlılığı eklendi

  
  // YENİ: Seçilen Gruba ait Bölümleri (sections) listeler
  const availableSections = useMemo(() => {
    if (!selectedGroupId) return [];
    return groups.find(g => g.id === selectedGroupId)?.sections || [];
  }, [selectedGroupId, groups]);


  const onSubmit = async (values: MasterProductFormValues) => {
    setIsLoading(true);

    const payload: MasterProductFormValues = {
      ...values,
      measureDefinitionId: values.measureDefinitionId === "null" ? null : values.measureDefinitionId,
      // Diğer alanlar (targetValue, wasteRate, unitPrice) zaten 'coerce.number()' ile sayıya çevrildi
    };
    
    // 'parentProductId' alanı kaldırıldı. 'productionUnitId' zaten formda var.

    console.log("API'a Gönderilen Veri (Payload):", payload);

    try {
      await apiFetchAuth("/api/masterdata/products", {
        method: "POST", // Hem create hem update POST kullanıyor
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
        {/* Ürün Kodu ve Adı (Aynı) */}
        <div className="grid grid-cols-2 gap-4">
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
        </div>

        {/* YENİ: Grup ve Bölüm Seçimi */}
        <div className="grid grid-cols-2 gap-4">
          {/* GRUP SEÇİMİ */}
          <FormItem className="flex flex-col">
            <FormLabel>{t("masterdata.product.fieldGroup")}</FormLabel>
            <Popover open={comboboxOpen.group} onOpenChange={(o) => setComboboxOpen(p => ({...p, group: o}))}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between",
                      !selectedGroupId && "text-muted-foreground"
                    )}
                  >
                    {selectedGroupId
                      ? groups.find((g) => g.id === selectedGroupId)?.name
                      : t("masterdata.product.placeholderGroup")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder={t("masterdata.product.placeholderGroup")} />
                  <CommandList>
                    <CommandEmpty>{t("datatable.noResult")}</CommandEmpty>
                    <CommandGroup>
                      {groups.map((group) => (
                        <CommandItem
                          value={group.name} // Arama için
                          key={group.id}
                          onSelect={() => {
                            setSelectedGroupId(group.id);
                            form.setValue("productionUnitId", null); // Bölümü sıfırla
                            setComboboxOpen(p => ({...p, group: false}));
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedGroupId === group.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {group.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>

          {/* BÖLÜM SEÇİMİ (Gruba bağlı) */}
          <FormField
            control={form.control}
            name="productionUnitId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t("masterdata.product.fieldSection")}</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value === "null" ? null : value);
                  }}
                  value={field.value ?? "null"}
                  disabled={!selectedGroupId} // Grup seçilmeden pasif
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("masterdata.product.placeholderSection")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="null">{t("masterdata.product.placeholderSection")}</SelectItem>
                    {availableSections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Açıklama (Aynı) */}
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
                  value={field.value ?? ""} // null ise boş string
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* --- Alt Alanlar (Artık 'isSubProduct'a bağlı değil, 'productionUnitId'ye bağlı) --- */}
        {form.watch("productionUnitId") && (
          <div className="space-y-4 rounded-md border p-4">
            {/* Hedef ve Ölçü Birimi (Aynı) */}
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
                        value={field.value ?? ""}
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
                      onValueChange={(value) => field.onChange(value === "null" ? null : value)}
                      value={field.value ?? "null"}
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
            {/* Aktif/Pasif Durumu (Aynı) */}
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
            {/* Fire ve BİRİM FİYATI */}
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
                        step="0.01"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* DEĞİŞİKLİK: 'premiumValue' -> 'unitPrice' */}
              <FormField
                name="unitPrice"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("masterdata.product.fieldUnitPrice")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t("masterdata.product.placeholderUnitPrice")}
                        {...field}
                        value={field.value ?? ""}
                        step="0.01"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
        
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