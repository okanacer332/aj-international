// aj-client/src/app/[lng]/(main)/dashboard/default/_components/competency-by-product-chart.tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type ChartData = {
  productName: string;
  averageScore: number;
};

const getBarColor = (score: number) => {
    if (score < 4) return "#ef4444"; // red-500
    if (score < 7) return "#f59e0b"; // amber-500
    return "#22c55e"; // green-500
};

// DÜZELTME: t fonksiyonunu prop olarak ekliyoruz
export function CompetencyByProductChart({ data, t }: { data: ChartData[], t: (key: string) => string }) {
  return (
    <Card>
      <CardHeader>
        {/* Çeviri Anahtarı: chart.productCompetency.title */}
        <CardTitle>{t('chart.productCompetency.title')}</CardTitle>
        {/* Çeviri Anahtarı: chart.productCompetency.desc */}
        <CardDescription>{t('chart.productCompetency.desc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis type="number" domain={[0, 10]} />
            <YAxis type="category" dataKey="productName" width={120} tick={{ fontSize: 12 }} />
            <Tooltip cursor={{ fill: 'rgba(240, 240, 240, 0.3)' }} formatter={(value: number) => value.toFixed(1)} />
            <Bar dataKey="averageScore" barSize={20}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.averageScore)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}