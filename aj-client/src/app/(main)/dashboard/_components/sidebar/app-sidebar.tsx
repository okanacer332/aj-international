"use client";

import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { NavMain } from "./nav-main";
// SidebarHeader, SidebarFooter, NavUser gibi importlar kaldırıldı

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      {/* SidebarHeader kaldırıldı */}
      <SidebarContent>
        {/* Burası ileride Tenant Switcher'ı ekleyeceğimiz yer olacak */}
        <div className="p-2">
          {/* Boşluk veya Tenant Switcher */}
        </div>
        <NavMain items={sidebarItems} />
      </SidebarContent>
      {/* SidebarFooter kaldırıldı */}
    </Sidebar>
  );
}