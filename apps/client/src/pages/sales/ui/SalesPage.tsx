import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { salesQueries } from "@/entities/sale";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import {
  Search,
  Plus,
  ExternalLink,
  Filter,
  Download,
  Loader2,
  FileText,
  DollarSign,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Badge } from "@/shared/ui/badge";
import { format } from "date-fns";

export default function SalesPage() {
  const navigate = useNavigate();
  const { data: sales, isLoading } = salesQueries.useAll();
  const [search, setSearch] = useState("");

  const filteredSales = useMemo(() => {
    if (!sales) return [];
    return sales.filter(
      (s) =>
        s.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
        s.customerName?.toLowerCase().includes(search.toLowerCase())
    );
  }, [sales, search]);

  const stats = useMemo(() => {
    if (!sales) return { totalSales: 0, revenue: 0, avgTicket: 0 };
    const totalSales = sales.length;
    const revenue = sales.reduce((acc, s) => acc + Number(s.totalAmount), 0);
    const avgTicket = totalSales > 0 ? revenue / totalSales : 0;
    return { totalSales, revenue, avgTicket };
  }, [sales]);

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
            className="flex-1 sm:flex-none h-10 border-border bg-card text-muted-foreground hover:text-foreground"
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-card border-border overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4  transition-opacity">
            <DollarSign className="w-12 h-12 text-foreground/20" />
          </div>
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
          <div className="absolute top-0 right-0 p-4 transition-opacity">
            <FileText className="w-12 h-12 text-foreground/20" />
          </div>
          <CardHeader className="pb-4">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
              Total Invoices
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">
              {stats.totalSales}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card border-border overflow-hidden relative group sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 p-4 transition-opacity">
            <TrendingUpIcon className="w-12 h-12 text-foreground/20" />
          </div>
          <CardHeader className="pb-4">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
              Average Value
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">
              $
              {stats.avgTicket.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
            <Input
              placeholder="Search invoice or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 bg-muted border-border rounded-lg text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground/60 font-bold uppercase text-[10px] tracking-widest">
                Date / Time
              </TableHead>
              <TableHead className="text-muted-foreground/60 font-bold uppercase text-[10px] tracking-widest">
                Invoice No.
              </TableHead>
              <TableHead className="text-muted-foreground/60 font-bold uppercase text-[10px] tracking-widest">
                Customer
              </TableHead>
              <TableHead className="text-muted-foreground/60 font-bold uppercase text-[10px] tracking-widest">
                Salesperson
              </TableHead>
              <TableHead className="text-muted-foreground/60 font-bold uppercase text-[10px] tracking-widest text-right">
                Amount
              </TableHead>
              <TableHead className="text-muted-foreground/60 font-bold uppercase text-[10px] tracking-widest text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.length === 0 ? (
              <TableRow className="border-border hover:bg-transparent">
                <TableCell colSpan={6} className="h-32 text-center">
                  <p className="text-muted-foreground italic text-sm">
                    No sales records found
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredSales.map((sale) => (
                <TableRow
                  key={sale.id}
                  className="border-border hover:bg-muted/40 cursor-pointer group"
                  onClick={() => navigate(`/sales/${sale.id}`)}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-foreground/80 font-medium text-sm">
                        {format(new Date(sale.createdAt), "MMM d, yyyy")}
                      </span>
                      <span className="text-[10px] text-muted-foreground/40 font-bold uppercase">
                        {format(new Date(sale.createdAt), "HH:mm")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-border bg-muted/50 text-muted-foreground font-mono"
                    >
                      {sale.invoiceNo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center text-[10px] font-black text-blue-500 border border-blue-500/10">
                        {sale.customerName?.charAt(0) || "WC"}
                      </div>
                      <span className="text-foreground font-bold text-sm">
                        {sale.customerName || "Walking Customer"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground/60 text-xs font-medium">
                      {sale.user?.name || "System"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-foreground font-black text-sm">
                      ${Number(sale.totalAmount).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground/40 group-hover:text-blue-500 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function TrendingUpIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
