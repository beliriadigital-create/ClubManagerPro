import { useClub } from "@/providers/ClubProvider"
import { useSubvenciones, useUpdateSubvencion } from "@/hooks/useAsesoria"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { SubvencionPipeline } from "@/components/asesoria/SubvencionPipeline"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Button } from "@/components/ui/button"
import { Plus, TrendingUp, Euro } from "lucide-react"
import { toast } from "sonner"
import type { SubvencionEstado } from "@/types/database.types"

export function Subvenciones() {
  const { currentClub }     = useClub()
  const clubId              = currentClub?.id ?? ""

  const { data: subs = [], isLoading } = useSubvenciones(clubId)
  const updateSub = useUpdateSubvencion(clubId)

  // Agrupar en pipeline
  const pipeline = {
    identificada:  subs.filter((s) => s.estado === "identificada"),
    solicitud:     subs.filter((s) => s.estado === "solicitud"),
    documentacion: subs.filter((s) => s.estado === "documentacion"),
    justificacion: subs.filter((s) => s.estado === "justificacion"),
    cobrado:       subs.filter((s) => s.estado === "cobrado"),
    denegada:      subs.filter((s) => s.estado === "denegada"),
  }

  const totalSolicitado = subs.reduce((a, s) => a + s.importe_solicitado, 0)
  const totalCobrado    = subs.filter((s) => s.estado === "cobrado")
                             .reduce((a, s) => a + (s.importe_concedido ?? 0), 0)

  async function handleMover(id: string, nuevoEstado: SubvencionEstado) {
    await updateSub.mutateAsync({ id, estado: nuevoEstado })
    toast.success("Subvención movida a " + nuevoEstado)
  }

  if (isLoading) return <PageLoader />

  return (
    <PageWrapper
      title="Subvenciones"
      description="Pipeline de subvenciones y ayudas"
      actions={
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />Nueva subvención
        </Button>
      }
    >
      <div className="space-y-5">
        {/* KPIs rápidos */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span><strong className="text-foreground">{subs.length}</strong> subvenciones totales</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Euro className="h-4 w-4 text-warning" />
            <span>Solicitado: <strong className="text-foreground">
              {totalSolicitado.toLocaleString("es", { style: "currency", currency: "EUR" })}
            </strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Euro className="h-4 w-4 text-success" />
            <span>Cobrado: <strong className="text-foreground">
              {totalCobrado.toLocaleString("es", { style: "currency", currency: "EUR" })}
            </strong></span>
          </div>
        </div>

        {/* Kanban pipeline */}
        <SubvencionPipeline pipeline={pipeline} onMover={handleMover} />
      </div>
    </PageWrapper>
  )
}
