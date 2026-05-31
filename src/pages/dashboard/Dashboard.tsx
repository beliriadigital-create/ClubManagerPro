import { useClub } from "@/providers/ClubProvider"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Shield, CheckSquare, FileText } from "lucide-react"

const stats = [
  { label: "Personas", value: "—", icon: Users, color: "text-primary" },
  { label: "Equipos", value: "—", icon: Shield, color: "text-success" },
  { label: "Tareas pendientes", value: "—", icon: CheckSquare, color: "text-warning" },
  { label: "Obligaciones", value: "—", icon: FileText, color: "text-danger" },
]

export function Dashboard() {
  const { currentClub } = useClub()

  return (
    <PageWrapper
      title={currentClub ? `Bienvenido, ${currentClub.nombre}` : "Dashboard"}
      description="Resumen general del club"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageWrapper>
  )
}
