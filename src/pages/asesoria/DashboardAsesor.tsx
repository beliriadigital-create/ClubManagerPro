import { useState } from "react"
import { Search, RefreshCw, TrendingUp, AlertTriangle, CheckCircle2, FileDown } from "lucide-react"
import { useDashboard360 } from "@/hooks/useAsesoria"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { ClubCard360 } from "@/components/asesoria/ClubCard360"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { EmptyState } from "@/components/shared/EmptyState"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { downloadPdf } from "@/lib/pdf-service"
import { toast } from "sonner"
import type { SemaforoColor } from "@/types/database.types"

type Filtro = "todos" | SemaforoColor

export function DashboardAsesor() {
  const { data: clubs = [], isLoading, refetch, isFetching } = useDashboard360()
  const [search, setSearch]     = useState("")
  const [filtro, setFiltro]     = useState<Filtro>("todos")
  const [exporting, setExporting] = useState(false)

  const filtrados = clubs.filter((c) => {
    const matchSearch = c.nombre.toLowerCase().includes(search.toLowerCase())
    const matchFiltro = filtro === "todos" || c.semaforo === filtro
    return matchSearch && matchFiltro
  })

  const rojos     = clubs.filter((c) => c.semaforo === "rojo").length
  const amarillos = clubs.filter((c) => c.semaforo === "amarillo").length
  const verdes    = clubs.filter((c) => c.semaforo === "verde").length
  const totalSubs = clubs.reduce((a, c) => a + c.subvenciones_activas, 0)

  async function exportarInformePDF() {
    setExporting(true)
    try {
      const doc  = await PDFDocument.create()
      const font = await doc.embedFont(StandardFonts.HelveticaBold)
      const mono = await doc.embedFont(StandardFonts.Courier)

      let page   = doc.addPage([595, 842]) // A4
      const { width, height } = page.getSize()
      let y = height - 50

      const azul  = rgb(0.1, 0.22, 0.54)
      const gris  = rgb(0.4, 0.4, 0.4)
      const negro = rgb(0, 0, 0)

      // Cabecera
      page.drawRectangle({ x: 0, y: height - 60, width, height: 60, color: azul })
      page.drawText("INFORME DE SITUACIÓN — PANEL DE ASESORÍA", {
        x: 30, y: height - 38, size: 14, font, color: rgb(1,1,1),
      })
      page.drawText(new Date().toLocaleDateString("es-ES", { day:"2-digit", month:"long", year:"numeric" }), {
        x: 30, y: height - 52, size: 9, font: mono, color: rgb(0.8, 0.8, 0.8),
      })

      y = height - 90

      // KPIs resumen
      const kpis = [
        { label: "Clubes en rojo",     value: rojos.toString(),     col: rgb(0.85,0.1,0.1) },
        { label: "Requieren atención", value: amarillos.toString(), col: rgb(0.85,0.6,0.1) },
        { label: "Al día",             value: verdes.toString(),    col: rgb(0.1,0.65,0.3) },
        { label: "Subvenciones vivas", value: totalSubs.toString(), col: azul },
      ]
      kpis.forEach(({ label, value, col }, i) => {
        const bx = 30 + i * 130
        page.drawRectangle({ x: bx, y: y - 40, width: 120, height: 40, color: col, opacity: 0.1, borderColor: col, borderWidth: 1 })
        page.drawText(value, { x: bx + 8, y: y - 18, size: 18, font, color: col })
        page.drawText(label,  { x: bx + 8, y: y - 34, size: 7, font: mono, color: gris })
      })

      y -= 70

      // Tabla de clubs
      page.drawText("DETALLE POR CLUB", { x: 30, y, size: 10, font, color: azul })
      y -= 16

      // Cabecera tabla
      page.drawRectangle({ x: 30, y: y - 14, width: width - 60, height: 14, color: azul })
      page.drawText("CLUB",              { x: 36,  y: y - 11, size: 7, font, color: rgb(1,1,1) })
      page.drawText("SEMÁFORO",          { x: 230, y: y - 11, size: 7, font, color: rgb(1,1,1) })
      page.drawText("PERSONAS",          { x: 310, y: y - 11, size: 7, font, color: rgb(1,1,1) })
      page.drawText("TAREAS",            { x: 370, y: y - 11, size: 7, font, color: rgb(1,1,1) })
      page.drawText("OBLIG. VENC.",      { x: 420, y: y - 11, size: 7, font, color: rgb(1,1,1) })
      page.drawText("SUBVENCIONES",      { x: 490, y: y - 11, size: 7, font, color: rgb(1,1,1) })
      y -= 20

      for (const club of clubs) {
        if (y < 60) {
          page = doc.addPage([595, 842])
          y = height - 40
        }

        const rowH = 18
        const even = clubs.indexOf(club) % 2 === 0
        if (even) page.drawRectangle({ x: 30, y: y - rowH + 4, width: width - 60, height: rowH, color: rgb(0.96, 0.97, 1) })

        const semaforoStr = club.semaforo === "rojo" ? "🔴 URGENTE" : club.semaforo === "amarillo" ? "🟡 ATENCIÓN" : "🟢 OK"
        const sColor = club.semaforo === "rojo" ? rgb(0.85,0.1,0.1) : club.semaforo === "amarillo" ? rgb(0.85,0.6,0.1) : rgb(0.1,0.65,0.3)
        const nombre = club.nombre.length > 28 ? club.nombre.slice(0, 27) + "…" : club.nombre

        page.drawText(nombre,                         { x: 36,  y: y - 10, size: 8, font: mono, color: negro })
        page.drawText(semaforoStr,                    { x: 230, y: y - 10, size: 7, font: mono, color: sColor })
        page.drawText(club.total_personas.toString(), { x: 310, y: y - 10, size: 8, font: mono, color: negro })
        page.drawText(club.tareas_pendientes.toString(), { x: 370, y: y - 10, size: 8, font: mono, color: negro })
        page.drawText(club.obligaciones_vencidas.toString(), { x: 420, y: y - 10, size: 8, font: mono, color: club.obligaciones_vencidas > 0 ? rgb(0.85,0.1,0.1) : negro })
        page.drawText(club.subvenciones_activas.toString(),  { x: 490, y: y - 10, size: 8, font: mono, color: negro })

        y -= rowH + 2
      }

      // Pie de página
      const pages = doc.getPages()
      pages.forEach((p, idx) => {
        p.drawText(`Página ${idx + 1} de ${pages.length}  |  Generado por ClubManager Pro`, {
          x: 30, y: 20, size: 7, font: mono, color: gris,
        })
      })

      const bytes = await doc.save()
      const fname = `informe-asesoria-${new Date().toISOString().slice(0,10)}.pdf`
      downloadPdf(bytes, fname)
      toast.success("Informe exportado correctamente")
    } catch (err) {
      console.error(err)
      toast.error("Error al generar el informe PDF")
    } finally {
      setExporting(false)
    }
  }

  if (isLoading) return <PageLoader />

  return (
    <PageWrapper
      title="Panel de Asesoría"
      description={`${clubs.length} club${clubs.length !== 1 ? "es" : ""} bajo gestión`}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportarInformePDF} disabled={exporting || clubs.length === 0}>
            <FileDown className={`h-4 w-4 mr-2 ${exporting ? "animate-pulse" : ""}`} />
            {exporting ? "Generando…" : "Exportar PDF"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard label="Clubes urgentes"    value={rojos}     icon={AlertTriangle} colorClass="text-danger"  />
          <StatsCard label="Requieren atención" value={amarillos} icon={AlertTriangle} colorClass="text-warning" />
          <StatsCard label="Al día"             value={verdes}    icon={CheckCircle2}  colorClass="text-success" />
          <StatsCard label="Subvenciones vivas" value={totalSubs} icon={TrendingUp}    colorClass="text-primary" />
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar club…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
            <TabsList>
              <TabsTrigger value="todos">Todos ({clubs.length})</TabsTrigger>
              <TabsTrigger value="rojo" className="data-[state=active]:text-danger">
                Urgente ({rojos})
              </TabsTrigger>
              <TabsTrigger value="amarillo" className="data-[state=active]:text-warning">
                Atención ({amarillos})
              </TabsTrigger>
              <TabsTrigger value="verde" className="data-[state=active]:text-success">
                OK ({verdes})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Grid de clubs */}
        {filtrados.length === 0 ? (
          <EmptyState
            title="Sin clubes"
            description={search ? "No hay clubs que coincidan con tu búsqueda" : "No tienes clubs asignados"}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtrados.map((club) => (
              <ClubCard360 key={club.id} club={club} />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
