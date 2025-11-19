"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { apiFetchAuth } from "@/lib/api-auth";
import { useTranslation } from "@/lib/i18n-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { createGiftFormSchema, GiftFormValues } from "./schema";
import { MasterProduct } from "@/types/master-product";
import { User } from "@/types/user";
import { Personnel } from "@/types/personnel";

type GiftFormProps = {
  onSuccess: () => void;
  lng: string;
};

export function GiftForm({ onSuccess, lng }: GiftFormProps) {
  const { t, ready } = useTranslation(lng, "common");
  const [isLoading, setIsLoading] = useState(false);
  
  // Veri State'leri
  const [users, setUsers] = useState<User[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [products, setProducts] = useState<MasterProduct[]>([]);
  
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [productOpen, setProductOpen] = useState<number | null>(null);

  const formSchema = createGiftFormSchema(t);

  const form = useForm<GiftFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      recipientType: "PERSONNEL",
      recipientId: "",
      description: "",
      lines: [{ productId: "", quantity: 1, description: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const recipientType = form.watch("recipientType");

  useEffect(() => {
    if (!ready) return;
    const loadData = async () => {
      try {
        const [usersRes, personnelRes, productsRes] = await Promise.all([
          apiFetchAuth("/api/iam/users"),
          apiFetchAuth("/api/hr/personnel"),
          apiFetchAuth("/api/masterdata/products"),
        ]);

        setUsers(await usersRes.json());
        setPersonnel(await personnelRes.json());
        setProducts(await productsRes.json());
      } catch (error) {
        // "Form verileri yüklenemedi." yerine genel bir hata mesajı veya i18n kullanılabilir
        toast.error(t("masterdata.product.toast.fetchError")); 
      }
    };
    loadData();
  }, [ready, t]);

  useEffect(() => {
    form.setValue("recipientId", "");
  }, [recipientType, form]);

  const onSubmit = async (values: GiftFormValues) => {
    setIsLoading(true);
    try {
      const payload = {
        ...values,
        date: format(values.date, "yyyy-MM-dd"),
      };

      await apiFetchAuth("/api/hr/gifts", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success(t("hr.gifts.toast.success"));
      onSuccess();
    } catch (error: any) {
      toast.error(t("hr.gifts.toast.error"), { description: error.message });
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
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t("hr.gifts.form.date")}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP") : <span>{t("hr.gifts.form.datePlaceholder")}</span>}
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

          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="recipientType"
              render={({ field }) => (
                <FormItem className="w-1/3">
                  <FormLabel>{t("hr.gifts.form.type")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("hr.gifts.form.type")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PERSONNEL">{t("hr.gifts.form.type.personnel")}</SelectItem>
                      <SelectItem value="USER">{t("hr.gifts.form.type.user")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="recipientId"
              render={({ field }) => (
                <FormItem className="flex-1 flex flex-col">
                  <FormLabel>{t("hr.gifts.form.recipient")}</FormLabel>
                  <Popover open={recipientOpen} onOpenChange={setRecipientOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                        >
                          {field.value
                            ? recipientType === "PERSONNEL"
                              ? personnel.find((p) => p.id === field.value)?.user?.fullName || personnel.find((p) => p.id === field.value)?.onxCode
                              : users.find((u) => u.id === field.value)?.fullName
                            : t("hr.gifts.form.recipientPlaceholder")}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder={t("hr.gifts.form.recipientSearch")} />
                        <CommandList>
                          <CommandEmpty>{t("datatable.noResult")}</CommandEmpty>
                          <CommandGroup>
                            {recipientType === "PERSONNEL"
                              ? personnel.map((p) => (
                                  <CommandItem
                                    value={p.user?.fullName || p.onxCode}
                                    key={p.id}
                                    onSelect={() => {
                                      form.setValue("recipientId", p.id);
                                      setRecipientOpen(false);
                                    }}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", p.id === field.value ? "opacity-100" : "opacity-0")} />
                                    {p.user?.fullName || p.onxCode} ({p.onxCode})
                                  </CommandItem>
                                ))
                              : users.map((u) => (
                                  <CommandItem
                                    value={u.fullName}
                                    key={u.id}
                                    onSelect={() => {
                                      form.setValue("recipientId", u.id);
                                      setRecipientOpen(false);
                                    }}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", u.id === field.value ? "opacity-100" : "opacity-0")} />
                                    {u.fullName}
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
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("hr.gifts.form.description")}</FormLabel>
              <FormControl>
                <Textarea placeholder={t("hr.gifts.form.descriptionPlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50%]">{t("hr.gifts.form.product")}</TableHead>
                            <TableHead>{t("hr.gifts.form.quantity")}</TableHead>
                            <TableHead>{t("hr.gifts.form.note")}</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => (
                            <TableRow key={field.id}>
                                <TableCell className="align-top p-2">
                                    <FormField
                                        control={form.control}
                                        name={`lines.${index}.productId`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <Popover open={productOpen === index} onOpenChange={(o) => setProductOpen(o ? index : null)}>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                                                                {field.value ? products.find((p) => p.id === field.value)?.name : t("hr.gifts.form.productPlaceholder")}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[300px] p-0">
                                                        <Command>
                                                            <CommandInput placeholder={t("hr.gifts.form.productSearch")} />
                                                            <CommandList>
                                                                <CommandEmpty>{t("datatable.noResult")}</CommandEmpty>
                                                                <CommandGroup>
                                                                    {products.map((product) => (
                                                                        <CommandItem
                                                                            value={product.name}
                                                                            key={product.id}
                                                                            onSelect={() => {
                                                                                form.setValue(`lines.${index}.productId`, product.id);
                                                                                setProductOpen(null);
                                                                            }}
                                                                        >
                                                                            <Check className={cn("mr-2 h-4 w-4", product.id === field.value ? "opacity-100" : "opacity-0")} />
                                                                            {product.name} ({product.code})
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
                                <TableCell className="align-top p-2">
                                    <FormField
                                        control={form.control}
                                        name={`lines.${index}.quantity`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input type="number" min="1" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell className="align-top p-2">
                                    <FormField
                                        control={form.control}
                                        name={`lines.${index}.description`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input placeholder={t("hr.gifts.form.notePlaceholder")} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell className="align-top p-2 text-right">
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="p-2 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => append({ productId: "", quantity: 1, description: "" })}
                    >
                        <Plus className="mr-2 h-4 w-4" /> {t("hr.gifts.form.addLine")}
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("masterdata.product.createButton")} {/* "Kaydet" veya "Oluştur" */}
        </Button>
      </form>
    </Form>
  );
}