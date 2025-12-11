import Image from "next/image";
import { LoginForm } from "../../_components/login-form";
import { LanguageSwitcher } from "@/components/language-switcher";

// Next.js 15: params bir Promise'dir.
type PageProps = {
  params: Promise<{ lng: string }>;
};

export default async function LoginV1({ params }: PageProps) {
  // params'ı await ile çözümlüyoruz
  const { lng } = await params;

  return (
    <div className="flex h-dvh flex-col lg:flex-row">
      {/* SOL TARAF - Marka ve Logolar (Masaüstü) */}
      <div className="hidden border-r bg-background lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            {/* Logo Yolu: public/logos/AJ-LOGO.png */}
             
          </div>
        </div>
      </div>

      {/* SAĞ TARAF - Giriş Formu */}
      <div className="relative flex w-full flex-1 flex-col items-center justify-center bg-background p-8 lg:w-2/3">
        
        {/* Dil Değiştirici */}
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>

        {/* MOBİL LOGO (Sadece mobilde görünür) */}
        <div className="flex w-full justify-center pt-8 pb-4 lg:hidden">
           
        </div>

        {/* Giriş Formu */}
        <div className="my-auto w-full max-w-md">
          <LoginForm lng={lng} /> 
        </div>

        {/* ACRTECH Logosu (En altta) */}
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 flex-col items-center justify-center pt-4">
            <p className="text-xs text-muted-foreground/80 mb-2">Powered By AcrTech</p>
             
        </div>

      </div>
    </div>
  );
}