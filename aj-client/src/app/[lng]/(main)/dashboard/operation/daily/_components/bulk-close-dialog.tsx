"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { Loader2, Power, CheckSquare, Square, Trash2, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { OperationTable } from "@/types/operation";
import { Badge } from "@/components/ui/badge";

interface Props {
    openTables: OperationTable[]; 
    onSuccess: () => void;
}

// GÜNCELLEME 1: Destructuring sırasında varsayılan değer atadık (openTables = [])
export function BulkCloseDialog({ openTables = [], onSuccess }: Props) {
    const { t } = useTranslation("common");
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // GÜNCELLEME 2: Güvenlik katmanı. Ne olur ne olmaz diye bir değişken daha.
    const safeTables = openTables || [];

    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            // openTables yerine safeTables kullanıyoruz
            setSelectedIds(safeTables.map(t => t.id));
        }
    }, [isOpen, safeTables]); // Dependency de değişti

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        // openTables yerine safeTables
        if (selectedIds.length === safeTables.length) {
            setSelectedIds([]); 
        } else {
            setSelectedIds(safeTables.map(t => t.id)); 
        }
    };

    const handleBulkClose = async () => {
        if (selectedIds.length === 0) return;

        setLoading(true);
        try {
            await apiFetchAuth("/api/operation/close-all", {
                method: "POST",
                body: JSON.stringify(selectedIds)
            });
            
            toast.success(`${selectedIds.length} masa kapatıldı.`);
            setIsOpen(false);
            onSuccess();
        } catch (e) {
            toast.error("İşlem başarısız oldu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" size="icon" className="rounded-full w-10 h-10 shadow-md hover:scale-105 transition-transform" title="Toplu Kapat">
                    <Power className="w-5 h-5" />
                </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 className="w-5 h-5" />
                        Toplu Masa Kapatma
                    </DialogTitle>
                    <DialogDescription>
                        Seçili masalar <strong>0 KG bakiye ile</strong> kapatılacaktır. 
                        Devretmesini istediğiniz (zaten kapattığınız) masaların işaretini kaldırın.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-2 py-2">
                    <div className="flex justify-between items-center px-1 pb-2 border-b">
                        <Button variant="ghost" size="sm" onClick={toggleSelectAll} className="gap-2 h-8 px-2 text-xs font-medium">
                            {/* HATA BURADAYDI: safeTables kullanarak çözüldü */}
                            {selectedIds.length === safeTables.length ? <CheckSquare className="w-4 h-4"/> : <Square className="w-4 h-4"/>}
                            Tümünü Seç
                        </Button>
                        <span className="text-xs text-muted-foreground font-medium">
                            {selectedIds.length} / {safeTables.length} Seçildi
                        </span>
                    </div>

                    {/* Masalar Listesi */}
                    <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[300px] space-y-1 p-1 bg-muted/10 rounded-md border">
                        {safeTables.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm py-8">
                                <Info className="w-8 h-8 mb-2 opacity-50"/>
                                <span>Kapatılacak açık masa yok.</span>
                            </div>
                        ) : (
                            safeTables.map(table => {
                                const isSelected = selectedIds.includes(table.id);
                                const remaining = (table.totalPoolKg || 0) - (table.processedKg || 0);
                                
                                return (
                                    <div 
                                        key={table.id} 
                                        onClick={() => toggleSelection(table.id)}
                                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border select-none ${
                                            isSelected 
                                            ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900 shadow-sm" 
                                            : "bg-background border-transparent hover:bg-muted"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {isSelected 
                                                ? <CheckSquare className="w-5 h-5 text-red-600 shrink-0" /> 
                                                : <Square className="w-5 h-5 text-muted-foreground shrink-0" />
                                            }
                                            <span className={`font-medium text-sm ${isSelected ? "text-red-700 dark:text-red-300" : "text-foreground"}`}>
                                                {table.tableNo}
                                            </span>
                                        </div>
                                        
                                        {remaining > 0 && (
                                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-background font-mono">
                                                {remaining.toLocaleString()} KG
                                            </Badge>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={loading}>
                        {t('operation.common.cancel')}
                    </Button>
                    <Button variant="destructive" onClick={handleBulkClose} disabled={loading || selectedIds.length === 0}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Seçilenleri Kapat ({selectedIds.length})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}