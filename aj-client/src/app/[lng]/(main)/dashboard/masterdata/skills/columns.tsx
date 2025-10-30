"use client";

import { ColumnDef } from "@tanstack/react-table";
import { SkillDefinition } from "@/types/skill-definition";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Progress } from "@/components/ui/progress"; // Progress bar eklendi

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
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.skill.column.skillName")}
      />
    ),
  },
  {
    accessorKey: "targetExperiencePercent",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("masterdata.skill.column.targetExperiencePercent")}
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