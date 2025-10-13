// aj-client/src/app/[lng]/(main)/dashboard/account/settings/competencies-form.tsx
"use client";

import { useState, useEffect } from "react";
import { User } from "@/types/user";
import { MasterProduct } from "@/types/master-product";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n-client"; 

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

type CompetenciesFormProps = {
  user: User;
  lng: string; 
};

// KRİTİK GÜNCELLEME: Puan seviyeleri artık bir fonksiyondan çekiliyor ve çeviri kullanıyor.
const getScoreLevels = (t: (key: string) => string): Record<number, { label: string; className: string }> => ({
    1: { label: t("competency.level.1"), className: "bg-gray-400" },
    2: { label: t("competency.level.2"), className: "bg-gray-500" },
    3: { label: t("competency.level.3"), className: "bg-red-500" },
    4: { label: t("competency.level.4"), className: "bg-red-600" },
    5: { label: t("competency.level.5"), className: "bg-yellow-500 text-black" },
    6: { label: t("competency.level.6"), className: "bg-yellow-600 text-black" },
    7: { label: t("competency.level.7"), className: "bg-green-500" },
    8: { label: t("competency.level.8"), className: "bg-green-600" },
    9: { label: t("competency.level.9"), className: "bg-blue-500" },
    10: { label: t("competency.level.10"), className: "bg-blue-600" },
});

// Artık getScoreLabel, t fonksiyonunu almalı
const getScoreLabel = (score: number, t: (key: string) => string) => {
    const scoreLevels = getScoreLevels(t);
    return scoreLevels[score] || { label: "N/A", className: "bg-gray-400" };
};

export function CompetenciesForm({ user, lng }: CompetenciesFormProps) {
  const [products, setProducts] = useState<MasterProduct[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // KRİTİK DÜZELTME: Hook'lar koşulsuz olarak en üstte çağrılmalı
  const { t, ready } = useTranslation(lng, 'common'); 
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Ürünleri ve mevcut puanları aynı anda çekelim
        const [productsRes, knowledgeRes] = await Promise.all([
          apiFetchAuth("/api/masterdata/products"),
          apiFetchAuth("/api/account/me/knowledge"),
        ]);

        const productsData: MasterProduct[] = await productsRes.json();
        const knowledgeData: { productId: string; score: number }[] = await knowledgeRes.json();

        // Sadece ana ürünleri (parentProductId'si null olanları) listeleyelim
        const parentProducts = productsData.filter(p => !p.parentProductId);
        setProducts(parentProducts);

        // Mevcut puanları state'e yükleyelim
        const initialScores: Record<string, number> = {};
        knowledgeData.forEach(item => {
          initialScores[item.productId] = item.score;
        });
        setScores(initialScores);

      } catch (error) {
        // ÇEVİRİ: Hata mesajı güncellendi
        toast.error(t("toast.dataLoadError"));
      } finally {
        setIsLoading(false);
      }
    };

    // Ready olunca verileri çek
    if (ready) {
        fetchData();
    }
  }, [ready, t]); // t'yi dependency array'e eklemek en iyi uygulamadır.

  const handleSliderChange = (productId: string, newScore: number) => {
    setScores(prevScores => ({
      ...prevScores,
      [productId]: newScore,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
        const payload = Object.entries(scores).map(([productId, score]) => ({
            productId,
            score,
        }));

        await apiFetchAuth("/api/account/me/knowledge", {
            method: "POST",
            body: JSON.stringify(payload),
        });

        // ÇEVİRİ: Başarı mesajı
        toast.success(t("toast.competencyUpdateSuccess"));
    } catch (error) {
        // ÇEVİRİ: Hata mesajı
        toast.error(t("toast.competencyUpdateError"));
    } finally {
        setIsSaving(false);
    }
  };

  // KRİTİK DÜZELTME: Erken çıkış (return) tüm Hook'lar çağrıldıktan sonra yapılmalı.
  if (!ready) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
    );
  }

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        {/* ÇEVİRİ: Başlık */}
        <CardTitle>{t('account.competency.title')}</CardTitle>
        {/* ÇEVİRİ: Açıklama */}
        <CardDescription>
          {t('account.competency.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {products.map(product => {
            const currentScore = scores[product.id] || 1;
            // KRİTİK DEĞİŞİKLİK: getScoreLabel'a t fonksiyonu geçirildi
            const scoreInfo = getScoreLabel(currentScore, t); 
            return (
                <div key={product.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="font-medium">{product.name}</div>
                    <div className="flex items-center gap-4 col-span-1 md:col-span-2">
                        <Slider
                            value={[currentScore]}
                            onValueChange={(value) => handleSliderChange(product.id, value[0])}
                            min={1}
                            max={10}
                            step={1}
                            className="flex-1"
                        />
                         <Badge className={`w-32 justify-center ${scoreInfo.className}`}>
                            {scoreInfo.label} ({currentScore})
                        </Badge>
                    </div>
                </div>
            )
        })}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {/* ÇEVİRİ: Buton Metni */}
          {t('account.form.saveChanges')}
        </Button>
      </CardFooter>
    </Card>
  );
}