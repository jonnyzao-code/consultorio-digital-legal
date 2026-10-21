// Piezas visuales compartidas del panel de administración.
export const campo = "rounded-md border bg-white p-2 text-sm";

export function Tarjeta({ titulo, valor, nota }: { titulo: string; valor: string | number; nota?: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-xs uppercase text-slate-500">{titulo}</p>
      <p className="text-2xl font-bold text-blue-900">{valor}</p>
      {nota && <p className="text-xs text-slate-500">{nota}</p>}
    </div>
  );
}

export function Tabla({ columnas, children }: { columnas: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left">
          <tr>{columnas.map((c) => <th key={c} className="whitespace-nowrap border-b p-2 font-medium">{c}</th>)}</tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
    </div>
  );
}
