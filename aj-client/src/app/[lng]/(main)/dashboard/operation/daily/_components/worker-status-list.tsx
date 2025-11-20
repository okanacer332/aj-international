"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TableSession } from "@/types/operation";
import { getInitials } from "@/lib/utils";
import { API_BASE } from "@/lib/api-auth";
import { LiveDuration } from "./live-duration";
import { TrendingUp, Clock, MapPin } from "lucide-react";

interface Props {
    activeSessions: Record<string, TableSession[]>;
    tables: { id: string; tableNo: string }[];
}

export function WorkerStatusList({ activeSessions, tables }: Props) {
    // Tüm aktif oturumları tek bir listeye dönüştür ve masayı eşleştir
    const allWorkers = Object.entries(activeSessions).flatMap(([tableId, sessions]) => {
        const tableName = tables.find(t => t.id === tableId)?.tableNo || "Bilinmiyor";
        return sessions.map(session => ({
            ...session,
            tableName
        }));
    });

    // En uzun süredir çalışan en üstte olsun
    const sortedWorkers = allWorkers.sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return (
        <Card className="h-full flex flex-col border-l-4 border-l-blue-500 shadow-md">
            <CardHeader className="pb-3 bg-muted/10 border-b">
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <span>Aktif Personel</span>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-sm px-3">
                        {sortedWorkers.length} Kişi
                    </Badge>
                </CardTitle>
            </CardHeader>
            
            <ScrollArea className="flex-1">
                <CardContent className="p-0">
                    {sortedWorkers.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            Henüz iş başı yapan personel yok.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {sortedWorkers.map((worker) => (
                                <div key={worker.sessionId} className="flex items-center p-3 hover:bg-accent/5 transition-colors">
                                    
                                    {/* Avatar */}
                                    <div className="relative mr-3">
                                        <Avatar className="h-10 w-10 border border-gray-200">
                                            <AvatarImage src={worker.avatarUrl ? `${API_BASE}${worker.avatarUrl}` : undefined} />
                                            <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-xs">
                                                {getInitials(worker.workerName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white animate-pulse"></div>
                                    </div>

                                    {/* İsim ve Masa */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate text-foreground">
                                            {worker.workerName}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                            <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded text-foreground/80">
                                                <MapPin className="w-3 h-3" /> {worker.tableName}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Süre ve Hedef */}
                                    <div className="text-right pl-2">
                                        <div className="flex justify-end">
                                            <LiveDuration startTime={worker.startTime} />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            Hedef: <span className="font-medium text-foreground">{worker.targetOutputKg} kg</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </ScrollArea>
        </Card>
    );
}