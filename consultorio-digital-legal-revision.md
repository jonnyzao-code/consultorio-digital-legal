# Consultorio Digital Legal — Revisión del Plan y Arquitectura Mejorada

> Documento de revisión técnica, legal y de negocio del organigrama funcional original.
> Objetivo: convertir el plan en una base ejecutable y **cumplible** (no solo funcional).

---

## 1. Valoración general

El plan original tiene **buena estructura conceptual**: separa correctamente negocio, atención, operaciones, núcleo de IA y datos, y la hoja de ruta en 4 fases es realista en plazos (6–8 meses para un MVP + escalamiento es razonable).

Sin embargo, presenta **tres debilidades estructurales** que conviene corregir antes de invertir:

1. **Subestima el riesgo legal/regulatorio.** Es una plataforma de servicios jurídicos en Colombia: el cumplimiento no es un módulo, es la condición de existencia del negocio.
2. **Confía en scraping e IA generativa sin "humano en el circuito"** para decisiones y documentos con efectos legales.
3. **No define el modelo de responsabilidad ni la validación de credenciales** de los abogados que atienden.

---

## 2. Riesgos críticos (priorizados)

### 🔴 2.1 Riesgos legales y regulatorios (los que definen la viabilidad)

#### a) Ejercicio de la abogacía y publicidad — *Ley 1123 de 2007*
- En Colombia, la asesoría jurídica es una **actividad regulada**: solo abogados con tarjeta profesional vigente pueden prestarla.
- El chatbot AI y el "clasificador" deben limitarse a **orientación informativa general**, nunca a asesoría legal particularizada. Si el sistema recomienda "acciones legales" concretas a un caso real, puede constituir ejercicio ilegal de la abogacía.
- **Mejora:** separar explícitamente dos productos: (1) *información/orientación general* (automatizable) y (2) *asesoría jurídica* (solo abogado). Redactar la interfaz del chatbot con un disclaimer claro y una escalación obligatoria a abogado.

#### b) Confidencialidad y secreto profesional — *crítico con IA de terceros*
- Los datos de consultas jurídicas son **privilegiados** (secreto profesional abogado-cliente).
- Enviar datos de casos a la API de OpenAI/GPT-4 **sin anonimizar y sin consentimiento** vulnera la confidencialidad y puede exponer datos sensibles.
- **Mejora:**
  - Anonimizar/seudonimizar **antes** de llamar a cualquier LLM externo.
  - Consentimiento explícito del usuario para el tratamiento de datos (Ley 1581).
  - Evaluar un **LLM privado/on-premise** para generación de documentos con datos reales.
  - Firmar DPA (acuerdo de tratamiento de datos) con cada proveedor de IA.

#### c) Ley 1581 de 2012 (Habeas Data) — *datos sensibles*
- Los casos jurídicos contienen **datos sensibles** (salud en tutelas, datos de menores, antecedentes penales). Requieren consentimiento **previo, expreso e informado**, aviso de privacidad y registro en el RNBD ante la SIC.
- **Mejora:** designar un responsable de tratamiento; publicar política de privacidad y aviso de privacidad antes de capturar el primer dato; minimización de datos (capturar solo lo necesario).

#### d) Firma electrónica vs. firma digital — *Decreto 2364/2012 y Ley 527/1999*
- El plan menciona "firma electrónica", pero para validez y no repudio en documentos judiciales conviene distinguir:
  - **Firma electrónica simple** (aceptación de términos, formularios).
  - **Firma digital certificada** (contratos, demandas, poderes) mediante una entidad de certificación acreditada (p. ej. ONAC/entidades de certificación).
- **Mejora:** definir por tipo de documento qué nivel de firma se exige y contratar un proveedor de firma digital certificada para los documentos con valor probatorio.

