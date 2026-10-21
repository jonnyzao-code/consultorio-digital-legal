import { FormularioIngreso } from "./formulario";

export default async function Ingresar({ searchParams }: { searchParams: Promise<{ siguiente?: string }> }) {
  const { siguiente } = await searchParams;
  return <FormularioIngreso siguiente={siguiente} />;
}
