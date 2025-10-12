// aj-client/src/app/[lng]/(main)/dashboard/default/_components/kpi-cards.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, Star, CheckCircle } from "lucide-react";

type KpiCardsProps = {
  summary: {
    totalEmployees: number;
    totalMasterProducts: number;
    averageCompetencyScore: number;
    competencyCompletionRate: number;
  };
  // DÜZELTME: t fonksiyonunu prop olarak tanımlıyoruz
  t: (key: string) => string; 
};

export function KpiCards({ summary, t }: KpiCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          {/* Çeviri Anahtarı: kpi.totalEmployees.title */}
          <CardTitle className="text-sm font-medium">{t('kpi.totalEmployees.title')}</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalEmployees}</div>
          {/* Çeviri Anahtarı: kpi.totalEmployees.desc */}
          <p className="text-xs text-muted-foreground">{t('kpi.totalEmployees.desc')}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          {/* Çeviri Anahtarı: kpi.totalMasterProducts.title */}
          <CardTitle className="text-sm font-medium">{t('kpi.totalMasterProducts.title')}</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalMasterProducts}</div>
          {/* Çeviri Anahtarı: kpi.totalMasterProducts.desc */}
          <p className="text-xs text-muted-foreground">{t('kpi.totalMasterProducts.desc')}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          {/* Çeviri Anahtarı: kpi.averageCompetencyScore.title */}
          <CardTitle className="text-sm font-medium">{t('kpi.averageCompetencyScore.title')}</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.averageCompetencyScore.toFixed(1)} / 10</div>
          {/* Çeviri Anahtarı: kpi.averageCompetencyScore.desc */}
          <p className="text-xs text-muted-foreground">{t('kpi.averageCompetencyScore.desc')}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          {/* Çeviri Anahtarı: kpi.competencyCompletionRate.title */}
          <CardTitle className="text-sm font-medium">{t('kpi.competencyCompletionRate.title')}</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">%{summary.competencyCompletionRate.toFixed(0)}</div>
          {/* Çeviri Anahtarı: kpi.competencyCompletionRate.desc */}
          <p className="text-xs text-muted-foreground">{t('kpi.competencyCompletionRate.desc')}</p>
        </CardContent>
      </Card>
    </div>
  );
}