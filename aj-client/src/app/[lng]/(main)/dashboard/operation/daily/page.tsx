"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetchAuth, API_BASE } from "@/lib/api-auth";
import { OperationTable, TableSession } from "@/types/operation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { LogOut, RefreshCw, Wifi, WifiOff, Search, X, Scale, Users, Ticket, Archive } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { format, isToday } from "date-fns";
import { useOperationSocket } from "@/hooks/use-socket";

// --- ALT BİLEŞENLER ---
import { BulkWorkerAssignmentDialog } from "./_components/bulk-worker-assignment-dialog";
import { TicketEntryDialog } from "./_components/ticket-entry-dialog";
import { ReleaseSessionDialog } from "./_components/release-session-dialog";
import { CloseTableDialog } from "./_components/close-table-dialog";
import { LiveDuration } from "./_components/live-duration";

// Masa İstatistik Tipi (Backend DTO ile uyumlu)
interface TableStats {
    tableId: string;
    totalInputKg: number;
    totalOutputKg: number;
    remainingKg: number;
}

export default function PreSelectionOperationPage() {
  // --- STATE YÖNETİMİ ---
  const [tables, setTables] = useState<OperationTable[]>([]);
  const [tableSessions, setTableSessions] = useState<Record<string, TableSession[]>>({});
  const [tableStats, setTableStats] = useState<Record<string, TableStats>>({});
  
  const [lastEventTime, setLastEventTime] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  
  // Arama Filtresi
  const [searchQuery, setSearchQuery] = useState("");

  // Çıkış Modalı Kontrolü
  const [sessionToRelease, setSessionToRelease] = useState<{ id: string; workerName: string; targetOutputKg: number } | null>(null);

  // --- VERİLERİ ÇEKME ---
  const loadData = useCallback(async () => {
    try {
        // 1. Tüm Masaları Çek
        const res = await apiFetchAuth("/api/operation/tables");
        const allTables: OperationTable[] = await res.json();
        
        // Sadece "Ön Seçim" (PRE_SELECTION) masalarını filtrele
        const preSelectionTables = allTables.filter(t => t.unitType === "PRE_SELECTION");
        setTables(preSelectionTables);

        if (preSelectionTables.length > 0) {
            const sessionsMap: Record<string, TableSession[]> = {};
            const statsMap: Record<string, TableStats> = {};

            // 2. Oturumları ve İstatistikleri Paralel Çek
            await Promise.all(preSelectionTables.map(async (t) => {
                // Aktif Oturumlar (Çalışanlar)
                const sRes = await apiFetchAuth(`/api/operation/tables/${t.id}/sessions`);
                sessionsMap[t.id] = await sRes.json();

                // Masa İstatistikleri (Giren/Çıkan/Kalan)
                const statRes = await apiFetchAuth(`/api/operation/tables/${t.id}/stats`);
                statsMap[t.id] = await statRes.json();
            }));

            setTableSessions(sessionsMap);
            setTableStats(statsMap);
        }
    } catch (e) {
        console.error("Veri yükleme hatası", e);
        toast.error("Saha verileri güncellenemedi.");
    } finally {
        setIsLoading(false);
    }
  }, []);

  // İlk Yükleme
  useEffect(() => { loadData(); }, [loadData]);

  // --- WEBSOCKET BAĞLANTISI ---
  useOperationSocket(useCallback((msg) => {
      setIsSocketConnected(true);
      // İlgili olaylarda ekranı yenile
      if (["SESSION_UPDATE", "TABLES_REFRESH", "TICKET_UPDATE"].includes(msg.type)) {
          setLastEventTime(new Date());
          loadData();
          // Çok sık toast çıkmaması için sadece önemli güncellemelerde veya opsiyonel gösterilebilir
          // toast.info("Veriler güncellendi", { duration: 1000, position: 'bottom-right' });
      }
  }, [loadData]));

  useEffect(() => { setIsSocketConnected(true); }, []);

  // --- AKSİYONLAR ---
  
  // Masadan Ayırma (Release) Diyaloğunu Aç
  const openReleaseDialog = (session: TableSession) => {
      setSessionToRelease({
          id: session.sessionId,
          workerName: session.workerName,
          targetOutputKg: session.targetOutputKg
      });
  };

  // Arama Filtreleme
  const filteredTables = tables.filter(table => 
    table.tableNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- ARAYÜZ ---
  if (isLoading && tables.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground animate-pulse space-y-4">
            <RefreshCw className="w-12 h-12 animate-spin text-primary/50" />
            <span className="text-lg font-medium">Saha verileri yükleniyor...</span>
        </div>
      );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 h-full flex flex-col">
        
        {/* 1. ÜST KONTROL PANELİ (STICKY HEADER) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 rounded-xl border shadow-sm sticky top-0 z-30">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Ön Seçim Operasyonu</h1>
                    
                    {/* Bağlantı Durumu */}
                    <Badge variant="outline" className={`gap-1.5 transition-colors ${isSocketConnected ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                        {isSocketConnected ? (
                            <>
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="font-medium hidden sm:inline">Canlı Akış</span>
                            </>
                        ) : (
                            <div className="flex items-center gap-1">
                                <WifiOff className="w-3 h-3" />
                                <span>Offline</span>
                            </div>
                        )}
                    </Badge>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                   <RefreshCw className="w-3 h-3" /> Son senkronizasyon: <span className="font-mono font-medium text-foreground">{format(lastEventTime, "HH:mm:ss")}</span>
                </p>
            </div>

            {/* Arama ve Yenileme */}
            <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Masa Ara (Örn: 37)" 
                        className="pl-9 pr-9 h-10 bg-muted/30 focus-visible:ring-primary/30 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                
                <Button variant="outline" size="icon" onClick={loadData} className="shrink-0" title="Manuel Yenile">
                    <RefreshCw className="w-4 h-4" />
                </Button>
            </div>
        </div>
        
        {/* 2. MASA GRİD LİSTESİ */}
        {filteredTables.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20 border-2 border-dashed rounded-xl bg-muted/10 mx-4">
                <div className="bg-muted/20 p-4 rounded-full mb-4">
                    <Search className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-muted-foreground">
                    {searchQuery ? `"${searchQuery}" numaralı masa bulunamadı.` : "Henüz tanımlı 'Ön Seçim' masası yok."}
                </h3>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6 pb-10">
                {filteredTables.map(table => {
                    const activeSessions = tableSessions[table.id] || [];
                    const stats = tableStats[table.id] || { totalInputKg: 0, totalOutputKg: 0, remainingKg: 0 };
                    const isActive = activeSessions.length > 0;

                    return (
                        <Card 
                            key={table.id} 
                            className={`relative overflow-hidden transition-all duration-300 border-t-[5px] flex flex-col shadow-sm hover:shadow-md
                                ${isActive ? 'border-t-green-500 bg-card' : 'border-t-muted-foreground/20 bg-muted/5 opacity-95'}
                            `}
                        >
                            {/* Masa Başlığı */}
                            <CardHeader className="pb-2 flex flex-row items-center justify-between border-b px-4 py-3 bg-muted/10">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}/>
                                    <CardTitle className="text-lg font-bold text-foreground">{table.tableNo}</CardTitle>
                                </div>
                                {isActive ? (
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 font-medium px-2">
                                        {activeSessions.length} Personel
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-muted-foreground bg-background">Boş</Badge>
                                )}
                            </CardHeader>
                            
                            <CardContent className="p-4 flex-1 flex flex-col gap-4">
                                
                                {/* HAVUZ İSTATİSTİKLERİ (Giren-Çıkan-Kalan) */}
                                <div className="grid grid-cols-3 gap-px bg-border rounded-lg overflow-hidden border shadow-sm">
                                    <div className="bg-background p-2 text-center">
                                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5 flex items-center justify-center gap-1">
                                            <Ticket className="w-3 h-3" /> Giren
                                        </div>
                                        <div className="text-sm font-bold text-blue-600">{stats.totalInputKg.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-background p-2 text-center">
                                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5 flex items-center justify-center gap-1">
                                            <Scale className="w-3 h-3" /> Çıkan
                                        </div>
                                        <div className="text-sm font-bold text-green-600">{stats.totalOutputKg.toLocaleString()}</div>
                                    </div>
                                    <div className={`p-2 text-center ${stats.remainingKg < 0 ? 'bg-red-50' : 'bg-amber-50/50'}`}>
                                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Kalan</div>
                                        <div className={`text-sm font-bold ${stats.remainingKg < 0 ? 'text-red-600' : 'text-amber-700'}`}>
                                            {stats.remainingKg.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {/* ÇALIŞAN LİSTESİ */}
                                <div className="space-y-2 flex-1 min-h-[120px]">
                                    {activeSessions.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full py-6 text-muted-foreground/30 border-2 border-dashed rounded-lg bg-muted/5">
                                            <Users className="w-8 h-8 mb-2 opacity-20" />
                                            <span className="text-xs font-medium">Personel Atanmadı</span>
                                        </div>
                                    ) : (
                                        activeSessions.map(session => {
                                            const isFromYesterday = !isToday(new Date(session.startTime));
                                            return (
                                                <div key={session.sessionId} className="group relative flex flex-col gap-1 p-2.5 bg-background border rounded-lg shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
                                                    
                                                    {/* Devir Uyarısı */}
                                                    {isFromYesterday && (
                                                        <div className="absolute -top-2 -right-1 bg-orange-500 text-white text-[9px] px-1.5 py-px rounded-sm font-bold shadow-sm z-10 flex items-center gap-1">
                                                           Devir
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <Avatar className="h-9 w-9 border bg-background shrink-0">
                                                                <AvatarImage src={session.avatarUrl ? `${API_BASE}${session.avatarUrl}` : undefined} />
                                                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">{getInitials(session.workerName)}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="font-semibold text-sm truncate text-foreground leading-tight">{session.workerName}</span>
                                                                <div className="mt-0.5">
                                                                    <LiveDuration startTime={session.startTime} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <Button 
                                                            size="icon" 
                                                            variant="ghost" 
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                            title="Masadan Ayır (Bitir)"
                                                            onClick={() => openReleaseDialog(session)}
                                                        >
                                                            <LogOut className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    
                                                    {/* Hedef Bilgisi */}
                                                    <div className="mt-1 pt-1 border-t border-dashed flex justify-between items-center text-[10px] text-muted-foreground">
                                                        <span>Başlangıç: <span className="font-mono">{format(new Date(session.startTime), "HH:mm")}</span></span>
                                                        <span className="font-medium bg-primary/5 text-primary px-1.5 py-0.5 rounded">Hedef: {session.targetOutputKg} kg</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                
                                {/* AKSİYON BUTONLARI */}
                                <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
                                    <TicketEntryDialog 
                                        tableId={table.id} 
                                        tableName={table.tableNo} 
                                        onSuccess={loadData} 
                                    />
                                    <BulkWorkerAssignmentDialog 
                                        tableId={table.id} 
                                        onSuccess={loadData} 
                                    />
                                </div>

                                {/* MASA KAPAT BUTONU */}
                                <div className="pt-2 border-t border-dashed">
                                    <CloseTableDialog 
                                        tableId={table.id} 
                                        tableName={table.tableNo} 
                                        systemRemaining={stats.remainingKg} 
                                        onSuccess={loadData}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        )}

        {/* 3. PERSONEL ÇIKIŞ DİYALOĞU (GLOBAL) */}
        <ReleaseSessionDialog 
            isOpen={!!sessionToRelease} 
            onClose={() => setSessionToRelease(null)} 
            session={sessionToRelease} 
        />
    </div>
  );
}