#### e) Scraping de SPOA (Fiscalía) — *el mayor riesgo legal del plan*
- La información de investigaciones penales en SPOA está sujeta a **reserva del sumario** (arts. 18 y 19 de la Ley 906 de 2004). No es información pública de libre disposición.
- Automatizar la consulta y **redistribución** de datos de SPOA para terceros puede violar la reserva, la Ley 1581 y la confidencialidad.
- **Conclusión:** el módulo "Fiscalía (SPOA/NUNC)" como scraping abierto **no es viable legalmente** tal como está planteado. Debe limitarse a:
  - Consulta por parte del **abogado apoderado** de su propio caso (con credenciales y legitimación).
  - No almacenar ni redistribuir datos de investigaciones de terceros.
- **Mejora:** reubicar SPOA de "integración oficial" a "herramienta interna del abogado con acceso legítimo", con control de acceso y sin persistencia de datos ajenos.

#### f) Scraping de Rama Judicial (TyBA/Consulta de Procesos) y DIAN/RUES
- Rama Judicial: la consulta pública ha migrado a **TyBA**; no existe una API pública amplia y estable. El scraping puede violar términos de uso, enfrentar CAPTCHA y devolver datos **desactualizados o mal interpretados**.
- DIAN: el RUT es información **restringida** (requiere autorización del titular); RUES es público.
- **Mejora:**
  - Tratar el scraping como **fuente de respaldo no autoritativa**; validar siempre con revisión humana.
  - Donde exista API oficial o consulta legítima, priorizarla.
  - Cachear resultados con marca de tiempo y advertir al usuario que la fuente oficial prevalece.
  - Diseñar un "modo manual": el abogado captura/verifica en el portal oficial si el scraping falla.

#### g) Responsabilidad profesional
- Si un documento generado por IA tiene un error y causa perjuicio, hay que definir **quién responde**.
- **Mejora:** el abogado revisor es el responsable del contenido final (el sistema es una herramienta de apoyo); incluir términos de uso, disclaimer y contratar póliza de responsabilidad civil profesional.

#### h) Estatuto del Consumidor — *Ley 1480 de 2011*
- Aplica a la relación plataforma-usuario: información clara de precios, términos, derecho de retracto donde aplique y reversión de pagos.
- **Mejora:** publicar T&C y política de reembolsos antes de habilitar pagos.

#### i) Facturación electrónica — *Resolución DIAN vigente (000165 de 2023 y anteriores)*
- Requiere habilitación como facturador electrónico, certificado digital y proveedor tecnológico autorizado.
- **Mejora:** integrar un proveedor de facturación electrónica habilitado por la DIAN (no desarrollarlo a medida salvo necesidad real).

### 🟠 2.2 Riesgos técnicos

1. **Sin "humano en el circuito" los documentos son un riesgo jurídico.** Toda tutela, demanda o contrato generado debe pasar por revisión de un abogado antes de entregarse. Esto debe ser una **regla de negocio dura**, no opcional.
2. **Alucinación del LLM.** GPT-4 puede inventar artículos, jurisprudencia o plazos. **Mejora:** generación basada en **plantillas validadas + RAG** sobre fuentes normativas curadas, y validación de citas.
3. **Fragilidad del scraping.** El motor depende de portales que cambian sin aviso. **Mejora:** colas asíncronas, reintentos con backoff, rate-limiting, detección de cambio de estructura y *fallback* manual.
4. **PCI-DSS en pagos.** No almacenar datos de tarjeta (PAN); tokenizar con Wompi/PayU/Stripe. El cumplimiento PCI se delega al pasarela en la medida de lo posible.
5. **Seguridad de la aplicación.** El plan menciona TLS/AES (correcto) pero falta: RBAC + MFA, gestión de secretos, OWASP Top 10, pentest periódico, gestión de llaves de cifrado (KMS) y plan de respuesta a incidentes.
6. **Arquitectura del "Motor Antigravity".** Está planteado como bloque monolítico. **Mejora:** dividirlo en servicios desacoplados (clasificación, extracción OCR/NLP, generación de documentos, scraping, notificaciones) comunicados por eventos, para escalar y fallar de forma aislada.
7. **Observabilidad y CI/CD.** No se mencionan. **Mejora:** logging estructurado, métricas, trazabilidad, pipeline de despliegue y pruebas automatizadas (unitarias, integración, y pruebas de regresión de scraping).

