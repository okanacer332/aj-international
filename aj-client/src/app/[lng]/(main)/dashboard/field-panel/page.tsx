"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { apiFetchAuth } from "@/lib/api-auth";
import { OperationTable, TableSession } from "@/types/operation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Wifi, WifiOff, Search, X, MonitorPlay, RefreshCw, Users, Armchair, Activity, Lock } from "lucide-react";
import { format } from "date-fns";
import { useOperationSocket } from "@/hooks/use-socket";
import { useTranslation } from "react-i18next";

// BİLEŞENLER
import { TableMapView } from "./_components/table-map-view";
import { LiveTicker } from "./_components/live-ticker";
import { DashboardWidgets } from "./_components/dashboard-widgets";

// DTOlar
interface TableStats {
    tableId: string;
    remainingKg: number;
    totalInputKg: number;
}

interface DashboardStats {
    dailyTotalOutputKg: number;
    completedSessionsCount: number;
    activeWorkers: number;
}

interface DashboardEvent {
    type: string;
    params: Record<string, string>;
    timestamp: number;
}

export default function FieldPanelPage() {
  const { t } = useTranslation("common");
  
  const [tables, setTables] = useState<OperationTable[]>([]);
  const [tableSessions, setTableSessions] = useState<Record<string, TableSession[]>>({});
  const [tableStats, setTableStats] = useState<Record<string, TableStats>>({});
  
  // V5.1 State'ler
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({ dailyTotalOutputKg: 0, completedSessionsCount: 0, activeWorkers: 0 });
  const [recentEvents, setRecentEvents] = useState<DashboardEvent[]>([]); // Yapılandırılmış Event
  
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

        // Dashboard Stats
        const dashRes = await apiFetchAuth("/api/operation/dashboard/stats");
        if(dashRes.ok) {
            const dashData = await dashRes.json();
            setDashboardStats({
                dailyTotalOutputKg: dashData.dailyTotalOutputKg,
                completedSessionsCount: dashData.completedSessionsCount,
                activeWorkers: dashData.activeWorkers
            });
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // --- WEBSOCKET ---
  useOperationSocket(useCallback((msg) => {
      setIsSocketConnected(true);
      
      // Veri Güncellemesi
      if (["SESSION_UPDATE", "TABLES_REFRESH", "TICKET_UPDATE"].includes(msg.type)) {
          setLastEventTime(new Date());
          loadData();
      }

      // DASHBOARD EVENT (Ticker İçin)
      if (msg.type === "DASHBOARD_EVENT" && msg.payload) {
          const newEvent: DashboardEvent = {
              type: msg.payload.type,
              params: msg.payload.params,
              timestamp: Date.now()
          };
          setRecentEvents(prev => [newEvent, ...prev].slice(0, 20));
      }
      
      // GAMIFICATION (Toast)
      if (msg.type === "WORK_FINISHED" && msg.payload) {
          const { worker, amount } = msg.payload;
          // Buradaki metni de dil dosyasından alabilirsin ama toast içinde parametrik t() kullanımı biraz farklı olabilir.
          // Basitçe string birleştiriyoruz:
          toast.success(`🚀 ${worker}: +${amount} KG`, {
             style: { background: '#10b981', color: 'white', fontWeight: 'bold' }
          });
      }

  }, [loadData]));

  const stats = useMemo(() => {
      const totalTables = tables.length;
      const activeTables = Object.values(tableSessions).filter(s => s && s.length > 0).length;
      const activeWorkers = Object.values(tableSessions).flat().length;
      const occupancyRate = totalTables > 0 ? Math.round((activeTables / totalTables) * 100) : 0;
      return { totalTables, activeTables, activeWorkers, occupancyRate };
  }, [tables, tableSessions]);

  if (isLoading && tables.length === 0) return <div className="p-10 text-center">Yükleniyor...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh)] bg-slate-50/50 overflow-hidden relative pb-10">
        
        <div className="px-4 pt-4 pb-2 shrink-0">
            <Card className="bg-white border-l-4 border-l-primary shadow-sm">
                <div className="flex flex-col xl:flex-row items-center justify-between p-3 gap-4">
                    
                    <div className="flex items-center gap-6 w-full xl:w-auto">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg transition-colors duration-500 ${isSocketConnected ? 'bg-green-100 text-green-600 animate-pulse' : 'bg-red-100 text-red-600'}`}>
                                <MonitorPlay className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-slate-800">{t('operation.fieldPanel.title')}</h1>
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400">
                                    <Lock className="w-3 h-3" /> Patron Modu
                                </div>
                            </div>
                        </div>

                        {/* V5.1 WIDGETS */}
                        <div className="hidden md:block w-72">
                            <DashboardWidgets 
                                dailyTotalOutput={dashboardStats.dailyTotalOutputKg}
                                activeWorkers={stats.activeWorkers}
                                completedSessions={dashboardStats.completedSessionsCount}
                            />
                        </div>
                    </div>

                    {/* KPI */}
                    <div className="flex-1 flex justify-center gap-8 px-4">
                         <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold uppercase text-slate-400">{t('operation.fieldPanel.activeTables')}</span>
                            <span className="text-2xl font-black text-slate-700">{stats.activeTables}<span className="text-sm text-slate-300">/{stats.totalTables}</span></span>
                        </div>
                        <div className="flex flex-col items-center border-l border-dashed pl-8">
                            <span className="text-[10px] font-bold uppercase text-blue-500">{t('operation.fieldPanel.activeStaff')}</span>
                            <span className="text-2xl font-black text-blue-600">{stats.activeWorkers}</span>
                        </div>
                        <div className="flex flex-col items-center border-l border-dashed pl-8">
                            <span className="text-[10px] font-bold uppercase text-green-500">{t('operation.fieldPanel.occupancyRate')}</span>
                            <span className="text-2xl font-black text-green-600">%{stats.occupancyRate}</span>
                        </div>
                    </div>

                    {/* Arama */}
                    <div className="w-full xl:w-64">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder={t('operation.fieldPanel.searchPlaceholder')} 
                                className="pl-9 h-10 bg-slate-100 border-0 focus-visible:ring-1 focus-visible:ring-primary/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"><X className="h-3 w-3 text-slate-400"/></button>}
                        </div>
                    </div>
                </div>
            </Card>
        </div>

        <div className="flex-1 overflow-hidden px-4 pb-4">
            <TableMapView 
                tables={tables} 
                sessions={tableSessions} 
                stats={tableStats}
                searchQuery={searchQuery} 
            />
        </div>

        {/* TICKER */}
        <LiveTicker events={recentEvents} />
    </div>
  );
}