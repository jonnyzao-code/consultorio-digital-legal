-- =============================================================================
-- Consultorio Digital Legal — Datos semilla (conjunto inicial CURADO)
-- ⚠️ Corpus ilustrativo y NO exhaustivo. Todo el contenido es referencia
--    informativa y debe verificarse contra la fuente oficial (enlaces
--    `fuente_url`). Amplíese mediante la API y revísese por un abogado.
-- =============================================================================

-- Ramas del derecho
INSERT INTO legal_areas (code, name) VALUES
  ('penal', 'Derecho Penal'),
  ('laboral', 'Derecho Laboral'),
  ('familia', 'Derecho de Familia'),
  ('civil', 'Derecho Civil'),
  ('administrativo', 'Derecho Administrativo / Constitucional'),
  ('comercial', 'Derecho Comercial'),
  ('otro', 'Sin clasificar')
ON CONFLICT (code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- NORMAS
-- -----------------------------------------------------------------------------
INSERT INTO norms (tipo, numero, anio, slug, nombre, epigrafe, tema, area_code, fuente_url) VALUES
  ('Constitucion', NULL, 1991, 'constitucion-1991', 'Constitución Política de Colombia',
   'Norma suprema; consagra derechos fundamentales, estructura del Estado y mecanismos de protección.',
   'estado social de derecho, derechos fundamentales, tutela, peticion, debido proceso, trabajo, salud, seguridad social, familia',
   NULL, 'http://www.secretariasenado.gov.co/senado/basedoc/constitucion_politica_1991.html'),

  ('Ley', '1755', 2015, 'ley-1755-2015', 'Ley 1755 de 2015',
   'Regula el derecho fundamental de petición y sustituye el Título II del Código de Procedimiento Administrativo.',
   'derecho de peticion, peticion, terminos, administrativo', 'administrativo',
   'http://www.secretariasenado.gov.co/senado/basedoc/ley_1755_2015.html'),

  ('Decreto', '2591', 1991, 'decreto-2591-1991', 'Decreto 2591 de 1991',
   'Reglamenta la acción de tutela (artículo 86 de la Constitución).',
   'tutela, accion de tutela, derechos fundamentales', 'administrativo',
   'http://www.secretariasenado.gov.co/senado/basedoc/decreto_2591_1991.html'),

  ('Codigo', '2663', 1950, 'codigo-sustantivo-trabajo', 'Código Sustantivo del Trabajo',
   'Regula las relaciones laborales individuales y colectivas.',
   'trabajo, laboral, salario, despido, prestaciones, contrato de trabajo', 'laboral',
   'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo.html'),

  ('Ley', '599', 2000, 'ley-599-2000', 'Código Penal (Ley 599 de 2000)',
   'Tipifica los delitos y establece las penas en Colombia.',
   'penal, delito, pena, homicidio, hurto, estafa', 'penal',
   'http://www.secretariasenado.gov.co/senado/basedoc/ley_0599_2000.html'),

  ('Ley', '906', 2004, 'ley-906-2004', 'Código de Procedimiento Penal (Ley 906 de 2004)',
   'Sistema penal acusatorio y procedimiento penal.',
   'penal, procedimiento, fiscalia, acusacion, investigacion', 'penal',
   'http://www.secretariasenado.gov.co/senado/basedoc/ley_0906_2004.html'),

  ('Ley', '1564', 2012, 'ley-1564-2012', 'Código General del Proceso (Ley 1564 de 2012)',
   'Regula los procesos civiles, comerciales, de familia y agrarios.',
   'civil, proceso, jurisdiccion, demanda', 'civil',
   'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012.html'),

  ('Codigo', '57', 1887, 'codigo-civil', 'Código Civil (Ley 57 de 1887)',
   'Regula personas, bienes, obligaciones y contratos civiles.',
   'civil, contrato, propiedad, obligaciones, responsabilidad civil', 'civil',
   'http://www.secretariasenado.gov.co/senado/basedoc/codigo_civil.html'),

  ('Ley', '1098', 2006, 'ley-1098-2006', 'Código de la Infancia y la Adolescencia (Ley 1098 de 2006)',
   'Protección integral de niños, niñas y adolescentes; alimentos y custodia.',
   'familia, menores, alimentos, custodia, adopcion', 'familia',
   'http://www.secretariasenado.gov.co/senado/basedoc/ley_1098_2006.html'),

  ('Ley', '1581', 2012, 'ley-1581-2012', 'Ley 1581 de 2012 (Habeas Data)',
   'Protección de datos personales y habeas data.',
   'datos personales, habeas data, privacidad', 'administrativo',
   'http://www.secretariasenado.gov.co/senado/basedoc/ley_1581_2012.html'),

  ('Ley', '100', 1993, 'ley-100-1993', 'Ley 100 de 1993',
   'Sistema de Seguridad Social Integral (salud, pensiones, riesgos).',
   'seguridad social, salud, pension, eps', 'laboral',
   'http://www.secretariasenado.gov.co/senado/basedoc/ley_0100_1993.html'),

  ('Ley', '1480', 2011, 'ley-1480-2011', 'Estatuto del Consumidor (Ley 1480 de 2011)',
   'Protección al consumidor: garantías, publicidad e información.',
   'consumidor, garantia, comercio, informacion', 'comercial',
   'http://www.secretariasenado.gov.co/senado/basedoc/ley_1480_2011.html')
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- ARTÍCULOS (Constitución + normas clave). Texto = síntesis verificada.
-- -----------------------------------------------------------------------------
INSERT INTO norm_articles (norm_id, numero, titulo, texto, tema) VALUES
  ((SELECT id FROM norms WHERE slug='constitucion-1991'), '1', 'Estado social de derecho',
   'Colombia es un Estado social de derecho, fundado en el respeto de la dignidad humana, el trabajo y la solidaridad de las personas.',
   'estado social de derecho, dignidad, constitucional'),
  ((SELECT id FROM norms WHERE slug='constitucion-1991'), '13', 'Igualdad',
   'Todas las personas nacen libres e iguales ante la ley; el Estado promoverá condiciones para que la igualdad sea real y efectiva.',
   'igualdad, no discriminacion, constitucional'),
  ((SELECT id FROM norms WHERE slug='constitucion-1991'), '23', 'Derecho de petición',
   'Toda persona tiene derecho a presentar peticiones respetuosas a las autoridades por motivos de interés general o particular y a obtener pronta resolución.',
   'derecho de peticion, peticion, administrativo'),
  ((SELECT id FROM norms WHERE slug='constitucion-1991'), '25', 'Derecho al trabajo',
   'El trabajo es un derecho y una obligación social y goza, en todas sus modalidades, de la especial protección del Estado.',
   'trabajo, laboral'),
  ((SELECT id FROM norms WHERE slug='constitucion-1991'), '29', 'Debido proceso',
   'El debido proceso se aplicará a toda clase de actuaciones judiciales y administrativas.',
   'debido proceso, penal, administrativo'),
  ((SELECT id FROM norms WHERE slug='constitucion-1991'), '42', 'Familia',
   'La familia es el núcleo fundamental de la sociedad; el Estado y la sociedad garantizan su protección integral.',
   'familia'),
  ((SELECT id FROM norms WHERE slug='constitucion-1991'), '44', 'Derechos de los niños',
   'Son derechos fundamentales de los niños: la vida, la integridad física, la salud y la seguridad social, entre otros.',
   'familia, menores, hijos'),
  ((SELECT id FROM norms WHERE slug='constitucion-1991'), '48', 'Seguridad social',
   'La Seguridad Social es un servicio público de carácter obligatorio que se prestará bajo la dirección del Estado.',
   'seguridad social, pension, laboral'),
  ((SELECT id FROM norms WHERE slug='constitucion-1991'), '49', 'Salud',
   'La atención de la salud y el saneamiento ambiental son servicios públicos a cargo del Estado.',
   'salud, administrativo, eps'),
  ((SELECT id FROM norms WHERE slug='constitucion-1991'), '86', 'Acción de tutela',
   'Toda persona tendrá acción de tutela para reclamar ante los jueces la protección inmediata de sus derechos constitucionales fundamentales.',
   'tutela, accion de tutela, administrativo'),
  ((SELECT id FROM norms WHERE slug='ley-1755-2015'), '14', 'Términos para resolver',
   'Términos para resolver peticiones: 15 días hábiles las generales, 10 días hábiles las de documentos e información, y 30 días hábiles las consultas.',
   'derecho de peticion, terminos, administrativo'),
  ((SELECT id FROM norms WHERE slug='decreto-2591-1991'), '1', 'Procedencia de la tutela',
   'Toda persona tendrá acción de tutela para reclamar ante los jueces, en todo momento y lugar, la protección inmediata de sus derechos constitucionales fundamentales.',
   'tutela, accion de tutela, administrativo')
ON CONFLICT (norm_id, numero) DO NOTHING;

-- -----------------------------------------------------------------------------
-- SENTENCIAS (jurisprudencia de soporte)
-- -----------------------------------------------------------------------------
INSERT INTO sentencias (corte, tipo, numero, anio, magistrado_ponente, fecha, tema, area_code, ratio, fuente_url) VALUES
  ('Corte Constitucional', 'T', '760', 2008, 'Manuel José Cepeda Espinosa', '2008-07-31',
   'salud, tutela, eps, seguridad social', 'administrativo',
   'Reconoció el derecho a la salud como fundamental y ordenó unificar los planes de beneficios y adoptar medidas estructurales para garantizar su acceso efectivo.',
   'https://www.corteconstitucional.gov.co/relatoria/2008/t-760-08.htm'),
  ('Corte Constitucional', 'T', '025', 2004, 'Manuel José Cepeda Espinosa', '2004-01-22',
   'desplazamiento forzado, estado de cosas inconstitucional', 'administrativo',
   'Declaró el estado de cosas inconstitucional frente al desplazamiento forzado y ordenó medidas para superar la vulneración masiva de derechos.',
   'https://www.corteconstitucional.gov.co/relatoria/2004/t-025-04.htm'),
  ('Corte Constitucional', 'T', '406', 1992, 'Ciro Angarita Barón', '1992-06-05',
   'estado social de derecho, principios constitucionales', 'administrativo',
   'Desarrolló el alcance del Estado social de derecho y la fuerza normativa de los principios constitucionales.',
   'https://www.corteconstitucional.gov.co/relatoria/1992/T-406-92.htm'),
  ('Corte Constitucional', 'C', '221', 1994, 'Carlos Gaviria Díaz', '1994-05-05',
   'dosis personal, estupefacientes, libre desarrollo de la personalidad', 'penal',
   'Declaró inexequible la penalización del porte de dosis personal de estupefacientes, en protección del libre desarrollo de la personalidad.',
   'https://www.corteconstitucional.gov.co/relatoria/1994/c-221-94.htm')
ON CONFLICT (corte, tipo, numero, anio) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Relación sentencia <-> norma
-- -----------------------------------------------------------------------------
INSERT INTO sentencia_norms (sentencia_id, norm_id)
SELECT s.id, n.id
FROM sentencias s, norms n
WHERE s.corte='Corte Constitucional' AND s.tipo='T' AND s.numero='760' AND s.anio=2008
  AND n.slug IN ('constitucion-1991','ley-100-1993')
ON CONFLICT DO NOTHING;

INSERT INTO sentencia_norms (sentencia_id, norm_id)
SELECT s.id, n.id
FROM sentencias s, norms n
WHERE s.corte='Corte Constitucional' AND s.tipo='T' AND s.numero='025' AND s.anio=2004
  AND n.slug = 'constitucion-1991'
ON CONFLICT DO NOTHING;

INSERT INTO sentencia_norms (sentencia_id, norm_id)
SELECT s.id, n.id
FROM sentencias s, norms n
WHERE s.corte='Corte Constitucional' AND s.tipo='T' AND s.numero='406' AND s.anio=1992
  AND n.slug = 'constitucion-1991'
ON CONFLICT DO NOTHING;

INSERT INTO sentencia_norms (sentencia_id, norm_id)
SELECT s.id, n.id
FROM sentencias s, norms n
WHERE s.corte='Corte Constitucional' AND s.tipo='C' AND s.numero='221' AND s.anio=1994
  AND n.slug = 'constitucion-1991'
ON CONFLICT DO NOTHING;
