"use client";

import { useState, useEffect, useMemo } from "react";
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
import { BonusDefinition, BonusDefinitionFormValues } from "@/types/bonus-definition";
import { ProductionUnitDefinition } from "@/types/production-unit-definition";
import { CurrencyDefinition } from "@/types/currency-definition";

const createFormSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().optional(),
    name: z.string().min(2, t("hr.bonus.validation.nameRequired")),
    amount: z.coerce.number().min(1, t("hr.bonus.validation.amountRequired")),
    thresholdPercent: z.coerce.number().min(0).max(100, t("hr.bonus.validation.percentError")),
    productionGroupId: z.string().min(1, t("hr.bonus.validation.groupRequired")),
    productionSectionId: z.string().min(1, t("hr.bonus.validation.sectionRequired")),
    currencyId: z.string().min(1, t("hr.bonus.validation.currencyRequired")),
  });

type BonusFormProps = {
  initialData: BonusDefinition | null;
  onSuccess: () => void;
  lng: string;
};

export function BonusDefinitionForm({ initialData, onSuccess, lng }: BonusFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [units, setUnits] = useState<ProductionUnitDefinition[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyDefinition[]>([]);
  
  const { t, ready } = useTranslation(lng, "common");
  const formSchema = createFormSchema(t);

  const form = useForm<BonusDefinitionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: initialData?.id || undefined,
      name: initialData?.name || "",
      amount: initialData?.amount || 0,
      thresholdPercent: initialData?.thresholdPercent || 0,
      productionGroupId: initialData?.productionGroupId || "",
      productionSectionId: initialData?.productionSectionId || "",
      currencyId: initialData?.currencyId || "",
    },
  });

  // Verileri çek (Birimler ve Para Birimleri)
  useEffect(() => {
    if (!ready) return;
    const loadData = async () => {
      try {
        const [unitsRes, currencyRes] = await Promise.all([
          apiFetchAuth("/api/masterdata/production-units"), // Bu endpoint hiyerarşik dönüyor
          apiFetchAuth("/api/masterdata/currencies")
        ]);
        setUnits(await unitsRes.json());
        setCurrencies(await currencyRes.json());
      } catch (e) {
        toast.error("Veriler yüklenirken hata oluştu.");
      }
    };
    loadData();
  }, [ready]);

  // --- Cascading Logic (Grup -> Bölüm) ---
  const selectedGroupId = form.watch("productionGroupId");

  // Gruplar (Parent ID'si null olanlar)
  // Gelen veri ağaç yapısında olduğu için ana dizideki her öğe bir gruptur.
  const groups = useMemo(() => units, [units]);

  // Bölümler (Seçilen grubun 'subUnits' dizisi)
  const sections = useMemo(() => {
    if (!selectedGroupId) return [];
    const group = units.find(u => u.id === selectedGroupId);
    return group?.subUnits || []; // API'den gelen 'subUnits' alanı
  }, [selectedGroupId, units]);

  // Grup değişirse Bölümü sıfırla
  const handleGroupChange = (value: string) => {
    form.setValue("productionGroupId", value);
    form.setValue("productionSectionId", ""); // Bölümü temizle
  };

  const onSubmit = async (values: BonusDefinitionFormValues) => {
    setIsLoading(true);
    try {
      await apiFetchAuth("/api/hr/bonus-definitions", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success(t("hr.bonus.toast.saveSuccess"));
      onSuccess();
    } catch (error: any) {
      toast.error(t("hr.bonus.toast.saveError"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready) return null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        {/* Prim Adı */}
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("hr.bonus.field.name")}</FormLabel>
              <FormControl>
                <Input placeholder="Örn: Kalite Primi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Tutar */}
          <FormField
            name="amount"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("hr.bonus.field.amount")}</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Para Birimi */}
          <FormField
            name="currencyId"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("hr.bonus.field.currency")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {currencies.map((curr) => (
                      <SelectItem key={curr.id} value={curr.id}>
                        {curr.code} ({curr.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Başlangıç Yüzdesi */}
        <FormField
          name="thresholdPercent"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("hr.bonus.field.threshold")}</FormLabel>
              <FormControl>
                <Input type="number" step="0.1" max={100} min={0} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Grup Seçimi */}
          <FormField
            name="productionGroupId"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("hr.bonus.field.group")}</FormLabel>
                <Select onValueChange={handleGroupChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Grup Seçiniz" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {groups.map((grp) => (
                      <SelectItem key={grp.id} value={grp.id}>
                        {grp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Bölüm Seçimi (Gruba bağlı) */}
          <FormField
            name="productionSectionId"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("hr.bonus.field.section")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedGroupId}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Bölüm Seçiniz" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sections.map((sec) => (
                      <SelectItem key={sec.id} value={sec.id}>
                        {sec.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? t("masterdata.currency.updateButton") : t("masterdata.currency.createButton")}
        </Button>
      </form>
    </Form>
  );
}