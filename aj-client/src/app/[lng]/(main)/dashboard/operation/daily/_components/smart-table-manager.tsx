"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { apiFetchAuth, API_BASE } from "@/lib/api-auth";
import { WorkerAvailability, OperationTable } from "@/types/operation";
import { toast } from "sonner";
import { Ticket, Loader2, Search, Clock, ArrowRightLeft, PlayCircle, AlertTriangle, Users, Plus, ChevronLeft, UserPlus } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface Props {
    tableId: string;
    tableName: string;
    currentStock: number;
    activeWorkerCount: number;
    allTables: OperationTable[];
    onSuccess: () => void;
}

type Mode = "CHECK" | "ENTRY" | "ASSIGN_ONLY" | "TRANSFER";

export function SmartTableManager({ tableId, tableName, currentStock, activeWorkerCount, allTables, onSuccess }: Props) {
    const { t } = useTranslation("common");
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<Mode>("CHECK");
    const [loading, setLoading] = useState(false);

    // ORTAK STATE'LER
    const [workers, setWorkers] = useState<WorkerAvailability[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
    const [durationHours, setDurationHours] = useState<string>("9");

    // ENTRY STATE
    const [amount, setAmount] = useState("");
    const [assignWorkers, setAssignWorkers] = useState(false);
    
    // TRANSFER STATE
    const [transferTargetId, setTransferTargetId] = useState<string>("");

    const switchMode = (newMode: Mode) => {
        setAmount("");
        setAssignWorkers(false);
        setSelectedWorkerIds([]);
        setTransferTargetId("");
        setSearchQuery("");
        setDurationHours("9");
        setMode(newMode);
    };

    useEffect(() => {
        if (open) {
            switchMode(currentStock > 0 ? "CHECK" : "ENTRY");
        }
    }, [open, currentStock]);

    const fetchWorkers = useCallback(async () => {
        try {
            const res = await apiFetchAuth("/api/operation/available-workers");
            setWorkers(await res.json());
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => {
        if (!open) return;
        if ((mode === "ENTRY" && assignWorkers) || mode === "ASSIGN_ONLY") {
            if (workers.length === 0) fetchWorkers();
        }
    }, [open, mode, assignWorkers, workers.length, fetchWorkers]);

    const filteredWorkers = workers.filter(w => 
        (w.fullName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (w.onxCode?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );

    const toggleWorker = (id: string) => {
        setSelectedWorkerIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        const availableIds = filteredWorkers.filter(w => w.status === 'AVAILABLE').map(w => w.workerId);
        if (availableIds.every(id => selectedWorkerIds.includes(id))) {
            setSelectedWorkerIds(prev => prev.filter(id => !availableIds.includes(id)));
        } else {
            setSelectedWorkerIds(prev => Array.from(new Set([...prev, ...availableIds])));
        }
    };

    // --- HANDLERS ---

    const handleTransfer = async () => {
        if (!transferTargetId) return;
        setLoading(true);
        try {
            await apiFetchAuth("/api/operation/transfer", {
                method: "POST",
                body: JSON.stringify({ fromTableId: tableId, toTableId: transferTargetId, amountKg: currentStock })
            });
            toast.success(t('operation.common.confirm'));
            switchMode("ENTRY");
            onSuccess();
        } catch (e) { toast.error("Error"); } 
        finally { setLoading(false); }
    };

    const handleEntry = async () => {
        setLoading(true);
        try {
            await apiFetchAuth("/api/operation/ticket", {
                method: "POST",
                body: JSON.stringify({ 
                    tableId, 
                    amountKg: parseFloat(amount) || 0,
                    workerIds: assignWorkers ? selectedWorkerIds : null,
                    durationMinutes: parseFloat(durationHours) * 60
                })
            });
            toast.success(t('operation.common.confirm'));
            setOpen(false);
            onSuccess();
        } catch (e) { toast.error("Error"); } 
        finally { setLoading(false); }
    };

    const handleAssignOnly = async () => {
        if (selectedWorkerIds.length === 0) return;
        setLoading(true);
        try {
            await apiFetchAuth("/api/operation/assign", {
                method: "POST",
                body: JSON.stringify({
                    tableId,
                    workerIds: selectedWorkerIds,
                    durationMinutes: parseFloat(durationHours) * 60
                })
            });
            toast.success(t('operation.common.confirm'));
            setOpen(false);
            onSuccess();
        } catch (e) { toast.error("Error"); } 
        finally { setLoading(false); }
    };

    const targetTables = allTables.filter(t => t.id !== tableId && t.unitType === "PRE_SELECTION");

    // --- VALIDASYON KONTROLÜ (YENİ) ---
    // Butonun aktif olup olmayacağına karar veren mantık
    const isEntryValid = () => {
        const hasAmount = amount && parseFloat(amount) > 0;
        const hasWorkers = assignWorkers && selectedWorkerIds.length > 0;
        // Ya miktar girilmiş olmalı YA DA personel seçilmiş olmalı
        return hasAmount || hasWorkers;
    };

    // ... (renderWorkerList ve renderDurationInput kodları aynı)
    const renderWorkerList = () => (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="relative flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={t('operation.dialogs.bulkAssign.searchPlaceholder')} className="pl-9 h-9 text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/>
                </div>
                <Button variant="ghost" size="sm" className="h-9 px-2 text-xs" onClick={toggleSelectAll}>{t('operation.dialogs.bulkAssign.selectAll')}</Button>
            </div>
            <div className="border rounded-lg h-56 overflow-y-auto bg-muted/10 p-1">
                {workers.length === 0 ? <div className="flex items-center justify-center h-full text-muted-foreground text-sm"><Loader2 className="animate-spin mr-2 h-4 w-4"/> Loading...</div> : 
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
                </div>}
            </div>
            <div className="text-right text-xs text-primary font-medium">{selectedWorkerIds.length} {t('operation.dialogs.ticket.selectedCount')}</div>
        </div>
    );

    const renderDurationInput = () => (
        <div className="flex items-center gap-2 bg-muted/30 px-2 py-1 rounded-lg border">
            <Clock className="w-4 h-4 text-muted-foreground"/>
            <Input type="number" className="w-12 h-8 p-1 text-center font-bold bg-background" value={durationHours} onChange={e => setDurationHours(e.target.value)}/>
            <span className="text-sm font-medium">{t('operation.common.hour')}</span>
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">({(parseFloat(durationHours || "0") * 60).toFixed(0)} {t('operation.common.minute')})</span>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="w-full bg-blue-600 text-white hover:bg-blue-700 border border-blue-700 shadow-sm font-semibold h-10">
                    <PlayCircle className="mr-2 h-5 w-5"/> {t('operation.daily.actions.ticketEntry')}
                </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                
                {/* MOD 1 ve 2 (CHECK ve ASSIGN_ONLY) KISIMLARI AYNI KALIYOR... */}
                {mode === "CHECK" && (
                    // ... (Mevcut CHECK kodu) ...
                    <div className="p-6 space-y-6">
                        <DialogHeader><DialogTitle className="text-xl flex items-center gap-2 text-amber-600"><AlertTriangle className="w-6 h-6" /> Masada Mal Var!</DialogTitle></DialogHeader>
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center">
                            <p className="text-sm text-amber-800 mb-1">Mevcut Stok</p>
                            <p className="text-4xl font-black text-amber-900">{currentStock} {t('operation.common.kg')}</p>
                        </div>
                        <div className="grid grid-cols-1 gap-3 pt-2">
                            <Button variant="outline" className="h-16 justify-start px-4 border-2 hover:border-green-500 hover:bg-green-50 transition-all" onClick={() => switchMode("ENTRY")}>
                                <Plus className="w-6 h-6 text-green-600 mr-3" />
                                <div className="text-left"><div className="font-bold text-green-700">{t('operation.dialogs.smart.addStock')}</div><div className="text-[10px] text-muted-foreground">{t('operation.dialogs.smart.addStockDesc')}</div></div>
                            </Button>
                            <Button variant="outline" className="h-16 justify-start px-4 border-2 hover:border-blue-500 hover:bg-blue-50 transition-all" onClick={() => switchMode("ASSIGN_ONLY")}>
                                {activeWorkerCount > 0 ? <Users className="w-6 h-6 text-blue-600 mr-3" /> : <UserPlus className="w-6 h-6 text-blue-600 mr-3" />}
                                <div className="text-left">
                                    <div className="font-bold text-blue-700">{activeWorkerCount > 0 ? t('operation.dialogs.smart.addCrew') : t('operation.dialogs.smart.startCrew')}</div>
                                    <div className="text-[10px] text-muted-foreground">{activeWorkerCount > 0 ? t('operation.dialogs.smart.addCrewDesc') : t('operation.dialogs.smart.startCrewDesc')}</div>
                                </div>
                            </Button>
                            <Button variant="outline" className="h-16 justify-start px-4 border-2 hover:border-orange-500 hover:bg-orange-50 transition-all" onClick={() => switchMode("TRANSFER")}>
                                <ArrowRightLeft className="w-6 h-6 text-orange-600 mr-3" />
                                <div className="text-left"><div className="font-bold text-orange-700">{t('operation.dialogs.smart.transfer')}</div><div className="text-[10px] text-muted-foreground">{t('operation.dialogs.smart.transferDesc')}</div></div>
                            </Button>
                        </div>
                    </div>
                )}

                {mode === "ASSIGN_ONLY" && (
                    // ... (Mevcut ASSIGN_ONLY kodu) ...
                    <>
                        <DialogHeader className="p-4 border-b bg-muted/10">
                            <DialogTitle className="flex items-center gap-2"><Button variant="outline" size="sm" className="gap-1 border-primary/20 text-primary" onClick={() => switchMode("CHECK")}><ChevronLeft className="h-4 w-4" /> {t('operation.common.back')}</Button><span className="ml-2">{t('operation.dialogs.bulkAssign.title')}</span></DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div className="flex justify-between items-center"><Label>Planlanan Süre</Label>{renderDurationInput()}</div>
                            {renderWorkerList()}
                        </div>
                        <div className="p-5 border-t bg-muted/10">
                            <Button className="w-full h-12 text-base font-bold shadow-md" onClick={handleAssignOnly} disabled={loading || selectedWorkerIds.length === 0}>{loading && <Loader2 className="mr-2 animate-spin"/>}{t('operation.dialogs.bulkAssign.btnAssign')}</Button>
                        </div>
                    </>
                )}

                {mode === "TRANSFER" && (
                    // ... (Mevcut TRANSFER kodu) ...
                    <div className="p-6 space-y-6">
                         <DialogHeader><DialogTitle className="flex items-center gap-2"><Button variant="outline" size="sm" className="gap-1 border-primary/20 text-primary" onClick={() => switchMode("CHECK")}><ChevronLeft className="h-4 w-4" /> {t('operation.common.back')}</Button><span className="ml-2">{t('operation.daily.rollover')}</span></DialogTitle></DialogHeader>
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-900 text-sm">Bu işlem, <strong>{tableName}</strong> masasındaki tüm stoğu (<strong>{currentStock} KG</strong>) seçilen masaya aktarır ve bu masayı boşaltır.</div>
                            <div className="space-y-2"><Label>{t('operation.fieldPanel.activeTables')}</Label><Select onValueChange={setTransferTargetId} value={transferTargetId}><SelectTrigger className="h-12 text-lg"><SelectValue placeholder="Hedef Masa Seç..." /></SelectTrigger><SelectContent>{targetTables.map(t => <SelectItem key={t.id} value={t.id}>{t.tableNo}</SelectItem>)}</SelectContent></Select></div>
                        </div>
                        <Button className="w-full h-12 text-lg font-bold mt-4" onClick={handleTransfer} disabled={loading || !transferTargetId}>{loading && <Loader2 className="mr-2 animate-spin"/>}{t('operation.common.confirm')}</Button>
                    </div>
                )}

                {/* 4. MOD: FİŞ GİRİŞİ (ENTRY) - BURASI DÜZELTİLDİ */}
                {mode === "ENTRY" && (
                    <>
                        <DialogHeader className="p-4 border-b bg-muted/10">
                            <DialogTitle className="flex items-center gap-2">
                                {currentStock > 0 && (
                                    <Button variant="outline" size="sm" className="gap-1 border-primary/20 text-primary" onClick={() => switchMode("CHECK")}>
                                        <ChevronLeft className="h-4 w-4" /> {t('operation.common.back')}
                                    </Button>
                                )}
                                <span className="ml-2">{tableName} - {t('operation.dialogs.ticket.title')}</span>
                            </DialogTitle>
                        </DialogHeader>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {currentStock > 0 && (
                                <div className="flex items-center justify-between bg-yellow-50 px-3 py-2 rounded border border-yellow-100 text-sm text-yellow-800">
                                    <span>Mevcut: <strong>{currentStock}</strong></span><span>+</span><span>Yeni: <strong>{amount || 0}</strong></span><span>=</span><strong>{(currentStock + (parseFloat(amount)||0))} {t('operation.common.kg')}</strong>
                                </div>
                            )}

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
                                    {assignWorkers && renderDurationInput()}
                                </div>
                                {assignWorkers && renderWorkerList()}
                            </div>
                        </div>

                        <div className="p-5 border-t bg-muted/10">
                            {/* DÜZELTME BURADA: disabled={loading || !isEntryValid()} */}
                            <Button className="w-full h-12 text-base font-bold shadow-md" onClick={handleEntry} disabled={loading || !isEntryValid()}>
                                {loading && <Loader2 className="mr-2 animate-spin"/>}
                                {assignWorkers ? t('operation.dialogs.ticket.btnSaveStart') : t('operation.dialogs.ticket.btnSaveOnly')}
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}