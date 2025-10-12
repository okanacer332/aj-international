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

export function RecentActivitiesTable({ activities }: { activities: Activity[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Son Sistem Aktiviteleri</CardTitle>
        <CardDescription>Sistemde gerçekleşen son 5 önemli olay.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kullanıcı</TableHead>
              <TableHead>Eylem</TableHead>
              <TableHead>Detay</TableHead>
              <TableHead className="text-right">Zaman</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell className="font-medium">{activity.username}</TableCell>
                <TableCell><Badge variant="outline">{activity.action}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{activity.details}</TableCell>
                <TableCell className="text-right text-muted-foreground">
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