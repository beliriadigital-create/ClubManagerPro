import { useState } from "react"
import { Users, Plus, Shield, ChevronRight } from "lucide-react"
import { useClub } from "@/providers/ClubProvider"
import { useEquipos, useCreateEquipo } from "@/hooks/useEquipos"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import type { EquipoInsert } from "@/types/database.types"

const CATEGORIAS = ["benjamin","alevin","infantil","cadete","juvenil","senior","veteranos"] as const

export function Equipos() {
  const { currentClub } = useClub()
  const clubId = currentClub?.id ?? ""

  const { data: equipos = [], isLoading } = useEquipos(clubId)
  const createEquipo = useCreateEquipo(clubId)

  const [showNew, setShowNew] = useState(false)
  const [nombre, setNombre]   = useState("")
  const [categoria, setCategoria] = useState("")

  if (isLoading) return <PageLoader />

  async function handleCreate() {
    if (!nombre.trim()) return
    const payload: EquipoInsert = {
      club_id:      clubId,
      nombre:       nombre.trim(),
      categoria:    categoria || "senior",
      temporada_id: null,
      color_eq:     null,
    }
    await createEquipo.mutateAsync(payload)
    toast.success("Equipo creado")
    setShowNew(false)
    setNombre("")
    setCategoria("")
  }

  return (
    <PageWrapper
      title="Equipos"
      description={`${equipos.length} equipo${equipos.length !== 1 ? "s" : ""} registrado${equipos.length !== 1 ? "s" : ""}`}
      actions={
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4 mr-2" />Nuevo equipo
        </Button>
      }
    >
      {equipos.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="Sin equipos"
          description="Crea el primer equipo del club para gestionar sus jugadores y jornadas."
          action={
            <Button size="sm" onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4 mr-2" />Nuevo equipo
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipos.map((equipo) => (
            <Card key={equipo.id} className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-xl bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors shrink-0">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{equipo.nombre}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {equipo.categoria && (
                      <Badge variant="secondary" className="text-xs capitalize">{equipo.categoria}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />0 jugadores
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Nuevo equipo</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre del equipo *</Label>
              <Input
                placeholder="Ej. Cadete A"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!nombre.trim() || createEquipo.isPending}>
              {createEquipo.isPending ? "Creando…" : "Crear equipo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  )
}
