"use client";

import { useState, useEffect } from "react";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next"; // DÜZELTİLDİ (Eski import silindi)
import { useParams } from "next/navigation";

export default function OperationConfigPage() {
  const params = useParams();
  const { t } = useTranslation("common");
  const [config, setConfig] = useState({ standardShiftDurationMinutes: 540, dailyStandardTargetKg: 900 });

  useEffect(() => {
    apiFetchAuth("/api/operation/config").then(res => res.json()).then(setConfig);
  }, []);

  const handleSave = async () => {
    await apiFetchAuth("/api/operation/config", {
        method: "POST",
        body: JSON.stringify(config)
    });
    toast.success(t('operation.common.confirm'));
  };

  return (
    <div className="p-6 max-w-2xl">
        <Card>
            <CardHeader>
                <CardTitle>{t('operation.menu.shiftSettings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-2">
                    <Label>Vardiya ({t('operation.common.minute')})</Label>
                    <div className="flex items-center gap-2">
                        <Input type="number" value={config.standardShiftDurationMinutes} onChange={(e) => setConfig({...config, standardShiftDurationMinutes: Number(e.target.value)})}/>
                        <span className="text-sm text-muted-foreground">({(config.standardShiftDurationMinutes / 60).toFixed(1)} {t('operation.common.hour')})</span>
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label>{t('operation.daily.target')} ({t('operation.common.kg')})</Label>
                    <Input type="number" value={config.dailyStandardTargetKg} onChange={(e) => setConfig({...config, dailyStandardTargetKg: Number(e.target.value)})}/>
                </div>
                <Button onClick={handleSave}>{t('operation.common.confirm')}</Button>
            </CardContent>
        </Card>
    </div>
  );
}