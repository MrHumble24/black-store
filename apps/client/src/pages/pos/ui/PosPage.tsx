import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { inventoryQueries } from "@/entities/inventory";
import { salesQueries } from "@/entities/sale";
import { warehouseQueries } from "@/entities/warehouse";
import { usePosStore } from "../model/pos-store";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ScanBarcode,
  ArrowLeft,
  User,
  Package,
  Loader2,
  Phone,
  PauseCircle,
  ChevronsUpDown,
} from "lucide-react";
import { BarcodeScanner } from "@/shared/ui/barcode-scanner";
import { SaleSuccessModal } from "./SaleSuccessModal";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import { ScrollArea } from "@/shared/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/command";
import { useTranslation } from "react-i18next";

// Component part
const SerialSelector = ({ product, onSelect }: any) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full h-10 justify-between rounded-full bg-foreground text-background border-none hover:bg-foreground/90 transition-all font-semibold"
        >
          <div className="flex items-center gap-2">
            <ScanBarcode className="w-4 h-4" />
            <span className="truncate">{t("pos.serial_placeholder")}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-popover border-border rounded-xl shadow-2xl">
        <Command className="bg-transparent">
          <CommandInput
            placeholder={t("pos.search_placeholder")}
            className="h-10 text-sm font-medium"
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty className="text-xs text-muted-foreground p-4">
              {t("pos.not_found")}
            </CommandEmpty>
            <CommandGroup>
              {product.items.map((item: any) => (
                <CommandItem
                  key={item.id}
                  value={item.serialNumber}
                  onSelect={() => {
                    onSelect(String(item.id));
                    setOpen(false);
                  }}
                  className="p-3 cursor-pointer hover:bg-muted/50 rounded-lg mx-1 my-0.5 border-b border-border/20 last:border-0"
                >
                  <div className="flex flex-col gap-0.5 w-full">
                    <span className="font-bold text-sm font-mono text-foreground">
                      {item.serialNumber}
                    </span>
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      <span>{product.sku}</span>
                      <span className="text-emerald-500">
                        ${item.costPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default function PosPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    cart,
    customerName,
    customerPhone,
    paymentMethod,
    discountAmount,
    taxAmount,
    invoiceNo,
    createdAt,
    heldCarts,
    setCustomerName,
    setCustomerPhone,
    setInvoiceNo,
    setCreatedAt,
    setPaymentMethod,
    setDiscountAmount,
    setTaxAmount,
    addItem,
    removeItem,
    updateQuantity,
    updatePrice,
    clearCart,
    holdCurrentCart,
    resumeCart,
    deleteHeldCart,
    getSubtotal,
    getTotal,
  } = usePosStore();
  const createSaleMutation = salesQueries.useCreate();
  const { data: warehouses } = warehouseQueries.useAll();

  const [warehouseId, setWarehouseId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Fetch all available inventory
  const { data: inventory, isLoading } = inventoryQueries.useAll({
    status: "AVAILABLE",
    warehouseId: warehouseId === "all" ? undefined : Number(warehouseId),
  });

  // Grouped variants for selection
  const availableProducts = useMemo(() => {
    if (!inventory) return [];

    const productMap = new Map();
    inventory.forEach((item: any) => {
      const v = item.variant;
      if (!v) return;
      const key = v.id;
      if (!productMap.has(key)) {
        productMap.set(key, {
          id: v.id,
          sku: v.sku,
          name: v.name,
          productName: v.product.name,
          productType: v.product.type,
          modelCode: v.modelCode,
          sellPrice: Number(item.costPrice), // Use costPrice as default
          totalStock: 0,
          items: [],
        });
      }
      const existing = productMap.get(key);
      existing.totalStock += item.quantity;
      existing.items.push(item);
    });

    return Array.from(productMap.values()).filter((p) => {
      const searchLower = search.toLowerCase();
      return (
        p.productName.toLowerCase().includes(searchLower) ||
        p.name.toLowerCase().includes(searchLower) ||
        p.sku.toLowerCase().includes(searchLower) ||
        (p.modelCode && p.modelCode.toLowerCase().includes(searchLower)) ||
        p.items.some((item: any) =>
          item.serialNumber?.toLowerCase().includes(searchLower),
        )
      );
    });
  }, [inventory, search]);

  const handleAddToCart = (product: any, specificItem?: any) => {
    if (product.productType === "SERIALIZED" && !specificItem) {
      toast.info(t("pos.select_sn"));
      return;
    }

    addItem({
      variantId: product.id,
      sku: product.sku,
      name: product.name,
      productName: product.productName,
      sellPrice: product.sellPrice,
      quantity: 1,
      productType: product.productType,
      inventoryItemId: specificItem?.id,
      serialNumber: specificItem?.serialNumber,
    });
    setSearch("");
    toast.success(t("pos.add_ok"));
  };

  const handleBarcodeScan = (code: string) => {
    const itemBySN = inventory?.find(
      (item: any) => item.serialNumber?.toLowerCase() === code.toLowerCase(),
    );
    if (itemBySN && itemBySN.variant) {
      const product = {
        id: itemBySN.variant.id,
        sku: itemBySN.variant.sku,
        name: itemBySN.variant.name,
        productName: itemBySN.variant.product.name,
        productType: itemBySN.variant.product.type,
        sellPrice: Number(itemBySN.costPrice), // Use costPrice as default
      };
      handleAddToCart(product, itemBySN);
      setSearch("");
      return;
    }

    const productBySKU = availableProducts.find(
      (p) => p.sku.toLowerCase() === code.toLowerCase(),
    );
    if (productBySKU) {
      if (productBySKU.productType === "SERIALIZED") {
        toast.info(t("pos.sku_matched"));
        setSearch(code);
      } else {
        handleAddToCart(productBySKU);
        setSearch("");
      }
      return;
    }

    toast.error(t("pos.not_found"));
  };

  const [receivedAmount, setReceivedAmount] = useState<number | string>("");

  const handleCheckout = () => {
    if (cart.length === 0) return;

    createSaleMutation.mutate(
      {
        customerName: customerName || t("pos.walking_customer"),
        customerPhone: customerPhone || undefined,
        paymentMethod,
        discountAmount,
        taxAmount,
        invoiceNo: invoiceNo || undefined,
        createdAt: createdAt || undefined,
        items: cart.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          sellPrice: item.sellPrice,
          inventoryItemId: item.inventoryItemId,
        })),
      },
      {
        onSuccess: (data) => {
          setLastSale(data);
          setIsSuccessModalOpen(true);
          clearCart();
          setReceivedAmount("");
          toast.success(t("pos.sale_complete"));
        },
      },
    );
  };

  const subtotal = getSubtotal();
  const total = getTotal();
  const change =
    typeof receivedAmount === "number" && receivedAmount >= total
      ? receivedAmount - total
      : 0;

  return (
    <div className="flex flex-col h-[calc(100dvh-120px)] lg:h-[calc(100vh-140px)] gap-4 overflow-hidden">
      {/* Header - Apple Style */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Title & Back */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              {t("pos.title")}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <p className="text-sm text-muted-foreground">
                {t("pos.session_active")}
              </p>
              {heldCarts.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
                  {heldCarts.length} {t("pos.held")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Customer Info & Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Customer Name */}
          <div className="flex-1 min-w-[140px]">
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
              {t("pos.customer")}
            </label>
            <div className="flex items-center gap-2 bg-muted/50 hover:bg-muted/70 px-3 py-2 rounded-xl transition-colors">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                placeholder={t("pos.customer_placeholder")}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-full"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="flex-1 min-w-[140px]">
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
              {t("pos.phone")}
            </label>
            <div className="flex items-center gap-2 bg-muted/50 hover:bg-muted/70 px-3 py-2 rounded-xl transition-colors">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                placeholder={t("pos.phone_placeholder")}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-full"
              />
            </div>
          </div>

          {/* Invoice */}
          <div className="flex-1 min-w-[120px]">
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
              {t("pos.invoice")}
            </label>
            <div className="flex items-center gap-2 bg-muted/50 hover:bg-muted/70 px-3 py-2 rounded-xl transition-colors">
              <ScanBarcode className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                placeholder={t("pos.invoice_placeholder")}
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-full"
              />
            </div>
          </div>

          {/* Date */}
          <div className="flex-1 min-w-[120px]">
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
              {t("pos.date")}
            </label>
            <div className="flex items-center gap-2 bg-muted/50 hover:bg-muted/70 px-3 py-2 rounded-xl transition-colors">
              <input
                type="date"
                value={createdAt}
                onChange={(e) => setCreatedAt(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-foreground w-full"
              />
            </div>
          </div>

          {/* Hold Button */}
          <div className="shrink-0">
            <label className="text-[10px] font-medium text-transparent mb-1 block">
              Action
            </label>
            <button
              onClick={() => {
                if (cart.length > 0) {
                  const label = prompt(
                    t("pos.cart_label"),
                    `${t("pos.cart_label_default")} ${customerName || heldCarts.length + 1}`,
                  );
                  if (label) holdCurrentCart(label);
                }
              }}
              disabled={cart.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-sm"
            >
              <PauseCircle className="w-4 h-4" />
              {t("pos.hold")}
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row flex-1 gap-3 min-h-0 overflow-hidden">
        {/* Left: Product Selection (List Layout) */}
        <div className="lg:basis-7/12 flex flex-col min-w-0 min-h-0 overflow-hidden">
          <div className="bg-card border border-border/50 flex-1 flex flex-col overflow-hidden rounded-2xl shadow-sm">
            {/* Search Bar - Clean & Modern */}
            <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-card/50 backdrop-blur-sm z-10 transition-all">
              <div className="relative flex-1 group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && search.trim()) {
                      handleBarcodeScan(search.trim());
                    }
                  }}
                  className="pl-10 h-12 bg-muted/40 border-transparent hover:bg-muted/60 focus:bg-background focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1.5">
                  <span className="px-1.5 py-0.5 rounded-md bg-background border border-border text-[10px] font-medium text-muted-foreground hidden sm:block">
                    IMEI
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-background border border-border text-[10px] font-medium text-muted-foreground hidden sm:block">
                    SKU
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Select value={warehouseId} onValueChange={setWarehouseId}>
                  <SelectTrigger className="w-full sm:w-44 h-12 bg-muted/40 border-transparent hover:bg-muted/60 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border rounded-xl shadow-xl">
                    <SelectItem value="all">{t("pos.global_stock")}</SelectItem>
                    {warehouses?.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Product List */}
            <ScrollArea className="flex-1 bg-muted/5">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center p-12">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-muted-foreground/10 border-t-blue-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    </div>
                  </div>
                  <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">
                    {t("pos.syncing")}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col p-2 gap-2">
                  {availableProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <h3 className="font-semibold text-foreground">
                        {t("pos.no_products")}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                        {t("pos.search_tip")}
                      </p>
                    </div>
                  ) : (
                    availableProducts.map((p) => (
                      <div
                        key={p.id}
                        className="group relative flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-4 rounded-xl bg-card border border-border/40 hover:border-blue-500/30 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-300"
                      >
                        {/* Hover Indicator */}
                        <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-all duration-300 scale-y-50 group-hover:scale-y-100" />

                        <div className="flex items-center gap-4 flex-1 pl-2">
                          {/* Icon Box */}
                          <div
                            className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105",
                              p.productType === "SERIALIZED"
                                ? "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                                : "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
                            )}
                          >
                            <Package className="w-6 h-6" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-base text-foreground truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {p.productName}
                              </h3>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground tracking-wide uppercase">
                                {p.sku}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="truncate max-w-[200px]">
                                {p.name}
                              </span>
                              <span className="w-px h-3 bg-border" />
                              <span
                                className={cn(
                                  "font-medium",
                                  p.totalStock > 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-red-500",
                                )}
                              >
                                {p.totalStock} {t("pos.in_stock")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-5 pl-2 sm:pl-0 border-t sm:border-t-0 border-border/50 pt-3 sm:pt-0 mt-2 sm:mt-0">
                          {/* Price */}
                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold text-foreground tabular-nums tracking-tight">
                              ${p.sellPrice.toLocaleString()}
                            </p>
                          </div>

                          {/* Action Button */}
                          <div className="w-full sm:w-44 shrink-0">
                            {p.productType === "SERIALIZED" ? (
                              <SerialSelector
                                product={p}
                                onSelect={(val: string) => {
                                  const item = p.items.find(
                                    (i: any) => String(i.id) === val,
                                  );
                                  if (item) handleAddToCart(p, item);
                                }}
                              />
                            ) : (
                              <Button
                                onClick={() => handleAddToCart(p)}
                                size="sm"
                                disabled={p.totalStock <= 0}
                                className="w-full h-10 rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold shadow-lg shadow-foreground/10 transition-all active:scale-95"
                              >
                                <span>{t("pos.add_to_cart")}</span>
                                <Plus className="w-4 h-4 ml-1.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Right: Cart - Apple-inspired Design */}
        <div className="lg:basis-5/12 flex flex-col min-w-[380px] min-h-0 overflow-hidden relative">
          <div className="bg-gradient-to-b from-background to-muted/30 flex-1 flex flex-col overflow-hidden rounded-2xl border border-border/50 shadow-xl min-h-0 relative">
            {/* Cart Header - Clean & Minimal */}
            <div className="px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-base text-foreground tracking-tight">
                    {t("pos.your_cart")}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {cart.length === 0
                      ? t("pos.no_items")
                      : t("pos.items", { count: cart.length })}
                  </p>
                </div>
              </div>
              {cart.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full px-3 h-8 text-xs font-medium transition-all duration-200"
                >
                  {t("pos.clear_all")}
                </Button>
              )}
            </div>

            {/* Cart Items - Apple Style Cards */}
            <ScrollArea className="flex-1 min-h-0 px-4">
              {cart.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <ShoppingCart className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("pos.cart_empty")}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {t("pos.cart_empty_tip")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pb-4">
                  {cart.map((item, index) => (
                    <div
                      key={`${item.variantId}-${item.serialNumber}`}
                      className="group bg-card rounded-xl border border-border/50 p-4 transition-all duration-200 hover:shadow-md hover:border-border"
                    >
                      {/* Item Row */}
                      <div className="flex gap-4">
                        {/* Order Number - Subtle Circle */}
                        <div className="shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                          {index + 1}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-sm text-foreground leading-tight truncate">
                                {item.productName}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {item.name}
                              </p>
                            </div>
                            {/* Price - Right Aligned */}
                            <div className="text-right shrink-0">
                              <p className="font-bold text-base text-foreground tabular-nums">
                                $
                                {(
                                  item.sellPrice * item.quantity
                                ).toLocaleString()}
                              </p>
                              {item.quantity > 1 && (
                                <p className="text-[11px] text-muted-foreground">
                                  ${item.sellPrice.toLocaleString()}{" "}
                                  {t("pos.each")}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Meta Info Row */}
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-[10px] font-medium text-muted-foreground">
                              {item.sku}
                            </span>
                            {item.serialNumber && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-[10px] font-mono text-blue-600 dark:text-blue-400">
                                {item.serialNumber}
                              </span>
                            )}
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium",
                                item.productType === "SERIALIZED"
                                  ? "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400"
                                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
                              )}
                            >
                              {item.productType === "SERIALIZED"
                                ? t("pos.imei")
                                : t("pos.batch")}
                            </span>
                          </div>

                          {/* Actions Row */}
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                            {/* Quantity or Price Edit */}
                            <div className="flex items-center gap-3">
                              {item.productType !== "SERIALIZED" && (
                                <div className="flex items-center bg-muted rounded-lg overflow-hidden">
                                  <button
                                    className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 transition-colors disabled:opacity-30"
                                    disabled={item.quantity <= 1}
                                    onClick={() =>
                                      updateQuantity(
                                        item.variantId,
                                        item.quantity - 1,
                                        item.serialNumber,
                                      )
                                    }
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="w-10 text-center text-sm font-semibold text-foreground">
                                    {item.quantity}
                                  </span>
                                  <button
                                    className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 transition-colors"
                                    onClick={() =>
                                      updateQuantity(
                                        item.variantId,
                                        item.quantity + 1,
                                        item.serialNumber,
                                      )
                                    }
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                              {/* Price Edit */}
                              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/50 border border-transparent focus-within:border-blue-500/50 focus-within:bg-muted transition-all">
                                <span className="text-xs text-muted-foreground">
                                  $
                                </span>
                                <input
                                  type="number"
                                  value={item.sellPrice}
                                  onChange={(e) =>
                                    updatePrice(
                                      item.variantId,
                                      Number(e.target.value),
                                      item.serialNumber,
                                    )
                                  }
                                  className="bg-transparent border-none outline-none text-sm font-medium text-foreground w-16 tabular-nums"
                                />
                              </div>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() =>
                                removeItem(item.variantId, item.serialNumber)
                              }
                              className="text-xs text-muted-foreground hover:text-red-500 font-medium transition-colors duration-200 opacity-0 group-hover:opacity-100"
                            >
                              {t("pos.remove")}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Checkout Section - Clean Card */}
            <div className="p-5 bg-card border-t border-border/50 space-y-4 shrink-0">
              {/* Payment Methods - Pill Style */}
              <div className="flex gap-2 justify-center">
                {(["CASH", "CARD", "TRANSFER", "OTHER"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-medium transition-all duration-200",
                      paymentMethod === m
                        ? "bg-foreground text-background shadow-lg"
                        : "bg-muted text-muted-foreground hover:bg-muted-foreground/10",
                    )}
                  >
                    {m === "CASH" && "💵 "}
                    {m === "CARD" && "💳 "}
                    {m === "TRANSFER" && "📱 "}
                    {t(`pos.payment_${m.toLowerCase()}`)}
                  </button>
                ))}
              </div>

              {/* Discount & Tax - Inline */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">
                    {t("pos.discount")}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <input
                      type="number"
                      value={discountAmount}
                      onChange={(e) =>
                        setDiscountAmount(Number(e.target.value))
                      }
                      className="w-full pl-7 pr-3 py-2 bg-muted/40 border-none rounded-xl text-sm font-semibold tabular-nums focus:bg-muted transition-all outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">
                    {t("pos.tax")}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <input
                      type="number"
                      value={taxAmount}
                      onChange={(e) => setTaxAmount(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 bg-muted/40 border-none rounded-xl text-sm font-semibold tabular-nums focus:bg-muted transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Total Calculation - Prominent */}
              <div className="bg-muted/50 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {t("pos.subtotal")}
                  </span>
                  <span className="font-semibold text-foreground tabular-nums">
                    ${subtotal.toLocaleString()}
                  </span>
                </div>
                <Separator className="bg-border/50" />
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-foreground">
                    {t("pos.total")}
                  </span>
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums tracking-tighter">
                    ${total.toLocaleString()}
                  </span>
                </div>
              </div>

              {paymentMethod === "CASH" && (
                <div className="grid grid-cols-2 gap-3 pb-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">
                      {t("pos.received")}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        $
                      </span>
                      <input
                        type="number"
                        value={receivedAmount}
                        onChange={(e) =>
                          setReceivedAmount(Number(e.target.value))
                        }
                        className="w-full pl-7 pr-3 py-2 bg-blue-500/10 border-none rounded-xl text-sm font-bold text-blue-600 dark:text-blue-400 tabular-nums focus:bg-blue-500/20 transition-all outline-none placeholder:text-blue-500/30"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">
                      {t("pos.change")}
                    </label>
                    <div className="px-3 py-2 bg-emerald-500/10 rounded-xl">
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                        ${change.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Final Action Button */}
              <Button
                onClick={handleCheckout}
                disabled={cart.length === 0 || createSaleMutation.isPending}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white dark:text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-40"
              >
                {createSaleMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t("pos.processing")}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    <span>{t("pos.checkout")}</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <BarcodeScanner
        isOpen={isScannerOpen}
        onScan={handleBarcodeScan}
        onClose={() => setIsScannerOpen(false)}
      />

      <SaleSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          setLastSale(null);
        }}
        sale={lastSale}
      />

      {/* Held Carts Panel - Overlay Side Panel */}
      {heldCarts.length > 0 && (
        <div className="fixed bottom-6 left-6 z-50">
          <Popover>
            <PopoverTrigger asChild>
              <Button className="h-12 px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xl shadow-amber-500/20 gap-2 border-none">
                <PauseCircle className="w-5 h-5" />
                {t("pos.saved_carts")}
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                  {heldCarts.length}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              className="w-80 p-0 rounded-2xl border-border bg-card shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-bold text-sm text-foreground">
                  {t("pos.saved_carts")}
                </h3>
              </div>
              <ScrollArea className="max-h-[300px]">
                <div className="p-2 space-y-1">
                  {heldCarts.map((held) => {
                    const heldTotal = held.cart.reduce(
                      (sum, item) => sum + item.sellPrice * item.quantity,
                      0,
                    );
                    return (
                      <div
                        key={held.id}
                        className="group p-3 rounded-xl hover:bg-muted transition-all border border-transparent hover:border-border"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-sm text-foreground truncate flex-1">
                              {held.label}
                            </h4>
                            <span className="text-[10px] font-black tabular-nums text-muted-foreground opacity-60">
                              {new Date(held.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground font-medium">
                              {held.cart.length}{" "}
                              {t("pos.items", { count: held.cart.length })}
                            </span>
                            <span className="font-black text-amber-500">
                              ${heldTotal.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex gap-2 mt-1">
                            <Button
                              size="sm"
                              onClick={() => resumeCart(held.id)}
                              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg h-8 font-bold text-[10px] uppercase"
                            >
                              {t("pos.adjustments")}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteHeldCart(held.id)}
                              className="w-10 h-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}

function Separator({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-border", className)} />;
}
