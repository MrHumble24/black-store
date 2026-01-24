import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Printer, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/shared/ui/badge";
import { printReceipt } from "@/shared/lib/printUtils";

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
  const { t } = useTranslation();
  if (!sale) return null;

  const handlePrint = () => {
    printReceipt(sale);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] bg-card border-none p-0 overflow-hidden shadow-2xl rounded-3xl">
        {/* Success Header */}
        <div className="bg-linear-to-br from-emerald-500 to-emerald-600 p-8 flex flex-col items-center justify-center text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-size-[16px_16px]" />
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 shadow-inner ring-4 ring-white/10">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            {t("pos.payment_success")}
          </h2>
          <p className="text-emerald-100 font-medium text-sm">
            {t("pos.invoice")} {sale.invoiceNo}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-2xl bg-muted/50">
              <p className="text-xs text-muted-foreground font-medium mb-1">
                {t("pos.customer")}
              </p>
              <p className="font-semibold text-sm truncate">
                {sale.customerName || t("pos.walking_customer")}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-muted/50">
              <p className="text-xs text-muted-foreground font-medium mb-1">
                {t("pos.date_time")}
              </p>
              <p className="font-semibold text-sm">
                {sale.createdAt
                  ? format(new Date(sale.createdAt), "MMM d, h:mm a")
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Items Summary */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("pos.order_summary")}
              </span>
            </div>
            <div className="space-y-3 pl-2 border-l-2 border-muted">
              {sale.items?.map((item: any) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start text-sm"
                >
                  <div className="flex-1 pr-4">
                    <p className="font-medium text-foreground">
                      {item.variant?.product?.name}
                      <span className="text-muted-foreground font-normal ml-1">
                        {item.variant?.name}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} × $
                      {Number(item.sellPrice).toLocaleString()}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums">
                    ${(item.quantity * Number(item.sellPrice)).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-muted/30 p-4 rounded-2xl space-y-2 border border-border/50">
            {(sale.discountAmount > 0 || sale.taxAmount > 0) && (
              <>
                {sale.discountAmount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {t("pos.discount")}
                    </span>
                    <span className="text-red-500 font-medium">
                      -{Number(sale.discountAmount).toLocaleString()}
                    </span>
                  </div>
                )}
                {sale.taxAmount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {t("pos.tax")}
                    </span>
                    <span className="font-medium">
                      +{Number(sale.taxAmount).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="h-px bg-border/50 my-2" />
              </>
            )}

            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-0.5">
                  {t("pos.total_paid")}
                </p>
                <Badge
                  variant="secondary"
                  className="font-mono text-[10px] uppercase font-bold tracking-wider rounded-md px-1.5 h-5"
                >
                  {t(`pos.payment_${sale.paymentMethod?.toLowerCase()}`)}
                </Badge>
              </div>
              <span className="text-2xl font-bold text-foreground tabular-nums">
                ${Number(sale.totalAmount).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="h-12 rounded-xl text-foreground font-semibold border-2 hover:bg-muted"
            >
              <Printer className="w-4 h-4 mr-2" />
              {t("pos.print")}
            </Button>
            <Button
              onClick={onClose}
              className="h-12 rounded-xl bg-foreground text-background font-semibold hover:bg-foreground/90 shadow-lg"
            >
              {t("pos.start_new")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
