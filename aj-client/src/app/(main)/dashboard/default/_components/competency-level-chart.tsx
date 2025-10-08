"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type ChartData = {
  levelName: string;
  userCount: number;
};

const COLORS: { [key: string]: string } = {
    'Acemi': '#ef4444',
    'Orta Düzey': '#f59e0b',
    'Deneyimli': '#22c55e',
    'Uzman': '#3b82f6',
};

export function CompetencyLevelChart({ data }: { data: ChartData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Genel Yetkinlik Dağılımı</CardTitle>
        <CardDescription>Çalışanların tecrübe seviyelerine göre dağılımı.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="userCount"
              nameKey="levelName"
              label={({ levelName, userCount }) => `${levelName}: ${userCount}`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.levelName] || '#8884d8'} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value} kişi`, name]}/>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}