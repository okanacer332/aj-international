"use client";

import { Sidebar, SidebarContent, SidebarFooter } from "@/components/ui/sidebar"; // SidebarFooter import edildi
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
      
      {/* YENİ EKLENEN KISIM: Sidebar Footer - acrtech imzası */}
      <SidebarFooter className="py-3 px-4 text-center">
        <div className="flex flex-col items-center justify-center text-sidebar-foreground/50 text-[10px] font-medium">
            Powered By
            <span className="text-sm text-sidebar-foreground/80 font-semibold pt-0.5">
                acrtech
            </span>
        </div>
      </SidebarFooter>
      
    </Sidebar>
  );
}