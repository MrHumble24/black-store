import { format } from "date-fns";
import React from "react";

interface ReceiptProps {
  sale: any;
}

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(
  ({ sale }, ref) => {
    if (!sale) return null;

    const items = sale.items || [];
    const subtotal = items.reduce(
      (acc: number, item: any) => acc + item.quantity * Number(item.sellPrice),
      0,
    );

    return (
      <div
        ref={ref}
        className="w-[80mm] p-4 bg-white text-black font-mono text-[10px] space-y-4"
        style={{
          backgroundColor: "white",
          color: "black",
        }}
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-sm font-bold uppercase tracking-tight">
            BLACK STORE
          </h1>
          <p className="text-[8px] uppercase">Official Receipt</p>
          <div className="border-t border-b border-black border-dashed py-1 my-2">
            <p className="flex justify-between">
              <span>Invoice:</span>
              <span className="font-bold">{sale.invoiceNo}</span>
            </p>
            <p className="flex justify-between">
              <span>Date:</span>
              <span>
                {format(new Date(sale.createdAt), "MMM d, yyyy HH:mm")}
              </span>
            </p>
            <p className="flex justify-between">
              <span>Customer:</span>
              <span className="truncate max-w-[40mm]">
                {sale.customerName || "Walking Customer"}
              </span>
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-1">
          <div className="grid grid-cols-12 font-bold border-b border-black border-dashed pb-1 mb-1">
            <span className="col-span-6 uppercase">Item</span>
            <span className="col-span-2 text-center uppercase">Qty</span>
            <span className="col-span-4 text-right uppercase">Total</span>
          </div>
          {items.map((item: any, idx: number) => (
            <div key={idx} className="grid grid-cols-12 gap-x-1">
              <div className="col-span-12">
                <p className="font-bold">
                  {item.variant?.product?.name} {item.variant?.name}
                </p>
              </div>
              <div className="col-span-6 pl-2">
                @ ${Number(item.sellPrice).toLocaleString()}
              </div>
              <div className="col-span-2 text-center">{item.quantity}</div>
              <div className="col-span-4 text-right">
                ${(item.quantity * Number(item.sellPrice)).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-1 border-t border-black border-dashed pt-2">
          <div className="flex justify-between">
            <span className="uppercase">Subtotal:</span>
            <span>${subtotal.toLocaleString()}</span>
          </div>
          {Number(sale.discountAmount) > 0 && (
            <div className="flex justify-between">
              <span className="uppercase">Discount:</span>
              <span>-${Number(sale.discountAmount).toLocaleString()}</span>
            </div>
          )}
          {Number(sale.taxAmount) > 0 && (
            <div className="flex justify-between">
              <span className="uppercase">Tax:</span>
              <span>+${Number(sale.taxAmount).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold border-t border-black border-double pt-1 mt-1">
            <span className="uppercase tracking-tighter">Grand Total:</span>
            <span>${Number(sale.totalAmount).toLocaleString()}</span>
          </div>
        </div>

        {/* Payment */}
        <div className="text-center pt-2 space-y-1">
          <p className="uppercase text-[8px]">
            Paid via {sale.paymentMethod || "CASH"}
          </p>
          <div className="border-t border-black border-dashed pt-2 mt-4">
            <p className="uppercase font-bold">Thank you for your business!</p>
            <p className="text-[8px] mt-1">
              Please keep this receipt for returns
            </p>
          </div>
        </div>
      </div>
    );
  },
);

Receipt.displayName = "Receipt";
