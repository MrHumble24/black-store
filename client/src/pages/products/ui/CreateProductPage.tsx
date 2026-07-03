import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { brandQueries, brandsApi } from "@/entities/brand";
import { categoryQueries, categoriesApi } from "@/entities/category";
import { productQueries } from "@/entities/product";
import type { CreateVariantPayload } from "@/entities/product/api/product.api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
import { CreatableSelect } from "@/shared/ui/creatable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  ArrowLeft,
  Package,
  Plus,
  Trash2,
  Boxes,
  Barcode,
  Palette,
  Save,
  X,
  Smartphone,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { aiApi } from "@/shared/api/ai.api";

// Predefined specs for mobile devices
const MOBILE_SPEC_PRESETS = [
  { key: "Color", placeholderKey: "products.form.spec_val_placeholder" },
  { key: "Storage", placeholderKey: "products.form.spec_val_placeholder" },
  { key: "RAM", placeholderKey: "products.form.spec_val_placeholder" },
  { key: "Region", placeholderKey: "products.form.spec_val_placeholder" },
  { key: "Condition", placeholderKey: "products.form.spec_val_placeholder" },
  { key: "SIM", placeholderKey: "products.form.spec_val_placeholder" },
] as const;

type VariantFormData = {
  name: string;
  modelCode: string;
  specs: { key: string; value: string }[];
};

const createEmptyVariant = (): VariantFormData => ({
  name: "",
  modelCode: "",
  specs: MOBILE_SPEC_PRESETS.slice(0, 4).map((preset) => ({
    key: preset.key,
    value: "",
  })),
});

// Generate SKU from product name, brand, and variant specs
const generateSKU = (
  productName: string,
  brandName: string,
  variantName: string,
  specs: { key: string; value: string }[],
  index: number,
): string => {
  // Helper to create abbreviation
  const abbreviate = (text: string, maxLen: number = 3): string => {
    const cleaned = text.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    return cleaned.slice(0, maxLen);
  };

  // Get key spec values for SKU
  const colorSpec = specs.find((s) => s.key === "Color")?.value || "";
  const storageSpec = specs.find((s) => s.key === "Storage")?.value || "";
  const regionSpec = specs.find((s) => s.key === "Region")?.value || "";

  // Build SKU parts
  const parts: string[] = [];

  // Add brand abbreviation (3 chars)
  if (brandName) {
    parts.push(abbreviate(brandName, 3));
  }

  // Add product name abbreviation (4 chars)
  if (productName) {
    parts.push(abbreviate(productName, 4));
  }

  // Add color abbreviation (3 chars)
  if (colorSpec) {
    parts.push(abbreviate(colorSpec, 3));
  }

  // Add storage (numbers only)
  if (storageSpec) {
    const storageNum = storageSpec.replace(/[^0-9]/g, "");
    if (storageNum) parts.push(storageNum);
  }

  // Add region abbreviation (2 chars)
  if (regionSpec) {
    parts.push(abbreviate(regionSpec, 2));
  }

  // If no parts, use variant name or index
  if (parts.length === 0) {
    if (variantName) {
      parts.push(abbreviate(variantName, 6));
    } else {
      parts.push(`VAR${index + 1}`);
    }
  }

  // Add unique suffix (timestamp + random)
  const uniqueSuffix =
    Date.now().toString(36).slice(-4).toUpperCase() +
    Math.random().toString(36).slice(-2).toUpperCase();

  return `${parts.join("-")}-${uniqueSuffix}`;
};

// ... generateSKU ... (keep as is)

