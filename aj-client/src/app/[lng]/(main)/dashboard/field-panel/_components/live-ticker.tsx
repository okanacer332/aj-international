"use client";

import { Activity } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

// Backend'den gelen yapı
interface DashboardEvent {
    type: string;
    params: Record<string, string>;
    timestamp: number;
}

interface Props {
    events: DashboardEvent[];
}

export function LiveTicker({ events }: Props) {
    const { t } = useTranslation("common");
    
    // Demo veya Gerçek Veri
    const displayEvents = events.length > 0 ? events : [
        { type: 'INFO', params: { msg: "Fabrika otomasyon sistemi aktif..." }, timestamp: Date.now() },
        { type: 'INFO', params: { msg: "Veri akışı bekleniyor..." }, timestamp: Date.now() }
    ];

    // Mesajı render eden yardımcı fonksiyon
    const renderMessage = (event: any) => {
        if (event.type === 'INFO') return event.params.msg;
        return t(`operation.events.${event.type}`, event.params);
    };

    return (
        <div className="fixed bottom-0 left-0 w-full bg-slate-900 text-white h-10 flex items-center z-50 border-t border-slate-700 shadow-2xl">
            
            {/* SOL ETİKET (Sabit) */}
            <div className="bg-red-600 h-full px-4 flex items-center gap-2 font-bold text-xs uppercase tracking-widest shrink-0 z-20 shadow-[4px_0_10px_rgba(0,0,0,0.5)]">
                <Activity className="w-4 h-4 animate-pulse" />
                <span className="hidden sm:inline">{t('operation.dashboard.liveStream')}</span>
            </div>
            
            {/* KAYAN YAZI ALANI */}
            <div className="flex-1 bg-slate-950 h-full flex items-center overflow-hidden relative ticker-wrap">
                <div className="ticker-move px-4">
                    {/* Mesajları yan yana diz */}
                    {displayEvents.map((event, i) => (
                        <span key={`${event.timestamp}-${i}`} className="inline-flex items-center gap-2 text-sm font-mono text-slate-300 mx-8">
                            <span className={`w-2 h-2 rounded-full shadow-[0_0_8px] shrink-0 
                                ${event.type === 'WORK_FINISHED' ? 'bg-green-500 shadow-green-500' : 
                                  event.type === 'TICKET_ADDED' ? 'bg-blue-500 shadow-blue-500' : 
                                  event.type === 'INFO' ? 'bg-slate-500' : 'bg-amber-500 shadow-amber-500'}`}>
                            </span>
                            
                            {renderMessage(event)}
                            
                            <span className="text-slate-600 text-xs ml-1 opacity-70">
                                [{format(new Date(event.timestamp), "HH:mm")}]
                            </span>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}