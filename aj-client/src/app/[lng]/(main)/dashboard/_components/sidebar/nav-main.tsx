// src/app/[lng]/(main)/dashboard/_components/sidebar/nav-main.tsx
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
import { useTranslation } from "@/lib/i18n-client"; 

// DEĞİŞİKLİK BURADA: 'lng' prop'unu ekliyoruz
interface NavMainProps {
  readonly items: readonly NavGroup[];
  lng: string;
}

export function NavMain({ items, lng }: NavMainProps) { // 'lng' artık prop'tan geliyor
  const path = usePathname();
  // 'useParams' artık gerekli değil
  const { t } = useTranslation(lng, 'common');
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { permissions: userPermissions } = useAuthStore();

  const pathWithoutLng = path.replace(`/${lng}`, "") || "/";

  // ... (handleLinkClick ve filteredItems aynı kalıyor) ...
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

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
    return <CollapsedNav items={filteredItems} lng={lng} t={t} />;
  }

  const getActiveAccordionItem = () => {
    for (const group of items) {
      for (const item of group.items) {
        if (item.subItems?.some(sub => pathWithoutLng.startsWith(sub.url))) {
          return item.title;
        }
      }
    }
    return "";
  };

  // ... (JSX içeriği aynı, sadece t() fonksiyonunu kullanıyor)
  return (
    <>
      {filteredItems.map((group) => (
        <SidebarGroup key={group.id}>
          {group.label && <SidebarGroupLabel>{t(group.label)}</SidebarGroupLabel>}
          <SidebarGroupContent className="flex flex-col gap-1">
            <Accordion type="single" collapsible defaultValue={getActiveAccordionItem()} className="w-full">
              {group.items.map((item) =>
                item.subItems ? (
                  <AccordionItem key={item.title} value={item.title} className="border-none">
                    <AccordionTrigger
                      className={`px-2 py-1.5 rounded-md hover:no-underline 
                      ${
                        item.subItems.some(sub => pathWithoutLng.startsWith(sub.url))
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'hover:bg-sidebar-accent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span className="text-sm font-medium">{t(item.title)}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pl-4">
                      <SidebarMenuSub>
                        {item.subItems.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              isActive={pathWithoutLng === subItem.url}
                              asChild
                            >
                              <Link href={`/${lng}${subItem.url}`} onClick={handleLinkClick}>
                                {subItem.icon && <subItem.icon />}
                                <span>{t(subItem.title)}</span>
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
                      isActive={pathWithoutLng === item.url}
                      className={
                        pathWithoutLng === item.url
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "hover:bg-sidebar-accent"
                      }
                      asChild
                    >
                      <Link href={`/${lng}${item.url}`} onClick={handleLinkClick}>
                        {item.icon && <item.icon />}
                        <span>{t(item.title)}</span>
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

function CollapsedNav({ items, lng, t }: NavMainProps & { t: (key: string) => string }) {
    const path = usePathname();
    const pathWithoutLng = path.replace(`/${lng}`, "") || "/";

    return (
        <>
        {items.map(group => (
            <SidebarGroup key={group.id}>
                {group.label && <SidebarGroupLabel>{t(group.label)}</SidebarGroupLabel>}
                <SidebarGroupContent>
                    <SidebarMenu>
                    {group.items.map(item => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                tooltip={t(item.title)}
                                isActive={pathWithoutLng === item.url || (item.subItems?.some(sub => pathWithoutLng.startsWith(sub.url)) ?? false)}
                                asChild
                            >
                                <Link href={`/${lng}${item.url === '#' ? (item.subItems?.[0]?.url ?? '#') : item.url}`}>
                                    {item.icon && <item.icon/>}
                                    <span className="sr-only">{t(item.title)}</span>
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