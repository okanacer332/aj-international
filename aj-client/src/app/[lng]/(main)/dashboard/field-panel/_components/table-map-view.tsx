"use client";

import { OperationTable, TableSession } from "@/types/operation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { API_BASE } from "@/lib/api-auth";
import { getInitials } from "@/lib/utils";
import { LiveDuration } from "../../operation/daily/_components/live-duration";
// DÜZELTME: Armchair import edildi
import { Box, Users, Clock, Armchair } from "lucide-react"; 
import { useTranslation } from "react-i18next";

import { VisualTableCard } from "./visual-table-card";

interface Props {
    tables: OperationTable[];
    sessions: Record<string, TableSession[]>;
    stats: Record<string, { remainingKg: number; totalInputKg: number }>;
    searchQuery: string;
}

export function TableMapView({ tables, sessions, stats, searchQuery }: Props) {
    const { t } = useTranslation("common");

    const filteredTables = tables.filter(t => 
        t.tableNo.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        // DÜZELTME: h-full ve overflow-y-auto ile scroll bu div içinde olacak
        <div className="h-full overflow-y-auto p-6 bg-card">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-card z-20 pb-4 border-b">
                <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                    <Box className="w-5 h-5 text-primary"/> 
                    {t('operation.fieldPanel.mapTitle')}
                </h3>
                
                <div className="flex gap-4 text-[10px] font-medium text-muted-foreground">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"/> Yeni</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"/> Stabil</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-500 rounded-full"/> Kritik</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/> Mesai</div>
                </div>
            </div>
            
            {/* GRİD */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-x-6 gap-y-8 pb-10">
                {filteredTables.map(table => {
                    const activeSessions = sessions[table.id] || [];
                    const tableStat = stats[table.id];
                    const isActive = activeSessions.length > 0;

                    return (
                        <Popover key={table.id}>
                            <PopoverTrigger asChild>
                                <div className="cursor-pointer outline-none transform transition-transform active:scale-95">
                                    <VisualTableCard 
                                        tableNo={table.tableNo} 
                                        sessions={activeSessions} 
                                        stats={tableStat}
                                    />
                                </div>
                            </PopoverTrigger>
                            
                            <PopoverContent side="right" className="w-72 p-0 overflow-hidden border-slate-200 shadow-2xl rounded-xl z-50">
                                <div className="bg-slate-900 text-white p-3 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg">{table.tableNo}</span>
                                        {tableStat?.remainingKg > 0 && <Badge variant="secondary" className="bg-amber-500 text-white hover:bg-amber-600 border-0">{tableStat.remainingKg} KG</Badge>}
                                    </div>
                                    <Badge variant="outline" className="text-white/80 border-white/20">
                                        {activeSessions.length} {t('operation.daily.personnelCount')}
                                    </Badge>
                                </div>
                                <div className="p-3 bg-white dark:bg-slate-950 space-y-2 max-h-64 overflow-y-auto">
                                    {isActive ? (
                                        activeSessions.map(session => (
                                            <div key={session.sessionId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-muted">
                                                <Avatar className="h-9 w-9 border bg-white">
                                                    <AvatarImage src={session.avatarUrl ? `${API_BASE}${session.avatarUrl}` : undefined} />
                                                    <AvatarFallback className="text-xs font-bold">{getInitials(session.workerName)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-foreground truncate">{session.workerName}</p>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                                        <Clock className="w-3 h-3" />
                                                        <LiveDuration startTime={session.startTime} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                                            <Armchair className="w-8 h-8 opacity-20 mb-2" />
                                            <span className="text-sm">{t('operation.fieldPanel.tableEmpty')}</span>
                                        </div>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    );
                })}
            </div>
        </div>
    );
}