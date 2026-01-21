// src/lib/query-keys.ts

/**
 * Query Keys Factory for TanStack Query
 * 
 * Centralized query key management for:
 * - Type-safe cache invalidation
 * - Consistent key structure
 * - Easy cache management
 */
export const queryKeys = {
    // MasterData Module
    masterProducts: {
        all: ['masterProducts'] as const,
        list: (params?: object) => [...queryKeys.masterProducts.all, 'list', params] as const,
        detail: (id: string) => [...queryKeys.masterProducts.all, 'detail', id] as const,
    },

    services: {
        all: ['services'] as const,
        list: (params?: object) => [...queryKeys.services.all, 'list', params] as const,
        detail: (id: string) => [...queryKeys.services.all, 'detail', id] as const,
    },

    skills: {
        all: ['skills'] as const,
        list: () => [...queryKeys.skills.all, 'list'] as const,
    },

    measures: {
        all: ['measures'] as const,
        list: () => [...queryKeys.measures.all, 'list'] as const,
    },

    currencies: {
        all: ['currencies'] as const,
        list: () => [...queryKeys.currencies.all, 'list'] as const,
    },

    units: {
        all: ['units'] as const,
        list: () => [...queryKeys.units.all, 'list'] as const,
    },

    productionUnits: {
        all: ['productionUnits'] as const,
        list: () => [...queryKeys.productionUnits.all, 'list'] as const,
        hierarchical: () => [...queryKeys.productionUnits.all, 'hierarchical'] as const,
    },

    // Inventory Module
    inventory: {
        all: ['inventory'] as const,
        entries: (params?: object) => [...queryKeys.inventory.all, 'entries', params] as const,
        dispatches: (params?: object) => [...queryKeys.inventory.all, 'dispatches', params] as const,
    },

    depots: {
        all: ['depots'] as const,
        list: () => [...queryKeys.depots.all, 'list'] as const,
        detail: (id: string) => [...queryKeys.depots.all, 'detail', id] as const,
    },

    materials: {
        all: ['materials'] as const,
        list: () => [...queryKeys.materials.all, 'list'] as const,
        detail: (id: string) => [...queryKeys.materials.all, 'detail', id] as const,
    },

    suppliers: {
        all: ['suppliers'] as const,
        list: () => [...queryKeys.suppliers.all, 'list'] as const,
        detail: (id: string) => [...queryKeys.suppliers.all, 'detail', id] as const,
    },

    customers: {
        all: ['customers'] as const,
        list: () => [...queryKeys.customers.all, 'list'] as const,
        detail: (id: string) => [...queryKeys.customers.all, 'detail', id] as const,
    },

    // Personnel & HR Module
    personnel: {
        all: ['personnel'] as const,
        list: (params?: object) => [...queryKeys.personnel.all, 'list', params] as const,
        detail: (id: string) => [...queryKeys.personnel.all, 'detail', id] as const,
    },

    // IAM Module
    users: {
        all: ['users'] as const,
        list: () => [...queryKeys.users.all, 'list'] as const,
        detail: (id: string) => [...queryKeys.users.all, 'detail', id] as const,
        me: () => [...queryKeys.users.all, 'me'] as const,
    },

    roles: {
        all: ['roles'] as const,
        list: () => [...queryKeys.roles.all, 'list'] as const,
        detail: (id: string) => [...queryKeys.roles.all, 'detail', id] as const,
    },

    // Operation Module
    operations: {
        all: ['operations'] as const,
        list: (params?: object) => [...queryKeys.operations.all, 'list', params] as const,
        detail: (id: string) => [...queryKeys.operations.all, 'detail', id] as const,
        daily: (date: string) => [...queryKeys.operations.all, 'daily', date] as const,
    },

    // Dashboard Module
    dashboard: {
        all: ['dashboard'] as const,
        summary: () => [...queryKeys.dashboard.all, 'summary'] as const,
        stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    },

    // Audit Module
    audit: {
        all: ['audit'] as const,
        logs: (params?: object) => [...queryKeys.audit.all, 'logs', params] as const,
    },
} as const;

export default queryKeys;
