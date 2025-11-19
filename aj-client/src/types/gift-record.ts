export type RecipientType = "USER" | "PERSONNEL";

export type GiftLine = {
  productId: string;
  productName?: string; // Backend response'da gelecek
  quantity: number;
  description?: string;
};

// Backend'den gelen veri (Listeleme için)
export type GiftRecord = {
  id: string;
  date: string; // ISO Date String
  recipientId: string;
  recipientName: string; // Backend tarafından doldurulmuş isim
  recipientType: RecipientType;
  description?: string;
  lines: GiftLine[];
};

// Formdan gönderilecek veri
export type CreateGiftRequest = {
  date: Date;
  recipientId: string;
  recipientType: RecipientType;
  description?: string;
  lines: {
    productId: string;
    quantity: number;
    description?: string;
  }[];
};