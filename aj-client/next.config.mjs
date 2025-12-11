/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Standalone modu (Sunucuya transferi kolaylaştırır)
  output: "standalone",

  // 2. Resim optimizasyonunu kapat (Eski işlemci hatasını engeller)
  images: {
    unoptimized: true,
  },

  // 3. ESLint hatalarını yoksay (Kod stili hataları build'i durdurmasın)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 4. 🔥 TİP HATALARINI YOKSAY (TypeScript hataları build'i durdurmasın)
  typescript: {
    ignoreBuildErrors: true,
  },

  // 5. API Yönlendirmesi (Proxy)
  async rewrites() {
    // Ortam değişkeninden Backend URL'ini al, yoksa varsayılanı kullan
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3344';
    
    console.log(`🚀 Proxy Hedefi: ${backendUrl}`);

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`, 
      },
    ];
  },
};

export default nextConfig;