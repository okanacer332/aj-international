"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "@/lib/i18n-client";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Camera, X, Loader2, TriangleAlert } from "lucide-react"; // İkon eklendi
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Alert bileşeni eklendi

const supportedFormats = [
  { key: "qr", label: "QR Code", format: Html5QrcodeSupportedFormats.QR_CODE },
  { key: "code128", label: "Code 128", format: Html5QrcodeSupportedFormats.CODE_128 },
  { key: "ean13", label: "EAN-13", format: Html5QrcodeSupportedFormats.EAN_13 },
  { key: "all", label: "Tüm Formatlar", format: undefined }, // Hepsi için
];

type ActiveScanConfig = typeof supportedFormats[0];

export default function Page() {
  const { lng } = useParams() as { lng: string };
  const { t, ready } = useTranslation(lng, "common");

  const [scanResults, setScanResults] = useState<Record<string, string>>({});
  const [activeScanConfig, setActiveScanConfig] = useState<ActiveScanConfig | null>(null);
  const [isScannerLoading, setIsScannerLoading] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null); // Hata state'i
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "multi-format-qr-reader";

  // Güvenli Bağlam Kontrolü
  const isSecureContext = typeof window !== "undefined" && (window.isSecureContext || window.location.hostname === "localhost");

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      setIsScannerLoading(true);
      scannerRef.current
        .stop()
        .then(() => {
          console.log("Tarayıcı durduruldu.");
        })
        .catch((err) => {
          console.warn("Durdurma uyarısı:", err);
        })
        .finally(() => {
          setIsScannerLoading(false);
          setActiveScanConfig(null);
          scannerRef.current = null;
        });
    } else {
      setIsScannerLoading(false);
      setActiveScanConfig(null);
    }
  }, []);

  useEffect(() => {
    if (activeScanConfig && !scannerRef.current) {
      // Önce HTTPS kontrolü yapalım
      if (!isSecureContext) {
        setPermissionError("Kamera sadece HTTPS veya localhost üzerinden çalışır.");
        toast.error("Güvenli bağlantı gerekli (HTTPS).");
        setActiveScanConfig(null);
        return;
      }

      setPermissionError(null);
      setIsScannerLoading(true);

      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;

      const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdgePercentage = 0.70;
        const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
        const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
        return {
          width: qrboxSize,
          height: Math.floor(qrboxSize / 1.5), // Barkodlar için geniş dikdörtgen
        };
      };

      const config = {
        fps: 10,
        qrbox: qrboxFunction,
        aspectRatio: 1.0,
        formatsToScan: activeScanConfig.format ? [activeScanConfig.format] : undefined,
      };

      html5QrCode
        .start(
          { facingMode: "environment" }, // Arka kamera
          config,
          (decodedText) => {
            setScanResults((prev) => ({
              ...prev,
              [activeScanConfig.key]: decodedText,
            }));
            stopScanner();
            toast.success(`${activeScanConfig.label} okundu: ${decodedText}`);
            
            // Başarılı okumada ses çal (Opsiyonel UX)
            // const audio = new Audio('/beep.mp3'); audio.play().catch(e=>{});
          },
          (errorMessage) => {
            // Okuma hatası (Kamera açık ama kod bulamadı) - Loglamaya gerek yok
          }
        )
        .then(() => {
          setIsScannerLoading(false);
        })
        .catch((err) => {
          setIsScannerLoading(false);
          let errorMsg = "Kamera başlatılamadı.";
          
          if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
            errorMsg = "Kamera izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.";
          } else if (err?.name === "NotFoundError") {
            errorMsg = "Kamera cihazı bulunamadı.";
          } else if (err?.name === "NotReadableError") {
            errorMsg = "Kamera şu anda başka bir uygulama tarafından kullanılıyor.";
          } else if (!isSecureContext) {
             errorMsg = "Tarayıcı güvenlik kısıtlaması: Lütfen HTTPS kullanın.";
          }

          setPermissionError(errorMsg);
          toast.error("Hata", { description: errorMsg });
          // stopScanner çağırmıyoruz ki kullanıcı hatayı görsün, manuel kapatsın
        });
    }

    return () => {
      // Cleanup
    };
  }, [activeScanConfig, stopScanner, isSecureContext]);

  const handleScanClick = (config: ActiveScanConfig) => {
    if (isScannerLoading || activeScanConfig) return;
    setPermissionError(null);
    setActiveScanConfig(config);
  };

  const handleInputChange = (key: string, value: string) => {
    setScanResults((prev) => ({ ...prev, [key]: value }));
  };

  if (!ready) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-2 text-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("operation.taskManagement.title")} (Barkod Test)
        </h1>
        <p className="text-muted-foreground">
          Kamera izni gerektirir. Sadece HTTPS veya Localhost üzerinde çalışır.
        </p>
      </div>

      {/* GÜVENLİK UYARISI */}
      {!isSecureContext && (
         <Alert variant="destructive">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>Güvenli Bağlantı Yok</AlertTitle>
            <AlertDescription>
              Kamerayı kullanabilmek için sayfanın <strong>HTTPS</strong> veya <strong>localhost</strong> üzerinden açılması gerekir. Şu anki bağlantı güvenli değil.
            </AlertDescription>
         </Alert>
      )}

      {/* TARAYICI ALANI */}
      {activeScanConfig && (
        <Card className={cn(
            "w-full md:max-w-md md:mx-auto md:sticky md:top-4 z-10 shadow-lg border-primary border-2"
          )}>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="flex justify-between items-center text-lg">
              <span className="text-primary">
                {activeScanConfig.label} Aranıyor...
              </span>
              <Button
                onClick={stopScanner}
                variant="ghost"
                size="icon"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Hata Mesajı Gösterimi */}
            {permissionError ? (
               <div className="p-4 text-center text-destructive bg-destructive/10 rounded-md">
                 <p className="font-semibold">Erişim Hatası</p>
                 <p className="text-sm">{permissionError}</p>
                 <Button variant="outline" size="sm" className="mt-2" onClick={stopScanner}>Kapat</Button>
               </div>
            ) : (
                <>
                    <div
                      id={scannerContainerId}
                      className="overflow-hidden rounded-md bg-black"
                      style={{ width: "100%", minHeight: "250px" }}
                    />
                    {isScannerLoading && (
                      <div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
                         <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Kamera açılıyor...
                      </div>
                    )}
                </>
            )}
          </CardContent>
        </Card>
      )}

      {/* FORMAT LİSTESİ */}
      <Card>
        <CardHeader>
          <CardTitle>Desteklenen Formatlar</CardTitle>
          <CardDescription>
            Test etmek istediğiniz formatın kamera ikonuna tıklayın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supportedFormats.map((format) => (
              <div key={format.key} className="space-y-2">
                <label className="text-sm font-medium">{format.label}</label>
                <div className="flex items-center gap-2">
                  <Input
                    value={scanResults[format.key] || ""}
                    onChange={(e) =>
                      handleInputChange(format.key, e.target.value)
                    }
                    placeholder={`${format.label} verisi...`}
                  />
                  <Button
                    onClick={() => handleScanClick(format)}
                    variant="outline"
                    size="icon"
                    disabled={!!activeScanConfig}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}