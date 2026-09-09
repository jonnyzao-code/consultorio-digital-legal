import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { NormativeService } from './normative.service';

@Controller()
export class NormativeController {
  constructor(private readonly normative: NormativeService) {}

  // --- Normas ---
  @Get('norms')
  listNorms(@Query() q: { area?: string; q?: string; tipo?: string }) {
    return this.normative.listNorms(q);
  }

  @Get('norms/:id')
  async getNorm(@Param('id') id: string) {
    const norm = await this.normative.getNorm(Number(id));
    if (!norm) throw new BadRequestException('Norma no encontrada');
    return norm;
  }

  @Post('norms')
  createNorm(@Body() body: Record<string, any>) {
    return this.normative.createNorm(body);
  }

  // --- Sentencias ---
  @Get('sentencias')
  listSentencias(@Query() q: { area?: string; corte?: string; q?: string }) {
    return this.normative.listSentencias(q);
  }

  @Get('sentencias/:id')
  async getSentencia(@Param('id') id: string) {
    const sentencia = await this.normative.getSentencia(Number(id));
    if (!sentencia) throw new BadRequestException('Sentencia no encontrada');
    return sentencia;
  }

  @Post('sentencias')
  createSentencia(@Body() body: Record<string, any>) {
    return this.normative.createSentencia(body);
  }

  // --- Análisis ---
  @Post('analyze')
  analyze(@Body() body: { text: string }) {
    if (!body?.text?.trim()) {
      throw new BadRequestException('El texto no puede estar vacío');
    }
    return this.normative.analyze(body.text);
  }

  // --- Consultas persistidas ---
  @Get('consultations')
  listConsultations() {
    return this.normative.listConsultations();
  }

  @Get('consultations/:id/analysis')
  getAnalysis(@Param('id') id: string) {
    return this.normative.getAnalysis(Number(id));
  }
}
