import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { Equipo, EquipoInsert } from "@/types/database.types"

export const equiposKeys = {
  all:    (clubId: string)               => ["equipos", clubId] as const,
  detail: (clubId: string, id: string)   => ["equipos", clubId, id] as const,
}

export function useEquipos(clubId: string) {
  return useQuery({
    queryKey: equiposKeys.all(clubId),
    queryFn:  async (): Promise<Equipo[]> => {
      const { data, error } = await supabase
        .from("equipos")
        .select("*, temporadas(nombre, activa)")
        .eq("club_id", clubId)
        .order("nombre")
      if (error) throw new Error(error.message)
      return (data ?? []) as unknown as Equipo[]
    },
    enabled: !!clubId,
  })
}

export function useCreateEquipo(clubId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (equipo: EquipoInsert): Promise<Equipo> => {
      const { data, error } = await supabase
        .from("equipos")
        .insert(equipo)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data as Equipo
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: equiposKeys.all(clubId) }),
  })
}

export function useUpdateEquipo(clubId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EquipoInsert> & { id: string }): Promise<Equipo> => {
      const { data, error } = await supabase
        .from("equipos")
        .update(updates)
        .eq("id", id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data as Equipo
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: equiposKeys.all(clubId) })
      qc.setQueryData(equiposKeys.detail(clubId, updated.id), updated)
    },
  })
}
