import { useQuery } from "@tanstack/react-query"
import { Users, Shield, CheckSquare, FileText } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useClub } from "@/providers/ClubProvider"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { AlertsBanner } from "@/components/dashboard/AlertsBanner"
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents"
import { useObligacionesAlerta } from "@/hooks/useFiscal"
import type { Jornada, Persona } from "@/types/database.types"

export function Dashboard() {
  const { currentClub } = useClub()
  const clubId = currentClub?.id ?? ""

  // Personas activas
  const { data: personas, isLoading: loadingPersonas } = useQuery({
    queryKey: ["dashboard-personas", clubId],
    queryFn:  async () => {
      const { data } = await supabase.from("personas").select("id, tipo, estado").eq("club_id", clubId)
      return (data ?? []) as Pick<Persona, "id" | "tipo" | "estado">[]
    },
    enabled: !!clubId,
  })

  // Tareas pendientes
  const { data: tareas, isLoading: loadingTareas } = useQuery({
    queryKey: ["dashboard-tareas", clubId],
    queryFn:  async () => {
      const { data } = await supabase
        .from("tareas")
        .select("id, estado")
        .eq("club_id", clubId)
        .in("estado", ["pendiente", "en_progreso"])
      return data ?? []
    },
    enabled: !!clubId,
  })

  // Próximas jornadas
  const { data: jornadas, isLoading: loadingJornadas } = useQuery({
    queryKey: ["dashboard-jornadas", clubId],
    queryFn:  async () => {
      const { data } = await supabase
        .from("jornadas")
        .select("*")
        .eq("club_id", clubId)
        .gte("fecha", new Date().toISOString())
        .order("fecha")
        .limit(5)
      return (data ?? []) as Jornada[]
    },
    enabled: !!clubId,
  })

  // Alertas fiscales (próximas 30 días)
  const { data: obligaciones = [], isLoading: loadingFiscal } = useObligacionesAlerta(clubId)

  const loading = loadingPersonas || loadingTareas || loadingFiscal

  const activos       = personas?.filter((p) => p.estado === "activo").length ?? 0
  const jugadores     = personas?.filter((p) => p.tipo === "jugador").length ?? 0
  const tareasPend    = tareas?.length ?? 0
  const oblVencidas   = obligaciones.filter((o) => o.estado === "vencido").length

  return (
    <PageWrapper
      title={currentClub ? currentClub.nombre : "Dashboard"}
      description="Resumen general del club"
    >
      <div className="space-y-6">
        {/* Alertas fiscales */}
        {obligaciones.length > 0 && <AlertsBanner obligaciones={obligaciones} />}

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label="Personas activas"
            value={activos}
            icon={Users}
            colorClass="text-primary"
            loading={loading}
          />
          <StatsCard
            label="Jugadores"
            value={jugadores}
            icon={Shield}
            colorClass="text-success"
            loading={loading}
          />
          <StatsCard
            label="Tareas pendientes"
            value={tareasPend}
            icon={CheckSquare}
            colorClass="text-warning"
            loading={loading}
          />
          <StatsCard
            label="Obligaciones vencidas"
            value={oblVencidas}
            icon={FileText}
            colorClass={oblVencidas > 0 ? "text-danger" : "text-success"}
            loading={loading}
          />
        </div>

        {/* Eventos próximos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <UpcomingEvents jornadas={jornadas ?? []} loading={loadingJornadas} />

          {/* Resumen fiscal rápido */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Estado fiscal
            </h3>
            {loadingFiscal ? (
              <p className="text-sm text-muted-foreground">Cargando…</p>
            ) : obligaciones.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin obligaciones próximas ✓</p>
            ) : (
              <ul className="space-y-2">
                {obligaciones.slice(0, 4).map((o) => {
                  const dias = Math.floor(
                    (new Date(o.fecha_vencimiento).getTime() - Date.now()) / 86400000
                  )
                  const color = o.estado === "vencido" || dias < 0 ? "text-danger"
                    : dias <= 3 ? "text-danger" : "text-warning"
                  return (
                    <li key={o.id} className="flex justify-between text-sm">
                      <span className="text-foreground truncate max-w-[60%]">{o.nombre}</span>
                      <span className={color + " font-medium shrink-0"}>
                        {o.estado === "vencido" || dias < 0
                          ? "Vencida"
                          : dias === 0 ? "Hoy"
                          : `${dias}d`}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
