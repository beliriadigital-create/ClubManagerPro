import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { Tarea, TareaInsert, TareaUpdate, TareaEstado } from "@/types/database.types"

export const tareasKeys = {
  all:      (clubId: string)                       => ["tareas", clubId] as const,
  byEstado: (clubId: string, estado: TareaEstado)  => ["tareas", clubId, estado] as const,
}

// Recupera todas las tareas del club agrupadas por estado (para Kanban)
export function useTareas(clubId: string) {
  return useQuery({
    queryKey: tareasKeys.all(clubId),
    queryFn:  async (): Promise<Record<TareaEstado, Tarea[]>> => {
      const { data, error } = await supabase
        .from("tareas")
        .select("*, personas(nombre, apellidos, foto_url)")
        .eq("club_id", clubId)
        .order("orden")

      if (error) throw new Error(error.message)
      const tareas = (data ?? []) as unknown as Tarea[]

      const grouped: Record<TareaEstado, Tarea[]> = {
        pendiente: [], en_progreso: [], completada: [], cancelada: [],
      }
      for (const t of tareas) grouped[t.estado].push(t)
      return grouped
    },
    enabled: !!clubId,
  })
}

export function useCreateTarea(clubId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (tarea: TareaInsert): Promise<Tarea> => {
      const { data, error } = await supabase
        .from("tareas")
        .insert(tarea)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data as Tarea
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: tareasKeys.all(clubId) }),
  })
}

export function useUpdateTarea(clubId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: TareaUpdate & { id: string }): Promise<Tarea> => {
      const { data, error } = await supabase
        .from("tareas")
        .update(updates)
        .eq("id", id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data as Tarea
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: tareasKeys.all(clubId) }),
  })
}

// Mutación optimista para mover tarjetas en el Kanban
export function useMoverTarea(clubId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      nuevoEstado,
      nuevoOrden,
    }: {
      id:          string
      nuevoEstado: TareaEstado
      nuevoOrden:  number
    }): Promise<void> => {
      const { error } = await supabase
        .from("tareas")
        .update({ estado: nuevoEstado, orden: nuevoOrden })
        .eq("id", id)
      if (error) throw new Error(error.message)
    },
    // Actualización optimista: actualiza caché antes de confirmar
    onMutate: async ({ id, nuevoEstado, nuevoOrden }) => {
      await qc.cancelQueries({ queryKey: tareasKeys.all(clubId) })
      const prev = qc.getQueryData<Record<TareaEstado, Tarea[]>>(tareasKeys.all(clubId))

      qc.setQueryData<Record<TareaEstado, Tarea[]>>(tareasKeys.all(clubId), (old) => {
        if (!old) return old
        const updated = structuredClone(old)
        // Eliminar de cualquier columna
        let tarea: Tarea | undefined
        for (const estado of Object.keys(updated) as TareaEstado[]) {
          const idx = updated[estado].findIndex((t) => t.id === id)
          if (idx !== -1) {
            ;[tarea] = updated[estado].splice(idx, 1)
          }
        }
        // Insertar en nueva columna
        if (tarea) {
          tarea.estado = nuevoEstado
          tarea.orden  = nuevoOrden
          updated[nuevoEstado].splice(nuevoOrden, 0, tarea)
        }
        return updated
      })

      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(tareasKeys.all(clubId), ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: tareasKeys.all(clubId) })
    },
  })
}
