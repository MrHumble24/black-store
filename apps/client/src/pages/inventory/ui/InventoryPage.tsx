import { useState, useMemo } from "react";
import { inventoryQueries } from "@/entities/inventory";
import { warehouseQueries } from "@/entities/warehouse";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
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
import {
  Search,
  Box,
  AlertTriangle,
  ArrowRightLeft,
  Warehouse as WarehouseIcon,
  X,
  History,
  Filter,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

export default function InventoryPage() {
  const [warehouseId, setWarehouseId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: warehouses } = warehouseQueries.useAll();
  const { data: inventory, isLoading } = inventoryQueries.useAll({
    warehouseId: warehouseId === "all" ? undefined : Number(warehouseId),
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  // Aggregated view by variant
  const aggregatedInventory = useMemo(() => {
    if (!inventory) return [];

    const Map = new globalThis.Map<
      number,
      {
        variantId: number;
        name: string;
        sku: string;
        productName: string;
        type: string;
        minStock: number;
        quantity: number;
        warehouseName: string;
      }
    >();

    inventory.forEach((item) => {
      const variant = item.variant;
      if (!variant) return;

      const key = variant.id;
      const existing = Map.get(key);

      if (existing) {
        existing.quantity += item.quantity;
      } else {
        Map.set(key, {
          variantId: variant.id,
          name: variant.name,
          sku: variant.sku,
          productName: variant.product.name,
          type: variant.product.type,
          minStock: variant.product.minStock,
          quantity: item.quantity,
          warehouseName: item.warehouse?.name || "Unknown",
        });
      }
    });

    return Array.from(Map.values()).filter(
      (item) =>
        item.productName.toLowerCase().includes(search.toLowerCase()) ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase())
    );
  }, [inventory, search]);

  const totalStock = aggregatedInventory.reduce(
    (acc, curr) => acc + curr.quantity,
    0
  );
  const lowStockItems = aggregatedInventory.filter(
    (item) => item.quantity <= item.minStock
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Monitor and manage stock levels across all locations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <History className="h-4 w-4" />
            History
          </Button>
          <Button className="gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Transfer Stock
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Box className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Units</p>
              <p className="text-2xl font-bold">{totalStock}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-500/10 p-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Stock Alert</p>
              <p className="text-2xl font-bold">{lowStockItems}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <WarehouseIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Locations</p>
              <p className="text-2xl font-bold">{warehouses?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products or SKUs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Select value={warehouseId} onValueChange={setWarehouseId}>
          <SelectTrigger className="w-[200px]">
            <WarehouseIcon className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Warehouses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Warehouses</SelectItem>
            {warehouses?.map((w) => (
              <SelectItem key={w.id} value={String(w.id)}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="DEFECTIVE">Defective</SelectItem>
            <SelectItem value="RESERVED">Reserved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Inventory Table */}
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/50">
              <TableHead className="font-semibold">Product & Variant</TableHead>
              <TableHead className="font-semibold">SKU</TableHead>
              <TableHead className="font-semibold">Warehouse</TableHead>
              <TableHead className="font-semibold text-right">
                Stock Level
              </TableHead>
              <TableHead className="font-semibold text-center">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="animate-pulse border-border">
                  <TableCell colSpan={5}>
                    <div className="h-12 w-full rounded bg-muted"></div>
                  </TableCell>
                </TableRow>
              ))
            ) : aggregatedInventory.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-16 text-center text-muted-foreground"
                >
                  <Box className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="font-medium text-lg text-foreground">
                    No inventory records found
                  </p>
                  <p className="mt-1">
                    Try adjusting your filters or search term
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              aggregatedInventory.map((item) => {
                const isLowStock = item.quantity <= item.minStock;
                return (
                  <TableRow
                    key={`${item.variantId}-${item.warehouseName}`}
                    className="border-border hover:bg-muted/30 transition-colors"
                  >
                    <TableCell>
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.sku}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1.5">
                        <WarehouseIcon className="h-3 w-3 text-muted-foreground" />
                        {item.warehouseName}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span
                          className={cn(
                            "font-bold text-lg",
                            isLowStock ? "text-red-500" : "text-foreground"
                          )}
                        >
                          {item.quantity}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                          Min: {item.minStock}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        {isLowStock ? (
                          <Badge
                            variant="destructive"
                            className="gap-1 animate-pulse"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-green-500/50 text-green-600 bg-green-500/5"
                          >
                            Healthy
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
