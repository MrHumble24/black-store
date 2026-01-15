import { Download } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { exportToExcel } from "@/shared/lib/excel-export";
import type { Product } from "@/entities/product";

interface ExportProductsButtonProps {
  products: Product[];
  disabled?: boolean;
}

export function ExportProductsButton({
  products,
  disabled = false,
}: ExportProductsButtonProps) {
  const handleExport = () => {
    if (!products || products.length === 0) {
      return;
    }

    // 1. Collect all unique specification keys across all products and variants
    const allSpecKeys = new Set<string>();
    products.forEach((product) => {
      product.variants.forEach((variant) => {
        if (variant.specs) {
          Object.keys(variant.specs).forEach((key) => allSpecKeys.add(key));
        }
      });
    });

    const specKeys = Array.from(allSpecKeys).sort();

    // 2. Define static columns
    const staticColumns = [
      { header: "Product Name", key: "productName", width: 25 },
      { header: "Model Code", key: "modelCode", width: 20 },
      { header: "Description", key: "description", width: 40 },
      { header: "Type", key: "type", width: 12 },
      { header: "Category", key: "category", width: 15 },
      { header: "Brand", key: "brand", width: 15 },
      { header: "Min Stock", key: "minStock", width: 12 },
      { header: "Variants Count", key: "variantsCount", width: 15 },
      { header: "Variant SKU", key: "variantSKU", width: 20 },
      { header: "Variant Name", key: "variantName", width: 30 },
    ];

    // 3. Create dynamic columns for specs
    const specColumns = specKeys.map((key) => ({
      header: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize header
      key: `spec_${key}`, // Use a prefix to avoid collision
      width: 15,
    }));

    // 4. Combine columns
    const columns = [
      ...staticColumns,
      ...specColumns,
      { header: "Total Stock", key: "totalStock", width: 12 },
    ];

    // 5. Flatten products with their variants for export
    const exportData = products.flatMap((product) => {
      const baseData = {
        productName: product.name,
        modelCode: product.modelCode || "",
        description: product.description || "",
        type: product.type,
        category: product.category.name,
        brand: product.brand.name,
        minStock: product.minStock,
        variantsCount: product.variants.length,
      };

      // If there are variants, create a row for each variant
      if (product.variants && product.variants.length > 0) {
        return product.variants.map((variant) => {
          // Map specs to prefixed keys
          const flattenSpecs: Record<string, string> = {};
          if (variant.specs) {
            Object.entries(variant.specs).forEach(([key, value]) => {
              flattenSpecs[`spec_${key}`] = value;
            });
          }

          return {
            ...baseData,
            variantSKU: variant.sku,
            variantName: variant.name,
            totalStock: variant.totalStock || 0,
            ...flattenSpecs,
          };
        });
      }

      // If no variants, just return the base data
      return [baseData];
    });

    const timestamp = new Date().toISOString().split("T")[0];

    exportToExcel({
      filename: `products-export-${timestamp}`,
      sheetName: "Products",
      columns: columns,
      data: exportData,
    });
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={disabled || !products || products.length === 0}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Export to Excel
    </Button>
  );
}
