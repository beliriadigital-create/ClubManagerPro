import { useState } from "react"
import { Search, RefreshCw, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react"
import { useDashboard360 } from "@/hooks/useAsesoria"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { ClubCard360 } from "@/components/asesoria/ClubCard360"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { EmptyState } from "@/components/shared/EmptyState"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { SemaforoColor } from "@/types/database.types"

type Filtro = "todos" | SemaforoColor

export function DashboardAsesor() {
  const { data: clubs = [], isLoading, refetch, isFetching } = useDashboard360()
  const [search, setSearch]   = useState("")
  const [filtro, setFiltro]   = useState<Filtro>("todos")

  const filtrados = clubs.filter((c) => {
    const matchSearch = c.nombre.toLowerCase().includes(search.toLowerCase())
    const matchFiltro = filtro === "todos" || c.semaforo === filtro
    return matchSearch && matchFiltro
  })

  // KPIs consolidados
  const rojos    = clubs.filter((c) => c.semaforo === "rojo").length
  const amarillos = clubs.filter((c) => c.semaforo === "amarillo").length
  const verdes   = clubs.filter((c) => c.semaforo === "verde").length
  const totalSubs = clubs.reduce((a, c) => a + c.subvenciones_activas, 0)

  if (isLoading) return <PageLoader />

  return (
    <PageWrapper
      title="Panel de Asesoría"
      description={`${clubs.length} club${clubs.length !== 1 ? "es" : ""} bajo gestión`}
      actions={
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      }
    >
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard label="Clubes urgentes"   value={rojos}    icon={AlertTriangle} colorClass="text-danger"  />
          <StatsCard label="Requieren atención" value={amarillos} icon={AlertTriangle} colorClass="text-warning" />
          <StatsCard label="Al día"             value={verdes}   icon={CheckCircle2}  colorClass="text-success" />
          <StatsCard label="Subvenciones vivas" value={totalSubs} icon={TrendingUp}    colorClass="text-primary" />
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar club…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
            <TabsList>
              <TabsTrigger value="todos">Todos ({clubs.length})</TabsTrigger>
              <TabsTrigger value="rojo" className="data-[state=active]:text-danger">
                Urgente ({rojos})
              </TabsTrigger>
              <TabsTrigger value="amarillo" className="data-[state=active]:text-warning">
                Atención ({amarillos})
              </TabsTrigger>
              <TabsTrigger value="verde" className="data-[state=active]:text-success">
                OK ({verdes})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Grid de clubs */}
        {filtrados.length === 0 ? (
          <EmptyState
            title="Sin clubes"
            description={search ? "No hay clubs que coincidan con tu búsqueda" : "No tienes clubs asignados"}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtrados.map((club) => (
              <ClubCard360 key={club.id} club={club} />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
