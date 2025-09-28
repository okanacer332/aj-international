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
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  permission?: string;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Yönetim Paneli",
    items: [
      {
        title: "Ana Sayfa",
        url: "/dashboard/default",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 2,
    label: "Modüller",
    items: [
      {
        title: "Operasyon",
        url: "#",
        icon: Briefcase,
        subItems: [
          // "comingSoon: true" buradan kaldırıldı
          { title: "Görev Yönetimi", url: "/dashboard/tasks", icon: ClipboardList, permission: "PAGE_TASKS:READ" },
        ],
      },
      {
        title: "İnsan Kaynakları",
        url: "#",
        icon: HeartHandshake,
        subItems: [
          { title: "Personel Yönetimi", url: "/dashboard/personnel", icon: Users, comingSoon: true, permission: "PAGE_PERSONNEL:READ" },
          { title: "İzin Yönetimi", url: "/dashboard/leaves", icon: Calendar, comingSoon: true, permission: "PAGE_LEAVES:READ" },
          { title: "Vardiya Yönetimi", url: "/dashboard/shifts", icon: Clock, comingSoon: true, permission: "PAGE_SHIFTS:READ" },
        ],
      },
      {
        title: "Raporlama",
        url: "#",
        icon: AreaChart,
        subItems: [
            { title: "Raporlar", url: "/dashboard/reports", icon: FileText, comingSoon: true, permission: "PAGE_REPORTS:READ" },
        ]
      },
      {
        title: "Sistem Yönetimi",
        url: "#",
        icon: Settings,
        subItems: [
          { title: "Kullanıcı Yönetimi", url: "/dashboard/iam/users", icon: UserCog, permission: "PAGE_USERS:READ" },
          { title: "Rol Yönetimi", url: "/dashboard/iam/roles", icon: ShieldCheck, permission: "PAGE_ROLES:READ" }, // Buradaki comingSoon'u da kaldıralım.
          { title: "Log Kayıtları", url: "/dashboard/audit/logs", icon: FileClock, permission: "PAGE_LOGS:READ" },
          { title: "Genel Tanımlar", url: "/dashboard/definitions", icon: BookText, comingSoon: true, permission: "PAGE_DEFINITIONS:READ" },
        ],
      },
    ],
  },
];