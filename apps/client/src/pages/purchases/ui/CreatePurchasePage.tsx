import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { purchaseQueries } from "@/entities/purchase";
import { providerQueries } from "@/entities/provider";
import { warehouseQueries } from "@/entities/warehouse";
import { productQueries } from "@/entities/product";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/shared/ui/card";
import {
  Search,
  Plus,
  Trash2,
  ArrowLeft,
  Package,
  DollarSign,
  Loader2,
  CheckCircle2,
  ScanBarcode,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Badge } from "@/shared/ui/badge";
import { toast } from "sonner";
import { usePurchaseStore } from "../model/purchase-store";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { User, Store } from "lucide-react";

export default function CreatePurchasePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    type,
    providerId,
    sellerInfo,
    warehouseId,
    items,
    createdAt,
    setType,
    setProviderId,
    setSellerInfo,
    setWarehouseId,
    setCreatedAt,
    addItem: addStoreItem,
    removeItem,
    updateItem,
    resetForm,
  } = usePurchaseStore();

  const [search, setSearch] = useState("");
  const searchInputRef = useMemo(
    () => ({ current: null as HTMLInputElement | null }),
    [],
  );

  const { data: providers } = providerQueries.useAll();
  const { data: warehouses } = warehouseQueries.useAll();
  const { data: products } = productQueries.useAll();

  const createPurchaseMutation = purchaseQueries.useCreate();

  // Filter variants based on search
  const filteredVariants = useMemo(() => {
    if (!products || !search) return [];
    const results: any[] = [];
    const lowerSearch = search.toLowerCase();

    products.forEach((p) => {
      p.variants.forEach((v) => {
        const fullName = `${p.name} ${v.name}`.toLowerCase();
        const sku = v.sku.toLowerCase();
        const modelCode = (v.modelCode || "").toLowerCase();

        if (
          fullName.includes(lowerSearch) ||
          sku.includes(lowerSearch) ||
          modelCode.includes(lowerSearch)
        ) {
          results.push({
            id: v.id,
            name: v.name,
            productName: p.name,
            modelCode: v.modelCode,
            sku: v.sku,
            type: p.type,
          });
        }
      });
    });
    return results.slice(0, 10); // Show more results
  }, [products, search]);

  const addItem = (variant: any) => {
    addStoreItem({
      variantId: variant.id,
      name: `${variant.productName} ${variant.name}`,
      sku: variant.sku,
      quantity: 1,
      costPrice: 0,
      productType: variant.type,
      serialNumber: variant.type === "SERIALIZED" ? "" : undefined,
    });
    // Allow immediate focus back to search for speed
    setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const totalCost = items.reduce(
    (sum, item) => sum + item.costPrice * item.quantity,
    0,
  );

  const handleSubmit = () => {
    if (type === "PROVIDER" && !providerId)
      return toast.error(t("purchases.create.toast.select_provider"));
    if (type === "WALKING_CUSTOMER" && !sellerInfo)
      return toast.error(t("purchases.create.toast.enter_seller"));
    if (!warehouseId)
      return toast.error(t("purchases.create.toast.select_warehouse"));
    if (items.length === 0)
      return toast.error(t("purchases.create.toast.add_item"));

    // Validate serialized items
    const invalidSerialized = items.find(
      (item) => item.productType === "SERIALIZED" && !item.serialNumber,
    );
    if (invalidSerialized) {
      return toast.error(
        t("purchases.create.toast.sn_required", {
          name: invalidSerialized.name,
        }),
      );
    }

    createPurchaseMutation.mutate(
      {
        type,
        providerId: type === "PROVIDER" ? Number(providerId) : undefined,
        sellerInfo: type === "WALKING_CUSTOMER" ? sellerInfo : undefined,
        warehouseId: Number(warehouseId),
        createdAt: createdAt ? new Date(createdAt).toISOString() : undefined,
        items: items.map((item) => ({
          variantId: item.variantId,
          warehouseId: Number(warehouseId),
          quantity: item.quantity,
          costPrice: item.costPrice,
          serialNumber: item.serialNumber,
          batchNumber: item.batchNumber,
        })),
      },
      {
        onSuccess: () => {
          resetForm();
          navigate("/purchases");
        },
      },
    );
  };

  return (
    <div className="w-full px-6 space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/purchases")}
            className="rounded-xl border-border bg-card hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight italic uppercase">
              {t("purchases.create.title")}
            </h1>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
              {t("purchases.create.description")}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={createPurchaseMutation.isPending}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 py-6 rounded-xl shadow-xl shadow-emerald-600/10 h-auto"
        >
          {createPurchaseMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {t("purchases.create.confirm")}
            </>
          )}
        </Button>
      </div>

      {/* Purchase Type & Top Bar */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
        <Tabs
          value={type}
          onValueChange={(v) => setType(v as "PROVIDER" | "WALKING_CUSTOMER")}
          className="w-full lg:w-auto"
        >
          <TabsList className="bg-card border border-border h-12 p-1 rounded-xl">
            <TabsTrigger
              value="PROVIDER"
              className="px-6 rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-black text-[10px] uppercase tracking-wider gap-2 h-full"
            >
              <Store className="w-3.5 h-3.5" />
              {t("purchases.create.supplier_purchase")}
            </TabsTrigger>
            <TabsTrigger
              value="WALKING_CUSTOMER"
              className="px-6 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black text-[10px] uppercase tracking-wider gap-2 h-full"
            >
              <User className="w-3.5 h-3.5" />
              {t("purchases.create.walking_seller")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Top Bar Info */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {type === "PROVIDER" ? (
          <Card className="bg-card border-border shadow-sm col-span-1 lg:col-span-1">
            <CardContent className="p-4 space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                {t("purchases.create.supplier_label")}
              </label>
              <Select value={providerId} onValueChange={setProviderId}>
                <SelectTrigger className="h-10 bg-muted border-border rounded-lg text-xs font-bold">
                  <SelectValue
                    placeholder={t("purchases.create.select_supplier")}
                  />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {providers?.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border shadow-sm col-span-1 lg:col-span-1 border-l-4 border-l-blue-500">
            <CardContent className="p-4 space-y-2">
              <label className="text-[10px] font-black uppercase text-blue-500 tracking-wider">
                {t("purchases.create.seller_details")}
              </label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder={t("purchases.create.seller_placeholder")}
                  value={sellerInfo}
                  onChange={(e) => setSellerInfo(e.target.value)}
                  className="pl-8 h-10 bg-muted border-border rounded-lg text-xs font-bold"
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card border-border shadow-sm col-span-1 lg:col-span-1">
          <CardContent className="p-4 space-y-2">
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
              {t("purchases.create.warehouse")}
            </label>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger className="h-10 bg-muted border-border rounded-lg text-xs font-bold">
                <SelectValue
                  placeholder={t("purchases.create.select_warehouse")}
                />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {warehouses?.map((w) => (
                  <SelectItem key={w.id} value={String(w.id)}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm col-span-1 lg:col-span-1">
          <CardContent className="p-4 space-y-2">
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
              {t("purchases.create.purchase_date")}
            </label>
            <Input
              type="date"
              value={createdAt}
              onChange={(e) => setCreatedAt(e.target.value)}
              className="h-10 bg-muted border-border rounded-lg text-xs font-bold"
            />
          </CardContent>
        </Card>

        <Card className="bg-emerald-600/5 border-emerald-500/10 col-span-1 lg:col-span-1">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">
              {t("purchases.create.total_cost")}
            </p>
            <h2 className="text-2xl font-black text-foreground tracking-tighter">
              ${totalCost.toLocaleString()}
            </h2>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="bg-card border-border shadow-2xl flex-1 flex flex-col">
          <CardHeader className="pb-4 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest">
                {t("purchases.create.inbound_manifest")}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground/60">
                {t("purchases.create.manifest_desc")}
              </CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={(el) => {
                  searchInputRef.current = el;
                }}
                placeholder={t("purchases.create.search_products")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 bg-muted border-border rounded-lg text-xs font-bold"
              />

              {filteredVariants.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                  {filteredVariants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => addItem(v)}
                      className="w-full text-left px-4 py-3 hover:bg-muted flex items-center justify-between group border-b border-border last:border-0"
                    >
                      <div>
                        <p className="text-xs font-black text-foreground">
                          {v.productName} {v.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-muted-foreground/40 font-mono">
                            {v.sku}
                          </p>
                          {v.modelCode && (
                            <Badge
                              variant="outline"
                              className="text-[9px] h-3.5 px-1 border-border/50 text-muted-foreground/50"
                            >
                              {v.modelCode}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {v.type === "SERIALIZED" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-[10px] font-black uppercase text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              const input = prompt(
                                "Paste serial numbers (separated by comma, space or newline):",
                              );
                              if (input) {
                                const serials = input
                                  .split(/[,\s\n]+/)
                                  .filter((s) => s.trim().length > 0);
                                serials.forEach((sn) => {
                                  addStoreItem({
                                    variantId: v.id,
                                    name: `${v.productName} ${v.name}`,
                                    sku: v.sku,
                                    quantity: 1,
                                    costPrice: 0,
                                    productType: v.type,
                                    serialNumber: sn.toUpperCase(),
                                  });
                                });
                                toast.success(
                                  t("purchases.create.toast.added_serials", {
                                    count: serials.length,
                                  }),
                                );
                                setSearch("");
                              }
                            }}
                          >
                            {t("purchases.create.bulk")}
                          </Button>
                        )}
                        <Plus className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>

          <div className="flex-1 overflow-auto">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 space-y-6">
                <div className="flex flex-col items-center opacity-30">
                  <Package className="w-12 h-12 mb-4" />
                  <p className="font-black text-xs uppercase tracking-widest text-center">
                    {t("purchases.create.no_items")}
                    <br />
                    <span className="text-[10px] font-medium normal-case tracking-normal">
                      {t("purchases.create.search_tip")}
                    </span>
                  </p>
                </div>

                <div className="w-full max-w-md space-y-4">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center border-b border-border pb-2">
                    {t("purchases.create.suggested_products")}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {products?.slice(0, 4).map((p) =>
                      p.variants.slice(0, 1).map((v) => (
                        <button
                          key={v.id}
                          onClick={() =>
                            addItem({
                              ...v,
                              productName: p.name,
                              type: p.type,
                            })
                          }
                          className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border hover:border-emerald-500/50 transition-all group"
                        >
                          <div className="text-left">
                            <p className="text-xs font-bold text-foreground">
                              {p.name} {v.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground/40 font-mono">
                              {v.sku}
                            </p>
                          </div>
                          <Plus className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )),
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <Table className="border-collapse">
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-border h-8">
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground px-4 h-8">
                      {t("purchases.create.product")}
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground px-2 h-8">
                      <div className="flex items-center gap-1">
                        {t("purchases.create.batch")}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          onClick={() => {
                            if (items.length > 0) {
                              const firstBatch = items[0].batchNumber;
                              items.forEach((_, i) =>
                                updateItem(i, { batchNumber: firstBatch }),
                              );
                              toast.success(
                                t("purchases.create.toast.applied_batch"),
                              );
                            }
                          }}
                        >
                          <CheckCircle2 className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground px-2 h-8">
                      <div className="flex items-center gap-1">
                        {t("purchases.create.cost")}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          onClick={() => {
                            if (items.length > 0) {
                              const firstCost = items[0].costPrice;
                              items.forEach((_, i) =>
                                updateItem(i, { costPrice: firstCost }),
                              );
                              toast.success(
                                t("purchases.create.toast.applied_cost"),
                              );
                            }
                          }}
                        >
                          <CheckCircle2 className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground px-2 h-8">
                      Qty
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground px-2 h-8">
                      {t("purchases.create.sn")}
                    </TableHead>
                    <TableHead className="w-10 px-2 h-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow
                      key={index}
                      className="border-border hover:bg-muted/10 h-10"
                    >
                      <TableCell className="py-1 px-4">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-foreground">
                            {item.name}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-[9px] h-4 px-1 border-border text-muted-foreground font-mono uppercase"
                          >
                            {item.sku}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="py-1 px-2">
                        <Input
                          placeholder={t("purchases.create.batch_id")}
                          value={item.batchNumber || ""}
                          onChange={(e) =>
                            updateItem(index, {
                              batchNumber: e.target.value,
                            })
                          }
                          className="h-7 bg-muted/30 border-border text-xs font-medium"
                        />
                      </TableCell>
                      <TableCell className="py-1 px-2">
                        <div className="relative w-24">
                          <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                          <Input
                            type="number"
                            value={item.costPrice}
                            onChange={(e) =>
                              updateItem(index, {
                                costPrice: Number(e.target.value),
                              })
                            }
                            className="pl-6 h-7 bg-muted/30 border-border text-xs font-black text-emerald-500"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="py-1 px-2">
                        <Input
                          type="number"
                          disabled={item.productType === "SERIALIZED"}
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, {
                              quantity: Number(e.target.value),
                            })
                          }
                          className="w-14 h-7 bg-muted/30 border-border text-xs font-bold text-foreground"
                        />
                      </TableCell>
                      <TableCell className="py-1 px-2">
                        {item.productType === "SERIALIZED" ? (
                          <div className="relative">
                            <ScanBarcode className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-emerald-500" />
                            <Input
                              placeholder="Serial No."
                              value={item.serialNumber}
                              onChange={(e) =>
                                updateItem(index, {
                                  serialNumber: e.target.value.toUpperCase(),
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const currentTr = (
                                    e.target as HTMLElement
                                  ).closest("tr");
                                  const nextInput =
                                    currentTr?.nextElementSibling?.querySelector(
                                      'input[placeholder="Serial No."]',
                                    ) as HTMLInputElement;
                                  if (nextInput) {
                                    nextInput.focus();
                                  } else {
                                    searchInputRef.current?.focus();
                                  }
                                }
                              }}
                              className="pl-7 h-7 bg-muted/30 border-emerald-500/20 text-xs font-mono uppercase text-foreground placeholder:text-muted-foreground/20"
                            />
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/40 font-bold uppercase italic ml-2">
                            {t("purchases.create.non_serialized")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-1 px-2 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="h-7 w-7 text-muted-foreground/40 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
