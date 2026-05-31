import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

export interface StampOptions {
  numeroSerie: string   // e.g. "ENTRY-0001-2025"
  fecha?:      Date
  clubNombre?: string
}

/**
 * Abre un PDF desde una URL o Blob, añade el sello de registro oficial
 * en la esquina superior derecha de la primera página y devuelve el
 * nuevo PDF como Uint8Array listo para subir a Storage.
 */
export async function stampDocument(
  source:  string | Blob | ArrayBuffer,
  options: StampOptions,
): Promise<Uint8Array> {
  let bytes: ArrayBuffer

  if (typeof source === "string") {
    const res = await fetch(source)
    bytes = await res.arrayBuffer()
  } else if (source instanceof Blob) {
    bytes = await source.arrayBuffer()
  } else {
    bytes = source
  }

  const pdfDoc   = await PDFDocument.load(bytes)
  const font     = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontMono = await pdfDoc.embedFont(StandardFonts.Courier)
  const page     = pdfDoc.getPage(0)

  const { width, height } = page.getSize()
  const fecha = (options.fecha ?? new Date()).toLocaleDateString("es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric",
  })

  // Dimensiones del sello
  const boxW = 190
  const boxH = 60
  const margin = 12
  const x = width  - boxW - margin
  const y = height - boxH - margin

  // Fondo blanco con borde azul oscuro
  page.drawRectangle({
    x, y,
    width:  boxW,
    height: boxH,
    color:  rgb(1, 1, 1),
    borderColor: rgb(0.1, 0.22, 0.54),
    borderWidth: 1.5,
    opacity: 0.95,
  })

  // Línea decorativa superior
  page.drawRectangle({
    x,
    y: y + boxH - 14,
    width:  boxW,
    height: 14,
    color:  rgb(0.1, 0.22, 0.54),
  })

  // "REGISTRO OFICIAL" en cabecera
  page.drawText("REGISTRO OFICIAL", {
    x:    x + 12,
    y:    y + boxH - 11,
    size: 8,
    font,
    color: rgb(1, 1, 1),
  })

  // Número de serie
  page.drawText(options.numeroSerie, {
    x:    x + 10,
    y:    y + 26,
    size: 11,
    font,
    color: rgb(0.1, 0.22, 0.54),
  })

  // Fecha
  page.drawText(`Fecha: ${fecha}`, {
    x:    x + 10,
    y:    y + 10,
    size: 8,
    font: fontMono,
    color: rgb(0.3, 0.3, 0.3),
  })

  // Club nombre (si se pasa)
  if (options.clubNombre) {
    const maxLen = 28
    const nombre = options.clubNombre.length > maxLen
      ? options.clubNombre.slice(0, maxLen - 1) + "…"
      : options.clubNombre
    page.drawText(nombre, {
      x:    x + boxW - fontMono.widthOfTextAtSize(nombre, 7) - 8,
      y:    y + 10,
      size: 7,
      font: fontMono,
      color: rgb(0.5, 0.5, 0.5),
    })
  }

  return pdfDoc.save()
}

/** Descarga un Uint8Array como PDF en el navegador */
export function downloadPdf(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement("a"), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}

/** Convierte un Uint8Array estampado en un File para subirlo a Supabase Storage */
export function stampedToFile(bytes: Uint8Array, originalName: string): File {
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" })
  const name = originalName.replace(/\.pdf$/i, "_SELLADO.pdf")
  return new File([blob], name, { type: "application/pdf" })
}
