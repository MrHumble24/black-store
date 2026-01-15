import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { inventoryQueries, type InventoryItem } from "@/entities/inventory";
import { warehouseQueries } from "@/entities/warehouse";
import { brandQueries } from "@/entities/brand";
import { categoryQueries } from "@/entities/category";
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
  X,
  Plus,
  Filter,
  LayoutGrid,
  List,
  Eye,
  Download,
  Loader2,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";

export default function InventoryPage() {
  const navigate = useNavigate();
  const [warehouseId, setWarehouseId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"aggregated" | "detailed">(
    "aggregated"
  );

  const { data: warehouses } = warehouseQueries.useAll();
  const { data: brands } = brandQueries.useAll();
  const { data: categories } = categoryQueries.useAll();
  const { data: inventory, isLoading } = inventoryQueries.useAll({
    warehouseId: warehouseId === "all" ? undefined : Number(warehouseId),
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const getFilteredItems = (items: InventoryItem[]) => {
    return items.filter((item) => {
      const searchLower = search.toLowerCase();
      // Omni-search
      const bName = brands
        ?.find((b) => b.id === item.variant?.product?.brandId)
        ?.name?.toLowerCase();
      const cName = categories
        ?.find((c) => c.id === item.variant?.product?.categoryId)
        ?.name?.toLowerCase();
      const supplierName =
        item.purchase?.provider?.name?.toLowerCase() ||
        (item.purchase?.type === "WALKING_CUSTOMER" ? "walking customer" : "");

      const matchesSearch =
        item.variant?.product.name.toLowerCase().includes(searchLower) ||
        item.variant?.product.modelCode?.toLowerCase().includes(searchLower) ||
        item.variant?.name.toLowerCase().includes(searchLower) ||
        item.variant?.sku.toLowerCase().includes(searchLower) ||
        item.serialNumber?.toLowerCase().includes(searchLower) ||
        (bName && bName.includes(searchLower)) ||
        (cName && cName.includes(searchLower)) ||
        supplierName.includes(searchLower);

      // Filters
      const matchesBrand =
        selectedBrand === "all" ||
        item.variant?.product?.brandId === Number(selectedBrand);
      const matchesCategory =
        selectedCategory === "all" ||
        item.variant?.product?.categoryId === Number(selectedCategory);

      // Date range filter
      let matchesDateRange = true;
      if (startDate || endDate) {
        const itemDate = new Date(item.createdAt);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          matchesDateRange = matchesDateRange && itemDate >= start;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          matchesDateRange = matchesDateRange && itemDate <= end;
        }
      }

      return (
        matchesSearch && matchesBrand && matchesCategory && matchesDateRange
      );
    });
  };

  // Aggregated view logic
  const aggregatedInventory = useMemo(() => {
    if (!inventory) return [];

    const filtered = getFilteredItems(inventory);
    const Map = new globalThis.Map<number, any>();

    filtered.forEach((item) => {
      const variant = item.variant;
      if (!variant) return;

      const key = variant.id;
      const existing = Map.get(key);
      const itemValue = Number(item.costPrice || 0) * item.quantity;
      const supplierName =
        item.purchase?.provider?.name ||
        (item.purchase?.type === "WALKING_CUSTOMER"
          ? "Walking Customer"
          : "Unknown");

      if (existing) {
        existing.quantity += item.quantity;
        existing.totalValue += itemValue;
        if (!existing.warehouses.includes(item.warehouse?.name)) {
          existing.warehouses.push(item.warehouse?.name);
        }
        if (
          supplierName !== "Unknown" &&
          !existing.suppliers.includes(supplierName)
        ) {
          existing.suppliers.push(supplierName);
        }
      } else {
        Map.set(key, {
          variantId: variant.id,
          name: variant.name,
          sku: variant.sku,
          productName: variant.product.name,
          modelCode: variant.product.modelCode || "-",
          brandName:
            brands?.find((b) => b.id === variant.product.brandId)?.name || "-",
          categoryName:
            categories?.find((c) => c.id === variant.product.categoryId)
              ?.name || "-",
          minStock: variant.product.minStock,
          quantity: item.quantity,
          totalValue: itemValue,
          warehouses: [item.warehouse?.name || "Unknown"],
          suppliers: supplierName !== "Unknown" ? [supplierName] : [],
          status: item.status, // Simple status for aggregation
        });
      }
    });

    return Array.from(Map.values());
  }, [inventory, search, selectedBrand, selectedCategory, brands, categories]);

  // Detailed view logic
  const detailedInventory = useMemo(() => {
    if (!inventory) return [];
    return getFilteredItems(inventory);
  }, [inventory, search, selectedBrand, selectedCategory, brands, categories]);

  // Statistics
  const stats = useMemo(() => {
    if (!inventory) return { totalUnits: 0, totalValue: 0, lowStockCount: 0 };

    // Calculate stats based on CURRENT FILTERED VIEW to be dynamic
    // But usually stats are global or per warehouse. Let's make them reflect the filtered view for "drill down" analysis

    // However, low stock is best calculated from aggregation
    // Let's recalculate from base filtered inventory to be safe
    const filteredBase = getFilteredItems(inventory || []);

    const totalUnits = filteredBase.reduce(
      (acc, curr) => acc + curr.quantity,
      0
    );
    const totalValue = filteredBase.reduce(
      (acc, curr) => acc + Number(curr.costPrice || 0) * curr.quantity,
      0
    );

    // Low stock based on variants (aggregating first implies we check sum of qty vs minStock)
    const variantMap = new globalThis.Map<number, number>();
    const minStockMap = new globalThis.Map<number, number>();

    filteredBase.forEach((item) => {
      const vid = item.variantId;
      variantMap.set(vid, (variantMap.get(vid) || 0) + item.quantity);
      if (item.variant?.product.minStock)
        minStockMap.set(vid, item.variant.product.minStock);
    });

    let lowStockCount = 0;
    variantMap.forEach((qty, vid) => {
      const min = minStockMap.get(vid) || 0;
      if (qty <= min) lowStockCount++;
    });

    return { totalUnits, totalValue, lowStockCount };
  }, [inventory, aggregatedInventory, detailedInventory, viewMode]);

  const exportToExcel = () => {
    const dataToExport =
      viewMode === "aggregated" ? aggregatedInventory : detailedInventory;
    if (!dataToExport.length) return;

    let exportData;
    if (viewMode === "aggregated") {
      exportData = dataToExport.map((item: any) => ({
        Product: item.productName,
        "Model Code": item.modelCode,
        Variant: item.name,
        SKU: item.sku,
        Brand: item.brandName,
        Category: item.categoryName,
        Suppliers: item.suppliers?.join(", ") || "-",
        Warehouses: item.warehouses.join(", "),
        "Total Quantity": item.quantity,
        "Min Stock": item.minStock,
        "Total Value": item.totalValue,
        Status: item.quantity <= item.minStock ? "LOW STOCK" : "OK",
      }));
    } else {
      exportData = (dataToExport as InventoryItem[]).map((item) => ({
        Product: item.variant?.product.name,
        "Model Code": item.variant?.product.modelCode || "-",
        Variant: item.variant?.name,
        SKU: item.variant?.sku,
        "Serial/Batch": item.serialNumber || item.batchNumber || "-",
        Supplier:
          item.purchase?.provider?.name ||
          item.purchase?.sellerInfo ||
          "Unknown",
        Warehouse: item.warehouse?.name,
        Status: item.status,
        "Cost Price": item.costPrice,
        Quantity: item.quantity,
        Value: Number(item.costPrice || 0) * item.quantity,
        Received: item.receivedAt,
      }));
    }

    const workSheet = XLSX.utils.json_to_sheet(exportData);
    const workBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workBook, workSheet, "Inventory");
    XLSX.writeFile(
      workBook,
      `Inventory_${viewMode}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const resetFilters = () => {
    setSearch("");
    setWarehouseId("all");
    setStatusFilter("all");
    setSelectedBrand("all");
    setSelectedCategory("all");
    setStartDate("");
    setEndDate("");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
          Loading Inventory...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight italic">
            INVENTORY
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Monitor and manage stock levels across all locations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={exportToExcel}
            disabled={!inventory?.length}
            className="flex-1 sm:flex-none h-10 border-border bg-card text-muted-foreground hover:text-foreground"
          >
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">
              Export {viewMode === "aggregated" ? "Summary" : "Detailed"}
            </span>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/inventory/create")}
            className="flex-1 sm:flex-none h-10 border-border bg-card text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Entry
          </Button>
          <Button
            className="flex-1 sm:flex-none h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/10"
            onClick={() => navigate("/inventory/transfer")}
          >
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Transfer
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-card border-border overflow-hidden relative group">
          <CardHeader className="pb-4">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-blue-500/80 mb-1">
              Total Asset Value
            </CardDescription>
            <CardTitle className="text-2xl font-black text-blue-500">
              ${stats.totalValue.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-card border-border overflow-hidden relative group">
          <CardHeader className="pb-4">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-foreground/60 mb-1">
              Total Units
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">
              {stats.totalUnits.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-card border-border overflow-hidden relative group">
          <CardHeader className="pb-4">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-red-500/80 mb-1">
              Low Stock Alerts
            </CardDescription>
            <CardTitle className="text-2xl font-black text-red-500">
              {stats.lowStockCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Improved Filters Bar */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="p-4 border-b border-border space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md group w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
              <Input
                placeholder="Search product, model code, SKU, serial, supplier, brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 bg-muted/50 border-border rounded-lg text-sm"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-card mr-2">
                <Button
                  variant={viewMode === "aggregated" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 gap-2 px-3 text-[10px] font-black uppercase tracking-tighter"
                  onClick={() => setViewMode("aggregated")}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Summary
                </Button>
                <Button
                  variant={viewMode === "detailed" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 gap-2 px-3 text-[10px] font-black uppercase tracking-tighter"
                  onClick={() => setViewMode("detailed")}
                >
                  <List className="h-3.5 w-3.5" />
                  Detailed
                </Button>
              </div>

              <Button
                variant={isFilterOpen ? "secondary" : "outline"}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="h-10 border-border whitespace-nowrap"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {isFilterOpen ? <X className="ml-2 w-3 h-3" /> : null}
              </Button>
              {(search ||
                warehouseId !== "all" ||
                statusFilter !== "all" ||
                selectedBrand !== "all" ||
                selectedCategory !== "all" ||
                startDate ||
                endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-xs text-red-500 hover:text-red-600 whitespace-nowrap"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {isFilterOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Warehouse
                </label>
                <Select value={warehouseId} onValueChange={setWarehouseId}>
                  <SelectTrigger className="h-9 text-xs bg-muted/30">
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
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 text-xs bg-muted/30">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="DEFECTIVE">Defective</SelectItem>
                    <SelectItem value="RESERVED">Reserved</SelectItem>
                    <SelectItem value="SOLD">Sold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Brand
                </label>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger className="h-9 text-xs bg-muted/30">
                    <SelectValue placeholder="All Brands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {brands?.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Category
                </label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="h-9 text-xs bg-muted/30">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-xs bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-xs bg-muted/30"
                />
              </div>
            </div>
          )}
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-[30%]">
                  Product Overview
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Supplier
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right w-[10%]">
                  Qty
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right w-[15%]">
                  Value
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center w-[15%]">
                  Status
                </TableHead>
                {viewMode === "detailed" && (
                  <TableHead className="w-[50px]"></TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(viewMode === "aggregated"
                ? aggregatedInventory
                : detailedInventory
              ).length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={viewMode === "detailed" ? 7 : 5}
                    className="py-16 text-center text-muted-foreground"
                  >
                    <Box className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="font-medium text-lg text-foreground">
                      No inventory records found
                    </p>
                    <p className="mt-1 text-sm">
                      Try adjusting your filters or search term
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                (viewMode === "aggregated"
                  ? aggregatedInventory
                  : detailedInventory
                ).map((item: any) => {
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
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">
                              {viewMode === "aggregated"
                                ? item.productName
                                : item.variant?.product.name}
                            </span>
                            {item.modelCode && item.modelCode !== "-" && (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1 py-0 h-4 bg-muted text-muted-foreground border-border"
                              >
                                {item.modelCode}
                              </Badge>
                            )}
                            {viewMode === "detailed" &&
                              item.variant?.product.modelCode && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1 py-0 h-4 bg-muted text-muted-foreground border-border"
                                >
                                  {item.variant.product.modelCode}
                                </Badge>
                              )}
                          </div>
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-xs text-muted-foreground">
                              {viewMode === "aggregated"
                                ? item.name
                                : item.variant?.name}
                            </span>
                            <span className="text-[10px] bg-muted/50 px-1 rounded text-muted-foreground font-mono">
                              {viewMode === "aggregated"
                                ? item.sku
                                : item.variant?.sku}
                            </span>
                            {viewMode === "detailed" && (
                              <span className="text-[10px] bg-blue-500/10 px-1 rounded text-blue-600 font-mono font-bold">
                                {item.serialNumber || item.batchNumber || "N/A"}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {viewMode === "aggregated" ? (
                            <div className="flex flex-wrap gap-1">
                              {item.suppliers && item.suppliers.length > 0
                                ? item.suppliers
                                    .slice(0, 2)
                                    .map((s: string, idx: number) => (
                                      <span
                                        key={idx}
                                        className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-medium border border-border"
                                      >
                                        {s}
                                      </span>
                                    ))
                                : "-"}
                              {item.suppliers && item.suppliers.length > 2 && (
                                <span className="text-[10px] text-muted-foreground">
                                  +{item.suppliers.length - 2} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="font-medium text-foreground/80">
                              {item.purchase?.provider?.name ||
                                item.purchase?.sellerInfo ||
                                "Unknown"}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span
                            className={cn(
                              "font-black text-sm",
                              isLowStock ? "text-red-500" : "text-foreground"
                            )}
                          >
                            {item.quantity}
                          </span>
                          {viewMode === "aggregated" && item.minStock > 0 && (
                            <span className="text-[9px] text-muted-foreground uppercase font-bold">
                              Min: {item.minStock}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <span className="font-mono text-sm font-medium">
                          $
                          {viewMode === "aggregated"
                            ? item.totalValue.toLocaleString()
                            : (
                                Number(item.costPrice || 0) * item.quantity
                              ).toLocaleString()}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-center">
                          {isLowStock ? (
                            <Badge
                              variant="destructive"
                              className="h-6 gap-1 animate-pulse px-2"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className={cn(
                                "h-6 border px-2",
                                viewMode === "detailed" &&
                                  item.status !== "AVAILABLE"
                                  ? "border-amber-500/50 text-amber-600 bg-amber-500/10"
                                  : "border-emerald-500/50 text-emerald-600 bg-emerald-500/10"
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                          >
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
      </Card>
    </div>
  );
}
