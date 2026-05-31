import { useRef, useState } from "react"
import { Upload, X, FileText, Loader2, Stamp } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { stampDocument, stampedToFile } from "@/lib/pdf-service"
import { cn } from "@/lib/utils"

interface StampedFileUploaderProps {
  clubId:      string
  categoria:   string
  numeroSerie: string
  clubNombre?: string
  accept?:     string
  onUploaded:  (url: string, path: string) => void
  className?:  string
}

export function StampedFileUploader({
  clubId, categoria, numeroSerie, clubNombre,
  accept = ".pdf", onUploaded, className,
}: StampedFileUploaderProps) {
  const inputRef           = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [fileName, setFileName]   = useState<string | null>(null)
  const [dragging, setDragging]   = useState(false)
  const [step, setStep]           = useState<"idle" | "stamping" | "uploading">("idle")

  async function handleFile(file: File) {
    setError(null)
    if (file.size > 20 * 1024 * 1024) { setError("El archivo supera 20 MB"); return }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    setFileName(file.name)
    setUploading(true)

    try {
      let uploadFile: File = file

      if (isPdf) {
        setStep("stamping")
        const ab     = await file.arrayBuffer()
        const stamped = await stampDocument(ab, { numeroSerie, clubNombre })
        uploadFile   = stampedToFile(stamped, file.name)
      }

      setStep("uploading")
      const path = `${clubId}/${categoria}/${Date.now()}_${uploadFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
      const { data, error: upErr } = await supabase.storage
        .from("documentos")
        .upload(path, uploadFile, { upsert: false })

      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage.from("documentos").getPublicUrl(data.path)
      onUploaded(publicUrl, data.path)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al subir el archivo")
      setFileName(null)
    } finally {
      setUploading(false)
      setStep("idle")
    }
  }

  const stepLabel = step === "stamping" ? "Estampillando PDF…" : step === "uploading" ? "Subiendo…" : ""

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50",
          uploading && "pointer-events-none opacity-60",
        )}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragging(false)
          const f = e.dataTransfer.files[0]
          if (f) handleFile(f)
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm font-medium text-foreground">{stepLabel}</p>
          </div>
        ) : fileName ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="h-6 w-6 text-success shrink-0" />
            <p className="text-sm text-foreground truncate max-w-[200px]">{fileName}</p>
            <button
              onClick={(e) => { e.stopPropagation(); setFileName(null); setError(null) }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <Stamp className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Arrastra un PDF o <span className="text-primary font-medium">selecciona</span>
            </p>
            <p className="text-xs text-muted-foreground">El PDF será sellado automáticamente con nº {numeroSerie}</p>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
