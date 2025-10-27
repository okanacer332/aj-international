// aj-client/src/app/[lng]/(main)/dashboard/masterdata/products/master-product-form.tsx
"use client";

import { useState, useEffect, useMemo } from "react"; // <--- useMemo eklendi
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ChevronsUpDown, Check } from "lucide-react"; // Ikonlar eklendi
import { apiFetchAuth } from "@/lib/api-auth";
import { useTranslation } from "@/lib/i18n-client";
import { cn } from "@/lib/utils"; // cn eklendi

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
import { Textarea } from "@/components/ui/textarea";
// Select kaldırıldı, yerine Popover ve Command geldi
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
import { MasterProduct, MasterProductFormValues } from "@/types/master-product";

// Form şeması aynı kalıyor
const createFormSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().optional(),
    name: z.string().min(2, t("masterdata.product.validation.nameMinLength")),
    code: z.string().min(2, t("masterdata.product.validation.codeMinLength")),
    description: z.string().optional(),
    parentProductId: z.string().nullable().optional(),
  });

type MasterProductFormProps = {
  initialData: MasterProduct | null;
  onSuccess: () => void;
  // Artık tüm ürünleri hiyerarşik olarak alıyoruz (backend'den güncellenmiş haliyle)
  masterProducts: MasterProduct[];
  lng: string;
};

// Combobox için seçenek tipi
type ComboboxOption = {
  value: string | null; // null "Ana Ürün Değil" seçeneği için
  label: string;
  level: number; // Girinti için
  disabled?: boolean; // Kendisi veya alt öğesi olamaz
};

export function MasterProductForm({
  initialData,
  onSuccess,
  masterProducts, // Bu prop artık backend'den gelen hiyerarşik yapıyı içermeli
  lng,
}: MasterProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false); // Combobox durumu için state
  const { t, ready } = useTranslation(lng, "common");

  // Hook çağrıları
  const formSchema = createFormSchema(t);

  const form = useForm<MasterProductFormValues>({
    resolver: zodResolver(formSchema),
    // parentProductId default'u null yapalım, "ana_urun" string'i yerine
    defaultValues: {
      id: initialData?.id || undefined,
      name: initialData?.name || "",
      code: initialData?.code || "",
      description: initialData?.description || "",
      parentProductId: initialData?.parentProductId || null, // null olarak değiştirildi
    },
  });

  useEffect(() => {
    if (ready) {
      form.reset({
        id: initialData?.id || undefined,
        name: initialData?.name || "",
        code: initialData?.code || "",
        description: initialData?.description || "",
        parentProductId: initialData?.parentProductId || null, // null olarak değiştirildi
      });
    }
  }, [initialData, form.reset, ready]);

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

  const onSubmit = async (values: MasterProductFormValues) => {
    setIsLoading(true);
    // parentProductId zaten null veya string ID olacak şekilde formdan geliyor
    const payload = { ...values };

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
      const isUniqueError = error.message.includes("Benzersiz") || error.message.includes("already exists"); // Backend hata mesajına göre
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

        {/* --- Parent Product Seçimi Combobox ile --- */}
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
                      // Düzenleme modunda ve alt ürünse parent değiştirmeyi engelle? (Opsiyonel)
                      // disabled={!!initialData?.id && !!initialData?.parentProductId}
                    >
                      {/* Seçili değeri bulup label'ını göster */}
                      {comboboxOptions.find(
                        (option) => option.value === field.value
                      )?.label.trimStart() /* Baştaki boşlukları kaldır */}
                      {!field.value && t("masterdata.product.placeholderParent")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] overflow-y-auto p-0">
                  <Command
                   // filter prop'u ile sadece label'a göre arama yapmasını sağla
                   filter={(value, search) => {
                      const option = comboboxOptions.find(opt => opt.value === value);
                      // Sadece label'da ara, value (ID) veya level'da arama
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
                            value={option.value ?? "null"} // CommandItem value'su string olmalı, null için özel değer
                            key={option.value ?? "null"}
                            disabled={option.disabled}
                            onSelect={() => {
                              form.setValue("parentProductId", option.value);
                              setComboboxOpen(false);
                            }}
                            // Girinti için padding kullanalım
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
                            {/* Label'daki boşlukları burada kaldırabiliriz */}
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