### 🟡 2.3 Riesgos de negocio

1. **"Pro bono subsidiado" sin definición.** ¿Quién subsidia y con qué incentivo? **Mejora:** definir un fondo/alianza (p. ej. responsabilidad social, convenios) o reformularlo como plan de bajo costo con abogados en formación supervisados.
2. **Captación de clientes y ética profesional.** El modelo de intermediación de clientes a abogados debe revisarse frente a las normas disciplinarias sobre publicidad y honorarios.
3. **Validación de credenciales.** El "directorio de abogados" debe **verificar tarjeta profesional vigente** (consulta ante el Registro Nacional de Abogados) antes de habilitar a un abogado.
4. **Competencia.** Existen plataformas legales establecidas en Colombia; el diferenciador real debe ser la **calidad + confianza + integraciones oficiales legítimas**, no el volumen.

---

## 3. Mejoras por módulo

| Módulo | Componente original | Riesgo/brecha | Mejora propuesta |
|---|---|---|---|
| Negocio/Finanzas | Pasarela (Wompi/PayU/Stripe) | PCI, reversiones | Tokenización, no almacenar PAN; política de reembolsos |
| | Suscripciones (Stripe Billing) | Facturación electrónica | Integrar facturador habilitado por DIAN |
| | Bonificaciones (60/40) | Regla rígida | Fórmula configurable + auditoría de cálculo |
| Atención al Usuario | Clasificador IA | Puede interpretarse como asesoría | Limitar a orientación + disclaimer + escalación a abogado |
| | Chatbot (OpenAI/Rasa) | Confidencialidad | Anonimizar antes de llamar a LLM externo |
| | Formularios dinámicos | Datos sensibles | Consentimiento + minimización de datos |
| | Gestor de turnos | — | Calendly/API + recordatorios (doble confirmación) |
| Operaciones | Dashboard KPIs | Datos financieros sensibles | RBAC por rol; no exponer datos personales |
| | Directorio de abogados | Credenciales | Verificar tarjeta profesional vigente |
| | Seguimiento de casos | Confidencialidad | Acceso por caso (need-to-know) + auditoría |
| Núcleo IA | Generador de documentos | Alucinación + responsabilidad | Plantillas validadas + revisión humana obligatoria |
| | Scraping procesos | Fragilidad + legalidad | API oficial donde exista + fallback manual + no autoritativo |
| | SPOA | **Reserva del sumario** | Solo acceso legítimo del apoderado, sin redistribución |
| | Integraciones | — | Cachear + marca de tiempo + fuente oficial prevalece |
| Datos/Seguridad | BD (PostgreSQL/MongoDB) | Límites poco claros | Relacional para datos transaccionales; documental solo para contenido no estructurado |
| | Firma electrónica | Nivel de firma | Distinguir firma simple vs. digital certificada |
| | Encriptación | Gestión de llaves | KMS, rotación, cifrado en reposo y tránsito |

---

