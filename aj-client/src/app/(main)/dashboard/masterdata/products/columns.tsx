import { ColumnDef } from "@tanstack/react-table";
import { MasterProduct } from "@/types/master-product";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ChevronRight, ChevronDown, BookText, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const createMasterProductColumns = ({ onEdit, onDelete, onToggleExpand }: {
  onEdit: (product: MasterProduct) => void;
  onDelete: (product: MasterProduct) => void;
  onToggleExpand: (id: string) => void;
}): ColumnDef<MasterProduct>[] => [
  {
    accessorKey: "name",
    header: "Ürün Adı / Hiyerarşi",
    cell: ({ row }) => {
      const product = row.original;
      
      const isParent = !product.parentProductId;
      const hasChildren = isParent && !!product.subProducts?.length;
      const isExpanded = product.isExpanded ?? false;

      // Ana Ürün için: pl-4, Alt Ürün için: pl-10 (girinti)
      const indentClass = isParent ? "pl-4 font-semibold" : "pl-10 text-muted-foreground font-normal italic"; 
      
      const toggleButton = (isParent && hasChildren) ? (
        <Button 
          variant="ghost" 
          size="icon" 
          className="size-6 p-0 mr-2 shrink-0"
          onClick={() => onToggleExpand(product.id)} 
        >
          {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </Button>
      ) : (
         <div className={cn(isParent ? "size-6 mr-2 shrink-0" : "size-2 mr-2 shrink-0")} />
      );

      const icon = isParent ? <Package className="size-4 text-primary mr-1" /> : <BookText className="size-4 text-muted-foreground mr-1" />;

      return (
        <div className={cn("flex items-center space-x-1", indentClass)}>
          {toggleButton}
          {icon}
          <span className="truncate">{product.name}</span>
        </div>
      );
    },
    accessorFn: row => row.name,
  },
  {
    accessorKey: "code",
    header: "Ürün Kodu",
    cell: ({ row }) => {
        const isParent = !row.original.parentProductId;
        return (
            <Badge 
                variant={isParent ? "default" : "outline"} 
                className={cn("uppercase", isParent ? "font-semibold" : "font-normal")}
            >
                {row.original.code}
            </Badge>
        );
    }
  },
  {
    accessorKey: "description",
    header: "Açıklama",
    cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.description || "Tanım girilmemiş."}</span>,
  },
  {
    id: "actions",
    header: "İşlemler",
    cell: ({ row }) => (
      <div className="flex justify-end space-x-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onEdit(row.original)}
        >
          <Edit className="size-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
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