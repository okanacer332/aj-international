export type UnitDefinition = {
  id: string;
  tenantId: string;
  departmentName: string;
  unitName: string;
  competencyRequired: boolean; // <-- 'isCompetencyRequired' idi, 'competencyRequired' olarak değişti
};

// Form için (id opsiyonel)
export type UnitDefinitionFormValues = Omit<UnitDefinition, "id" | "tenantId"> & {
  id?: string;
};