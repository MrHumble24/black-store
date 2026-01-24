import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

import { format } from "date-fns";

// Register a professional font if needed, or use defaults
// For simplicity, we'll use Helvetica which is standard in PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#262626",
  },
  header: {
    marginBottom: 20,
    borderBottom: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  title: {
    fontSize: 24,
    fontWeight: "black",
    color: "#000",
    letterSpacing: -1,
  },
  invoiceInfo: {
    textAlign: "right",
  },
  invoiceNo: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 2,
  },
  date: {
    fontSize: 9,
    color: "#737373",
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#737373",
    letterSpacing: 1,
    marginBottom: 8,
  },
  customerBox: {
    backgroundColor: "#f9fafb",
    padding: 10,
    borderRadius: 4,
  },
  customerName: {
    fontSize: 11,
    fontWeight: "bold",
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: 1,
    borderBottomColor: "#000",
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: 1,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 6,
    alignItems: "center",
  },
  colDesc: { flex: 7 },
  colQty: { flex: 1, textAlign: "center" },
  colPrice: { flex: 2, textAlign: "right" },
  colTotal: { flex: 2, textAlign: "right" },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#737373",
  },
  productName: {
    fontSize: 10,
    fontWeight: "bold",
  },
  variantName: {
    fontSize: 8,
    color: "#737373",
    marginTop: 1,
  },
  technicalDetail: {
    fontSize: 7,
    marginTop: 2,
    color: "#404040",
    fontFamily: "Helvetica-Bold",
  },

  totalsSection: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 150,
    marginBottom: 4,
  },
  totalLabel: {
    color: "#737373",
  },
  totalValue: {
    fontWeight: "bold",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 150,
    marginTop: 8,
    paddingTop: 8,
    borderTop: 1,
    borderTopColor: "#000",
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: "black",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    borderTop: 1,
    borderTopColor: "#e5e5e5",
    paddingTop: 10,
    color: "#a3a3a3",
    fontSize: 8,
  },
  badge: {
    backgroundColor: "#ecfdf5",
    color: "#059669",
    padding: "2 6",
    borderRadius: 10,
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginTop: 4,
  },
});

interface ProfessionalReceiptProps {
  sale: any;
}

export const ProfessionalReceipt = ({ sale }: ProfessionalReceiptProps) => {
  if (!sale) return null;

  const items = sale.items || [];
  const subtotal = items.reduce(
    (acc: number, item: any) => acc + item.quantity * Number(item.sellPrice),
    0,
  );

  return (
    <Document title={`Invoice-${sale.invoiceNo}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>BLACK STORE</Text>
            <Text style={{ fontSize: 9, color: "#737373", marginTop: 2 }}>
              PREMIUM TECH & LIFESTYLE
            </Text>
          </View>
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceNo}>INVOICE #{sale.invoiceNo}</Text>
            <Text style={styles.date}>
              {format(new Date(sale.createdAt), "MMMM d, yyyy HH:mm")}
            </Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.badge}>{sale.paymentMethod || "PAID"}</Text>
            </View>
          </View>
        </View>

        {/* Customer & Authority */}
        <View style={{ flexDirection: "row", gap: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Billed To</Text>
            <View style={styles.customerBox}>
              <Text style={styles.customerName}>
                {sale.customerName || "Walking Customer"}
              </Text>
              {sale.customerPhone && (
                <Text style={{ fontSize: 9, color: "#404040", marginTop: 2 }}>
                  Phone: {sale.customerPhone}
                </Text>
              )}
              <Text style={{ fontSize: 8, color: "#737373", marginTop: 2 }}>
                Customer Account
              </Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Issuer</Text>
            <View style={{ padding: 10 }}>
              <Text style={{ fontSize: 10, fontWeight: "bold" }}>
                {sale.user?.name || "System Staff"}
              </Text>
              <Text style={{ fontSize: 8, color: "#737373" }}>
                Authorized Agent
              </Text>
            </View>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>Price</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
          </View>

          {items.map((item: any, idx: number) => (
            <View key={idx} style={styles.tableRow}>
              <View style={styles.colDesc}>
                <Text style={styles.productName}>
                  {item.variant?.product?.name}
                </Text>
                <Text style={styles.variantName}>
                  {item.variant?.name || "Standard Variant"}
                  {item.variant?.modelCode
                    ? ` | ${item.variant.modelCode}`
                    : ""}
                </Text>
                {(item.serialNumber || item.inventoryItem?.serialNumber) && (
                  <Text style={styles.technicalDetail}>
                    S/N: {item.serialNumber || item.inventoryItem?.serialNumber}
                  </Text>
                )}
              </View>

              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>
                ${Number(item.sellPrice).toLocaleString()}
              </Text>
              <Text style={styles.colTotal}>
                ${(item.quantity * Number(item.sellPrice)).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${subtotal.toLocaleString()}</Text>
          </View>

          {Number(sale.discountAmount) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={[styles.totalValue, { color: "#ef4444" }]}>
                -${Number(sale.discountAmount).toLocaleString()}
              </Text>
            </View>
          )}

          {Number(sale.taxAmount) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax (Included)</Text>
              <Text style={styles.totalValue}>
                +${Number(sale.taxAmount).toLocaleString()}
              </Text>
            </View>
          )}

          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>
              ${Number(sale.totalAmount).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for shopping at BLACK STORE.</Text>
          <Text style={{ marginTop: 2 }}>
            This is a computer-generated invoice and does not require a
            signature.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
