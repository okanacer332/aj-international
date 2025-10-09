import Image from "next/image";
import { LoginForm } from "../../_components/login-form";

// Logoları import ediyoruz
import ajLogo from "@/../public/logos/AJ-LOGO.png";
import acrtechLogo from "@/../public/logos/acrtech.png";

export default function LoginV1() {
  return (
    <div className="flex h-dvh flex-col lg:flex-row">
      {/* SOL TARAF - Marka ve Logolar (SADECE AJ INTERNATIONAL) */}
      {/* Mobil'de gizle (sadece AJ logosu üstte gözükecek), Desktop'ta 1/3 genişlikte kalsın */}
      <div className="bg-background hidden lg:block lg:w-1/3 border-r">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            {/* AJ International Logosu */}
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
      <div className="bg-background relative flex w-full flex-1 flex-col items-center justify-center p-8 lg:w-2/3">
        
        {/* MOBİL GÖRÜNÜM İÇİN: AJ International Logosu (Sadece Mobil) */}
        <div className="flex justify-center lg:hidden w-full pt-8 pb-4">
          <Image
            src={ajLogo}
            alt="AJ INTERNATIONAL GROUP Logo"
            width={150} // Mobil için daha küçük (önceki adımdan farklı bir stil)
            height={150}
            quality={100}
            priority
          />
        </div>

        {/* Giriş Formu Ortada */}
        <div className="w-full max-w-md my-auto">
          <LoginForm />
        </div>

        {/* acrtech Logosu Sayfanın En Altına Konumlandırılıyor (Tüm Ekranlarda) */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center pt-4">
            <p className="text-muted-foreground/80 text-xs mb-2">Powered By</p>
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