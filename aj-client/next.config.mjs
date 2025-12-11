/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sunucu işlemcisi eski olduğu için optimizasyonu kapatıyoruz (Her yerde geçerli)
  images: {
    unoptimized: true,
  },
  // Build hatasını önlemek için (Her yerde geçerli)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Standalone çıktı (Sunucuya transferi kolaylaştırır)
  output: "standalone",

  // API Yönlendirmesi (DİNAMİK)
  async rewrites() {
    // Ortam değişkeninden okuyoruz, yoksa varsayılan olarak locale (3344) düşüyoruz.
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3344';
    
    console.log(`🚀 Proxy Hedefi: ${backendUrl}`); // Build/Start sırasında terminalde görmek için

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`, 
      },
    ];
  },
};

export default nextConfig;