import { useParams } from "react-router-dom"
import { PageWrapper } from "@/components/layout/PageWrapper"

export function PersonaDetalle() {
  const { id } = useParams()
  return (
    <PageWrapper title="Detalle de persona" description={`ID: ${id}`}>
      <div className="flex items-center justify-center h-48 rounded-lg border-2 border-dashed border-border">
        <p className="text-muted-foreground text-sm">Información de la persona</p>
      </div>
    </PageWrapper>
  )
}
