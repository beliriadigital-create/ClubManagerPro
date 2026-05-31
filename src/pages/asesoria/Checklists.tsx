import { CheckSquare, Clock } from "lucide-react"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { EmptyState } from "@/components/shared/EmptyState"

export function Checklists() {
  return (
    <PageWrapper
      title="Checklists"
      description="Listas de verificación y auditoría de cumplimiento"
    >
      <EmptyState
        icon={CheckSquare}
        title="Checklists de cumplimiento"
        description="Próximamente podrás crear listas de verificación para auditorías, temporadas y obligaciones recurrentes."
        action={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Disponible en la próxima versión</span>
          </div>
        }
      />
    </PageWrapper>
  )
}
