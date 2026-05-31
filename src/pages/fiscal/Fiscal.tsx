import { Link } from "react-router-dom"
import { FileText, CalendarDays, AlertTriangle, CheckCircle2 } from "lucide-react"
import { useClub } from "@/providers/ClubProvider"
import { useObligacionesAlerta, useEjercicios } from "@/hooks/useFiscal"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function Fiscal() {
  const { currentClub }     = useClub()
  const clubId              = currentClub?.id ?? ""
  const { data: alertas = [], isLoading } = useObligacionesAlerta(clubId)
  const { data: ejercicios = [] }         = useEjercicios(clubId)

  const vencidas  = alertas.filter((o) => o.estado === "vencido").length
  const proximas  = alertas.filter((o) => o.estado === "pendiente").length

  return (
    <PageWrapper
      title="Fiscal"
      description="Gestión fiscal y tributaria del club"
      actions={
        <Button size="sm" asChild>
          <Link to="/fiscal/obligaciones">Ver todas las obligaciones</Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Resumen */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm text-muted-foreground">Ejercicios</CardTitle>
              <CalendarDays className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{ejercicios.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {ejercicios.find((e) => e.estado === "abierto") ? "1 abierto" : "Todos cerrados"}
              </p>
            </CardContent>
          </Card>
          <Card className={vencidas > 0 ? "border-danger/40 bg-danger/5" : ""}>
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm text-muted-foreground">Vencidas</CardTitle>
              <AlertTriangle className={cn("h-4 w-4", vencidas > 0 ? "text-danger" : "text-muted-foreground")} />
            </CardHeader>
            <CardContent>
              <p className={cn("text-2xl font-bold", vencidas > 0 ? "text-danger" : "text-foreground")}>
                {isLoading ? <Skeleton className="h-8 w-8" /> : vencidas}
              </p>
            </CardContent>
          </Card>
          <Card className={proximas > 0 ? "border-warning/40 bg-warning/5" : ""}>
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm text-muted-foreground">Próximas (30d)</CardTitle>
              <AlertTriangle className={cn("h-4 w-4", proximas > 0 ? "text-warning" : "text-muted-foreground")} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-8" /> : proximas}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm text-muted-foreground">Al día</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">
                {vencidas === 0 && proximas === 0 ? "✓" : "—"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Acceso rápido */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/fiscal/obligaciones">
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-xl bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Obligaciones fiscales</p>
                  <p className="text-sm text-muted-foreground">IVA/IGIC, modelos, seguros</p>
                </div>
                {(vencidas > 0 || proximas > 0) && (
                  <Badge className="ml-auto" variant="destructive">{vencidas + proximas}</Badge>
                )}
              </CardContent>
            </Card>
          </Link>
          <Card className="hover:shadow-md transition-shadow cursor-pointer group opacity-60">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-muted p-3">
                <CalendarDays className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Ejercicios fiscales</p>
                <p className="text-sm text-muted-foreground">Próximamente</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  )
}
