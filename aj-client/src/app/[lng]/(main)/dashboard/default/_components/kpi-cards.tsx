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
};

export function KpiCards({ summary }: KpiCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Çalışan</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalEmployees}</div>
          <p className="text-xs text-muted-foreground">Aktif çalışan sayısı</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tanımlı Ana Ürün</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalMasterProducts}</div>
          <p className="text-xs text-muted-foreground">Sistemdeki ana ürün sayısı</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Genel Yetkinlik Ortalaması</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.averageCompetencyScore.toFixed(1)} / 10</div>
          <p className="text-xs text-muted-foreground">Tüm çalışanların ortalaması</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Değerlendirme Tamamlama</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">%{summary.competencyCompletionRate.toFixed(0)}</div>
          <p className="text-xs text-muted-foreground">Yetkinliğini değerlendirenler</p>
        </CardContent>
      </Card>
    </div>
  );
}