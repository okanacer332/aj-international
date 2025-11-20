"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { API_BASE } from "@/lib/api-auth";
import { getInitials } from "@/lib/utils";
import { TableSession } from "@/types/operation";
import { differenceInMinutes } from "date-fns";
import { useTranslation } from "react-i18next";

interface Props {
    tableNo: string;
    sessions: TableSession[];
    // İstatistik objesini genişlettik, artık Toplam Giren verisine de ihtiyacımız var
    stats?: { 
        remainingKg: number; 
        totalInputKg: number; 
    };
}

export function VisualTableCard({ tableNo, sessions, stats }: Props) {
    const { t } = useTranslation("common");
    
    const remainingKg = stats?.remainingKg || 0;
    const totalInputKg = stats?.totalInputKg || 0;
    const isActive = sessions.length > 0;
    
    // --- ZAMAN HESAPLAMALARI (ÇEMBER) ---
    // Masadaki en eski oturumu baz al (Masa ne kadar süredir aktif?)
    const startTime = sessions.length > 0 
        ? sessions.reduce((min, s) => new Date(s.startTime) < new Date(min) ? s.startTime : min, sessions[0].startTime)
        : null;

    let durationMinutes = 0;
    if (startTime) {
        durationMinutes = differenceInMinutes(new Date(), new Date(startTime));
    }

    const shiftDuration = 540; // 9 Saat
    const timePercentage = Math.min((durationMinutes / shiftDuration) * 100, 100);
    
    let timeColor = "stroke-emerald-500";
    if (durationMinutes > 240) timeColor = "stroke-blue-500";
    if (durationMinutes > 480) timeColor = "stroke-amber-500";
    if (durationMinutes > 540) timeColor = "stroke-red-500 animate-pulse";

    // --- YÜK GÖRSELİ (SIVI - DİNAMİK ORAN) ---
    // Eğer hiç mal girmemişse 0, girdiyse (Kalan / Toplam Giren)
    // Örn: 1000 girdi, 200 kaldı -> %20 dolu görünür.
    // Örn: 1000 girdi, 1000 duruyor -> %100 dolu görünür.
    
    let fillRatio = 0;
    if (totalInputKg > 0) {
        fillRatio = Math.max(0, Math.min(remainingKg / totalInputKg, 1));
    }

    const loadHeight = `${fillRatio * 100}%`;
    
    // Rengi de orana göre değiştirelim (Azalınca yeşile dönsün, doluyken kırmızı/amber olsun)
    // %50'den fazlaysa Kırmızı/Amber (Yük var), %50'den azsa Yeşil/Mavi (Rahatlıyor)
    let liquidColor = "bg-emerald-100/60";
    let liquidTopColor = "bg-emerald-300/50";

    if (fillRatio > 0.4) {
        liquidColor = "bg-blue-100/60";
        liquidTopColor = "bg-blue-300/50";
    }
    if (fillRatio > 0.7) {
        liquidColor = "bg-amber-100/60";
        liquidTopColor = "bg-amber-300/50";
    }

    return (
        <div className="relative w-full aspect-square flex items-center justify-center group select-none">
            
            {/* 1. ZAMAN ÇEMBERİ (SVG RING - DIŞ) */}
            {isActive && (
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none transform scale-110 z-0" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-100" />
                    <circle 
                        cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="3" 
                        strokeDasharray="301.59" 
                        strokeDashoffset={301.59 - (301.59 * timePercentage) / 100}
                        strokeLinecap="round"
                        className={`${timeColor} transition-all duration-1000 ease-out`}
                    />
                </svg>
            )}

            {/* 2. MASA GÖVDESİ (İÇ) */}
            <div className={`
                relative w-full h-full rounded-full border-4 flex flex-col items-center justify-center overflow-hidden bg-white shadow-xl transition-all duration-300 z-10
                ${isActive 
                    ? 'border-slate-200 shadow-slate-300 hover:scale-105 hover:shadow-2xl' 
                    : 'border-slate-100 bg-slate-50/50 opacity-70'}
            `}>
                
                {/* SIVI DOLUM EFEKTİ (ARKA PLAN) */}
                {isActive && remainingKg > 0 && (
                    <div 
                        className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ease-in-out flex items-end justify-center z-0 ${liquidColor}`} 
                        style={{ height: loadHeight }}
                    >
                        {/* Sıvı Yüzeyi */}
                        <div className={`w-full h-1 blur-sm absolute top-0 ${liquidTopColor}`}></div>
                    </div>
                )}

                {/* İÇERİK (YAZILAR) */}
                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center py-2">
                    
                    {/* ÜST: Aktiflik Işığı */}
                    {isActive ? (
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse mb-1"></div>
                    ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-300 mb-1"></div>
                    )}

                    {/* ORTA: Masa No */}
                    <span className="text-3xl font-black text-slate-800 leading-none tracking-tighter drop-shadow-sm">
                        {tableNo.replace(/[^0-9]/g, '')}
                    </span>

                    {/* ALT: Bilgiler */}
                    {isActive ? (
                        <div className="flex flex-col items-center gap-0.5 mt-1">
                            {/* Süre */}
                            <div className="px-1.5 py-px bg-white/80 rounded text-[9px] font-mono font-bold text-slate-600 border border-slate-200 shadow-sm backdrop-blur-sm">
                                {Math.floor(durationMinutes / 60)}s {durationMinutes % 60}dk
                            </div>
                            
                            {/* KG (En altta) */}
                            {remainingKg > 0 && (
                                <div className="text-[10px] font-extrabold text-slate-700 drop-shadow-sm">
                                    {remainingKg.toLocaleString()} KG
                                </div>
                            )}
                        </div>
                    ) : (
                        <span className="text-[10px] text-slate-300 mt-1 font-medium uppercase tracking-widest">BOŞ</span>
                    )}
                </div>
            </div>

            {/* 3. PERSONEL (YÖRÜNGE) */}
            {isActive && (
                <>
                    {sessions[0] && <WorkerOrbit position="top-0 right-0" session={sessions[0]} />}
                    {sessions[1] && <WorkerOrbit position="top-0 left-0" session={sessions[1]} />}
                    {sessions[2] && <WorkerOrbit position="bottom-0 right-0" session={sessions[2]} />}
                    {sessions[3] && <WorkerOrbit position="bottom-0 left-0" session={sessions[3]} />}
                    
                    {sessions.length > 4 && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-white shadow-md z-30">
                            +{sessions.length - 4}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function WorkerOrbit({ position, session }: { position: string, session: TableSession }) {
    return (
        <div className={`absolute ${position} -m-1 z-20 transition-transform hover:scale-110 hover:z-30`}>
            <Avatar className="h-7 w-7 border-[1.5px] border-white shadow-sm ring-1 ring-slate-100">
                <AvatarImage src={session.avatarUrl ? `${API_BASE}${session.avatarUrl}` : undefined} />
                <AvatarFallback className="text-[8px] bg-blue-50 text-blue-700 font-bold">
                    {getInitials(session.workerName)}
                </AvatarFallback>
            </Avatar>
        </div>
    );
}