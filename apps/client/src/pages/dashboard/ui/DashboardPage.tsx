import { reportQueries } from "@/entities/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
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
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  RotateCcw,
  TrendingUp,
} from "lucide-react";

export default function DashboardPage() {
  const { data, isLoading } = reportQueries.useDashboard();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Today's Revenue",
      value: `$${Number(data?.todayRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Today's Orders",
      value: data?.todayOrders || 0,
      icon: ShoppingCart,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Low Stock Items",
      value: (data?.lowStockItems as any[])?.length || 0,
      icon: AlertTriangle,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Pending Returns",
      value: data?.pendingReturns || 0,
      icon: RotateCcw,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <TrendingUp className="h-3 w-3" />
          Live
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Invoice</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Seller</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.recentSales as any[])?.slice(0, 5).map((sale: any) => (
                  <TableRow key={sale.id} className="border-border">
                    <TableCell className="font-mono text-sm uppercase">
                      {sale.invoiceNo}
                    </TableCell>
                    <TableCell className="text-green-500 font-medium">
                      ${Number(sale.totalAmount).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {sale.user?.name}
                    </TableCell>
                  </TableRow>
                )) || (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-8"
                    >
                      No sales today
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Product</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Min</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.lowStockItems as any[])
                  ?.slice(0, 5)
                  .map((item: any) => (
                    <TableRow key={item.id} className="border-border">
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="font-mono">
                          {item.current_stock}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono">
                        {item.min_stock}
                      </TableCell>
                    </TableRow>
                  )) || (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-8"
                    >
                      All items in stock
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
