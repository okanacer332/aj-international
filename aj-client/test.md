Domizan MongoDB Veritabanı Yapısı
🗄️ VERİTABANI MİMARİSİ
Domizan multi-tenant (çok kiracılı) mimari kullanır. Her tenant (kiracı) için ayrı bir veritabanı oluşturulur.

MongoDB
├── domizan_master          ← Admin veritabanı (tüm tenant'lar burada kayıtlı)
├── domizan_tenant_acer     ← "acer" subdomain için tenant veritabanı
├── domizan_tenant_okan     ← "okan" subdomain için tenant veritabanı
└── domizan_tenant_xxx      ← Her yeni tenant için ayrı DB
📊 VERİTABANI AÇIKLAMALARI
1. domizan_master (Ana Veritabanı)
Bu veritabanı sistem genelinde paylaşılan verileri içerir:

Koleksiyon	Açıklama
tenants	Tüm tenant kayıtları (subdomain, owner, settings, plan)
subscription_plans	Abonelik planları (FREE, PRO, ENTERPRISE)
admin_users	Super admin kullanıcıları
2. domizan_tenant_{subdomain} (Tenant Veritabanları)
Her tenant'ın kendi izole veritabanı vardır:

Koleksiyon	Açıklama	Sektör
users	Tenant kullanıcıları	Tümü
refresh_tokens	JWT refresh token'lar	Tümü
roles	Kullanıcı rolleri	Tümü
law_clients	Müvekkiller	LAW
law_cases	Davalar	LAW
beauty_appointments	Randevular	BEAUTY
beauty_customers	Salon müşterileri	BEAUTY
healthcare_appointments	Tıbbi randevular	HEALTHCARE
healthcare_patients	Hastalar	HEALTHCARE
accounting_documents	Belge/Faturalar	ACCOUNTING
accounting_taxpayers	Mükellefler	ACCOUNTING
customers	Genel müşteriler	RETAIL/WHOLESALE
invoices	Faturalar	Tümü
transactions	Finansal işlemler	Tümü
activity_logs	Aktivite logları	Tümü
📐 TABLO İLİŞKİLERİ (ER Diyagramı)
has
has
uses
has
has
has
contains
contains
has
contains
has
contains
has
contains
TENANT
USER
TENANT_SUBSCRIPTION
SUBSCRIPTION_PLAN
REFRESH_TOKEN
ROLE
CLIENT
LEGAL_CASE
HEARING
CASE_NOTE
SALON_CUSTOMER
APPOINTMENT
APPOINTMENT_SERVICE
PATIENT
MEDICAL_APPOINTMENT
PRESCRIPTION
TAXPAYER
TAX_DOCUMENT
LINE_ITEM
📋 DETAYLI KOLEKSİYON YAPILARI
Master DB Koleksiyonları
tenants Collection
{
  _id: ObjectId,
  subdomain: "acer",                // Unique subdomain
  name: "Acer Hukuk Bürosu",
  ownerEmail: "info@acer.com",
  ownerFirstName: "Ahmet",
  ownerLastName: "Cerit",
  status: "ACTIVE",                 // PENDING, ACTIVE, SUSPENDED, CANCELLED
  settings: {
    currency: "TRY",
    timezone: "Europe/Istanbul",
    language: "tr",
    sectorType: "LAW",              // LAW, BEAUTY, ACCOUNTING, HEALTHCARE
    terminology: {
      customer: "Müvekkil",
      customerPlural: "Müvekkiller",
      order: "Dava",
      // ...
    }
  },
  subscription: {
    plan: "FREE",
    maxUsers: 1,
    maxRecords: 1000,
    stripeCustomerId: null
  },
  features: {
    "api_access": { enabled: false },
    "export": { enabled: true }
  },
  createdAt: ISODate,
  updatedAt: ISODate
}
subscription_plans Collection
{
  _id: ObjectId,
  code: "FREE",
  name: "Ücretsiz",
  description: "Başlangıç planı",
  monthlyPrice: 0,
  yearlyPrice: 0,
  limits: {
    maxUsers: 1,
    maxCustomers: 3,
    maxStorageMb: 100
  },
  features: ["basic_crm", "single_user"],
  isActive: true
}
Tenant DB Koleksiyonları
users Collection
{
  _id: ObjectId,
  tenantId: "acer",
  email: "ahmet@acer.com",
  passwordHash: "...",
  firstName: "Ahmet",
  lastName: "Cerit",
  roleId: ObjectId,
  permissions: ["customers.read", "customers.write"],
  active: true,
  mfaEnabled: false,
  lastLoginAt: ISODate,
  lastLoginIp: "192.168.1.1",
  failedLoginAttempts: 0,
  locked: false,
  createdAt: ISODate
}
law_clients Collection (LAW Sector)
{
  _id: ObjectId,
  tenantId: "acer",
  firstName: "Mehmet",
  lastName: "Yılmaz",
  email: "mehmet@example.com",
  phone: "+905321234567",
  tckn: "12345678901",           // TC Kimlik No
  address: { city: "İstanbul", ... },
  caseSummary: "İş davası",
  notes: "VIP müvekkil",
  tags: ["kurumsal", "vip"],
  isActive: true,
  createdAt: ISODate
}
law_cases Collection (LAW Sector)
{
  _id: ObjectId,
  tenantId: "acer",
  clientId: ObjectId,            // → law_clients._id
  caseNumber: "2024/123",
  caseYear: 2024,
  caseType: "CIVIL",             // CIVIL, CRIMINAL, LABOR, FAMILY, ...
  status: "ACTIVE",              // ACTIVE, WON, LOST, SETTLED, CLOSED
  courtName: "Kadıköy 2. Asliye Hukuk",
  courtCity: "İstanbul",
  subject: "Alacak davası",
  opponentName: "ABC Ltd.",
  claimAmount: NumberDecimal("50000"),
  agreedFee: NumberDecimal("10000"),
  feeType: "FIXED",              // FIXED, PERCENTAGE, HOURLY
  priority: "HIGH",
  hearings: [
    {
      id: UUID,
      date: ISODate("2024-02-15"),
      time: "10:00",
      courtRoom: "3",
      type: "Duruşma",
      status: "SCHEDULED"
    }
  ],
  notes: [
    {
      id: UUID,
      timestamp: ISODate,
      content: "Dilekçe hazırlandı",
      author: "Ahmet Cerit"
    }
  ],
  tags: ["acil", "kurumsal"],
  createdAt: ISODate
}
beauty_appointments Collection (BEAUTY Sector)
{
  _id: ObjectId,
  tenantId: "salon",
  customerId: ObjectId,
  customerName: "Zeynep Kaya",
  customerPhone: "05321234567",
  staffId: ObjectId,
  staffName: "Ayşe",
  date: ISODate("2024-01-16"),
  startTime: "10:00",
  endTime: "11:30",
  durationMinutes: 90,
  services: [
    {
      serviceId: ObjectId,
      serviceName: "Saç Kesimi",
      durationMinutes: 30,
      price: NumberDecimal("150")
    },
    {
      serviceId: ObjectId,
      serviceName: "Boya",
      durationMinutes: 60,
      price: NumberDecimal("300")
    }
  ],
  totalPrice: NumberDecimal("450"),
  status: "SCHEDULED",           // SCHEDULED, CONFIRMED, COMPLETED, CANCELLED
  paymentStatus: "PENDING",
  source: "ONLINE",              // MANUAL, ONLINE, PHONE, WALK_IN
  notes: "Kısa kesim istiyor",
  createdAt: ISODate
}
healthcare_appointments Collection (HEALTHCARE Sector)
{
  _id: ObjectId,
  tenantId: "klinik",
  patientId: ObjectId,
  patientName: "Ali Vural",
  patientTckn: "12345678901",
  patientPhone: "05321234567",
  doctorId: ObjectId,
  doctorName: "Dr. Mehmet",
  department: "Dahiliye",
  date: ISODate("2024-01-16"),
  startTime: "09:00",
  endTime: "09:30",
  type: "EXAMINATION",           // EXAMINATION, FOLLOW_UP, PROCEDURE, ...
  status: "SCHEDULED",
  reason: "Genel muayene",
  clinicalNotes: "Tansiyon normal",
  diagnosis: "A10.2",            // ICD kodu
  prescriptions: [
    {
      medicationName: "Aspirin",
      dosage: "100mg",
      frequency: "1x1",
      durationDays: 30,
      instructions: "Tok karnına"
    }
  ],
  labTests: ["Tam Kan", "Lipid Paneli"],
  insurance: {
    hasSGK: true,
    sgkNumber: "123456789",
    hasPrivateInsurance: false
  },
  fee: NumberDecimal("500"),
  paymentStatus: "SGK_PENDING",
  createdAt: ISODate
}
accounting_documents Collection (ACCOUNTING Sector)
{
  _id: ObjectId,
  tenantId: "muhasebe",
  taxpayerId: ObjectId,
  taxpayerName: "ABC Teknoloji A.Ş.",
  taxNumber: "1234567890",
  documentType: "INVOICE_SALES",  // INVOICE_SALES, KDV_DECLARATION, SGK_DECLARATION, ...
  documentNumber: "FTR-2024-001",
  date: ISODate("2024-01-10"),
  dueDate: ISODate("2024-01-26"),
  period: "2024-01",
  status: "APPROVED",            // DRAFT, PENDING, SUBMITTED, APPROVED, REJECTED
  netAmount: NumberDecimal("10000"),
  vatAmount: NumberDecimal("2000"),
  grossAmount: NumberDecimal("12000"),
  taxPayable: NumberDecimal("2000"),
  lineItems: [
    {
      description: "Yazılım Geliştirme",
      quantity: 1,
      unit: "Adet",
      unitPrice: NumberDecimal("10000"),
      vatRate: NumberDecimal("20"),
      vatAmount: NumberDecimal("2000"),
      totalAmount: NumberDecimal("12000")
    }
  ],
  submitted: true,
  submittedAt: ISODate,
  eInvoiceUuid: "...",
  createdAt: ISODate
}
🔗 İLİŞKİ ÖZETİ
Parent	Child	İlişki Tipi	Alan
tenants	users	1:N	tenantId
users	refresh_tokens	1:N	userId
users	roles	N:1	roleId
law_clients	law_cases	1:N	clientId
beauty_customers	beauty_appointments	1:N	customerId
healthcare_patients	healthcare_appointments	1:N	patientId
accounting_taxpayers	accounting_documents	1:N	taxpayerId
subscription_plans	tenant_subscriptions	1:N	planId
💡 ÖNEMLİ NOTLAR
Tenant İzolasyonu: Her tenant kendi veritabanında izole edilir. tenantId alanı ek güvenlik katmanı sağlar.

Embedded Documents: MongoDB'nin güçlü yönü olan embedded documents kullanılır:

Hearings → LegalCase içinde
Prescriptions → MedicalAppointment içinde
Services → Appointment içinde
LineItems → TaxDocument içinde
Denormalizasyon: Performans için bazı alanlar denormalize edilir:

customerName → appointment'larda
staffName → appointment'larda
doctorName → medical appointment'larda
İndeksler: Her koleksiyonda tenantId üzerinde indeks bulunur.

🎯 SİZİN DURUMUNUZ
Görüntüdeki 2 veritabanı DOĞRU ve beklenen davranış:

Veritabanı	Açıklama
domizan_master	Ana admin veritabanı (tenant kayıtları)
domizan_tenant_acer	"acer" subdomain için tenant veritabanı
Bu, multi-tenant mimarinin çalıştığını gösterir. Yeni bir tenant kayıt olduğunda otomatik olarak yeni bir domizan_tenant_{subdomain} veritabanı oluşturulur.