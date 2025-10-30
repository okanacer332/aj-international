export type SkillDefinition = {
  id: string;
  tenantId: string;
  skillName: string;
  targetExperiencePercent: number;
};

// Form için (id opsiyonel)
export type SkillDefinitionFormValues = Omit<SkillDefinition, "id" | "tenantId">;