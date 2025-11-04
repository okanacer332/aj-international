// aj-client/src/app/[lng]/(main)/dashboard/tasks/page.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "@/lib/i18n-client";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Camera, X, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription, // Eklendi
} from "@/components/ui/card";
import {
  Html5Qrcode,
  Html5QrcodeError,
  Html5QrcodeResult,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";
import { toast } from "sonner";
import { cn } from "@/lib/utils"; // cn (classnames) eklendi

// Test etmek istediğimiz formatları ve onlara ait state anahtarlarını tanımlıyoruz
// (Liste değişmedi)
const supportedFormats = [
  { key: "qr", label: "QR Code", format: Html5QrcodeSupportedFormats.QR_CODE },
  { key: "aztec", label: "Aztec", format: Html5QrcodeSupportedFormats.AZTEC },
  { key: "code39", label: "Code 39", format: Html5QrcodeSupportedFormats.CODE_39 },
  { key: "code93", label: "Code 93", format: Html5QrcodeSupportedFormats.CODE_93 },
  { key: "code128", label: "Code 128", format: Html5QrcodeSupportedFormats.CODE_128 },
  { key: "itf", label: "ITF (Interleaved 2 of 5)", format: Html5QrcodeSupportedFormats.ITF },
  { key: "ean13", label: "EAN-13", format: Html5QrcodeSupportedFormats.EAN_13 },
  { key: "ean8", label: "EAN-8", format: Html5QrcodeSupportedFormats.EAN_8 },
  { key: "pdf417", label: "PDF 417", format: Html5QrcodeSupportedFormats.PDF_417 },
  { key: "upca", label: "UPC-A", format: Html5QrcodeSupportedFormats.UPC_A },
  { key: "upce", label: "UPC-E", format: Html5QrcodeSupportedFormats.UPC_E },
  { key: "datamatrix", label: "Data Matrix", format: Html5QrcodeSupportedFormats.DATA_MATRIX },
  { key: "maxicode", label: "MaxiCode", format: Html5QrcodeSupportedFormats.MAXICODE },
  { key: "rss14", label: "RSS 14", format: Html5QrcodeSupportedFormats.RSS_14 },
  { key: "rssexpanded", label: "RSS Expanded", format: Html5QrcodeSupportedFormats.RSS_EXPANDED },
];

type ActiveScanConfig = typeof supportedFormats[0];

export default function Page() {
  const { lng } = useParams() as { lng: string };
  const { t, ready } = useTranslation(lng, "common");

  const [scanResults, setScanResults] = useState<Record<string, string>>({});
  const [activeScanConfig, setActiveScanConfig] =
    useState<ActiveScanConfig | null>(null);
  const [isScannerLoading, setIsScannerLoading] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "multi-format-qr-reader";

  // Tarayıcıyı durduran merkezi fonksiyon (Değişiklik yok)
  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      setIsScannerLoading(true);
      scannerRef.current
        .stop()
        .then(() => {
          console.log("Tarayıcı başarıyla durduruldu.");
        })
        .catch((err) => {
          console.error("Tarayıcı durdurulurken hata:", err);
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

  // Tarayıcıyı başlatan veya durduran ana mantık
  useEffect(() => {
    if (activeScanConfig && !scannerRef.current) {
      setIsScannerLoading(true);
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;

      // --- RESPONSIVE GÜNCELLEME (qrbox) ---
      // Barkodları (geniş) ve QR kodları (kare) okuyabilmek için
      // tarama alanını (qrbox) dinamik olarak ayarla.
      const qrboxFunction = (
        viewfinderWidth: number,
        viewfinderHeight: number
      ) => {
        // Genişliği %80 yap, min 200px, max 400px
        const boxWidth = Math.max(200, Math.min(400, viewfinderWidth * 0.8));
        // Yüksekliği, genişliğin %40'ı yap (barkodlar için ideal), min 80px
        const boxHeight = Math.max(80, boxWidth * 0.4);

        return {
          width: boxWidth,
          height: boxHeight,
        };
      };
      // --- GÜNCELLEME SONU ---

      const config = {
        fps: 10,
        qrbox: qrboxFunction, // Dinamik fonksiyonu kullan
        formatsToScan: [activeScanConfig.format],
      };

      const onScanSuccess = (
        decodedText: string,
        result: Html5QrcodeResult
      ) => {
        setScanResults((prev) => ({
          ...prev,
          [activeScanConfig.key]: decodedText,
        }));
        stopScanner();
        toast.success(`${activeScanConfig.label} okundu!`);
      };

      html5QrCode
        .start(
          { facingMode: "environment" },
          config,
          onScanSuccess,
          (error: Html5QrcodeError) => {}
        )
        .then(() => {
          setIsScannerLoading(false);
        })
        .catch((err) => {
          toast.error("Kamera başlatılamadı.", { description: err.message });
          stopScanner();
        });
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch((e) => {});
        scannerRef.current = null;
      }
    };
  }, [activeScanConfig, stopScanner]);

  const handleScanClick = (config: ActiveScanConfig) => {
    if (isScannerLoading || activeScanConfig) return;
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
          Farklı barkod formatlarını test edin.
        </p>
      </div>

      {/* --- RESPONSIVE GÜNCELLEME (Tarayıcı Alanı) --- */}
      {/* Bu bölüm artık mobil cihazlarda (md altı) ekranın üstüne yapışık değil,
        normal akışta görünür. Masaüstünde (md ve üzeri) ise 
        sağ üst köşeye yapışık (sticky) durur.
      */}
      {activeScanConfig && (
        <Card
          className={cn(
            "w-full", // Mobil: Tam genişlik
            "md:max-w-md md:mx-auto md:sticky md:top-4", // Masaüstü: max-w-md, ortalı ve yapışkan
            "z-10 shadow-lg border-primary border-2"
          )}
        >
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="flex justify-between items-center text-lg">
              <span className="text-primary">
                {activeScanConfig.label} Okunuyor...
              </span>
              <Button
                onClick={stopScanner}
                variant="ghost"
                size="icon"
                disabled={isScannerLoading && !!scannerRef.current}
              >
                {isScannerLoading && !!scannerRef.current ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Kamera görüntüsü burada oluşturulur */}
            <div
              id={scannerContainerId}
              style={{ width: "100%", minHeight: "150px" }}
            />

            {/* Yüklenme göstergesi (Değişiklik yok) */}
            {isScannerLoading && !scannerRef.current && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">
                  Kamera başlatılıyor...
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {/* --- GÜNCELLEME SONU --- */}


      {/* --- RESPONSIVE GÜNCELLEME (Format Listesi) --- */}
      {/* Listeyi daha iyi ayırmak için bir Card içine aldık. */}
      <Card>
        <CardHeader>
          <CardTitle>Desteklenen Formatlar</CardTitle>
          <CardDescription>
            Test etmek istediğiniz formatın kamera ikonuna tıklayın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Grid yapısı zaten responsive (md ve lg breakpoint'leri) */}
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
                    disabled={
                      isScannerLoading ||
                      (!!activeScanConfig &&
                        activeScanConfig.key !== format.key)
                    }
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* --- GÜNCELLEME SONU --- */}
    </div>
  );
}