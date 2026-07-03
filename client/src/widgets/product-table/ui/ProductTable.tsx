import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { productQueries } from "@/entities/product";
import type { Product } from "@/entities/product";
import type { ProductFilters } from "@/features/product-filters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Package,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

interface ProductTableProps {
  filters: ProductFilters;
}

const ExpandableDescription = ({ text }: { text: string }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = text.length > 50;

  return (
    <div className="flex flex-col max-w-[200px] sm:max-w-[300px]">
      <span
        className={`text-xs text-muted-foreground transition-all duration-200 whitespace-normal break-words ${
          isExpanded ? "" : "line-clamp-1"
        }`}
      >
        {text}
      </span>
      {isLong && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-[10px] text-primary hover:underline w-fit mt-0.5 font-medium"
        >
          {isExpanded ? t("products.show_less") : t("products.read_more")}
        </button>
      )}
    </div>
  );
};

export function ProductTable({ filters }: ProductTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: products, isLoading } = productQueries.useAll();
  const deleteMutation = productQueries.useDelete();
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Apply all filters and sorting
  const filteredAndSortedProducts = useMemo(() => {
    if (!products) return [];

    let result = [...products];

    // Text search (name, brand, category, SKU)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.brand.name.toLowerCase().includes(searchLower) ||
          p.category.name.toLowerCase().includes(searchLower) ||
          p.variants.some((v) => v.sku.toLowerCase().includes(searchLower)),
      );
    }

    // Brand filter
    if (filters.brands.length > 0) {
      result = result.filter((p) => filters.brands.includes(p.brand.id));
    }

    // Category filter
    if (filters.categories.length > 0) {
      result = result.filter((p) => filters.categories.includes(p.category.id));
    }

    // Type filter
    if (filters.type !== "ALL") {
      result = result.filter((p) => p.type === filters.type);
    }

    // Price range filter
    if (filters.priceMin || filters.priceMax) {
      const minPrice = parseFloat(filters.priceMin) || 0;
      const maxPrice = parseFloat(filters.priceMax) || Infinity;
      result = result.filter((p) => {
        const prices = p.variants.map((v) => Number(v.sellPrice));
        const productMinPrice = Math.min(...prices);
        const productMaxPrice = Math.max(...prices);
        // Product matches if any of its prices fall within the range
        return productMaxPrice >= minPrice && productMinPrice <= maxPrice;
      });
    }

    // Variants count filter
    if (filters.variantsMin || filters.variantsMax) {
      const min = parseInt(filters.variantsMin) || 0;
      const max = parseInt(filters.variantsMax) || Infinity;
      result = result.filter(
        (p) => p.variants.length >= min && p.variants.length <= max,
      );
    }

    // Sorting
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price-asc": {
          const aMin = Math.min(...a.variants.map((v) => Number(v.sellPrice)));
          const bMin = Math.min(...b.variants.map((v) => Number(v.sellPrice)));
          return aMin - bMin;
        }
        case "price-desc": {
          const aMax = Math.max(...a.variants.map((v) => Number(v.sellPrice)));
          const bMax = Math.max(...b.variants.map((v) => Number(v.sellPrice)));
          return bMax - aMax;
        }
        case "variants":
          return b.variants.length - a.variants.length;
        case "newest":
          return b.id - a.id; // Assuming higher ID = newer
        default:
          return 0;
      }
    });

    return result;
  }, [products, filters]);

  if (isLoading) {
    return (
      <Table>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i} className="animate-pulse border-border">
              <TableCell colSpan={7}>
                <div className="h-12 w-full rounded bg-muted"></div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (!filteredAndSortedProducts.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold">
          {t("products.no_products_found")}
        </h3>
        <p className="text-muted-foreground text-sm mt-1">
          {products?.length === 0
            ? t("products.start_adding")
            : t("products.adjust_filters")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        {t("products.showing_of", {
          count: filteredAndSortedProducts.length,
          total: products?.length || 0,
        })}
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/50">
              <TableHead className="font-semibold">
                {t("products.table_product")}
              </TableHead>
              <TableHead className="font-semibold">
                {t("products.table_type")}
              </TableHead>
              <TableHead className="font-semibold">
                {t("products.table_category")}
              </TableHead>
              <TableHead className="font-semibold">
                {t("products.table_brand")}
              </TableHead>
              <TableHead className="font-semibold">
                {t("products.table_variants")}
              </TableHead>

              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedProducts.map((product) => {
              const totalStock = product.variants.reduce(
                (acc, v) => acc + (v.totalStock || 0),
                0,
              );
              const isLowStock = totalStock < product.minStock;

              return (
                <TableRow
                  key={product.id}
                  className="border-border hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{product.name}</span>
                      {product.description && (
                        <ExpandableDescription text={product.description} />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        product.type === "SERIALIZED" ? "default" : "secondary"
                      }
                      className="font-mono text-[10px] uppercase"
                    >
                      {product.type === "SERIALIZED"
                        ? t("products.type_serialized")
                        : t("products.type_batch")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.category.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.brand.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 items-center">
                      <Badge variant="outline" className="text-xs">
                        {t("products.badge_variants", {
                          count: product.variants.length,
                        })}
                      </Badge>
                      {isLowStock && (
                        <Badge
                          variant="destructive"
                          className="text-[10px] px-1.5"
                        >
                          {t("products.low_stock")}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  {/* <TableCell>
                    <div className="font-medium">
                      {min === max
                        ? `$${min.toLocaleString()}`
                        : `$${min.toLocaleString()} - $${max.toLocaleString()}`}
                    </div>
                  </TableCell> */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={() =>
                            navigate(`/products/${product.id}/edit`)
                          }
                        >
                          <Edit className="h-4 w-4" />
                          {t("common.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={() =>
                            navigate(`/products/${product.id}/edit`)
                          }
                        >
                          <Eye className="h-4 w-4" />
                          {t("products.view_details")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                          onClick={() => setProductToDelete(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                          {t("common.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!productToDelete}
        onOpenChange={(open) => !open && setProductToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("products.delete_product")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("products.delete_confirm", { name: productToDelete?.name })}
              {productToDelete && productToDelete.variants.length > 0 && (
                <span className="block mt-2 text-amber-600 dark:text-amber-400">
                  {t("products.delete_warning", {
                    count: productToDelete.variants.length,
                  })}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (productToDelete) {
                  deleteMutation.mutate(productToDelete.id, {
                    onSuccess: () => setProductToDelete(null),
                  });
                }
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("products.deleting")}
                </>
              ) : (
                t("common.delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
