// aj-client/src/app/[lng]/(main)/dashboard/iam/roles/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Role } from "@/types/role";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { RoleForm } from "./role-form";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { FilePlus2, Trash2 } from "lucide-react";
// YENİ IMPORTLAR: i18n ve lng için
import { useTranslation } from "@/lib/i18n-client";
import { useParams } from "next/navigation";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  // KRİTİK DEĞİŞİKLİK: i18n Hook'ları eklendi
  const { lng } = useParams() as { lng: string };
  const { t, ready } = useTranslation(lng, 'common');

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetchAuth("/api/iam/roles");
      const data = await res.json();
      setRoles(data);
    } catch (error: any) {
      // ÇEVİRİ: Hata mesajı
      toast.error(t("iam.role.toast.fetchError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (ready) {
      fetchRoles();
    }
  }, [ready, t]);

  const handleSuccess = () => {
    setIsAddDialogOpen(false);
    fetchRoles().then(() => {
        // Yeni rol ID'si kaybolmasın diye fetch sonrası güncelliyoruz
        if(selectedRole) {
            setSelectedRole(prev => roles.find(r => r.id === prev?.id) || null);
        }
    });
  };
  
  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      await apiFetchAuth(`/api/iam/roles/${roleToDelete.id}`, { method: 'DELETE' });
      // ÇEVİRİ: Başarı mesajı
      toast.success(t("iam.role.toast.deleteSuccess"));
      setRoleToDelete(null);
      setSelectedRole(null);
      fetchRoles();
    } catch (error: any) {
       // ÇEVİRİ: Hata mesajı
      toast.error(t("iam.role.toast.deleteFailed"), { description: error.message });
    }
  };

  if (!ready || isLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between pb-4">
        <div>
          {/* ÇEVİRİ: Ana Başlık */}
          <h1 className="text-2xl font-bold tracking-tight">{t('iam.role.pageTitle')}</h1>
          {/* ÇEVİRİ: Açıklama */}
          <p className="text-muted-foreground">{t('iam.role.pageDescription')}</p>
        </div>
      </div>
      
      <ResizablePanelGroup direction="horizontal" className="rounded-lg border flex-1">
        <ResizablePanel defaultSize={30} minSize={20}>
          <div className="flex flex-col h-full">
            <div className="p-4 flex justify-between items-center border-b">
                {/* ÇEVİRİ: Rol Listesi Başlığı */}
                <h2 className="font-semibold">{t('iam.role.listTitle')} ({roles.length})</h2>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setSelectedRole(null)}>
                            <FilePlus2 className="mr-2 h-4 w-4"/>
                            {/* ÇEVİRİ: Buton Metni */}
                            {t('iam.role.addNewButton')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl md:max-w-2xl max-h-[90dvh] overflow-y-auto">
                        <DialogHeader>
                            {/* ÇEVİRİ: Diyalog Başlığı */}
                            <DialogTitle>{t('iam.role.addDialogTitle')}</DialogTitle>
                            {/* ÇEVİRİ: Diyalog Açıklaması */}
                            <DialogDescription>{t('iam.role.addDialogDescription')}</DialogDescription>
                        </DialogHeader>
                        <RoleForm onSuccess={handleSuccess} initialData={null} lng={lng} /> {/* lng prop'u eklendi */}
                    </DialogContent>
                </Dialog>
            </div>
            <div className="flex-1 overflow-y-auto">
                {/* Rol Listesi Map Kısmı */}
                {!isLoading && roles.map(role => (
                    <button 
                        key={role.id} 
                        onClick={() => setSelectedRole(role)}
                        className={cn("w-full text-left p-4 border-b hover:bg-accent", selectedRole?.id === role.id && "bg-accent")}
                    >
                        <p className="font-medium">{role.name}</p>
                        {/* ÇEVİRİ: Yetki Sayısı Metni */}
                        <p className="text-xs text-muted-foreground">{role.permissions.length} {t('iam.role.permissionCountText')}</p>
                    </button>
                ))}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={70}>
            {selectedRole ? (
                <div className="p-6 h-full overflow-y-auto">
                    {/* RoleForm'a lng prop'u eklendi */}
                    <RoleForm onSuccess={handleSuccess} initialData={selectedRole} lng={lng} /> 
                    <Button variant="destructive" className="mt-6" onClick={() => setRoleToDelete(selectedRole)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        {/* ÇEVİRİ: Silme Butonu */}
                        {t('iam.role.deleteRoleButton')}
                    </Button>
                </div>
            ) : (
                <div className="flex h-full items-center justify-center">
                    {/* ÇEVİRİ: Yer Tutucu Metin */}
                    <p className="text-muted-foreground">{t('iam.role.placeholderSelect')}</p>
                </div>
            )}
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Silme Onayı Diyaloğu */}
      <AlertDialog open={!!roleToDelete} onOpenChange={() => setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            {/* ÇEVİRİ: Silme Başlığı */}
            <AlertDialogTitle>{t('iam.role.deleteDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {/* ÇEVİRİ: Silme Açıklaması */}
              <b>{roleToDelete?.name}</b> {t('iam.role.deleteDialogText')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {/* ÇEVİRİ: İptal Butonu */}
            <AlertDialogCancel onClick={() => setRoleToDelete(null)}>{t('iam.role.cancelButton')}</AlertDialogCancel>
            {/* ÇEVİRİ: Silme Aksiyonu */}
            <AlertDialogAction onClick={handleDeleteRole}>{t('iam.role.deleteButton')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}