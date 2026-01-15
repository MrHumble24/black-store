import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import {
  ArrowLeft,
  Calendar,
  User,
  Package,
  Printer,
  DollarSign,
  Loader2,
  Clock,
  ShieldCheck,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { format } from "date-fns";
import { Separator } from "@/shared/ui/separator";

export default function SaleDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: sale, isLoading } = salesQueries.useOne(Number(id));

  // Return state
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [returnReason, setReturnReason] = useState<ReturnReason>("DEFECTIVE");
  const [refundAmount, setRefundAmount] = useState<string>("0");
  const [returnNotes, setReturnNotes] = useState("");

  const createReturnMutation = returnQueries.useCreate();

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
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
          Loading Invoice...
        </p>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="p-20 text-center">
        <h2 className="text-white font-bold text-xl mb-4">Sale not found</h2>
        <Button onClick={() => navigate("/sales")}>Back to Sales</Button>
      </div>
    );
  }

  return (
    <div className=" mx-auto space-y-8 pb-12">
      {/* Premium Header */}
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
                Completed
              </Badge>
              <p className="text-[10px] text-muted-foreground font-mono font-bold">
                {sale.invoiceNo}
              </p>
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              Sale Transaction
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-border bg-card text-muted-foreground hover:text-foreground"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Summary & Manifest */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Info Card */}
          <Card className="bg-card border-border overflow-hidden shadow-2xl">
            <div className="h-1.5 bg-linear-to-r from-blue-600 to-indigo-600" />
            <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Issue Date
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
                  Issue Time
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
                  Total Items
                </p>
                <div className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-blue-500" />
                  <p className="text-sm font-bold text-foreground">
                    {sale.items?.length || 0} Products
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Grand Total
                </p>
                <div className="flex items-center gap-2 text-foreground">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <p className="text-lg font-black tracking-tighter">
                    ${Number(sale.totalAmount).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Purchased Items List */}
          <Card className="bg-card border-border overflow-hidden shadow-2xl">
            <CardHeader className="p-6 border-b border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                  Itemized Manifest
                </CardTitle>
                <Badge
                  variant="outline"
                  className="bg-muted border-border text-[10px] font-bold"
                >
                  Verified Stock {sale.items?.length} units
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {sale.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center group-hover:bg-blue-600/10 group-hover:border-blue-500/20 transition-all">
                        <Package className="w-6 h-6 text-muted-foreground group-hover:text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-foreground font-bold text-base truncate">
                          {item.variant?.product?.name || "Product"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-muted-foreground text-xs font-medium">
                            {item.variant?.name || "Standard Variant"}
                          </p>
                          {item.serialNumber && (
                            <Badge className="bg-blue-600/10 text-blue-500 border-blue-500/10 text-[9px] font-mono h-4">
                              SN: {item.serialNumber}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-foreground font-black text-lg tracking-tight">
                          $
                          {(
                            Number(item.sellPrice) * item.quantity
                          ).toLocaleString()}
                        </p>
                        <p className="text-muted-foreground text-[10px] font-bold uppercase">
                          {item.quantity} units @ $
                          {Number(item.sellPrice).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenReturn(item)}
                        className="text-muted-foreground/50 hover:text-orange-500 hover:bg-orange-500/10 rounded-xl transition-all"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Customer & Transaction Details */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-card border-border overflow-hidden shadow-2xl">
            <div className="p-6 space-y-8">
              {/* Customer Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Customer Details
                  </h4>
                </div>
                <div className="flex items-center gap-3 bg-muted/50 p-4 rounded-2xl border border-border">
                  <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center text-[10px] font-black text-blue-500 border border-blue-500/10">
                    {sale.customerName?.charAt(0) || "WC"}
                  </div>
                  <div>
                    <p className="text-foreground font-bold text-sm">
                      {sale.customerName || "Walking Customer"}
                    </p>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-tighter">
                      Customer Profile ID: 002
                    </p>
                  </div>
                </div>
              </div>

              {/* Sales Agent Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Transaction Authority
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
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                      {(sale.user as any)?.role || "Store Admin"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="bg-border" />

              {/* Payment Summary */}
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-muted-foreground text-xs font-bold uppercase">
                    Subtotal
                  </span>
                  <span className="text-foreground font-mono text-sm">
                    ${Number(sale.totalAmount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center px-1">
                  <span className="text-muted-foreground text-xs font-bold uppercase">
                    Tax (0%)
                  </span>
                  <span className="text-foreground font-mono text-sm">
                    $0.00
                  </span>
                </div>
                <div className="bg-blue-600/10 p-4 rounded-2xl border border-blue-500/20 flex justify-between items-center">
                  <span className="text-blue-400 text-sm font-black uppercase">
                    Paid
                  </span>
                  <span className="text-foreground text-xl font-black">
                    ${Number(sale.totalAmount).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-2">
                <Button className="w-full bg-foreground hover:bg-muted text-background h-12 font-black rounded-xl transition-all shadow-xl shadow-foreground/5 active:scale-95">
                  Download PDF
                </Button>
                <Button
                  variant="ghost"
                  className="w-full h-10 text-muted-foreground hover:text-red-500 font-bold text-[10px] uppercase tracking-widest"
                >
                  Void Transaction
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Return Dialog */}
      <Dialog
        open={!!selectedItem}
        onOpenChange={(open) => !open && setSelectedItem(null)}
      >
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground italic uppercase tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-orange-500" />
              Initialize Return
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs font-medium">
              Request a refund for{" "}
              <span className="text-foreground font-bold">
                {selectedItem?.variant?.product?.name}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                Reason for Return
              </label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value as any)}
                className="w-full h-10 bg-muted border-border rounded-lg px-3 text-sm font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="DEFECTIVE">DEFECTIVE ITEM</option>
                <option value="WRONG_ITEM">WRONG ITEM DELIVERED</option>
                <option value="CUSTOMER_CHANGE_MIND">
                  CUSTOMER CHANGED MIND
                </option>
                <option value="WARRANTY_CLAIM">WARRANTY CLAIM</option>
                <option value="OTHER">OTHER REASON</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                Refund Amount ($)
              </label>
              <Input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="h-10 bg-muted border-border text-sm font-black text-emerald-500"
              />
              <p className="text-[9px] text-muted-foreground/60 font-bold uppercase italic">
                MAX REFUND: ${selectedItem?.sellPrice}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                Additional Notes
              </label>
              <Textarea
                placeholder="Describe the issue..."
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                className="min-h-[80px] bg-muted border-border text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedItem(null)}
              className="border-border bg-card text-muted-foreground font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateReturn}
              disabled={createReturnMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white font-black shadow-lg shadow-orange-900/20"
            >
              {createReturnMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              SUBMIT REQUEST
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
