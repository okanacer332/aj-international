export type MasterProduct = {
  id: string;
  tenantId: string;
  code: string; // Örn: ANO, ANO-CR
  name: string; // Örn: Ana Tekstil Malzemesi, ANO BABY (CR)
  description?: string; 
  
  parentProductId: string | null; // Ana ürünün ID'si (alt ürün ise)
  
  subProducts?: MasterProduct[]; 
  
  isExpanded?: boolean; 

  // --- YENİ ALANLAR ---
  active: boolean;
  targetValue?: number | null;
  measureDefinitionId?: string | null;
  wasteRate?: number | null;
  premiumValue?: number | null;
  // --- BİTTİ ---
};

export type MasterProductFormValues = {
  id?: string;
  name: string;
  code: string;
  description: string;
  
  parentProductId: string | null; 

  // --- YENİ ALANLAR ---
  active: boolean;
  targetValue?: number | null;
  measureDefinitionId?: string | null;
  wasteRate?: number | null;
  premiumValue?: number | null;
  // --- BİTTİ ---
};