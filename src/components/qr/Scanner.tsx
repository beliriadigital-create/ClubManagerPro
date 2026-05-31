import { useEffect, useRef, useState, useCallback } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { ScanLine, CheckCircle2, AlertCircle, Camera, CameraOff } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Persona, AsistenciaEstado } from "@/types/database.types"

interface ScannerProps {
  jornadaId:  string
  clubId:     string
  onAsistencia?: (persona: Persona, estado: AsistenciaEstado) => void
  className?: string
}

interface ScanResult {
  persona:  Persona
  estado:   "ok" | "ya_registrado" | "error"
  mensaje:  string
}

export function QRScanner({ jornadaId, clubId, onAsistencia, className }: ScannerProps) {
  const scannerRef    = useRef<Html5Qrcode | null>(null)
  const elementId     = "qr-scanner-element"
  const [active, setActive]     = useState(false)
  const [scanning, setScanning] = useState(false)
  const [result, setResult]     = useState<ScanResult | null>(null)
  const cooldownRef   = useRef(false)

  const procesarScan = useCallback(async (personaId: string) => {
    if (cooldownRef.current) return
    cooldownRef.current = true

    try {
      // Buscar persona
      const { data: persona, error: pErr } = await supabase
        .from("personas")
        .select("*")
        .eq("id", personaId)
        .eq("club_id", clubId)
        .single()

      if (pErr || !persona) {
        setResult({ persona: null as unknown as Persona, estado: "error", mensaje: "Persona no encontrada en este club." })
        return
      }

      const p = persona as unknown as Persona

      // Comprobar si ya existe asistencia
      const { data: existing } = await supabase
        .from("asistencias")
        .select("id")
        .eq("jornada_id", jornadaId)
        .eq("persona_id", personaId)
        .maybeSingle()

      if (existing) {
        setResult({ persona: p, estado: "ya_registrado", mensaje: "Asistencia ya registrada." })
        return
      }

      // Registrar asistencia
      const { error: insErr } = await supabase.from("asistencias").insert({
        jornada_id: jornadaId,
        persona_id: personaId,
        estado:     "presente" as AsistenciaEstado,
        fichado_en: new Date().toISOString(),
        lat_lng:    null,
        notas:      null,
      })

      if (insErr) throw insErr

      setResult({ persona: p, estado: "ok", mensaje: "Asistencia registrada ✓" })
      onAsistencia?.(p, "presente")
    } catch {
      setResult({ persona: null as unknown as Persona, estado: "error", mensaje: "Error al registrar asistencia." })
    } finally {
      // Cooldown 3s para evitar doble lectura
      setTimeout(() => { cooldownRef.current = false }, 3000)
    }
  }, [jornadaId, clubId, onAsistencia])

  async function iniciar() {
    setActive(true)
    setResult(null)
    const scanner = new Html5Qrcode(elementId)
    scannerRef.current = scanner

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => { procesarScan(decoded) },
        undefined,
      )
      setScanning(true)
    } catch {
      setActive(false)
      setScanning(false)
    }
  }

  async function detener() {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop()
      scannerRef.current.clear()
    }
    scannerRef.current = null
    setScanning(false)
    setActive(false)
  }

  useEffect(() => () => { detener() }, [])

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Visor */}
      <div className={cn(
        "relative w-full max-w-xs rounded-2xl overflow-hidden border-2",
        scanning ? "border-primary" : "border-border bg-muted",
      )}>
        <div id={elementId} className="w-full aspect-square" />
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted">
            <Camera className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Cámara apagada</p>
          </div>
        )}
        {scanning && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <ScanLine className="h-8 w-8 text-primary animate-bounce opacity-70" />
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="flex gap-3">
        {!scanning ? (
          <Button onClick={iniciar} size="sm">
            <Camera className="h-4 w-4 mr-2" />Iniciar escáner
          </Button>
        ) : (
          <Button onClick={detener} variant="outline" size="sm">
            <CameraOff className="h-4 w-4 mr-2" />Detener
          </Button>
        )}
      </div>

      {/* Resultado del último scan */}
      {result && (
        <div className={cn(
          "w-full max-w-xs rounded-xl border p-4 space-y-1",
          result.estado === "ok"            && "border-success/40 bg-success/5",
          result.estado === "ya_registrado" && "border-warning/40 bg-warning/5",
          result.estado === "error"         && "border-danger/40  bg-danger/5",
        )}>
          <div className="flex items-center gap-2">
            {result.estado === "ok" ? (
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
            ) : (
              <AlertCircle className={cn(
                "h-4 w-4 shrink-0",
                result.estado === "ya_registrado" ? "text-warning" : "text-danger",
              )} />
            )}
            {result.persona && (
              <p className="font-semibold text-sm text-foreground">
                {result.persona.nombre} {result.persona.apellidos}
              </p>
            )}
            <Badge
              variant="outline"
              className={cn(
                "ml-auto text-xs",
                result.estado === "ok"            && "text-success border-success/30",
                result.estado === "ya_registrado" && "text-warning border-warning/30",
                result.estado === "error"         && "text-danger  border-danger/30",
              )}
            >
              {result.estado === "ok" ? "OK" : result.estado === "ya_registrado" ? "Dup." : "Error"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground pl-6">{result.mensaje}</p>
        </div>
      )}
    </div>
  )
}
