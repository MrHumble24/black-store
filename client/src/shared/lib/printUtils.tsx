import { pdf } from "@react-pdf/renderer";
import { ProfessionalReceipt } from "../ui/ProfessionalReceipt";

/**
 * Utility to generate and print a professional PDF receipt.
 * Uses @react-pdf/renderer to create a high-quality PDF BLOB and then prints it.
 */
export const printReceipt = async (sale: any) => {
  if (!sale) return;

  try {
    // Generate the PDF as a Blob
    const blob = await pdf(<ProfessionalReceipt sale={sale} />).toBlob();
    const url = URL.createObjectURL(blob);

    // Create a hidden iframe to print the PDF
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      // Cleanup after printing
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 1000);
    };
  } catch (error) {
    console.error("Failed to generate PDF receipt:", error);
    // Fallback to basic window print if PDF fails
    window.print();
  }
};
