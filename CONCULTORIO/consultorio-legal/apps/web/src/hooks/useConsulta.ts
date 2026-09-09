import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { consultaAPI } from '@/lib/api'

export interface ClasificacionResult {
  rama: string
  confianza: number
  descripcion: string
  acciones_recomendadas: string[]
}

export function useClasificarConsulta() {
  return useMutation({
    mutationFn: (descripcion: string) =>
      consultaAPI.clasificar(descripcion).then((r) => r.data as ClasificacionResult),
  })
}

export function useCrearConsulta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      consultaAPI.crear(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultas'] })
    },
  })
}

export function useConsultas() {
  return useQuery({
    queryKey: ['consultas'],
    queryFn: () => consultaAPI.listar().then((r) => r.data),
  })
}

export function useConsulta(id: string) {
  return useQuery({
    queryKey: ['consultas', id],
    queryFn: () => consultaAPI.obtener(id).then((r) => r.data),
    enabled: !!id,
  })
}
