import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { inventoryQueries } from "@/entities/inventory";
import { warehouseQueries } from "@/entities/warehouse";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Card, CardContent } from "@/shared/ui/card";
import {
  ArrowLeft,
  Loader2,
  ChevronsUpDown,
  MoveHorizontal,
  ScanBarcode,
  History,
  ArrowRight,
  Warehouse,
  Package,
  Info,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/command";
import { cn } from "@/shared/lib/utils";
import { BarcodeScanner } from "@/shared/ui/barcode-scanner";
import { toast } from "sonner";

export default function TransferInventoryPage() {
  const navigate = useNavigate();
  const transferMutation = inventoryQueries.useTransfer();

  const { data: warehouses } = warehouseQueries.useAll();

  const [fromWarehouseId, setFromWarehouseId] = useState<string>("");
  const [toWarehouseId, setToWarehouseId] = useState<string>("");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [selectedInventoryItemId, setSelectedInventoryItemId] =
    useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [notes, setNotes] = useState("");

  const [isVariantOpen, setIsVariantOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Fetch available stock for the source warehouse
  const { data: sourceInventory, isLoading: isLoadingStock } =
    inventoryQueries.useAll({
      warehouseId: fromWarehouseId ? Number(fromWarehouseId) : undefined,
      status: "AVAILABLE",
    });

  // Unique variants in source warehouse
  const availableVariants = useMemo(() => {
    if (!sourceInventory) return [];

    const variantMap = new Map();
    sourceInventory.forEach((item: any) => {
      const v = item.variant;
      if (!variantMap.has(v.id)) {
        variantMap.set(v.id, {
          id: v.id,
          sku: v.sku,
          name: v.name,
          productName: v.product.name,
          productType: v.product.type,
          label: `${v.product.name} - ${v.name} (${v.sku})`,
          totalInWarehouse: 0,
          items: [],
        });
      }
      const existing = variantMap.get(v.id);
      existing.totalInWarehouse += item.quantity;
      existing.items.push(item);
    });

    return Array.from(variantMap.values());
  }, [sourceInventory]);

  const selectedVariant = availableVariants.find(
    (v) => String(v.id) === selectedVariantId
  );

  const handleTransfer = () => {
    if (!fromWarehouseId || !toWarehouseId || !selectedVariantId || !quantity)
      return;
    if (fromWarehouseId === toWarehouseId) {
      toast.error("Source and destination warehouses must be different");
      return;
    }

    transferMutation.mutate(
      {
        fromWarehouseId: Number(fromWarehouseId),
        toWarehouseId: Number(toWarehouseId),
        variantId: Number(selectedVariantId),
        quantity: Number(quantity),
        inventoryItemId: selectedInventoryItemId
          ? Number(selectedInventoryItemId)
          : undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: () => navigate("/inventory"),
      }
    );
  };

  const handleBarcodeScan = (code: string) => {
    // Try to match SKU first
    const variant = availableVariants.find(
      (v) => v.sku.toLowerCase() === code.toLowerCase()
    );

    if (variant) {
      setSelectedVariantId(String(variant.id));
      toast.success(`Matched Product: ${variant.label}`);
      return;
    }

    // Try to match Serial Number if it's already in the source warehouse
    const itemWithSN = sourceInventory?.find(
      (item: any) => item.serialNumber?.toLowerCase() === code.toLowerCase()
    );

    if (itemWithSN) {
      setSelectedVariantId(String(itemWithSN.variantId));
      setSelectedInventoryItemId(String(itemWithSN.id));
      setQuantity("1");
      toast.success(`Matched Serial Number: ${code}`);
    } else {
      toast.error(
        "No matching Product or Serial Number found in source warehouse"
      );
    }
  };

  const fromWarehouseName =
    warehouses?.find((w) => String(w.id) === fromWarehouseId)?.name || "Source";
  const toWarehouseName =
    warehouses?.find((w) => String(w.id) === toWarehouseId)?.name ||
    "Destination";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      {/* Premium Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full h-10 w-10 border-border bg-card hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Transfer Inventory
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Relocate stock between warehouses with real-time tracking
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/inventory/movements")}
          className="rounded-lg h-9 border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <History className="w-4 h-4 mr-2 text-muted-foreground" />
          Movement Logs
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-12 space-y-6">
          <Card className="border border-border shadow-2xl shadow-black/50 bg-card overflow-hidden">
            <div className="h-1 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600" />
            <CardContent className="p-8">
              {/* Visual Flow Representation */}
              <div className="relative flex items-center justify-between mb-12 px-4">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-px bg-border hidden md:block" />

                {/* Source Node */}
                <div className="relative z-10 flex flex-col items-center gap-4 group">
                  <div
                    className={cn(
                      "w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-[0_0_20px_rgba(0,0,0,0.3)]",
                      fromWarehouseId
                        ? "bg-blue-600 text-white scale-110 shadow-[0_0_30px_rgba(37,99,235,0.3)]"
                        : "bg-muted text-muted-foreground border border-border"
                    )}
                  >
                    <Warehouse className="w-10 h-10" />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">
                      Origin
                    </p>
                    <p
                      className={cn(
                        "font-bold text-sm truncate max-w-[140px] transition-colors",
                        fromWarehouseId
                          ? "text-foreground"
                          : "text-muted-foreground/40"
                      )}
                    >
                      {fromWarehouseId ? fromWarehouseName : "Select Source"}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center shadow-lg">
                    <ArrowRight className="w-6 h-6 text-muted-foreground" />
                  </div>
                </div>

                {/* Destination Node */}
                <div className="relative z-10 flex flex-col items-center gap-4 group">
                  <div
                    className={cn(
                      "w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-[0_0_20px_rgba(0,0,0,0.3)]",
                      toWarehouseId
                        ? "bg-indigo-600 text-white scale-110 shadow-[0_0_30px_rgba(79,70,229,0.3)]"
                        : "bg-muted text-muted-foreground border border-border"
                    )}
                  >
                    <Warehouse className="w-10 h-10" />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">
                      Target
                    </p>
                    <p
                      className={cn(
                        "font-bold text-sm truncate max-w-[140px] transition-colors",
                        toWarehouseId
                          ? "text-foreground"
                          : "text-muted-foreground/40"
                      )}
                    >
                      {toWarehouseId ? toWarehouseName : "Select Target"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Source Selection Area */}
                <div className="space-y-4">
                  <div className="p-6 rounded-2xl bg-muted/50 border border-border group focus-within:border-blue-500/50 transition-all">
                    <Label className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 block">
                      Transfer From
                    </Label>
                    <Select
                      value={fromWarehouseId}
                      onValueChange={(val) => {
                        setFromWarehouseId(val);
                        setSelectedVariantId("");
                      }}
                    >
                      <SelectTrigger className="bg-muted border-border h-14 text-foreground rounded-xl focus:ring-blue-500/20">
                        <SelectValue placeholder="Identify source warehouse" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border text-foreground">
                        {warehouses?.map((w) => (
                          <SelectItem
                            key={w.id}
                            value={String(w.id)}
                            className="focus:bg-muted focus:text-foreground"
                          >
                            {w.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Destination Selection Area */}
                <div className="space-y-4">
                  <div className="p-6 rounded-2xl bg-muted/50 border border-border group focus-within:border-indigo-500/50 transition-all">
                    <Label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 block">
                      Transfer To
                    </Label>
                    <Select
                      value={toWarehouseId}
                      onValueChange={setToWarehouseId}
                    >
                      <SelectTrigger className="bg-muted border-border h-14 text-foreground rounded-xl focus:ring-indigo-500/20">
                        <SelectValue placeholder="Identify target location" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border text-foreground">
                        {warehouses?.map((w) => (
                          <SelectItem
                            key={w.id}
                            value={String(w.id)}
                            className="focus:bg-muted focus:text-foreground"
                          >
                            {w.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Product Selection Section */}
              <div className="mt-12 space-y-8 pt-12 border-t border-border">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
                      <Package className="w-6 h-6 text-muted-foreground" />
                      Manifest Details
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">
                      Select available inventory from {fromWarehouseName}
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsScannerOpen(true)}
                    disabled={!fromWarehouseId}
                    className="bg-foreground hover:bg-muted text-background rounded-xl h-12 px-8 font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all active:scale-95 disabled:opacity-20"
                  >
                    <ScanBarcode className="w-5 h-5 mr-3" />
                    Interactive Scan
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Variant Selection Popover */}
                  <div className="lg:col-span-7 space-y-3">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">
                      Product Variant
                    </Label>
                    <Popover
                      open={isVariantOpen}
                      onOpenChange={setIsVariantOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          disabled={!fromWarehouseId}
                          className="w-full justify-between h-16 px-5 border-border rounded-2xl bg-muted/30 hover:bg-muted/60 hover:border-border text-left group"
                        >
                          {selectedVariant ? (
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/20 group-hover:scale-105 transition-transform">
                                <Package className="w-5 h-5 text-blue-400" />
                              </div>
                              <div>
                                <p className="font-bold text-sm text-foreground line-clamp-1">
                                  {selectedVariant.label}
                                </p>
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                                  {selectedVariant.totalInWarehouse} Units
                                  Available
                                </p>
                              </div>
                            </div>
                          ) : isLoadingStock ? (
                            <div className="flex items-center gap-4">
                              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                              <span className="text-muted-foreground text-sm font-medium italic">
                                Interrogating source inventory...
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/40 font-bold">
                              Select a variant to relocate...
                            </span>
                          )}
                          <ChevronsUpDown className="w-5 h-5 text-muted-foreground/20" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[500px] p-0 rounded-2xl overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] border-border bg-card">
                        <Command className="bg-transparent">
                          <div className="p-4 border-b border-border">
                            <CommandInput
                              placeholder="Type SKU or Product Name..."
                              className="h-12 border-none bg-muted rounded-xl text-foreground placeholder:text-muted-foreground/40"
                            />
                          </div>
                          <CommandList className="max-h-[350px] p-2">
                            {isLoadingStock ? (
                              <div className="p-12 flex flex-col items-center gap-4">
                                <div className="relative">
                                  <div className="w-12 h-12 rounded-full border-2 border-border animate-ping absolute inset-0" />
                                  <Loader2 className="w-12 h-12 animate-spin text-blue-500 relative z-10" />
                                </div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                  Reading Stock Data
                                </p>
                              </div>
                            ) : (
                              <>
                                <CommandEmpty className="p-12 text-center">
                                  <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-4 border border-border">
                                    <Package className="w-8 h-8 text-muted-foreground/40" />
                                  </div>
                                  <p className="font-black text-foreground text-lg">
                                    Warehouse Empty
                                  </p>
                                  <p className="text-xs text-muted-foreground font-medium max-w-[200px] mx-auto mt-2">
                                    This location has no available inventory to
                                    transfer.
                                  </p>
                                </CommandEmpty>
                                <CommandGroup>
                                  {availableVariants.map((variant) => (
                                    <CommandItem
                                      key={variant.id}
                                      value={variant.label}
                                      onSelect={() => {
                                        setSelectedVariantId(
                                          String(variant.id)
                                        );
                                        setSelectedInventoryItemId("");
                                        setIsVariantOpen(false);
                                      }}
                                      className="rounded-xl mb-1 aria-selected:bg-blue-600/10 aria-selected:text-foreground p-4 cursor-pointer group"
                                    >
                                      <div className="flex items-center gap-4 w-full">
                                        <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center group-hover:bg-blue-600/20 group-hover:border-blue-500/20 transition-all">
                                          <Package className="w-5 h-5 text-muted-foreground/40 group-hover:text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-bold text-sm truncate text-muted-foreground group-hover:text-foreground">
                                            {variant.label}
                                          </p>
                                          <p className="text-[10px] font-bold text-muted-foreground/40 uppercase">
                                            SKU: {variant.sku}
                                          </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <p className="font-black text-sm text-blue-500 group-hover:scale-110 transition-transform">
                                            {variant.totalInWarehouse}
                                          </p>
                                          <p className="text-[8px] font-black uppercase text-muted-foreground/20 tracking-tighter">
                                            Stock
                                          </p>
                                        </div>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Quantity Input */}
                  <div className="lg:col-span-3 space-y-3">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">
                      Amount
                    </Label>
                    <div className="relative group">
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="1"
                        max={selectedVariant?.totalInWarehouse || 1}
                        disabled={selectedVariant?.productType === "SERIALIZED"}
                        className="h-16 font-black text-center text-xl rounded-2xl border-border bg-muted/30 text-foreground focus:ring-blue-500/20 focus:border-blue-500/30"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">
                          Units
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Product Type Indicator */}
                  <div className="lg:col-span-2 space-y-3">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">
                      Type
                    </Label>
                    <div className="h-16 flex items-center justify-center rounded-2xl bg-muted/30 border border-border border-dashed">
                      <div className="flex flex-col items-center">
                        {selectedVariant?.productType === "SERIALIZED" ? (
                          <>
                            <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">
                              Serial
                            </span>
                            <div className="w-2.5 h-2.5 rounded-full mt-1 bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)] animate-pulse" />
                          </>
                        ) : (
                          <>
                            <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">
                              Bulk
                            </span>
                            <div className="w-2.5 h-2.5 rounded-full mt-1 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Serial Selector for Assets */}
                {selectedVariant?.productType === "SERIALIZED" && (
                  <div className="bg-muted/20 p-8 rounded-2xl border-2 border-purple-500/30 space-y-6 animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Info className="w-16 h-16 text-purple-500" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center">
                        <Info className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground uppercase tracking-tight">
                          Item Serialization Required
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">
                          Select the specific unit identifier for this
                          relocation.
                        </p>
                      </div>
                    </div>
                    <Select
                      value={selectedInventoryItemId}
                      onValueChange={setSelectedInventoryItemId}
                    >
                      <SelectTrigger className="bg-muted border-border h-14 rounded-xl text-foreground focus:ring-purple-500/20 focus:border-purple-500/40">
                        <SelectValue placeholder="Identify Specific Serial Number" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl bg-card border-border text-foreground">
                        {selectedVariant.items.map((item: any) => (
                          <SelectItem
                            key={item.id}
                            value={String(item.id)}
                            className="focus:bg-muted focus:text-foreground"
                          >
                            <div className="flex items-center gap-4 p-1">
                              <span className="font-mono font-black text-purple-400 text-lg">
                                {item.serialNumber}
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <span className="text-muted-foreground/40 text-[10px] font-black uppercase tracking-widest">
                                  {item.status}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Remarks Field */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter px-1">
                    Internal Manifest Remarks
                  </Label>
                  <Input
                    placeholder="Log the purpose of this relocation..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-14 border-border bg-muted/30 rounded-2xl text-foreground placeholder:text-muted-foreground/20 focus:ring-foreground/5"
                  />
                </div>
              </div>

              {/* Execution Section */}
              <div className="mt-12 flex flex-col md:flex-row gap-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  className="h-16 flex-1 rounded-2xl font-black text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  Discard
                </Button>
                <Button
                  onClick={handleTransfer}
                  disabled={
                    transferMutation.isPending ||
                    !fromWarehouseId ||
                    !toWarehouseId ||
                    !selectedVariantId ||
                    (selectedVariant?.productType === "SERIALIZED" &&
                      !selectedInventoryItemId)
                  }
                  className="h-16 flex-2 rounded-2xl bg-foreground hover:bg-muted text-background font-black text-lg shadow-[0_20px_40px_rgba(255,255,255,0.05)] transition-all active:scale-[0.98] disabled:opacity-10 group"
                >
                  {transferMutation.isPending ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <MoveHorizontal className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                      Commit Transfer
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
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
