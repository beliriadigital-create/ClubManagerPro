import { useParams } from "react-router-dom"
import { PageWrapper } from "@/components/layout/PageWrapper"

export function Club360() {
  const { id } = useParams()
  return (
    <PageWrapper title="Club 360°" description={`Visión completa del club — ID: ${id}`}>
      <div className="flex items-center justify-center h-48 rounded-lg border-2 border-dashed border-border">
        <p className="text-muted-foreground text-sm">Vista 360° del club</p>
      </div>
    </PageWrapper>
  )
}
