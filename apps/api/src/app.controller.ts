import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  index() {
    return {
      name: 'Consultorio Digital Legal — API',
      endpoints: {
        health: 'GET /health',
        classify: 'POST /classify',
        analyze: 'POST /analyze',
        norms: 'GET /norms',
        sentencias: 'GET /sentencias',
        documents: 'POST /documents/:type',
        consultations: 'GET /consultations',
      },
    };
  }

  @Get('health')
  health() {
    return { status: 'ok', service: 'api' };
  }

  @Post('classify')
  classify(@Body() body: { text: string }) {
    return this.appService.classify(body.text);
  }

  @Post('documents/:type')
  generate(@Param('type') type: string, @Body() fields: Record<string, unknown>) {
    return this.appService.generateDocument(type, fields);
  }
}
