"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { OperationTable } from "@/types/operation";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

export default function TableDefinitionsPage() {
  const { t } = useTranslation("common");
  const [tables, setTables] = useState<OperationTable[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, reset, control } = useForm<OperationTable>({
      defaultValues: { tableNo: "", unitType: undefined }
  });

  const fetchTables = async () => {
    try {
      const res = await apiFetchAuth("/api/operation/tables");
      setTables(await res.json());
    } catch (e) {
      console.error("Tablo yüklenemedi");
    }
  };

  useEffect(() => { fetchTables(); }, []);

  const onSubmit = async (data: OperationTable) => {
    setLoading(true);
    try {
      await apiFetchAuth("/api/operation/tables", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast.success(t('operation.common.confirm'));
      reset({ tableNo: "", unitType: undefined });
      fetchTables();
    } catch (e) {
      toast.error("Error");
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm(t('operation.common.confirm') + "?")) return;
    await apiFetchAuth(`/api/operation/tables/${id}`, { method: "DELETE" });
    fetchTables();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      <Card>
        <CardHeader><CardTitle>{t('operation.menu.tableDefinitions')}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input placeholder={t('operation.fieldPanel.searchPlaceholder')} {...register("tableNo", { required: true })} />
            
            <Controller
                name="unitType"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('operation.dialogs.bulkAssign.selectAll')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PRE_SELECTION">{t('operation.units.PRE_SELECTION')}</SelectItem>
                            <SelectItem value="SORTING">{t('operation.units.SORTING')}</SelectItem>
                            <SelectItem value="PRESS">{t('operation.units.PRESS')}</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Plus className="mr-2 h-4 w-4"/>}
                {t('operation.common.confirm')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader><CardTitle>{t('operation.fieldPanel.totalTables')}</CardTitle></CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow><TableHead>No</TableHead><TableHead>Tip</TableHead><TableHead></TableHead></TableRow>
                </TableHeader>
                <TableBody>
                    {tables.map(table => (
                        <TableRow key={table.id}>
                            <TableCell className="font-bold">{table.tableNo}</TableCell>
                            {/* DÜZELTİLDİ: ENUM'DAN GELEN DEĞERİ ÇEVİRİYORUZ */}
                            <TableCell>
                                <Badge variant="outline" className="bg-muted/50">
                                    {t(`operation.units.${table.unitType}`)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button size="icon" variant="ghost" onClick={() => handleDelete(table.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}