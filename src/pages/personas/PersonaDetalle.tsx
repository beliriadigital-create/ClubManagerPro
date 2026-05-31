import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { ArrowLeft, Edit, Trash2, QrCode } from "lucide-react"
import { usePersona, useUpdatePersona, useDeletePersona } from "@/hooks/usePersonas"
import { useClub } from "@/providers/ClubProvider"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { PersonaForm } from "@/components/personas/PersonaForm"
import { QRCard } from "@/components/personas/QRCard"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import type { PersonaInsert } from "@/types/database.types"

export function PersonaDetalle() {
  const { id = "" }     = useParams()
  const navigate        = useNavigate()
  const { currentClub } = useClub()
  const clubId          = currentClub?.id ?? ""

  const { data: persona, isLoading } = usePersona(clubId, id)
  const updatePersona = useUpdatePersona(clubId)
  const deletePersona = useDeletePersona(clubId)

  const [showEdit, setShowEdit]       = useState(false)
  const [showQR, setShowQR]           = useState(false)
  const [showDelete, setShowDelete]   = useState(false)

  if (isLoading) return <PageLoader />
  if (!persona) return (
    <PageWrapper title="Persona no encontrada">
      <Button asChild variant="outline"><Link to="/personas">Volver</Link></Button>
    </PageWrapper>
  )

  const p = persona!
  const initials = `${p.nombre[0]}${p.apellidos[0]}`.toUpperCase()

  async function handleUpdate(data: PersonaInsert) {
    await updatePersona.mutateAsync({ id: p.id, ...data })
    toast.success("Persona actualizada")
    setShowEdit(false)
  }

  async function handleDelete() {
    await deletePersona.mutateAsync(p.id)
    toast.success("Persona eliminada")
    navigate("/personas")
  }

  return (
    <PageWrapper
      title={`${persona.nombre} ${persona.apellidos}`}
      description={persona.tipo}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowQR(true)}>
            <QrCode className="h-4 w-4 mr-2" />Carnet
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
            <Edit className="h-4 w-4 mr-2" />Editar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowDelete(true)}
            className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/personas"><ArrowLeft className="h-4 w-4 mr-2" />Volver</Link>
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ficha */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-start gap-5 p-5 rounded-xl border border-border bg-card">
            <Avatar className="h-20 w-20 rounded-xl shrink-0">
              <AvatarImage src={persona.foto_url ?? undefined} />
              <AvatarFallback className="rounded-xl text-2xl bg-muted font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="capitalize">{persona.tipo}</Badge>
                <Badge variant="outline" className="capitalize">{persona.estado}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                {persona.dni && <Info label="DNI/NIE" value={persona.dni} />}
                {persona.fecha_nacimiento && <Info label="F. nacimiento" value={new Date(persona.fecha_nacimiento).toLocaleDateString("es")} />}
                {persona.email && <Info label="Email" value={persona.email} />}
                {persona.telefono && <Info label="Teléfono" value={persona.telefono} />}
                {persona.numero_licencia && <Info label="Licencia" value={persona.numero_licencia} />}
              </div>
            </div>
          </div>
        </div>

        {/* QR preview */}
        <div className="flex flex-col items-center gap-3 p-5 rounded-xl border border-border bg-card">
          <p className="text-sm font-medium text-muted-foreground">Carnet digital</p>
          {currentClub && <QRCard persona={persona} club={currentClub} />}
        </div>
      </div>

      {/* Sheet edición */}
      <Sheet open={showEdit} onOpenChange={setShowEdit}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader><SheetTitle>Editar persona</SheetTitle></SheetHeader>
          <div className="mt-4">
            <PersonaForm
              clubId={clubId}
              defaultValues={persona}
              onSubmit={handleUpdate}
              onCancel={() => setShowEdit(false)}
              isLoading={updatePersona.isPending}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog QR */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Carnet de identificación</DialogTitle></DialogHeader>
          {currentClub && <QRCard persona={persona} club={currentClub} />}
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title={`¿Eliminar a ${persona.nombre} ${persona.apellidos}?`}
        description="Esta acción no se puede deshacer. Se eliminarán todos sus registros asociados."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </PageWrapper>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  )
}
