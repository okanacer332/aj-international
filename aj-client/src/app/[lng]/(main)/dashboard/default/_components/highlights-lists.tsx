// aj-client/src/app/[lng]/(main)/dashboard/default/_components/highlights-lists.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { API_BASE } from "@/lib/api";
import { ArrowDown, ArrowUp } from "lucide-react";

type TopUser = {
  fullName: string;
  avatarUrl: string | null;
  averageScore: number;
};

type ProductToImprove = {
  productName: string;
  averageScore: number;
};

type HighlightsListsProps = {
  topUsers: TopUser[];
  productsToImprove: ProductToImprove[];
  // DÜZELTME: t fonksiyonunu prop olarak ekliyoruz
  t: (key: string) => string; 
};

export function HighlightsLists({ topUsers, productsToImprove, t }: HighlightsListsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ArrowUp className="mr-2 h-5 w-5 text-green-500" /> 
            {/* Çeviri Anahtarı: highlights.topUsers.title */}
            {t('highlights.topUsers.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topUsers.map((user, index) => (
              <div key={index} className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.avatarUrl ? `${API_BASE}${user.avatarUrl}` : undefined} alt={user.fullName} />
                  <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">{user.fullName}</p>
                </div>
                <div className="ml-auto font-medium">{user.averageScore.toFixed(1)} / 10</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
             <ArrowDown className="mr-2 h-5 w-5 text-red-500" /> 
             {/* Çeviri Anahtarı: highlights.productsToImprove.title */}
             {t('highlights.productsToImprove.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
           <div className="space-y-4">
            {productsToImprove.map((product, index) => (
              <div key={index} className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{product.productName}</p>
                </div>
                <div className="ml-auto font-medium">{product.averageScore.toFixed(1)} / 10</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}