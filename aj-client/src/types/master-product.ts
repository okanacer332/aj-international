export type MasterProduct = {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  
  // Hiyerarşi kaldırıldı, yerine bu geldi
  productionUnitId: string | null; // Bölüm ID'si
  
  // subProducts kaldırıldı.
  
  active: boolean;
  targetValue?: number | null;
  measureDefinitionId?: string | null;
  wasteRate?: number | null;
  
  // Değişen alan
  unitPrice?: number | null; // 'premiumValue' yerine

  // Backend servisinden join'lenerek gelen ekstra alanlar
  groupName?: string;
  sectionName?: string;
};

// Form tipi de güncellendi
export type MasterProductFormValues = {
  id?: string;
  name: string;
  code: string;
  description?: string;
  
  productionUnitId: string | null;
  
  active: boolean;
  targetValue?: number | null;
  measureDefinitionId?: string | null;
  wasteRate?: number | null;
  unitPrice?: number | null;
};