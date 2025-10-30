export type MeasureDefinition = {
  id: string;
  tenantId: string;
  name: string; // kg, Tonaj, Balya
};

// Form için (id opsiyonel)
export type MeasureDefinitionFormValues = Omit<
  MeasureDefinition,
  "id" | "tenantId"
>;