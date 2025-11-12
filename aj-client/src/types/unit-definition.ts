// aj-client/src/types/unit-definition.ts
export type UnitDefinition = {
  id: string;
  tenantId: string;
  name: string; // "departmentName" ve "unitName" yerine
  parentUnitId: string | null; // Hiyerarşi için
  competencyRequired: boolean;
  
  // Hiyerarşik liste için backend servisi tarafından doldurulur
  subUnits?: UnitDefinition[];
  // Frontend'de genişletme durumunu tutmak için
  isExpanded?: boolean; 
};

// Form için (id opsiyonel)
export type UnitDefinitionFormValues = {
  id?: string;
  name: string;
  parentUnitId: string | null;
  competencyRequired: boolean;
};