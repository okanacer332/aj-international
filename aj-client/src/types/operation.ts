export type OperationTableUnit = "PRE_SELECTION" | "SORTING" | "PRESS";

export interface OperationTable {
  id: string;
  tableNo: string;
  unitType: OperationTableUnit;
  active: boolean;
  // --- YENİ EKLENEN ALANLAR ---
  totalPoolKg?: number; // Backend'den null gelebilir, opsiyonel yapalım
  processedKg?: number;
}

export interface OperationConfig {
  id: string;
  standardShiftDurationMinutes: number;
  dailyStandardTargetKg: number;
}

export interface WorkerAvailability {
  workerId: string;
  fullName: string;
  onxCode: string;
  avatarUrl?: string;
  standardShiftMinutes: number;
  usedMinutes: number;
  activeMinutes: number;
  remainingMinutes: number;
  status: "AVAILABLE" | "BUSY" | "FULL";
}

export interface TableSession {
    sessionId: string;
    workerId: string;
    workerName: string;
    avatarUrl?: string;
    startTime: string;
    assignedDurationMinutes: number;
    targetOutputKg: number;
    actualOutputKg?: number; // Ek olarak bunu da görebilmek iyi olur
}