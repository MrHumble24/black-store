import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { salesQueries, type Sale } from "@/entities/sale";
import { brandQueries } from "@/entities/brand";
import { categoryQueries } from "@/entities/category";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Search, Plus, Filter, Download, Loader2, X } from "lucide-react";
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
import { format, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/shared/lib/utils";

export default function SalesPage() {
  const navigate = useNavigate();
  const { data: sales, isLoading } = salesQueries.useAll();
  const { data: brands } = brandQueries.useAll();
  const { data: categories } = categoryQueries.useAll();

  const [search, setSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Advanced Filter State
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: "",
    to: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const calculateSaleCosts = (sale: Sale) => {
    return (
      sale.items?.reduce((total, item) => {
        const cost = item.variant?.inventory?.[0]?.costPrice || 0;
        return total + Number(cost) * item.quantity;
      }, 0) || 0
    );
  };

  const filteredSales = useMemo(() => {
    if (!sales) return [];
    return sales.filter((s) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        s.invoiceNo.toLowerCase().includes(searchLower) ||
        s.customerName?.toLowerCase().includes(searchLower) ||
        s.paymentMethod.toLowerCase().includes(searchLower) ||
        s.totalAmount.toString().includes(searchLower) ||
        s.items.some((item) => {
          const bName = brands
            ?.find((b) => b.id === item.variant?.product?.brandId)
            ?.name?.toLowerCase();
          const cName = categories
            ?.find((c) => c.id === item.variant?.product?.categoryId)
            ?.name?.toLowerCase();
          return (
            (bName && bName.includes(searchLower)) ||
            (cName && cName.includes(searchLower))
          );
        });

      const saleDate = new Date(s.createdAt);
      const matchesDate =
        (!dateRange.from || saleDate >= startOfDay(new Date(dateRange.from))) &&
        (!dateRange.to || saleDate <= endOfDay(new Date(dateRange.to)));

      const matchesPayment =
        paymentMethod === "all" || s.paymentMethod === paymentMethod;

      const hasBrand =
        selectedBrand === "all" ||
        s.items.some(
          (i) => i.variant?.product?.brandId === Number(selectedBrand)
        );
      const hasCategory =
        selectedCategory === "all" ||
        s.items.some(
          (i) => i.variant?.product?.categoryId === Number(selectedCategory)
        );

      const amount = Number(s.totalAmount);
      const matchesMin = !minAmount || amount >= Number(minAmount);
      const matchesMax = !maxAmount || amount <= Number(maxAmount);

      return (
        matchesSearch &&
        matchesDate &&
        matchesPayment &&
        hasBrand &&
        hasCategory &&
        matchesMin &&
        matchesMax
      );
    });
  }, [
    sales,
    search,
    dateRange,
    paymentMethod,
    selectedBrand,
    selectedCategory,
    minAmount,
    maxAmount,
    brands,
    categories,
  ]);

  const stats = useMemo(() => {
    if (!filteredSales)
      return { totalSales: 0, revenue: 0, totalProfit: 0, margin: 0 };
    const totalSales = filteredSales.length;
    const revenue = filteredSales.reduce(
      (acc, s) => acc + Number(s.totalAmount),
      0
    );
    const totalCost = filteredSales.reduce(
      (acc, s) => acc + calculateSaleCosts(s),
      0
    );
    const totalProfit = revenue - totalCost;
    const margin = revenue > 0 ? (totalProfit / revenue) * 100 : 0;

    return { totalSales, revenue, totalProfit, margin };
  }, [filteredSales]);

  const resetFilters = () => {
    setDateRange({ from: "", to: "" });
    setPaymentMethod("all");
    setSelectedBrand("all");
    setSelectedCategory("all");
    setMinAmount("");
    setMaxAmount("");
    setSearch("");
  };

  const exportToExcel = () => {
    if (!filteredSales.length) return;

    const data = filteredSales.map((s) => {
      const cost = calculateSaleCosts(s);
      const sold = Number(s.totalAmount);
      const profit = sold - cost;

      return {
        "Invoice No": s.invoiceNo,
        Date: format(new Date(s.createdAt), "yyyy-MM-dd HH:mm"),
        Customer: s.customerName || "Walking Customer",
        "Items Count": s.items.length,
        "Total Cost": cost,
        "Total Sold": sold,
        Profit: profit,
        "Payment Method": s.paymentMethod,
        Salesperson: s.user?.name || "System",
      };
    });

    const workSheet = XLSX.utils.json_to_sheet(data);
    const workBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workBook, workSheet, "Sales");
    XLSX.writeFile(
      workBook,
      `Sales_Export_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
          Loading Transactions...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight italic">
            SALES HISTORY
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Manage and review all customer transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={exportToExcel}
            className="flex-1 sm:flex-none h-10 border-border bg-card text-muted-foreground hover:text-foreground"
            disabled={filteredSales.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Export Excel</span>
          </Button>
          <Button
            onClick={() => navigate("/pos")}
            className="flex-1 sm:flex-none h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Sale
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border overflow-hidden relative group">
          <CardHeader className="pb-4">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
              Gross Revenue
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">
              ${stats.revenue.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card border-border overflow-hidden relative group">
          <CardHeader className="pb-4">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-blue-500/80 mb-1">
              Total Profit
            </CardDescription>
            <CardTitle className="text-2xl font-black text-blue-500">
              ${stats.totalProfit.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card border-border overflow-hidden relative group">
          <CardHeader className="pb-4">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80 mb-1">
              Avg Margin
            </CardDescription>
            <CardTitle className="text-2xl font-black text-emerald-500">
              {stats.margin.toFixed(1)}%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card border-border overflow-hidden relative group">
          <CardHeader className="pb-4">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
              Invoices
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">
              {stats.totalSales}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter Section */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="p-4 border-b border-border space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
              <Input
                placeholder="Search invoice or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 bg-muted/50 border-border rounded-lg text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isFilterOpen ? "secondary" : "outline"}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="h-10 border-border"
              >
                <Filter className="w-4 h-4 mr-2" />
                Advanced Filters
                {isFilterOpen ? <X className="ml-2 w-3 h-3" /> : null}
              </Button>
              {(dateRange.from ||
                dateRange.to ||
                paymentMethod !== "all" ||
                selectedBrand !== "all" ||
                selectedCategory !== "all" ||
                minAmount ||
                maxAmount) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {isFilterOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Date Range
                </label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        ...prev,
                        from: e.target.value,
                      }))
                    }
                    className="h-9 text-xs bg-muted/30"
                  />
                  <Input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) =>
                      setDateRange((prev) => ({ ...prev, to: e.target.value }))
                    }
                    className="h-9 text-xs bg-muted/30"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Payment Method
                </label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-9 text-xs bg-muted/30">
                    <SelectValue placeholder="All Methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="TRANSFER">Transfer</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
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

              <div className="space-y-2 lg:col-span-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Amount Range ($)
                </label>
                <div className="flex gap-2 max-w-sm">
                  <Input
                    placeholder="Min"
                    type="number"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="h-9 text-xs bg-muted/30"
                  />
                  <Input
                    placeholder="Max"
                    type="number"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="h-9 text-xs bg-muted/30"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground/60 font-bold uppercase text-[10px] tracking-widest whitespace-nowrap">
                  Date / Time
                </TableHead>
                <TableHead className="text-muted-foreground/60 font-bold uppercase text-[10px] tracking-widest whitespace-nowrap">
                  Invoice No.
                </TableHead>
                <TableHead className="text-muted-foreground/60 font-bold uppercase text-[10px] tracking-widest whitespace-nowrap">
                  Customer
                </TableHead>
                <TableHead className="text-muted-foreground/60 font-bold uppercase text-[10px] tracking-widest text-right whitespace-nowrap">
                  Cost
                </TableHead>
                <TableHead className="text-muted-foreground/60 font-bold uppercase text-[10px] tracking-widest text-right whitespace-nowrap">
                  Sold
                </TableHead>
                <TableHead className="text-muted-foreground/60 font-bold uppercase text-[10px] tracking-widest text-right whitespace-nowrap">
                  Profit
                </TableHead>
                {/* Margin column removed */}
                <TableHead className="text-muted-foreground/60 font-bold uppercase text-[10px] tracking-widest text-right whitespace-nowrap">
                  Pay
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length === 0 ? (
                <TableRow className="border-border hover:bg-transparent">
                  <TableCell colSpan={7} className="h-32 text-center">
                    <p className="text-muted-foreground italic text-sm">
                      No sales records found
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale) => {
                  const cost = calculateSaleCosts(sale);
                  const sold = Number(sale.totalAmount);
                  const profit = sold - cost;
                  // Margin calculation logic removed from UI

                  return (
                    <TableRow
                      key={sale.id}
                      className="border-border hover:bg-muted/40 cursor-pointer group"
                      onClick={() => navigate(`/sales/${sale.id}`)}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-foreground/80 font-medium text-xs">
                            {format(new Date(sale.createdAt), "MMM d, yyyy")}
                          </span>
                          <span className="text-[9px] text-muted-foreground/40 font-bold uppercase">
                            {format(new Date(sale.createdAt), "HH:mm")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-border bg-muted/50 text-muted-foreground font-mono text-[10px]"
                        >
                          {sale.invoiceNo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-bold text-xs truncate max-w-[120px]">
                            {sale.customerName || "Walking Customer"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-muted-foreground/60 text-xs font-mono">
                          ${cost.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-foreground font-bold text-xs font-mono">
                          ${sold.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "font-black text-xs font-mono",
                            profit >= 0 ? "text-emerald-500" : "text-red-500"
                          )}
                        >
                          ${profit.toLocaleString()}
                        </span>
                      </TableCell>
                      {/* Margin cell removed */}
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className="text-[9px] border-border text-muted-foreground/60 uppercase font-black px-1"
                        >
                          {sale.paymentMethod?.slice(0, 4)}
                        </Badge>
                      </TableCell>
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
