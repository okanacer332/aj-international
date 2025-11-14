"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Personnel } from "@/types/personnel";
import { UnitDefinition } from "@/types/unit-definition";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // YENİ IMPORT
import { getInitials } from "@/lib/utils"; // YENİ IMPORT
import { API_BASE } from "@/lib/api"; // YENİ IMPORT
import { format } from "date-fns";
import { tr, enUS, es, ru } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";

const locales: { [key: string]: Locale } = {
  tr: tr,
  en: enUS,
  es: es,
  ru: ru,
  ar: enUS,
};

// --- YENİ AVATAR SÜTUNU ---
const AvatarColumn: ColumnDef<Personnel> = {
  id: "avatar",
  header: "", // Başlık göstermeye gerek yok
  cell: ({ row }) => {
    const user = row.original.user; // Personnel'e bağlı User objesi
    const fullName = user?.fullName || row.original.onxCode;
    const avatarSrc = user?.avatarUrl
      ? `${API_BASE}${user.avatarUrl}`
      : undefined;

    return (
      <Avatar className="h-8 w-8">
        <AvatarImage src={avatarSrc} alt={fullName} />
        <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
      </Avatar>
    );
  },
  size: 40, // Sütun genişliği
  enableSorting: false,
  enableHiding: false,
};
// --- YENİ SÜTUN SONU ---

export const createPersonnelColumns = ({
  onEdit,
  onDelete,
  t,
  lng,
  unitMap,
}: {
  onEdit: (personnel: Personnel) => void;
  onDelete: (personnel: Personnel) => void;
  t: (key: string) => string;
  lng: string;
  unitMap: Map<string, UnitDefinition>;
}): ColumnDef<Personnel>[] => [
  // --- YENİ SÜTUN BURAYA EKLENDİ ---
  AvatarColumn,
  // ---
  {
    accessorKey: "user.fullName",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("hr.personnel.column.fullName")}
        t={t}
      />
    ),
    cell: ({ row }) => {
      const user = row.original.user;
      const fullName = user?.fullName || row.original.onxCode;
      
      // Avatar zaten ayrı sütunda, buradan kaldırıyoruz
      // Sadece ismi gösteriyoruz
      return (
         <span className="font-medium">{fullName}</span>
      );
    },
    filterFn: (row, id, value) => {
      const user = row.original.user;
      const fullName = user?.fullName || "";
      return fullName.toLowerCase().includes(String(value).toLowerCase());
    },
  },
  {
    accessorKey: "onxCode",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("hr.personnel.column.onxCode")}
        t={t}
      />
    ),
  },
  {
    accessorKey: "hireDate",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("hr.personnel.column.hireDate")}
        t={t}
      />
    ),
    cell: ({ row }) => {
      return format(new Date(row.original.hireDate), "PPP", {
        locale: locales[lng] || enUS,
      });
    },
  },
  {
    accessorKey: "unitDefinitionId",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("hr.personnel.column.unit")}
        t={t}
      />
    ),
    cell: ({ row }) => {
      const unitId = row.original.unitDefinitionId;
      const unit = unitMap.get(unitId); 

      if (!unit) {
        return (
          <span className="text-muted-foreground">
            {t("hr.personnel.status.noUnit")}
          </span>
        );
      }

      const parentUnit = unit.parentUnitId ? unitMap.get(unit.parentUnitId) : null;

      if (parentUnit) {
        return `${parentUnit.name} / ${unit.name}`;
      } else {
        return unit.name;
      }
    },
    filterFn: (row, id, value: string[]) => {
      const unitId = row.original.unitDefinitionId;
      return value.includes(unitId);
    },
  },
  {
    accessorKey: "skill.skillName",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("hr.personnel.column.skill")}
        t={t}
      />
    ),
    cell: ({ row }) => {
      const skill = row.original.skill;
      if (!skill) {
        return (
          <span className="text-muted-foreground">
            {t("hr.personnel.status.noSkill")}
          </span>
        );
      }
      return (
        <div className="flex flex-col space-y-1 min-w-[150px]">
          <span className="font-medium">{skill.skillName}</span>
          <div className="flex items-center space-x-2">
            <Progress
              value={skill.targetExperiencePercent}
              className="w-2/3"
            />
            <span className="font-medium text-muted-foreground text-xs w-1/3 text-right">
              %{skill.targetExperiencePercent}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("hr.personnel.column.phone")}
        t={t}
      />
    ),
  },
  {
    id: "actions",
    header: () => (
      <div className="text-right">{t("masterdata.unit.column.actions")}</div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-end space-x-1">
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          onClick={() => onEdit(row.original)}
        >
          <Edit className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          onClick={() => onDelete(row.original)}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];