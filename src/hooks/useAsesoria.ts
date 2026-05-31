import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/providers/AuthProvider"
import type {
  Club,
  ClubDashboard360,
  Subvencion,
  SubvencionInsert,
  SubvencionUpdate,
  SubvencionEstado,
  InteraccionCRM,
  InteraccionInsert,
  AsesorAssignment,
} from "@/types/database.types"

// ─── Query keys ──────────────────────────────────────────────
export const asesoriaKeys = {
  clubsAsignados:  (asesorId: string)              => ["asesoria", "clubs", asesorId] as const,
  dashboard360:    (asesorId: string)              => ["asesoria", "dashboard360", asesorId] as const,
  club360:         (clubId: string)                => ["asesoria", "club360", clubId] as const,
  subvenciones:    (clubId: string)                => ["subvenciones", clubId] as const,
  subvencionesPipeline: (asesorId: string)         => ["asesoria", "subvenciones-pipeline", asesorId] as const,
  interacciones:   (clubId: string)                => ["crm", clubId] as const,
  tareasConsolidadas: (asesorId: string)           => ["asesoria", "tareas", asesorId] as const,
}

// ─── useClubsAsignados ────────────────────────────────────────
// Solo disponible para rol 'asesor'. Retorna los clubes asignados
// con sus datos completos para poder "saltar" entre ellos.
export function useClubsAsignados() {
  const { user, role } = useAuth()

  return useQuery({
    queryKey: asesoriaKeys.clubsAsignados(user?.id ?? ""),
    queryFn:  async (): Promise<Club[]> => {
      const { data, error } = await supabase
        .from("asesor_assignments")
        .select("club_id, clubes(*)")
        .eq("asesor_id", user!.id)
        .order("created_at")

      if (error) throw new Error(error.message)
      return ((data ?? []) as unknown as (AsesorAssignment & { clubes: Club })[])
        .map((r) => r.clubes)
        .filter(Boolean)
    },
    enabled: !!user && role === "asesor",
    staleTime: 1000 * 60 * 10,  // clubes asignados cambian poco
  })
}

// ─── useDashboard360 ─────────────────────────────────────────
// Vista consolidada de TODOS los clubes del asesor: semáforo,
// tareas pendientes, obligaciones próximas, subvenciones activas.
export function useDashboard360() {
  const { user, role } = useAuth()

  return useQuery({
    queryKey: asesoriaKeys.dashboard360(user?.id ?? ""),
    queryFn:  async (): Promise<ClubDashboard360[]> => {
      // Primero obtenemos los IDs de clubes asignados
      const { data: asignaciones, error: errA } = await supabase
        .from("asesor_assignments")
        .select("club_id")
        .eq("asesor_id", user!.id)

      if (errA) throw new Error(errA.message)
      const clubIds = (asignaciones ?? []).map((a) => a.club_id)
      if (clubIds.length === 0) return []

      // Consultamos la vista 360 solo para esos clubes
      const { data, error } = await supabase
        .from("club_dashboard_360")
        .select("*")
        .in("id", clubIds)
        .order("nombre")

      if (error) throw new Error(error.message)
      return (data ?? []) as ClubDashboard360[]
    },
    enabled:   !!user && (role === "asesor" || role === "admin"),
    staleTime: 1000 * 60 * 2,  // dashboard se refresca cada 2 min
  })
}

// ─── useClub360 ───────────────────────────────────────────────
// Ficha 360 de un club concreto (para la vista Club360.tsx)
export function useClub360(clubId: string) {
  return useQuery({
    queryKey: asesoriaKeys.club360(clubId),
    queryFn:  async (): Promise<ClubDashboard360 | null> => {
      const { data, error } = await supabase
        .from("club_dashboard_360")
        .select("*")
        .eq("id", clubId)
        .single()
      if (error) throw new Error(error.message)
      return data as ClubDashboard360
    },
    enabled: !!clubId,
  })
}

// ─── useSubvenciones ─────────────────────────────────────────
// Subvenciones de un club concreto, con filtro opcional de estado
export function useSubvenciones(clubId: string, estado?: SubvencionEstado) {
  return useQuery({
    queryKey: asesoriaKeys.subvenciones(clubId),
    queryFn:  async (): Promise<Subvencion[]> => {
      let q = supabase
        .from("subvenciones")
        .select("*")
        .eq("club_id", clubId)
        .order("fecha_limite", { nullsFirst: false })

      if (estado) q = q.eq("estado", estado)

      const { data, error } = await q
      if (error) throw new Error(error.message)
      return (data ?? []) as Subvencion[]
    },
    enabled: !!clubId,
  })
}

