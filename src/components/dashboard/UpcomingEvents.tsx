import { Calendar, MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { Jornada } from "@/types/database.types"

interface UpcomingEventsProps {
  jornadas: Jornada[]
  loading?: boolean
}

const tipoLabel: Record<Jornada["tipo"], string> = {
  entrenamiento: "Entrenamiento",
  partido:       "Partido",
  concentracion: "Concentración",
  otro:          "Otro",
}

const tipoBadge: Record<Jornada["tipo"], string> = {
  entrenamiento: "bg-primary/10 text-primary",
  partido:       "bg-success/10 text-success",
  concentracion: "bg-warning/10 text-warning",
  otro:          "bg-muted text-muted-foreground",
}

export function UpcomingEvents({ jornadas, loading }: UpcomingEventsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Próximos eventos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))
        ) : jornadas.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sin eventos próximos</p>
        ) : (
          jornadas.slice(0, 5).map((j) => {
            const fecha = new Date(j.fecha)
            return (
              <div key={j.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center justify-center rounded-lg bg-muted w-10 h-10 shrink-0 text-center">
                  <span className="text-xs font-bold text-foreground leading-none">
                    {fecha.getDate()}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase">
                    {fecha.toLocaleString("es", { month: "short" })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground truncate">
                      {j.rival ?? tipoLabel[j.tipo]}
                    </span>
                    <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", tipoBadge[j.tipo])}>
                      {tipoLabel[j.tipo]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {j.lugar && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {j.lugar}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {fecha.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
