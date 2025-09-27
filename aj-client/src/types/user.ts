export type User = {
    id: string;
    username: string;
    fullName: string;
    email: string | null;
    tenantId: string;
    roleIds: string[];
    active: boolean;
    avatarUrl: string | null; // EKSİK OLAN SATIR BURAYA EKLENDİ
};