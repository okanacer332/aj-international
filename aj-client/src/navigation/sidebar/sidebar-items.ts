import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Settings,
  FileText,
  UserCog,
  ShieldCheck,
  BookText,
  Briefcase,
  HeartHandshake,
  AreaChart,
  FileClock,
  BarChart3,
  Bus,
  Ruler,
  Warehouse,
  Building,
  Factory,
  Package,
  Banknote,
  Coins,
  Activity,
  TableProperties,
  SlidersHorizontal,
  MonitorPlay,
  type LucideIcon,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  permission?: string;
  // permission?: string; // Kullanıcı isteği üzerine kaldırıldı/kullanılmıyor
}
export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  // permission?: string;
}
export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "sidebar.managementPanel.label",
    items: [
      {
        title: "sidebar.managementPanel.home",
        url: "/dashboard/default",
        icon: LayoutDashboard,
      },
      {
        title: "operation.menu.fieldPanel",
        url: "/dashboard/field-panel",
        icon: MonitorPlay,
        // permission alanı kaldırıldı, kontrol dışarıda yapılıyor.
      },
    ],
  },
  {
    id: 2,
    label: "sidebar.modules.label",
    items: [
      {
        title: "operation.menu.preSelection",
        url: "#",
        icon: Briefcase,
        subItems: [
          { 
            title: "operation.menu.preSelectionDaily", 
            url: "/dashboard/operation/daily", 
            icon: Activity
          },
          { 
            title: "operation.menu.tableDefinitions", 
            url: "/dashboard/operation/definitions/tables", 
            icon: TableProperties
          },
          { 
            title: "operation.menu.shiftSettings", 
            url: "/dashboard/operation/definitions/general", 
            icon: SlidersHorizontal
          },
        ],
      },
      {
        title: "sidebar.modules.inventory",
        url: "#",
        icon: Warehouse,
        subItems: [
          { title: "inventory.entry.title", url: "/dashboard/inventory/entry", icon: ClipboardList },
          { title: "inventory.dispatch.title", url: "/dashboard/inventory/dispatch", icon: Bus },
          { title: "inventory.definitions.title", url: "/dashboard/inventory/definitions", icon: BookText },
          { title: "inventory.reports.title", url: "/dashboard/inventory/reports/stock", icon: AreaChart },
        ],
      },
      {
        title: "sidebar.modules.humanResources",
        url: "#",
        icon: HeartHandshake,
        subItems: [
          { title: "sidebar.modules.personnelManagement", url: "/dashboard/personnel", icon: Users },
          { title: "sidebar.modules.departmentDefinitions", url: "/dashboard/hr/departments", icon: Building },
          { title: "sidebar.modules.bonusDefinitions", url: "/dashboard/hr/definitions/bonus", icon: Coins },
          { title: "hr.gifts.title", url: "/dashboard/hr/gifts", icon: HeartHandshake },
        ],
      },
      {
        title: "sidebar.modules.production",
        url: "#",
        icon: Factory,
        subItems: [
          { title: "sidebar.modules.production.products", url: "/dashboard/production/products", icon: Package },
          { title: "sidebar.modules.productionDefinitions", url: "/dashboard/production/definitions", icon: Building },
        ],
      },
      {
        title: "sidebar.modules.definitions",
        url: "#",
        icon: BookText,
        subItems: [
          { title: "sidebar.modules.skillDefinitions", url: "/dashboard/masterdata/skills", icon: BarChart3 },
          { title: "sidebar.modules.serviceDefinitions", url: "/dashboard/masterdata/services", icon: Bus },
          { title: "sidebar.modules.measureDefinitions", url: "/dashboard/masterdata/measures", icon: Ruler },
          { title: "sidebar.modules.currencyDefinitions", url: "/dashboard/masterdata/currencies", icon: Banknote },
        ],
      },
      {
        title: "sidebar.modules.reporting",
        url: "#",
        icon: AreaChart,
        subItems: [
            { title: "sidebar.modules.reports", url: "/dashboard/reports", icon: FileText, comingSoon: true },
        ]
      },
      {
        title: "sidebar.modules.systemManagement",
        url: "#",
        icon: Settings,
        subItems: [
          { title: "sidebar.modules.userManagement", url: "/dashboard/iam/users", icon: UserCog },
          { title: "sidebar.modules.roleManagement", url: "/dashboard/iam/roles", icon: ShieldCheck },
          { title: "sidebar.modules.auditLogs", url: "/dashboard/audit/logs", icon: FileClock },
        ],
      },
    ],
  },
];