// src/navigation/sidebar/sidebar-items.ts
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Settings,
  FileText,
  Calendar,
  Clock,
  UserCog,
  ShieldCheck,
  BookText,
  Briefcase,
  HeartHandshake,
  AreaChart,
  FileClock,
  type LucideIcon,
} from "lucide-react";

export interface NavSubItem {
  title: string; // Artık bu bir çeviri anahtarı olacak (örn: "sidebar.tasks.title")
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  permission?: string;
}

export interface NavMainItem {
  title: string; // Artık bu bir çeviri anahtarı olacak (örn: "sidebar.operation.title")
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string; // Artık bu bir çeviri anahtarı olacak (örn: "sidebar.management.label")
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
    ],
  },
  {
    id: 2,
    label: "sidebar.modules.label",
    items: [
      {
        title: "sidebar.modules.operation",
        url: "#",
        icon: Briefcase,
        subItems: [
          { title: "sidebar.modules.taskManagement", url: "/dashboard/tasks", icon: ClipboardList, permission: "PAGE_TASKS:READ" },
        ],
      },
      {
        title: "sidebar.modules.humanResources",
        url: "#",
        icon: HeartHandshake,
        subItems: [
          { title: "sidebar.modules.personnelManagement", url: "/dashboard/personnel", icon: Users, permission: "PAGE_PERSONNEL:READ" },
          { title: "sidebar.modules.leaveManagement", url: "/dashboard/leaves", icon: Calendar, comingSoon: true, permission: "PAGE_LEAVES:READ" },
          { title: "sidebar.modules.shiftManagement", url: "/dashboard/shifts", icon: Clock, comingSoon: true, permission: "PAGE_SHIFTS:READ" },
        ],
      },
      {
        title: "sidebar.modules.definitions",
        url: "#",
        icon: BookText,
        subItems: [
          { title: "sidebar.modules.productDefinitions", url: "/dashboard/masterdata/products", icon: BookText, permission: "PAGE_MASTER_PRODUCT:READ" },
          { title: "sidebar.modules.generalDefinitions", url: "/dashboard/definitions", icon: FileText, comingSoon: true, permission: "PAGE_DEFINITIONS:READ" },
        ],
      },
      {
        title: "sidebar.modules.reporting",
        url: "#",
        icon: AreaChart,
        subItems: [
            { title: "sidebar.modules.reports", url: "/dashboard/reports", icon: FileText, comingSoon: true, permission: "PAGE_REPORTS:READ" },
        ]
      },
      {
        title: "sidebar.modules.systemManagement",
        url: "#",
        icon: Settings,
        subItems: [
          { title: "sidebar.modules.userManagement", url: "/dashboard/iam/users", icon: UserCog, permission: "PAGE_USERS:READ" },
          { title: "sidebar.modules.roleManagement", url: "/dashboard/iam/roles", icon: ShieldCheck, permission: "PAGE_ROLES:READ" },
          { title: "sidebar.modules.auditLogs", url: "/dashboard/audit/logs", icon: FileClock, permission: "PAGE_LOGS:READ" },
        ],
      },
    ],
  },
];