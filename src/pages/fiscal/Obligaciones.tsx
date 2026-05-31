import { useState } from "react"
import { CalendarDays, CheckCircle2, Clock, XCircle, Plus, Upload } from "lucide-react"
import { useClub } from "@/providers/ClubProvider"
import { useObligaciones, useUpdateEstadoObligacion, useEjercicios } from "@/hooks/useFiscal"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { FileUploader } from "@/components/shared/FileUploader"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { EmptyState } from "@/components/shared/EmptyState"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { ObligacionFiscal, ObligacionEstado } from "@/types/database.types"

function diasRestantes(fecha: string) {
  return Math.floor((new Date(fecha).getTime() - Date.now()) / 86400000)
}

function semaforoObligacion(o: ObligacionFiscal): "rojo" | "amarillo" | "verde" {
  if (o.estado === "presentado") return "verde"
  const dias = diasRestantes(o.fecha_vencimiento)
  if (o.estado === "vencido" || dias < 0) return "rojo"
  if (dias <= 3)  return "rojo"
  if (dias <= 7)  return "amarillo"
  return "verde"
}

const semColors = {
  rojo:    "border-danger/30 bg-danger/5",
  amarillo:"border-warning/30 bg-warning/5",
  verde:   "border-success/30 bg-success/5",
}

const estadoIcon: Record<ObligacionEstado, React.ElementType> = {
  pendiente:  Clock,
  presentado: CheckCircle2,
  vencido:    XCircle,
  no_aplica:  CheckCircle2,
}

const estadoColor: Record<ObligacionEstado, string> = {
  pendiente:  "text-warning",
  presentado: "text-success",
  vencido:    "text-danger",
  no_aplica:  "text-muted-foreground",
}

export function Obligaciones() {
  const { currentClub }     = useClub()
  const clubId              = currentClub?.id ?? ""

  const { data: ejercicios = [] }     = useEjercicios(clubId)
  const [ejercicioId, setEjercicioId] = useState<string | undefined>()
  const { data: obligaciones = [], isLoading } = useObligaciones({ clubId, ejercicioId })
  const updateEstado = useUpdateEstadoObligacion(clubId)

  const [uploading, setUploading] = useState<ObligacionFiscal | null>(null)

  async function marcarPresentada(o: ObligacionFiscal, fileUrl?: string) {
    await updateEstado.mutateAsync({ id: o.id, estado: "presentado", file_url: fileUrl })
    toast.success(`"${o.nombre}" marcada como presentada`)
  }

  if (isLoading) return <PageLoader />

  // Ordenar: vencidas primero, luego por fecha
  const ordenadas = [...obligaciones].sort((a, b) => {
    const pa = semaforoObligacion(a) === "rojo" ? 0 : semaforoObligacion(a) === "amarillo" ? 1 : 2
    const pb = semaforoObligacion(b) === "rojo" ? 0 : semaforoObligacion(b) === "amarillo" ? 1 : 2
    if (pa !== pb) return pa - pb
    return new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime()
  })

  return (
    <PageWrapper
      title="Obligaciones fiscales"
      description="Calendario de vencimientos tributarios"
      actions={
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />Nueva obligación
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Filtro por ejercicio */}
        {ejercicios.length > 0 && (
          <div className="flex items-center gap-3">
            <Select
              value={ejercicioId ?? "todos"}
              onValueChange={(v) => setEjercicioId(v === "todos" ? undefined : v)}
            >
              <SelectTrigger className="w-[180px]">
                <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Ejercicio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los ejercicios</SelectItem>
                {ejercicios.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.anio}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{obligaciones.length} obligaciones</span>
          </div>
        )}

        {/* Lista */}
        {ordenadas.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Sin obligaciones registradas"
            description="Añade las obligaciones fiscales del ejercicio para hacer el seguimiento."
          />
        ) : (
          <div className="space-y-3">
            {ordenadas.map((o) => {
              const semaforo = semaforoObligacion(o)
              const dias     = diasRestantes(o.fecha_vencimiento)
              const Icon     = estadoIcon[o.estado]

              return (
                <Card
                  key={o.id}
                  className={cn("border transition-shadow hover:shadow-sm", semColors[semaforo])}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", estadoColor[o.estado])} />
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">{o.nombre}</p>
                          {o.descripcion && (
                            <p className="text-sm text-muted-foreground mt-0.5 truncate">{o.descripcion}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {new Date(o.fecha_vencimiento).toLocaleDateString("es")}
                            </span>
                            {o.importe && (
                              <span className="font-medium text-foreground">
                                {o.importe.toLocaleString("es", { style: "currency", currency: "EUR" })}
                              </span>
                            )}
                            <Badge variant="outline" className="capitalize text-[10px]">
                              {o.frecuencia}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {/* Días restantes */}
                        <span className={cn(
                          "text-sm font-semibold",
                          semaforo === "rojo" ? "text-danger" : semaforo === "amarillo" ? "text-warning" : "text-success"
                        )}>
                          {o.estado === "presentado" ? "✓ Presentada"
                           : o.estado === "no_aplica" ? "No aplica"
                           : dias < 0 ? `Vencida hace ${Math.abs(dias)}d`
                           : dias === 0 ? "Vence hoy"
                           : `${dias} días`}
                        </span>

                        {/* Acciones */}
                        {o.estado === "pendiente" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 gap-1"
                              onClick={() => setUploading(o)}
                            >
                              <Upload className="h-3 w-3" />Subir doc.
                            </Button>
                            <Button
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => marcarPresentada(o)}
                              disabled={updateEstado.isPending}
                            >
                              Marcar presentada
                            </Button>
                          </div>
                        )}
                        {o.file_url && (
                          <a
                            href={o.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            Ver justificante
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Dialog subir justificante */}
      <Dialog open={!!uploading} onOpenChange={(open) => !open && setUploading(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Subir justificante — {uploading?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FileUploader
              clubId={clubId}
              categoria="fiscal"
              accept=".pdf,.jpg,.png"
              onUploaded={(url) => {
                if (uploading) {
                  marcarPresentada(uploading, url)
                  setUploading(null)
                }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  )
}
