import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { returnQueries } from "@/entities/return";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import {
  Search,
  ExternalLink,
  Loader2,
  RotateCcw,
  Clock,
  CheckCircle2,
  History,
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
import { cn } from "@/shared/lib/utils";

export default function ReturnsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: returns, isLoading } = returnQueries.useAll(
    statusFilter === "all" ? undefined : statusFilter,
  );

  const filteredReturns = useMemo(() => {
    if (!returns) return [];
    return returns.filter(
      (r) =>
        r.sale?.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
        r.orderItem?.variant?.product?.name
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
  }, [returns, search]);

  const stats = useMemo(() => {
    if (!returns) return { pending: 0, approved: 0, totalRefund: 0 };
    const pending = returns.filter((r) => r.status === "PENDING").length;
    const approved = returns.filter(
      (r) => r.status === "APPROVED" || r.status === "RESTOCKED",
    ).length;
    const totalRefund = returns.reduce(
      (acc, r) => acc + Number(r.refundAmount),
      0,
    );
    return { pending, approved, totalRefund };
  }, [returns]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
          {t("returns.loading")}
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
            {t("returns.title")}
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            {t("returns.description")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate("/sales")}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg shadow-orange-600/10"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t("returns.process_new")}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 transition-opacity">
            <Clock className="w-12 h-12 text-orange-500 opacity-20" />
          </div>
          <CardHeader className="pb-4">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
              {t("returns.stats.pending_items")}
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">
              {stats.pending}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/50 border-border overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 transition-opacity">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 opacity-20" />
          </div>
          <CardHeader className="pb-4">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
              {t("returns.stats.finalized")}
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">
              {stats.approved}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/50 border-border overflow-hidden relative group sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 p-4 transition-opacity">
            <History className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
          <CardHeader className="pb-4">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
              {t("returns.stats.total_refunded")}
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">
              ${stats.totalRefund.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-card/30 p-4 rounded-xl border border-border">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
          <Input
            placeholder={t("returns.filters.search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-muted border-border rounded-lg text-sm"
          />
        </div>

        <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-card">
          {(
            ["all", "PENDING", "APPROVED", "RESTOCKED", "REJECTED"] as const
          ).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-3 text-[10px] font-black uppercase tracking-tighter"
              onClick={() => setStatusFilter(status)}
            >
              {t(`returns.filters.${status.toLowerCase()}`)}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest px-6">
                  {t("returns.table.date")}
                </TableHead>
                <TableHead className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest px-6">
                  {t("returns.table.sale_info")}
                </TableHead>
                <TableHead className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest px-6">
                  {t("returns.table.item_details")}
                </TableHead>
                <TableHead className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest px-6">
                  {t("returns.table.reason")}
                </TableHead>
                <TableHead className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest px-6">
                  {t("returns.table.status")}
                </TableHead>
                <TableHead className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest text-right px-6">
                  {t("returns.table.refund")}
                </TableHead>
                <TableHead className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest text-right px-6">
                  {t("returns.table.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReturns.length === 0 ? (
                <TableRow className="border-border hover:bg-transparent">
                  <TableCell colSpan={7} className="h-32 text-center">
                    <p className="text-muted-foreground italic text-sm">
                      {t("returns.table.no_records")}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredReturns.map((ret) => (
                  <TableRow
                    key={ret.id}
                    className="border-border hover:bg-muted/40 cursor-pointer group"
                    onClick={() => navigate(`/returns/${ret.id}`)}
                  >
                    <TableCell className="px-6">
                      <div className="flex flex-col">
                        <span className="text-foreground font-medium text-sm">
                          {format(new Date(ret.createdAt), "MMM d, yyyy")}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">
                          {format(new Date(ret.createdAt), "HH:mm")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6">
                      <Badge
                        variant="outline"
                        className="border-border bg-muted/50 text-muted-foreground font-mono text-[10px]"
                      >
                        {ret.sale?.invoiceNo}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 max-w-[200px]">
                      <div className="flex flex-col">
                        <span className="text-foreground font-bold text-sm truncate">
                          {ret.orderItem?.variant?.product?.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase font-medium">
                          {ret.orderItem?.variant?.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6">
                      <span className="text-muted-foreground text-xs font-bold uppercase tracking-tighter">
                        {ret.reason.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell className="px-6">
                      <Badge
                        className={cn(
                          "uppercase text-[9px] font-black tracking-widest h-5",
                          ret.status === "PENDING" &&
                            "bg-orange-500/10 text-orange-500 border-orange-500/20",
                          ret.status === "APPROVED" &&
                            "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                          ret.status === "RESTOCKED" &&
                            "bg-blue-500/10 text-blue-500 border-blue-500/20",
                          ret.status === "REJECTED" &&
                            "bg-red-500/10 text-red-500 border-red-500/20",
                        )}
                        variant="outline"
                      >
                        {ret.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <span className="text-foreground font-black text-sm">
                        ${Number(ret.refundAmount).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground group-hover:text-orange-500 transition-colors"
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
  );
}
