// aj-client/src/app/[lng]/(main)/dashboard/iam/users/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { User } from "@/types/user";
import { DataTable } from "@/components/data-table/data-table";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AddUserForm } from "./add-user-form";
import { EditUserForm } from "./edit-user-form";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; 
import { getInitials } from "@/lib/utils"; 
import { API_BASE } from "@/lib/api"; 
import { useTranslation } from "@/lib/i18n-client";
import { useParams } from "next/navigation";
// createIAMUserColumns'ın columns.tsx'ten import edildiğini varsayıyoruz.
import { createIAMUserColumns } from "./columns"; 

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // YENİ STATE: Sadece silme diyalogunu yönetir.
  const [userToDelete, setUserToDelete] = useState<User | null>(null); 
  
  const { lng } = useParams() as { lng: string };
  const { t, ready } = useTranslation(lng, 'common');

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetchAuth("/api/iam/users");
      const data = await res.json();
      setUsers(data);
    } catch (error: any) { // KRİTİK DÜZELTME: Hata tipini 'any' olarak zorladık
      toast.error(t("iam.user.toast.fetchError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if(ready) {
        fetchUsers();
    }
  }, [ready, t]);

  const handleSuccess = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedUser(null);
    fetchUsers();
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };
  
  // YENİ FONKSİYON: Silme diyalogunu açar.
  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
  }
  
  const handleDeleteUser = async (userId: string) => {
    const username = userToDelete?.fullName || userId;
    try {
      await apiFetchAuth(`/api/iam/users/${userId}`, { method: 'DELETE' });
      toast.success(t("iam.user.toast.deleteSuccess"));
      fetchUsers();
    } catch (error: any) { // KRİTİK DÜZELTME: Hata tipini 'any' olarak zorladık
      toast.error(t("iam.user.toast.deleteFailed"), { description: error.message });
    } finally {
      setUserToDelete(null); 
    }
  };

  // Avatar kolonu, page.tsx'in içinden taşınmış olmalıydı, bu nedenle bu kısmı page.tsx'e geri getirelim
  const AvatarColumn: ColumnDef<User> = {
    id: "avatar",
    header: "", 
    cell: ({ row }) => {
      const user = row.original;
      const avatarSrc = user.avatarUrl ? `${API_BASE}${user.avatarUrl}` : undefined;
      return (
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatarSrc} alt={user.fullName} />
          <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
        </Avatar>
      );
    },
    size: 32,
  };

  const DeleteConfirmationDialog = ({ user }: { user: User }) => (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{t('iam.user.deleteDialogTitle')}</AlertDialogTitle>
        <AlertDialogDescription>
          <b className="font-semibold">{user.fullName}</b> {t('iam.user.deleteDialogText')}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{t('iam.user.cancelButton')}</AlertDialogCancel>
        <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>{t('iam.user.deleteButton')}</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );

  const columns = useMemo<ColumnDef<User>[]>(() => [AvatarColumn, ...createIAMUserColumns({ 
    openEditDialog: openEditDialog, 
    openDeleteDialog: openDeleteDialog, 
    t: t 
  })], [t]);

  const table = useDataTableInstance({ data: users, columns });

  if (!ready || isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('iam.user.pageTitle')}</h1>
          <p className="text-muted-foreground">{t('iam.user.pageDescription')}</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>{t('iam.user.addNewButton')}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('iam.user.addDialogTitle')}</DialogTitle>
              <DialogDescription>
                {t('iam.user.addDialogDescription')}
              </DialogDescription>
            </DialogHeader>
            <AddUserForm onSuccess={handleSuccess} lng={lng} /> 
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <DataTable table={table} columns={columns} />
      </div>
      
      <DataTablePagination table={table} />

      {/* KRİTİK DÜZELTME: Kullanıcı Düzenleme Diyaloğu (selectedUser var VE düzenleme açık) */}
      {selectedUser && isEditDialogOpen && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('iam.user.editDialogTitle')}</DialogTitle>
              <DialogDescription>{selectedUser.fullName} {t('iam.user.editDialogDescription')}</DialogDescription>
            </DialogHeader>
            <EditUserForm user={selectedUser} onSuccess={handleSuccess} lng={lng} /> 
          </DialogContent>
        </Dialog>
      )}

      {/* KRİTİK DÜZELTME: Silme Onayı Diyaloğu (Sadece userToDelete varsa açılır) */}
      {userToDelete && (
        <AlertDialog open={true} onOpenChange={() => setUserToDelete(null)}>
          {DeleteConfirmationDialog({ user: userToDelete })}
        </AlertDialog>
      )}
    </div>
  );
}