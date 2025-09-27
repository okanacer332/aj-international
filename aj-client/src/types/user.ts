export type User = {
    id: string;
    username: string;
    fullName: string;
    email: string;
    tenantId: string;
    roleIds: string[];
    active: boolean;
};