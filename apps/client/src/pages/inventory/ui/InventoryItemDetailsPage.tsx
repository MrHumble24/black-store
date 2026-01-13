import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { inventoryQueries } from "@/entities/inventory";
import { warehouseQueries } from "@/entities/warehouse";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  ArrowLeft,
  Loader2,
  Save,
  Trash2,
  Calendar,
  Hash,
  Package,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

export default function InventoryItemDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const itemId = Number(id);

  const { data: item, isLoading } = inventoryQueries.useOne(itemId);
  const { data: warehouses } = warehouseQueries.useAll();
  const updateMutation = inventoryQueries.useUpdate();

  const [status, setStatus] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [warehouseId, setWarehouseId] = useState<string>("");

  useEffect(() => {
    if (item) {
      setStatus(item.status);
      setQuantity(String(item.quantity));
      setWarehouseId(String(item.warehouseId));
    }
  }, [item]);

  const handleUpdate = () => {
    updateMutation.mutate({
      id: itemId,
      data: {
        status: status as any,
        quantity: Number(quantity),
        warehouseId: Number(warehouseId),
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!item) return <div>Item not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Inventory Details
            </h1>
            <p className="text-muted-foreground text-sm">#{item.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={updateMutation.isPending}
            className="gap-2"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-x-12 gap-y-4">
              <div>
                <Label className="text-muted-foreground text-xs uppercase">
                  Product
                </Label>
                <p className="font-semibold text-lg">
                  {item.variant?.product.name}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs uppercase">
                  Variant
                </Label>
                <p className="font-medium">{item.variant?.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs uppercase">
                  SKU
                </Label>
                <p className="font-mono text-sm">{item.variant?.sku}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs uppercase">
                  Product Type
                </Label>
                <p className="text-sm font-medium">
                  {item.variant?.product.type}
                </p>
              </div>
            </div>

            <hr className="border-border" />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="RESERVED">Reserved</SelectItem>
                    <SelectItem value="SOLD">Sold</SelectItem>
                    <SelectItem value="DEFECTIVE">Defective</SelectItem>
                    <SelectItem value="LOST">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="warehouse">Warehouse</Label>
                <Select value={warehouseId} onValueChange={setWarehouseId}>
                  <SelectTrigger id="warehouse">
                    <SelectValue />
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

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Cost Price</Label>
                <p className="text-xl font-bold text-green-600">
                  ${Number(item.costPrice).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tracking Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
              Tracking Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Serial Number</p>
                  <p className="text-sm font-medium font-mono">
                    {item.serialNumber || "None"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Batch Number</p>
                  <p className="text-sm font-medium font-mono">
                    {item.batchNumber || "None"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Expiry Date</p>
                  <p className="text-sm font-medium">
                    {item.expiryDate
                      ? new Date(item.expiryDate).toLocaleDateString()
                      : "No Expiry"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Received At</p>
                  <p className="text-sm font-medium">
                    {new Date(item.receivedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Badge
                variant={item.status === "AVAILABLE" ? "outline" : "secondary"}
                className={cn(
                  "w-full justify-center py-1 text-sm font-bold uppercase",
                  item.status === "AVAILABLE"
                    ? "border-green-500/50 text-green-600 bg-green-500/5"
                    : ""
                )}
              >
                {item.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
