"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { Loader2, Archive, AlertTriangle, Calculator, Power } from "lucide-react";
import { useTranslation } from "react-i18next"; 

interface Props {
    tableId: string;
    tableName: string;
    systemRemaining: number;
    onSuccess: () => void;
}

export function CloseTableDialog({ tableId, tableName, systemRemaining, onSuccess }: Props) {
    const { t } = useTranslation("common");
    const [open, setOpen] = useState(false);
    const [actualRemaining, setActualRemaining] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const handleCloseTable = async () => {
        if (!actualRemaining) return;
        const actualVal = parseFloat(actualRemaining);
        const diff = actualVal - systemRemaining;

        if (!confirm(`${t('operation.dialogs.closeTable.warning')}\n\n${t('operation.dialogs.closeTable.systemVal')}: ${systemRemaining}\n${t('operation.dialogs.closeTable.physicalLabel')}: ${actualVal}\n${t('operation.dialogs.closeTable.diffVal')}: ${diff.toFixed(2)}`)) {
            return;
        }

        setLoading(true);
        try {
            await apiFetchAuth(`/api/operation/tables/${tableId}/close`, {
                method: "POST",
                body: JSON.stringify(actualVal)
            });
            toast.success(t('operation.common.confirm'));
            setOpen(false);
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
                {/* YENİ TASARIM: SADECE İKON BUTON */}
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-full"
                    title={t('operation.daily.actions.closeTable')} // Tooltip: Masa Kapat
                >
                    <Power className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <Archive className="w-5 h-5" />
                        {tableName} - {t('operation.dialogs.closeTable.title')}
                    </DialogTitle>
                </DialogHeader>
                
                <div className="py-4 space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex gap-3 text-sm text-yellow-800">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <p>{t('operation.dialogs.closeTable.warning')}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted p-3 rounded-lg text-center">
                            <span className="text-xs text-muted-foreground uppercase">{t('operation.dialogs.closeTable.systemVal')}</span>
                            <div className="text-xl font-bold text-primary">{systemRemaining} {t('operation.common.kg')}</div>
                        </div>
                        <div className="bg-muted p-3 rounded-lg text-center">
                            <span className="text-xs text-muted-foreground uppercase">{t('operation.dialogs.closeTable.diffVal')}</span>
                            <div className={`text-xl font-bold ${(parseFloat(actualRemaining || "0") - systemRemaining) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {(parseFloat(actualRemaining || "0") - systemRemaining).toFixed(1)} {t('operation.common.kg')}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>{t('operation.dialogs.closeTable.physicalLabel')}</Label>
                        <div className="relative">
                            <Calculator className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <Input type="number" className="pl-10 h-12 text-xl font-bold" placeholder="0" value={actualRemaining} onChange={e => setActualRemaining(e.target.value)} autoFocus />
                        </div>
                        <p className="text-xs text-muted-foreground">{t('operation.dialogs.closeTable.physicalHint')}</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>{t('operation.common.cancel')}</Button>
                    <Button variant="destructive" onClick={handleCloseTable} disabled={loading || !actualRemaining}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('operation.dialogs.closeTable.btnConfirm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}