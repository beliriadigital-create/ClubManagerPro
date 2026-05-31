import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type { Persona, PersonaInsert } from "@/types/database.types"

// ─── Validaciones ────────────────────────────────────────────
const dniRegex   = /^(\d{8}[A-Z]|[XYZ]\d{7}[A-Z])$/
const telRegex   = /^(\+?34)?[6-9]\d{8}$/

const schema = z.object({
  nombre:           z.string().min(2, "Nombre requerido"),
  apellidos:        z.string().min(2, "Apellidos requeridos"),
  dni:              z.string().regex(dniRegex, "DNI/NIE inválido").optional().or(z.literal("")),
  email:            z.string().email("Email inválido").optional().or(z.literal("")),
  telefono:         z.string().regex(telRegex, "Teléfono inválido").optional().or(z.literal("")),
  fecha_nacimiento: z.string().optional().or(z.literal("")),
  tipo:             z.enum(["jugador","entrenador","directivo","socio","staff","arbitro"]),
  estado:           z.enum(["activo","inactivo","suspendido"]),
  numero_licencia:  z.string().optional().or(z.literal("")),
})

type FormData = z.infer<typeof schema>

interface PersonaFormProps {
  clubId:     string
  defaultValues?: Partial<Persona>
  onSubmit:   (data: PersonaInsert) => Promise<void>
  onCancel:   () => void
  isLoading?: boolean
}

const tipoOpts: { value: Persona["tipo"]; label: string }[] = [
  { value: "jugador",     label: "Jugador/a" },
  { value: "entrenador",  label: "Entrenador/a" },
  { value: "directivo",   label: "Directivo/a" },
  { value: "socio",       label: "Socio/a" },
  { value: "staff",       label: "Staff" },
  { value: "arbitro",     label: "Árbitro" },
]

export function PersonaForm({ clubId, defaultValues, onSubmit, onCancel, isLoading }: PersonaFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre:           defaultValues?.nombre           ?? "",
      apellidos:        defaultValues?.apellidos        ?? "",
      dni:              defaultValues?.dni              ?? "",
      email:            defaultValues?.email            ?? "",
      telefono:         defaultValues?.telefono         ?? "",
      fecha_nacimiento: defaultValues?.fecha_nacimiento ?? "",
      tipo:             defaultValues?.tipo             ?? "socio",
      estado:           defaultValues?.estado           ?? "activo",
      numero_licencia:  defaultValues?.numero_licencia  ?? "",
    },
  })

  async function handleFormSubmit(data: FormData) {
    await onSubmit({
      club_id:          clubId,
      nombre:           data.nombre,
      apellidos:        data.apellidos,
      dni:              data.dni      || null,
      email:            data.email    || null,
      telefono:         data.telefono || null,
      fecha_nacimiento: data.fecha_nacimiento || null,
      tipo:             data.tipo,
      estado:           data.estado,
      numero_licencia:  data.numero_licencia || null,
      foto_url:         defaultValues?.foto_url ?? null,
      qr_code:          defaultValues?.qr_code  ?? null,
      metadata:         defaultValues?.metadata ?? {},
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Datos personales */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nombre *" error={errors.nombre?.message}>
          <Input {...register("nombre")} placeholder="Nombre" />
        </Field>
        <Field label="Apellidos *" error={errors.apellidos?.message}>
          <Input {...register("apellidos")} placeholder="Apellidos" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="DNI / NIE" error={errors.dni?.message}>
          <Input {...register("dni")} placeholder="12345678A" className="uppercase" />
        </Field>
        <Field label="Fecha de nacimiento" error={errors.fecha_nacimiento?.message}>
          <Input {...register("fecha_nacimiento")} type="date" />
        </Field>
      </div>

      <Separator />

      {/* Contacto */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Email" error={errors.email?.message}>
          <Input {...register("email")} type="email" placeholder="correo@ejemplo.com" />
        </Field>
        <Field label="Teléfono" error={errors.telefono?.message}>
          <Input {...register("telefono")} placeholder="600 000 000" />
        </Field>
      </div>

      <Separator />

      {/* Rol y estado */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Tipo *" error={errors.tipo?.message}>
          <Select
            value={watch("tipo")}
            onValueChange={(v) => setValue("tipo", v as FormData["tipo"])}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {tipoOpts.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Estado *" error={errors.estado?.message}>
          <Select
            value={watch("estado")}
            onValueChange={(v) => setValue("estado", v as FormData["estado"])}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="inactivo">Inactivo</SelectItem>
              <SelectItem value="suspendido">Suspendido</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Número de licencia" error={errors.numero_licencia?.message}>
        <Input {...register("numero_licencia")} placeholder="Nº de licencia federativa" />
      </Field>

      {/* Acciones */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Guardando…" : defaultValues ? "Actualizar" : "Crear persona"}
        </Button>
      </div>
    </form>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
