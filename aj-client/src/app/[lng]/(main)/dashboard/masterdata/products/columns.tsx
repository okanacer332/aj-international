import { ColumnDef, Row } from "@tanstack/react-table"; // Row eklendi
import { MasterProduct } from "@/types/master-product";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ChevronRight, ChevronDown, BookText, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Interface'e level ekleyelim (flattenProducts'tan gelecek)
interface HierarchicalMasterProduct extends MasterProduct {
    level: number; // Hiyerarşi derinliği
}

// createMasterProductColumns fonksiyonu artık HierarchicalMasterProduct tipini bekliyor
export const createMasterProductColumns = ({ onEdit, onDelete, onToggleExpand, t }: {
  onEdit: (product: MasterProduct) => void;
  onDelete: (product: MasterProduct) => void;
  onToggleExpand: (id: string) => void;
  t: (key: string) => string;
}): ColumnDef<HierarchicalMasterProduct>[] => [ // Tip MasterProduct'tan HierarchicalMasterProduct'a değişti
  {
    accessorKey: "name",
    header: t('masterdata.product.column.name'),
    cell: ({ row }: { row: Row<HierarchicalMasterProduct> }) => { // row tipi güncellendi
      const product = row.original;
      const level = product.level ?? 0; // level bilgisini al (varsayılan 0)

      // ÖNEMLİ: Alt ürünleri olup olmadığını kontrol etmek için orijinal hiyerarşik veriye
      // (subProducts) bakmamız gerekiyor. Düzleştirilmiş listede bu bilgi kaybolur.
      // Bu nedenle `page.tsx`de `masterProducts` state'ini kullanarak kontrol edeceğiz
      // veya `flattenProducts` fonksiyonu `hasChildren` gibi bir flag ekleyebilir.
      // Şimdilik `product.subProducts`'ın hala mevcut olduğunu varsayalım (bu page.tsx'deki mantığa bağlı).
      // Eğer page.tsx'deki flatData'da subProducts yoksa, bu kontrol çalışmaz.
      // Geçici çözüm: Backend'den gelen veride subProducts varsa kontrolü
      const hasChildren = !!product.subProducts && product.subProducts.length > 0;
      const isExpanded = product.isExpanded ?? false; // isExpanded flag'i flattenProducts'tan gelmeli

      // Girintiyi dinamik olarak hesapla (level * boşluk + temel boşluk)
      const indentPadding = `${level * 1.5 + 1}rem`; // Tailwind pl-* yerine style kullanmak daha esnek

      // Açma/Kapama butonu, sadece alt ürünleri varsa gösterilir
      const toggleButton = hasChildren ? (
        <Button
          variant="ghost"
          size="icon"
          className="size-6 p-0 mr-2 shrink-0" // mr-2 kalsın
          onClick={(e) => {
            e.stopPropagation(); // Satırın kendi tıklama olayını tetiklemesin
            onToggleExpand(product.id);
          }}
          aria-label={isExpanded ? t('masterdata.product.aria.collapse') : t('masterdata.product.aria.expand')}
        >
          {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </Button>
      ) : (
         // Alt ürünü olmayanlar veya en alt seviyedekiler için boşluk bırak
         <div className="size-6 mr-2 shrink-0" />
      );

      // İkonu belirle: Alt ürünleri varsa Paket, yoksa Kitap ikonu
      const icon = hasChildren ? <Package className="size-4 text-primary mr-1" /> : <BookText className="size-4 text-muted-foreground mr-1" />;

      return (
        <div
            className={cn(
                "flex items-center space-x-1",
                 level > 0 ? "text-muted-foreground font-normal italic" : "font-semibold" // Kök olmayanları italik yap
            )}
            style={{ paddingLeft: indentPadding }} // Dinamik padding
        >
          {toggleButton}
          {icon}
          <span className="truncate">{product.name}</span>
        </div>
      );
    },
    // accessorFn: row => row.name, // Bu gerekli değil, accessorKey yeterli
  },
  {
    accessorKey: "code",
    header: t('masterdata.product.column.code'),
    cell: ({ row }: { row: Row<HierarchicalMasterProduct> }) => { // row tipi güncellendi
        // Kod rozetini seviyeye göre stilize edebiliriz (opsiyonel)
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
    header: t('masterdata.product.column.description'),
    cell: ({ row }: { row: Row<HierarchicalMasterProduct> }) => // row tipi güncellendi
        <span className="text-muted-foreground text-sm">{row.original.description || t('masterdata.product.noDescription')}</span>,
  },
  {
    id: "actions",
    header: t('masterdata.product.column.actions'),
    cell: ({ row }: { row: Row<HierarchicalMasterProduct> }) => ( // row tipi güncellendi
      <div className="flex justify-end space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => { e.stopPropagation(); onEdit(row.original); }}
          aria-label={t('masterdata.product.aria.edit')}
        >
          <Edit className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => { e.stopPropagation(); onDelete(row.original); }}
          aria-label={t('masterdata.product.aria.delete')}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];