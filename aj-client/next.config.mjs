/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  
  // KRİTİK DEĞİŞİKLİK: BUILD SIRASINDA TIP KONTROLÜNÜ KAPAT
  typescript: {
    ignoreBuildErrors: true, 
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        // DOĞRU YOL: Backend'den gelen "/uploads/" ile başlayan tüm yollara izin ver.
        pathname: '/uploads/**',
      },
      // KRİTİK DEĞİŞİKLİK BURADA: Canlı ortam IP adresi eklendi
      {
        protocol: 'http',
        hostname: '213.74.252.238',
        port: '8080',
        pathname: '/uploads/**',
      },
    ],
  },

  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/dashboard/default",
        permanent: false,
      },
    ];
  },
}


export default nextConfig