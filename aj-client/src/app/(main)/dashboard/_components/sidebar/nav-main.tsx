"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type NavGroup, type NavMainItem } from "@/navigation/sidebar/sidebar-items";
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

interface NavMainProps {
  readonly items: readonly NavGroup[];
}

export function NavMain({ items }: NavMainProps) {
  const path = usePathname();
  const { state, isMobile } = useSidebar();

  if (state === "collapsed" && !isMobile) {
    return <CollapsedNav items={items} />;
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
      {items.map((group) => (
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
                        // DEĞİŞİKLİK BURADA YAPILDI: Aktif ana menüye de primary stili verildi.
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
                              <Link href={subItem.url}>
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
                    <SidebarMenuButton isActive={path === item.url} asChild>
                      <Link href={item.url}>
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

// Yalnızca ikonların göründüğü daraltılmış menü
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