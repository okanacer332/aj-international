"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { Loader2, Calculator, Info } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    // session nesnesine activeWorkerCount gibi ek bilgileri parent'tan geçmeniz gerekecek
    session: { 
        id: string; 
        workerName: string; 
    } | null;
    // YENİ PROPS: Hesaplama için gerekli masa verileri
    tableData?: {
        totalPoolKg: number;
        processedKg: number;
        activeWorkerCount: number;
    };
}

export function ReleaseSessionDialog({ isOpen, onClose, session, tableData }: Props) {
    const { t } = useTranslation("common");
    const [remainingInput, setRemainingInput] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [prediction, setPrediction] = useState<{ delta: number; share: number } | null>(null);

    // Varsayılan değer: (Toplam - İşlenen)
    useEffect(() => {
        if (isOpen && tableData) {
            const theoretical = Math.max(0, tableData.totalPoolKg - tableData.processedKg);
            setRemainingInput(theoretical.toString());
        }
    }, [isOpen, tableData]);

    // Anlık Hesaplama
    useEffect(() => {
        if (!tableData || !remainingInput) {
            setPrediction(null);
            return;
        }
        
        const remaining = parseFloat(remainingInput);
        if (isNaN(remaining)) {
            setPrediction(null);
            return;
        }

        // Formül: (Toplam - Kalan) - Daha Önce İşlenen = Yeni Yapılan (Delta)
        const totalConsumedIdeally = tableData.totalPoolKg - remaining;
        const delta = Math.max(0, totalConsumedIdeally - tableData.processedKg);
        const share = tableData.activeWorkerCount > 0 ? delta / tableData.activeWorkerCount : 0;

        setPrediction({ delta, share });

    }, [remainingInput, tableData]);

    const handleRelease = async () => {
        if (!session) return;
        const remainingVal = remainingInput ? parseFloat(remainingInput) : 0;

        setLoading(true);
        try {
            // YENİ ENDPOINT YAPISI: remainingOnTableKg gönderiyoruz
            await apiFetchAuth("/api/operation/worker/release", {
                method: "POST",
                body: JSON.stringify({ 
                    sessionId: session.id, 
                    remainingOnTableKg: remainingVal 
                })
            });
            toast.success(t('operation.common.confirm'));
            onClose();
            setRemainingInput(""); 
        } catch (e) {
            toast.error("Error");
        } finally {
            setLoading(false);
        }
    };

    if (!session) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-red-600 flex items-center gap-2">
                        Personel Çıkış İşlemi
                    </DialogTitle>
                </DialogHeader>
                
                <div className="py-4 space-y-4">
                    <div className="bg-muted/50 p-3 rounded-lg text-sm border border-muted flex justify-between items-center">
                        <div>
                            <span className="text-muted-foreground block text-xs">Ayrılan Personel</span>
                            <span className="font-bold text-lg">{session.workerName}</span>
                        </div>
                        {tableData && (
                             <div className="text-right">
                                <span className="text-muted-foreground block text-xs">Masa Toplam Yükü</span>
                                <span className="font-bold text-lg">{tableData.totalPoolKg} KG</span>
                             </div>
                        )}
                    </div>

                    {tableData && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-100 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300 flex gap-2">
                            <Info className="w-4 h-4 shrink-0 mt-0.5"/>
                            <span>
                                Hakediş hesaplanması için masada kalan (henüz işlenmemiş) mal miktarını giriniz. Sistem aradaki farkı çalışanlara paylaştıracaktır.
                            </span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Masada Kalan (İşlenmemiş) Miktar</Label>
                        <div className="relative">
                            <Calculator className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                type="number" 
                                placeholder="0.00" 
                                className="pl-9 text-lg font-bold" 
                                value={remainingInput} 
                                onChange={(e) => setRemainingInput(e.target.value)} 
                                autoFocus 
                            />
                            <div className="absolute right-3 top-3 text-sm text-muted-foreground">KG</div>
                        </div>
                    </div>

                    {prediction && (
                        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 border border-green-100 dark:border-green-800 animate-in fade-in slide-in-from-top-1">
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="text-muted-foreground">Bu Seansta Eritilen:</span>
                                <span className="font-bold text-green-700 dark:text-green-400">+{prediction.delta.toFixed(1)} KG</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-green-200 dark:border-green-800">
                                <span className="font-medium text-green-900 dark:text-green-100">Kişi Başı Hakediş:</span>
                                <span className="text-xl font-black text-green-600 dark:text-green-400">{prediction.share.toFixed(1)} KG</span>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>{t('operation.common.cancel')}</Button>
                    <Button onClick={handleRelease} variant="destructive" disabled={loading || !remainingInput}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Onayla ve Çıkar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}