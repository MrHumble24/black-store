import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { returnQueries, type ReturnStatus } from "@/entities/return";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import {
  ArrowLeft,
  Calendar,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
  FileText,
  DollarSign,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { format } from "date-fns";
import { Textarea } from "@/shared/ui/textarea";

export default function ReturnDetailsPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [notes, setNotes] = useState("");
  const { data: ret, isLoading } = returnQueries.useOne(Number(id));
  const processMutation = returnQueries.useProcess();

  const handleProcess = (status: ReturnStatus) => {
    processMutation.mutate(
      { id: Number(id), data: { status, notes } },
      { onSuccess: () => navigate("/returns") },
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
          {t("returns.fetching")}
        </p>
      </div>
    );
  }

  if (!ret) return <div>{t("returns.not_found")}</div>;

  const isPending = ret.status === "PENDING";

  return (
    <div className=" mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/returns")}
            className="rounded-xl border-border bg-card text-muted-foreground hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-foreground tracking-tight uppercase italic">
                {t("returns.details.title")}
              </h1>
              <Badge
                variant="outline"
                className={`uppercase tracking-widest text-[10px] h-5 font-black ${
                  ret.status === "PENDING"
                    ? "border-orange-500 text-orange-500 bg-orange-500/5"
                    : "border-border text-muted-foreground"
                }`}
              >
                {ret.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase">
              {t("returns.details.id")}: #{ret.id}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left column: Summary */}
        <div className="md:col-span-5 space-y-6">
          <Card className="bg-card border-border overflow-hidden shadow-2xl">
            <CardHeader className="bg-muted/30 border-b border-border pb-4">
              <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                {t("returns.details.involved_transaction")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div
                className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border cursor-pointer hover:border-blue-500/50 transition-colors"
                onClick={() => navigate(`/sales/${ret.saleId}`)}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground/60">
                      {t("returns.details.original_invoice")}
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {ret.sale?.invoiceNo}
                    </p>
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-muted-foreground/40 rotate-180" />
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border shrink-0">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5">
                    {t("returns.details.requested_on")}
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {format(new Date(ret.createdAt), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border shrink-0">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-0.5">
                    {t("returns.details.reason_title")}
                  </p>
                  <p className="text-sm font-bold text-foreground uppercase">
                    {ret.reason.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-600/5 border-orange-500/10 overflow-hidden relative active:scale-95 transition-transform cursor-default">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <DollarSign className="w-16 h-16 text-orange-500" />
            </div>
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-1">
                {t("returns.details.total_refund_amount")}
              </p>
              <h2 className="text-4xl font-black text-foreground tracking-tighter">
                ${Number(ret.refundAmount).toLocaleString()}
              </h2>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Processing */}
        <div className="md:col-span-7 space-y-6">
          <Card className="bg-card border-border overflow-hidden shadow-2xl">
            <CardHeader className="bg-muted/30 border-b border-border pb-4">
              <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                {t("returns.details.item_manifest")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center border border-border shrink-0">
                  <Package className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-black text-foreground">
                    {ret.orderItem?.variant?.product?.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-bold uppercase">
                    {ret.orderItem?.variant?.name}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant="outline"
                      className="text-[9px] h-4 px-1 border-border text-muted-foreground font-mono"
                    >
                      {ret.orderItem?.variant?.sku}
                    </Badge>
                    {ret.orderItem?.inventoryItem?.serialNumber && (
                      <Badge
                        variant="outline"
                        className="bg-blue-500/5 text-blue-500 border-blue-500/20 text-[9px] h-4 px-1 font-mono"
                      >
                        SN: {ret.orderItem.inventoryItem.serialNumber}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {isPending ? (
                <div className="mt-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                      {t("returns.details.internal_notes")}
                    </label>
                    <Textarea
                      placeholder={t("returns.details.notes_placeholder")}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[120px] bg-muted border-border rounded-xl text-sm font-medium focus:border-orange-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground/60 mb-1">
                      <ShieldCheck className="w-3 h-3" />
                      {t("returns.details.authorized_actions")}
                    </div>
                    <Button
                      className="h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xl shadow-emerald-900/10"
                      onClick={() => handleProcess("RESTOCKED")}
                      disabled={processMutation.isPending}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {t("returns.details.restock_refund")}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-14 border-border bg-card text-emerald-500 font-black rounded-xl hover:bg-emerald-500/5 hover:border-emerald-500/20"
                      onClick={() => handleProcess("APPROVED")}
                      disabled={processMutation.isPending}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {t("returns.details.approve_no_restock")}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-14 border-border bg-card text-red-500 font-black rounded-xl hover:bg-red-500/5 hover:border-red-500/20 col-span-2"
                      onClick={() => handleProcess("REJECTED")}
                      disabled={processMutation.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {t("returns.details.reject_return")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-8 p-6 rounded-xl bg-muted/20 border border-dashed border-border">
                  <p className="text-[10px] font-black uppercase text-muted-foreground/60 mb-4 tracking-widest text-center">
                    {t("returns.details.processing_history")}
                  </p>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-bold uppercase">
                        {t("returns.details.processed_by")}
                      </span>
                      <span className="text-foreground font-black uppercase">
                        {ret.processedBy?.name || "System Admin"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-bold uppercase">
                        {t("returns.details.resolution_date")}
                      </span>
                      <span className="text-foreground font-black uppercase">
                        {format(new Date(ret.updatedAt), "MMM d, HH:mm")}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="text-muted-foreground font-bold uppercase">
                        {t("returns.details.resolution_notes")}
                      </span>
                      <p className="p-3 rounded-lg bg-muted border border-border text-muted-foreground italic">
                        {ret.notes || t("returns.details.no_notes")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
