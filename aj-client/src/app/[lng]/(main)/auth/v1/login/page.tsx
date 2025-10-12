// src/app/[lng]/(main)/auth/v1/login/page.tsx
import Image from "next/image";
import { LoginForm } from "../../_components/login-form";
import { LanguageSwitcher } from "@/components/language-switcher"; // YENİ: Dil değiştirme bileşenini import ediyoruz

// Logoları import ediyoruz
import ajLogo from "@/../public/logos/AJ-LOGO.png";
import acrtechLogo from "@/../public/logos/acrtech.png";

// Sayfa bileşeni artık URL'den gelen 'lng' parametresini alıyor
export default function LoginV1({ params: { lng } }: { params: { lng: string } }) {
  return (
    <div className="flex h-dvh flex-col lg:flex-row">
      {/* SOL TARAF - Marka ve Logolar (SADECE AJ INTERNATIONAL) */}
      <div className="hidden border-r bg-background lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <Image
              src={ajLogo}
              alt="AJ INTERNATIONAL GROUP Logo"
              width={300}
              quality={100}
              priority
            />
          </div>
        </div>
      </div>

      {/* SAĞ TARAF - Giriş Formu (TÜM EKRANLARDA ORTALA) */}
      <div className="relative flex w-full flex-1 flex-col items-center justify-center bg-background p-8 lg:w-2/3">
        
        {/* YENİ EKLENEN KISIM: Dil Değiştirme Butonu */}
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>

        {/* MOBİL GÖRÜNÜM İÇİN: AJ International Logosu (Sadece Mobil) */}
        <div className="flex w-full justify-center pt-8 pb-4 lg:hidden">
          <Image
            src={ajLogo}
            alt="AJ INTERNATIONAL GROUP Logo"
            width={150}
            height={150}
            quality={100}
            priority
          />
        </div>

        {/* Giriş Formu Ortada */}
        <div className="my-auto w-full max-w-md">
          <LoginForm lng={lng} />
        </div>

        {/* acrtech Logosu Sayfanın En Altına Konumlandırılıyor (Tüm Ekranlarda) */}
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 flex-col items-center justify-center pt-4">
            <p className="text-xs text-muted-foreground/80 mb-2">Powered By</p>
            <Image
                src={acrtechLogo}
                alt="acrtech Logo"
                width={80} 
                height={80}
                className="h-auto"
            />
        </div>

      </div>
    </div>
  );
}