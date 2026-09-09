import { Injectable } from '@nestjs/common';
import { query } from './db';
import { callIA } from './ia.client';

// Palabras clave por rama para emparejar artículos constitucionales transversales.
const AREA_KEYWORDS: Record<string, string[]> = {
  penal: ['penal', 'debido proceso', 'delito', 'fiscalia', 'denuncia', 'acusacion', 'investigacion'],
  laboral: ['trabajo', 'laboral', 'seguridad social', 'pension', 'salario'],
  familia: ['familia', 'menores', 'hijos', 'alimentos', 'custodia'],
  civil: ['civil', 'contrato', 'propiedad', 'obligaciones', 'responsabilidad civil'],
  administrativo: ['administrativo', 'tutela', 'peticion', 'salud', 'eps', 'servicio publico', 'constitucional'],
  comercial: ['comercial', 'consumidor', 'comercio', 'sociedad'],
  otro: ['constitucional', 'dignidad', 'igualdad', 'estado social de derecho'],
};

const ANALYSIS_DISCLAIMER =
  'Análisis normativo orientativo generado automáticamente. No constituye asesoría jurídica ' +
  'ni sustituye la revisión de un abogado. Verifique siempre el texto vigente en la fuente oficial.';

@Injectable()
export class NormativeService {
  // --- Normas ---
  async listNorms(filters: { area?: string; q?: string; tipo?: string }) {
    const where: string[] = [];
    const params: unknown[] = [];
    if (filters.area) {
      params.push(filters.area);
      where.push(`area_code = $${params.length}`);
    }
    if (filters.tipo) {
      params.push(filters.tipo);
      where.push(`tipo = $${params.length}`);
    }
    if (filters.q) {
      params.push(`%${filters.q}%`);
      where.push(`(nombre ILIKE $${params.length} OR epigrafe ILIKE $${params.length} OR tema ILIKE $${params.length})`);
    }
    const sql =
      `SELECT id, tipo, numero, anio, slug, nombre, epigrafe, tema, area_code, vigencia, fuente_url FROM norms` +
      (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
      ` ORDER BY (area_code IS NULL), tipo, anio, numero`;
    const { rows } = await query(sql, params);
    return rows;
  }

  async getNorm(id: number) {
    const { rows } = await query(`SELECT * FROM norms WHERE id = $1`, [id]);
    if (!rows.length) return null;
    const norm = rows[0];
    const arts = await query(
      `SELECT id, numero, titulo, texto, tema FROM norm_articles WHERE norm_id = $1 ORDER BY numero`,
      [id],
    );
    return { ...norm, articles: arts.rows };
  }

  async createNorm(body: any) {
    const { tipo, numero, anio, slug, nombre, epigrafe, tema, area_code, fuente_url } = body;
    if (!tipo || !slug || !nombre) {
      throw new Error('Campos requeridos: tipo, slug, nombre');
    }
    const { rows } = await query(
      `INSERT INTO norms (tipo, numero, anio, slug, nombre, epigrafe, tema, area_code, fuente_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [tipo, numero ?? null, anio ?? null, slug, nombre, epigrafe ?? null, tema ?? null, area_code ?? null, fuente_url ?? null],
    );
    return rows[0];
  }

  // --- Sentencias ---
  async listSentencias(filters: { area?: string; corte?: string; q?: string }) {
    const where: string[] = [];
    const params: unknown[] = [];
    if (filters.area) {
      params.push(filters.area);
      where.push(`area_code = $${params.length}`);
    }
    if (filters.corte) {
      params.push(filters.corte);
      where.push(`corte = $${params.length}`);
    }
    if (filters.q) {
      params.push(`%${filters.q}%`);
      where.push(`(tema ILIKE $${params.length} OR ratio ILIKE $${params.length} OR corte ILIKE $${params.length})`);
    }
    const sql =
      `SELECT id, corte, tipo, numero, anio, magistrado_ponente, fecha, tema, area_code, ratio, fuente_url FROM sentencias` +
      (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
      ` ORDER BY anio DESC, numero`;
    const { rows } = await query(sql, params);
    return rows;
  }

  async getSentencia(id: number) {
    const { rows } = await query(`SELECT * FROM sentencias WHERE id = $1`, [id]);
    if (!rows.length) return null;
    const sentencia = rows[0];
    const rel = await query(
      `SELECT n.id, n.tipo, n.numero, n.anio, n.slug, n.nombre
       FROM sentencia_norms sn JOIN norms n ON sn.norm_id = n.id
       WHERE sn.sentencia_id = $1 ORDER BY n.tipo, n.anio`,
      [id],
    );
    return { ...sentencia, normas_relacionadas: rel.rows };
  }

  async createSentencia(body: any) {
    const { corte, tipo, numero, anio, magistrado_ponente, fecha, tema, area_code, ratio, fuente_url } = body;
    if (!corte || !tipo || !numero || !anio) {
      throw new Error('Campos requeridos: corte, tipo, numero, anio');
    }
    const { rows } = await query(
      `INSERT INTO sentencias (corte, tipo, numero, anio, magistrado_ponente, fecha, tema, area_code, ratio, fuente_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [corte, tipo, numero, anio, magistrado_ponente ?? null, fecha ?? null, tema ?? null, area_code ?? null, ratio ?? null, fuente_url ?? null],
    );
    return rows[0];
  }

  // --- Análisis ---
  async analyze(text: string) {
    // 1. Clasificación por rama (servicio IA)
    const classification: any = await callIA('/classify', { text });
    const area: string = classification.area;
    const matchedKeywords: string[] = classification.matched_keywords || [];

    // 2. Normas del área + artículos constitucionales transversales
    const normas = await this.listNorms({ area });
    const articulosConstitucionales = await this.matchConstitutionalArticles(area, matchedKeywords);

    // 3. Sentencias (jurisprudencia) de soporte del área
    const sentencias = await this.listSentencias({ area });

    const result = {
      area,
      name: classification.name,
      confidence: classification.confidence,
      matched_keywords: matchedKeywords,
      normas,
      articulos_constitucionales: articulosConstitucionales,
      sentencias,
      disclaimer: ANALYSIS_DISCLAIMER,
    };

    // 4. Persistencia (consulta + snapshot del análisis)
    const c = await query(
      `INSERT INTO consultations (text, area_code, confidence, needs_review) VALUES ($1,$2,$3,$4) RETURNING id`,
      [text, area, classification.confidence, classification.needs_review],
    );
    const consultationId = c.rows[0].id;
    await query(
      `INSERT INTO consultation_analysis (consultation_id, area_code, result) VALUES ($1,$2,$3)`,
      [consultationId, area, JSON.stringify(result)],
    );

    return { consultation_id: consultationId, ...result };
  }

  private async matchConstitutionalArticles(area: string, keywords: string[]) {
    const areaKeywords = AREA_KEYWORDS[area] || [];
    const all = Array.from(
      new Set([...areaKeywords, ...keywords.map((k) => k.toLowerCase())]),
    );
    const { rows } = await query(
      `SELECT na.numero, na.titulo, na.texto, na.tema, n.nombre AS norma
       FROM norm_articles na JOIN norms n ON na.norm_id = n.id
       WHERE n.slug = 'constitucion-1991'
       ORDER BY na.numero`,
    );
    const filtered = rows.filter((r) => {
      const haystack = `${r.tema || ''} ${r.titulo || ''}`.toLowerCase();
      return all.some((k) => haystack.includes(k));
    });
    return filtered.length ? filtered : rows.slice(0, 3);
  }

  // --- Consultas persistidas ---
  async listConsultations() {
    const { rows } = await query(
      `SELECT c.id, c.text, c.area_code, c.confidence, c.needs_review, c.created_at
       FROM consultations c
       ORDER BY c.created_at DESC LIMIT 100`,
    );
    return rows;
  }

  async getAnalysis(consultationId: number) {
    const { rows } = await query(
      `SELECT * FROM consultation_analysis WHERE consultation_id = $1 ORDER BY id DESC LIMIT 1`,
      [consultationId],
    );
    return rows[0] || null;
  }
}
