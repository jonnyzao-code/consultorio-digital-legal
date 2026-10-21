// Punto de entrada del Worker: la app de OpenNext más las tareas programadas de Cloudflare,
// para que la vigilancia de procesos y las alertas no dependan de un equipo encendido.
import { default as app } from "./.open-next/worker.js";

type Env = { CRON_SECRET?: string };
type Ctx = { waitUntil(p: Promise<unknown>): void };

const TAREAS: Record<string, string> = {
  "*/15 * * * *": "/api/cron/procesos?lote=3",
  "0 12 * * *": "/api/cron/alertas", // 7:00 a. m. en Colombia
};

const worker = {
  fetch: app.fetch,
  async scheduled(evento: { cron: string }, env: Env, ctx: Ctx) {
    const ruta = TAREAS[evento.cron];
    if (!ruta || !env.CRON_SECRET) return;
    const req = new Request(`https://abogados.dominetsas.com${ruta}`, { headers: { authorization: `Bearer ${env.CRON_SECRET}` } });
    const res: Response = await app.fetch(req, env, ctx);
    console.log(`Tarea ${ruta}: ${res.status} ${(await res.text()).slice(0, 300)}`);
  },
};

export default worker;
