"use client";

import { useEffect, useState } from "react";
import { User } from "@/types/user";
import { columns } from "./columns";
import { DataTable } from "@/components/data-table/data-table";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddUserForm } from "./add-user-form"; // Yeni formu import et

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const table = useDataTableInstance({
    data: users,
    columns,
  });
  
  const handleUserAdded = () => {
    setIsDialogOpen(false); // Dialog'u kapat
    fetchUsers(); // Kullanıcı listesini yenile
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kullanıcı Yönetimi</h1>
          <p className="text-muted-foreground">Sistemdeki kullanıcıları yönetin ve yeni kullanıcılar oluşturun.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
            <AddUserForm onSuccess={handleUserAdded} />
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
    </div>
  );
}