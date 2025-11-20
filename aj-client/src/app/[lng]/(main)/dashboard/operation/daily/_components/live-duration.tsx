"use client";

import { useEffect, useState } from "react";
import { differenceInMinutes } from "date-fns";
import { Clock } from "lucide-react";

interface Props {
  startTime: string; // ISO String
}

export function LiveDuration({ startTime }: Props) {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    // İlk hesaplama
    const calculateDuration = () => {
      const start = new Date(startTime);
      const now = new Date();
      const diff = differenceInMinutes(now, start);
      setDuration(diff > 0 ? diff : 0);
    };

    calculateDuration();

    // Her 60 saniyede bir güncelle (Performans dostu)
    const interval = setInterval(calculateDuration, 60000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Renklendirme: 9 saati (540dk) geçerse kırmızı, yaklaşırsa sarı
  let colorClass = "text-muted-foreground";
  if (duration > 540) colorClass = "text-destructive font-bold animate-pulse";
  else if (duration > 480) colorClass = "text-yellow-600 font-semibold";

  return (
    <div className={`flex items-center gap-1 text-sm ${colorClass}`} title="Çalışılan Süre">
      <Clock className="w-3.5 h-3.5" />
      <span>{duration} dk</span>
    </div>
  );
}