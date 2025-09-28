export type User = {
    id: string;
    username: string;
    fullName: string;
    email: string | null;
    tenantId: string;
    roleIds: string[];
    active: boolean;
    avatarUrl: string | null;
    permissions?: string[]; // Frontend'in kullanması için backend'den gelen yetki listesi
};