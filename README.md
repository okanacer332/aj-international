# 🌍 AJ International

AJ International, çoklu ülke (multi-tenant) desteğine sahip modern bir yönetim sistemidir.  
Frontend **Next.js 14 + TypeScript + Tailwind + Shadcn/ui**, Backend ise **Spring Boot + MongoDB** ile geliştirilmiştir.  

🚀 Amacımız: Türkiye’den başlayarak farklı ülkelerde (Rusya, vb.) tek bir altyapı üzerinde çalışan, ölçeklenebilir ve modüler bir sistem kurmak.

---

## 📸 Ekran Görüntüsü
<!-- ileride dashboard veya login screenshot eklenecek -->
![Dashboard Screenshot](media/dashboard.png)

---

## ✨ Özellikler
- Kullanıcı giriş/çıkış (JWT + HttpOnly Cookie)
- Multi-tenant destekli mimari (ülke bazlı ayrım)
- Responsive ve mobil uyumlu dashboard
- Tema özelleştirme (dark/light + renk varyasyonları)
- Role-based access control (RBAC) *(planned)*
- Dashboard ekranları: analizler, raporlar, özetler

---

## 🛠️ Teknoloji Stack

**Frontend (aj-client)**
- Next.js 14, TypeScript, TailwindCSS  
- Shadcn/ui, Zustand, ESLint & Prettier  

**Backend (aj-server)**
- Java 17, Spring Boot 3  
- Spring Security, JWT  
- Spring Data MongoDB  

**Veritabanı**
- MongoDB (tek DB + tenantId alanı ile çoklu tenant desteği)  

---

## ⚙️ Kurulum

### 1. Backend (aj-server)
```bash
cd aj-server
./mvnw spring-boot:run

cd aj-client
npm install
npm run dev
