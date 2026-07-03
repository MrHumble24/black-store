import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { salesQueries } from "@/entities/sale";
import { returnQueries, type ReturnReason } from "@/entities/return";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import {
  ArrowLeft,
  Calendar,
  User,
  Package,
  DollarSign,
  Loader2,
  Clock,
  ShieldCheck,
  RotateCcw,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { format } from "date-fns";
import { Separator } from "@/shared/ui/separator";
import { printReceipt } from "@/shared/lib/printUtils";

export default function SaleDetailsPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: sale, isLoading } = salesQueries.useOne(Number(id));

  // Return state
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [returnReason, setReturnReason] = useState<ReturnReason>("DEFECTIVE");
  const [refundAmount, setRefundAmount] = useState<string>("0");
  const [returnNotes, setReturnNotes] = useState("");

  const createReturnMutation = returnQueries.useCreate();
  const voidMutation = salesQueries.useVoid();

  const handleOpenReturn = (item: any) => {
    setSelectedItem(item);
    setRefundAmount(String(item.sellPrice));
    setReturnReason("DEFECTIVE");
    setReturnNotes("");
  };

  const handleCreateReturn = () => {
    if (!selectedItem) return;
    createReturnMutation.mutate(
      {
        saleId: Number(id),
        orderItemId: selectedItem.id,
        reason: returnReason,
        refundAmount: Number(refundAmount),
        notes: returnNotes,
      },
      {
        onSuccess: () => {
          setSelectedItem(null);
          navigate("/returns");
        },
      },
    );
  };

  if (isLoading || !sale) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
          {isLoading ? t("pos.processing") : t("sales.not_found")}
        </p>
        {!isLoading && !sale && (
          <Button onClick={() => navigate("/sales")}>
            {t("sales.details.back")}
          </Button>
        )}
      </div>
    );
  }

  const totalProfit =
    sale.items?.reduce(
      (acc, item) =>
        acc + (Number(item.sellPrice) * item.quantity - Number(item.costPrice)),
      0,
    ) || 0;

  return (
    <div className=" mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/sales")}
            className="rounded-full h-10 w-10 border-border bg-card hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Badge className="bg-emerald-600/10 text-emerald-500 border-emerald-500/20 text-[9px] font-black uppercase tracking-widest px-1.5 py-0 h-4">
                {t("sales.details.completed")}
              </Badge>
              <p className="text-[10px] text-muted-foreground font-mono font-bold">
                {sale.invoiceNo}
              </p>
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              {t("sales.details.title")}
            </h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-card border-border overflow-hidden shadow-2xl">
            <div className="h-1.5 bg-linear-to-r from-blue-600 to-indigo-600" />
            <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  {t("pos.date")}
                </p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <p className="text-sm font-bold text-foreground">
                    {format(new Date(sale.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  {t("pos.date_time")}
                </p>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <p className="text-sm font-bold text-foreground">
                    {format(new Date(sale.createdAt), "HH:mm")}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  {t("pos.total")}
                </p>
                <div className="flex items-center gap-2 text-foreground">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <p className="text-lg font-black tracking-tighter">
                    ${Number(sale.totalAmount).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                  {t("sales.details.profit_label")}
                </p>
                <div className="flex items-center gap-2 text-indigo-500">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <p className="text-lg font-black tracking-tighter">
                    ${totalProfit.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-card border-border overflow-hidden shadow-2xl">
            <CardHeader className="p-6 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                {t("sales.details.itemized_manifest")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {sale.items?.map((item, idx) => {
                  // Check if item has any returns
                  const itemReturns = item.returns || [];
                  const hasReturn = itemReturns.length > 0;
                  const latestReturn = hasReturn ? itemReturns[0] : null;
                  const isReturned =
                    hasReturn &&
                    ["APPROVED", "RESTOCKED", "DISPOSED"].includes(
                      latestReturn?.status || "",
                    );
                  const isPendingReturn =
                    hasReturn && latestReturn?.status === "PENDING";

                  // Status badge styling
                  const getReturnBadge = () => {
                    if (!hasReturn) return null;
                    const status = latestReturn?.status;
                    const styles: Record<string, string> = {
                      PENDING:
                        "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                      APPROVED:
                        "bg-blue-500/10 text-blue-500 border-blue-500/20",
                      RESTOCKED:
                        "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                      DISPOSED:
                        "bg-purple-500/10 text-purple-500 border-purple-500/20",
                      REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
                    };
                    return (
                      <Badge
                        className={`${styles[status || ""] || ""} text-[9px] font-black uppercase tracking-widest px-1.5 py-0 h-4`}
                      >
                        {status === "RESTOCKED"
                          ? t("sales.return.status.restocked")
                          : status === "APPROVED"
                            ? t("sales.return.status.refunded")
                            : status === "DISPOSED"
                              ? t("sales.return.status.disposed")
                              : status === "PENDING"
                                ? t("sales.return.status.pending")
                                : status === "REJECTED"
                                  ? t("sales.return.status.rejected")
                                  : status}
                      </Badge>
                    );
                  };

                  return (
                    <div
                      key={idx}
                      className={`p-6 flex items-center justify-between transition-colors group ${
                        isReturned
                          ? "bg-muted/50 opacity-60"
                          : isPendingReturn
                            ? "bg-yellow-500/5"
                            : "hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${
                            isReturned
                              ? "bg-muted border-border"
                              : "bg-muted border-border group-hover:bg-blue-600/10 group-hover:border-blue-500/20"
                          }`}
                        >
                          <Package
                            className={`w-6 h-6 ${
                              isReturned
                                ? "text-muted-foreground"
                                : "text-muted-foreground group-hover:text-blue-500"
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p
                              className={`font-bold text-base ${isReturned ? "line-through text-muted-foreground" : "text-foreground"}`}
                            >
                              {item.variant?.product?.name ||
                                t("dashboard.product")}
                            </p>
                            {getReturnBadge()}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <p className="text-muted-foreground text-xs font-medium">
                              {item.variant?.name || "Standard Variant"}
                            </p>
                            {item.serialNumber && (
                              <Badge className="bg-blue-600/10 text-blue-500 border-blue-500/10 text-[9px] font-mono h-4">
                                SN: {item.serialNumber}
                              </Badge>
                            )}
                            {isReturned && latestReturn && (
                              <span className="text-[10px] text-muted-foreground">
                                {t("sales.return.refund")}: $
                                {Number(
                                  latestReturn.refundAmount,
                                ).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p
                            className={`font-black text-lg tracking-tight ${isReturned ? "line-through text-muted-foreground" : "text-foreground"}`}
                          >
                            $
                            {(
                              Number(item.sellPrice) * item.quantity
                            ).toLocaleString()}
                          </p>
                          <p
                            className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${isReturned ? "text-muted-foreground" : "text-indigo-400"}`}
                          >
                            {t("sales.details.profit_label")}: $
                            {(
                              Number(item.sellPrice) * item.quantity -
                              Number(item.costPrice)
                            ).toLocaleString()}
                          </p>
                        </div>
                        {/* Only show return button if item is not already returned or pending */}
                        {!isReturned && !isPendingReturn && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenReturn(item)}
                            className="text-muted-foreground/50 hover:text-orange-500 hover:bg-orange-500/10 rounded-xl transition-all"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                        {isPendingReturn && (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled
                            className="text-yellow-500/50 rounded-xl"
                          >
                            <Clock className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-card border-border overflow-hidden shadow-2xl">
            <div className="p-6 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    {t("sales.details.customer_details")}
                  </h4>
                </div>
                <div className="flex items-center gap-3 bg-muted/50 p-4 rounded-2xl border border-border">
                  <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center text-[10px] font-black text-blue-500 border border-blue-500/10">
                    {sale.customerName?.charAt(0) || "W"}
                  </div>
                  <div>
                    <p className="text-foreground font-bold text-sm">
                      {sale.customerName || t("pos.walking_customer")}
                    </p>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-tighter">
                      {sale.customerPhone || "Local Sale"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    {t("sales.details.sales_agent")}
                  </h4>
                </div>
                <div className="flex items-center gap-3 bg-muted/50 p-4 rounded-2xl border border-border">
                  <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center uppercase font-black text-[10px] text-muted-foreground">
                    {sale.user?.name?.charAt(0) || "S"}
                  </div>
                  <div>
                    <p className="text-foreground font-bold text-sm">
                      {sale.user?.name || "System Staff"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="space-y-4 pt-2">
                <div className="bg-blue-600/10 p-4 rounded-2xl border border-blue-500/20 flex justify-between items-center">
                  <span className="text-blue-400 text-sm font-black uppercase">
                    {t("sales.details.paid_total")}
                  </span>
                  <span className="text-foreground text-xl font-black">
                    ${Number(sale.totalAmount).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-2">
                <Button
                  onClick={() => printReceipt(sale)}
                  className="w-full bg-foreground hover:bg-muted text-background h-12 font-black rounded-xl transition-all shadow-xl shadow-foreground/5"
                >
                  {t("sales.details.download_pdf")}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (confirm(t("sales.details.void_confirm"))) {
                      voidMutation.mutate(Number(id), {
                        onSuccess: () => navigate("/sales"),
                      });
                    }
                  }}
                  disabled={voidMutation.isPending}
                  className="w-full h-10 text-muted-foreground hover:text-red-500 font-bold text-[10px] uppercase tracking-widest"
                >
                  {voidMutation.isPending
                    ? t("sales.details.voiding")
                    : t("sales.details.void_transaction")}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Dialog
        open={!!selectedItem}
        onOpenChange={(open) => !open && setSelectedItem(null)}
      >
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground italic uppercase tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-orange-500" />
              {t("sales.return.title")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                {t("sales.return.reason")}
              </label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value as any)}
                className="w-full h-10 bg-muted border-border rounded-lg px-3 text-sm font-bold text-foreground focus:outline-none"
              >
                <option value="DEFECTIVE">
                  {t("sales.return.reasons.defective")}
                </option>
                <option value="WRONG_ITEM">
                  {t("sales.return.reasons.wrong_item")}
                </option>
                <option value="CUSTOMER_CHANGE_MIND">
                  {t("sales.return.reasons.customer_change_mind")}
                </option>
                <option value="WARRANTY_CLAIM">
                  {t("sales.return.reasons.warranty_claim")}
                </option>
                <option value="OTHER">{t("sales.return.reasons.other")}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                {t("sales.return.refund")}
              </label>
              <Input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="h-10 bg-muted border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                {t("sales.return.notes")}
              </label>
              <Textarea
                placeholder={t("common.placeholder")}
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                className="bg-muted border-border"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedItem(null)}
              className="border-border bg-card text-muted-foreground font-bold"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleCreateReturn}
              disabled={createReturnMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white font-black"
            >
              {createReturnMutation.isPending
                ? t("pos.processing")
                : t("sales.return.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
