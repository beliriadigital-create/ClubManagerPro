import { useParams, Link } from "react-router-dom"
import { ArrowLeft, Users, CheckSquare, FileText, TrendingUp } from "lucide-react"
import { useClub360, useInteracciones } from "@/hooks/useAsesoria"
import { useObligacionesAlerta } from "@/hooks/useFiscal"
import { usePersonas } from "@/hooks/usePersonas"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { AlertaSemaforo } from "@/components/asesoria/AlertaSemaforo"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { AlertsBanner } from "@/components/dashboard/AlertsBanner"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function Club360() {
  const { id = "" }               = useParams()
  const { data: club, isLoading } = useClub360(id)
  const { data: interacciones = [] } = useInteracciones(id)
  const { data: obligaciones = [] }  = useObligacionesAlerta(id)
  const { data: personas = [] }      = usePersonas({ clubId: id })

  if (isLoading) return <PageLoader />
  if (!club) return (
    <PageWrapper title="Club no encontrado">
      <p className="text-muted-foreground">No tienes acceso a este club.</p>
    </PageWrapper>
  )

  const initials = club.nombre.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()

  return (
    <PageWrapper
      title={
        <span className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={club.logo_url ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">{initials}</AvatarFallback>
          </Avatar>
          {club.nombre}
          <AlertaSemaforo nivel={club.semaforo} size="sm" />
        </span>
      }
      description={club.cif ? `CIF: ${club.cif}` : "Vista 360° del club"}
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link to="/asesoria"><ArrowLeft className="h-4 w-4 mr-2" />Volver</Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Alertas fiscales */}
        {obligaciones.length > 0 && <AlertsBanner obligaciones={obligaciones} />}

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard label="Personas activas"     value={club.total_personas}        icon={Users}      colorClass="text-primary" />
          <StatsCard label="Tareas pendientes"    value={club.tareas_pendientes}     icon={CheckSquare} colorClass="text-warning" />
          <StatsCard label="Oblig. vencidas"      value={club.obligaciones_vencidas} icon={FileText}   colorClass={club.obligaciones_vencidas > 0 ? "text-danger" : "text-success"} />
          <StatsCard label="Subvenciones activas" value={club.subvenciones_activas}  icon={TrendingUp} colorClass="text-primary" />
        </div>

        {/* Distribución personas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Personas por tipo</CardTitle>
            </CardHeader>
            <CardContent>
              {["jugador","entrenador","directivo","socio","staff"].map((tipo) => {
                const count = personas.filter((p) => p.tipo === tipo && p.estado === "activo").length
                if (count === 0) return null
                return (
                  <div key={tipo} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                    <span className="text-sm capitalize text-foreground">{tipo}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                )
              })}
              {personas.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Sin personas registradas</p>
              )}
            </CardContent>
          </Card>

          {/* Últimas interacciones CRM */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Últimas interacciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {interacciones.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sin interacciones registradas</p>
              ) : (
                interacciones.slice(0, 4).map((i) => (
                  <div key={i.id} className="flex items-start gap-3 text-sm">
                    <Badge variant="outline" className="text-[10px] capitalize shrink-0">{i.tipo}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate">{i.resumen}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(i.fecha).toLocaleDateString("es")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  )
}
