import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Brand } from "@/entities/brand";
import type { Category } from "@/entities/category";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/command";
import {
  Filter,
  X,
  Search,
  SlidersHorizontal,
  Check,
  ChevronDown,
  RotateCcw,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

export type ProductFilters = {
  search: string;
  brands: number[];
  categories: number[];
  type: "ALL" | "SERIALIZED" | "BATCH";
  priceMin: string;
  priceMax: string;
  variantsMin: string;
  variantsMax: string;
  sortBy: "name" | "price-asc" | "price-desc" | "variants" | "newest";
};

export const defaultFilters: ProductFilters = {
  search: "",
  brands: [],
  categories: [],
  type: "ALL",
  priceMin: "",
  priceMax: "",
  variantsMin: "",
  variantsMax: "",
  sortBy: "name",
};

interface ProductFiltersProps {
  filters: ProductFilters;
  onChange: (filters: ProductFilters) => void;
  brands: Brand[];
  categories: Category[];
}

export function ProductFiltersComponent({
  filters,
  onChange,
  brands,
  categories,
}: ProductFiltersProps) {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const activeFilterCount = [
    filters.brands.length > 0,
    filters.categories.length > 0,
    filters.type !== "ALL",
    filters.priceMin !== "",
    filters.priceMax !== "",
    filters.variantsMin !== "",
    filters.variantsMax !== "",
  ].filter(Boolean).length;

  const updateFilter = <K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K],
  ) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleBrand = (brandId: number) => {
    const newBrands = filters.brands.includes(brandId)
      ? filters.brands.filter((id) => id !== brandId)
      : [...filters.brands, brandId];
    updateFilter("brands", newBrands);
  };

  const toggleCategory = (categoryId: number) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter((id) => id !== categoryId)
      : [...filters.categories, categoryId];
    updateFilter("categories", newCategories);
  };

  const clearAllFilters = () => {
    onChange(defaultFilters);
  };

  const hasActiveFilters = activeFilterCount > 0 || filters.search !== "";

  return (
    <div className="space-y-4">
      {/* Main Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("products.search_placeholder")}
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-9 pr-9"
          />
          {filters.search && (
            <button
              onClick={() => updateFilter("search", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Brand Multi-Select */}
        <Popover open={brandOpen} onOpenChange={setBrandOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "min-w-[140px] justify-between gap-2",
                filters.brands.length > 0 && "border-primary",
              )}
            >
              <span className="truncate">
                {filters.brands.length === 0
                  ? t("products.all_brands")
                  : filters.brands.length === 1
                    ? brands.find((b) => b.id === filters.brands[0])?.name
                    : t("products.brands_count", {
                        count: filters.brands.length,
                      })}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-0" align="start">
            <Command>
              <CommandInput placeholder={t("products.search_brands")} />
              <CommandList>
                <CommandEmpty>{t("products.no_brands_found")}</CommandEmpty>
                <CommandGroup>
                  {brands.map((brand) => (
                    <CommandItem
                      key={brand.id}
                      onSelect={() => toggleBrand(brand.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          filters.brands.includes(brand.id)
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {brand.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Category Multi-Select */}
        <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "min-w-[140px] justify-between gap-2",
                filters.categories.length > 0 && "border-primary",
              )}
            >
              <span className="truncate">
                {filters.categories.length === 0
                  ? t("products.all_categories")
                  : filters.categories.length === 1
                    ? categories.find((c) => c.id === filters.categories[0])
                        ?.name
                    : t("products.categories_count", {
                        count: filters.categories.length,
                      })}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-0" align="start">
            <Command>
              <CommandInput placeholder={t("products.search_categories")} />
              <CommandList>
                <CommandEmpty>{t("products.no_categories_found")}</CommandEmpty>
                <CommandGroup>
                  {categories.map((category) => (
                    <CommandItem
                      key={category.id}
                      onSelect={() => toggleCategory(category.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          filters.categories.includes(category.id)
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {category.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Product Type */}
        <Select
          value={filters.type}
          onValueChange={(value) =>
            updateFilter("type", value as ProductFilters["type"])
          }
        >
          <SelectTrigger
            className={cn(
              "w-[140px]",
              filters.type !== "ALL" && "border-primary",
            )}
          >
            <SelectValue placeholder={t("products.filter_type")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("products.all_types")}</SelectItem>
            <SelectItem value="SERIALIZED">
              {t("products.type_serialized")}
            </SelectItem>
            <SelectItem value="BATCH">{t("products.type_batch")}</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select
          value={filters.sortBy}
          onValueChange={(value) =>
            updateFilter("sortBy", value as ProductFilters["sortBy"])
          }
        >
          <SelectTrigger className="w-[160px]">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t("products.sort_by")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">{t("products.sort_name")}</SelectItem>
            <SelectItem value="price-asc">
              {t("products.sort_price_asc")}
            </SelectItem>
            <SelectItem value="price-desc">
              {t("products.sort_price_desc")}
            </SelectItem>
            <SelectItem value="variants">
              {t("products.sort_variants")}
            </SelectItem>
            <SelectItem value="newest">{t("products.sort_newest")}</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn("gap-2", activeFilterCount > 0 && "border-primary")}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t("products.advanced_filters")}
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {/* Clear All */}
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearAllFilters} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            {t("pos.clear_all")}
          </Button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            {t("products.advanced_panel_title")}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Price Range */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {t("products.price_range")}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder={t("products.min")}
                  value={filters.priceMin}
                  onChange={(e) => updateFilter("priceMin", e.target.value)}
                  className="h-9"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  placeholder={t("products.max")}
                  value={filters.priceMax}
                  onChange={(e) => updateFilter("priceMax", e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Variants Count */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {t("products.variants_count")}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder={t("products.min")}
                  value={filters.variantsMin}
                  onChange={(e) => updateFilter("variantsMin", e.target.value)}
                  className="h-9"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  placeholder={t("products.max")}
                  value={filters.variantsMax}
                  onChange={(e) => updateFilter("variantsMax", e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {t("products.active_filters")}
          </span>

          {filters.search && (
            <Badge variant="secondary" className="gap-1 pr-1">
              {t("products.filter_search")}: "{filters.search}"
              <button
                onClick={() => updateFilter("search", "")}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.brands.map((brandId) => {
            const brand = brands.find((b) => b.id === brandId);
            return brand ? (
              <Badge key={brandId} variant="secondary" className="gap-1 pr-1">
                {t("products.filter_brand")}: {brand.name}
                <button
                  onClick={() => toggleBrand(brandId)}
                  className="ml-1 rounded-full hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null;
          })}

          {filters.categories.map((categoryId) => {
            const category = categories.find((c) => c.id === categoryId);
            return category ? (
              <Badge
                key={categoryId}
                variant="secondary"
                className="gap-1 pr-1"
              >
                {t("products.filter_category")}: {category.name}
                <button
                  onClick={() => toggleCategory(categoryId)}
                  className="ml-1 rounded-full hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null;
          })}

          {filters.type !== "ALL" && (
            <Badge variant="secondary" className="gap-1 pr-1">
              {t("products.filter_type")}:{" "}
              {filters.type === "SERIALIZED"
                ? t("products.type_serialized")
                : t("products.type_batch")}
              <button
                onClick={() => updateFilter("type", "ALL")}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {(filters.priceMin || filters.priceMax) && (
            <Badge variant="secondary" className="gap-1 pr-1">
              {t("products.filter_price")}: ${filters.priceMin || "0"} - $
              {filters.priceMax || "∞"}
              <button
                onClick={() => {
                  updateFilter("priceMin", "");
                  updateFilter("priceMax", "");
                }}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {(filters.variantsMin || filters.variantsMax) && (
            <Badge variant="secondary" className="gap-1 pr-1">
              {t("products.filter_variants")}: {filters.variantsMin || "0"} -{" "}
              {filters.variantsMax || "∞"}
              <button
                onClick={() => {
                  updateFilter("variantsMin", "");
                  updateFilter("variantsMax", "");
                }}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
