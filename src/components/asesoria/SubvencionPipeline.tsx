import { useState } from "react"
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragOverEvent, type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Calendar, Euro } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { Subvencion, SubvencionEstado } from "@/types/database.types"

// ─── Columnas del pipeline ────────────────────────────────────
const COLUMNAS: { id: SubvencionEstado; label: string; color: string; headerClass: string }[] = [
  { id: "identificada",  label: "Identificada",  color: "border-muted",           headerClass: "bg-muted/50 text-muted-foreground" },
  { id: "solicitud",     label: "Solicitud",     color: "border-primary/30",      headerClass: "bg-primary/10 text-primary" },
  { id: "documentacion", label: "Documentación", color: "border-warning/30",      headerClass: "bg-warning/10 text-warning" },
  { id: "justificacion", label: "Justificación", color: "border-primary/30",      headerClass: "bg-primary/10 text-primary" },
  { id: "cobrado",       label: "Cobrado ✓",     color: "border-success/30",      headerClass: "bg-success/10 text-success" },
  { id: "denegada",      label: "Denegada",      color: "border-danger/30",       headerClass: "bg-danger/10 text-danger" },
]

// ─── Tarjeta individual (sortable) ───────────────────────────
function SubvencionCard({ sub, isDragging = false }: { sub: Subvencion; isDragging?: boolean }) {
  const diasLimite = sub.fecha_limite
    ? Math.floor((new Date(sub.fecha_limite).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div className={cn(
      "rounded-lg border bg-card p-3 space-y-2 shadow-sm select-none",
      isDragging && "opacity-80 ring-2 ring-primary/40"
    )}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2 flex-1">
          {sub.nombre}
        </p>
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      </div>

      {sub.organismo && (
        <p className="text-xs text-muted-foreground truncate">{sub.organismo}</p>
      )}

      <div className="flex flex-wrap gap-2 text-xs">
        {sub.importe_solicitado > 0 && (
          <span className="flex items-center gap-1 text-foreground font-medium">
            <Euro className="h-3 w-3 text-success" />
            {sub.importe_solicitado.toLocaleString("es")}
          </span>
        )}
        {diasLimite !== null && (
          <span className={cn(
            "flex items-center gap-1",
            diasLimite < 0 ? "text-danger" : diasLimite <= 7 ? "text-warning" : "text-muted-foreground"
          )}>
            <Calendar className="h-3 w-3" />
            {diasLimite < 0 ? `Venció hace ${Math.abs(diasLimite)}d`
             : diasLimite === 0 ? "Hoy"
             : `${diasLimite}d`}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Tarjeta sortable con drag handle ────────────────────────
function SortableCard({ sub }: { sub: Subvencion }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sub.id,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SubvencionCard sub={sub} isDragging={isDragging} />
    </div>
  )
}

// ─── Columna del Kanban ───────────────────────────────────────
function Columna({
  items, label, color, headerClass,
}: {
  estado?: SubvencionEstado; items: Subvencion[]
  label: string; color: string; headerClass: string
}) {
  return (
    <div className={cn("flex flex-col rounded-xl border bg-muted/30 min-w-[220px] flex-1", color)}>
      {/* Header */}
      <div className={cn("flex items-center justify-between px-3 py-2.5 rounded-t-xl", headerClass)}>
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
        <Badge variant="secondary" className="text-xs h-5 px-1.5">{items.length}</Badge>
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1 min-h-[200px] max-h-[60vh]">
        <SortableContext items={items.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="p-2 space-y-2">
            {items.map((sub) => <SortableCard key={sub.id} sub={sub} />)}
            {items.length === 0 && (
              <div className="h-20 rounded-lg border-2 border-dashed border-border/50 flex items-center justify-center">
                <p className="text-xs text-muted-foreground">Sin subvenciones</p>
              </div>
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  )
}

// ─── Pipeline principal ───────────────────────────────────────
interface SubvencionPipelineProps {
  pipeline: Record<SubvencionEstado, Subvencion[]>
  onMover:  (id: string, nuevoEstado: SubvencionEstado) => Promise<void>
}

export function SubvencionPipeline({ pipeline, onMover }: SubvencionPipelineProps) {
  const [items, setItems]         = useState(pipeline)
  const [activeId, setActiveId]   = useState<string | null>(null)

  // Actualizar items cuando llegan datos frescos
  if (JSON.stringify(Object.keys(pipeline)) !== JSON.stringify(Object.keys(items))) {
    setItems(pipeline)
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function findContainerOf(id: string): SubvencionEstado | null {
    for (const [estado, subs] of Object.entries(items) as [SubvencionEstado, Subvencion[]][]) {
      if (subs.some((s) => s.id === id)) return estado
    }
    return null
  }

  function getActiveItem(): Subvencion | null {
    if (!activeId) return null
    for (const subs of Object.values(items)) {
      const found = subs.find((s) => s.id === activeId)
      if (found) return found
    }
    return null
  }

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return
    const activeContainer = findContainerOf(active.id as string)
    const overContainer   = (over.data.current?.sortable?.containerId ?? over.id) as SubvencionEstado

    if (!activeContainer || activeContainer === overContainer) return

    setItems((prev) => {
      const sub   = prev[activeContainer].find((s) => s.id === active.id)!
      return {
        ...prev,
        [activeContainer]: prev[activeContainer].filter((s) => s.id !== active.id),
        [overContainer]:   [...prev[overContainer], { ...sub, estado: overContainer }],
      }
    })
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over) return

    const nuevoEstado = findContainerOf(active.id as string)
    if (!nuevoEstado) return

    const originalEstado = Object.entries(pipeline).find(([, subs]) =>
      subs.some((s) => s.id === active.id)
    )?.[0] as SubvencionEstado | undefined

    if (originalEstado && originalEstado !== nuevoEstado) {
      try {
        await onMover(active.id as string, nuevoEstado)
      } catch {
        // Revertir en caso de error
        setItems(pipeline)
      }
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNAS.map(({ id, label, color, headerClass }) => (
          <Columna
            key={id}
            estado={id}
            items={items[id] ?? []}
            label={label}
            color={color}
            headerClass={headerClass}
          />
        ))}
      </div>

      <DragOverlay>
        {activeId && getActiveItem() && (
          <div className="w-[220px] rotate-1 scale-105">
            <SubvencionCard sub={getActiveItem()!} isDragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
