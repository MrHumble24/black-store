import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { inventoryQueries } from "@/entities/inventory";
import { salesQueries } from "@/entities/sale";
import { warehouseQueries } from "@/entities/warehouse";
import { usePosStore } from "../model/pos-store";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card } from "@/shared/ui/card";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ScanBarcode,
  ArrowLeft,
  CreditCard,
  User,
  Package,
  History,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { BarcodeScanner } from "@/shared/ui/barcode-scanner";
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
import { Badge } from "@/shared/ui/badge";

export default function PosPage() {
  const navigate = useNavigate();
  const {
    cart,
    addItem,
    removeItem,
    updateQuantity,
    updatePrice,
    total,
    clearCart,
    customerName,
    setCustomerName,
  } = usePosStore();
  const createSaleMutation = salesQueries.useCreate();
  const { data: warehouses } = warehouseQueries.useAll();

  const [warehouseId, setWarehouseId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

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
          sellPrice: Number(item.costPrice), // Use costPrice as default
          totalStock: 0,
          items: [],
        });
      }
      const existing = productMap.get(key);
      existing.totalStock += item.quantity;
      existing.items.push(item);
    });

    return Array.from(productMap.values()).filter(
      (p) =>
        p.productName.toLowerCase().includes(search.toLowerCase()) ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    );
  }, [inventory, search]);

  const handleAddToCart = (product: any, specificItem?: any) => {
    if (product.productType === "SERIALIZED" && !specificItem) {
      toast.info("Please select a specific serial number");
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
    toast.success(`Add item OK`);
  };

  const handleBarcodeScan = (code: string) => {
    const itemBySN = inventory?.find(
      (item: any) => item.serialNumber?.toLowerCase() === code.toLowerCase()
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
      return;
    }

    const productBySKU = availableProducts.find(
      (p) => p.sku.toLowerCase() === code.toLowerCase()
    );
    if (productBySKU) {
      if (productBySKU.productType === "SERIALIZED") {
        toast.info("SKU matched. Choose S/N");
        setSearch(code);
      } else {
        handleAddToCart(productBySKU);
      }
      return;
    }

    toast.error("Not found");
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    createSaleMutation.mutate(
      {
        customerName: customerName || "Walking Customer",
        items: cart.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          sellPrice: item.sellPrice,
          inventoryItemId: item.inventoryItemId,
        })),
      },
      {
        onSuccess: () => {
          clearCart();
          navigate("/inventory");
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-full lg:h-[calc(100vh-8rem)] gap-3">
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-card border border-border p-4 rounded-xl gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-lg h-10 w-10 border-border hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">
              POS Terminal
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                Session Active
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex flex-1 items-center gap-2 bg-muted/50 border border-border px-3 py-1.5 rounded-lg focus-within:border-blue-500/50 transition-colors">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              placeholder="Customer"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-foreground placeholder:text-muted-foreground w-full sm:w-32"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/inventory/movements")}
            className="text-muted-foreground hover:text-foreground h-9 px-3 shrink-0"
          >
            <History className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Archive</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 gap-3 min-h-0">
        {/* Left: Product Selection (List Layout) */}
        <div className="flex-7 flex flex-col min-w-0">
          <Card className="bg-card border-border flex-1 flex flex-col overflow-hidden rounded-xl">
            {/* Search Bar */}
            <div className="p-3 border-b border-border flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Scan or Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-11 bg-muted/50 border-border rounded-lg text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Select value={warehouseId} onValueChange={setWarehouseId}>
                  <SelectTrigger className="flex-1 sm:w-40 h-11 bg-muted/50 border-border rounded-lg text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">Global Stock</SelectItem>
                    {warehouses?.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => setIsScannerOpen(true)}
                  className="h-11 px-5 bg-foreground hover:bg-muted text-background rounded-lg font-bold flex gap-2 shrink-0"
                >
                  <ScanBarcode className="w-4 h-4" />
                  <span className="hidden sm:inline">Scan</span>
                </Button>
              </div>
            </div>

            {/* Product List */}
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">
                    Syncing...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {availableProducts.length === 0 ? (
                    <div className="p-20 text-center opacity-20">
                      <Package className="w-12 h-12 mx-auto mb-3" />
                      <p className="font-bold text-sm">No items found</p>
                    </div>
                  ) : (
                    availableProducts.map((p) => (
                      <div
                        key={p.id}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-4 hover:bg-muted/40 border-b border-border group transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          {/* Status Icon */}
                          <div
                            className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border",
                              p.productType === "SERIALIZED"
                                ? "bg-purple-500/5 border-purple-500/20 text-purple-400"
                                : "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                            )}
                          >
                            <Package className="w-5 h-5" />
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="font-bold text-sm text-foreground truncate">
                                {p.productName}
                              </h3>
                              <Badge
                                variant="outline"
                                className="text-[9px] h-4 px-1 rounded-sm border-border text-muted-foreground uppercase tracking-tighter"
                              >
                                {p.sku}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {p.name}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-4">
                          {/* Inventory Stats */}
                          <div className="w-20 sm:w-24 text-left sm:text-right">
                            <p className="text-xs font-bold text-foreground">
                              {p.totalStock}{" "}
                              <span className="text-[10px] text-muted-foreground font-medium">
                                units
                              </span>
                            </p>
                            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">
                              In Stock
                            </p>
                          </div>

                          {/* Price */}
                          <div className="w-20 sm:w-28 text-left sm:text-right">
                            <p className="text-sm font-black text-foreground">
                              ${p.sellPrice.toLocaleString()}
                            </p>
                            <p className="text-[9px] text-muted-foreground font-bold uppercase">
                              Rate
                            </p>
                          </div>

                          {/* Quick Add */}
                          <div className="flex-1 sm:w-48 sm:shrink-0 flex justify-end">
                            {p.productType === "SERIALIZED" ? (
                              <Select
                                onValueChange={(val) =>
                                  handleAddToCart(
                                    p,
                                    p.items.find(
                                      (i: any) => String(i.id) === val
                                    )
                                  )
                                }
                              >
                                <SelectTrigger className="bg-muted border-border h-9 w-full text-[11px] font-bold">
                                  <SelectValue placeholder="Pick Serial No." />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border min-w-[200px]">
                                  {p.items.map((item: any) => (
                                    <SelectItem
                                      key={item.id}
                                      value={String(item.id)}
                                      className="text-xs"
                                    >
                                      <div className="flex justify-between w-full font-mono uppercase">
                                        <span>{item.serialNumber}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Button
                                onClick={() => handleAddToCart(p)}
                                size="sm"
                                disabled={p.totalStock <= 0}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 gap-2 shadow-lg shadow-blue-600/10"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Item</span>
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
          </Card>
        </div>

        {/* Right: Cart (Compact) */}
        <div className="flex-3 flex flex-col min-w-[320px]">
          <Card className="bg-card border-border flex-1 flex flex-col overflow-hidden rounded-xl shadow-2xl">
            <div className="p-4 bg-muted/20 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-500" />
                <h2 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">
                  Cart
                </h2>
                <span className="bg-blue-600 text-[10px] text-white font-black px-1.5 py-0.5 rounded-full min-w-5 text-center">
                  {cart.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearCart}
                className="h-7 w-7 text-muted-foreground hover:text-red-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-10 opacity-10">
                  <ShoppingCart className="w-10 h-10 mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    Ready to scan
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {cart.map((item) => (
                    <div
                      key={`${item.variantId}-${item.serialNumber}`}
                      className="p-4 group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0 pr-3">
                          <p className="font-bold text-xs text-foreground truncate">
                            {item.productName}
                          </p>
                          {item.serialNumber && (
                            <div className="mt-1 inline-flex items-center bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded text-[9px] font-mono text-blue-400">
                              SN: {item.serialNumber}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded border border-border">
                              <span className="text-[10px] text-muted-foreground">
                                $
                              </span>
                              <input
                                type="number"
                                value={item.sellPrice}
                                onChange={(e) =>
                                  updatePrice(
                                    item.variantId,
                                    Number(e.target.value),
                                    item.serialNumber
                                  )
                                }
                                className="bg-transparent border-none outline-none text-right font-black text-xs text-foreground w-16 p-0"
                              />
                            </div>
                            <p className="font-medium text-[10px] text-muted-foreground">
                              Sub: $
                              {(
                                item.sellPrice * item.quantity
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          onClick={() =>
                            removeItem(item.variantId, item.serialNumber)
                          }
                          className="text-[10px] text-muted-foreground hover:text-red-500 font-bold"
                        >
                          Delete
                        </button>

                        <div className="flex items-center gap-1 bg-muted border border-border rounded-md p-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 rounded-sm disabled:opacity-30"
                            disabled={
                              item.quantity <= 1 ||
                              item.productType === "SERIALIZED"
                            }
                            onClick={() =>
                              updateQuantity(
                                item.variantId,
                                item.quantity - 1,
                                item.serialNumber
                              )
                            }
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 text-center text-xs font-black text-foreground">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 rounded-sm disabled:opacity-30"
                            disabled={item.productType === "SERIALIZED"}
                            onClick={() =>
                              updateQuantity(
                                item.variantId,
                                item.quantity + 1,
                                item.serialNumber
                              )
                            }
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Total & Checkout */}
            <div className="p-4 bg-muted/40 border-t border-border space-y-3">
              <div className="flex justify-between items-center text-foreground">
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    Total Pay
                  </p>
                  <p className="text-2xl font-black tracking-tighter">
                    ${total.toLocaleString()}
                  </p>
                </div>
                <ShoppingCart className="w-6 h-6 text-muted" />
              </div>

              <Button
                disabled={cart.length === 0 || createSaleMutation.isPending}
                onClick={handleCheckout}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-xl shadow-blue-600/10 transition-all active:scale-95"
              >
                {createSaleMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Confirm Sale</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <BarcodeScanner
        isOpen={isScannerOpen}
        onScan={handleBarcodeScan}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
}
