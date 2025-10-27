import { ColumnDef, Row } from "@tanstack/react-table";
import { MasterProduct } from "@/types/master-product";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ChevronRight, ChevronDown, BookText, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

// --- GÜNCELLEME: originalSubProducts eklendi ---
interface HierarchicalMasterProduct extends MasterProduct {
    level: number;
    originalSubProducts?: MasterProduct[]; // Bu satır eklendi
}

export const createMasterProductColumns = ({ onEdit, onDelete, onToggleExpand, t }: {
  onEdit: (product: MasterProduct) => void;
  onDelete: (product: MasterProduct) => void;
  onToggleExpand: (id: string) => void;
  t: (key: string) => string;
}): ColumnDef<HierarchicalMasterProduct>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('masterdata.product.column.name')} />
    ),
    cell: ({ row }: { row: Row<HierarchicalMasterProduct> }) => {
      const product = row.original;
      const level = product.level ?? 0;
      // originalSubProducts artık tipte tanımlı
      const hasChildren = !!product.originalSubProducts && product.originalSubProducts.length > 0;
      const isExpanded = product.isExpanded ?? false;
      const indentPadding = `${level * 1.5 + 1}rem`;

      const toggleButton = hasChildren ? (
        <Button
          variant="ghost"
          size="icon"
          className="size-6 p-0 mr-2 shrink-0"
          onClick={(e) => { e.stopPropagation(); onToggleExpand(product.id); }}
          aria-label={isExpanded ? t('masterdata.product.aria.collapse') : t('masterdata.product.aria.expand')}
        >
          {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </Button>
      ) : (
         <div className="size-6 mr-2 shrink-0" />
      );

      const icon = hasChildren ? <Package className="size-4 text-primary mr-1" /> : <BookText className="size-4 text-muted-foreground mr-1" />;

      return (
        <div
            className={cn(
                "flex items-center space-x-1",
                 level > 0 ? "text-muted-foreground font-normal italic" : "font-semibold"
            )}
            style={{ paddingLeft: indentPadding }}
        >
          {toggleButton}
          {icon}
          <span className="truncate">{product.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "code",
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('masterdata.product.column.code')} />
    ),
    cell: ({ row }: { row: Row<HierarchicalMasterProduct> }) => {
        const isRoot = (row.original.level ?? 0) === 0;
        return (
            <Badge
                variant={isRoot ? "default" : "outline"}
                className={cn("uppercase", isRoot ? "font-semibold" : "font-normal")}
            >
                {row.original.code}
            </Badge>
        );
    }
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('masterdata.product.column.description')} />
    ),
    // --- GÜNCELLEME: Açıklama için truncate eklendi ---
    cell: ({ row }: { row: Row<HierarchicalMasterProduct> }) =>
        <span className="text-muted-foreground text-sm block max-w-xs truncate" title={row.original.description}> {/* title attribute eklendi */}
            {row.original.description || t('masterdata.product.noDescription')}
        </span>,
  },
  {
    id: "actions",
    // --- GÜNCELLEME: text-right kaldırıldı ---
    header: () => <div>{t('masterdata.product.column.actions')}</div>,
    cell: ({ row }: { row: Row<HierarchicalMasterProduct> }) => (
      <div className="flex justify-end space-x-1"> {/* space-x-1 yapıldı */}
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0" // Boyut ve padding ayarlandı
          onClick={(e) => { e.stopPropagation(); onEdit(row.original); }}
          aria-label={t('masterdata.product.aria.edit')}
        >
          <Edit className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0" // Boyut ve padding ayarlandı
          onClick={(e) => { e.stopPropagation(); onDelete(row.original); }}
          aria-label={t('masterdata.product.aria.delete')}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    // --- YENİ EKLEME: Sütun genişliğini biraz küçültelim ---
    size: 80, // Piksel cinsinden genişlik (deneyerek ayarlanabilir)
  },
];