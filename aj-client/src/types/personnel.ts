import { UnitDefinition } from "./unit-definition";
import { SkillDefinition } from "./skill-definition";
import { ServiceDefinition } from "./service-definition";
import { User } from "./user";

// YENİ: Prim Tipi
export type PersonnelBonus = {
  bonusDefinitionId: string;
  amount: number;
};

// Formdan gönderilecek DTO (Create)
export type CreatePersonnelRequest = {
  hireDate: string; // ISO Date String (YYYY-MM-DD)
  onxCode: string;
  fullName: string;
  unitDefinitionId: string;
  skillDefinitionId?: string | null;
  phone: string;
  serviceDefinitionId?: string | null;
  bonuses?: PersonnelBonus[]; // YENİ
};

// Formdan gönderilecek DTO (Update)
export type UpdatePersonnelRequest = Omit<CreatePersonnelRequest, "onxCode">;

// Backend'den gelen Personel kaydı
export type Personnel = {
  id: string;
  tenantId: string;
  userId: string;
  onxCode: string;
  hireDate: string; // ISO Date String
  phone: string;
  unitDefinitionId: string;
  skillDefinitionId?: string;
  serviceDefinitionId?: string;
  
  // YENİ: Atanan Primler
  assignedBonuses?: PersonnelBonus[];

  // Backend'de Service katmanında doldurulan @Transient alanlar
  user?: User; // Ad Soyad ve Avatar için
  unit?: UnitDefinition; // Birim Adı için
  skill?: SkillDefinition; // Yetenek Adı için
  service?: ServiceDefinition; // Servis Plakası için
};