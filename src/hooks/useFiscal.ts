import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { generarPackTareasFiscales } from "@/lib/pack-tareas"
import type {
  ObligacionFiscal,
  ObligacionInsert,
  ObligacionUpdate,
  ObligacionEstado,
  EjercicioFiscal,
} from "@/types/database.types"

// ─── Query keys ──────────────────────────────────────────────
export const fiscalKeys = {
  ejercicios:   (clubId: string)                         => ["ejercicios", clubId] as const,
  obligaciones: (clubId: string, ejercicioId?: string)   => ["obligaciones", clubId, ejercicioId ?? "all"] as const,
  vencidas:     (clubId: string)                         => ["obligaciones", clubId, "vencidas"] as const,
  proximas:     (clubId: string)                         => ["obligaciones", clubId, "proximas"] as const,
}

// ─── useEjercicios ────────────────────────────────────────────
export function useEjercicios(clubId: string) {
  return useQuery({
    queryKey: fiscalKeys.ejercicios(clubId),
    queryFn:  async (): Promise<EjercicioFiscal[]> => {
      const { data, error } = await supabase
        .from("ejercicios_fiscales")
        .select("*")
        .eq("club_id", clubId)
        .order("anio", { ascending: false })
      if (error) throw new Error(error.message)
      return (data ?? []) as EjercicioFiscal[]
    },
    enabled: !!clubId,
  })
}

// ─── useObligaciones ─────────────────────────────────────────
// Recupera obligaciones de un club, opcionalmente filtradas por ejercicio
interface FetchObligacionesOptions {
  clubId:      string
  ejercicioId?: string
  estado?:     ObligacionEstado
}

export function useObligaciones({ clubId, ejercicioId, estado }: FetchObligacionesOptions) {
  return useQuery({
    queryKey: fiscalKeys.obligaciones(clubId, ejercicioId),
    queryFn:  async (): Promise<ObligacionFiscal[]> => {
      let q = supabase
        .from("obligaciones_fiscales")
        .select("*")
        .eq("club_id", clubId)
        .order("fecha_vencimiento")

      if (ejercicioId) q = q.eq("ejercicio_id", ejercicioId)
      if (estado)      q = q.eq("estado", estado)

      const { data, error } = await q
      if (error) throw new Error(error.message)
      return (data ?? []) as ObligacionFiscal[]
    },
    enabled: !!clubId,
  })
}

// ─── useObligacionesVencidas ──────────────────────────────────
// Obligaciones vencidas o que vencen en los próximos N días
export function useObligacionesAlerta(clubId: string, diasAnticipacion = 30) {
  return useQuery({
    queryKey: fiscalKeys.proximas(clubId),
    queryFn:  async (): Promise<ObligacionFiscal[]> => {
      const limite = new Date(Date.now() + diasAnticipacion * 86400000).toISOString().split("T")[0]

      const { data, error } = await supabase
        .from("obligaciones_fiscales")
        .select("*")
        .eq("club_id", clubId)
        .or(`estado.eq.vencido,and(estado.eq.pendiente,fecha_vencimiento.lte.${limite})`)
        .order("fecha_vencimiento")

      if (error) throw new Error(error.message)
      return (data ?? []) as ObligacionFiscal[]
    },
    enabled: !!clubId,
  })
}

// ─── useCreateObligacion ─────────────────────────────────────
export function useCreateObligacion(clubId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (obligacion: ObligacionInsert): Promise<ObligacionFiscal> => {
      const { data, error } = await supabase
        .from("obligaciones_fiscales")
        .insert(obligacion)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data as ObligacionFiscal
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: fiscalKeys.obligaciones(clubId) })
    },
  })
}

// ─── useUpdateEstadoObligacion ────────────────────────────────
// Mutación especializada: solo cambia el estado (acción más frecuente)
export function useUpdateEstadoObligacion(clubId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      estado,
      file_url,
    }: {
      id:       string
      estado:   ObligacionEstado
      file_url?: string
    }): Promise<ObligacionFiscal> => {
      const updates: Partial<ObligacionFiscal> = { estado }
      if (file_url !== undefined) updates.file_url = file_url

      const { data, error } = await supabase
        .from("obligaciones_fiscales")
        .update(updates)
        .eq("id", id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data as ObligacionFiscal
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: fiscalKeys.obligaciones(clubId) })
      qc.invalidateQueries({ queryKey: fiscalKeys.proximas(clubId) })
    },
  })
}

// ─── useUpdateObligacion ─────────────────────────────────────
// Actualización completa de una obligación
export function useUpdateObligacion(clubId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: ObligacionUpdate & { id: string }): Promise<ObligacionFiscal> => {
      const { data, error } = await supabase
        .from("obligaciones_fiscales")
        .update(updates)
        .eq("id", id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data as ObligacionFiscal
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: fiscalKeys.obligaciones(clubId) })
    },
  })
}

// ─── useDeleteObligacion ─────────────────────────────────────
export function useDeleteObligacion(clubId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from("obligaciones_fiscales").delete().eq("id", id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: fiscalKeys.obligaciones(clubId) })
    },
  })
}

// ─── useCreateEjercicio ───────────────────────────────────────
export function useCreateEjercicio(clubId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ejercicio: {
      club_id: string
      anio:    number
      notas?:  string
    }): Promise<EjercicioFiscal> => {
      const { data, error } = await supabase
        .from("ejercicios_fiscales")
        .insert(ejercicio)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data as EjercicioFiscal
    },
    onSuccess: (ejercicio) => {
      qc.invalidateQueries({ queryKey: fiscalKeys.ejercicios(clubId) })
      // Generar pack de tareas fiscales automáticamente (no bloqueante)
      generarPackTareasFiscales({ clubId, ejercicioId: ejercicio.id, anio: ejercicio.anio })
        .then(() => qc.invalidateQueries({ queryKey: ["tareas", clubId] }))
        .catch(console.error)
    },
  })
}
