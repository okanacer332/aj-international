// aj-client/src/app/[lng]/(main)/dashboard/inventory/entry/entry-form.tsx
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
import { CalendarIcon, Loader2, ChevronsUpDown, Check, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Tanımlama tipleri (Diğer formlardan)
import { MaterialDefinition } from "../definitions/materials/material-definition-form";
import { DepotDefinition } from "../definitions/depots/depot-definition-form";
import { SupplierDefinition } from "../definitions/suppliers/supplier-definition-form";
import { InventoryEntryResponse } from "@/modules/inventory/dto/InventoryEntryResponse"; 

// Tip: Bu forma gelen veri
type InventoryEntryFormProps = {
  onSuccess: () => void;
  lng: string;
  initialData: InventoryEntryResponse | null; 
};

// Zod Şeması
const createFormSchema = (t: (key: string) => string) =>
  z.object({
    id: z.string().optional(),
    entryDate: z.date({ required_error: t("hr.personnel.validation.hireDateRequired") }),
    entryTime: z.string().min(5, "Saat zorunludur (HH:mm)"),
    operationType: z.string().min(1, t("inventory.entry.validation.operationTypeRequired")),
    supplierId: z.string().min(1, t("inventory.entry.validation.supplierIdRequired")),
    targetDepotId: z.string().min(1, t("inventory.entry.validation.targetDepotIdRequired")),
    truckPlate: z.string().optional(),
    trailerPlate: z.string().optional(),
    driverName: z.string().optional(),
    collectionArea: z.string().optional(),
    weighbridgeNo: z.string().optional(),
    waybillNo: z.string().optional(),
    refNo1: z.string().optional(),
    refNo2: z.string().optional(),
    description: z.string().optional(),
    
    lines: z.array(z.object({
        materialId: z.string().min(1, t("inventory.entry.validation.materialIdRequired")),
        waybillWeight: z.coerce.number().min(0, t("inventory.entry.validation.weightRequired")),
        scaleWeight: z.coerce.number().min(0, t("inventory.entry.validation.weightRequired")),
    })).min(1, t("inventory.entry.validation.linesRequired")),
  });

type FormSchema = z.infer<ReturnType<typeof createFormSchema>>;

export function EntryVoucherForm({ onSuccess, lng, initialData }: InventoryEntryFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDefinitionsLoading, setIsDefinitionsLoading] = useState(true);
  
  const [materials, setMaterials] = useState<MaterialDefinition[]>([]);
  const [depots, setDepots] = useState<DepotDefinition[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDefinition[]>([]);
  
  const [popoverOpen, setPopoverOpen] = useState({
    supplier: false,
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
      entryDate: initialData?.entryDate ? new Date(initialData.entryDate) : new Date(),
      entryTime: initialData?.entryTime ? initialData.entryTime.substring(0, 5) : format(new Date(), "HH:mm"),
      operationType: initialData?.operationType || undefined,
      supplierId: initialData?.supplierId || undefined,
      targetDepotId: initialData?.targetDepotId || undefined,
      truckPlate: initialData?.truckPlate || "",
      trailerPlate: initialData?.trailerPlate || "",
      driverName: initialData?.driverName || "",
      collectionArea: initialData?.collectionArea || "",
      weighbridgeNo: initialData?.weighbridgeNo || "",
      waybillNo: initialData?.waybillNo || "",
      refNo1: initialData?.refNo1 || "",
      refNo2: initialData?.refNo2 || "",
      description: initialData?.description || "",
      lines: initialData?.lines?.map(line => ({
        materialId: line.materialId,
        waybillWeight: line.waybillWeight ?? 0,
        scaleWeight: line.scaleWeight ?? 0,
      })) || [],
    },
  });
  
  useEffect(() => {
    if (!ready) return;
    const fetchDefinitions = async () => {
      setIsDefinitionsLoading(true);
      try {
        const [materialsRes, depotsRes, suppliersRes] = await Promise.all([
          apiFetchAuth("/api/inventory/definitions/materials"),
          apiFetchAuth("/api/inventory/definitions/depots"),
          apiFetchAuth("/api/inventory/definitions/suppliers"),
        ]);
        setMaterials(await materialsRes.json());
        setDepots(await depotsRes.json());
        setSuppliers(await suppliersRes.json());
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
        entryDate: format(values.entryDate, "yyyy-MM-dd"),
    };

    const apiPath = isEditMode
      ? `/api/inventory/entry/${initialData.id}`
      : "/api/inventory/entry";
    const method = isEditMode ? "PUT" : "POST";

    try {
      await apiFetchAuth(apiPath, {
        method: method,
        body: JSON.stringify(payload),
      });

      const successMessage = isEditMode
        ? t("inventory.entry.toast.saveSuccess") 
        : t("inventory.entry.toast.saveSuccess");
      toast.success(successMessage);
      onSuccess();
    } catch (error: any) {
      toast.error(t("inventory.entry.toast.saveError"), {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const operationType = form.watch("operationType");

  if (isDefinitionsLoading) {
     return <div className="flex h-64 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* === BÖLÜM 1: BAŞLIK BİLGİLERİ === */}
        <Card>
          <CardHeader>
            <CardTitle>{t("inventory.entry.form.section.header")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Satır 1: Tarih, Saat, İşlem Tipi */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="entryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("inventory.entry.form.entryDate")}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
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
                name="entryTime"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("inventory.entry.form.entryTime")}</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="operationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("inventory.entry.form.operationType")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder={t("inventory.entry.form.operationType.placeholder")} /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="supplier">{t("inventory.entry.form.operationType.supplier")}</SelectItem>
                        <SelectItem value="local">{t("inventory.entry.form.operationType.local")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Satır 2: Tedarikçi, Hedef Depo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("inventory.entry.form.supplierId")}</FormLabel>
                    <Popover open={popoverOpen.supplier} onOpenChange={(o) => setPopoverOpen(p => ({...p, supplier: o}))}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                            {field.value ? suppliers.find((s) => s.id === field.value)?.name : t("inventory.entry.form.supplierId.placeholder")}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command filter={(value, search) => (suppliers.find(s => s.id === value)?.name.toLowerCase().includes(search.toLowerCase()) ? 1 : 0)}>
                          <CommandInput placeholder={t("inventory.entry.form.supplierId.placeholder")} />
                          <CommandList><CommandEmpty>{t("datatable.noResult")}</CommandEmpty>
                            <CommandGroup>
                              {suppliers.map((s) => (
                                <CommandItem value={s.id} key={s.id} onSelect={() => { form.setValue("supplierId", s.id); setPopoverOpen(p => ({...p, supplier: false})); }}>
                                  <Check className={cn("mr-2 h-4 w-4", s.id === field.value ? "opacity-100" : "opacity-0")} />
                                  {s.name}
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
                name="targetDepotId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("inventory.entry.form.targetDepotId")}</FormLabel>
                    <Popover open={popoverOpen.depot} onOpenChange={(o) => setPopoverOpen(p => ({...p, depot: o}))}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                            {field.value ? depots.find((d) => d.id === field.value)?.name : t("inventory.entry.form.targetDepotId.placeholder")}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command filter={(value, search) => (depots.find(d => d.id === value)?.name.toLowerCase().includes(search.toLowerCase()) ? 1 : 0)}>
                          <CommandInput placeholder={t("inventory.entry.form.targetDepotId.placeholder")} />
                          <CommandList><CommandEmpty>{t("datatable.noResult")}</CommandEmpty>
                            <CommandGroup>
                              {depots.map((d) => (
                                <CommandItem value={d.id} key={d.id} onSelect={() => { form.setValue("targetDepotId", d.id); setPopoverOpen(p => ({...p, depot: false})); }}>
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
                <FormItem><FormLabel>{t("inventory.entry.form.truckPlate")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField name="trailerPlate" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>{t("inventory.entry.form.trailerPlate")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>
            
            {/* Satır 4: Şoför ve Toplama Bölgesi (Koşullu) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="driverName" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>{t("inventory.entry.form.driverName")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              {operationType === 'local' && (
                <FormField name="collectionArea" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>{t("inventory.entry.form.collectionArea")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              )}
            </div>
            
            {/* Satır 5: Numaralar (Kantar, İrsaliye) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="weighbridgeNo" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>{t("inventory.entry.form.weighbridgeNo")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField name="waybillNo" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>{t("inventory.entry.form.waybillNo")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>

            {/* Satır 6: Referans Numaraları (Ref1, Ref2) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="refNo1" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>{t("inventory.entry.form.refNo1")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField name="refNo2" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>{t("inventory.entry.form.refNo2")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>
            
            {/* Satır 7: Açıklama */}
            <FormField name="description" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>{t("inventory.entry.form.description")}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            
          </CardContent>
        </Card>
        
        {/* === BÖLÜM 2: MALZEME SATIRLARI === */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("inventory.entry.form.section.lines")}</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ materialId: "", waybillWeight: 0, scaleWeight: 0 })}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("inventory.entry.form.addLine")}
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">{t("inventory.entry.form.materialId")}</TableHead>
                  <TableHead>{t("inventory.entry.form.waybillWeight")}</TableHead>
                  <TableHead>{t("inventory.entry.form.scaleWeight")}</TableHead>
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
                                    {lineField.value ? materials.find((m) => m.id === lineField.value)?.name : t("inventory.entry.form.materialId.placeholder")}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command filter={(value, search) => (materials.find(m => m.id === value)?.name.toLowerCase().includes(search.toLowerCase()) ? 1 : 0)}>
                                  <CommandInput placeholder={t("inventory.entry.form.materialId.placeholder")} />
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
                    {/* İrsaliye Ağırlığı */}
                    <TableCell className="align-top">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.waybillWeight`}
                        render={({ field: lineField }) => (
                          <FormItem><FormControl><Input type="number" step="0.01" {...lineField} /></FormControl><FormMessage /></FormItem>
                        )}
                      />
                    </TableCell>
                    {/* Kantar Ağırlığı */}
                    <TableCell className="align-top">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.scaleWeight`}
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
            {/* === DÜZELTME BURADA === */}
            {/* Satır 499'daki (orijinalde 496) fazladan '>' karakteri kaldırıldı. */}
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