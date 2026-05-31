import { useState } from "react"
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Plus, GripVertical, Flag } from "lucide-react"
import { useClub } from "@/providers/ClubProvider"
import { useTareas, useMoverTarea, useCreateTarea } from "@/hooks/useTareas"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Tarea, TareaEstado, TareaPrioridad } from "@/types/database.types"

const COLUMNAS: { id: TareaEstado; label: string; color: string; headerClass: string }[] = [
  { id: "pendiente",   label: "Pendiente",   color: "border-muted",      headerClass: "bg-muted/50 text-muted-foreground" },
  { id: "en_progreso", label: "En progreso", color: "border-primary/30", headerClass: "bg-primary/10 text-primary" },
  { id: "completada",  label: "Completada",  color: "border-success/30", headerClass: "bg-success/10 text-success" },
  { id: "cancelada",   label: "Cancelada",   color: "border-danger/30",  headerClass: "bg-danger/10 text-danger" },
]

const PRIORIDAD_COLOR: Record<TareaPrioridad, string> = {
  baja:   "text-muted-foreground",
  media:  "text-warning",
  alta:   "text-danger",
  urgente:"text-danger",
}

function TareaCard({ tarea, isDragging = false }: { tarea: Tarea; isDragging?: boolean }) {
  return (
    <div className={cn(
      "rounded-lg border bg-card p-3 space-y-2 shadow-sm select-none",
      isDragging && "opacity-80 ring-2 ring-primary/40"
    )}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground leading-tight line-clamp-2 flex-1">{tarea.titulo}</p>
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      </div>
      {tarea.descripcion && (
        <p className="text-xs text-muted-foreground line-clamp-2">{tarea.descripcion}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn("flex items-center gap-1 text-xs font-medium", PRIORIDAD_COLOR[tarea.prioridad])}>
          <Flag className="h-3 w-3" />{tarea.prioridad}
        </span>
        {tarea.fecha_vencimiento && (
          <span className="text-xs text-muted-foreground">
            {new Date(tarea.fecha_vencimiento).toLocaleDateString("es")}
          </span>
        )}
      </div>
    </div>
  )
}

function SortableCard({ tarea }: { tarea: Tarea }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tarea.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TareaCard tarea={tarea} isDragging={isDragging} />
    </div>
  )
}

function Columna({
  estado, items, label, color, headerClass, onAdd,
}: {
  estado: TareaEstado; items: Tarea[]
  label: string; color: string; headerClass: string
  onAdd: (estado: TareaEstado) => void
}) {
  return (
    <div className={cn("flex flex-col rounded-xl border bg-muted/30 min-w-[220px] flex-1", color)}>
      <div className={cn("flex items-center justify-between px-3 py-2.5 rounded-t-xl", headerClass)}>
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="text-xs h-5 px-1.5">{items.length}</Badge>
          <button
            onClick={() => onAdd(estado)}
            className="ml-1 rounded p-0.5 hover:bg-black/10 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <ScrollArea className="flex-1 min-h-[200px] max-h-[60vh]">
        <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="p-2 space-y-2">
            {items.map((tarea) => <SortableCard key={tarea.id} tarea={tarea} />)}
            {items.length === 0 && (
              <div className="h-20 rounded-lg border-2 border-dashed border-border/50 flex items-center justify-center">
                <p className="text-xs text-muted-foreground">Sin tareas</p>
              </div>
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  )
}

export function Tareas() {
  const { currentClub } = useClub()
  const clubId = currentClub?.id ?? ""

  const { data: grouped, isLoading } = useTareas(clubId)
  const moverTarea   = useMoverTarea(clubId)
  const createTarea  = useCreateTarea(clubId)

  const [activeId, setActiveId]       = useState<string | null>(null)
  const [showNew, setShowNew]         = useState(false)
  const [newEstado, setNewEstado]     = useState<TareaEstado>("pendiente")
  const [titulo, setTitulo]           = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [prioridad, setPrioridad]     = useState<TareaPrioridad>("media")

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  if (isLoading) return <PageLoader />

  const items = grouped ?? { pendiente: [], en_progreso: [], completada: [], cancelada: [] }

  function getActiveTask(): Tarea | null {
    if (!activeId) return null
    for (const col of Object.values(items)) {
      const found = col.find((t) => t.id === activeId)
      if (found) return found
    }
    return null
  }

  function findContainer(id: string): TareaEstado | null {
    for (const [estado, col] of Object.entries(items) as [TareaEstado, Tarea[]][]) {
      if (col.some((t) => t.id === id)) return estado
    }
    return null
  }

  function onDragStart({ active }: DragStartEvent) { setActiveId(active.id as string) }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over || !grouped) return
    const from = findContainer(active.id as string)
    const to   = (over.data.current?.sortable?.containerId ?? over.id) as TareaEstado
    if (!from || from === to) return
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over || !grouped) return
    const nuevoEstado = (over.data.current?.sortable?.containerId ?? over.id) as TareaEstado
    const anteriorEstado = findContainer(active.id as string)
    if (!anteriorEstado || anteriorEstado === nuevoEstado) return
    const nuevoOrden = grouped[nuevoEstado]?.length ?? 0
    try {
      await moverTarea.mutateAsync({ id: active.id as string, nuevoEstado, nuevoOrden })
    } catch {
      toast.error("Error al mover la tarea")
    }
  }

  function openNew(estado: TareaEstado) {
    setNewEstado(estado)
    setShowNew(true)
  }

  async function handleCreate() {
    if (!titulo.trim()) return
    await createTarea.mutateAsync({
      club_id:     clubId,
      titulo:      titulo.trim(),
      descripcion: descripcion.trim() || null,
      estado:      newEstado,
      prioridad,
      orden:       items[newEstado]?.length ?? 0,
      asignado_a:  null,
      fecha_vencimiento: null,
    })
    toast.success("Tarea creada")
    setShowNew(false)
    setTitulo("")
    setDescripcion("")
    setPrioridad("media")
  }

  return (
    <PageWrapper
      title="Tareas"
      description="Tablero Kanban de tareas del club"
      actions={
        <Button size="sm" onClick={() => openNew("pendiente")}>
          <Plus className="h-4 w-4 mr-2" />Nueva tarea
        </Button>
      }
    >
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
              onAdd={openNew}
            />
          ))}
        </div>
        <DragOverlay>
          {activeId && getActiveTask() && (
            <div className="w-[220px] rotate-1 scale-105">
              <TareaCard tarea={getActiveTask()!} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Nueva tarea</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input
                placeholder="Describe la tarea"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Input
                placeholder="Detalles adicionales"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Columna</Label>
                <Select value={newEstado} onValueChange={(v) => setNewEstado(v as TareaEstado)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLUMNAS.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Prioridad</Label>
                <Select value={prioridad} onValueChange={(v) => setPrioridad(v as TareaPrioridad)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["baja","media","alta","urgente"] as TareaPrioridad[]).map((p) => (
                      <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!titulo.trim() || createTarea.isPending}>
              {createTarea.isPending ? "Creando…" : "Crear tarea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  )
}