export default function CreateProductPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form state
  const [name, setName] = useState("");
  const [description] = useState("");
  const [type, setType] = useState<"SERIALIZED" | "BATCH">("SERIALIZED");
  const [minStock, setMinStock] = useState("5");
  const [brandId, setBrandId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [variants, setVariants] = useState<VariantFormData[]>([
    createEmptyVariant(),
  ]);
  const [isAiGeneratingVariants, setIsAiGeneratingVariants] = useState(false);

  const handleAiGenerateVariants = async () => {
    if (!name) {
      toast.error(t("products.form.enter_name_first"));
      return;
    }

    const categoryName =
      categories?.find((c) => String(c.id) === categoryId)?.name || "";

    try {
      setIsAiGeneratingVariants(true);
      const { data } = await aiApi.generateProductVariants(name, categoryName);

      if (data.variants && data.variants.length > 0) {
        const newVariants = data.variants.map((v) => ({
          name: v.name,
          modelCode: "",
          specs: Object.entries(v.specs).map(([key, value]) => ({
            key,
            value,
          })),
        }));
        setVariants(newVariants);
        toast.success(
          t("products.form.ai_gen_variants_success", {
            count: data.variants.length,
          }),
        );
      }
    } catch (error) {
      toast.error(t("products.form.ai_gen_variants_fail"));
    } finally {
      setIsAiGeneratingVariants(false);
    }
  };

  // Queries
  const { data: brands, isLoading: brandsLoading } = brandQueries.useAll();
  const { data: categories, isLoading: categoriesLoading } =
    categoryQueries.useAll();
  const createMutation = productQueries.useCreate();

  // Brand/Category creation handlers with cache invalidation
  const handleCreateBrand = async (name: string) => {
    try {
      const response = await brandsApi.create({ name });
      await queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success(t("products.form.brand_create_success"));
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create brand");
      throw error;
    }
  };

  const handleCreateCategory = async (name: string) => {
    try {
      const response = await categoriesApi.create({ name });
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(t("products.form.category_create_success"));
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create category");
      throw error;
    }
  };

  const brandOptions = (brands || []).map((b) => ({
    value: String(b.id),
    label: b.name,
  }));

  const categoryOptions = (categories || []).map((c) => ({
    value: String(c.id),
    label: c.name,
  }));

  const addVariant = () => {
    setVariants([...variants, createEmptyVariant()]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const updateVariant = (
    index: number,
    field: keyof VariantFormData,
    value: string,
  ) => {
    const updated = [...variants];
    if (field === "specs") return;
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const getVariantSKU = (variant: VariantFormData, index: number): string => {
    const brandName =
      brands?.find((b) => b.id === parseInt(brandId))?.name || "";
    return generateSKU(name, brandName, variant.name, variant.specs, index);
  };

  const addSpec = (variantIndex: number) => {
    const updated = [...variants];
    const usedKeys = updated[variantIndex].specs.map((s) => s.key);
    const availablePreset = MOBILE_SPEC_PRESETS.find(
      (p) => !usedKeys.includes(p.key),
    );
    updated[variantIndex].specs.push({
      key: availablePreset?.key || "",
      value: "",
    });
    setVariants(updated);
  };

  const removeSpec = (variantIndex: number, specIndex: number) => {
    const updated = [...variants];
    if (updated[variantIndex].specs.length > 1) {
      updated[variantIndex].specs = updated[variantIndex].specs.filter(
        (_, i) => i !== specIndex,
      );
      setVariants(updated);
    }
  };

  const updateSpec = (
    variantIndex: number,
    specIndex: number,
    field: "key" | "value",
    value: string,
  ) => {
    const updated = [...variants];
    updated[variantIndex].specs[specIndex][field] = value;
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const brandName =
      brands?.find((b) => b.id === parseInt(brandId))?.name || "";

    const variantPayloads: CreateVariantPayload[] = variants
      .filter((v) => v.name)
      .map((v, index) => ({
        sku: generateSKU(name, brandName, v.name, v.specs, index),
        name: v.name,
        modelCode: v.modelCode || undefined,
        specs: v.specs
          .filter((s) => s.key && s.value)
          .reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {}),
      }));

    await createMutation.mutateAsync({
      name,
      description: description || undefined,
      type,
      minStock: parseInt(minStock) || 5,
      brandId: parseInt(brandId),
      categoryId: parseInt(categoryId),
      variants: variantPayloads.length > 0 ? variantPayloads : undefined,
    });

    toast.success(t("products.form.success_create"));
    navigate("/products");
  };

  const isFormValid =
    name && brandId && categoryId && variants.some((v) => v.name);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/products")}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("products.create_product")}
          </h1>
          <p className="text-muted-foreground">
            {t("products.create_description")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Product Info */}
          <Card className="lg:col-span-2 border-border bg-card shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{t("products.form.product_info")}</CardTitle>
                  <CardDescription>
                    {t("products.form.basic_details")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">
                    {t("products.form.product_name")} *
                  </Label>
                  <Input
                    id="name"
                    placeholder={t("products.form.name_placeholder")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-muted/50"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("products.form.brand")} *</Label>
                  <CreatableSelect
                    options={brandOptions}
                    value={brandId}
                    onChange={setBrandId}
                    onCreateNew={handleCreateBrand}
                    placeholder={t("products.form.select_brand")}
                    searchPlaceholder={t("products.search_brands")}
                    emptyText={t("products.no_brands_found")}
                    createText={t("products.form.create_brand")}
                    isLoading={brandsLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("products.form.brand_tip")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t("products.form.category")} *</Label>
                  <CreatableSelect
                    options={categoryOptions}
                    value={categoryId}
                    onChange={setCategoryId}
                    onCreateNew={handleCreateCategory}
                    placeholder={t("products.form.select_category")}
                    searchPlaceholder={t("products.search_categories")}
                    emptyText={t("products.no_categories_found")}
                    createText={t("products.form.create_category")}
                    isLoading={categoriesLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("products.form.category_tip")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="border-border bg-card shadow-sm h-fit">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Boxes className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle>{t("products.form.settings")}</CardTitle>
                  <CardDescription>
                    {t("products.form.settings_description")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>{t("products.form.product_type")} *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType("SERIALIZED")}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                      type === "SERIALIZED"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    <Barcode className="h-6 w-6" />
                    <span className="text-sm font-medium">
                      {t("products.form.serialized")}
                    </span>
                    <span className="text-xs text-muted-foreground text-center">
                      {t("products.form.serialized_tip")}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("BATCH")}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                      type === "BATCH"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    <Boxes className="h-6 w-6" />
                    <span className="text-sm font-medium">
                      {t("products.form.batch")}
                    </span>
                    <span className="text-xs text-muted-foreground text-center">
                      {t("products.form.batch_tip")}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minStock">
                  {t("products.form.min_stock_level")}
                </Label>
                <Input
                  id="minStock"
                  type="number"
                  min="0"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">
                  {t("products.form.stock_alert_tip")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Variants Section */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <Palette className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <CardTitle>{t("products.form.variants_title")}</CardTitle>
                  <CardDescription>
                    {t("products.form.variants_description")}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 text-primary hover:text-primary hover:bg-primary/10"
                  onClick={handleAiGenerateVariants}
                  disabled={isAiGeneratingVariants}
                >
                  {isAiGeneratingVariants ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {t("products.form.generate_ai")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addVariant}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {t("products.form.add_variant")}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mobile Specs Info Banner */}
            <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
              <Smartphone className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-500">
                  {t("products.form.mobile_preset_tip")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("products.form.mobile_preset_description")}
                </p>
              </div>
            </div>

            {variants.map((variant, vIndex) => (
              <div
                key={vIndex}
                className="relative rounded-xl border border-border bg-muted/30 p-6"
              >
                {variants.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeVariant(vIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="text-xs">
                    {t("products.form.variant_index", { index: vIndex + 1 })}
                  </Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 mb-4">
                  <div className="space-y-2">
                    <Label className="text-sm">
                      <Barcode className="inline h-3.5 w-3.5 mr-1.5" />
                      {t("products.form.sku")}
                      <Badge
                        variant="outline"
                        className="ml-2 text-[10px] font-normal"
                      >
                        {t("products.form.auto_generated")}
                      </Badge>
                    </Label>
                    <div className="flex items-center h-9 px-3 rounded-md border border-input bg-muted/30 text-sm font-mono text-muted-foreground">
                      {variant.name || brandId ? (
                        getVariantSKU(variant, vIndex)
                      ) : (
                        <span className="italic">
                          {t("products.form.sku_placeholder")}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {t("products.form.sku_tip")}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">
                      {t("products.form.variant_name")} *
                    </Label>
                    <Input
                      placeholder={t("products.form.variant_name_placeholder")}
                      value={variant.name}
                      onChange={(e) =>
                        updateVariant(vIndex, "name", e.target.value)
                      }
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">
                      {t("products.form.model_code")}
                    </Label>
                    <Input
                      placeholder={t("products.form.model_code_placeholder")}
                      value={variant.modelCode}
                      onChange={(e) =>
                        updateVariant(vIndex, "modelCode", e.target.value)
                      }
                      className="bg-background"
                    />
                  </div>
                </div>

                {/* Specs */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">
                      {t("products.form.specifications")}
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addSpec(vIndex)}
                      className="h-7 text-xs gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      {t("products.form.add_spec")}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {variant.specs.map((spec, sIndex) => (
                      <div key={sIndex} className="flex items-center gap-2">
                        <Select
                          value={spec.key}
                          onValueChange={(value) =>
                            updateSpec(vIndex, sIndex, "key", value)
                          }
                        >
                          <SelectTrigger className="bg-background w-40">
                            <SelectValue
                              placeholder={t("products.form.select_spec")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {MOBILE_SPEC_PRESETS.map((preset) => (
                              <SelectItem key={preset.key} value={preset.key}>
                                {preset.key}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder={t("products.form.spec_val_placeholder")}
                          value={spec.value}
                          onChange={(e) =>
                            updateSpec(vIndex, sIndex, "value", e.target.value)
                          }
                          className="bg-background flex-1"
                        />
                        {variant.specs.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeSpec(vIndex, sIndex)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/products")}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={!isFormValid || createMutation.isPending}
            className="gap-2 min-w-32"
          >
            {createMutation.isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t("products.form.creating")}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {t("products.create_product")}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
