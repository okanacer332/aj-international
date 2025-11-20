"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { Loader2, Scale } from "lucide-react";
import { useTranslation } from "react-i18next"; // DÜZELTİLDİ

interface Props {
    isOpen: boolean;
    onClose: () => void;
    session: { id: string; workerName: string; targetOutputKg: number } | null;
}

export function ReleaseSessionDialog({ isOpen, onClose, session }: Props) {
    const { t } = useTranslation("common"); // DÜZELTİLDİ
    const [actualOutput, setActualOutput] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const handleRelease = async () => {
        if (!session) return;
        const outputValue = actualOutput ? parseFloat(actualOutput) : 0;

        setLoading(true);
        try {
            await apiFetchAuth("/api/operation/release", {
                method: "POST",
                body: JSON.stringify({ sessionId: session.id, actualOutputKg: outputValue })
            });
            toast.success(t('operation.common.confirm'));
            onClose();
            setActualOutput(""); 
        } catch (e) {
            toast.error("Error");
        } finally {
            setLoading(false);
        }
    };

    if (!session) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{t('operation.dialogs.release.title')}</DialogTitle>
                </DialogHeader>
                
                <div className="py-4 space-y-4">
                    <div className="bg-muted p-3 rounded-lg text-sm">
                        <p><strong>{t('operation.daily.personnelCount')}:</strong> {session.workerName}</p>
                        <p><strong>{t('operation.daily.target')}:</strong> {session.targetOutputKg} {t('operation.common.kg')}</p>
                    </div>

                    <div className="space-y-2">
                        <Label>{t('operation.dialogs.release.actualLabel')}</Label>
                        <div className="relative">
                            <Scale className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="number" placeholder="0.00" className="pl-9 text-lg font-bold" value={actualOutput} onChange={(e) => setActualOutput(e.target.value)} autoFocus />
                        </div>
                        <p className="text-xs text-muted-foreground">{t('operation.dialogs.release.hint')}</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>{t('operation.common.cancel')}</Button>
                    <Button onClick={handleRelease} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('operation.dialogs.release.btnConfirm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}