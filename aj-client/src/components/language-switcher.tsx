// aj-client/src/components/language-switcher.tsx
'use client';

import { usePathname, useRouter, useParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supportedLngs } from '@/lib/i18n'; 
// cn helper'a ihtiyacımız kalmadı

const LANGUAGE_OPTIONS: Record<string, { label: string, icon: string, flag: string }> = {
  'tr': { label: 'Türkçe', icon: 'TR', flag: '🇹🇷' },
  'en': { label: 'English', icon: 'EN', flag: '🇬🇧' },
  'ru': { label: 'Русский', icon: 'RU', flag: '🇷🇺' }, // Rusça eklendi
  'es': { label: 'Español', icon: 'ES', flag: '🇪🇸' }, // İspanyolca eklendi
  'ar': { label: 'العربية', icon: 'AR', flag: '🇦🇪' }, // Arapça eklendi (Birleşik Arap Emirlikleri bayrağı kullanıldı, istersen değiştirebiliriz)
};

export const LanguageSwitcher = () => {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter(); 
  
  const currentLng = params.lng as string;

  const handleLanguageChange = (newLng: string) => {
    if (newLng === currentLng) return;

    const segments = pathname.split('/');
    segments[1] = newLng;
    const newPath = segments.join('/');

    router.push(newPath);
  };

  const selectedOption = LANGUAGE_OPTIONS[currentLng] || { label: currentLng.toUpperCase(), flag: '🌐' };

  return (
    <Select value={currentLng} onValueChange={handleLanguageChange}>
      {/* KRİTİK DÜZELTME: SelectValue'yu Custom Content olarak kullanıyoruz. */}
      <SelectTrigger className="w-fit min-w-32 gap-2 h-9">
        
        {/* SelectValue içine, sadece seçili bayrak ve metni manuel yerleştiriyoruz. 
            Bu, SelectValue'nun varsayılan yansıtmasını atlar. */}
        <SelectValue placeholder={selectedOption.label} asChild>
             <div className="flex items-center gap-2"> 
                <span className="text-lg leading-none">{selectedOption.flag}</span> 
                <span className="text-sm">{selectedOption.label}</span>
            </div>
        </SelectValue>
        
      </SelectTrigger>
      
      <SelectContent>
        {supportedLngs.map((lng) => {
           const option = LANGUAGE_OPTIONS[lng] || { label: lng.toUpperCase(), flag: '🌐' };
           return (
            <SelectItem key={lng} value={lng}>
              {/* SelectItem içeriği: Sadece metin ve bayrak (Açılır menü için) */}
              <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">{option.flag}</span>
                  <span>{option.label}</span>
              </div>
            </SelectItem>
           )
        })}
      </SelectContent>
    </Select>
  );
};