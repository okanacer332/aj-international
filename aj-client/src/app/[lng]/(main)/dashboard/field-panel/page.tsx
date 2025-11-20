"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { apiFetchAuth } from "@/lib/api-auth";
import { OperationTable, TableSession } from "@/types/operation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Wifi, WifiOff, Search, X, MonitorPlay, Activity, Users, Armchair, Percent } from "lucide-react";
import { format } from "date-fns";
import { useOperationSocket } from "@/hooks/use-socket";
import { useTranslation } from "react-i18next";

import { ReleaseSessionDialog } from "../operation/daily/_components/release-session-dialog";
import { TableMapView } from "./_components/table-map-view";
import { PersonnelPerformanceTable } from "./_components/personnel-performance-table";
import { BulkCloseDialog } from "../operation/daily/_components/bulk-close-dialog";

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
  
  const [sessionToRelease, setSessionToRelease] = useState<{ id: string; workerName: string; targetOutputKg: number } | null>(null);

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
          toast.info(t('operation.daily.messages.dataUpdated'), { duration: 1000 });
      }
  }, [loadData, t]));

  useEffect(() => { setIsSocketConnected(true); }, []);

  const stats = useMemo(() => {
      const totalTables = tables.length;
      const activeTables = Object.values(tableSessions).filter(s => s && s.length > 0).length;
      const activeWorkers = Object.values(tableSessions).flat().length;
      const occupancyRate = totalTables > 0 ? Math.round((activeTables / totalTables) * 100) : 0;
      return { totalTables, activeTables, activeWorkers, occupancyRate };
  }, [tables, tableSessions]);
  
  const openTablesCount = tables.filter(t => {
      const stat = tableStats[t.id];
      return stat && (stat.remainingKg !== 0 || stat.totalInputKg > 0);
  }).length;

  if (isLoading && tables.length === 0) return <div className="p-10 text-center">{t('operation.daily.messages.loading')}</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-4 space-y-6">
        
        {/* 1. HEADER & KPI (VIBRANT DESIGN) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            
            {/* BAŞLIK KARTI */}
            <Card className="col-span-1 lg:col-span-4 bg-card shadow-sm p-1 border-l-4 border-l-primary">
                <div className="flex flex-col xl:flex-row items-center justify-between p-3 gap-6">
                    
                    {/* SOL: Logo ve Durum */}
                    <div className="flex items-center gap-4 w-full xl:w-auto">
                        <div className={`p-3 rounded-xl shrink-0 transition-colors duration-500 ${isSocketConnected ? 'bg-green-100 text-green-600 animate-pulse' : 'bg-red-100 text-red-600'}`}>
                            <MonitorPlay className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('operation.fieldPanel.title')}</h1>
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

                    {/* ORTA: GLOWING KPI KARTLARI */}
                    <div className="flex-1 grid grid-cols-3 gap-4 w-full xl:w-auto">
                         <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-blue-50/50 border border-blue-100 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                            <div className="flex items-center gap-2 text-blue-700 mb-1">
                                <Armchair className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">{t('operation.fieldPanel.activeTables')}</span>
                            </div>
                            <span className="text-3xl font-black text-blue-900">{stats.activeTables}<span className="text-lg text-blue-400/60 font-medium">/{stats.totalTables}</span></span>
                        </div>

                        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-purple-50/50 border border-purple-100 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                            <div className="flex items-center gap-2 text-purple-700 mb-1">
                                <Users className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">{t('operation.fieldPanel.activeStaff')}</span>
                            </div>
                            <span className="text-3xl font-black text-purple-900">{stats.activeWorkers}</span>
                        </div>

                        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                            <div className="flex items-center gap-2 text-emerald-700 mb-1">
                                <Activity className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">{t('operation.fieldPanel.occupancyRate')}</span>
                            </div>
                            <span className="text-3xl font-black text-emerald-600">%{stats.occupancyRate}</span>
                        </div>
                    </div>

                    {/* SAĞ: Arama ve Butonlar */}
                    <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
                        <div className="relative w-full xl:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder={t('operation.fieldPanel.searchPlaceholder')} 
                                className="pl-9 h-11 bg-muted/30 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"><X className="h-3 w-3 text-muted-foreground"/></button>}
                        </div>
                        
                        <div className="pl-3 ml-1 border-l-2 border-border h-10 flex items-center">
                            <BulkCloseDialog totalOpenTables={openTablesCount} onSuccess={loadData} />
                        </div>
                    </div>
                </div>
            </Card>
        </div>

        {/* 2. İÇERİK */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            <div className="shrink-0">
                <TableMapView tables={tables} sessions={tableSessions} searchQuery={searchQuery} />
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
                <PersonnelPerformanceTable activeSessions={tableSessions} tables={tables} />
            </div>
        </div>

        <ReleaseSessionDialog isOpen={!!sessionToRelease} onClose={() => setSessionToRelease(null)} session={sessionToRelease} />
    </div>
  );
}