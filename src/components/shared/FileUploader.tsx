import { useRef, useState } from "react"
import { Upload, X, FileText, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface FileUploaderProps {
  clubId: string
  categoria: string                    // e.g. "fiscal", "personas", "subvenciones"
  accept?: string
  maxSizeMB?: number
  onUploaded: (url: string, path: string) => void
  className?: string
}

export function FileUploader({
  clubId, categoria, accept = ".pdf,.doc,.docx,.jpg,.png",
  maxSizeMB = 10, onUploaded, className,
}: FileUploaderProps) {
  const inputRef          = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [fileName, setFileName]   = useState<string | null>(null)
  const [dragging, setDragging]   = useState(false)

  async function handleFile(file: File) {
    setError(null)
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`El archivo supera el límite de ${maxSizeMB} MB`)
      return
    }

    setUploading(true)
    setFileName(file.name)

    // Ruta: {club_id}/{categoria}/{timestamp}_{nombre}
    const path = `${clubId}/${categoria}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`

    const { data, error: upErr } = await supabase.storage
      .from("documentos")
      .upload(path, file, { upsert: false })

    setUploading(false)

    if (upErr) {
      setError(upErr.message)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from("documentos").getPublicUrl(data.path)
    onUploaded(publicUrl, data.path)
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function clear() {
    setFileName(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50",
          uploading && "pointer-events-none opacity-60"
        )}
      >
        <input ref={inputRef} type="file" accept={accept} onChange={onInputChange} className="hidden" />

        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" />
        )}

        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {uploading ? "Subiendo…" : "Arrastra o haz clic para subir"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {accept.split(",").join(", ")} · máx. {maxSizeMB} MB
          </p>
        </div>
      </div>

      {fileName && !error && (
        <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <span className="flex-1 truncate text-foreground">{fileName}</span>
          <button onClick={clear} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
