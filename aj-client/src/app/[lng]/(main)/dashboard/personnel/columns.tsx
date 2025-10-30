"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Personnel } from "@/types/personnel";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { API_BASE } from "@/lib/api";
import { format } from "date-fns";
import { tr, enUS, es, ru } from "date-fns/locale";
import { Progress } from "@/components/ui/progress"; // <-- 1. YENİ İMPORT

// Dil haritası
const locales: { [key: string]: Locale } = {
  tr: tr,
  en: enUS,
  es: es,
  ru: ru,
  ar: enUS, 
};

export const createPersonnelColumns = ({
  onEdit,
  onDelete,
  t,
  lng,
}: {
  onEdit: (personnel: Personnel) => void;
  onDelete: (personnel: Personnel) => void;
  t: (key: string) => string;
  lng: string;
}): ColumnDef<Personnel>[] => [
  // Avatar ve Ad Soyad (Aynı)
  {
    accessorKey: "user.fullName",
    header: t("hr.personnel.column.fullName"),
    cell: ({ row }) => {
      const user = row.original.user;
      const fullName = user?.fullName || row.original.onxCode;
      const avatarSrc = user?.avatarUrl
        ? `${API_BASE}${user.avatarUrl}`
        : undefined;

      return (
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarSrc} alt={fullName} />
            <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{fullName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "onxCode",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("hr.personnel.column.onxCode")}
      />
    ),
  },
  {
    accessorKey: "hireDate",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("hr.personnel.column.hireDate")}
      />
    ),
    cell: ({ row }) => {
      return format(new Date(row.original.hireDate), "PPP", {
        locale: locales[lng] || enUS,
      });
    },
  },
  // Birim (Aynı)
  {
    accessorKey: "unit.departmentName",
    header: t("hr.personnel.column.unit"),
    cell: ({ row }) => {
      const unit = row.original.unit;
      if (!unit) {
        return (
          <span className="text-muted-foreground">
            {t("hr.personnel.status.noUnit")}
          </span>
        );
      }
      return `${unit.departmentName} / ${unit.unitName}`;
    },
  },

  // --- 2. YENİ SÜTUN: YETENEK ---
  {
    accessorKey: "skill.skillName",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("hr.personnel.column.skill")}
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
  // --- YENİ SÜTUN BİTTİ ---

  {
    accessorKey: "phone",
    header: t("hr.personnel.column.phone"),
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
  },
];