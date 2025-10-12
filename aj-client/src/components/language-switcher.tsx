// src/components/language-switcher.tsx
'use client';

import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export const LanguageSwitcher = () => {
  const pathname = usePathname();
  const params = useParams();
  const lng = params.lng as string;

  // Mevcut yoldan dil kodunu kaldırarak ana yolu buluyoruz
  // Örn: /tr/dashboard/settings -> /dashboard/settings
  const redirectedPathName = (path: string, currentLng: string) => {
    if (!path) return '/';
    const segments = path.split('/');
    if (segments[1] === currentLng) {
      segments.splice(1, 1);
      return segments.join('/') || '/';
    }
    return path;
  };

  const currentPathWithoutLng = redirectedPathName(pathname, lng);

  // Hedef dili belirle
  const targetLng = lng === 'tr' ? 'en' : 'tr';

  return (
    <Link href={`/${targetLng}${currentPathWithoutLng}`}>
      <Button variant="ghost" size="sm">
        <Globe className="mr-2 h-4 w-4" />
        {targetLng.toUpperCase()}
      </Button>
    </Link>
  );
};