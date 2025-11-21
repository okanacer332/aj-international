import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Acrtech Yönetim Paneli',
    short_name: 'Acrtech',
    description: 'Acrtech Kurumsal Yönetim Sistemi',
    start_url: '/dashboard/default',
    display: 'standalone',
    background_color: '#1A1919',
    theme_color: '#C4962A',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        // TS hatasını çözmek için burayı 'any' yapıyoruz veya bu satırı silebilirsiniz.
        purpose: 'any' 
      },
      // Tarayıcının "Yükle" butonu çıkarması için ZORUNLU olan PNG'ler:
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
  }
}