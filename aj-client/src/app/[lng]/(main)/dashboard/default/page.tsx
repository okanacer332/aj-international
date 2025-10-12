// aj-client/src/app/[lng]/(main)/dashboard/default/page.tsx
"use client";

import { useEffect, useState } from "react";
// YENİ İMPORT: React.use'u kullanabilmek için React'ı import ediyoruz
import React from 'react'; 
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth-store"; 
import { useTranslation } from "@/lib/i18n-client"; 

import { KpiCards } from "./_components/kpi-cards";
import { CompetencyByProductChart } from "./_components/competency-by-product-chart";
import { CompetencyLevelChart } from "./_components/competency-level-chart";
import { HighlightsLists } from "./_components/highlights-lists";
import { RecentActivitiesTable } from "./_components/recent-activities-table";

interface DashboardSummary {
  totalEmployees: number;
  totalMasterProducts: number;
  averageCompetencyScore: number;
  competencyCompletionRate: number;
  competencyByProduct: { productName: string; averageScore: number }[];
  competencyLevelDistribution: { levelName: string; userCount: number }[];
  topCompetentUsers: { fullName: string; avatarUrl: string | null; averageScore: number }[];
  productsToImprove: { productName: string; averageScore: number }[];
  recentActivities: { id: string; timestamp: string; username: string; action: string; details: string; }[];
}

// Next.js'in önerdiği Promise tipini kullanacak şekilde prop tipini güncelliyoruz.
type PageProps = {
  params: Promise<{ lng: string }>;
};

export default function Page({ params }: PageProps) {
  // DÜZELTME: params Promise'ını React.use() ile çözüyoruz
  const { lng } = React.use(params);
    
  const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const { t, ready } = useTranslation(lng, 'common'); 

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        const res = await apiFetchAuth("/api/dashboard/summary");
        const data = await res.json();
        setSummaryData(data);
      } catch (error) {
        toast.error("Dashboard verileri yüklenirken bir hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading && user && ready) {
      fetchSummary();
    } else if (!isAuthLoading && !user) {
      setIsLoading(false);
    }
  }, [isAuthLoading, user, ready, lng]); // lng'yi de dependency'lere eklemek her zaman iyi bir pratiktir

  // Auth, summary VEYA i18n çevirileri yüklenirken skeleton göster
  if (isLoading || isAuthLoading || !ready) {
    return (
      <div className="flex flex-col gap-6">
        {/* KPI Skeletons */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        {/* Chart Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Skeleton className="h-96 lg:col-span-3" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
        {/* List & Table Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (!summaryData) {
    return <></>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Sayfa Başlıklarını Çevir */}
      <div> 
        <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.description')}</p>
      </div>

      {/* Alt bileşenlere t fonksiyonunu prop olarak iletiyoruz */}
      <KpiCards summary={summaryData} t={t} /> 
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <CompetencyByProductChart data={summaryData.competencyByProduct} t={t} />
        </div>
        <div className="lg:col-span-2">
          <CompetencyLevelChart data={summaryData.competencyLevelDistribution} t={t} />
        </div>
      </div>
      <HighlightsLists 
        topUsers={summaryData.topCompetentUsers}
        productsToImprove={summaryData.productsToImprove}
        t={t}
      />
      <RecentActivitiesTable activities={summaryData.recentActivities} t={t} />
    </div>
  );
}