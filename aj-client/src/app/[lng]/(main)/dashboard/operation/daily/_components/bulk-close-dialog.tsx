"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { Loader2, Power, Info } from "lucide-react";
import { useTranslation } from "react-i18next"; // DÜZELTİLDİ

interface Props {
    totalOpenTables: number;
    onSuccess: () => void;
}

export function BulkCloseDialog({ totalOpenTables, onSuccess }: Props) {
    const { t } = useTranslation("common"); // DÜZELTİLDİ
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleBulkClose = async () => {
        setLoading(true);
        try {
            await apiFetchAuth("/api/operation/close-all-empty", { method: "POST" });
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
                <Button variant="destructive" size="icon" className="rounded-full w-10 h-10 shadow-md hover:scale-105 transition-transform" title={t('operation.dialogs.bulkClose.title')}>
                    <Power className="w-5 h-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <Power className="w-6 h-6" />
                        {t('operation.dialogs.bulkClose.title')}
                    </DialogTitle>
                </DialogHeader>
                
                <div className="py-4 space-y-4">
                    <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm flex gap-3">
                        <Info className="w-5 h-5 shrink-0" />
                        <div><strong>Info:</strong> {t('operation.dialogs.bulkClose.info')}</div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {t('operation.dialogs.bulkClose.desc')} ({totalOpenTables})
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>{t('operation.common.cancel')}</Button>
                    <Button variant="destructive" onClick={handleBulkClose} disabled={loading || totalOpenTables === 0}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('operation.dialogs.bulkClose.btnConfirm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}