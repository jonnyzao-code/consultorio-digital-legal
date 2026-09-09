"""
Servicio de Integración con Google Gemini AI
Análisis jurisprudencial y dogmático de alta precisión para el Derecho Colombiano.
Timeout optimizado para respuesta inmediata sin congelamiento de UI.
"""
import json
import urllib.request
import urllib.error
import structlog
from typing import Dict, Any, Optional
from app.core.config import settings

log = structlog.get_logger()

class GeminiAIService:
    @staticmethod
    def _call_gemini_api(prompt: str, system_instruction: Optional[str] = None) -> Optional[str]:
        """
        Ejecuta la llamada a la API REST de Google Gemini.
        Timeout reducido a 2.5s para no demorar la respuesta si no hay conexión externa.
        """
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            return None

        model = settings.GEMINI_MODEL or "gemini-2.0-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

        payload: Dict[str, Any] = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 2500,
            }
        }

        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        data_bytes = json.dumps(payload).encode("utf-8")
        # La clave se envía en el header (x-goog-api-key), NUNCA en la URL
        # (quedaría en logs de proxies/balanceadores).
        req = urllib.request.Request(
            url,
            data=data_bytes,
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": api_key,
            },
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=15.0) as response:
                if response.status == 200:
                    resp_data = json.loads(response.read().decode("utf-8"))
                    candidates = resp_data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
        except Exception as e:
            log.warning(
                "Gemini no respondió (se usa el motor dogmático local): %s %s",
                type(e).__name__,
                e,
            )

        return None

    @classmethod
    def analyze_legal_case(cls, user_description: str) -> Optional[Dict[str, Any]]:
        """
        Dictamen Jurídico Integral basado en los hechos narrados por el ciudadano.
        """
        system_prompt = (
            "Eres un Magistrado Auxiliar de la Corte Constitucional y tratadista del Derecho Colombiano. "
            "Analiza a profundidad el relato fáctico exacto del ciudadano. "
            "Responde ÚNICAMENTE un JSON con: branch ('penal','civil','laboral','familia','administrativo'), "
            "confidence (float), summary, problema_juridico (específico con las partes y hechos reales), "
            "urgency_level ('ALTA','MEDIA','BAJA'), applicable_rights (lista de strings con artículos), "
            "marco_normativo (lista de normas colombianas con artículos), "
            "jurisprudencia_relevante (lista de objetos con sentencia, corte, tesis), "
            "test_procedibilidad (objeto con inmediatez y subsidiariedad), "
            "estrategia_procesal (objeto con accion, despacho, medida_cautelar, pruebas), "
            "recommended_action, suggested_document."
        )

        prompt = f"Relato fáctico exacto del ciudadano:\n'''{user_description}'''"
        raw_response = cls._call_gemini_api(prompt=prompt, system_instruction=system_prompt)
        if raw_response:
            try:
                clean_json = raw_response.strip()
                if clean_json.startswith("```"):
                    lines = clean_json.split("\n")
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines and lines[-1].startswith("```"):
                        lines = lines[:-1]
                    clean_json = "\n".join(lines).strip()
                return json.loads(clean_json)
            except Exception:
                pass
        return None
