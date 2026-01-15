import { useState } from "react";
import { reportQueries } from "@/entities/report";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  Loader2,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  BarChart3,
  Warehouse,
  TrendingUp,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Badge } from "@/shared/ui/badge";

export default function ReportsPage() {
  const [startDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  const { data: sales, isLoading: salesLoading } = reportQueries.useSales(
    startDate,
    endDate
  );
  const { data: profit, isLoading: profitLoading } = reportQueries.useProfit(
    startDate,
    endDate
  );
  const { data: inventory, isLoading: inventoryLoading } =
    reportQueries.useInventoryValue();

  if (salesLoading || profitLoading || inventoryLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
          Generating Analytics...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight italic uppercase">
            Business Intelligence
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Monitor your store performance and financial health
          </p>
        </div>
        <div className="flex items-center gap-2 bg-card p-1 rounded-xl border border-border">
          <Badge
            variant="outline"
            className="border-border text-muted-foreground font-mono"
          >
            {startDate}
          </Badge>
          <span className="text-muted-foreground">to</span>
          <Badge
            variant="outline"
            className="border-border text-muted-foreground font-mono"
          >
            {endDate}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="bg-card border border-border p-1 h-12">
          <TabsTrigger
            value="sales"
            className="px-6 font-bold uppercase tracking-widest text-[10px]"
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-2" />
            Sales Insights
          </TabsTrigger>
          <TabsTrigger
            value="profit"
            className="px-6 font-bold uppercase tracking-widest text-[10px]"
          >
            <TrendingUp className="w-3.5 h-3.5 mr-2" />
            Profit & Loss
          </TabsTrigger>
          <TabsTrigger
            value="inventory"
            className="px-6 font-bold uppercase tracking-widest text-[10px]"
          >
            <Package className="w-3.5 h-3.5 mr-2" />
            Inventory Value
          </TabsTrigger>
        </TabsList>

        {/* --- Sales Insights Tab --- */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card border-border relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <DollarSign className="w-16 h-16 text-indigo-500" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Total Revenue
                </CardDescription>
                <CardTitle className="text-3xl font-black text-foreground italic tracking-tighter">
                  ${sales?.totalRevenue.toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-card border-border relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShoppingCart className="w-16 h-16 text-emerald-500" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Order Count
                </CardDescription>
                <CardTitle className="text-3xl font-black text-foreground italic tracking-tighter">
                  {sales?.totalOrders}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-card border-border relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <BarChart3 className="w-16 h-16 text-amber-500" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Avg. Order Value
                </CardDescription>
                <CardTitle className="text-3xl font-black text-foreground italic tracking-tighter">
                  ${sales?.averageOrderValue.toFixed(2)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <Card className="bg-card border-border shadow-2xl">
              <CardHeader className="border-b border-border bg-muted/10">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Top Moving Products
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {sales?.topProducts.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center text-[10px] font-black text-muted-foreground">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {p.productName} {p.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono italic uppercase">
                            {p.sku}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-indigo-400 font-black text-sm">
                          {p.quantitySold} Units
                        </p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                          ${Number(p.revenue).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Sellers */}
            <Card className="bg-card border-border shadow-2xl">
              <CardHeader className="border-b border-border bg-muted/10">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  High Performers
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {sales?.topSellers.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-xs font-black text-indigo-500">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {s.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            {s.orderCount} Orders Processed
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-500 font-black text-lg tracking-tighter">
                          ${Number(s.totalSales).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- Profit & Loss Tab --- */}
        <TabsContent value="profit" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="bg-card border-border p-6">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                  Total Revenue
                </p>
                <p className="text-2xl font-black text-foreground italic">
                  ${profit?.revenue.toLocaleString()}
                </p>
              </Card>
              <Card className="bg-card border-border p-6">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                  Cost of Goods (COGS)
                </p>
                <p className="text-2xl font-black text-red-500 italic">
                  -${profit?.cogs.toLocaleString()}
                </p>
              </Card>
              <Card className="bg-card border-border p-6">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                  Operating Expenses
                </p>
                <p className="text-2xl font-black text-amber-500 italic">
                  -${profit?.expenses.toLocaleString()}
                </p>
              </Card>
              <Card className="bg-emerald-600/5 border-border border-l-4 border-l-emerald-600 p-6">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">
                  Net Realized Profit
                </p>
                <p className="text-2xl font-black text-emerald-500 italic">
                  ${profit?.netProfit.toLocaleString()}
                </p>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <Card className="bg-card border-border overflow-hidden">
                <CardHeader className="bg-indigo-600/10 p-6">
                  <CardTitle className="text-xs font-black uppercase text-indigo-400 tracking-widest">
                    Efficiency Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                      <span className="text-muted-foreground">
                        Gross Margin
                      </span>
                      <span className="text-foreground">
                        {profit?.grossMargin.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500"
                        style={{ width: `${profit?.grossMargin}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                      <span className="text-muted-foreground">Net Margin</span>
                      <span className="text-foreground">
                        {profit?.netMargin.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${profit?.netMargin}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border p-6 space-y-2">
                <div className="flex items-center gap-2 text-rose-500">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Expense Impact
                  </span>
                </div>
                <p className="text-foreground font-bold text-sm">
                  Overheads consume{" "}
                  {(
                    ((profit?.expenses || 0) / (profit?.revenue || 1)) *
                    100
                  ).toFixed(1)}
                  % of your gross intake.
                </p>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* --- Inventory Value Tab --- */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card border-border p-8 flex items-center gap-6 group">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center relative transition-transform group-hover:scale-105">
                <Package className="w-8 h-8 text-indigo-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Total Sku Value
                </p>
                <p className="text-3xl font-black text-foreground italic tracking-tighter">
                  ${inventory?.totalValue.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground/60 font-bold uppercase mt-1 italic">
                  {inventory?.totalItems} Units Available
                </p>
              </div>
            </Card>
            <Card className="bg-card border-border p-8 flex items-center gap-6 group">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center relative transition-transform group-hover:scale-105">
                <Warehouse className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Active Locations
                </p>
                <p className="text-3xl font-black text-foreground italic tracking-tighter">
                  {inventory?.byWarehouse.length} Warehouses
                </p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border shadow-2xl">
              <CardHeader className="bg-muted/10 border-b border-border">
                <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest">
                  Warehouse Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {inventory?.byWarehouse.map((w, idx) => (
                    <div
                      key={idx}
                      className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="text-foreground font-bold text-sm uppercase italic">
                          {w.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-muted border-border text-[9px] font-black h-5 uppercase">
                            {w.items} items
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-foreground font-black text-sm">
                          ${Number(w.value).toLocaleString()}
                        </p>
                        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">
                          {(
                            (Number(w.value) / (inventory?.totalValue || 1)) *
                            100
                          ).toFixed(1)}
                          % Weight
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-2xl">
              <CardHeader className="bg-muted/10 border-b border-border">
                <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest">
                  Value By Category
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {inventory?.byCategory.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="text-foreground font-bold text-sm uppercase italic">
                          {c.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-indigo-500 font-black text-sm">
                          ${Number(c.value).toLocaleString()}
                        </p>
                        <div className="flex justify-end mt-1">
                          <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500"
                              style={{
                                width: `${
                                  (Number(c.value) /
                                    (inventory?.totalValue || 1)) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