## 4. Arquitectura mejorada

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CAPA DE EXPERIENCIA                          │
│   Web/App · Clasificador · Chatbot (orientación) · Formularios       │
│   Pasarela de pagos (tokenizada) · Gestor de turnos                  │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ API Gateway (auth + RBAC + rate-limit)
┌───────────────────────────────┴──────────────────────────────────────┐
│                    CAPA DE SERVICIOS (desacoplados)                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │ Identidad/   │ │ Casos y      │ │ Documentos   │ │ Pagos y      │ │
│  │ Accesos      │ │ CRM legal    │ │ (plantillas  │ │ Facturación  │ │
│  │ (MFA, RBAC)  │ │ (estados)    │ │  + revisión) │ │  electrónica │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │ IA:          │ │ Scraping     │ │ Notificación │ │ Auditoría/   │ │
│  │ Clasificar   │ │ (colas,      │ │ (correo/WA/  │ │ Observabilidad│ │
│  │ Extraer/OCR  │ │  fallback)   │ │  push)       │ │ (logs+métricas│ │
│  │ Generar      │ │              │ │              │ │ )            │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
┌───────────────────────────────┴──────────────────────────────────────┐
│           HUMANO EN EL CIRCUITO (obligatorio)                        │
│   Revisión de abogado antes de entregar documentos/acciones legales  │
│   Validación de credenciales (tarjeta profesional)                   │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
┌───────────────────────────────┴──────────────────────────────────────┐
│              CAPA DE DATOS Y CUMPLIMIENTO                            │
│  PostgreSQL (transaccional) · Almacenamiento cifrado (documentos)    │
│  KMS · TLS 1.3/AES-256 · Auditoría · Backup + DR · Ley 1581          │
└──────────────────────────────────────────────────────────────────────┘
```

**Principios rectores:**
1. **Humano en el circuito** para todo documento/acción con efecto jurídico.
2. **Datos mínimos y anonimización** antes de IA de terceros.
3. **Scraping = apoyo, no fuente autoritativa.**
4. **Cumplimiento desde el día 1** (privacidad, habilitación DIAN, verificación de abogados).

---

## 5. Hoja de ruta revisada (8–10 meses)

| Fase | Meses | Entregables (con énfasis en cumplimiento) |
|---|---|---|
| **0. Cumplimiento fundacional** | 1–2 | Política de privacidad + aviso + consentimiento (Ley 1581); T&C + disclaimers; definición de responsabilidad (abogado revisor); verificación de tarjeta profesional; contrato con facturador electrónico DIAN; diseño de roles (RBAC). |
| **1. Fundación** | 2–3 | Registro legal, alianzas con abogados fundadores (credenciales verificadas), tarifas y modelo de negocio. |
| **2. MVP** | 3–5 | Frontend con clasificador (orientación + disclaimer); generador de tutelas y derechos de petición **con revisión humana obligatoria**; pasarela tokenizada; BD de usuarios con consentimiento. |
| **3. Automatización Core** | 5–7 | Scraping Rama Judicial **como apoyo con fallback manual**; alertas correo/WA (sin datos sensibles en texto); panel de administración; dashboard KPIs con RBAC. |
| **4. Escalamiento** | 7–9 | Contratos y liquidaciones (plantillas validadas); bonificaciones automáticas; app móvil (opcional). **SPOA solo como herramienta del apoderado con acceso legítimo.** |

> Cambio clave frente al plan original: se añade una **Fase 0 de cumplimiento** y se extiende el plazo a 8–10 meses, porque la viabilidad legal de una plataforma jurídica es prerrequisito, no una mejora.

---

## 6. Prioridades inmediatas (próximos 30 días)

1. Definir el **modelo de responsabilidad** y el alcance exacto del chatbot (orientación vs. asesoría).
2. Redactar **política de privacidad, aviso y flujo de consentimiento** (Ley 1581).
3. Decidir el **proveedor de firma digital certificada** y el **facturador electrónico DIAN**.
4. Rediseñar el módulo **SPOA** como herramienta interna del apoderado (eliminar scraping abierto).
5. Elegir stack y definir los **límites de servicios** del "Motor Antigravity" (evitar monolito).
6. Establecer el **proceso de revisión humana** de documentos generados por IA.

---

*Este documento es una revisión de arquitectura y riesgo; los puntos normativos (Ley 1123/2007, Ley 1581/2012, Ley 527/1999, Decreto 2364/2012, Ley 906/2004, Ley 1480/2011 y normativa DIAN) deben validarse con un abogado colombiano especializado antes de su implementación.*
