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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // YENİ IMPORT
import { getInitials } from "@/lib/utils"; // YENİ IMPORT
import { API_BASE } from "@/lib/api"; // YENİ IMPORT

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetchAuth("/api/iam/users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      toast.error("Kullanıcılar getirilirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
  
  const handleDeleteUser = async (userId: string) => {
    try {
      await apiFetchAuth(`/api/iam/users/${userId}`, { method: 'DELETE' });
      toast.success("Kullanıcı başarıyla silindi.");
      fetchUsers();
    } catch (error) {
      toast.error("Kullanıcı silinirken bir hata oluştu.");
    }
  };

  const columns = useMemo<ColumnDef<User>[]>(() => [
    // YENİ EKLENEN FOTOĞRAF SÜTUNU
    {
      id: "avatar",
      header: "", // Başlık boş olacak
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
      size: 32, // Sütun genişliğini ayarla
    },
    { accessorKey: "fullName", header: "Ad Soyad" },
    { accessorKey: "username", header: "Kullanıcı Adı" },
    { accessorKey: "email", header: "Email", cell: ({ row }) => row.getValue("email") || "---" },
    { accessorKey: "roleIds", header: "Roller", cell: ({ row }) => {
        const roleIds = row.getValue("roleIds") as string[] | undefined;
        if (!roleIds || roleIds.length === 0) return <span className="text-muted-foreground">Rol Atanmamış</span>;
        return <div className="flex flex-wrap gap-1">{roleIds.map((roleId) => <Badge key={roleId} variant="outline">{roleId}</Badge>)}</div>;
    }},
    { accessorKey: "active", header: "Durum", cell: ({ row }) => <Badge variant={row.getValue("active") ? "secondary" : "destructive"}>{row.getValue("active") ? "Aktif" : "Pasif"}</Badge> },
    { id: "actions", cell: ({ row }) => (
        <div className="text-right">
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => openEditDialog(row.original)}>Düzenle</DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors w-full justify-start font-normal text-destructive hover:bg-destructive/10 focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">Sil</Button>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Emin misiniz?</AlertDialogTitle><AlertDialogDescription><b>{row.original.fullName}</b> adlı kullanıcıyı kalıcı olarak silmek üzeresiniz. Bu işlem geri alınamaz.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDeleteUser(row.original.id)}>Sil</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
    )},
  ], []);

  const table = useDataTableInstance({ data: users, columns });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kullanıcı Yönetimi</h1>
          <p className="text-muted-foreground">Sistemdeki kullanıcıları yönetin ve yeni kullanıcılar oluşturun.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>Yeni Kullanıcı Ekle</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Yeni Kullanıcı Oluştur</DialogTitle>
              <DialogDescription>
                Yeni kullanıcı için bilgileri girin. Varsayılan şifre "1234" olarak atanacaktır.
              </DialogDescription>
            </DialogHeader>
            <AddUserForm onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <div className="rounded-md border">
          <DataTable table={table} columns={columns} />
        </div>
      )}
      
      {!isLoading && <DataTablePagination table={table} />}

      {selectedUser && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Kullanıcıyı Düzenle</DialogTitle>
              <DialogDescription>{selectedUser.fullName} kullanıcısının bilgilerini güncelleyin.</DialogDescription>
            </DialogHeader>
            <EditUserForm user={selectedUser} onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}