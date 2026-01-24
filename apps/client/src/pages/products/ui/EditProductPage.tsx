import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { brandQueries, brandsApi } from "@/entities/brand";
import { categoryQueries, categoriesApi } from "@/entities/category";
import { productQueries, productsApi } from "@/entities/product";
import type {
  UpdateVariantPayload,
  CreateVariantPayload,
} from "@/entities/product/api/product.api";
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
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

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
  id?: number; // undefined for new variants
  sku: string;
  modelCode: string;
  name: string;
  specs: { key: string; value: string }[];
  isNew?: boolean;
  isDeleted?: boolean;
};

export default function EditProductPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id || "0");
  const queryClient = useQueryClient();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"SERIALIZED" | "BATCH">("SERIALIZED");
  const [minStock, setMinStock] = useState("5");
  const [brandId, setBrandId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [variants, setVariants] = useState<VariantFormData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const { data: product, isLoading, error } = productQueries.useOne(productId);
  const { data: brands, isLoading: brandsLoading } = brandQueries.useAll();
  const { data: categories, isLoading: categoriesLoading } =
    categoryQueries.useAll();
  const updateMutation = productQueries.useUpdate();

  // Populate form when product data loads
  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || "");
      setType(product.type);
      setMinStock(String(product.minStock));
      setBrandId(String(product.brand.id));
      setCategoryId(String(product.category.id));

      // Transform variants to form data
      const variantFormData: VariantFormData[] = product.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        modelCode: v.modelCode || "",
        name: v.name,
        specs: Object.entries(v.specs || {}).map(([key, value]) => ({
          key,
          value: String(value),
        })),
        isNew: false,
        isDeleted: false,
      }));

      // Ensure at least one spec row for each variant
      variantFormData.forEach((v) => {
        if (v.specs.length === 0) {
          v.specs = [{ key: "", value: "" }];
        }
      });

      setVariants(variantFormData);
    }
  }, [product]);

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

  // Transform data for CreatableSelect
  const brandOptions = (brands || []).map((b) => ({
    value: String(b.id),
    label: b.name,
  }));

  const categoryOptions = (categories || []).map((c) => ({
    value: String(c.id),
    label: c.name,
  }));

  const addVariant = () => {
    const newVariant: VariantFormData = {
      sku: "",
      modelCode: "",
      name: "",
      specs: MOBILE_SPEC_PRESETS.slice(0, 4).map((preset) => ({
        key: preset.key,
        value: "",
      })),
      isNew: true,
      isDeleted: false,
    };
    setVariants([...variants, newVariant]);
  };

  const removeVariant = (index: number) => {
    const variant = variants[index];
    if (variant.isNew) {
      setVariants(variants.filter((_, i) => i !== index));
    } else {
      const updated = [...variants];
      updated[index] = { ...updated[index], isDeleted: true };
      setVariants(updated);
    }
  };

  const restoreVariant = (index: number) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], isDeleted: false };
    setVariants(updated);
  };

  const updateVariant = (
    index: number,
    field: keyof VariantFormData,
    value: string,
  ) => {
    const updated = [...variants];
    if (
      field === "specs" ||
      field === "isNew" ||
      field === "isDeleted" ||
      field === "id"
    )
      return;
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
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

  // Generate SKU for new variants
  const generateSKU = (
    variantName: string,
    specs: { key: string; value: string }[],
  ): string => {
    const abbreviate = (text: string, maxLen: number = 3): string => {
      const cleaned = text.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      return cleaned.slice(0, maxLen);
    };

    const brandName =
      brands?.find((b) => b.id === parseInt(brandId))?.name || "";
    const colorSpec = specs.find((s) => s.key === "Color")?.value || "";
    const storageSpec = specs.find((s) => s.key === "Storage")?.value || "";

    const parts: string[] = [];
    if (brandName) parts.push(abbreviate(brandName, 3));
    if (name) parts.push(abbreviate(name, 4));
    if (colorSpec) parts.push(abbreviate(colorSpec, 3));
    if (storageSpec) {
      const storageNum = storageSpec.replace(/[^0-9]/g, "");
      if (storageNum) parts.push(storageNum);
    }

    if (parts.length === 0 && variantName) {
      parts.push(abbreviate(variantName, 6));
    }

    const uniqueSuffix =
      Date.now().toString(36).slice(-4).toUpperCase() +
      Math.random().toString(36).slice(-2).toUpperCase();

    return `${parts.join("-")}-${uniqueSuffix}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateMutation.mutateAsync({
        id: productId,
        data: {
          name,
          description: description || undefined,
          minStock: parseInt(minStock) || 5,
          brandId: parseInt(brandId),
          categoryId: parseInt(categoryId),
        },
      });

      const promises: Promise<any>[] = [];

      for (const variant of variants) {
        if (variant.isDeleted && variant.id) {
          promises.push(productsApi.deleteVariant(variant.id));
        } else if (variant.isNew && !variant.isDeleted) {
          if (variant.name) {
            const newVariantData: CreateVariantPayload = {
              sku: generateSKU(variant.name, variant.specs),
              name: variant.name,
              modelCode: variant.modelCode || undefined,
              specs: variant.specs
                .filter((s) => s.key && s.value)
                .reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {}),
            };
            promises.push(productsApi.addVariant(productId, newVariantData));
          }
        } else if (!variant.isNew && !variant.isDeleted && variant.id) {
          const updateData: UpdateVariantPayload = {
            name: variant.name,
            modelCode: variant.modelCode || undefined,
            specs: variant.specs
              .filter((s) => s.key && s.value)
              .reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {}),
          };
          promises.push(productsApi.updateVariant(variant.id, updateData));
        }
      }

      await Promise.all(promises);

      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["product", productId] });

      toast.success(t("products.form.success_update"));
      navigate("/products");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeVariants = variants.filter((v) => !v.isDeleted);
  const isFormValid =
    name && brandId && categoryId && activeVariants.some((v) => v.name);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {t("products.form.loading_product")}
          </p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <h2 className="text-xl font-semibold">{t("products.not_found")}</h2>
            <p className="text-muted-foreground mt-1">
              {t("products.not_found_description")}
            </p>
          </div>
          <Button onClick={() => navigate("/products")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("products.back_to_products")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            {t("products.edit_product")}
          </h1>
          <p className="text-muted-foreground">
            {t("products.edit_description")}
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
                <Label>{t("products.form.product_type")}</Label>
                <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30">
                  {type === "SERIALIZED" ? (
                    <Barcode className="h-5 w-5 text-primary" />
                  ) : (
                    <Boxes className="h-5 w-5 text-primary" />
                  )}
                  <span className="font-medium">
                    {type === "SERIALIZED"
                      ? t("products.form.serialized")
                      : t("products.form.batch")}
                  </span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {t("products.form.cannot_change_type")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("products.form.type_change_tip")}
                </p>
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
          </CardHeader>
          <CardContent className="space-y-6">
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
                key={variant.id || `new-${vIndex}`}
                className={`relative rounded-xl border p-6 transition-all ${
                  variant.isDeleted
                    ? "border-destructive/50 bg-destructive/5 opacity-60"
                    : variant.isNew
                      ? "border-green-500/50 bg-green-500/5"
                      : "border-border bg-muted/30"
                }`}
              >
                <div className="absolute right-2 top-2">
                  {variant.isDeleted ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1"
                      onClick={() => restoreVariant(vIndex)}
                    >
                      {t("products.form.restore")}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeVariant(vIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Badge
                    variant={
                      variant.isDeleted
                        ? "destructive"
                        : variant.isNew
                          ? "default"
                          : "secondary"
                    }
                    className="text-xs"
                  >
                    {variant.isDeleted
                      ? t("products.form.will_be_deleted")
                      : variant.isNew
                        ? t("products.form.new_variant")
                        : t("products.form.variant_index", {
                            index: vIndex + 1,
                          })}
                  </Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 mb-4">
                  <div className="space-y-2">
                    <Label className="text-sm">
                      <Barcode className="inline h-3.5 w-3.5 mr-1.5" />
                      {t("products.form.sku")}
                    </Label>
                    {variant.isNew ? (
                      <div className="flex items-center h-9 px-3 rounded-md border border-input bg-muted/30 text-sm font-mono text-muted-foreground">
                        <span className="italic text-xs">
                          {t("products.form.sku_on_save")}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center h-9 px-3 rounded-md border border-input bg-muted/50 text-sm font-mono">
                        {variant.sku}
                      </div>
                    )}
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
                      disabled={variant.isDeleted}
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
                      disabled={variant.isDeleted}
                    />
                  </div>
                </div>

                {/* Specs */}
                {!variant.isDeleted && (
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
                      {variant.specs.map((spec, sIndex) => {
                        const isPresetKey = MOBILE_SPEC_PRESETS.some(
                          (p) => p.key === spec.key,
                        );
                        const selectOptions =
                          isPresetKey || !spec.key
                            ? MOBILE_SPEC_PRESETS
                            : [
                                {
                                  key: spec.key,
                                  placeholderKey:
                                    "products.form.spec_val_placeholder",
                                },
                                ...MOBILE_SPEC_PRESETS,
                              ];

                        return (
                          <div key={sIndex} className="flex items-center gap-2">
                            <Select
                              value={spec.key || undefined}
                              onValueChange={(value) =>
                                updateSpec(vIndex, sIndex, "key", value)
                              }
                            >
                              <SelectTrigger className="bg-background w-40">
                                <SelectValue
                                  placeholder={t("products.form.select_spec")}
                                >
                                  {spec.key || t("products.form.select_spec")}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {selectOptions.map((preset) => (
                                  <SelectItem
                                    key={preset.key}
                                    value={preset.key}
                                  >
                                    {preset.key}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder={t(
                                "products.form.spec_val_placeholder",
                              )}
                              value={spec.value}
                              onChange={(e) =>
                                updateSpec(
                                  vIndex,
                                  sIndex,
                                  "value",
                                  e.target.value,
                                )
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
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {variants.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("products.form.no_variants_yet")}</p>
              </div>
            )}
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
            disabled={!isFormValid || isSubmitting}
            className="gap-2 min-w-32"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("products.form.saving")}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {t("common.save")}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
