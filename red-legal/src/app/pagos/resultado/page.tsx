import Link from "next/link";

export default function ResultadoPago() {
  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <h1 className="text-2xl font-bold text-blue-900">Estamos confirmando tu pago</h1>
      <p className="text-slate-600">Wompi nos notifica el resultado en segundos. Verás el estado actualizado en tu panel.</p>
      <Link href="/panel" className="inline-block rounded-md bg-blue-900 px-5 py-3 text-white">Ir a mi panel</Link>
    </div>
  );
}
