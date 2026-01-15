import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { CheckCircle2, Printer, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/shared/ui/badge";

interface SaleSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any;
}

export function SaleSuccessModal({
  isOpen,
  onClose,
  sale,
}: SaleSuccessModalProps) {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border p-0 overflow-hidden">
        <div className="bg-emerald-500 p-6 flex flex-col items-center justify-center text-white text-center">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tighter">
            Transaction Successful
          </h2>
          <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">
            Invoice: {sale.invoiceNo}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Header Info */}
          <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-border pb-4">
            <div>
              <p>Customer</p>
              <p className="text-foreground text-sm mt-1">
                {sale.customerName || "Walking Customer"}
              </p>
            </div>
            <div className="text-right">
              <p>Date</p>
              <p className="text-foreground text-sm mt-1">
                {sale.createdAt
                  ? format(new Date(sale.createdAt), "MMM d, HH:mm")
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              Items Summary
            </p>
            <div className="space-y-2">
              {sale.items?.map((item: any) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start text-xs font-bold"
                >
                  <div className="flex-1">
                    <p className="text-foreground">
                      {item.variant?.product?.name} {item.variant?.name}
                    </p>
                    <p className="text-muted-foreground text-[9px]">
                      {item.quantity} x $
                      {Number(item.sellPrice).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-foreground">
                    ${(item.quantity * Number(item.sellPrice)).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2 pt-4 border-t border-border">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-muted-foreground">Discount</span>
              <span className="text-red-500">
                -${Number(sale.discountAmount || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs font-bold">
              <span className="text-muted-foreground">Tax</span>
              <span className="text-foreground">
                +${Number(sale.taxAmount || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] font-black uppercase text-foreground tracking-widest">
                Amount Paid
              </span>
              <span className="text-2xl font-black text-foreground">
                ${Number(sale.totalAmount).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-center pt-2">
              <Badge
                variant="outline"
                className="border-border text-[9px] font-black uppercase py-0.5"
              >
                Paid via {sale.paymentMethod}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="h-11 border-border font-bold text-xs uppercase"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button
              onClick={onClose}
              className="h-11 bg-foreground text-background font-bold text-xs uppercase"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              New Sale
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
