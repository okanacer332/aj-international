"use client";

import { useEffect, useState } from "react";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth-store"; // Auth store'u import ediyoruz

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

export default function Page() {
  const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- ÇÖZÜM: AuthStore'dan kullanıcı durumunu alıyoruz ---
  const { user, isLoading: isAuthLoading } = useAuthStore();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        const res = await apiFetchAuth("/api/dashboard/summary");
        const data = await res.json();
        setSummaryData(data);
      } catch (error) {
        // Bu hata sadece gerçekten giriş yapılmışken bir sorun olursa gösterilecek.
        toast.error("Dashboard verileri yüklenirken bir hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };

    // --- ÇÖZÜM: Sadece Auth yüklemesi bittiyse ve kullanıcı varsa veri çek ---
    if (!isAuthLoading && user) {
      fetchSummary();
    } else if (!isAuthLoading && !user) {
      // Kullanıcı yoksa, loading'i kapat, boş ekran göster (zaten yönlendirilecek)
      setIsLoading(false);
    }

  }, [isAuthLoading, user]); // useEffect'i bu değerlere bağla

  // Auth yüklenirken veya summary yüklenirken skeleton göster
  if (isLoading || isAuthLoading) {
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

  // Eğer veri hala gelmediyse (ama yükleme bittiyse, örn. kullanıcı yoksa) boş bir fragment dön.
  if (!summaryData) {
    return <></>;
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