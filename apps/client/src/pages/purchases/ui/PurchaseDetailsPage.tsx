import { useNavigate, useParams } from "react-router-dom";
import { purchaseQueries } from "@/entities/purchase";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import {
  ArrowLeft,
  Calendar,
  User,
  Printer,
  DollarSign,
  Loader2,
  ShieldCheck,
  Truck,
  Hash,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { format } from "date-fns";
import { Separator } from "@/shared/ui/separator";

export default function PurchaseDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: purchase, isLoading } = purchaseQueries.useOne(Number(id));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
          Fetching supplier invoice...
        </p>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
          <Truck className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
          Invoice Not Found
        </h2>
        <p className="text-muted-foreground/60 text-sm max-w-xs">
          The purchase record you are looking for might have been archived or
          deleted.
        </p>
        <Button
          onClick={() => navigate("/purchases")}
          variant="outline"
          className="mt-2 border-border bg-card text-muted-foreground"
        >
          Back to Purchases
        </Button>
      </div>
    );
  }

  return (
    <div className=" mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/purchases")}
            className="rounded-xl border-border bg-card text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-foreground tracking-tight uppercase italic">
                Purchase Invoice
              </h1>
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/5 text-emerald-500 uppercase tracking-widest text-[10px] h-5 font-black"
              >
                Processed
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground/60 font-bold tracking-widest uppercase">
              TXN ID: #{purchase.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-border bg-card text-muted-foreground hover:text-foreground"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Record
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Summary Info */}
        <div className="md:col-span-1 space-y-6">
          <Card className="bg-card border-border overflow-hidden shadow-2xl">
            <CardHeader className="bg-muted/30 border-b border-border pb-4">
              <CardTitle className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest">
                General Info
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-lg bg-emerald-600/10 flex items-center justify-center border border-emerald-500/10 shrink-0">
                  <Truck className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-0.5">
                    Supplier
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {purchase.provider?.name || "Unknown"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center border border-blue-500/10 shrink-0">
                  <Hash className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-0.5">
                    Reference No.
                  </p>
                  <p className="text-sm font-mono text-foreground uppercase">
                    {purchase.referenceNo || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border shrink-0">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-0.5">
                    Entry Date
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {format(new Date(purchase.createdAt), "MMMM d, yyyy")}
                  </p>
                  <p className="text-[10px] text-muted-foreground/40 font-bold uppercase mt-0.5">
                    {format(new Date(purchase.createdAt), "HH:mm:ss")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border shrink-0">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-0.5">
                    Receiver
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {purchase.user?.name || "System Admin"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-emerald-600/5 border-emerald-500/10 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign className="w-16 h-16 text-emerald-500" />
            </div>
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">
                Total Amount Paid
              </p>
              <h2 className="text-4xl font-black text-foreground tracking-tighter">
                ${Number(purchase.totalCost).toLocaleString()}
              </h2>
              <div className="flex items-center gap-1.5 mt-2 text-emerald-500/60 uppercase text-[10px] font-black">
                <ShieldCheck className="w-3.5 h-3.5" />
                Stock Balance Updated
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Item Breakdown */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-card border-border overflow-hidden shadow-2xl">
            <CardHeader className="bg-muted/30 border-b border-border pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest">
                  Item Manifest
                </CardTitle>
              </div>
              <Badge
                variant="outline"
                className="text-[9px] h-5 px-2 border-border text-muted-foreground/60 uppercase font-black"
              >
                {purchase.items?.length || 0} ITEMS
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-muted/20 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground/40 tracking-wider">
                        Product Description
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground/40 tracking-wider">
                        Unit Cost
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground/40 tracking-wider">
                        Qty
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground/40 tracking-wider text-right">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {purchase.items?.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/20 group">
                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-foreground group-hover:text-emerald-400 transition-colors">
                              {item.variant?.product?.name || "Product"}{" "}
                              {item.variant?.name || "Variant"}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-[9px] h-4 px-1 border-border text-muted-foreground/40 font-mono uppercase"
                              >
                                {item.variant?.sku || "SKU-N/A"}
                              </Badge>
                              {item.serialNumber && (
                                <Badge
                                  variant="outline"
                                  className="bg-blue-500/5 text-blue-500 border-blue-500/20 text-[9px] h-4 px-1 font-mono uppercase"
                                >
                                  SN: {item.serialNumber}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm font-medium text-muted-foreground/60">
                          ${Number(item.costPrice).toLocaleString()}
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm font-black text-foreground">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right font-black text-foreground">
                          $
                          {(
                            Number(item.costPrice) * item.quantity
                          ).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-8 border-t border-border bg-muted/10">
                <div className="max-w-[200px] ml-auto space-y-3">
                  <div className="flex justify-between items-center text-muted-foreground/60 text-xs">
                    <span className="font-bold uppercase tracking-widest text-[10px]">
                      Subtotal Cost
                    </span>
                    <span className="font-black text-foreground/80">
                      ${Number(purchase.totalCost).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground/60 text-xs">
                    <span className="font-bold uppercase tracking-widest text-[10px]">
                      Taxes (0%)
                    </span>
                    <span className="font-black text-foreground/80">$0.00</span>
                  </div>
                  <Separator className="bg-border" />
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                      Grand Total
                    </span>
                    <span className="text-xl font-black text-foreground tracking-tighter">
                      ${Number(purchase.totalCost).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border border-dashed border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-500/10 shrink-0">
                  <WarehouseIcon className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-0.5">
                    Storage Location
                  </p>
                  <p className="text-sm font-bold text-foreground uppercase italic">
                    These items were registered to the main inventory system.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
