import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search, Filter, UserCheck, UserX, Users } from "lucide-react"
import { useClub } from "@/providers/ClubProvider"
import { usePersonas, useCreatePersona } from "@/hooks/usePersonas"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { PersonaForm } from "@/components/personas/PersonaForm"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { PersonaInsert, PersonaTipo, PersonaEstado } from "@/types/database.types"

const estadoBadge: Record<PersonaEstado, string> = {
  activo:     "bg-success/10 text-success border-success/20",
  inactivo:   "bg-muted text-muted-foreground border-border",
  suspendido: "bg-danger/10 text-danger border-danger/20",
}

const tipoLabel: Record<PersonaTipo, string> = {
  jugador:    "Jugador/a", entrenador: "Entrenador/a", directivo: "Directivo/a",
  socio:      "Socio/a",  staff:      "Staff",         arbitro:   "Árbitro",
}

export function Personas() {
  const navigate                = useNavigate()
  const { currentClub }         = useClub()
  const clubId                  = currentClub?.id ?? ""

  const [search, setSearch]     = useState("")
  const [tipoFiltro, setTipo]   = useState<PersonaTipo | "todos">("todos")
  const [showForm, setShowForm] = useState(false)

  const { data: personas = [], isLoading } = usePersonas({
    clubId,
    tipo:   tipoFiltro !== "todos" ? tipoFiltro : undefined,
    search: search.length >= 2    ? search      : undefined,
  })

  const createPersona = useCreatePersona(clubId)

  async function handleCreate(data: PersonaInsert) {
    await createPersona.mutateAsync(data)
    toast.success("Persona creada correctamente")
    setShowForm(false)
  }

  if (isLoading) return <PageLoader />

  return (
    <PageWrapper
      title="Personas"
      description={`${personas.length} registros`}
      actions={
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />Nueva persona
        </Button>
      }
    >
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, apellidos o email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={tipoFiltro} onValueChange={(v) => setTipo(v as PersonaTipo | "todos")}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {(Object.entries(tipoLabel) as [PersonaTipo, string][]).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      {personas.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin personas registradas"
          description="Añade jugadores, entrenadores o socios para empezar."
          action={
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />Añadir persona
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Persona</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Licencia</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personas.map((p) => {
                const initials = `${p.nombre[0]}${p.apellidos[0]}`.toUpperCase()
                return (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => navigate(`/personas/${p.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={p.foto_url ?? undefined} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {p.apellidos}, {p.nombre}
                          </p>
                          {p.dni && <p className="text-xs text-muted-foreground">{p.dni}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{tipoLabel[p.tipo]}</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {p.email && <p className="text-foreground">{p.email}</p>}
                        {p.telefono && <p className="text-muted-foreground text-xs">{p.telefono}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {p.numero_licencia ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-xs capitalize", estadoBadge[p.estado])}
                      >
                        {p.estado === "activo"
                          ? <><UserCheck className="h-3 w-3 mr-1" />Activo</>
                          : <><UserX className="h-3 w-3 mr-1" />{p.estado}</>
                        }
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog: nueva persona */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva persona</DialogTitle>
          </DialogHeader>
          <PersonaForm
            clubId={clubId}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            isLoading={createPersona.isPending}
          />
        </DialogContent>
      </Dialog>
    </PageWrapper>
  )
}
