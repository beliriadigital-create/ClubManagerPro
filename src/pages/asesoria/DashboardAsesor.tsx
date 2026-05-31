import { PageWrapper } from "@/components/layout/PageWrapper"
import { useClub } from "@/providers/ClubProvider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2 } from "lucide-react"

export function DashboardAsesor() {
  const { clubs } = useClub()

  return (
    <PageWrapper
      title="Panel de Asesoría"
      description="Vista global de todos los clubes gestionados"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clubs.map((club) => (
          <Card key={club.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">{club.nombre}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{club.cif ?? "Sin CIF"}</p>
            </CardContent>
          </Card>
        ))}
        {clubs.length === 0 && (
          <div className="col-span-3 flex items-center justify-center h-48 rounded-lg border-2 border-dashed border-border">
            <p className="text-muted-foreground text-sm">No hay clubes asignados</p>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
