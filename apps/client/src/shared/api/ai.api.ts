import api from "./api";

export const aiApi = {
  generate: (prompt: string, model?: string) =>
    api.post<{ response: string }>("/ai/generate", { prompt, model }),

  generateProductDescription: (productName: string, category: string) =>
    api.post<{ description: string }>("/ai/product-description", {
      productName,
      category,
    }),

  generateProductVariants: (productName: string, category: string) =>
    api.post<{
      variants: {
        name: string;
        specs: Record<string, string>;
        sellPrice: number;
      }[];
    }>("/ai/product-variants", {
      productName,
      category,
    }),

  analyzeSales: (salesData: string) =>
    api.post<{ analysis: string }>("/ai/analyze-sales", { salesData }),

  analyzeDashboard: (data: any) =>
    api.post<{ analysis: string }>("/ai/analyze-dashboard", { data }),
};
