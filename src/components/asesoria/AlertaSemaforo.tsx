import { cn } from "@/lib/utils"
import type { SemaforoColor } from "@/types/database.types"

interface AlertaSemaforoProps {
  nivel: SemaforoColor
  size?: "sm" | "md"
  showLabel?: boolean
}

const nivelConfig: Record<SemaforoColor, { label: string; classes: string; dot: string }> = {
  verde:    { label: "Al día",     classes: "bg-success/10 text-success border-success/20",   dot: "bg-success" },
  amarillo: { label: "Atención",   classes: "bg-warning/10 text-warning border-warning/20",   dot: "bg-warning" },
  rojo:     { label: "Urgente",    classes: "bg-danger/10  text-danger  border-danger/20",    dot: "bg-danger animate-pulse" },
}

export function AlertaSemaforo({ nivel, size = "md", showLabel = true }: AlertaSemaforoProps) {
  const cfg = nivelConfig[nivel]
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border font-medium",
      size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
      cfg.classes
    )}>
      <span className={cn("rounded-full shrink-0", size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2", cfg.dot)} />
      {showLabel && cfg.label}
    </span>
  )
}
