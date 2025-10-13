// aj-client/src/app/[lng]/(main)/dashboard/_components/sidebar-initializer.tsx
'use client';

import { useEffect } from 'react';
// YENİ IMPORT: Sidebar store'umuzu kullanıyoruz
import { useSidebarStore } from '@/stores/sidebar-store'; 

// Tailwind'in 'lg' breakpoint'i (1024px)
const LG_BREAKPOINT = 1024; 

export function SidebarInitializer() {
  const setIsOpen = useSidebarStore((state) => state.setIsOpen);

  useEffect(() => {
    // Sadece Client tarafında, ilk render'da çalışır.
    
    // Pencere genişliğini kontrol et.
    if (window.innerWidth >= LG_BREAKPOINT) {
      // Büyük ekranlarda (masaüstü) açık olarak ayarla
      setIsOpen(true);
    } 
    // Küçük ekranlar için varsayılan durum zaten 'false' olduğu için bir şey yapmamıza gerek yok.
    
  }, [setIsOpen]);
  
  // Bu bileşen görsel bir şey render etmez.
  return null;
}