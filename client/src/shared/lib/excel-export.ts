import * as XLSX from "xlsx";

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExcelExportOptions {
  filename: string;
  sheetName?: string;
  columns: ExcelColumn[];
  data: any[];
}

/**
 * Exports data to an Excel file
 * @param options - Export configuration options
 */
export function exportToExcel(options: ExcelExportOptions): void {
  const { filename, sheetName = "Sheet1", columns, data } = options;

  // Prepare the data for Excel
  const excelData = data.map((row) => {
    const excelRow: any = {};
    columns.forEach((col) => {
      // Support nested properties using dot notation (e.g., "brand.name")
      const keys = col.key.split(".");
      let value = row;
      for (const key of keys) {
        value = value?.[key];
      }
      excelRow[col.header] = value ?? "";
    });
    return excelRow;
  });

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths if specified
  const columnWidths = columns.map((col) => ({
    wch: col.width || 15,
  }));
  worksheet["!cols"] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate file and trigger download
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // Create download link
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
