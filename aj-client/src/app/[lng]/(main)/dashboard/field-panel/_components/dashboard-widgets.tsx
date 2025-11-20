"use client";

import { Card } from "@/components/ui/card";
import { Scale, Users, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
    dailyTotalOutput: number;
    activeWorkers: number;
    completedSessions: number;
}

export function DashboardWidgets({ dailyTotalOutput, activeWorkers, completedSessions }: Props) {
    const { t } = useTranslation("common");

    return (
        <div className="grid grid-cols-2 gap-3 h-full">
            
            {/* GÜNLÜK TOPLAM ÜRETİM */}
            <div className="bg-slate-900 rounded-lg p-3 border border-slate-700 relative overflow-hidden flex flex-col justify-between shadow-inner group">
                {/* Arka plan efekti */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                
                <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold uppercase tracking-wider relative z-10">
                    <Scale className="w-3 h-3" /> {t('operation.dashboard.dailyOutput')}
                </div>
                
                <div className="flex items-baseline gap-1 mt-1 relative z-10">
                    <span className="text-3xl font-black text-white drop-shadow-md tracking-tight">
                        {dailyTotalOutput.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">KG</span>
                </div>
                
                <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-emerald-500 w-full animate-pulse"></div>
                </div>
            </div>

            {/* AKTİF İŞ GÜCÜ / YOĞUNLUK */}
            <div className="bg-blue-950 rounded-lg p-3 border border-blue-800/50 relative overflow-hidden flex flex-col justify-between shadow-inner group">
                <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-blue-500/20 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
                
                <div className="flex items-center gap-2 text-blue-300 text-[10px] font-bold uppercase tracking-wider relative z-10">
                    <Users className="w-3 h-3" /> {t('operation.dashboard.activeWorkforce')}
                </div>
                
                <div className="text-3xl font-black text-white tracking-tight mt-1 relative z-10 flex items-center justify-between">
                    {activeWorkers}
                    <div className="text-right">
                        <div className="text-[9px] text-blue-400 font-normal uppercase">{t('operation.dashboard.completedSessions')}</div>
                        <div className="text-sm font-bold text-blue-200">{completedSessions}</div>
                    </div>
                </div>
                
                {/* Canlılık Göstergesi */}
                <div className="flex items-center gap-1 mt-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    <span className="text-[9px] text-blue-400/80">Online</span>
                </div>
            </div>
        </div>
    );
}