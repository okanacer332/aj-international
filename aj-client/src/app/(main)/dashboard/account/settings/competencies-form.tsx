"use client";

import { useState, useEffect } from "react";
import { User } from "@/types/user";
import { MasterProduct } from "@/types/master-product";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

type CompetenciesFormProps = {
  user: User;
};

// Puanlara karşılık gelen seviye adlarını ve renklerini tanımlayalım
const scoreLevels: Record<number, { label: string; className: string }> = {
    1: { label: "Bilgisi Yok", className: "bg-gray-400" },
    2: { label: "Tanımıyor", className: "bg-gray-500" },
    3: { label: "Acemi", className: "bg-red-500" },
    4: { label: "Teorik Bilgi", className: "bg-red-600" },
    5: { label: "Orta Düzey", className: "bg-yellow-500 text-black" },
    6: { label: "Gözetimle Uygular", className: "bg-yellow-600 text-black" },
    7: { label: "Deneyimli", className: "bg-green-500" },
    8: { label: "Bağımsız Uygular", className: "bg-green-600" },
    9: { label: "Uzman", className: "bg-blue-500" },
    10: { label: "Eğitmen", className: "bg-blue-600" },
};

const getScoreLabel = (score: number) => {
    return scoreLevels[score] || { label: "N/A", className: "bg-gray-400" };
};

export function CompetenciesForm({ user }: CompetenciesFormProps) {
  const [products, setProducts] = useState<MasterProduct[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
        toast.error("Veriler yüklenirken bir hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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

        toast.success("Yetkinlikleriniz başarıyla kaydedildi.");
    } catch (error) {
        toast.error("Kaydetme sırasında bir hata oluştu.");
    } finally {
        setIsSaving(false);
    }
  };

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
        <CardTitle>Ürün Yetkinliklerim</CardTitle>
        <CardDescription>
          Ürünler hakkındaki bilgi ve tecrübe seviyenizi 1-10 arasında belirterek yetkinliklerinizi güncelleyebilirsiniz.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {products.map(product => {
            const currentScore = scores[product.id] || 1;
            const scoreInfo = getScoreLabel(currentScore);
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
          Değişiklikleri Kaydet
        </Button>
      </CardFooter>
    </Card>
  );
}