import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Textarea } from "@/shared/ui/textarea";
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
  { key: "Color", placeholder: "e.g., Space Black, Deep Purple" },
  { key: "Storage", placeholder: "e.g., 128GB, 256GB, 512GB" },
  { key: "RAM", placeholder: "e.g., 6GB, 8GB, 12GB" },
  { key: "Region", placeholder: "e.g., US, EU, UAE, China" },
  { key: "Condition", placeholder: "e.g., New, Like New, Good" },
  { key: "SIM", placeholder: "e.g., Dual SIM, eSIM, Physical" },
] as const;

type VariantFormData = {
  name: string;
  specs: { key: string; value: string }[];
};

const createEmptyVariant = (): VariantFormData => ({
  name: "",
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
  index: number
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

export default function CreateProductPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form state
  const [name, setName] = useState("");
  const [modelCode, setModelCode] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"SERIALIZED" | "BATCH">("SERIALIZED");
  const [minStock, setMinStock] = useState("5");
  const [brandId, setBrandId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [variants, setVariants] = useState<VariantFormData[]>([
    createEmptyVariant(),
  ]);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isAiGeneratingVariants, setIsAiGeneratingVariants] = useState(false);

  const handleAiGenerateDescription = async () => {
    if (!name) {
      toast.error("Please enter a product name first");
      return;
    }

    const categoryName =
      categories?.find((c) => String(c.id) === categoryId)?.name || "";

    try {
      setIsAiGenerating(true);
      const { data } = await aiApi.generateProductDescription(
        name,
        categoryName
      );
      setDescription(data.description);
      toast.success("Description generated!");
    } catch (error) {
      toast.error("Failed to generate description with AI");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAiGenerateVariants = async () => {
    if (!name) {
      toast.error("Please enter a product name first");
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
          specs: Object.entries(v.specs).map(([key, value]) => ({
            key,
            value,
          })),
        }));
        setVariants(newVariants);
        toast.success(`Generated ${data.variants.length} variants!`);
      }
    } catch (error) {
      toast.error("Failed to generate variants with AI");
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
      // Invalidate brands query to refetch updated list
      await queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Brand created successfully");
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create brand");
      throw error;
    }
  };

  const handleCreateCategory = async (name: string) => {
    try {
      const response = await categoriesApi.create({ name });
      // Invalidate categories query to refetch updated list
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created successfully");
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
    value: string
  ) => {
    const updated = [...variants];
    if (field === "specs") return;
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  // Get the generated SKU for a variant
  const getVariantSKU = (variant: VariantFormData, index: number): string => {
    const brandName =
      brands?.find((b) => b.id === parseInt(brandId))?.name || "";
    return generateSKU(name, brandName, variant.name, variant.specs, index);
  };

  const addSpec = (variantIndex: number) => {
    const updated = [...variants];
    // Find a preset that hasn't been used yet
    const usedKeys = updated[variantIndex].specs.map((s) => s.key);
    const availablePreset = MOBILE_SPEC_PRESETS.find(
      (p) => !usedKeys.includes(p.key)
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
        (_, i) => i !== specIndex
      );
      setVariants(updated);
    }
  };

  const updateSpec = (
    variantIndex: number,
    specIndex: number,
    field: "key" | "value",
    value: string
  ) => {
    const updated = [...variants];
    updated[variantIndex].specs[specIndex][field] = value;
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Get brand name for SKU generation
    const brandName =
      brands?.find((b) => b.id === parseInt(brandId))?.name || "";

    // Transform variants to API format with auto-generated SKUs
    const variantPayloads: CreateVariantPayload[] = variants
      .filter((v) => v.name)
      .map((v, index) => ({
        sku: generateSKU(name, brandName, v.name, v.specs, index),
        name: v.name,
        specs: v.specs
          .filter((s) => s.key && s.value)
          .reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {}),
      }));

    await createMutation.mutateAsync({
      name,
      modelCode: modelCode || undefined,
      description: description || undefined,
      type,
      minStock: parseInt(minStock) || 5,
      brandId: parseInt(brandId),
      categoryId: parseInt(categoryId),
      variants: variantPayloads.length > 0 ? variantPayloads : undefined,
    });

    navigate("/products");
  };

  const isFormValid =
    name && brandId && categoryId && variants.some((v) => v.name);

  // Get placeholder for a spec key
  const getSpecPlaceholder = (key: string) => {
    const preset = MOBILE_SPEC_PRESETS.find((p) => p.key === key);
    return preset?.placeholder || "Enter value";
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Create Product</h1>
          <p className="text-muted-foreground">
            Add a new product to your catalog with variants
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
                  <CardTitle>Product Information</CardTitle>
                  <CardDescription>
                    Basic details about your product
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., iPhone 15 Pro"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-muted/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modelCode">Model Code</Label>
                  <Input
                    id="modelCode"
                    placeholder="e.g., A3090, SM-S921B"
                    value={modelCode}
                    onChange={(e) => setModelCode(e.target.value)}
                    className="bg-muted/50"
                  />
                </div>
              </div>

              {/* <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Description</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-2 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={handleAiGenerateDescription}
                    disabled={isAiGenerating}
                  >
                    {isAiGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Generate with AI
                  </Button>
                </div>
                <Textarea
                  id="description"
                  placeholder="Describe your product..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-muted/50 min-h-24"
                />
              </div> */}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Brand *</Label>
                  <CreatableSelect
                    options={brandOptions}
                    value={brandId}
                    onChange={setBrandId}
                    onCreateNew={handleCreateBrand}
                    placeholder="Select or create brand"
                    searchPlaceholder="Search brands..."
                    emptyText="No brands found"
                    createText="Create brand"
                    isLoading={brandsLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Type to search or create a new brand
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Category *</Label>
                  <CreatableSelect
                    options={categoryOptions}
                    value={categoryId}
                    onChange={setCategoryId}
                    onCreateNew={handleCreateCategory}
                    placeholder="Select or create category"
                    searchPlaceholder="Search categories..."
                    emptyText="No categories found"
                    createText="Create category"
                    isLoading={categoriesLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Type to search or create a new category
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
                  <CardTitle>Settings</CardTitle>
                  <CardDescription>
                    Product type and stock settings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Product Type *</Label>
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
                    <span className="text-sm font-medium">Serialized</span>
                    <span className="text-xs text-muted-foreground text-center">
                      Unique items with serial numbers
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
                    <span className="text-sm font-medium">Batch</span>
                    <span className="text-xs text-muted-foreground text-center">
                      Identical items tracked by quantity
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minStock">Minimum Stock Level</Label>
                <Input
                  id="minStock"
                  type="number"
                  min="0"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">
                  Alert when stock falls below this level
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
                  <CardTitle>Product Variants</CardTitle>
                  <CardDescription>
                    Add different versions of your product (colors, storage,
                    etc.)
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
                  Generate with AI
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addVariant}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Variant
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
                  Mobile Device Specs Pre-configured
                </p>
                <p className="text-xs text-muted-foreground">
                  Common specifications like Color, Storage, RAM, and Region are
                  pre-filled. You can modify or add more specs as needed.
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
                    Variant {vIndex + 1}
                  </Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 mb-4">
                  <div className="space-y-2">
                    <Label className="text-sm">
                      <Barcode className="inline h-3.5 w-3.5 mr-1.5" />
                      SKU
                      <Badge
                        variant="outline"
                        className="ml-2 text-[10px] font-normal"
                      >
                        Auto-generated
                      </Badge>
                    </Label>
                    <div className="flex items-center h-9 px-3 rounded-md border border-input bg-muted/30 text-sm font-mono text-muted-foreground">
                      {variant.name || brandId ? (
                        getVariantSKU(variant, vIndex)
                      ) : (
                        <span className="italic">
                          Fill in details to generate
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Generated from brand, product & specs
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Variant Name *</Label>
                    <Input
                      placeholder="e.g., Black 128GB"
                      value={variant.name}
                      onChange={(e) =>
                        updateVariant(vIndex, "name", e.target.value)
                      }
                      className="bg-background"
                    />
                  </div>
                </div>

                {/* Specs */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">
                      Specifications
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addSpec(vIndex)}
                      className="h-7 text-xs gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Add Spec
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
                            <SelectValue placeholder="Select spec" />
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
                          placeholder={getSpecPlaceholder(spec.key)}
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
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isFormValid || createMutation.isPending}
            className="gap-2 min-w-32"
          >
            {createMutation.isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Create Product
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
