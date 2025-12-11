import React from 'react';
import Link from "next/link";
import { LoginForm } from "../../_components/login-form"; // Import yolunu kontrol et
import { LanguageSwitcher } from "@/components/language-switcher";

// 1. Tip Tanımı: params'ı Promise olarak ayarlıyoruz
type PageProps = {
  params: Promise<{ lng: string }>;
};

export default async function LoginV2({ params }: PageProps) {
  // 2. Params Çözümleme: await ile lng'yi alıyoruz
  const { lng } = await params;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 lg:p-8">
      
      {/* Dil Değiştirici - Sağ Üst */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Hoş Geldiniz (v2)
          </h1>
          <p className="text-sm text-muted-foreground">
            Hesabınıza giriş yapmak için bilgilerinizi girin
          </p>
        </div>

        {/* 3. Düzeltme: lng prop'unu LoginForm'a geçiriyoruz */}
        <LoginForm lng={lng} />

        <p className="px-8 text-center text-sm text-muted-foreground">
          <Link
            href="/auth/register"
            className="hover:text-brand underline underline-offset-4"
          >
            Hesabınız yok mu? Kayıt Olun
          </Link>
        </p>
      </div>
    </div>
  );
}