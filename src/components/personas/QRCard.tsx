import { useRef } from "react"
import { useReactToPrint } from "react-to-print"
import { Printer, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { Persona, Club } from "@/types/database.types"

interface QRCardProps {
  persona: Persona
  club:    Club
}

const tipoLabel: Record<Persona["tipo"], string> = {
  jugador:    "Jugador/a",
  entrenador: "Entrenador/a",
  directivo:  "Directivo/a",
  socio:      "Socio/a",
  staff:      "Staff",
  arbitro:    "Árbitro",
}

export function QRCard({ persona, club }: QRCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: cardRef,
    documentTitle: `Carnet_${persona.apellidos}_${persona.nombre}`,
  })

  const initials = `${persona.nombre[0]}${persona.apellidos[0]}`.toUpperCase()

  // QR URL: usa la API de qrserver (no requiere lib externa)
  const qrData    = encodeURIComponent(persona.qr_code ?? persona.id)
  const qrUrl     = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrData}`

  return (
    <div className="space-y-4">
      {/* Tarjeta imprimible */}
      <div ref={cardRef} className="w-[340px] rounded-2xl overflow-hidden border border-border shadow-md bg-card print:shadow-none print:border-0">
        {/* Header con color del club */}
        <div className="bg-primary h-2 w-full" />

        <div className="p-5">
          {/* Club header */}
          <div className="flex items-center gap-2 mb-4">
            <Avatar className="h-8 w-8">
              <AvatarImage src={club.logo_url ?? undefined} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                {club.nombre.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">{club.nombre}</p>
              {club.cif && <p className="text-[10px] text-muted-foreground">CIF: {club.cif}</p>}
            </div>
          </div>

          {/* Persona info + QR */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-16 w-16 rounded-xl shrink-0">
                <AvatarImage src={persona.foto_url ?? undefined} />
                <AvatarFallback className="rounded-xl text-lg bg-muted text-foreground font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base font-bold text-foreground leading-tight">
                  {persona.nombre}
                </p>
                <p className="text-base font-bold text-foreground leading-tight">
                  {persona.apellidos}
                </p>
                <Badge className="mt-1.5 text-xs" variant="secondary">
                  {tipoLabel[persona.tipo]}
                </Badge>
                {persona.numero_licencia && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Lic. {persona.numero_licencia}
                  </p>
                )}
              </div>
            </div>

            {/* QR Code */}
            <div className="shrink-0">
              <img
                src={qrUrl}
                alt="QR Code"
                width={80}
                height={80}
                className="rounded-lg"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
            <p className="text-[10px] text-muted-foreground">
              {persona.dni ? `DNI: ${persona.dni}` : `ID: ${persona.id.slice(0, 8)}`}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {new Date().getFullYear()}
            </p>
          </div>
        </div>

        <div className="bg-primary h-1 w-full" />
      </div>

      {/* Botones de acción */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Imprimir carnet
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => window.open(qrUrl.replace("120x120", "300x300"), "_blank")}
        >
          <Download className="h-4 w-4" />
          Descargar QR
        </Button>
      </div>
    </div>
  )
}
