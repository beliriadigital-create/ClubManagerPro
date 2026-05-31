import { PageWrapper } from "@/components/layout/PageWrapper"

export function Obligaciones() {
  return (
    <PageWrapper title="Obligaciones fiscales" description="Calendario de obligaciones tributarias">
      <div className="flex items-center justify-center h-48 rounded-lg border-2 border-dashed border-border">
        <p className="text-muted-foreground text-sm">Las obligaciones fiscales aparecerán aquí</p>
      </div>
    </PageWrapper>
  )
}
