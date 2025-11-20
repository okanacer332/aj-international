"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { Loader2, Scale } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    session: { id: string; workerName: string; targetOutputKg: number } | null;
}

export function ReleaseSessionDialog({ isOpen, onClose, session }: Props) {
    const [actualOutput, setActualOutput] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const handleRelease = async () => {
        if (!session) return;
        
        // Boş bırakılırsa 0 olarak kabul edebiliriz veya zorunlu kılabiliriz.
        // Şimdilik zorunlu kılmıyoruz ama sayısal değer bekliyoruz.
        const outputValue = actualOutput ? parseFloat(actualOutput) : 0;

        setLoading(true);
        try {
            await apiFetchAuth("/api/operation/release", {
                method: "POST",
                body: JSON.stringify({ 
                    sessionId: session.id,
                    actualOutputKg: outputValue // Backend'e gönderilen yeni veri
                })
            });
            toast.success(`${session.workerName} başarıyla ayrıldı.`);
            onClose();
            setActualOutput(""); // Reset
        } catch (e) {
            toast.error("İşlem başarısız oldu.");
        } finally {
            setLoading(false);
        }
    };

    if (!session) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Personel Çıkışı</DialogTitle>
                </DialogHeader>
                
                <div className="py-4 space-y-4">
                    <div className="bg-muted p-3 rounded-lg text-sm">
                        <p><strong>Personel:</strong> {session.workerName}</p>
                        <p><strong>Hedeflenen:</strong> {session.targetOutputKg} kg</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Gerçekleşen Üretim (KG)</Label>
                        <div className="relative">
                            <Scale className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                type="number" 
                                placeholder="0.00" 
                                className="pl-9 text-lg font-bold"
                                value={actualOutput}
                                onChange={(e) => setActualOutput(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            *Boş bırakılırsa 0 olarak kaydedilecektir.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>İptal</Button>
                    <Button onClick={handleRelease} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Onayla ve Bitir
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}