import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  Plus,
  Filter,
  LayoutGrid,
  List,
  Eye,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

export default function InventoryPage() {
  const navigate = useNavigate();
  const [warehouseId, setWarehouseId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"aggregated" | "detailed">(
    "aggregated"
  );

  const { data: warehouses } = warehouseQueries.useAll();
  const { data: inventory, isLoading } = inventoryQueries.useAll({
    warehouseId: warehouseId === "all" ? undefined : Number(warehouseId),
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  // Aggregated view logic
  const aggregatedInventory = useMemo(() => {
    if (!inventory) return [];

    const Map = new globalThis.Map<number, any>();

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

  // Detailed view logic
  const detailedInventory = useMemo(() => {
    if (!inventory) return [];
    return inventory.filter(
      (item) =>
        item.variant?.product.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        item.variant?.name.toLowerCase().includes(search.toLowerCase()) ||
        item.variant?.sku.toLowerCase().includes(search.toLowerCase()) ||
        item.serialNumber?.toLowerCase().includes(search.toLowerCase())
    );
  }, [inventory, search]);

  const totalStock =
    inventory?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;
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
          <Button
            variant="outline"
            onClick={() => navigate("/inventory/create")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Manual Entry
          </Button>
          <Button className="gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Transfer
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
      <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/30 p-2 rounded-lg border border-border">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products, SKUs, serials..."
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
            <SelectTrigger className="w-[180px]">
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
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="DEFECTIVE">Defective</SelectItem>
              <SelectItem value="RESERVED">Reserved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 border border-border rounded-md p-1 bg-background">
          <Button
            variant={viewMode === "aggregated" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 gap-2"
            onClick={() => setViewMode("aggregated")}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Summary
          </Button>
          <Button
            variant={viewMode === "detailed" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 gap-2"
            onClick={() => setViewMode("detailed")}
          >
            <List className="h-3.5 w-3.5" />
            Detailed
          </Button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/50">
              <TableHead className="font-semibold">Product & Variant</TableHead>
              {viewMode === "detailed" && (
                <TableHead className="font-semibold">Identifier</TableHead>
              )}
              <TableHead className="font-semibold">Warehouse</TableHead>
              <TableHead className="font-semibold text-right">
                Stock Level
              </TableHead>
              <TableHead className="font-semibold text-center">
                Status
              </TableHead>
              {viewMode === "detailed" && (
                <TableHead className="w-[50px]"></TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="animate-pulse border-border">
                  <TableCell colSpan={viewMode === "detailed" ? 6 : 5}>
                    <div className="h-12 w-full rounded bg-muted"></div>
                  </TableCell>
                </TableRow>
              ))
            ) : (viewMode === "aggregated"
                ? aggregatedInventory
                : detailedInventory
              ).length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={viewMode === "detailed" ? 6 : 5}
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
              (viewMode === "aggregated"
                ? aggregatedInventory
                : detailedInventory
              ).map((item) => {
                const isLowStock =
                  viewMode === "aggregated" && item.quantity <= item.minStock;
                const rowId =
                  viewMode === "aggregated"
                    ? `${item.variantId}-${item.warehouseName}`
                    : item.id;

                return (
                  <TableRow
                    key={rowId}
                    className={cn(
                      "border-border transition-colors",
                      viewMode === "detailed"
                        ? "cursor-pointer hover:bg-muted/50"
                        : "hover:bg-muted/30"
                    )}
                    onClick={() =>
                      viewMode === "detailed" &&
                      navigate(`/inventory/${item.id}`)
                    }
                  >
                    <TableCell>
                      <div className="font-medium">
                        {viewMode === "aggregated"
                          ? item.productName
                          : item.variant?.product.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {viewMode === "aggregated"
                          ? item.name
                          : item.variant?.name}
                      </div>
                    </TableCell>

                    {viewMode === "detailed" && (
                      <TableCell>
                        <div className="font-mono text-xs">
                          {item.serialNumber ||
                            item.batchNumber ||
                            item.variant?.sku}
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase">
                          {item.serialNumber
                            ? "Serial"
                            : item.batchNumber
                            ? "Batch"
                            : "SKU"}
                        </div>
                      </TableCell>
                    )}

                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1.5">
                        <WarehouseIcon className="h-3 w-3 text-muted-foreground" />
                        {viewMode === "aggregated"
                          ? item.warehouseName
                          : item.warehouse?.name}
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
                        {viewMode === "aggregated" && (
                          <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                            Min: {item.minStock}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex justify-center">
                        {isLowStock ? (
                          <Badge
                            variant="destructive"
                            className="gap-1 animate-pulse border-none"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className={cn(
                              "border-green-500/50 text-green-600 bg-green-500/5",
                              viewMode === "detailed" &&
                                item.status !== "AVAILABLE" &&
                                "border-blue-500/50 text-blue-600 bg-blue-500/5"
                            )}
                          >
                            {viewMode === "aggregated"
                              ? "Healthy"
                              : item.status}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {viewMode === "detailed" && (
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
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
