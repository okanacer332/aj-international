// aj-client/src/app/[lng]/(main)/dashboard/inventory/dispatch/dispatch-form.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import { CalendarIcon, Loader2, ChevronsUpDown, Check, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Tanımlama tipleri
import { MaterialDefinition } from "../definitions/materials/material-definition-form";
import { DepotDefinition } from "../definitions/depots/depot-definition-form";
import { CustomerDefinition } from "../definitions/customers/customer-definition-form";
import { InventoryDispatchResponse } from "@/modules/inventory/dto/InventoryDispatchResponse"; 

type InventoryDispatchFormProps = {
  onSuccess: () => void;
  lng: string;
  initialData: InventoryDispatchResponse | null; 
};

// Zod Şeması
const createFormSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().optional(),
    dispatchDate: z.date({ required_error: t("hr.personnel.validation.hireDateRequired") }),
    dispatchTime: z.string().min(5, "Saat zorunludur (HH:mm)"),
    customerId: z.string().min(1, t("inventory.dispatch.validation.customerIdRequired")),
    dispatchDepotId: z.string().min(1, t("inventory.dispatch.validation.dispatchDepotIdRequired")),
    truckPlate: z.string().optional(),
    trailerPlate: z.string().optional(),
    weighbridgeNo: z.string().optional(),
    containerNo: z.string().optional(),
    waybillNo: z.string().optional(),
    invoiceNo: z.string().optional(),
    arabicInvoiceNo: z.string().optional(),
    refAmount: z.coerce.number().nullable().optional(),
    
    lines: z.array(z.object({
        materialId: z.string().min(1, t("inventory.dispatch.validation.materialIdRequired")),
        weightKg: z.coerce.number().min(0.001, t("inventory.dispatch.validation.weightRequired")), // GÜNCELLENDİ
    })).min(1, t("inventory.dispatch.validation.linesRequired")),
  });

type FormSchema = z.infer<ReturnType<typeof createFormSchema>>;

