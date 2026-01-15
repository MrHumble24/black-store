import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { purchaseQueries } from "@/entities/purchase";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import {
  Plus,
  ExternalLink,
  Download,
  Loader2,
  DollarSign,
  Truck,
  Calendar,
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
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { PurchaseFilters } from "./PurchaseFilters";
import type { PurchaseFilterValues } from "./PurchaseFilters";

const INITIAL_FILTERS: PurchaseFilterValues = {
  search: "",
  type: "all",
  providerId: "all",
  startDate: "",
  endDate: "",
};

export default function PurchasesPage() {
  const navigate = useNavigate();
  const { data: purchases, isLoading } = purchaseQueries.useAll();
  const [filters, setFilters] = useState<PurchaseFilterValues>(INITIAL_FILTERS);

  const filteredPurchases = useMemo(() => {
    if (!purchases) return [];
    return purchases.filter((p) => {
      // Search
      const matchesSearch =
        !filters.search ||
        p.referenceNo?.toLowerCase().includes(filters.search.toLowerCase()) ||
        p.provider?.name
          ?.toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        p.sellerInfo?.toLowerCase().includes(filters.search.toLowerCase());

      // Type
      const matchesType = filters.type === "all" || p.type === filters.type;

      // Provider
      const matchesProvider =
        filters.providerId === "all" ||
        String(p.providerId) === filters.providerId;

      // Date Range
      let matchesDate = true;
      if (filters.startDate || filters.endDate) {
        const purchaseDate = new Date(p.createdAt);
        const start = filters.startDate
          ? startOfDay(new Date(filters.startDate))
          : new Date(0);
        const end = filters.endDate
          ? endOfDay(new Date(filters.endDate))
          : new Date(8640000000000000);
        matchesDate = isWithinInterval(purchaseDate, { start, end });
      }

      return matchesSearch && matchesType && matchesProvider && matchesDate;
    });
  }, [purchases, filters]);

  const stats = useMemo(() => {
    if (!purchases) return { totalPurchases: 0, expenditure: 0 };
    const totalPurchases = purchases.length;
    const expenditure = purchases.reduce(
      (acc, p) => acc + Number(p.totalCost),
      0
    );
    return { totalPurchases, expenditure };
  }, [purchases]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">
          Decrypting Invoices...
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
            PURCHASES
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Manage inbound stock and supplier invoices
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
            onClick={() => navigate("/purchases/create")}
            className="flex-1 sm:flex-none h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Purchase
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-card border-border overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 transition-opacity">
            <DollarSign className="w-12 h-12 text-foreground/20" />
          </div>
          <CardHeader className="pb-4">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
              Total Expenditure
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">
              ${stats.expenditure.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card border-border overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 transition-opacity">
            <Truck className="w-12 h-12 text-foreground/20" />
          </div>
          <CardHeader className="pb-4">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
              Supplier Invoices
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">
              {stats.totalPurchases}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card border-border overflow-hidden relative group sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 p-4 transition-opacity">
            <Calendar className="w-12 h-12 text-foreground/20" />
          </div>
          <CardHeader className="pb-4">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
              Recent Activity
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">
              {purchases && purchases.length > 0
                ? format(new Date(purchases[0].createdAt), "MMM d")
                : "No data"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Table Card */}
      <div className="space-y-4">
        <PurchaseFilters
          filters={filters}
          setFilters={setFilters}
          onClear={() => setFilters(INITIAL_FILTERS)}
        />

        <Card className="bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground/60 font-bold uppercase text-[10px] tracking-widest">
                    Date
                  </TableHead>
                  <TableHead className="text-muted-foreground/60 font-bold uppercase text-[10px] tracking-widest">
                    Reference No.
                  </TableHead>
                  <TableHead className="text-muted-foreground/60 font-bold uppercase text-[10px] tracking-widest">
                    Supplier
                  </TableHead>
                  <TableHead className="text-muted-foreground/60 font-bold uppercase text-[10px] tracking-widest">
                    Received By
                  </TableHead>
                  <TableHead className="text-muted-foreground/60 font-bold uppercase text-[10px] tracking-widest text-right">
                    Total Cost
                  </TableHead>
                  <TableHead className="text-muted-foreground/60 font-bold uppercase text-[10px] tracking-widest text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.length === 0 ? (
                  <TableRow className="border-border hover:bg-transparent">
                    <TableCell colSpan={6} className="h-32 text-center">
                      <p className="text-muted-foreground/60 italic text-sm">
                        No purchase records found
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <TableRow
                      key={purchase.id}
                      className="border-border hover:bg-muted/40 cursor-pointer group"
                      onClick={() => navigate(`/purchases/${purchase.id}`)}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-foreground/80 font-medium text-sm">
                            {format(
                              new Date(purchase.createdAt),
                              "MMM d, yyyy"
                            )}
                          </span>
                          <span className="text-[10px] text-muted-foreground/40 font-bold uppercase">
                            {format(new Date(purchase.createdAt), "HH:mm")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-border bg-muted/50 text-emerald-500 font-mono"
                        >
                          {purchase.referenceNo || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-600/10 flex items-center justify-center text-[10px] font-black text-emerald-500 border border-emerald-500/10">
                            {purchase.provider?.name?.charAt(0) || "S"}
                          </div>
                          <span className="text-foreground font-bold text-sm">
                            {purchase.provider?.name || "Unknown Supplier"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground/60 text-xs font-medium">
                          {purchase.user?.name || "System"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-foreground font-black text-sm">
                          ${Number(purchase.totalCost).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground/40 group-hover:text-emerald-500 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
