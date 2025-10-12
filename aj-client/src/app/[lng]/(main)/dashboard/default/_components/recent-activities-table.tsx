// aj-client/src/app/[lng]/(main)/dashboard/default/_components/recent-activities-table.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

type Activity = {
  id: string;
  timestamp: string;
  username: string;
  action: string;
  details: string;
};

// DÜZELTME: t fonksiyonunu prop olarak ekliyoruz
export function RecentActivitiesTable({ activities, t }: { activities: Activity[], t: (key: string) => string }) {
  return (
    <Card>
      <CardHeader>
        {/* Çeviri Anahtarı: activities.title */}
        <CardTitle>{t('activities.title')}</CardTitle>
        {/* Çeviri Anahtarı: activities.desc */}
        <CardDescription>{t('activities.desc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {/* Çeviri Anahtarları: activities.table.* */}
              <TableHead>{t('activities.table.user')}</TableHead>
              <TableHead>{t('activities.table.action')}</TableHead>
              <TableHead>{t('activities.table.detail')}</TableHead>
              <TableHead className="text-right">{t('activities.table.time')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell className="font-medium">{activity.username}</TableCell>
                <TableCell><Badge variant="outline">{activity.action}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{activity.details}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                    {/* date-fns/locale kullanıldığı için bu alan zaten dil desteğine sahip */}
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: tr })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}