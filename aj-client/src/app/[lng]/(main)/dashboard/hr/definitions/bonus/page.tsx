"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { BonusDefinition } from "@/types/bonus-definition";
import { createBonusColumns } from "./columns";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BonusDefinitionForm } from "./bonus-definition-form";
import { useTranslation } from "@/lib/i18n-client";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function BonusDefinitionsPage() {
  const [data, setData] = useState<BonusDefinition[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BonusDefinition | null>(null);
  const { lng } = useParams() as { lng: string };
  const { t, ready } = useTranslation(lng, "common");

  const fetchData = useCallback(async () => {
    try {
      const res = await apiFetchAuth("/api/hr/bonus-definitions");
      setData(await res.json());
    } catch (error) {
      toast.error("Liste alınamadı");
    }
  }, []);

  useEffect(() => { if (ready) fetchData(); }, [ready, fetchData]);

  const handleSuccess = () => { setIsFormOpen(false); setSelectedItem(null); fetchData(); };

  const columns = useMemo(() => createBonusColumns({
    onEdit: (item) => { setSelectedItem(item); setIsFormOpen(true); },
    onDelete: async (item) => {
      if(!confirm("Silmek istediğinize emin misiniz?")) return;
      await apiFetchAuth(`/api/hr/bonus-definitions/${item.id}`, { method: "DELETE" });
      fetchData();
    },
    t
  }), [t, fetchData]);

  const table = useDataTableInstance({ data, columns });

  if (!ready) return null;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href={`/${lng}/dashboard/default`}>{t("sidebar.managementPanel.home")}</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><span className="text-sm font-medium">{t("sidebar.modules.humanResources")}</span></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{t("hr.bonus.pageTitle")}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-6">
          <h2 className="text-lg font-semibold">{t("hr.bonus.pageTitle")}</h2>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedItem(null)} size="sm"><Plus className="mr-2 h-4 w-4"/>{t("datatable.add_new")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{selectedItem ? t("hr.bonus.editTitle") : t("hr.bonus.newTitle")}</DialogTitle></DialogHeader>
              <BonusDefinitionForm initialData={selectedItem} onSuccess={handleSuccess} lng={lng} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0 border-t">
          <DataTable table={table} columns={columns} />
        </CardContent>
      </Card>
    </div>
  );
}