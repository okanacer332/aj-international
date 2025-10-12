// aj-client/src/app/[lng]/(main)/dashboard/default/_components/competency-level-chart.tsx
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

// DÜZELTME: t fonksiyonunu prop olarak ekliyoruz
export function CompetencyLevelChart({ data, t }: { data: ChartData[], t: (key: string) => string }) {
  return (
    <Card>
      <CardHeader>
        {/* Çeviri Anahtarı: chart.levelDistribution.title */}
        <CardTitle>{t('chart.levelDistribution.title')}</CardTitle>
        {/* Çeviri Anahtarı: chart.levelDistribution.desc */}
        <CardDescription>{t('chart.levelDistribution.desc')}</CardDescription>
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
              // Burada seviye adları (Acemi, Uzman vb.) veritabanından geldiği için
              // bu alanları çevirmek için ekstra bir harita kullanmanız veya backend'i
              // çeviri key'i gönderecek şekilde güncellemeniz gerekir.
              // Şimdilik sadece değerleri gösteriyoruz.
              label={({ levelName, userCount }) => `${levelName}: ${userCount}`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.levelName] || '#8884d8'} />
              ))}
            </Pie>
            {/* Tooltip içindeki formatlama: "X kişi" */}
            <Tooltip formatter={(value, name) => [`${value} ${t('kisi')}`, name]}/>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}