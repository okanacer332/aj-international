"use client";

import { useEffect, useState } from "react";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// Yeni oluşturduğumuz tüm component'leri import edelim
import { KpiCards } from "./_components/kpi-cards";
import { CompetencyByProductChart } from "./_components/competency-by-product-chart";
import { CompetencyLevelChart } from "./_components/competency-level-chart";
import { HighlightsLists } from "./_components/highlights-lists";
import { RecentActivitiesTable } from "./_components/recent-activities-table";

// Backend'den gelecek verinin tam tip tanımı
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

export default function Page() {
  const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    fetchSummary();
  }, []);

  if (isLoading || !summaryData) {
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

  return (
    <div className="flex flex-col gap-6">
      <KpiCards summary={summaryData} />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <CompetencyByProductChart data={summaryData.competencyByProduct} />
        </div>
        <div className="lg:col-span-2">
          <CompetencyLevelChart data={summaryData.competencyLevelDistribution} />
        </div>
      </div>
      <HighlightsLists 
        topUsers={summaryData.topCompetentUsers}
        productsToImprove={summaryData.productsToImprove}
      />
      <RecentActivitiesTable activities={summaryData.recentActivities} />
    </div>
  );
}