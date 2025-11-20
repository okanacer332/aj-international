"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { apiFetchAuth, API_BASE } from "@/lib/api-auth";
import { OperationTable, TableSession } from "@/types/operation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { 
    LogOut, RefreshCw, Wifi, WifiOff, Search, X, 
    Users, Armchair, Activity, Percent, MonitorPlay 
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import { format, isToday } from "date-fns";
import { useOperationSocket } from "@/hooks/use-socket";

// İlgili bileşenler
import { WorkerAssignmentDialog } from "../operation/daily/_components/worker-assignment-dialog";
import { LiveDuration } from "../operation/daily/_components/live-duration";
import { ReleaseSessionDialog } from "../operation/daily/_components/release-session-dialog";
import { WorkerStatusList } from "../operation/daily/_components/worker-status-list"; // YENİ BİLEŞEN

export default function FieldPanelPage() {
  const [tables, setTables] = useState<OperationTable[]>([]);
  const [tableSessions, setTableSessions] = useState<Record<string, TableSession[]>>({});
  const [lastEventTime, setLastEventTime] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionToRelease, setSessionToRelease] = useState<{ id: string; workerName: string; targetOutputKg: number } | null>(null);

  const loadData = useCallback(async () => {
    try {
        const res = await apiFetchAuth("/api/operation/tables");
        const allTables: OperationTable[] = await res.json();
        const preSelectionTables = allTables.filter(t => t.unitType === "PRE_SELECTION");
        setTables(preSelectionTables);

        const sessionsMap: Record<string, TableSession[]> = {};
        if (preSelectionTables.length > 0) {
            await Promise.all(preSelectionTables.map(async (t) => {
                const sRes = await apiFetchAuth(`/api/operation/tables/${t.id}/sessions`);
                sessionsMap[t.id] = await sRes.json();
            }));
        }
        setTableSessions(sessionsMap);
    } catch (e) {
        console.error("Data load error", e);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useOperationSocket(useCallback((msg) => {
      setIsSocketConnected(true);
      if (msg.type === "SESSION_UPDATE" || msg.type === "TABLES_REFRESH") {
          setLastEventTime(new Date());
          loadData();
          toast.info("Saha verileri güncellendi", { duration: 1000, position: 'bottom-right' });
      }
  }, [loadData]));

  useEffect(() => { setIsSocketConnected(true); }, []);

  const stats = useMemo(() => {
      const totalTables = tables.length;
      const activeTables = Object.values(tableSessions).filter(s => s && s.length > 0).length;
      const activeWorkers = Object.values(tableSessions).flat().length;
      const occupancyRate = totalTables > 0 ? Math.round((activeTables / totalTables) * 100) : 0;

      return { totalTables, activeTables, activeWorkers, occupancyRate };
  }, [tables, tableSessions]);

  const openReleaseDialog = (session: TableSession) => {
      setSessionToRelease({
          id: session.sessionId,
          workerName: session.workerName,
          targetOutputKg: session.targetOutputKg
      });
  };

  const filteredTables = tables.filter(table => 
    table.tableNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading && tables.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-screen text-muted-foreground animate-pulse bg-muted/10">
            <RefreshCw className="w-12 h-12 animate-spin mb-4 text-primary" />
            <span className="text-xl font-medium">Saha Paneli Yükleniyor...</span>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-4 space-y-4">
        
        {/* 1. ÜST BAŞLIK ve KPI KARTLARI */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Başlık Kartı */}
            <Card className="col-span-1 lg:col-span-4 bg-card shadow-sm p-1">
                <div className="flex flex-col md:flex-row items-center justify-between p-3">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-lg">
                            <MonitorPlay className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">Ön Seçim Sahası</h1>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className={`flex items-center gap-1 font-medium ${isSocketConnected ? 'text-green-600' : 'text-red-500'}`}>
                                    {isSocketConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                                    {isSocketConnected ? 'ONLINE' : 'OFFLINE'}
                                </span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"/>
                                <span>Güncelleme: {format(lastEventTime, "HH:mm:ss")}</span>
                            </div>
                        </div>
                    </div>

                    {/* KPI Özetleri */}
                    <div className="flex gap-4 mt-4 md:mt-0">
                         <div className="flex flex-col items-center px-4 border-r">
                            <span className="text-xs text-muted-foreground uppercase font-semibold">Masa</span>
                            <span className="text-2xl font-bold">{stats.activeTables}<span className="text-muted-foreground/40 text-lg">/{stats.totalTables}</span></span>
                        </div>
                        <div className="flex flex-col items-center px-4 border-r">
                            <span className="text-xs text-muted-foreground uppercase font-semibold">Personel</span>
                            <span className="text-2xl font-bold text-blue-600">{stats.activeWorkers}</span>
                        </div>
                        <div className="flex flex-col items-center px-4">
                            <span className="text-xs text-muted-foreground uppercase font-semibold">Doluluk</span>
                            <span className="text-2xl font-bold text-green-600">%{stats.occupancyRate}</span>
                        </div>
                    </div>

                    {/* Arama */}
                    <div className="relative w-full md:w-64 mt-4 md:mt-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Masa Ara..." 
                            className="pl-9 h-10 bg-muted/50 border-0 focus-visible:ring-1"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full">
                                <X className="h-3 w-3 text-muted-foreground" />
                            </button>
                        )}
                    </div>
                </div>
            </Card>
        </div>

        {/* 2. ANA İÇERİK (İKİ SÜTUNLU YAPI) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full overflow-hidden">
            
            {/* SOL PANEL: MASALAR (2/3 Genişlik) */}
            <div className="lg:col-span-2 overflow-y-auto pr-1 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-20">
                    {filteredTables.map(table => {
                        const activeSessions = tableSessions[table.id] || [];
                        const isActive = activeSessions.length > 0;

                        return (
                            <Card 
                                key={table.id} 
                                className={`relative overflow-hidden transition-all duration-300 border-t-[5px] flex flex-col shadow-sm
                                    ${isActive ? 'border-t-green-500 bg-card' : 'border-t-gray-200 bg-gray-50/50 opacity-70 hover:opacity-100'}
                                `}
                            >
                                <div className="absolute top-2 right-2">
                                    <WorkerAssignmentDialog tableId={table.id} onSuccess={() => {}} />
                                </div>

                                <CardHeader className="pb-2 pt-4 px-4">
                                    <CardTitle className="text-lg font-bold text-foreground">{table.tableNo}</CardTitle>
                                    <p className="text-xs text-muted-foreground">{isActive ? 'Aktif Çalışma Var' : 'Masa Boş'}</p>
                                </CardHeader>
                                
                                <CardContent className="p-4 pt-0 flex-1 flex flex-col">
                                    <div className="space-y-2 mt-2">
                                        {activeSessions.map(session => {
                                            const isFromYesterday = !isToday(new Date(session.startTime));
                                            return (
                                                <div key={session.sessionId} className="relative flex flex-col gap-1 p-2 bg-background border rounded-md shadow-sm text-sm">
                                                    {isFromYesterday && (
                                                        <div className="absolute -top-2 -right-1 bg-orange-500 text-white text-[8px] px-1.5 rounded-full font-bold z-10">Devir</div>
                                                    )}
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-6 w-6">
                                                                <AvatarImage src={session.avatarUrl ? `${API_BASE}${session.avatarUrl}` : undefined} />
                                                                <AvatarFallback className="text-[9px]">{getInitials(session.workerName)}</AvatarFallback>
                                                            </Avatar>
                                                            <span className="font-semibold text-xs truncate max-w-[80px]">{session.workerName}</span>
                                                        </div>
                                                        <LiveDuration startTime={session.startTime} />
                                                    </div>
                                                    <div className="flex justify-between items-center mt-1 pt-1 border-t border-dashed">
                                                        <span className="text-[10px] text-muted-foreground">Hedef: {session.targetOutputKg}kg</span>
                                                        <Button 
                                                            size="icon" variant="ghost" className="h-5 w-5 text-destructive hover:bg-destructive/10"
                                                            onClick={() => openReleaseDialog(session)}
                                                        >
                                                            <LogOut className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* SAĞ PANEL: İŞÇİ ÖZET LİSTESİ (1/3 Genişlik) */}
            <div className="lg:col-span-1 h-full overflow-hidden sticky top-0">
                <WorkerStatusList activeSessions={tableSessions} tables={tables} />
            </div>

        </div>

        <ReleaseSessionDialog 
            isOpen={!!sessionToRelease} 
            onClose={() => setSessionToRelease(null)} 
            session={sessionToRelease} 
        />
    </div>
  );
}