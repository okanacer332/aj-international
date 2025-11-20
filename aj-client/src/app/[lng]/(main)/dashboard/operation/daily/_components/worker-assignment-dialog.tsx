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
import { Battery, BatteryFull, BatteryLow, AlertTriangle, Clock, UserPlus, Loader2, Search, X, Hash } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useOperationSocket } from "@/hooks/use-socket";

interface Props {
    tableId: string;
    onSuccess: () => void;
}

export function WorkerAssignmentDialog({ tableId, onSuccess }: Props) {
    const [open, setOpen] = useState(false);
    const [workers, setWorkers] = useState<WorkerAvailability[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedWorker, setSelectedWorker] = useState<WorkerAvailability | null>(null);
    const [duration, setDuration] = useState<number>(0);
    const [loading, setLoading] = useState(false);

    const fetchWorkers = useCallback(async () => {
        try {
            const res = await apiFetchAuth("/api/operation/available-workers");
            const data = await res.json();
            setWorkers(data);
        } catch (error) {
            console.error("Worker fetch error", error);
        }
    }, []);

    useOperationSocket(useCallback((msg) => {
        if (msg.type === "WORKER_UPDATE" && open) {
            fetchWorkers();
        }
    }, [open, fetchWorkers]));

    useEffect(() => {
        if (open) {
            setLoading(true);
            fetchWorkers().finally(() => setLoading(false));
            setSearchQuery("");
        } else {
            setSelectedWorker(null);
        }
    }, [open, fetchWorkers]);

    // Arama filtresi (İsim veya ONX kodu)
    const filteredWorkers = workers.filter(w => 
        (w.fullName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (w.onxCode?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );

    const handleSelectWorker = (worker: WorkerAvailability) => {
        if (worker.status === "FULL") {
            toast.warning("Bu personelin günlük kotası dolu.");
            return;
        }
        if (worker.status === "BUSY") {
            toast.warning("Bu personel şu an başka bir masada çalışıyor.");
            return;
        }
        setSelectedWorker(worker);
        setDuration(worker.remainingMinutes); 
    };

    const handleAssign = async () => {
        if (!selectedWorker) return;
        if (duration > selectedWorker.remainingMinutes) {
             if(!confirm(`DİKKAT! Kalan süre: ${selectedWorker.remainingMinutes} dk. Girilen: ${duration} dk. Fazla mesaiyi onaylıyor musunuz?`)) return;
        }
        try {
            await apiFetchAuth("/api/operation/assign", {
                method: "POST",
                body: JSON.stringify({ tableId, workerId: selectedWorker.workerId, durationMinutes: duration })
            });
            toast.success(`${selectedWorker.fullName} masaya atandı.`);
            setOpen(false);
            onSuccess(); 
        } catch (e) {
            toast.error("Atama hatası.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full md:w-auto">
                    <UserPlus className="mr-2 h-4 w-4"/> Personel Ekle
                </Button>
            </DialogTrigger>
            
            {/* --- DÜZELTME 1: Modal Boyutu ve Taşma Kontrolü --- */}
            {/* max-h-[85vh] ile ekranın %85'ini geçmesini engelledik. flex-col ile içeriği dikey dizdik. */}
            <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                
                {/* Header: Sabit */}
                <DialogHeader className="p-4 border-b bg-background z-10">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        {selectedWorker ? "Atama Detayları" : "Personel Seçimi"}
                        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </DialogTitle>
                </DialogHeader>

                {!selectedWorker ? (
                    <>
                        {/* --- DÜZELTME 2: Arama Çubuğu (Sabit) --- */}
                        <div className="p-3 border-b bg-muted/10">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="İsim veya Sicil No ile ara..." 
                                    className="pl-9 pr-9 h-9 bg-background"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* --- DÜZELTME 3: Kaydırılabilir Liste Alanı --- */}
                        <ScrollArea className="flex-1 p-0 h-full">
                            <div className="p-3 grid grid-cols-1 gap-2">
                                {filteredWorkers.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                                        <UserPlus className="h-10 w-10 mb-2 opacity-20" />
                                        <p className="text-sm">Uygun personel bulunamadı.</p>
                                    </div>
                                ) : (
                                    filteredWorkers.map(w => (
                                        <div 
                                            key={w.workerId} 
                                            onClick={() => handleSelectWorker(w)}
                                            className={`
                                                relative flex items-center p-3 rounded-lg border transition-all duration-200 cursor-pointer select-none
                                                ${w.status === 'FULL' || w.status === 'BUSY' 
                                                    ? 'opacity-60 bg-muted border-transparent' 
                                                    : 'bg-card hover:border-primary/50 hover:shadow-sm hover:bg-accent/5'}
                                            `}
                                        >
                                            {/* Avatar */}
                                            <Avatar className="h-10 w-10 border bg-background shadow-sm mr-3 shrink-0">
                                                <AvatarImage src={w.avatarUrl ? `${API_BASE}${w.avatarUrl}` : undefined} className="object-cover"/>
                                                <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                                                    {getInitials(w.fullName)}
                                                </AvatarFallback>
                                            </Avatar>
                                            
                                            {/* Bilgiler */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm text-foreground truncate">
                                                        {w.fullName || "İsimsiz"}
                                                    </span>
                                                    {w.activeMinutes > 0 && (
                                                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="Şu an çalışıyor" />
                                                    )}
                                                </div>
                                                
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-mono text-muted-foreground bg-muted border">
                                                        {w.onxCode}
                                                    </Badge>
                                                </div>
                                            </div>
                                            
                                            {/* Durum ve Pil */}
                                            <div className="flex flex-col items-end justify-center gap-1 pl-2">
                                                {w.status === 'AVAILABLE' && (
                                                    <div className={`text-xs font-bold flex items-center gap-1 ${w.remainingMinutes < 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                        {w.remainingMinutes} dk
                                                        <BatteryFull className="w-3.5 h-3.5" />
                                                    </div>
                                                )}
                                                {w.status === 'BUSY' && (
                                                    <Badge variant="outline" className="text-[10px] h-5 bg-orange-50 text-orange-600 border-orange-200 px-1.5">
                                                        <Clock className="w-3 h-3 mr-1"/> Meşgul
                                                    </Badge>
                                                )}
                                                {w.status === 'FULL' && (
                                                    <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                                                        <BatteryLow className="w-3 h-3 mr-1"/> Dolu
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </>
                ) : (
                    /* --- SEÇİM YAPILDIKTAN SONRAKİ EKRAN --- */
                    <div className="p-6 flex flex-col flex-1 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center mb-6">
                            <Avatar className="h-20 w-20 border-4 border-muted shadow-sm mb-3">
                                <AvatarImage src={selectedWorker.avatarUrl ? `${API_BASE}${selectedWorker.avatarUrl}` : undefined} />
                                <AvatarFallback className="text-2xl">{getInitials(selectedWorker.fullName)}</AvatarFallback>
                            </Avatar>
                            <h3 className="text-xl font-bold">{selectedWorker.fullName}</h3>
                            <p className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded mt-1">{selectedWorker.onxCode}</p>
                        </div>

                        <div className="space-y-4 w-full">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium">Atanacak Süre</span>
                                    <span className="text-muted-foreground text-xs">Kalan: {selectedWorker.remainingMinutes} dk</span>
                                </div>
                                <div className="flex gap-2">
                                    <Input 
                                        type="number" 
                                        value={duration} 
                                        onChange={(e) => setDuration(Number(e.target.value))} 
                                        className="text-center text-xl font-bold h-12"
                                        autoFocus
                                    />
                                    <Button variant="secondary" className="h-12 px-4" onClick={() => setDuration(selectedWorker.remainingMinutes)}>
                                        Tümü
                                    </Button>
                                </div>
                            </div>

                            {duration > selectedWorker.remainingMinutes && (
                                <div className="bg-destructive/10 text-destructive p-3 rounded-md text-xs flex items-start gap-2 border border-destructive/20">
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-bold block">Fazla Mesai!</span>
                                        Günlük 9 saatlik limiti aşıyorsunuz.
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <Button variant="outline" size="lg" onClick={() => setSelectedWorker(null)}>
                                    Geri Dön
                                </Button>
                                <Button size="lg" onClick={handleAssign} className="font-bold">
                                    Onayla
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}