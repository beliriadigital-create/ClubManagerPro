import html2canvas from "html2canvas"

// ─── Tipos de mensajes preformateados ────────────────────────
export interface ConvocatoriaData {
  clubNombre:     string
  equipoNombre:   string
  tipoEvento:     string   // "Partido" | "Entrenamiento" | "Concentración"
  fecha:          string
  hora:           string
  lugar:          string
  jugadores:      string[]
  observaciones?: string
}

export interface SituacionClubData {
  clubNombre:           string
  fecha:                string
  personasActivas:      number
  tareasPendientes:     number
  obligacionesVencidas: number
  subvencionesActivas:  number
  semaforo:             "verde" | "amarillo" | "rojo"
}

// ─── Generación de mensajes ──────────────────────────────────

export function mensajeConvocatoria(data: ConvocatoriaData): string {
  const lineas = [
    `🏆 *CONVOCATORIA — ${data.clubNombre.toUpperCase()}*`,
    ``,
    `■ *Equipo:* ${data.equipoNombre}`,
    `■ *Evento:* ${data.tipoEvento}`,
    `■ *Fecha:*  ${data.fecha}`,
    `■ *Hora:*   ${data.hora}`,
    `■ *Lugar:*  ${data.lugar}`,
    ``,
    `📋 *CONVOCADOS (${data.jugadores.length}):*`,
    ...data.jugadores.map((j, i) => `   ${i + 1}. ${j}`),
  ]

  if (data.observaciones) {
    lineas.push(``, `📌 *Observaciones:*`, data.observaciones)
  }

  lineas.push(``, `_Mensaje generado por ClubManager Pro_`)
  return lineas.join("\n")
}

export function mensajeSituacionClub(data: SituacionClubData): string {
  const emoji = data.semaforo === "verde" ? "🟢" : data.semaforo === "amarillo" ? "🟡" : "🔴"
  return [
    `${emoji} *INFORME DE SITUACIÓN — ${data.clubNombre.toUpperCase()}*`,
    `📅 ${data.fecha}`,
    ``,
    `■■■■ RESUMEN EJECUTIVO ■■■■`,
    ``,
    `👥 Personas activas:        ${data.personasActivas}`,
    `✅ Tareas pendientes:       ${data.tareasPendientes}`,
    `📄 Obligaciones vencidas:   ${data.obligacionesVencidas}`,
    `💶 Subvenciones activas:    ${data.subvencionesActivas}`,
    ``,
    `Estado general: ${emoji} ${data.semaforo.toUpperCase()}`,
    ``,
    `_Informe generado por ClubManager Pro_`,
  ].join("\n")
}

// ─── Generación de enlace wa.me ──────────────────────────────

/**
 * Devuelve un enlace `https://wa.me/?text=...` con el texto codificado.
 * Si se pasa un número de teléfono, genera `https://wa.me/34XXXXXXXXX?text=...`
 */
export function generarEnlaceWhatsApp(texto: string, telefono?: string): string {
  const encoded = encodeURIComponent(texto)
  if (telefono) {
    const digits = telefono.replace(/\D/g, "")
    const num    = digits.startsWith("34") ? digits : `34${digits}`
    return `https://wa.me/${num}?text=${encoded}`
  }
  return `https://wa.me/?text=${encoded}`
}

export function abrirWhatsApp(texto: string, telefono?: string) {
  window.open(generarEnlaceWhatsApp(texto, telefono), "_blank", "noopener,noreferrer")
}

// ─── html2canvas helper ──────────────────────────────────────

/**
 * Captura un elemento DOM como imagen PNG en base64.
 * Usa escala 2x para alta calidad en pantallas retina.
 */
export async function capturarElemento(
  element: HTMLElement,
  opciones?: { scale?: number },
): Promise<string> {
  const canvas = await html2canvas(element, {
    scale:      opciones?.scale ?? 2,
    useCORS:    true,
    logging:    false,
    backgroundColor: "#ffffff",
  })
  return canvas.toDataURL("image/png")
}

/**
 * Descarga un elemento DOM capturado como imagen PNG.
 */
export async function descargarComoImagen(element: HTMLElement, filename = "captura.png") {
  const dataUrl = await capturarElemento(element)
  const a       = Object.assign(document.createElement("a"), {
    href:     dataUrl,
    download: filename,
  })
  a.click()
}
