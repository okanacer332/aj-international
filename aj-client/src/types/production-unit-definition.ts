// aj-client/src/types/production-unit-definition.ts
export type ProductionUnitDefinition = {
  id: string;
  tenantId: string;
  name: string; // Örn: "Baby" (Grup) veya "Kalite" (Bölüm)
  parentProductionUnitId: string | null; // Null ise Grup, doluysa Bölüm

  // Hiyerarşik liste için backend servisi tarafından doldurulur
  subUnits?: ProductionUnitDefinition[];
  // Frontend'de genişletme durumunu tutmak için
  isExpanded?: boolean;
};

// Form için (id opsiyonel)
export type ProductionUnitDefinitionFormValues = {
  id?: string;
  name: string;
  parentProductionUnitId: string | null;
};