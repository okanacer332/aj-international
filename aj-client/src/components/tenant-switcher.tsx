// aj-client/src/components/tenant-switcher.tsx
'use client';

import { useTenantStore, supportedTenants, TenantCode } from '@/stores/tenant-store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter, usePathname } from 'next/navigation'; // Veri yenileme için eklendi

export const TenantSwitcher = () => {
  const currentTenantId = useTenantStore((state) => state.currentTenantId);
  const setCurrentTenantId = useTenantStore((state) => state.setCurrentTenantId);
  const router = useRouter();
  const pathname = usePathname();

  const handleTenantChange = (newTenantId: TenantCode) => {
    if (newTenantId === currentTenantId) return;

    setCurrentTenantId(newTenantId);
    // Seçim değiştiğinde sayfayı yeniden yükleyerek verilerin
    // yeni tenant'a göre çekilmesini sağlayalım (Basit Yöntem).
    // Daha gelişmiş yöntemler (örn: queryClient.invalidateQueries) kullanılabilir.
    router.refresh();
    // VEYA sadece veriyi çeken bileşenleri tetiklemek için özel bir event/state kullanabilirsiniz.
    console.log(`Tenant Switcher: Tenant changed to ${newTenantId}, refreshing page.`);
  };

  const selectedOption = supportedTenants.find(t => t.code === currentTenantId) || supportedTenants[0]; // Fallback

  return (
    <Select value={currentTenantId} onValueChange={handleTenantChange}>
      <SelectTrigger className="w-fit min-w-32 gap-2 h-9">
        <SelectValue placeholder={selectedOption.name} asChild>
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none">{selectedOption.flag}</span>
            <span className="text-sm">{selectedOption.name}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {supportedTenants.map((tenant) => (
          <SelectItem key={tenant.code} value={tenant.code}>
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none">{tenant.flag}</span>
              <span>{tenant.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};