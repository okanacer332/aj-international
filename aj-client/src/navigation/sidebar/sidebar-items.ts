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
  Briefcase, // Yeni ikon
  HeartHandshake, // Yeni ikon
  AreaChart, // Yeni ikon
  type LucideIcon,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string; // Tıklanabilir ana menüler için URL'ler artık '#' veya üst sayfa linki olacak
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
        url: "#", // Bu bir açılır menü olduğu için direkt linki yok
        icon: Briefcase,
        subItems: [
          { title: "Görev Yönetimi", url: "/dashboard/tasks", icon: ClipboardList, comingSoon: true },
        ],
      },
      {
        title: "İnsan Kaynakları",
        url: "#",
        icon: HeartHandshake,
        subItems: [
          { title: "Personel Yönetimi", url: "/dashboard/personnel", icon: Users, comingSoon: true },
          { title: "İzin Yönetimi", url: "/dashboard/leaves", icon: Calendar, comingSoon: true },
          { title: "Vardiya Yönetimi", url: "/dashboard/shifts", icon: Clock, comingSoon: true },
        ],
      },
      {
        title: "Raporlama",
        url: "#",
        icon: AreaChart,
        subItems: [
            { title: "Raporlar", url: "/dashboard/reports", icon: FileText, comingSoon: true },
        ]
      },
      {
        title: "Sistem Yönetimi",
        url: "#",
        icon: Settings,
        subItems: [
          { title: "Kullanıcı Yönetimi", url: "/dashboard/iam/users", icon: UserCog },
          { title: "Rol Yönetimi", url: "/dashboard/iam/roles", icon: ShieldCheck, comingSoon: true },
          { title: "Genel Tanımlar", url: "/dashboard/definitions", icon: BookText, comingSoon: true },
        ],
      },
    ],
  },
];