"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus } from "lucide-react";
import { OperationTable } from "@/types/operation";

export default function TableDefinitionsPage() {
  const [tables, setTables] = useState<OperationTable[]>([]);
  const { register, handleSubmit, setValue, reset } = useForm<OperationTable>();

  const fetchTables = async () => {
    const res = await apiFetchAuth("/api/operation/tables");
    setTables(await res.json());
  };

  useEffect(() => { fetchTables(); }, []);

  const onSubmit = async (data: OperationTable) => {
    try {
      await apiFetchAuth("/api/operation/tables", { method: "POST", body: JSON.stringify(data) });
      toast.success("Masa kaydedildi");
      reset();
      fetchTables();
    } catch (e) { toast.error("Hata oluştu"); }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Silmek istiyor musunuz?")) return;
    await apiFetchAuth(`/api/operation/tables/${id}`, { method: "DELETE" });
    fetchTables();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      <Card>
        <CardHeader><CardTitle>Yeni Masa Ekle</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input placeholder="Masa No" {...register("tableNo", { required: true })} />
            <Select onValueChange={(v) => setValue("unitType", v as any)}>
                <SelectTrigger><SelectValue placeholder="Birim Seç" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="PRE_SELECTION">Ön Seçim</SelectItem>
                    <SelectItem value="SORTING">Ayrıştırma</SelectItem>
                    <SelectItem value="PRESS">Press</SelectItem>
                </SelectContent>
            </Select>
            <Button type="submit" className="w-full"><Plus className="mr-2 h-4 w-4"/> Kaydet</Button>
          </form>
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader><CardTitle>Tanımlı Masalar</CardTitle></CardHeader>
        <CardContent>
            <Table>
                <TableHeader><TableRow><TableHead>Masa No</TableHead><TableHead>Birim</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                    {tables.map(t => (
                        <TableRow key={t.id}>
                            <TableCell>{t.tableNo}</TableCell><TableCell>{t.unitType}</TableCell>
                            <TableCell className="text-right"><Button size="icon" variant="ghost" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}