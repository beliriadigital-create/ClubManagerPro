import { PageWrapper } from "@/components/layout/PageWrapper"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function Personas() {
  return (
    <PageWrapper
      title="Personas"
      description="Gestiona jugadores, entrenadores y staff"
      actions={
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nueva persona
        </Button>
      }
    >
      <div className="flex items-center justify-center h-48 rounded-lg border-2 border-dashed border-border">
        <p className="text-muted-foreground text-sm">El listado de personas aparecerá aquí</p>
      </div>
    </PageWrapper>
  )
}
