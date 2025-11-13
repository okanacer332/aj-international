export type BonusDefinition = {
  id: string;
  tenantId: string;
  name: string;
  amount: number;
  thresholdPercent: number;
  
  productionGroupId: string;
  productionSectionId: string;
  currencyId: string;

  // Display fields
  groupName?: string;
  sectionName?: string;
  currencyCode?: string;
};

export type BonusDefinitionFormValues = Omit<BonusDefinition, "id" | "tenantId" | "groupName" | "sectionName" | "currencyCode"> & {
  id?: string;
};