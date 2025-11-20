"use client";

import { OperationTable, TableSession } from "@/types/operation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Tooltip yerine Popover
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { API_BASE } from "@/lib/api-auth";
import { getInitials } from "@/lib/utils";
import { LiveDuration } from "../../operation/daily/_components/live-duration";
import { Box, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
    tables: OperationTable[];
    sessions: Record<string, TableSession[]>;
    searchQuery: string;
}

export function TableMapView({ tables, sessions, searchQuery }: Props) {
    const { t } = useTranslation("common");

    const filteredTables = tables.filter(t => 
        t.tableNo.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-card rounded-xl border shadow-sm p-4 md:p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Box className="w-5 h-5 text-primary"/> 
                {t('operation.fieldPanel.mapTitle')}
            </h3>
            
            {/* GRİD YAPISI */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-4">
                {filteredTables.map(table => {
                    const activeSessions = sessions[table.id] || [];
                    const isActive = activeSessions.length > 0;

                    return (
                        <Popover key={table.id}>
                            <PopoverTrigger asChild>
                                <button 
                                    className={`
                                        group relative h-20 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 outline-none
                                        ${isActive 
                                            ? 'bg-green-500 border-green-400 text-white shadow-[0_0_15px_-3px_rgba(34,197,94,0.6)] hover:shadow-[0_0_25px_-3px_rgba(34,197,94,0.8)] hover:scale-105 hover:-translate-y-1' 
                                            : 'bg-muted/20 border-border/60 text-muted-foreground hover:bg-muted/50 hover:border-primary/30'}
                                    `}
                                >
                                    {/* Masa "Mobilya" Havası İçin Üst Çizgi */}
                                    <div className={`absolute top-2 w-8 h-1 rounded-full opacity-30 ${isActive ? 'bg-white' : 'bg-foreground'}`} />

                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-2">Masa</span>
                                    <span className="text-2xl font-black leading-none tracking-tighter">
                                        {table.tableNo.replace(/[^0-9]/g, '')}
                                    </span>
                                    
                                    {/* İşçi Sayısı Badge'i (Daha belirgin) */}
                                    {isActive && (
                                        <div className="absolute -top-2 -right-2 bg-white text-green-700 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md border-2 border-green-50 z-10">
                                            {activeSessions.length}
                                        </div>
                                    )}

                                    {/* Aktiflik Halkası (Animasyonlu) */}
                                    {isActive && (
                                        <span className="absolute inset-0 rounded-xl ring-2 ring-green-400/50 animate-pulse"></span>
                                    )}
                                </button>
                            </PopoverTrigger>
                            
                            {/* DETAY BALONCUĞU (POPOVER) */}
                            <PopoverContent side="top" className="w-72 p-0 overflow-hidden border-green-200 shadow-2xl rounded-xl z-50">
                                <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-3 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Box className="w-4 h-4 opacity-80" />
                                        <span className="font-bold text-lg">{table.tableNo}</span>
                                    </div>
                                    <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
                                        {activeSessions.length} {t('operation.daily.personnelCount')}
                                    </Badge>
                                </div>
                                <div className="p-3 bg-white dark:bg-slate-950 space-y-3 max-h-64 overflow-y-auto">
                                    {isActive ? (
                                        activeSessions.map(session => (
                                            <div key={session.sessionId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                                <Avatar className="h-9 w-9 border-2 border-green-100">
                                                    <AvatarImage src={session.avatarUrl ? `${API_BASE}${session.avatarUrl}` : undefined} />
                                                    <AvatarFallback className="text-xs font-bold text-green-700 bg-green-50">{getInitials(session.workerName)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-foreground truncate">{session.workerName}</p>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                                        <LiveDuration startTime={session.startTime} />
                                                        <span>•</span>
                                                        <span>Hedef: {session.targetOutputKg}kg</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground gap-2">
                                            <Users className="w-8 h-8 opacity-20" />
                                            <span className="text-sm">{t('operation.fieldPanel.tableEmpty')}</span>
                                        </div>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    );
                })}
            </div>
            
            {/* Lejant */}
            <div className="flex gap-6 mt-8 text-xs font-medium text-muted-foreground justify-end border-t pt-4">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]"/> {t('operation.fieldPanel.legendActive')}</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-muted/50 border rounded-sm"/> {t('operation.fieldPanel.legendEmpty')}</div>
            </div>
        </div>
    );
}