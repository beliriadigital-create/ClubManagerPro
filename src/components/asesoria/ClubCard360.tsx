import { useNavigate } from "react-router-dom"
import { Users, CheckSquare, FileText, TrendingUp, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertaSemaforo } from "@/components/asesoria/AlertaSemaforo"
import type { ClubDashboard360 } from "@/types/database.types"

interface ClubCard360Props {
  club: ClubDashboard360
}

export function ClubCard360({ club }: ClubCard360Props) {
  const navigate = useNavigate()
  const initials = club.nombre.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()

  return (
    <Card
      className="hover:shadow-md transition-all cursor-pointer group border-border"
      onClick={() => navigate(`/asesoria/club/${club.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={club.logo_url ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{club.nombre}</p>
              {club.cif && <p className="text-xs text-muted-foreground">{club.cif}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <AlertaSemaforo nivel={club.semaforo} size="sm" />
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-2">
          <Stat icon={Users}        value={club.total_personas}        label="Personas"    />
          <Stat icon={CheckSquare}  value={club.tareas_pendientes}     label="Tareas"
            urgent={club.tareas_pendientes > 5} />
          <Stat icon={FileText}     value={club.obligaciones_vencidas} label="Vencidas"
            urgent={club.obligaciones_vencidas > 0} />
        </div>

        {club.obligaciones_proximas > 0 && (
          <p className="text-xs text-warning mt-3 font-medium">
            ⚠ {club.obligaciones_proximas} obligación{club.obligaciones_proximas > 1 ? "es" : ""} próxima{club.obligaciones_proximas > 1 ? "s" : ""}
          </p>
        )}
        {club.subvenciones_activas > 0 && (
          <p className="text-xs text-primary mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {club.subvenciones_activas} subvención{club.subvenciones_activas > 1 ? "es" : ""} en curso
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function Stat({
  icon: Icon, value, label, urgent = false,
}: {
  icon: React.ElementType; value: number; label: string; urgent?: boolean
}) {
  return (
    <div className="text-center rounded-lg bg-muted/50 p-2">
      <Icon className={`h-3.5 w-3.5 mx-auto mb-1 ${urgent && value > 0 ? "text-danger" : "text-muted-foreground"}`} />
      <p className={`text-lg font-bold leading-none ${urgent && value > 0 ? "text-danger" : "text-foreground"}`}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}
