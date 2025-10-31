"use client";

import { ColumnDef } from "@tanstack/react-table";
import { SkillDefinition } from "@/types/skill-definition";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
// 1. YENİ İMPORT: Sıralama için başlık bileşeni
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Progress } from "@/components/ui/progress";

export const createSkillDefinitionColumns = ({
  onEdit,
  onDelete,
  t,
}: {
  onEdit: (skill: SkillDefinition) => void;
  onDelete: (skill: SkillDefinition) => void;
  t: (key: string) => string;
}): ColumnDef<SkillDefinition>[] => [
  {
    accessorKey: "skillName",
    // 2. GÜNCELLEME: Başlık 'DataTableColumnHeader' ile sarıldı
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.skill.column.skillName")}
        t={t} // 't' fonksiyonu aktarıldı
      />
    ),
  },
  {
    accessorKey: "targetExperiencePercent",
    // 3. GÜNCELLEME: Başlık 'DataTableColumnHeader' ile sarıldı
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.skill.column.targetExperiencePercent")}
        t={t} // 't' fonksiyonu aktarıldı
      />
    ),
    cell: ({ row }) => {
      const percent = row.original.targetExperiencePercent;
      return (
        <div className="flex items-center space-x-2">
          <Progress value={percent} className="w-2/3" />
          <span className="font-medium text-muted-foreground w-1/3 text-right">
            %{percent}
          </span>
        </div>
      );
    },
    // 4. YENİ EKLEME: Filtreleme fonksiyonu (Aralığa göre)
    filterFn: (row, id, value: string[]) => {
      const percent = row.original.targetExperiencePercent;
      if (value.length === 0) return true;

      return value.some(range => {
        if (range === "0-49") return percent < 50;
        if (range === "50-79") return percent >= 50 && percent < 80;
        if (range === "80-100") return percent >= 80;
        return false;
      });
    },
  },
  {
    id: "actions",
    header: () => (
      <div className="text-right">{t("masterdata.skill.column.actions")}</div>
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