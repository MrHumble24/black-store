import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { inventoryQueries } from "@/entities/inventory";
import { warehouseQueries } from "@/entities/warehouse";
import { productQueries } from "@/entities/product";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/card";
import { ArrowLeft, Loader2, Check, ChevronsUpDown } from "lucide-react";
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

export default function CreateInventoryPage() {
  const navigate = useNavigate();
  const createMutation = inventoryQueries.useCreate();

  const { data: warehouses } = warehouseQueries.useAll();
  const { data: products } = productQueries.useAll();

  const [open, setOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [costPrice, setCostPrice] = useState<string>("");
  const [status, setStatus] = useState<string>("AVAILABLE");
  const [serialNumber, setSerialNumber] = useState("");
  const [batchNumber, setBatchNumber] = useState("");

  const allVariants =
    products?.flatMap((p) =>
      p.variants.map((v) => ({
        ...v,
        productName: p.name,
        label: `${p.name} - ${v.name} (${v.sku})`,
      }))
    ) || [];

  const handleCreate = () => {
    if (!selectedVariantId || !warehouseId || !quantity || !costPrice) return;

    createMutation.mutate(
      {
        variantId: Number(selectedVariantId),
        warehouseId: Number(warehouseId),
        quantity: Number(quantity),
        costPrice: Number(costPrice),
        status,
        serialNumber: serialNumber || undefined,
        batchNumber: batchNumber || undefined,
      },
      {
        onSuccess: () => navigate("/inventory"),
      }
    );
  };

  const selectedVariant = allVariants.find(
    (v) => String(v.id) === selectedVariantId
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Add Inventory</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Details</CardTitle>
          <CardDescription>
            Manually add stock to a specific warehouse location.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product Variant Selection */}
          <div className="space-y-2 flex flex-col">
            <Label>Product Variant</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="justify-between w-full"
                >
                  {selectedVariantId
                    ? selectedVariant?.label
                    : "Select product variant..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 PopoverContent">
                <Command className="w-full">
                  <CommandInput placeholder="Search variants..." />
                  <CommandList>
                    <CommandEmpty>No variant found.</CommandEmpty>
                    <CommandGroup>
                      {allVariants.map((variant) => (
                        <CommandItem
                          key={variant.id}
                          value={variant.label}
                          onSelect={() => {
                            setSelectedVariantId(String(variant.id));
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedVariantId === String(variant.id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {variant.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Warehouse */}
            <div className="space-y-2">
              <Label htmlFor="warehouse">Warehouse</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger id="warehouse">
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses?.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Initial Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="RESERVED">Reserved</SelectItem>
                  <SelectItem value="DEFECTIVE">Defective</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            {/* Cost Price */}
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price (per unit)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="costPrice"
                  type="number"
                  placeholder="0.00"
                  className="pl-7"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Serial Number */}
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number (Optional)</Label>
              <Input
                id="serialNumber"
                placeholder="Unique key for SERIALIZED items"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
              />
            </div>

            {/* Batch Number */}
            <div className="space-y-2">
              <Label htmlFor="batchNumber">Batch Number (Optional)</Label>
              <Input
                id="batchNumber"
                placeholder="Tracking for BATCH items"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/inventory")}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreate}
              disabled={
                createMutation.isPending ||
                !selectedVariantId ||
                !warehouseId ||
                !costPrice
              }
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Entry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
