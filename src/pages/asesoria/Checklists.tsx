import { PageWrapper } from "@/components/layout/PageWrapper"

export function Checklists() {
  return (
    <PageWrapper title="Checklists" description="Listas de verificación y auditoría">
      <div className="flex items-center justify-center h-48 rounded-lg border-2 border-dashed border-border">
        <p className="text-muted-foreground text-sm">Checklists de auditoría</p>
      </div>
    </PageWrapper>
  )
}
