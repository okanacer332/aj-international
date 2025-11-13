export type CurrencyDefinition = {
  id: string;
  tenantId: string;
  name: string; // Amerikan Doları
  code: string; // USD
};

export type CurrencyDefinitionFormValues = Omit<
  CurrencyDefinition,
  "id" | "tenantId"
>;