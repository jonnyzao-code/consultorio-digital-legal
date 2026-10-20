// Cálculo de términos en días hábiles con festivos colombianos (Ley 51 de 1983).
// Fechas en UTC como "YYYY-MM-DD" para evitar desfases por zona horaria.

const DIA = 86_400_000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const fecha = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));
const sumar = (d: Date, n: number) => new Date(d.getTime() + n * DIA);
const lunesSiguiente = (d: Date) => sumar(d, (8 - d.getUTCDay()) % 7);

function pascua(y: number): Date {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return fecha(y, mes, dia);
}

export function festivos(y: number): Set<string> {
  const p = pascua(y);
  const fijos = [fecha(y, 1, 1), fecha(y, 5, 1), fecha(y, 7, 20), fecha(y, 8, 7), fecha(y, 12, 8), fecha(y, 12, 25)];
  const trasladables = [[1, 6], [3, 19], [6, 29], [8, 15], [10, 12], [11, 1], [11, 11]].map(([m, d]) => lunesSiguiente(fecha(y, m, d)));
  const religiosos = [sumar(p, -3), sumar(p, -2), sumar(p, 43), sumar(p, 64), sumar(p, 71)];
  return new Set([...fijos, ...trasladables, ...religiosos].map(iso));
}

// Vacancia judicial: 20 de diciembre a 10 de enero y lunes a miércoles santo.
function enVacancia(d: Date): boolean {
  const m = d.getUTCMonth() + 1, dia = d.getUTCDate();
  if ((m === 12 && dia >= 20) || (m === 1 && dia <= 10)) return true;
  const p = pascua(d.getUTCFullYear());
  const t = d.getTime();
  return t >= sumar(p, -6).getTime() && t <= sumar(p, -4).getTime();
}

export function esHabil(d: Date, judicial = true): boolean {
  const dow = d.getUTCDay();
  if (dow === 0 || dow === 6) return false;
  if (festivos(d.getUTCFullYear()).has(iso(d))) return false;
  return !(judicial && enVacancia(d));
}

/** Fecha en que vence un término de `dias` hábiles contados desde el día siguiente a `desde`. */
export function venceTermino(desde: string, dias: number, judicial = true): string {
  let d = new Date(`${desde}T00:00:00Z`);
  let restantes = dias;
  while (restantes > 0) {
    d = sumar(d, 1);
    if (esHabil(d, judicial)) restantes--;
  }
  return iso(d);
}
