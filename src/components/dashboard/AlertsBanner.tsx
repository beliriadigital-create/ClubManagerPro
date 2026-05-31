import { AlertTriangle, XCircle, X } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import type { ObligacionFiscal } from "@/types/database.types"

interface AlertsBannerProps {
  obligaciones: ObligacionFiscal[]
}

function diasRestantes(fecha: string): number {
  const hoy   = new Date(); hoy.setHours(0, 0, 0, 0)
  const vence = new Date(fecha)
  return Math.floor((vence.getTime() - hoy.getTime()) / 86400000)
}

export function AlertsBanner({ obligaciones }: AlertsBannerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const alertas = obligaciones
    .filter((o) => o.estado === "pendiente" || o.estado === "vencido")
    .filter((o) => !dismissed.has(o.id))
    .sort((a, b) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime())

  if (alertas.length === 0) return null

  return (
    <div className="space-y-2">
      {alertas.slice(0, 3).map((o) => {
        const dias  = diasRestantes(o.fecha_vencimiento)
        const nivel = o.estado === "vencido" || dias < 0 ? "rojo"
          : dias <= 3 ? "rojo" : dias <= 7 ? "amarillo" : "verde"

        if (nivel === "verde") return null

        return (
          <AlertItem
            key={o.id}
            nivel={nivel}
            nombre={o.nombre}
            dias={dias}
            onDismiss={() => setDismissed((s) => new Set(s).add(o.id))}
          />
        )
      })}
    </div>
  )
}

function AlertItem({
  nivel, nombre, dias, onDismiss,
}: {
  nivel: "rojo" | "amarillo"; nombre: string; dias: number; onDismiss: () => void
}) {
  const isRojo = nivel === "rojo"
  return (
    <div className={cn(
      "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm",
      isRojo
        ? "border-danger/30 bg-danger/10 text-danger"
        : "border-warning/30 bg-warning/10 text-warning"
    )}>
      {isRojo
        ? <XCircle className="h-4 w-4 shrink-0" />
        : <AlertTriangle className="h-4 w-4 shrink-0" />
      }
      <span className="flex-1 font-medium">
        {nombre}
        {" — "}
        {dias < 0
          ? `Vencida hace ${Math.abs(dias)} días`
          : dias === 0 ? "Vence hoy"
          : `Vence en ${dias} día${dias !== 1 ? "s" : ""}`
        }
      </span>
      <Link to="/fiscal/obligaciones" className="underline text-xs shrink-0">
        Ver
      </Link>
      <button onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