export function DispatchVoucherForm({ onSuccess, lng, initialData }: InventoryDispatchFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDefinitionsLoading, setIsDefinitionsLoading] = useState(true);
  
  // Tanımlama verileri
  const [materials, setMaterials] = useState<MaterialDefinition[]>([]);
  const [depots, setDepots] = useState<DepotDefinition[]>([]);
  const [customers, setCustomers] = useState<CustomerDefinition[]>([]);
  
  const [popoverOpen, setPopoverOpen] = useState({
    customer: false,
    depot: false,
    material: -1, 
  });

  const { t, ready } = useTranslation(lng, "common");
  const isEditMode = !!initialData;

  const formSchema = createFormSchema(t);
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: initialData?.id || undefined,
      dispatchDate: initialData?.dispatchDate ? new Date(initialData.dispatchDate) : new Date(),
      dispatchTime: initialData?.dispatchTime ? initialData.dispatchTime.substring(0, 5) : format(new Date(), "HH:mm"),
      customerId: initialData?.customerId || undefined,
      dispatchDepotId: initialData?.dispatchDepotId || undefined,
      truckPlate: initialData?.truckPlate || "",
      trailerPlate: initialData?.trailerPlate || "",
      weighbridgeNo: initialData?.weighbridgeNo || "",
      containerNo: initialData?.containerNo || "",
      waybillNo: initialData?.waybillNo || "",
      invoiceNo: initialData?.invoiceNo || "",
      arabicInvoiceNo: initialData?.arabicInvoiceNo || "",
      refAmount: initialData?.refAmount || undefined,
      lines: initialData?.lines?.map(line => ({
        materialId: line.materialId,
        weightKg: line.weightKg ?? 0, // GÜNCELLENDİ
      })) || [],
    },
  });
  
  // Malzeme, Depo, Müşteri verilerini API'den çek
  useEffect(() => {
    if (!ready) return;
    const fetchDefinitions = async () => {
      setIsDefinitionsLoading(true);
      try {
        const [materialsRes, depotsRes, customersRes] = await Promise.all([
          apiFetchAuth("/api/inventory/definitions/materials"),
          apiFetchAuth("/api/inventory/definitions/depots"),
          apiFetchAuth("/api/inventory/definitions/customers"),
        ]);
        setMaterials(await materialsRes.json());
        setDepots(await depotsRes.json());
        setCustomers(await customersRes.json());
      } catch (error) {
        toast.error(t("hr.personnel.toast.definitionsFetchError"));
      } finally {
        setIsDefinitionsLoading(false);
      }
    };
    fetchDefinitions();
  }, [ready, t]);
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });
  
  const onSubmit = async (values: FormSchema) => {
    setIsLoading(true);
    
    const payload = {
        ...values,
        dispatchDate: format(values.dispatchDate, "yyyy-MM-dd"),
    };

    const apiPath = isEditMode
      ? `/api/inventory/dispatch/${initialData.id}`
      : "/api/inventory/dispatch";
    const method = isEditMode ? "PUT" : "POST";

    try {
      await apiFetchAuth(apiPath, {
        method: method,
        body: JSON.stringify(payload),
      });

      const successMessage = isEditMode
        ? t("inventory.dispatch.toast.saveSuccess")
        : t("inventory.dispatch.toast.saveSuccess");
      toast.success(successMessage);
      onSuccess(); 
    } catch (error: any) {
      toast.error(t("inventory.dispatch.toast.saveError"), {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isDefinitionsLoading) {
     return <div className="flex h-64 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* === BÖLÜM 1: BAŞLIK BİLGİLERİ === */}
        <Card>
          <CardHeader>
            <CardTitle>{t("inventory.dispatch.form.section.header")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Satır 1: Tarih, Saat */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dispatchDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("inventory.dispatch.form.dispatchDate")}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : (<span>{t("hr.personnel.placeholder.hireDate")}</span>)}
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
                name="dispatchTime"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("inventory.dispatch.form.dispatchTime")}</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Satır 2: Müşteri, Çıkış Deposu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("inventory.dispatch.form.customerId")}</FormLabel>
                    <Popover open={popoverOpen.customer} onOpenChange={(o) => setPopoverOpen(p => ({...p, customer: o}))}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                            {field.value ? customers.find((c) => c.id === field.value)?.name : t("inventory.dispatch.form.customerId.placeholder")}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command filter={(value, search) => (customers.find(c => c.id === value)?.name.toLowerCase().includes(search.toLowerCase()) ? 1 : 0)}>
                          <CommandInput placeholder={t("inventory.dispatch.form.customerId.placeholder")} />
                          <CommandList><CommandEmpty>{t("datatable.noResult")}</CommandEmpty>
                            <CommandGroup>
                              {customers.map((c) => (
                                <CommandItem value={c.id} key={c.id} onSelect={() => { form.setValue("customerId", c.id); setPopoverOpen(p => ({...p, customer: false})); }}>
                                  <Check className={cn("mr-2 h-4 w-4", c.id === field.value ? "opacity-100" : "opacity-0")} />
                                  {c.name}
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
              <FormField
                control={form.control}
                name="dispatchDepotId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("inventory.dispatch.form.dispatchDepotId")}</FormLabel>
                    <Popover open={popoverOpen.depot} onOpenChange={(o) => setPopoverOpen(p => ({...p, depot: o}))}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                            {field.value ? depots.find((d) => d.id === field.value)?.name : t("inventory.dispatch.form.dispatchDepotId.placeholder")}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command filter={(value, search) => (depots.find(d => d.id === value)?.name.toLowerCase().includes(search.toLowerCase()) ? 1 : 0)}>
                          <CommandInput placeholder={t("inventory.dispatch.form.dispatchDepotId.placeholder")} />
                          <CommandList><CommandEmpty>{t("datatable.noResult")}</CommandEmpty>
                            <CommandGroup>
                              {depots.map((d) => (
                                <CommandItem value={d.id} key={d.id} onSelect={() => { form.setValue("dispatchDepotId", d.id); setPopoverOpen(p => ({...p, depot: false})); }}>
                                  <Check className={cn("mr-2 h-4 w-4", d.id === field.value ? "opacity-100" : "opacity-0")} />
                                  {d.name}
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

            {/* Satır 3: Plakalar (TIR, Dorse) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="truckPlate" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>{t("inventory.dispatch.form.truckPlate")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField name="trailerPlate" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>{t("inventory.dispatch.form.trailerPlate")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>
            
            {/* Satır 4: Numaralar (Kantar, Konteyner, İrsaliye) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField name="weighbridgeNo" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>{t("inventory.dispatch.form.weighbridgeNo")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField name="containerNo" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>{t("inventory.dispatch.form.containerNo")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField name="waybillNo" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>{t("inventory.dispatch.form.waybillNo")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>

            {/* Satır 5: Fatura Bilgileri */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField name="invoiceNo" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>{t("inventory.dispatch.form.invoiceNo")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField name="arabicInvoiceNo" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>{t("inventory.dispatch.form.arabicInvoiceNo")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField name="refAmount" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>{t("inventory.dispatch.form.refAmount")}</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>
            
          </CardContent>
        </Card>
        
        {/* === BÖLÜM 2: MALZEME SATIRLARI === */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("inventory.dispatch.form.section.lines")}</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ materialId: "", weightKg: 0 })} // GÜNCELLENDİ
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("inventory.dispatch.form.addLine")}
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[70%]">{t("inventory.dispatch.form.materialId")}</TableHead>
                  <TableHead>{t("inventory.dispatch.form.weightTon")}</TableHead>
                  <TableHead className="w-[50px] text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    {/* Malzeme Combobox */}
                    <TableCell className="align-top">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.materialId`}
                        render={({ field: lineField }) => (
                          <FormItem>
                            <Popover open={popoverOpen.material === index} onOpenChange={(o) => setPopoverOpen(p => ({...p, material: o ? index : -1}))}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button variant="outline" role="combobox" className={cn("w-full justify-between", !lineField.value && "text-muted-foreground")}>
                                    {lineField.value ? materials.find((m) => m.id === lineField.value)?.name : t("inventory.dispatch.form.materialId.placeholder")}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command filter={(value, search) => (materials.find(m => m.id === value)?.name.toLowerCase().includes(search.toLowerCase()) ? 1 : 0)}>
                                  <CommandInput placeholder={t("inventory.dispatch.form.materialId.placeholder")} />
                                  <CommandList><CommandEmpty>{t("datatable.noResult")}</CommandEmpty>
                                    <CommandGroup>
                                      {materials.map((m) => (
                                        <CommandItem value={m.id} key={m.id} onSelect={() => { form.setValue(`lines.${index}.materialId`, m.id); setPopoverOpen(p => ({...p, material: -1})); }}>
                                          <Check className={cn("mr-2 h-4 w-4", m.id === lineField.value ? "opacity-100" : "opacity-0")} />
                                          {m.name} {m.code && `(${m.code})`}
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
                    </TableCell>
                    {/* Ağırlık (Kg) */}
                    <TableCell className="align-top">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.weightKg`} // GÜNCELLENDİ
                        render={({ field: lineField }) => (
                          <FormItem><FormControl><Input type="number" step="0.01" {...lineField} /></FormControl><FormMessage /></FormItem>
                        )}
                      />
                    </TableCell>
                    {/* Sil Butonu */}
                    <TableCell className="align-top text-right">
                      <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {form.formState.errors.lines?.root && (
              <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.lines.root.message}</p>
            )}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode
            ? t("masterdata.material.updateButton")
            : t("masterdata.material.createButton")}
        </Button>
      </form>
    </Form>
  );
}