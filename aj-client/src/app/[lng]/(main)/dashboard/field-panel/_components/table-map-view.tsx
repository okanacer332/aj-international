"use client";

import { OperationTable, TableSession } from "@/types/operation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { API_BASE } from "@/lib/api-auth";
import { getInitials } from "@/lib/utils";
import { LiveDuration } from "../../operation/daily/_components/live-duration";
import { Box } from "lucide-react";
import { useTranslation } from "react-i18next"; // Düzeltildi

interface Props {
    tables: OperationTable[];
    sessions: Record<string, TableSession[]>;
    searchQuery: string;
}

export function TableMapView({ tables, sessions, searchQuery }: Props) {
    const { t } = useTranslation("common"); // Düzeltildi

    const filteredTables = tables.filter(t => 
        t.tableNo.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-card rounded-xl border shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Box className="w-5 h-5 text-primary"/> 
                {t('operation.fieldPanel.mapTitle')}
            </h3>
            
            <TooltipProvider delayDuration={0}>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
                    {filteredTables.map(table => {
                        const activeSessions = sessions[table.id] || [];
                        const isActive = activeSessions.length > 0;

                        return (
                            <Tooltip key={table.id}>
                                <TooltipTrigger asChild>
                                    <div 
                                        className={`
                                            relative h-16 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-200
                                            ${isActive 
                                                ? 'bg-green-500 border-green-600 text-white shadow-md shadow-green-200 hover:bg-green-600 hover:scale-105' 
                                                : 'bg-muted/30 border-border text-muted-foreground hover:border-primary/50 hover:bg-muted'}
                                        `}
                                    >
                                        <span className="text-xs font-bold uppercase tracking-wider mb-0.5">Masa</span>
                                        <span className="text-lg font-black leading-none">{table.tableNo.replace(/[^0-9]/g, '')}</span>
                                        
                                        {isActive && (
                                            <div className="absolute -top-2 -right-2 bg-white text-green-700 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm border border-green-100">
                                                {activeSessions.length}
                                            </div>
                                        )}
                                    </div>
                                </TooltipTrigger>
                                
                                <TooltipContent side="top" className="w-64 p-0 overflow-hidden border-green-200 shadow-xl">
                                    <div className="bg-green-600 text-white p-3 flex justify-between items-center">
                                        <span className="font-bold text-base">{table.tableNo}</span>
                                        <Badge variant="secondary" className="bg-white/20 text-white border-0 hover:bg-white/30">
                                            {activeSessions.length} {t('operation.daily.personnelCount')}
                                        </Badge>
                                    </div>
                                    <div className="p-3 bg-white space-y-3">
                                        {isActive ? (
                                            activeSessions.map(session => (
                                                <div key={session.sessionId} className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 border">
                                                        <AvatarImage src={session.avatarUrl ? `${API_BASE}${session.avatarUrl}` : undefined} />
                                                        <AvatarFallback className="text-[10px]">{getInitials(session.workerName)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 truncate">{session.workerName}</p>
                                                        <div className="text-xs text-slate-500 flex items-center gap-2">
                                                            <LiveDuration startTime={session.startTime} />
                                                            <span>•</span>
                                                            <span>{t('operation.daily.target')}: {session.targetOutputKg}kg</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center text-slate-400 text-sm py-2">
                                                {t('operation.fieldPanel.tableEmpty')}
                                            </div>
                                        )}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </div>
            </TooltipProvider>
            
            <div className="flex gap-4 mt-6 text-xs text-muted-foreground justify-end">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-sm"/> {t('operation.fieldPanel.legendActive')}</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-muted/30 border rounded-sm"/> {t('operation.fieldPanel.legendEmpty')}</div>
            </div>
        </div>
    );
}