"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type NavGroup } from "@/navigation/sidebar/sidebar-items";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/auth-store";

interface NavMainProps {
  readonly items: readonly NavGroup[];
}

export function NavMain({ items }: NavMainProps) {
  const path = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { permissions: userPermissions } = useAuthStore();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Menü elemanlarını kullanıcının yetkilerine göre filtrele
  const filteredItems = items.map(group => ({
    ...group,
    items: group.items.map(item => ({
      ...item,
      subItems: item.subItems?.filter(subItem => 
        !subItem.permission || userPermissions.has(subItem.permission)
      ),
    })).filter(item => {
      return !item.subItems || item.subItems.length > 0;
    }),
  })).filter(group => group.items.length > 0);

  if (state === "collapsed" && !isMobile) {
    return <CollapsedNav items={filteredItems} />;
  }

  const getActiveAccordionItem = () => {
    for (const group of items) {
      for (const item of group.items) {
        if (item.subItems?.some(sub => path.startsWith(sub.url))) {
          return item.title;
        }
      }
    }
    return "";
  };

  return (
    <>
      {filteredItems.map((group) => (
        <SidebarGroup key={group.id}>
          {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
          <SidebarGroupContent className="flex flex-col gap-1">
            <Accordion type="single" collapsible defaultValue={getActiveAccordionItem()} className="w-full">
              {group.items.map((item) =>
                item.subItems ? (
                  <AccordionItem key={item.title} value={item.title} className="border-none">
                    <AccordionTrigger
                      className={`px-2 py-1.5 rounded-md hover:no-underline 
                      ${item.subItems.some(sub => path.startsWith(sub.url))
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'hover:bg-sidebar-accent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span className="text-sm font-medium">{item.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pl-4">
                      <SidebarMenuSub>
                        {item.subItems.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              isActive={path === subItem.url}
                              asChild
                            >
                              <Link href={subItem.url} onClick={handleLinkClick}>
                                {subItem.icon && <subItem.icon />}
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </AccordionContent>
                  </AccordionItem>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={path === item.url}
                      className={
                        path === item.url
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "hover:bg-sidebar-accent"
                      }
                      asChild
                    >
                      <Link href={item.url} onClick={handleLinkClick}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </Accordion>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}

function CollapsedNav({ items }: NavMainProps) {
    const path = usePathname();
    return (
        <>
        {items.map(group => (
            <SidebarGroup key={group.id}>
                {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
                <SidebarGroupContent>
                    <SidebarMenu>
                    {group.items.map(item => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                tooltip={item.title}
                                isActive={path === item.url || (item.subItems?.some(sub => path.startsWith(sub.url)) ?? false)}
                                asChild
                            >
                                <Link href={item.url === '#' ? (item.subItems?.[0]?.url ?? '#') : item.url}>
                                    {item.icon && <item.icon/>}
                                    <span className="sr-only">{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        ))}
        </>
    )
}