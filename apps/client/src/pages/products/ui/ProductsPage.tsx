import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { brandQueries } from "@/entities/brand";
import { categoryQueries } from "@/entities/category";
import { productQueries } from "@/entities/product";
import { ProductTable } from "@/widgets/product-table/ui/ProductTable";
import {
  ProductFiltersComponent,
  defaultFilters,
  type ProductFilters,
} from "@/features/product-filters";
import { ExportProductsButton } from "@/features/export-products";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import {
  Plus,
  Package,
  Layers,
  Tags,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

export default function ProductsPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<ProductFilters>(defaultFilters);

  const { data: products } = productQueries.useAll();
  const { data: brands } = brandQueries.useAll();
  const { data: categories } = categoryQueries.useAll();

  // Calculate stats
  const totalProducts = products?.length || 0;
  const totalVariants =
    products?.reduce((acc, p) => acc + p.variants.length, 0) || 0;
  const lowStockProducts =
    products?.filter((p) => {
      const totalStock = p.variants.reduce(
        (acc, v) => acc + (v.totalStock || 0),
        0,
      );
      return totalStock < p.minStock;
    }).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("products.title")}
          </h1>
          <p className="text-muted-foreground">{t("products.description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportProductsButton products={products || []} />
          <Button asChild className="gap-2">
            <Link to="/products/create">
              <Plus className="h-4 w-4" />
              {t("products.add_product")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("products.total_products")}
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {t("products.total_variants", { count: totalVariants })}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("products.categories")}
            </CardTitle>
            <Layers className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t("products.product_categories")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("products.brands")}
            </CardTitle>
            <Tags className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brands?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t("products.active_brands")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("products.low_stock")}
            </CardTitle>
            {lowStockProducts > 0 ? (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            ) : (
              <TrendingUp className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                lowStockProducts > 0 ? "text-amber-500" : ""
              }`}
            >
              {lowStockProducts}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("products.below_min_stock")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>{t("products.catalog_title")}</CardTitle>
          <CardDescription>{t("products.catalog_description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <ProductFiltersComponent
            filters={filters}
            onChange={setFilters}
            brands={brands || []}
            categories={categories || []}
          />

          {/* Table */}
          <ProductTable filters={filters} />
        </CardContent>
      </Card>
    </div>
  );
}
