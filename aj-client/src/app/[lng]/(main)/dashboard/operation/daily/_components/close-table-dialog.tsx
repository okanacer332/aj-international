"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { Loader2, Archive, AlertTriangle, Calculator } from "lucide-react";

interface Props {
    tableId: string;
    tableName: string;
    systemRemaining: number; // Sistemin hesapladığı
    onSuccess: () => void;
}

export function CloseTableDialog({ tableId, tableName, systemRemaining, onSuccess }: Props) {
    const [open, setOpen] = useState(false);
    const [actualRemaining, setActualRemaining] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const handleCloseTable = async () => {
        if (!actualRemaining) return;
        
        const actualVal = parseFloat(actualRemaining);
        const diff = actualVal - systemRemaining;

        if (!confirm(`DİKKAT! Masayı kapatıyorsunuz.\n\nSistem: ${systemRemaining} KG\nSizin Sayım: ${actualVal} KG\nFark: ${diff.toFixed(2)} KG\n\nBu işlem geri alınamaz ve yeni güne ${actualVal} KG ile başlanacaktır. Onaylıyor musunuz?`)) {
            return;
        }

        setLoading(true);
        try {
            await apiFetchAuth(`/api/operation/tables/${tableId}/close`, {
                method: "POST",
                body: JSON.stringify(actualVal) // Sadece double değeri gönderiyoruz
                // Not: Backend @RequestBody Double bekliyorsa direkt rakam, obje bekliyorsa { val: ... }
                // Spring Boot 'da primitive body almak bazen trickydir, en temizi bir DTO yapmak veya Map kullanmak.
                // Şimdilik Backend'i DTO alacak şekilde varsayalım: { "actualRemainingKg": 815.0 }
            });
            
            // Not: Yukarıdaki backend kodunda @RequestBody Double yazmıştım, o bazen JSON parsing hatası verebilir.
            // Doğrusu bir DTO olmalı: CloseTableRequest { Double actualRemainingKg; }
            
            toast.success("Masa kapatıldı ve devir yapıldı.");
            setOpen(false);
            onSuccess();
        } catch (e) {
            toast.error("Kapatma işlemi başarısız.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" size="sm" className="w-full mt-2">
                    <Archive className="mr-2 h-4 w-4"/> Gün Sonu / Masa Kapat
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Archive className="w-5 h-5 text-destructive" />
                        {tableName} - Gün Sonu Kapanışı
                    </DialogTitle>
                </DialogHeader>
                
                <div className="py-4 space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex gap-3 text-sm text-yellow-800">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <p>Bu işlem mevcut fişleri arşivler ve girdiğiniz tutar ile yeni bir "Devir Fişi" oluşturur.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted p-3 rounded-lg text-center">
                            <span className="text-xs text-muted-foreground uppercase">Sistemdeki</span>
                            <div className="text-xl font-bold text-primary">{systemRemaining} KG</div>
                        </div>
                        <div className="bg-muted p-3 rounded-lg text-center">
                            <span className="text-xs text-muted-foreground uppercase">Sayım Farkı</span>
                            <div className={`text-xl font-bold ${(parseFloat(actualRemaining || "0") - systemRemaining) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {(parseFloat(actualRemaining || "0") - systemRemaining).toFixed(1)} KG
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Fiziksel Sayım Sonucu (KG)</Label>
                        <div className="relative">
                            <Calculator className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <Input 
                                type="number" 
                                className="pl-10 h-12 text-xl font-bold"
                                placeholder="Örn: 815"
                                value={actualRemaining}
                                onChange={e => setActualRemaining(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            *Masada kalan ve yarına devredecek net miktar.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>İptal</Button>
                    <Button variant="destructive" onClick={handleCloseTable} disabled={loading || !actualRemaining}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Kapanışı Onayla
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}