import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { CreateReturnDto, UpdateReturnDto } from './dto/return.dto';

@Controller('returns')
export class ReturnsController {
  constructor(private readonly service: ReturnsService) {}

  @Post()
  create(@Body() dto: CreateReturnDto, @Request() req: any) {
    return this.service.create(dto, req.user.sub);
  }

  @Get()
  findAll(@Query('status') status?: string) {
    return this.service.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id/process')
  process(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReturnDto,
    @Request() req: any,
  ) {
    return this.service.process(id, dto, req.user.sub);
  }
}
