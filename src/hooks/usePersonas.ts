import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { Persona, PersonaInsert, PersonaUpdate, PersonaTipo, PersonaEstado } from "@/types/database.types"

// ─── Query keys ──────────────────────────────────────────────
export const personasKeys = {
  all:    (clubId: string)                    => ["personas", clubId] as const,
  byTipo: (clubId: string, tipo: PersonaTipo) => ["personas", clubId, "tipo", tipo] as const,
  detail: (clubId: string, id: string)        => ["personas", clubId, id] as const,
}

// ─── fetchPersonas ────────────────────────────────────────────
interface FetchPersonasOptions {
  clubId:  string
  tipo?:   PersonaTipo
  estado?: PersonaEstado
  search?: string
}

async function fetchPersonas({ clubId, tipo, estado, search }: FetchPersonasOptions): Promise<Persona[]> {
  let q = supabase
    .from("personas")
    .select("*")
    .eq("club_id", clubId)
    .order("apellidos")

  if (tipo)   q = q.eq("tipo", tipo)
  if (estado) q = q.eq("estado", estado)
  if (search) {
    q = q.or(`nombre.ilike.%${search}%,apellidos.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as Persona[]
}

export function usePersonas(options: FetchPersonasOptions) {
  return useQuery({
    queryKey: options.tipo
      ? personasKeys.byTipo(options.clubId, options.tipo)
      : personasKeys.all(options.clubId),
    queryFn:  () => fetchPersonas(options),
    enabled:  !!options.clubId,
  })
}

// ─── usePersona (detalle) ─────────────────────────────────────
async function fetchPersona(clubId: string, personaId: string): Promise<Persona> {
  const { data, error } = await supabase
    .from("personas")
    .select("*")
    .eq("id", personaId)
    .eq("club_id", clubId)
    .single()
  if (error) throw new Error(error.message)
  return data as Persona
}

export function usePersona(clubId: string, personaId: string) {
  return useQuery({
    queryKey: personasKeys.detail(clubId, personaId),
    queryFn:  () => fetchPersona(clubId, personaId),
    enabled:  !!clubId && !!personaId,
  })
}

// ─── createPersona ────────────────────────────────────────────
export function useCreatePersona(clubId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (persona: PersonaInsert): Promise<Persona> => {
      const { data, error } = await supabase
        .from("personas")
        .insert(persona)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data as Persona
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: personasKeys.all(clubId) })
    },
  })
}

// ─── updatePersona ────────────────────────────────────────────
export function useUpdatePersona(clubId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: PersonaUpdate & { id: string }): Promise<Persona> => {
      const { data, error } = await supabase
        .from("personas")
        .update(updates)
        .eq("id", id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data as Persona
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: personasKeys.all(clubId) })
      qc.setQueryData(personasKeys.detail(clubId, updated.id), updated)
    },
  })
}

// ─── deletePersona ────────────────────────────────────────────
export function useDeletePersona(clubId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from("personas").delete().eq("id", id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: personasKeys.all(clubId) })
    },
  })
}
