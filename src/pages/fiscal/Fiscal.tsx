import { PageWrapper } from "@/components/layout/PageWrapper"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export function Fiscal() {
  return (
    <PageWrapper
      title="Fiscal"
      description="Gestión fiscal y tributaria del club"
      actions={
        <Button size="sm" asChild>
          <Link to="/fiscal/obligaciones">Ver obligaciones</Link>
        </Button>
      }
    >
      <div className="flex items-center justify-center h-48 rounded-lg border-2 border-dashed border-border">
        <p className="text-muted-foreground text-sm">Resumen fiscal aparecerá aquí</p>
      </div>
    </PageWrapper>
  )
}
