// Las rutas programadas exigen CRON_SECRET; si no está configurado, se rechaza todo.
export const autorizado = (req: Request) =>
  Boolean(process.env.CRON_SECRET) && req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
