// aj-client/src/app/[lng]/(main)/dashboard/iam/roles/page.tsx
"use client";

import { useEffect, useState, useMemo, useRef } from "react"; // useRef ve useMemo eklendi
import { Role } from "@/types/role";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RoleForm } from "./role-form";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { FilePlus2, Trash2, Search, Plus } from "lucide-react"; // Search ve Plus eklendi
import { useTranslation } from "@/lib/i18n-client";
import { useParams } from "next/navigation";

// YENİ İMPORTLAR
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  // YENİ STATE'LER: Arama/Filtreleme için
  const [searchFilter, setSearchFilter] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { lng } = useParams() as { lng: string };
  const { t, ready } = useTranslation(lng, "common");

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetchAuth("/api/iam/roles");
      const data = await res.json();
      setRoles(data);
    } catch (error: any) {
      toast.error(t("iam.role.toast.fetchError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (ready) {
      fetchRoles();
    }
  }, [ready, t]); // t bağımlılığı eklendi

  const handleSuccess = () => {
    setIsAddDialogOpen(false);
    // Formu kapattıktan sonra seçili rolün güncel verisini listeye yansıt
    if (selectedRole) {
        fetchRoles().then(() => {
            // 'roles' state'i güncellendikten sonra, 'selectedRole'u yeni veriyle tekrar ayarla
            // Ancak 'roles' state'i hemen güncellenmeyebilir, bu yüzden filtrelenmiş listeyi kullanacağız
            // VEYA daha iyisi: 'filteredRoles' 'roles'a bağımlı olduğu için
            // 'selectedRole' state'ini güncelleyerek yeniden render tetikleyebiliriz.
            // En temizi: 'fetchRoles' sonrası 'selectedRole'u null yapmak
            // setSelectedRole(null); // veya güncel veriyi bul
             const updatedRole = roles.find(r => r.id === selectedRole.id);
             setSelectedRole(updatedRole || null);
        });
    } else {
         fetchRoles();
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      await apiFetchAuth(`/api/iam/roles/${roleToDelete.id}`, {
        method: "DELETE",
      });
      toast.success(t("iam.role.toast.deleteSuccess"));
      setRoleToDelete(null);
      setSelectedRole(null);
      fetchRoles();
    } catch (error: any) {
      toast.error(t("iam.role.toast.deleteFailed"), {
        description: error.message,
      });
    }
  };

  // YENİ EFFECT: Arama kutusu açıldığında focusla
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // YENİ: Soldaki listeyi filtrelemek için
  const filteredRoles = useMemo(() => {
    if (!searchFilter) {
      return roles;
    }
    return roles.filter((role) =>
      role.name.toLowerCase().includes(searchFilter.toLowerCase())
    );
  }, [roles, searchFilter]);

  if (!ready || isLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
        <Skeleton className="h-8 w-1/3" /> {/* Breadcrumb skeleton */}
        <Skeleton className="h-full w-full" /> {/* Panel skeleton */}
      </div>
    );
  }

  return (
    // YENİ: 'gap-6' eklendi
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-6">
      
      {/* 1. BREADCRUMB (YENİ) */}
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
              {t("sidebar.modules.systemManagement")}
            </span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("iam.role.pageTitle")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      {/* 2. ANA YAPI (h-[calc(100vh-8rem)] kaldırıldı, flex-1 eklendi) */}
      <ResizablePanelGroup
        direction="horizontal"
        className="rounded-lg border flex-1"
      >
        <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
          <div className="flex flex-col h-full">
            
            {/* 3. SOL PANEL KONTROL ÇUBUĞU (YENİLENDİ) */}
            <div className="p-4 border-b">
              {/* Üst Kısım: Başlık, Toplam, +Yeni */}
              <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold">
                  {t("iam.role.listTitle")}
                </h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="px-2.5 py-1 text-sm">
                    <strong className="mr-1.5 font-semibold">
                      {t("datatable.total", "Toplam")}
                    </strong>
                    {roles.length}
                  </Badge>
                  <Dialog
                    open={isAddDialogOpen}
                    onOpenChange={setIsAddDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="h-8"
                        onClick={() => setSelectedRole(null)}
                      >
                        <Plus className="mr-1.5 h-4 w-4" />
                        {t("datatable.add_new", "Yeni")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl md:max-w-2xl max-h-[90dvh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {t("iam.role.addDialogTitle")}
                        </DialogTitle>
                        <DialogDescription>
                          {t("iam.role.addDialogDescription")}
                        </DialogDescription>
                      </DialogHeader>
                      <RoleForm
                        onSuccess={handleSuccess}
                        initialData={null}
                        lng={lng}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              {/* Alt Kısım: Arama */}
              <div className="mt-4">
                {isSearchOpen ? (
                  <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={searchInputRef}
                      placeholder={t("datatable.searchRoles", "Rollerde ara...")}
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      onBlur={() => {
                        if (searchFilter === "") {
                          setIsSearchOpen(false);
                        }
                      }}
                      className="h-9 pl-8 w-full"
                    />
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-full justify-start text-muted-foreground"
                    onClick={() => setIsSearchOpen(true)}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    {t("datatable.searchRoles", "Rollerde ara...")}
                  </Button>
                )}
              </div>
            </div>
            
            {/* 4. ROL LİSTESİ (Filtrelenmiş veri kullanılıyor) */}
            <div className="flex-1 overflow-y-auto">
              {!isLoading && filteredRoles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={cn(
                    "w-full text-left p-4 border-b hover:bg-accent",
                    selectedRole?.id === role.id && "bg-accent"
                  )}
                >
                  <p className="font-medium">{role.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {role.permissions.length}{" "}
                    {t("iam.role.permissionCountText")}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* 5. SAĞ PANEL (Değişiklik yok) */}
        <ResizablePanel defaultSize={70}>
          {selectedRole ? (
            <div className="p-6 h-full overflow-y-auto">
              <RoleForm
                onSuccess={handleSuccess}
                initialData={selectedRole}
                lng={lng}
              />
              <Button
                variant="destructive"
                className="mt-6"
                onClick={() => setRoleToDelete(selectedRole)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("iam.role.deleteRoleButton")}
              </Button>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">
                {t("iam.role.placeholderSelect")}
              </p>
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Silme Onayı Diyaloğu (Değişiklik yok) */}
      <AlertDialog open={!!roleToDelete} onOpenChange={() => setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("iam.role.deleteDialogTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <b>{roleToDelete?.name}</b> {t("iam.role.deleteDialogText")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRoleToDelete(null)}>
              {t("iam.role.cancelButton")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole}>
              {t("iam.role.deleteButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}