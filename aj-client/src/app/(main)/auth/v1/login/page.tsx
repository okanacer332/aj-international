import Image from "next/image";
import { LoginForm } from "../../_components/login-form";

// Logoları import ediyoruz
import ajLogo from "@/../public/logos/aj-international.jpeg";
import acrtechLogo from "@/../public/logos/acrtech.png";

export default function LoginV1() {
  return (
    <div className="flex h-dvh">
      {/* SOL TARAF - Marka ve Logolar */}
      {/* DEĞİŞİKLİK: Arka plan rengini bg-muted'dan bg-background'a çevirdik. */}
      <div className="bg-background hidden lg:block lg:w-1/3">
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
            
            {/* acrtech Logosu */}
            <div className="flex flex-col items-center justify-center pt-4">
               <p className="text-muted-foreground/80 text-xs mb-2">Powered By</p>
               <Image
                src={acrtechLogo}
                alt="acrtech Logo"
                width={120}
                quality={90}
               />
            </div>
          </div>
        </div>
      </div>

      {/* SAĞ TARAF - Giriş Formu */}
      <div className="bg-background flex w-full items-center justify-center p-8 lg:w-2/3">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}