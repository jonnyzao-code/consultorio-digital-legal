# Consultorio Digital Legal — Flujos Clave

> Secuencias de los casos de uso que sostienen el negocio. Cada flujo indica **actores**, **pasos**, **decisiones de cumplimiento** y **eventos**.

---

## 1. Onboarding + consentimiento (Ley 1581)

```
Usuario nuevo → registro → mostrar política de privacidad (versión vigente)
   → consentimiento explícito por propósito (tratamiento, IA de terceros, notificaciones)
   → verificación de correo/teléfono → alta en users + consents
```

**Decisiones de cumplimiento:**
- El consentimiento de **"envío a IA de terceros" es independiente** del de tratamiento: si el usuario lo rechaza, la generación usa plantillas locales / LLM privado, sin degradar el servicio.
- Guardar `policy_version_id` e `ip` del consentimiento (evidencia para la SIC).
- Si el usuario ejerce derecho de **supresión** (ARCO), se anonimiza/elimina y se registra en `data_subject_requests`.

---

## 2. Clasificación por rama del derecho

```
Usuario describe su caso (texto libre / chatbot)
   → evento case.created
   → Servicio IA clasifica en {penal, civil, laboral, familia, administrativo, comercial, otro}
   → se asocia area_id + resumen (sin datos sensibles)
   → si confianza < umbral → se marca "otro" y se escala a un abogado para clasificación manual
```

**Decisiones:**
- El clasificador emite **orientación**, no asesoría. El usuario ve un disclaimer.
- La clasificación de baja confianza **nunca** se entrega como definitiva; requiere confirmación humana.

---

## 3. Generación de documento con revisión humana (obligatoria)

```
1. Usuario solicita documento (ej. tutela) → paga (o usa suscripción/bono)
2. Usuario completa formulario dinámico (datos mínimos, por rama)
3. Servicio IA genera borrador a partir de plantilla validada + datos
   → evento document.draft_ready
4. El borrador entra a la COLA DE REVISIÓN de un abogado
5. Abogado revisa/aprueba/rechaza (con comentarios)
   - aprobado → (si aplica) firma digital → entrega al usuario → notificación
   - rechazado → se devuelve con correcciones (bucle hasta aprobar)
```

**Reglas duras:**
- **Ningún documento se entrega sin `status = approved`** por un abogado con tarjeta profesional verificada.
- El abogado revisor es el **responsable del contenido final** (consta en `document_revisions.reviewed_by`).
- Cada revisión queda versionada y auditada.

---

## 4. Pago y facturación

```
Usuario elige plan/consulta → pasarela (Wompi/Stripe) con tokenización
   → evento payment.succeeded
   → activar suscripción / liberar servicio
   → emitir factura electrónica (proveedor DIAN) → guardar CUFE
   → (si aplica) alimentar cálculo de bonificación del abogado
```

**Decisiones:**
- El PAN **nunca** toca nuestra BD; solo `gateway_ref` tokenizado.
- La reversión/reembolso se maneja con la política de Estatuto del Consumidor.
- La factura se emite contra `payment.succeeded`, no contra "carrito".

---

## 5. Monitoreo de procesos + alertas (scraping como apoyo)

```
1. Abogado (apoderado legítimo) registra radicado → process_trackings
2. Worker de scraping (Playwright) consulta la fuente en cola programada
   → snapshot + diff vs. histórico
3. Si hay novedad → evento scrape.change_detected
   → alerta multicanal (correo/WA/push) SIN datos sensibles
   → actualización de estado del caso + notificación al abogado
4. Si el scraping falla o cambia la estructura → scrape_jobs.status = needs_manual
   → el abogado verifica en el portal oficial (fuente autoritativa)
```

**Decisiones:**
- `process_trackings.is_authoritative = false` siempre: la fuente oficial prevalece.
- **SPOA:** solo consulta del propio apoderado con acceso legítimo; **sin persistencia ni redistribución** de datos de terceros.
- Las alertas no incluyen el contenido de la investigación, solo "hubo una novedad en su proceso".

---

## 6. Asignación inteligente de casos (con validación)

```
Caso nuevo clasificado → se busca abogado disponible con especialidad coincidente
   → se valida tarjeta profesional vigente (verification_status = verified)
   → se asigna (o entra a cola si no hay disponible)
```

**Decisión:** nunca se asigna a un abogado sin `verification_status = verified`.

---

*Próximo documento: `04-api-contratos.md` (endpoints REST).*
