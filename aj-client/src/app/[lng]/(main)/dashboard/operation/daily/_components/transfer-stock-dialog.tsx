"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { OperationTable } from "@/types/operation";
import { useTranslation } from "react-i18next"; // DÜZELTİLDİ

interface Props {
    fromTableId: string;
    fromTableName: string;
    maxAmount: number;
    tables: OperationTable[];
    onSuccess: () => void;
}

export function TransferStockDialog({ fromTableId, fromTableName, maxAmount, tables, onSuccess }: Props) {
    const { t } = useTranslation("common"); // DÜZELTİLDİ
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [toTableId, setToTableId] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const targetTables = tables.filter(t => t.id !== fromTableId && t.unitType === "PRE_SELECTION");

    const handleTransfer = async () => {
        if (!amount || !toTableId) return;
        const transferAmount = parseFloat(amount);
        if (transferAmount > maxAmount) {
            toast.error(t('operation.dialogs.ticket.amountLabel')); // Basit bir hata mesajı
            return;
        }

        setLoading(true);
        try {
            await apiFetchAuth("/api/operation/transfer", {
                method: "POST",
                body: JSON.stringify({ fromTableId, toTableId, amountKg: transferAmount })
            });
            toast.success(t('operation.common.confirm'));
            setOpen(false);
            setAmount("");
            setToTableId("");
            onSuccess();
        } catch (e) {
            toast.error("Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full" disabled={maxAmount <= 0}>
                    <ArrowRightLeft className="mr-2 h-4 w-4"/> {t('operation.daily.rollover')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><ArrowRightLeft className="w-5 h-5 text-blue-600" /> {t('operation.daily.rollover')}</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="bg-muted p-3 rounded-lg text-sm flex justify-between items-center">
                        <span>{fromTableName}</span>
                        <span>Max: <strong>{maxAmount} {t('operation.common.kg')}</strong></span>
                    </div>
                    <div className="space-y-2">
                        <Label>{t('operation.fieldPanel.activeTables')}</Label>
                        <Select onValueChange={setToTableId} value={toTableId}>
                            <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                            <SelectContent>{targetTables.map(t => <SelectItem key={t.id} value={t.id}>{t.tableNo}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>{t('operation.dialogs.ticket.amountLabel')}</Label>
                        <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="text-lg font-bold"/>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>{t('operation.common.cancel')}</Button>
                    <Button onClick={handleTransfer} disabled={loading || !amount || !toTableId}>{loading ? <Loader2 className="animate-spin"/> : t('operation.common.confirm')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}