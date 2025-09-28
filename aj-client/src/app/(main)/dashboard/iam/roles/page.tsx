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

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetchAuth("/api/iam/roles");
      const data = await res.json();
      setRoles(data);
    } catch (error) {
      toast.error("Roller getirilirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleSuccess = () => {
    setIsAddDialogOpen(false);
    fetchRoles().then(() => {
        if(selectedRole) {
            setSelectedRole(prev => roles.find(r => r.id === prev?.id) || null);
        }
    });
  };
  
  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      await apiFetchAuth(`/api/iam/roles/${roleToDelete.id}`, { method: 'DELETE' });
      toast.success("Rol başarıyla silindi.");
      setRoleToDelete(null);
      setSelectedRole(null);
      fetchRoles();
    } catch (error) {
      toast.error("Rol silinirken bir hata oluştu.");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rol Yönetimi</h1>
          <p className="text-muted-foreground">Sistemdeki rolleri ve yetkilerini yönetin.</p>
        </div>
      </div>
      
      <ResizablePanelGroup direction="horizontal" className="rounded-lg border flex-1">
        <ResizablePanel defaultSize={30} minSize={20}>
          <div className="flex flex-col h-full">
            <div className="p-4 flex justify-between items-center border-b">
                <h2 className="font-semibold">Roller ({roles.length})</h2>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setSelectedRole(null)}>
                            <FilePlus2 className="mr-2 h-4 w-4"/>
                            Yeni Rol
                        </Button>
                    </DialogTrigger>
                    {/* YENİ CLASSNAME EKLEMESİ BURADA YAPILDI */}
                    <DialogContent className="sm:max-w-xl md:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Yeni Rol Oluştur</DialogTitle>
                            <DialogDescription>Yeni bir rol oluşturun ve yetkilerini atayın.</DialogDescription>
                        </DialogHeader>
                        <RoleForm onSuccess={handleSuccess} initialData={null} />
                    </DialogContent>
                </Dialog>
            </div>
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-4 space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                ) : (
                    roles.map(role => (
                        <button 
                            key={role.id} 
                            onClick={() => setSelectedRole(role)}
                            className={cn("w-full text-left p-4 border-b hover:bg-accent", selectedRole?.id === role.id && "bg-accent")}
                        >
                            <p className="font-medium">{role.name}</p>
                            <p className="text-xs text-muted-foreground">{role.permissions.length} yetki</p>
                        </button>
                    ))
                )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={70}>
            {selectedRole ? (
                <div className="p-6 h-full overflow-y-auto">
                    <RoleForm onSuccess={handleSuccess} initialData={selectedRole} />
                    <Button variant="destructive" className="mt-6" onClick={() => setRoleToDelete(selectedRole)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Bu Rolü Sil
                    </Button>
                </div>
            ) : (
                <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">Lütfen düzenlemek için bir rol seçin veya yeni bir rol oluşturun.</p>
                </div>
            )}
        </ResizablePanel>
      </ResizablePanelGroup>

      <AlertDialog open={!!roleToDelete} onOpenChange={() => setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              <b>{roleToDelete?.name}</b> rolünü kalıcı olarak silmek üzeresiniz. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRoleToDelete(null)}>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole}>Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}