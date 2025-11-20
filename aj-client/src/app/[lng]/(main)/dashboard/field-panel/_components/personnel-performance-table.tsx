"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableSession } from "@/types/operation";
import { API_BASE } from "@/lib/api-auth";
import { getInitials } from "@/lib/utils";
import { LiveDuration } from "../../operation/daily/_components/live-duration";
import { format } from "date-fns";
import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
    activeSessions: Record<string, TableSession[]>;
    tables: { id: string; tableNo: string }[];
}

export function PersonnelPerformanceTable({ activeSessions, tables }: Props) {
    const { t } = useTranslation("common");

    const data = Object.entries(activeSessions).flatMap(([tableId, sessions]) => {
        const table = tables.find(t => t.id === tableId);
        return sessions.map(session => ({
            ...session,
            tableNo: table?.tableNo || "Bilinmiyor",
            tableId: tableId
        }));
    });

    const sortedData = data.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    return (
        // DÜZELTME 1: min-h-[400px] eklendi. Kart asla 400px'den küçük olmayacak.
        <Card className="flex flex-col h-full min-h-[400px] border shadow-sm overflow-hidden">
            
            <CardHeader className="pb-3 border-b bg-muted/10 shrink-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary"/>
                        {t('operation.fieldPanel.listTitle')}
                    </CardTitle>
                    <Badge variant="outline">{sortedData.length} {t('operation.fieldPanel.activeStaff')}</Badge>
                </div>
            </CardHeader>

            {/* DÜZELTME 2: absolute yapı kaldırıldı. flex-1 ve overflow-auto yeterli. */}
            <div className="flex-1 overflow-auto p-0">
                <Table>
                    <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                        <TableRow className="bg-muted/5 hover:bg-muted/5">
                            <TableHead>Personel</TableHead>
                            <TableHead>Masa</TableHead>
                            <TableHead>{t('operation.daily.start')}</TableHead>
                            <TableHead>{t('operation.daily.duration')}</TableHead>
                            <TableHead className="text-right">{t('operation.daily.target')} (KG)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                    {t('operation.fieldPanel.noActiveWorker')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedData.map((row) => (
                                <TableRow key={row.sessionId} className="hover:bg-muted/5">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8 border">
                                                <AvatarImage src={row.avatarUrl ? `${API_BASE}${row.avatarUrl}` : undefined} />
                                                <AvatarFallback className="text-[10px]">{getInitials(row.workerName)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium text-sm">{row.workerName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-mono">{row.tableNo}</Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs">
                                        {format(new Date(row.startTime), "HH:mm")}
                                    </TableCell>
                                    <TableCell>
                                        <LiveDuration startTime={row.startTime} />
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-primary">
                                        {row.targetOutputKg}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}