"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Personnel } from "@/types/personnel";
import { UnitDefinition } from "@/types/unit-definition";
import { createPersonnelColumns } from "./columns";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, FileDown } from "lucide-react";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { PersonnelForm } from "./personnel-form";
import { useTranslation } from "@/lib/i18n-client";
import { useParams } from "next/navigation";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";

import { ColumnFiltersState } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Page() {
  const [data, setData] = useState<Personnel[]>([]);
  const [units, setUnits] = useState<UnitDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Personnel | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Personnel | null>(null);

  const { lng } = useParams() as { lng: string };
  const { t, ready } = useTranslation(lng, "common");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [personnelRes, unitsRes] = await Promise.all([
        apiFetchAuth("/api/hr/personnel"),
        apiFetchAuth("/api/masterdata/units"),
      ]);
      
      const personnelData: Personnel[] = await personnelRes.json();
      const unitsData: UnitDefinition[] = await unitsRes.json();
      
      setData(personnelData);
      setUnits(unitsData);
    } catch (error) {
      toast.error(t("hr.personnel.toast.fetchError"));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (ready) {
      fetchData();
    }
  }, [ready, fetchData]);

  const handleEdit = useCallback((item: Personnel) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback((item: Personnel) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;
    try {
      await apiFetchAuth(`/api/hr/personnel/${itemToDelete.id}`, {
        method: "DELETE",
      });
      toast.success(t("hr.personnel.toast.deleteSuccess"));
      fetchData();
    } catch (e: any) {
      toast.error(t("hr.personnel.toast.deleteError"), {
        description: e.message,
      });
    } finally {
      setItemToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  }, [itemToDelete, t, fetchData]);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedItem(null);
    fetchData();
  };

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);
  
  const handleUnitFilterChange = (value: string, isChecked: boolean) => {
    const currentFilters = table.getState().columnFilters;
    const filter = currentFilters.find((f) => f.id === "unitDefinitionId");
    let newValues: string[] = [];

    if (filter) {
      newValues = (filter.value as string[]) || [];
    }

    if (isChecked) {
      newValues = [...newValues, value];
    } else {
      newValues = newValues.filter((v) => v !== value);
    }

    const otherFilters = currentFilters.filter((f) => f.id !== "unitDefinitionId");

    if (newValues.length > 0) {
      table.setColumnFilters([
        ...otherFilters,
        { id: "unitDefinitionId", value: newValues },
      ]);
    } else {
      table.setColumnFilters(otherFilters);
    }
  };

  const unitMap = useMemo(() => {
    const map = new Map<string, UnitDefinition>();
    const allUnitsFlat: UnitDefinition[] = [];
    const flatten = (unitList: UnitDefinition[]) => {
      for (const unit of unitList) {
        allUnitsFlat.push(unit);
        if (unit.subUnits) {
          flatten(unit.subUnits);
        }
      }
    };
    flatten(units);
    
    for (const unit of allUnitsFlat) {
      map.set(unit.id, unit);
    }
    return map;
  }, [units]);

  const columns = useMemo(
    () =>
      createPersonnelColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        t: t,
        lng: lng,
        unitMap: unitMap,
      }),
    [handleEdit, handleDelete, t, lng, unitMap]
  );

  const table = useDataTableInstance({
    data: data,
    columns: columns,
    state: {
      globalFilter: globalFilter,
      columnFilters: columnFilters,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
  });

  const filterValues =
    (table.getColumn("unitDefinitionId")?.getFilterValue() as string[]) || [];
    
  const departments = useMemo(() => units.filter(u => !u.parentUnitId), [units]);


  if (isLoading || !ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
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
              {t("sidebar.modules.humanResources")}
            </span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {t("hr.personnelManagement.title")}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            {/* Sol Taraf */}
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">
                {t("hr.personnelManagement.title")}
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-2.5 py-1 text-sm">
                  <strong className="mr-1.5 font-semibold">
                    {t("datatable.total", "Toplam")}
                  </strong>
                  {data.length}
                </Badge>
                
                {/* DÜZELTME: Fazladan Dialog Wrapper kaldırıldı, sadece buton bırakıldı */}
                <Button 
                  onClick={() => {
                    setSelectedItem(null);
                    setIsFormOpen(true);
                  }} 
                  size="sm" 
                  className="h-8"
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  {t("datatable.add_new", "Yeni")}
                </Button>

              </div>
            </div>

            {/* Sağ Taraf: Aksiyonlar */}
            <div className="flex w-full sm:w-auto items-center gap-2">
              {isSearchOpen ? (
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    placeholder={t("hr.personnel.searchPlaceholder")}
                    value={globalFilter ?? ""}
                    onChange={(event) => setGlobalFilter(event.target.value)}
                    onBlur={() => {
                      if (globalFilter === "") {
                        setIsSearchOpen(false);
                      }
                    }}
                    className="h-9 pl-8 w-full"
                  />
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setIsSearchOpen(true)}
                  aria-label={t("hr.personnel.searchPlaceholder")}
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="mr-2 h-4 w-4" />
                    {t("datatable.filter", "Filtrele")}
                    {filterValues.length > 0 && (
                      <Badge variant="secondary" className="ml-2 rounded-full px-1.5">
                        {filterValues.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
                  <DropdownMenuLabel>
                    {t("hr.personnel.column.unit")}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {departments.map(dept => (
                    <div key={dept.id} className="px-2 py-1">
                      <h4 className="text-xs font-semibold text-muted-foreground mb-1 px-2">{dept.name}</h4>
                      <DropdownMenuCheckboxItem
                        key={dept.id}
                        checked={filterValues.includes(dept.id)}
                        onCheckedChange={(isChecked) =>
                          handleUnitFilterChange(dept.id, isChecked)
                        }
                      >
                        {dept.name} (Departman Geneli)
                      </DropdownMenuCheckboxItem>
                      {dept.subUnits && dept.subUnits.map(unit => (
                        <DropdownMenuCheckboxItem
                          key={unit.id}
                          checked={filterValues.includes(unit.id)}
                          onCheckedChange={(isChecked) =>
                            handleUnitFilterChange(unit.id, isChecked)
                          }
                          className="pl-6"
                        >
                          {unit.name}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </div>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={filterValues.length === 0}
                    onClick={() => table.setColumnFilters([])}
                    className="text-destructive focus:text-destructive"
                  >
                    {t("datatable.clear_filters", "Filtreleri Temizle")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <FileDown className="mr-2 h-4 w-4" />
                    {t("datatable.export", "Dışa Aktar")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    {t("datatable.exportPdf", "PDF olarak aktar")}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    {t("datatable.exportExcel", "Excel olarak aktar")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="rounded-t-none border-t">
            <DataTable table={table} columns={columns} />
          </div>
        </CardContent>

        <CardFooter className="p-4 sm:p-6 border-t">
          <DataTablePagination table={table} t={t} />
        </CardFooter>
      </Card>

      {/* 5. MODALLAR */}
      {isFormOpen && (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedItem
                  ? t("hr.personnel.dialogTitleEdit")
                  : t("hr.personnel.dialogTitleNew")}
              </DialogTitle>
              <DialogDescription>
                {selectedItem
                  ? t("hr.personnel.dialogDescriptionEdit")
                  : t("hr.personnel.dialogDescriptionNew")}
              </DialogDescription>
            </DialogHeader>
            <PersonnelForm
              initialData={selectedItem}
              onSuccess={handleFormSuccess}
              lng={lng}
            />
          </DialogContent>
        </Dialog>
      )}

      {itemToDelete && (
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("hr.personnel.deleteDialogTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                <b>{itemToDelete?.user?.fullName || itemToDelete?.onxCode}</b>{" "}
                {t("hr.personnel.deleteDialogText")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setItemToDelete(null)}>
                {t("masterdata.product.cancelButton")}
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>
                {t("masterdata.product.deleteButton")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}