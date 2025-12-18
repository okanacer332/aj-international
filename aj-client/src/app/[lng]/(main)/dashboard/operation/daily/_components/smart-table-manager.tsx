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
import { WorkerAvailability, OperationTable, TableSession } from "@/types/operation";
import { toast } from "sonner";
import { Ticket, Loader2, Search, Clock, ArrowRightLeft, PlayCircle, AlertTriangle, Users, Plus, ChevronLeft, UserPlus, Info, CalendarIcon, Trash2, Calculator } from "lucide-react";
import { getInitials, cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Props {
    tableId: string;
    tableName: string;
    currentStock: number;
    activeSessions: TableSession[]; 
    allTables: OperationTable[];
    onSuccess: () => void;
}

type Mode = "CHECK" | "ENTRY" | "ASSIGN_ONLY" | "TRANSFER";

// Satır bazlı giriş için tip tanımı
interface TicketRow {
    id: string;
    amount: string;
    date: Date | undefined;
}

export function SmartTableManager({ tableId, tableName, currentStock, activeSessions, allTables, onSuccess }: Props) {
    const { t } = useTranslation("common");
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<Mode>("CHECK");
    const [loading, setLoading] = useState(false);

    const activeWorkerCount = activeSessions.length;
    const tableData = allTables.find(t => t.id === tableId);
    
    const realStock = tableData && tableData.totalPoolKg !== undefined
        ? Math.max(0, tableData.totalPoolKg - (tableData.processedKg || 0))
        : currentStock;

    // ORTAK STATE'LER
    const [workers, setWorkers] = useState<WorkerAvailability[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
    const [durationHours, setDurationHours] = useState<string>("9");

    // --- ÇOKLU GİRİŞ STATE'İ ---
    const [entries, setEntries] = useState<TicketRow[]>([
        { id: '1', amount: '', date: new Date() }
    ]);
    
    const [assignWorkers, setAssignWorkers] = useState(false);
    const [transferTargetId, setTransferTargetId] = useState<string>("");

    const switchMode = (newMode: Mode) => {
        setEntries([{ id: Math.random().toString(), amount: '', date: new Date() }]);
        setAssignWorkers(false);
        setSelectedWorkerIds([]);
        setTransferTargetId("");
        setSearchQuery("");
        setDurationHours("9");
        setMode(newMode);
    };

    useEffect(() => {
        if (open) {
            switchMode(realStock > 0 ? "CHECK" : "ENTRY");
        }
    }, [open, realStock]);

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

    // --- ROW MANIPULATION ---
    const addRow = () => {
        setEntries(prev => [
            ...prev, 
            { id: Math.random().toString(), amount: '', date: new Date() }
        ]);
    };

    const removeRow = (id: string) => {
        if (entries.length === 1) return;
        setEntries(prev => prev.filter(e => e.id !== id));
    };

    const updateRow = (id: string, field: keyof TicketRow, value: any) => {
        setEntries(prev => prev.map(e => {
            if (e.id === id) return { ...e, [field]: value };
            return e;
        }));
    };

    const totalEntryAmount = entries.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

    // --- HANDLERS ---
    
    // YENİ: Tek Seferde Paket Gönderim (Batch Entry)
    const handleEntry = async () => {
        // Geçerli fişleri filtrele (Miktarı boş olanları at)
        const validTickets = entries
            .filter(e => e.amount && parseFloat(e.amount) > 0)
            .map(e => ({
                amountKg: parseFloat(e.amount),
                customDate: e.date ? e.date.toISOString() : null
            }));

        if (validTickets.length === 0) {
            toast.error("Lütfen en az bir geçerli miktar giriniz.");
            return;
        }

        setLoading(true);
        try {
            // Backend'in beklediği Batch DTO yapısı:
            const payload = {
                tableId,
                tickets: validTickets,
                // İşçiler sadece 1 kere gönderilir, tüm masaya atanır.
                workerIds: assignWorkers ? selectedWorkerIds : null,
                durationMinutes: parseFloat(durationHours) * 60
            };

            await apiFetchAuth("/api/operation/ticket/batch", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            toast.success(`${validTickets.length} adet fiş başarıyla işlendi.`);
            setOpen(false);
            onSuccess();
        } catch (e) { 
            toast.error("İşlem sırasında hata oluştu."); 
        } 
        finally { setLoading(false); }
    };

    const handleTransfer = async () => {
        if (!transferTargetId) return;
        setLoading(true);
        try {
            await apiFetchAuth("/api/operation/transfer", {
                method: "POST",
                body: JSON.stringify({ fromTableId: tableId, toTableId: transferTargetId, amountKg: realStock })
            });
            toast.success(t('operation.common.confirm'));
            switchMode("ENTRY");
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

    const isEntryValid = () => {
        const hasValidAmount = totalEntryAmount > 0;
        const hasWorkers = assignWorkers && selectedWorkerIds.length > 0;
        return hasValidAmount || hasWorkers;
    };

    // --- RENDER HELPERS ---
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

    const renderActiveCrew = () => {
        if (activeSessions.length === 0) return null;
        return (
            <div className="bg-blue-50/60 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                        Şu An Masada Çalışanlar ({activeSessions.length})
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {activeSessions.map(session => (
                        <div key={session.sessionId} className="flex items-center gap-2 bg-background border rounded-full pl-1 pr-3 py-1 shadow-sm">
                            <Avatar className="h-6 w-6 border">
                                <AvatarImage src={session.avatarUrl ? `${API_BASE}${session.avatarUrl}` : undefined} />
                                <AvatarFallback className="text-[9px]">{getInitials(session.workerName)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium truncate max-w-[100px]">{session.workerName}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="w-full bg-blue-600 text-white hover:bg-blue-700 border border-blue-700 shadow-sm font-semibold h-10">
                    <PlayCircle className="mr-2 h-5 w-5"/> {t('operation.daily.actions.ticketEntry')}
                </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                
                {mode === "CHECK" && (
                    <div className="p-6 space-y-6">
                        <DialogHeader>
                            <DialogTitle className="text-xl flex items-center gap-2 text-amber-600">
                                <AlertTriangle className="w-6 h-6" /> Masada Mal Var!
                            </DialogTitle>
                        </DialogHeader>
                        
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center relative overflow-hidden">
                            <div className="absolute top-2 right-2 opacity-10"><Info className="w-12 h-12 text-amber-900"/></div>
                            <p className="text-sm text-amber-800 mb-1 font-medium">İşlenmeyi Bekleyen Stok</p>
                            <p className="text-4xl font-black text-amber-900">{realStock.toLocaleString('tr-TR')} {t('operation.common.kg')}</p>
                        </div>
                        
                        {renderActiveCrew()}

                        <div className="grid grid-cols-1 gap-3 pt-2">
                            <Button variant="outline" className="h-16 justify-start px-4 border-2 hover:border-green-500 hover:bg-green-50 transition-all" onClick={() => switchMode("ENTRY")}>
                                <Plus className="w-6 h-6 text-green-600 mr-3" />
                                <div className="text-left">
                                    <div className="font-bold text-green-700">{t('operation.dialogs.smart.addStock')}</div>
                                    <div className="text-[10px] text-muted-foreground">{t('operation.dialogs.smart.addStockDesc')}</div>
                                </div>
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
                                <div className="text-left">
                                    <div className="font-bold text-orange-700">{t('operation.dialogs.smart.transfer')}</div>
                                    <div className="text-[10px] text-muted-foreground">{t('operation.dialogs.smart.transferDesc')}</div>
                                </div>
                            </Button>
                        </div>
                    </div>
                )}

                {mode === "ASSIGN_ONLY" && (
                    <>
                        <DialogHeader className="p-4 border-b bg-muted/10">
                            <DialogTitle className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="gap-1 border-primary/20 text-primary" onClick={() => switchMode("CHECK")}>
                                    <ChevronLeft className="h-4 w-4" /> {t('operation.common.back')}
                                </Button>
                                <span className="ml-2">{t('operation.dialogs.bulkAssign.title')}</span>
                            </DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {renderActiveCrew()}
                            <div className="flex justify-between items-center"><Label>Planlanan Süre</Label>{renderDurationInput()}</div>
                            {renderWorkerList()}
                        </div>
                        <div className="p-5 border-t bg-muted/10">
                            <Button className="w-full h-12 text-base font-bold shadow-md" onClick={handleAssignOnly} disabled={loading || selectedWorkerIds.length === 0}>
                                {loading && <Loader2 className="mr-2 animate-spin"/>}
                                {t('operation.dialogs.bulkAssign.btnAssign')}
                            </Button>
                        </div>
                    </>
                )}

                {mode === "TRANSFER" && (
                    <div className="p-6 space-y-6">
                         <DialogHeader>
                             <DialogTitle className="flex items-center gap-2">
                                 <Button variant="outline" size="sm" className="gap-1 border-primary/20 text-primary" onClick={() => switchMode("CHECK")}>
                                     <ChevronLeft className="h-4 w-4" /> {t('operation.common.back')}
                                 </Button>
                                 <span className="ml-2">{t('operation.daily.rollover')}</span>
                             </DialogTitle>
                         </DialogHeader>
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-900 text-sm">
                                Bu işlem, <strong>{tableName}</strong> masasındaki 
                                <br/>Kalan Stoğu: <strong className="text-lg">{realStock} KG</strong>
                                <br/>seçilen masaya aktarır ve bu masayı boşaltır.
                            </div>
                            <div className="space-y-2">
                                <Label>{t('operation.fieldPanel.activeTables')}</Label>
                                <Select onValueChange={setTransferTargetId} value={transferTargetId}>
                                    <SelectTrigger className="h-12 text-lg"><SelectValue placeholder="Hedef Masa Seç..." /></SelectTrigger>
                                    <SelectContent>{targetTables.map(t => <SelectItem key={t.id} value={t.id}>{t.tableNo}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button className="w-full h-12 text-lg font-bold mt-4" onClick={handleTransfer} disabled={loading || !transferTargetId}>
                            {loading && <Loader2 className="mr-2 animate-spin"/>}{t('operation.common.confirm')}
                        </Button>
                    </div>
                )}

                {mode === "ENTRY" && (
                    <>
                        <DialogHeader className="p-4 border-b bg-muted/10">
                            <DialogTitle className="flex items-center gap-2">
                                {realStock > 0 && (
                                    <Button variant="outline" size="sm" className="gap-1 border-primary/20 text-primary" onClick={() => switchMode("CHECK")}>
                                        <ChevronLeft className="h-4 w-4" /> {t('operation.common.back')}
                                    </Button>
                                )}
                                <span className="ml-2">{tableName} - {t('operation.dialogs.ticket.title')}</span>
                            </DialogTitle>
                        </DialogHeader>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {renderActiveCrew()}

                            {realStock > 0 && (
                                <div className="flex items-center justify-between bg-yellow-50 px-3 py-2 rounded border border-yellow-100 text-sm text-yellow-800">
                                    <span>Kalan: <strong>{realStock}</strong></span>
                                    <span>+</span>
                                    <span>Yeni: <strong>{totalEntryAmount}</strong></span>
                                    <span>=</span>
                                    <strong>{(realStock + totalEntryAmount)} {t('operation.common.kg')}</strong>
                                </div>
                            )}

                            {/* --- ÇOKLU FİŞ GİRİŞ ALANI --- */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label className="text-base font-semibold">Fiş Girişleri</Label>
                                    <Badge variant="secondary" className="font-mono">{entries.length} Satır</Badge>
                                </div>
                                
                                <div className="space-y-2">
                                    {entries.map((entry, index) => (
                                        <div key={entry.id} className="flex gap-2 items-start animate-in fade-in slide-in-from-left-2">
                                            {/* Tarih */}
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-[140px] pl-3 text-left font-normal h-10",
                                                            !entry.date && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {entry.date ? format(entry.date, "d MMM", { locale: tr }) : <span>Tarih</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={entry.date}
                                                        onSelect={(date) => updateRow(entry.id, 'date', date)}
                                                        initialFocus
                                                        locale={tr}
                                                    />
                                                </PopoverContent>
                                            </Popover>

                                            {/* Miktar */}
                                            <div className="relative flex-1">
                                                <Ticket className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                                <Input 
                                                    type="number" 
                                                    placeholder="Miktar" 
                                                    className="pl-9 h-10 font-bold" 
                                                    value={entry.amount} 
                                                    onChange={e => updateRow(entry.id, 'amount', e.target.value)} 
                                                />
                                            </div>

                                            {/* Silme Butonu (Sadece 1 satırdan fazla varsa) */}
                                            {entries.length > 1 && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-10 w-10 text-muted-foreground hover:text-destructive shrink-0"
                                                    onClick={() => removeRow(entry.id)}
                                                    tabIndex={-1}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <Button 
                                    variant="outline" 
                                    className="w-full border-dashed border-2 text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 h-10 gap-2"
                                    onClick={addRow}
                                >
                                    <Plus className="w-4 h-4" /> Yeni Satır Ekle
                                </Button>
                            </div>

                            {/* TOPLAM ÖZET */}
                            {entries.length > 1 && totalEntryAmount > 0 && (
                                <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg border">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Calculator className="w-4 h-4" />
                                        <span className="text-sm font-medium">Toplam Giriş</span>
                                    </div>
                                    <div className="text-lg font-black text-primary">
                                        {totalEntryAmount.toLocaleString()} KG
                                    </div>
                                </div>
                            )}

                            <div className="border rounded-xl p-4 bg-card shadow-sm mt-4">
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