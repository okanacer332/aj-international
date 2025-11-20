"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { apiFetchAuth } from "@/lib/api-auth";
import { OperationTable, TableSession } from "@/types/operation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Wifi, WifiOff, Search, X, MonitorPlay, RefreshCw, Users, Armchair, Activity, Lock } from "lucide-react";
import { format } from "date-fns";
import { useOperationSocket } from "@/hooks/use-socket";
import { useTranslation } from "react-i18next";

// Bileşenler
import { TableMapView } from "./_components/table-map-view";
// PersonnelPerformanceTable importu kaldırıldı

interface TableStats {
    tableId: string;
    totalInputKg: number;
    totalOutputKg: number;
    remainingKg: number;
}

export default function FieldPanelPage() {
  const { t } = useTranslation("common");
  
  const [tables, setTables] = useState<OperationTable[]>([]);
  const [tableSessions, setTableSessions] = useState<Record<string, TableSession[]>>({});
  const [tableStats, setTableStats] = useState<Record<string, TableStats>>({});
  
  const [lastEventTime, setLastEventTime] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    try {
        const res = await apiFetchAuth("/api/operation/tables");
        const allTables: OperationTable[] = await res.json();
        const preSelectionTables = allTables.filter(t => t.unitType === "PRE_SELECTION");
        setTables(preSelectionTables);

        if (preSelectionTables.length > 0) {
            const sessionsMap: Record<string, TableSession[]> = {};
            const statsMap: Record<string, TableStats> = {};

            await Promise.all(preSelectionTables.map(async (t) => {
                const sRes = await apiFetchAuth(`/api/operation/tables/${t.id}/sessions`);
                sessionsMap[t.id] = await sRes.json();
                
                const statRes = await apiFetchAuth(`/api/operation/tables/${t.id}/stats`);
                statsMap[t.id] = await statRes.json();
            }));

            setTableSessions(sessionsMap);
            setTableStats(statsMap);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useOperationSocket(useCallback((msg) => {
      setIsSocketConnected(true);
      if (["SESSION_UPDATE", "TABLES_REFRESH", "TICKET_UPDATE"].includes(msg.type)) {
          setLastEventTime(new Date());
          loadData();
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

  if (isLoading && tables.length === 0) return <div className="p-10 text-center">{t('operation.daily.messages.loading')}</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-4 space-y-6">
        
        {/* 1. HEADER & KPI (SABİT) */}
        <div className="shrink-0">
             <Card className="col-span-1 lg:col-span-4 bg-card shadow-sm p-1 border-l-4 border-l-primary">
                <div className="flex flex-col xl:flex-row items-center justify-between p-3 gap-6">
                    
                    {/* SOL: Başlık ve Durum */}
                    <div className="flex items-center gap-4 w-full xl:w-auto">
                        <div className={`p-3 rounded-xl shrink-0 transition-colors duration-500 ${isSocketConnected ? 'bg-green-100 text-green-600 animate-pulse' : 'bg-red-100 text-red-600'}`}>
                            <MonitorPlay className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('operation.fieldPanel.title')}</h1>
                                <div className="bg-muted/50 px-2 py-0.5 rounded text-[10px] text-muted-foreground flex items-center gap-1 border">
                                    <Lock className="w-3 h-3" /> İzleme Modu
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium mt-1">
                                {isSocketConnected ? (
                                    <span className="text-green-600 flex items-center gap-1"><Wifi className="w-3 h-3"/> {t('operation.fieldPanel.liveConnection')}</span>
                                ) : (
                                    <span className="text-red-600 flex items-center gap-1"><WifiOff className="w-3 h-3"/> {t('operation.fieldPanel.offline')}</span>
                                )}
                                <span className="text-muted-foreground">• {format(lastEventTime, "HH:mm:ss")}</span>
                            </div>
                        </div>
                    </div>

                    {/* ORTA: KPI İstatistikleri */}
                    <div className="flex-1 grid grid-cols-3 gap-4 w-full xl:w-auto border-x px-6 mx-4 border-border/30">
                         <div className="flex flex-col items-center justify-center">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Armchair className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">{t('operation.fieldPanel.activeTables')}</span>
                            </div>
                            <span className="text-2xl font-black text-foreground">{stats.activeTables}<span className="text-base text-muted-foreground/40 font-medium">/{stats.totalTables}</span></span>
                        </div>

                        <div className="flex flex-col items-center justify-center border-x border-dashed border-border/50 px-4">
                            <div className="flex items-center gap-2 text-blue-600 mb-1">
                                <Users className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">{t('operation.fieldPanel.activeStaff')}</span>
                            </div>
                            <span className="text-3xl font-black text-blue-600">{stats.activeWorkers}</span>
                        </div>

                        <div className="flex flex-col items-center justify-center">
                            <div className="flex items-center gap-2 text-green-600 mb-1">
                                <Activity className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">{t('operation.fieldPanel.occupancyRate')}</span>
                            </div>
                            <span className="text-3xl font-black text-green-600">%{stats.occupancyRate}</span>
                        </div>
                    </div>

                    {/* SAĞ: Arama ve Yenileme */}
                    <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
                        <div className="relative w-full xl:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder={t('operation.fieldPanel.searchPlaceholder')} 
                                className="pl-9 h-10 bg-muted/30 border-0 focus-visible:ring-1"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"><X className="h-3 w-3 text-muted-foreground"/></button>}
                        </div>

                        <Button variant="ghost" size="icon" onClick={loadData} className="shrink-0 text-muted-foreground" title="Verileri Yenile">
                            <RefreshCw className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>

        {/* 2. İÇERİK: SADECE HARİTA (TÜM ALANI KAPLAR VE SCROLL EDİLİR) */}
        <div className="flex-1 overflow-y-auto min-h-0">
            <TableMapView 
                tables={tables} 
                sessions={tableSessions} 
                stats={tableStats}
                searchQuery={searchQuery} 
            />
        </div>
    </div>
  );
}