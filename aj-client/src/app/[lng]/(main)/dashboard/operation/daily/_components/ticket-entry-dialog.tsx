"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { apiFetchAuth, API_BASE } from "@/lib/api-auth";
import { WorkerAvailability } from "@/types/operation";
import { toast } from "sonner";
import { Ticket, Loader2, Search, Clock } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useTranslation } from "react-i18next"; // DÜZELTİLDİ

interface Props {
    tableId: string;
    tableName: string;
    onSuccess: () => void;
}

export function TicketEntryDialog({ tableId, tableName, onSuccess }: Props) {
    const { t } = useTranslation("common"); // DÜZELTİLDİ
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [durationHours, setDurationHours] = useState<string>("9");
    
    const [assignWorkers, setAssignWorkers] = useState(false);
    const [workers, setWorkers] = useState<WorkerAvailability[]>([]);
    const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);

    const fetchWorkers = useCallback(async () => {
        try {
            const res = await apiFetchAuth("/api/operation/available-workers");
            setWorkers(await res.json());
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => {
        if (open && assignWorkers && workers.length === 0) fetchWorkers();
    }, [open, assignWorkers, fetchWorkers, workers.length]);

    useEffect(() => {
        if(!open) {
            setAmount("");
            setAssignWorkers(false);
            setSelectedWorkerIds([]);
            setDurationHours("9");
        }
    }, [open]);

    const filteredWorkers = workers.filter(w => 
        (w.fullName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (w.onxCode?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );

    const toggleWorker = (id: string) => {
        setSelectedWorkerIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSave = async () => {
        if (!amount) return;
        
        const minutes = parseFloat(durationHours) * 60;
        setLoading(true);
        try {
            await apiFetchAuth("/api/operation/ticket", {
                method: "POST",
                body: JSON.stringify({ 
                    tableId, 
                    amountKg: parseFloat(amount),
                    workerIds: assignWorkers ? selectedWorkerIds : null,
                    durationMinutes: minutes
                })
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
                <Button variant="secondary" size="sm" className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
                    <Ticket className="mr-2 h-4 w-4"/> {t('operation.daily.actions.ticketEntry')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-5 border-b bg-muted/10">
                    <DialogTitle className="text-xl">{tableName} - {t('operation.dialogs.ticket.title')}</DialogTitle>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-3">
                        <Label className="text-base">{t('operation.dialogs.ticket.amountLabel')}</Label>
                        <div className="relative">
                            <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                            <Input type="number" placeholder="0.00" className="text-xl font-bold h-12 pl-10" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
                        </div>
                    </div>

                    <div className="border rounded-xl p-4 bg-card shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <Checkbox id="assign-workers" checked={assignWorkers} onCheckedChange={(v) => setAssignWorkers(!!v)} className="w-5 h-5"/>
                                <Label htmlFor="assign-workers" className="text-base font-medium cursor-pointer">{t('operation.dialogs.ticket.assignLabel')}</Label>
                            </div>
                            
                            {assignWorkers && (
                                <div className="flex items-center gap-2 bg-muted/30 px-2 py-1 rounded-lg border">
                                    <Clock className="w-4 h-4 text-muted-foreground"/>
                                    <Input type="number" className="w-12 h-8 p-1 text-center font-bold bg-background" value={durationHours} onChange={e => setDurationHours(e.target.value)}/>
                                    <span className="text-sm font-medium">{t('operation.common.hour')}</span>
                                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">({(parseFloat(durationHours || "0") * 60).toFixed(0)} {t('operation.common.minute')})</span>
                                </div>
                            )}
                        </div>

                        {assignWorkers && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder={t('operation.dialogs.bulkAssign.searchPlaceholder')} className="pl-9 h-9 text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/>
                                </div>
                                <div className="border rounded-lg h-56 overflow-y-auto bg-muted/10 p-1">
                                    {workers.length === 0 ? (
                                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm"><Loader2 className="animate-spin mr-2 h-4 w-4"/> Loading...</div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-1">
                                            {filteredWorkers.map(w => {
                                                const isSelected = selectedWorkerIds.includes(w.workerId);
                                                const isDisabled = w.status === 'FULL' || w.status === 'BUSY';
                                                return (
                                                    <div key={w.workerId} onClick={() => !isDisabled && toggleWorker(w.workerId)} className={`flex items-center p-2 rounded border cursor-pointer transition-colors text-sm ${isSelected ? 'bg-primary/10 border-primary' : 'bg-background'} ${isDisabled ? 'opacity-50' : ''}`}>
                                                        <Checkbox checked={isSelected} disabled={isDisabled} className="mr-3" />
                                                        <Avatar className="h-7 w-7 mr-2 border"><AvatarImage src={w.avatarUrl ? `${API_BASE}${w.avatarUrl}` : undefined} /><AvatarFallback>{getInitials(w.fullName)}</AvatarFallback></Avatar>
                                                        <div className="flex-1 truncate font-medium">{w.fullName}</div>
                                                        <div className="text-xs text-muted-foreground mr-2">{w.onxCode}</div>
                                                        {w.status === 'AVAILABLE' && <Badge variant="outline" className="text-[10px] h-5 px-1.5">{w.remainingMinutes} {t('operation.common.minute')}</Badge>}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right text-xs text-primary font-medium">{selectedWorkerIds.length} {t('operation.dialogs.ticket.selectedCount')}</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-5 border-t bg-muted/10">
                    <Button className="w-full h-12 text-base font-bold shadow-md" onClick={handleSave} disabled={loading || !amount}>
                        {loading && <Loader2 className="mr-2 animate-spin"/>}
                        {assignWorkers ? t('operation.dialogs.ticket.btnSaveStart') : t('operation.dialogs.ticket.btnSaveOnly')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}