import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly ollamaUrl = 'http://localhost:11434/api/generate';
  private readonly defaultModel = 'qwen3-coder:30b';

  constructor(private readonly httpService: HttpService) {}

  async generate(prompt: string, model: string = this.defaultModel) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(this.ollamaUrl, {
          model,
          prompt,
          stream: false,
        }),
      );
      return response.data.response;
    } catch (error) {
      this.logger.error(`Error generating AI response: ${error.message}`);
      throw error;
    }
  }

  async generateProductDescription(productName: string, category: string) {
    const prompt = `You are an expert product copywriter for an inventory system. 
    Write a short, professional product description for "${productName}" in the category "${category}".
    
    CRITICAL INSTRUCTIONS:
    1. If this product is not yet released or seems non-existent (like an iPhone version that doesn't exist yet), do NOT make up fake technical specs. Instead, write a professional placeholder description noting it as a specialized or upcoming item in the "${category}" category.
    2. Keep the tone professional and helpful.
    3. Maximum 100 words.`;
    return this.generate(prompt);
  }

  async analyzeSalesSummary(salesData: string) {
    const prompt = `Analyze the following sales data and provide a 3-bullet point summary of trends and insights: \n${salesData}`;
    return this.generate(prompt);
  }

  async generateProductVariants(productName: string, category: string) {
    const prompt = `Generate a comprehensive list of 5-8 common product variants for a "${productName}" in the category "${category}". 
    
    Make sure to include a good mix of variations (e.g., all standard colors, different storage sizes, or regional versions).
    
    Return ONLY a JSON array of objects. Each object must have:
    - name: (string) A concise name for the variant (e.g., "iPhone 15 Pro - 128GB - Space Black").
    - specs: (object) A key-value pair of specifications (e.g., {"Storage": "128GB", "Color": "Space Black", "Region": "Global"}).
    
    Example output format:
    [
      {"name": "128GB Black", "specs": {"Storage": "128GB", "Color": "Black"}},
      {"name": "256GB Silver", "specs": {"Storage": "256GB", "Color": "Silver"}}
    ]
    
    Respond ONLY with the JSON array, no other text.`;

    const response = await this.generate(prompt);
    // Try to extract JSON if the model included conversational text
    try {
      const jsonMatch = response.match(/\[.*\]/s);
      const jsonStr = jsonMatch ? jsonMatch[0] : response;
      return JSON.parse(jsonStr);
    } catch (error) {
      this.logger.error(`Failed to parse AI variant response: ${response}`);
      throw new Error('AI returned invalid format for variants');
    }
  }

  async analyzeDashboard(data: any) {
    const prompt = `You are a business consultant for a retail store. Analyze the following daily dashboard data and provide 3-4 concise, professional, and actionable insights for the business owner.
    
    Data:
    - Today's Revenue: $${data.todayRevenue}
    - Today's Orders: ${data.todayOrders}
    - Low Stock Items: ${data.lowStockItems?.length || 0}
    - Pending Returns: ${data.pendingReturns}
    - Recent Sales Summary: ${JSON.stringify(data.recentSales?.slice(0, 3))}
    
    Format your response as a bulleted list of insights. FOCUS on trends, risks (like low stock), and opportunities. Be specific and encouraging. Keep it under 150 words.`;

    return this.generate(prompt);
  }
}
