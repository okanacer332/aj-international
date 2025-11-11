// aj-client/src/app/[lng]/(main)/dashboard/inventory/definitions/page.tsx
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n-client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// İkonları projedeki diğer modüllerden alıyoruz
import { Package, Building, Users, Truck } from "lucide-react"; 
import { useAuthStore } from "@/stores/auth-store"; // Yetki kontrolü için

export default function InventoryDefinitionsPage() {
  const { lng } = useParams() as { lng: string };
  const { t } = useTranslation(lng, "common");
  const { permissions } = useAuthStore();

  const definitionPages = [
    {
      title: t("inventory.definitions.materials.title"),
      description: t("inventory.definitions.materials.description"),
      href: `/${lng}/dashboard/inventory/definitions/materials`,
      icon: Package,
      permission: "PAGE_INVENTORY_DEFINITIONS:READ",
    },
    {
      title: t("inventory.definitions.depots.title"),
      description: t("inventory.definitions.depots.description"),
      href: `/${lng}/dashboard/inventory/definitions/depots`,
      icon: Building,
      permission: "PAGE_INVENTORY_DEFINITIONS:READ",
    },
    {
      title: t("inventory.definitions.suppliers.title"),
      description: t("inventory.definitions.suppliers.description"),
      href: `/${lng}/dashboard/inventory/definitions/suppliers`,
      icon: Truck,
      permission: "PAGE_INVENTORY_DEFINITIONS:READ",
    },
    {
      title: t("inventory.definitions.customers.title"),
      description: t("inventory.definitions.customers.description"),
      href: `/${lng}/dashboard/inventory/definitions/customers`,
      icon: Users,
      permission: "PAGE_INVENTORY_DEFINITIONS:READ",
    },
  ];

  // TODO: Gelecekte her sayfa için ayrı izin (PAGE_MATERIALS:READ vb.) gelirse burası güncellenmeli.
  // Şimdilik hepsi PAGE_INVENTORY_DEFINITIONS:READ iznine bakıyor.
  const accessiblePages = definitionPages.filter(page => permissions.has(page.permission));

  return (
    <div className="flex flex-col gap-6">
      {/* 1. BREADCRUMB */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${lng}/dashboard/default`}>
              {t("sidebar.managementPanel.home")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-sm font-medium">
              {t("sidebar.modules.inventory")}
            </span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {t("inventory.definitions.title")}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 2. HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("inventory.definitions.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("inventory.definitions.pageDescription")}
        </p>
      </div>

      {/* 3. NAVIGATION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accessiblePages.map((page) => (
          <Link href={page.href} key={page.title} className="hover:no-underline">
            <Card className="hover:border-primary/50 hover:shadow-sm transition-all h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1.5">
                  <CardTitle>{page.title}</CardTitle>
                  <CardDescription>{page.description}</CardDescription>
                </div>
                <page.icon className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}