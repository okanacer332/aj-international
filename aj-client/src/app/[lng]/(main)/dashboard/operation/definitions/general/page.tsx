"use client";
import { useState, useEffect } from "react";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function OperationConfigPage() {
  const [config, setConfig] = useState({ standardShiftDurationMinutes: 540, dailyStandardTargetKg: 900 });

  useEffect(() => {
    apiFetchAuth("/api/operation/config").then(res => res.json()).then(setConfig);
  }, []);

  const handleSave = async () => {
    await apiFetchAuth("/api/operation/config", { method: "POST", body: JSON.stringify(config) });
    toast.success("Ayarlar güncellendi.");
  };

  return (
    <div className="p-6 max-w-2xl">
        <Card>
            <CardHeader><CardTitle>Operasyon Parametreleri</CardTitle><CardDescription>Değişiklikler anlık yansır.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-2">
                    <Label>Vardiya Süresi (Dk)</Label>
                    <Input type="number" value={config.standardShiftDurationMinutes} onChange={(e) => setConfig({...config, standardShiftDurationMinutes: Number(e.target.value)})}/>
                </div>
                <div className="grid gap-2">
                    <Label>Günlük Hedef (KG)</Label>
                    <Input type="number" value={config.dailyStandardTargetKg} onChange={(e) => setConfig({...config, dailyStandardTargetKg: Number(e.target.value)})}/>
                </div>
                <Button onClick={handleSave}>Kaydet</Button>
            </CardContent>
        </Card>
    </div>
  );
}