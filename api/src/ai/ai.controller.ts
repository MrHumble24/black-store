import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AiService } from './ai.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate text using AI model' })
  async generate(
    @Body() body: { prompt: string; model?: string; provider?: string },
  ) {
    return {
      response: await this.aiService.generate(
        body.prompt,
        body.model,
        body.provider,
      ),
    };
  }

  @Post('product-description')
  @ApiOperation({ summary: 'Generate product description' })
  async generateProductDescription(
    @Body() body: { productName: string; category: string; provider?: string },
  ) {
    return {
      description: await this.aiService.generateProductDescription(
        body.productName,
        body.category,
        body.provider,
      ),
    };
  }

  @Post('product-variants')
  @ApiOperation({ summary: 'Generate product variants' })
  async generateProductVariants(
    @Body() body: { productName: string; category: string; provider?: string },
  ) {
    return {
      variants: await this.aiService.generateProductVariants(
        body.productName,
        body.category,
        body.provider,
      ),
    };
  }

  @Post('analyze-dashboard')
  @ApiOperation({ summary: 'Analyze dashboard data' })
  async analyzeDashboard(@Body() body: { data: any; provider?: string }) {
    return {
      analysis: await this.aiService.analyzeDashboard(body.data, body.provider),
    };
  }
}
