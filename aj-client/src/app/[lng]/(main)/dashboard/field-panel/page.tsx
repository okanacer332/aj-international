"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { apiFetchAuth } from "@/lib/api-auth";
import { OperationTable, TableSession } from "@/types/operation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Wifi, WifiOff, Search, X, MonitorPlay, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useOperationSocket } from "@/hooks/use-socket";
import { useTranslation } from "react-i18next"; // Düzeltildi

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
  const { t } = useTranslation("common"); // Düzeltildi

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
        console.error("Data load error", e);
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
          toast.info(t('operation.daily.messages.dataUpdated'), { duration: 1000, position: 'bottom-right' });
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

  if (isLoading && tables.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-screen text-muted-foreground animate-pulse bg-muted/10">
            <RefreshCw className="w-12 h-12 animate-spin mb-4 text-primary" />
            <span className="text-xl font-medium">{t('operation.daily.messages.loading')}</span>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-4 space-y-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Card className="col-span-1 lg:col-span-4 bg-card shadow-sm p-1">
                <div className="flex flex-col md:flex-row items-center justify-between p-3">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-lg">
                            <MonitorPlay className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('operation.fieldPanel.title')}</h1>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className={`flex items-center gap-1 font-medium ${isSocketConnected ? 'text-green-600' : 'text-red-500'}`}>
                                    {isSocketConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                                    {isSocketConnected ? t('operation.fieldPanel.liveConnection') : t('operation.fieldPanel.offline')}
                                </span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"/>
                                <span>{t('operation.fieldPanel.lastUpdate')}: {format(lastEventTime, "HH:mm:ss")}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-4 md:mt-0">
                         <div className="flex flex-col items-center px-4 border-r">
                            <span className="text-xs text-muted-foreground uppercase font-semibold">{t('operation.fieldPanel.activeTables')}</span>
                            <span className="text-2xl font-bold">{stats.activeTables}<span className="text-muted-foreground/40 text-lg">/{stats.totalTables}</span></span>
                        </div>
                        <div className="flex flex-col items-center px-4 border-r">
                            <span className="text-xs text-muted-foreground uppercase font-semibold">{t('operation.fieldPanel.activeStaff')}</span>
                            <span className="text-2xl font-bold text-blue-600">{stats.activeWorkers}</span>
                        </div>
                        <div className="flex flex-col items-center px-4">
                            <span className="text-xs text-muted-foreground uppercase font-semibold">{t('operation.fieldPanel.occupancyRate')}</span>
                            <span className="text-2xl font-bold text-green-600">%{stats.occupancyRate}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder={t('operation.fieldPanel.searchPlaceholder')} 
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
                        <div className="pl-2 border-l">
                            <BulkCloseDialog totalOpenTables={openTablesCount} onSuccess={loadData} />
                        </div>
                    </div>
                </div>
            </Card>
        </div>

        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            <div className="shrink-0">
                <TableMapView 
                    tables={tables} 
                    sessions={tableSessions} 
                    searchQuery={searchQuery}
                />
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                <PersonnelPerformanceTable 
                    activeSessions={tableSessions} 
                    tables={tables} 
                />
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