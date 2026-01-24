import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  // Configuration from environment
  private readonly provider =
    process.env.AI_PROVIDER?.toLowerCase() || 'ollama';
  private readonly ollamaUrl =
    process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
  private readonly ollamaModel = process.env.OLLAMA_MODEL || 'qwen3-coder:30b';
  private readonly geminiKey = process.env.GEMINI_API_KEY;
  private readonly openaiKey = process.env.OPENAI_API_KEY;

  constructor(private readonly httpService: HttpService) {}

  async generate(prompt: string, model?: string, providerOverride?: string) {
    const activeProvider = (providerOverride || this.provider).toLowerCase();

    try {
      switch (activeProvider) {
        case 'gemini':
          return await this.callGemini(prompt, model || 'gemini-1.5-flash');
        case 'openai':
          return await this.callOpenAI(prompt, model || 'gpt-4o-mini');
        case 'ollama':
        default:
          return await this.callOllama(prompt, model || this.ollamaModel);
      }
    } catch (error) {
      this.logger.error(
        `Error generating AI response via ${activeProvider}: ${error.message}`,
      );
      throw error;
    }
  }

  private async callOllama(prompt: string, model: string) {
    const response = await firstValueFrom(
      this.httpService.post(this.ollamaUrl, {
        model,
        prompt,
        stream: false,
      }),
    );
    return response.data.response;
  }

  private async callGemini(prompt: string, model: string) {
    if (!this.geminiKey) throw new Error('GEMINI_API_KEY is not set');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.geminiKey}`;
    const response = await firstValueFrom(
      this.httpService.post(url, {
        contents: [{ parts: [{ text: prompt }] }],
      }),
    );

    return response.data.candidates[0].content.parts[0].text;
  }

  private async callOpenAI(prompt: string, model: string) {
    if (!this.openaiKey) throw new Error('OPENAI_API_KEY is not set');

    const url = 'https://api.openai.com/v1/chat/completions';
    const response = await firstValueFrom(
      this.httpService.post(
        url,
        {
          model,
          messages: [{ role: 'user', content: prompt }],
        },
        {
          headers: {
            Authorization: `Bearer ${this.openaiKey}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return response.data.choices[0].message.content;
  }

  async generateProductDescription(
    productName: string,
    category: string,
    provider?: string,
  ) {
    const prompt = `You are an expert product copywriter for an inventory system. 
    Write a short, professional product description for "${productName}" in the category "${category}".
    
    CRITICAL INSTRUCTIONS:
    1. If this product is not yet released or seems non-existent (like an iPhone version that doesn't exist yet), do NOT make up fake technical specs. Instead, write a professional placeholder description noting it as a specialized or upcoming item in the "${category}" category.
    2. Keep the tone professional and helpful.
    3. Maximum 100 words.`;
    return this.generate(prompt, undefined, provider);
  }

  async analyzeSalesSummary(salesData: string, provider?: string) {
    const prompt = `Analyze the following sales data and provide a 3-bullet point summary of trends and insights: \n${salesData}`;
    return this.generate(prompt, undefined, provider);
  }

  async generateProductVariants(
    productName: string,
    category: string,
    provider?: string,
  ) {
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

    const response = await this.generate(prompt, undefined, provider);
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

  async analyzeDashboard(data: any, provider?: string) {
    const prompt = `You are a business consultant for a retail store. Analyze the following daily dashboard data and provide 3-4 concise, professional, and actionable insights for the business owner.
    
    Data:
    - Today's Revenue: $${data.todayRevenue}
    - Today's Orders: ${data.todayOrders}
    - Low Stock Items: ${data.lowStockItems?.length || 0}
    - Pending Returns: ${data.pendingReturns}
    - Recent Sales Summary: ${JSON.stringify(data.recentSales?.slice(0, 3))}
    
    Format your response as a bulleted list of insights. FOCUS on trends, risks (like low stock), and opportunities. Be specific and encouraging. Keep it under 150 words.`;

    return this.generate(prompt, undefined, provider);
  }
}
