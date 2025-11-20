"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiFetchAuth, API_BASE } from "@/lib/api-auth";
import { WorkerAvailability } from "@/types/operation";
import { toast } from "sonner";
import { UserPlus, Loader2, Search, X } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";

interface Props {
    tableId: string;
    onSuccess: () => void;
}

export function WorkerAssignmentDialog({ tableId, onSuccess }: Props) {
    const params = useParams();
    const { t } = useTranslation("common"); // DÜZELTİLDİ
    const [open, setOpen] = useState(false);
    const [workers, setWorkers] = useState<WorkerAvailability[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedWorker, setSelectedWorker] = useState<WorkerAvailability | null>(null);
    const [duration, setDuration] = useState<number>(0);
    const [loading, setLoading] = useState(false);

    const fetchWorkers = useCallback(async () => {
        try {
            const res = await apiFetchAuth("/api/operation/available-workers");
            setWorkers(await res.json());
        } catch (error) { console.error(error); }
    }, []);

    useEffect(() => {
        if (open) {
            setLoading(true);
            fetchWorkers().finally(() => setLoading(false));
            setSearchQuery("");
        } else {
            setSelectedWorker(null);
        }
    }, [open, fetchWorkers]);

    const filteredWorkers = workers.filter(w => 
        (w.fullName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (w.onxCode?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );

    const handleSelectWorker = (worker: WorkerAvailability) => {
        setSelectedWorker(worker);
        setDuration(worker.remainingMinutes); 
    };

    const handleAssign = async () => {
        if (!selectedWorker) return;
        try {
            await apiFetchAuth("/api/operation/assign", {
                method: "POST",
                body: JSON.stringify({ tableId, workerId: selectedWorker.workerId, durationMinutes: duration })
            });
            toast.success(t('operation.common.confirm'));
            setOpen(false);
            onSuccess(); 
        } catch (e) {
            toast.error("Error");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full md:w-auto">
                    <UserPlus className="mr-2 h-4 w-4"/> {t('operation.dialogs.bulkAssign.btnAssign')}
                </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                {/* İçerik aynı mantıkla... */}
                <DialogHeader className="p-6 pb-4 border-b">
                    <DialogTitle>{t('operation.dialogs.bulkAssign.title')}</DialogTitle>
                </DialogHeader>
                {/* ... Liste ve Arama ... */}
            </DialogContent>
        </Dialog>
    );
}