"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
// ScrollArea yerine native div kullanacağız, bazen flex yapısında daha stabil çalışır
// import { ScrollArea } from "@/components/ui/scroll-area"; 
import { Checkbox } from "@/components/ui/checkbox";
import { apiFetchAuth, API_BASE } from "@/lib/api-auth";
import { WorkerAvailability } from "@/types/operation";
import { toast } from "sonner";
import { Battery, Users, Search, Loader2, UserPlus, X } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface Props {
    tableId: string;
    onSuccess: () => void;
}

export function BulkWorkerAssignmentDialog({ tableId, onSuccess }: Props) {
    const [open, setOpen] = useState(false);
    const [workers, setWorkers] = useState<WorkerAvailability[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    
    const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
    const [duration, setDuration] = useState<number>(540); // Varsayılan 9 Saat
    const [loading, setLoading] = useState(false);

    const fetchWorkers = useCallback(async () => {
        try {
            const res = await apiFetchAuth("/api/operation/available-workers");
            setWorkers(await res.json());
        } catch (e) {
            console.error(e);
            toast.error("Liste yüklenemedi");
        }
    }, []);

    useEffect(() => {
        if (open) {
            fetchWorkers();
            setSelectedWorkerIds([]); 
            setSearchQuery("");
        }
    }, [open, fetchWorkers]);

    const filteredWorkers = workers.filter(w => 
        (w.fullName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (w.onxCode?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );

    const toggleWorker = (id: string) => {
        setSelectedWorkerIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // "Tümünü Seç" fonksiyonu (Opsiyonel kolaylık)
    const toggleSelectAll = () => {
        const availableIds = filteredWorkers
            .filter(w => w.status === 'AVAILABLE')
            .map(w => w.workerId);
            
        if (availableIds.every(id => selectedWorkerIds.includes(id))) {
            // Hepsini kaldır
            setSelectedWorkerIds(prev => prev.filter(id => !availableIds.includes(id)));
        } else {
            // Hepsini ekle
            setSelectedWorkerIds(prev => Array.from(new Set([...prev, ...availableIds])));
        }
    };

    const handleAssign = async () => {
        if (selectedWorkerIds.length === 0) return;
        
        setLoading(true);
        try {
            await apiFetchAuth("/api/operation/assign", {
                method: "POST",
                body: JSON.stringify({
                    tableId,
                    workerIds: selectedWorkerIds,
                    durationMinutes: duration
                })
            });
            toast.success(`${selectedWorkerIds.length} personel atandı.`);
            setOpen(false);
            onSuccess();
        } catch (e) {
            toast.error("Atama başarısız.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full md:w-auto">
                    <Users className="mr-2 h-4 w-4"/> Toplu İş Başı
                </Button>
            </DialogTrigger>
            
            {/* RESPONSIVE VE SCROLL DÜZELTMESİ:
                - h-[90vh]: Mobilde ekranın %90'ını kapla.
                - sm:max-h-[85vh]: Masaüstünde maksimum %85 yükseklik.
                - flex flex-col: İçeriği dikey diz.
                - overflow-hidden: Dışarı taşmaları engelle.
            */}
            <DialogContent className="w-[95vw] max-w-2xl h-[90vh] sm:h-auto sm:max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden rounded-xl">
                
                {/* 1. HEADER (SABİT) */}
                <DialogHeader className="p-4 border-b bg-background z-10 shrink-0">
                    <DialogTitle className="flex items-center justify-between">
                        <span>Ekip Oluştur</span>
                        <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">
                            {selectedWorkerIds.length} Seçildi
                        </span>
                    </DialogTitle>
                    
                    {/* Arama Alanı */}
                    <div className="relative mt-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="İsim veya Sicil No ile ara..." 
                            className="pl-9 pr-9 bg-muted/30" 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground p-1">
                                <X className="h-3 w-3"/>
                            </button>
                        )}
                    </div>
                    
                    {/* Hızlı Filtre Butonları */}
                    <div className="flex items-center gap-2 mt-2">
                        <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={toggleSelectAll}>
                            Tümünü Seç / Kaldır
                        </Button>
                    </div>
                </DialogHeader>
                
                {/* 2. LİSTE (SCROLL EDİLEBİLİR ALAN) */}
                {/* flex-1: Kalan tüm boşluğu kapla, overflow-y-auto: Sadece bu alan scroll olsun */}
                <div className="flex-1 overflow-y-auto p-4 bg-muted/5">
                    <div className="grid grid-cols-1 gap-2 pb-2">
                        {filteredWorkers.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                Personel bulunamadı.
                            </div>
                        ) : (
                            filteredWorkers.map(w => {
                                const isSelected = selectedWorkerIds.includes(w.workerId);
                                const isDisabled = w.status === 'FULL' || w.status === 'BUSY';
                                
                                return (
                                    <div 
                                        key={w.workerId} 
                                        onClick={() => !isDisabled && toggleWorker(w.workerId)}
                                        className={`
                                            relative flex items-center p-3 rounded-lg border transition-all cursor-pointer select-none
                                            ${isDisabled 
                                                ? 'opacity-50 bg-muted border-transparent cursor-not-allowed' 
                                                : isSelected 
                                                    ? 'bg-primary/5 border-primary ring-1 ring-primary/20' 
                                                    : 'bg-card border-border hover:border-primary/50 hover:shadow-sm'
                                            }
                                        `}
                                    >
                                        {/* Checkbox */}
                                        <Checkbox 
                                            checked={isSelected}
                                            disabled={isDisabled}
                                            className="mr-4 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                        />
                                        
                                        {/* Avatar */}
                                        <Avatar className="h-10 w-10 mr-3 border bg-background">
                                            <AvatarImage src={w.avatarUrl ? `${API_BASE}${w.avatarUrl}` : undefined} />
                                            <AvatarFallback className="text-xs font-bold text-primary bg-primary/10">
                                                {getInitials(w.fullName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        
                                        {/* Bilgiler */}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-sm truncate">{w.fullName}</div>
                                            <div className="text-xs text-muted-foreground font-mono">{w.onxCode}</div>
                                        </div>

                                        {/* Durum Rozeti */}
                                        <div className="ml-2 shrink-0">
                                            {w.status === 'AVAILABLE' ? (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] px-1.5 py-0.5 h-auto">
                                                    <Battery className="w-3 h-3 mr-1 inline-block"/> {w.remainingMinutes} dk
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-[10px] h-auto">Meşgul</Badge>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* 3. FOOTER (SABİT - AKSİYON ALANI) */}
                <div className="p-4 border-t bg-background z-10 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <div className="flex flex-col gap-4">
                        {/* Süre Ayarı */}
                        <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg border">
                            <span className="text-sm font-medium text-muted-foreground px-2">Planlanan Süre:</span>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" size="icon" className="h-8 w-8" 
                                    onClick={() => setDuration(Math.max(60, duration - 60))}
                                >-</Button>
                                <Input 
                                    type="number" 
                                    value={duration} 
                                    onChange={e => setDuration(Number(e.target.value))}
                                    className="w-20 h-8 text-center font-bold bg-background border-input"
                                />
                                <Button 
                                    variant="outline" size="icon" className="h-8 w-8"
                                    onClick={() => setDuration(duration + 60)}
                                >+</Button>
                                <span className="text-xs text-muted-foreground w-8">dk</span>
                            </div>
                        </div>
                        
                        {/* Onay Butonu */}
                        <Button 
                            className="w-full h-12 text-base font-semibold shadow-md" 
                            onClick={handleAssign} 
                            disabled={loading || selectedWorkerIds.length === 0}
                        >
                            {loading ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> İşleniyor...</>
                            ) : (
                                <><UserPlus className="mr-2 h-5 w-5"/> {selectedWorkerIds.length} Personeli Ata & Başlat</>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}