// ─── useSubvencionesPipeline ──────────────────────────────────
// Vista pipeline consolidada de TODOS los clubes del asesor.
// Agrupa por estado para el tablero Kanban de subvenciones.
export function useSubvencionesPipeline() {
  const { user, role } = useAuth()

  return useQuery({
    queryKey: asesoriaKeys.subvencionesPipeline(user?.id ?? ""),
    queryFn:  async (): Promise<Record<SubvencionEstado, Subvencion[]>> => {
      const { data: asignaciones, error: errA } = await supabase
        .from("asesor_assignments")
        .select("club_id")
        .eq("asesor_id", user!.id)

      if (errA) throw new Error(errA.message)
      const clubIds = (asignaciones ?? []).map((a) => a.club_id)
      if (clubIds.length === 0) {
        return {
          identificada: [], solicitud: [], documentacion: [],
          justificacion: [], cobrado: [], denegada: [],
        }
      }

      const { data, error } = await supabase
        .from("subvenciones")
        .select("*")
        .in("club_id", clubIds)
        .order("fecha_limite", { nullsFirst: false })

      if (error) throw new Error(error.message)
      const subs = (data ?? []) as Subvencion[]

      // Agrupa por estado
      const pipeline: Record<SubvencionEstado, Subvencion[]> = {
        identificada: [], solicitud: [], documentacion: [],
        justificacion: [], cobrado: [], denegada: [],
      }
      for (const s of subs) pipeline[s.estado].push(s)
      return pipeline
    },
    enabled: !!user && (role === "asesor" || role === "admin"),
  })
}

// ─── useCreateSubvencion ─────────────────────────────────────
export function useCreateSubvencion(clubId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (subvencion: SubvencionInsert): Promise<Subvencion> => {
      const { data, error } = await supabase
        .from("subvenciones")
        .insert(subvencion)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data as Subvencion
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: asesoriaKeys.subvenciones(clubId) })
    },
  })
}

// ─── useUpdateSubvencion ─────────────────────────────────────
export function useUpdateSubvencion(clubId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: SubvencionUpdate & { id: string }): Promise<Subvencion> => {
      const { data, error } = await supabase
        .from("subvenciones")
        .update(updates)
        .eq("id", id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data as Subvencion
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: asesoriaKeys.subvenciones(clubId) })
      qc.invalidateQueries({ queryKey: ["asesoria", "subvenciones-pipeline"] })
    },
  })
}

// ─── useInteracciones ────────────────────────────────────────
// Historial CRM: interacciones del asesor con el club
export function useInteracciones(clubId: string) {
  return useQuery({
    queryKey: asesoriaKeys.interacciones(clubId),
    queryFn:  async (): Promise<InteraccionCRM[]> => {
      const { data, error } = await supabase
        .from("interacciones_crm")
        .select("*, profiles(full_name, avatar_url)")
        .eq("club_id", clubId)
        .order("fecha", { ascending: false })
      if (error) throw new Error(error.message)
      return (data ?? []) as unknown as InteraccionCRM[]
    },
    enabled: !!clubId,
  })
}

// ─── useCreateInteraccion ─────────────────────────────────────
export function useCreateInteraccion(clubId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (interaccion: InteraccionInsert): Promise<InteraccionCRM> => {
      const { data, error } = await supabase
        .from("interacciones_crm")
        .insert(interaccion)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data as InteraccionCRM
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: asesoriaKeys.interacciones(clubId) })
    },
  })
}

// ─── useTareasConsolidadas ────────────────────────────────────
// Permite al asesor ver tareas pendientes de TODOS sus clubes
// desde un único punto — vista consolidada multi-club.
export function useTareasConsolidadas() {
  const { user, role } = useAuth()

  return useQuery({
    queryKey: asesoriaKeys.tareasConsolidadas(user?.id ?? ""),
    queryFn:  async () => {
      const { data: asignaciones, error: errA } = await supabase
        .from("asesor_assignments")
        .select("club_id")
        .eq("asesor_id", user!.id)

      if (errA) throw new Error(errA.message)
      const clubIds = (asignaciones ?? []).map((a) => a.club_id)
      if (clubIds.length === 0) return []

      const { data, error } = await supabase
        .from("tareas")
        .select("*, clubes(nombre)")
        .in("club_id", clubIds)
        .in("estado", ["pendiente", "en_progreso"])
        .order("prioridad")
        .order("fecha_vencimiento", { nullsFirst: false })

      if (error) throw new Error(error.message)
      return data ?? []
    },
    enabled: !!user && (role === "asesor" || role === "admin"),
  })
}
