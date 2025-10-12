// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import acceptLanguage from 'accept-language';
import { fallbackLng, supportedLngs } from './lib/i18n';

acceptLanguage.languages(supportedLngs);

export const config = {
  // Middleware'in hangi yollarda çalışacağını belirtir.
  // API, Next.js'in statik dosyaları ve imajları hariç tüm yollarda çalışmasını sağlıyoruz.
  matcher: ['/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js).*)'],
};

const cookieName = 'i18next';

export function middleware(req: NextRequest) {
  // --- 1. Dil Tespiti ---
  let lng: string | undefined | null;
  if (req.cookies.has(cookieName)) {
    lng = acceptLanguage.get(req.cookies.get(cookieName)?.value);
  }
  if (!lng) {
    lng = acceptLanguage.get(req.headers.get('Accept-Language'));
  }
  if (!lng) {
    lng = fallbackLng;
  }

  const { pathname } = req.nextUrl;

  // --- 2. Dil Yönlendirmesi ---
  // URL'de zaten desteklenen bir dil ön eki yoksa yönlendirme yap.
  if (
    !supportedLngs.some(loc => pathname.startsWith(`/${loc}`)) &&
    !pathname.startsWith('/_next')
  ) {
    const newUrl = new URL(`/${lng}${pathname}${req.nextUrl.search}`, req.url);
    return NextResponse.redirect(newUrl);
  }

  // --- Dil Çerezini Ayarla ---
  // Eğer kullanıcının referans (geldiği sayfa) URL'sinde bir dil varsa
  // bu dili çereze kaydet. Bu, dil değiştirildiğinde seçimi hatırlar.
  const response = NextResponse.next();
  if (req.headers.has('referer')) {
    const refererUrl = new URL(req.headers.get('referer')!);
    const lngInReferer = supportedLngs.find((l) => refererUrl.pathname.startsWith(`/${l}`));
    if (lngInReferer) {
      response.cookies.set(cookieName, lngInReferer);
    }
  }

  // --- 3. Kimlik Doğrulama (Auth) Mantığı ---
  const isLoggedIn = !!req.cookies.get("auth-token");
  const currentLng = pathname.split('/')[1]; // Mevcut dil kodunu URL'den al (örn: 'tr')

  // Giriş yapılmamış ve dashboard'a erişmeye çalışıyorsa
  if (!isLoggedIn && pathname.startsWith(`/${currentLng}/dashboard`)) {
    return NextResponse.redirect(new URL(`/${currentLng}/auth/v1/login`, req.url));
  }

  // Giriş yapılmış ve login sayfasına gitmeye çalışıyorsa
  if (isLoggedIn && pathname.startsWith(`/${currentLng}/auth/v1/login`)) {
    return NextResponse.redirect(new URL(`/${currentLng}/dashboard/default`, req.url));
  }

  // --- 4. Cache Kontrolü ---
  // Dashboard sayfaları için cache'lemeyi engelle
  if (pathname.startsWith(`/${currentLng}/dashboard`)) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("Surrogate-Control", "no-store");
  }

  return response;
}