import { PageWrapper } from "@/components/layout/PageWrapper"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function Equipos() {
  return (
    <PageWrapper
      title="Equipos"
      description="Gestiona los equipos del club"
      actions={
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo equipo
        </Button>
      }
    >
      <div className="flex items-center justify-center h-48 rounded-lg border-2 border-dashed border-border">
        <p className="text-muted-foreground text-sm">Los equipos aparecerán aquí</p>
      </div>
    </PageWrapper>
  )
}
