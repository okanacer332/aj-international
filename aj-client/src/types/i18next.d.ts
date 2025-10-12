// Bu dosya i18next'in tip güvenliğini (type safety) artırmak için kullanılır.

import 'react-i18next';
// Projenizdeki çeviri dosyasının tipini import edin
import common from '../../../locales/tr/common.json'; 
// Not: TypeScript'in JSON dosyalarını modül olarak tanıması için 
// tsconfig.json dosyanızda "resolveJsonModule": true ayarı olmalıdır, ki projenizde bu ayar mevcut.

// JSON içeriğinin tipini çıkarın
type CommonResources = typeof common;

declare module 'react-i18next' {
  interface CustomTypeOptions {
    // Tüm 't' çağrılarında varsayılan olarak 'common' namespace'ini kullan
    defaultNS: 'common';
    
    // Uygulamanızdaki tüm çeviri kaynaklarını tanımlayın
    // (Bunu, i18next'in dinamik olarak yüklediği tüm kaynakları içerecek şekilde genişletebilirsiniz)
    resources: {
      common: CommonResources;
      // Eğer başka namespace'leriniz olsaydı:
      // userManagement: UserManagementResources;
    };
  }
}