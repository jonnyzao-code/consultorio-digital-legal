import { Injectable, Logger } from '@nestjs/common';
import { callIA } from './ia.client';
import { query } from './db';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  async classify(text: string) {
    const result = await callIA('/classify', { text });
    this.persistConsultation(text, result).catch((e) =>
      this.logger.warn(`DB no disponible para persistir consulta: ${e.message}`),
    );
    return result;
  }

  async generateDocument(type: string, fields: Record<string, unknown>) {
    let result;
    if (type === 'tutela') result = await callIA('/documents/tutela', fields);
    else if (type === 'derecho-peticion') {
      result = await callIA('/documents/derecho-peticion', fields);
    } else {
      throw new Error(`Tipo de documento no soportado: ${type}`);
    }
    this.persistDocument(type, fields, result).catch((e) =>
      this.logger.warn(`DB no disponible para persistir documento: ${e.message}`),
    );
    return result;
  }

  private async persistConsultation(text: string, result: any) {
    await query(
      `INSERT INTO consultations (text, area_code, confidence, needs_review) VALUES ($1,$2,$3,$4)`,
      [text, result.area, result.confidence, result.needs_review],
    );
  }

  private async persistDocument(type: string, fields: any, result: any) {
    await query(
      `INSERT INTO documents (tipo, fields, content) VALUES ($1,$2,$3)`,
      [type, JSON.stringify(fields), result.content],
    );
  }
}
