import { supabase } from "@/lib/supabase"
import type { TareaInsert } from "@/types/database.types"

interface PackTareasOptions {
  clubId:  string
  anio:    number
  ejercicioId?: string
}

/**
 * Genera automáticamente tareas fiscales recurrentes cuando se crea un nuevo
 * ejercicio fiscal. Incluye modelos trimestrales (IVA/IGIC, retenciones) y
 * anuales (cuentas anuales, memoria).
 */
export async function generarPackTareasFiscales({
  clubId,
  anio,
}: PackTareasOptions): Promise<void> {
  const plantillas: Omit<TareaInsert, "club_id">[] = [
    // Trimestrales — IVA/IGIC
    { titulo: `Modelo 303 — 1T ${anio}`,   descripcion: `Autoliquidación IVA/IGIC 1er trimestre ${anio}`,  estado: "pendiente", prioridad: "alta",   orden: 0, asignado_a: null, fecha_vencimiento: `${anio}-04-20` },
    { titulo: `Modelo 303 — 2T ${anio}`,   descripcion: `Autoliquidación IVA/IGIC 2º trimestre ${anio}`,  estado: "pendiente", prioridad: "alta",   orden: 1, asignado_a: null, fecha_vencimiento: `${anio}-07-20` },
    { titulo: `Modelo 303 — 3T ${anio}`,   descripcion: `Autoliquidación IVA/IGIC 3er trimestre ${anio}`, estado: "pendiente", prioridad: "alta",   orden: 2, asignado_a: null, fecha_vencimiento: `${anio}-10-20` },
    { titulo: `Modelo 303 — 4T ${anio}`,   descripcion: `Autoliquidación IVA/IGIC 4º trimestre ${anio}`,  estado: "pendiente", prioridad: "alta",   orden: 3, asignado_a: null, fecha_vencimiento: `${anio + 1}-01-30` },
    // Trimestrales — Retenciones
    { titulo: `Modelo 111 — 1T ${anio}`,   descripcion: `Retenciones IRPF trabajo 1er trimestre ${anio}`,  estado: "pendiente", prioridad: "media",  orden: 4, asignado_a: null, fecha_vencimiento: `${anio}-04-20` },
    { titulo: `Modelo 111 — 2T ${anio}`,   descripcion: `Retenciones IRPF trabajo 2º trimestre ${anio}`,  estado: "pendiente", prioridad: "media",  orden: 5, asignado_a: null, fecha_vencimiento: `${anio}-07-20` },
    { titulo: `Modelo 111 — 3T ${anio}`,   descripcion: `Retenciones IRPF trabajo 3er trimestre ${anio}`, estado: "pendiente", prioridad: "media",  orden: 6, asignado_a: null, fecha_vencimiento: `${anio}-10-20` },
    { titulo: `Modelo 111 — 4T ${anio}`,   descripcion: `Retenciones IRPF trabajo 4º trimestre ${anio}`,  estado: "pendiente", prioridad: "media",  orden: 7, asignado_a: null, fecha_vencimiento: `${anio + 1}-01-20` },
    // Anuales
    { titulo: `Modelo 200 — IS ${anio}`,   descripcion: `Impuesto sobre Sociedades ejercicio ${anio}`,     estado: "pendiente", prioridad: "alta",   orden: 8, asignado_a: null, fecha_vencimiento: `${anio + 1}-07-25` },
    { titulo: `Cuentas anuales ${anio}`,   descripcion: `Depósito cuentas anuales en Registro Mercantil`, estado: "pendiente", prioridad: "alta",   orden: 9, asignado_a: null, fecha_vencimiento: `${anio + 1}-07-30` },
    { titulo: `Memoria deportiva ${anio}`, descripcion: `Elaboración y presentación de memoria anual`,     estado: "pendiente", prioridad: "baja",   orden: 10, asignado_a: null, fecha_vencimiento: `${anio + 1}-03-31` },
    { titulo: `Seguros deportivos ${anio}`,descripcion: `Renovación póliza federativa y responsabilidad civil`, estado: "pendiente", prioridad: "urgente", orden: 11, asignado_a: null, fecha_vencimiento: `${anio}-09-30` },
  ]

  const tareas: TareaInsert[] = plantillas.map((t) => ({ ...t, club_id: clubId }))

  const { error } = await supabase.from("tareas").insert(tareas)
  if (error) throw new Error(`Error generando pack de tareas: ${error.message}`)
}
