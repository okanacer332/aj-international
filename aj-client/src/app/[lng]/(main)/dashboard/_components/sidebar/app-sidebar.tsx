// src/app/[lng]/(main)/dashboard/_components/sidebar/app-sidebar.tsx
"use client";

import { Sidebar, SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { NavMain } from "./nav-main";

// DEĞİŞİKLİK BURADA: 'lng' prop'unu alacak şekilde tipi güncelliyoruz
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  lng: string;
}

export function AppSidebar({ lng, ...props }: AppSidebarProps) {
  return (
    <Sidebar {...props}>
      <SidebarContent>
        <div className="p-2">
          {/* Tenant Switcher future location */}
        </div>
        {/* DEĞİŞİKLİK BURADA: NavMain'e 'lng' prop'unu aktarıyoruz */}
        <NavMain items={sidebarItems} lng={lng} />
      </SidebarContent>
      
      <SidebarFooter className="py-3 px-4 text-center">
        <div className="flex flex-col items-center justify-center text-[10px] font-medium text-sidebar-foreground/50">
            Powered By
            <span className="pt-0.5 text-sm font-semibold text-sidebar-foreground/80">
                acrtech
            </span>
        </div>
      </SidebarFooter>
      
    </Sidebar>
  );
}