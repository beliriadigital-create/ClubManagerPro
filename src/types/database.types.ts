// ============================================================
// database.types.ts — generado manualmente del esquema SQL
// Actualizar con: supabase gen types typescript --local
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ─── Enums ───────────────────────────────────────────────────
export type UserRole        = 'admin' | 'asesor' | 'cliente'
export type ClubMemberRole  = 'admin_club' | 'staff' | 'tesorero' | 'secretario'
export type AsistenciaEstado = 'presente' | 'ausente' | 'justificado'
export type RegistroTipo    = 'entrada' | 'salida'
export type JornadaTipo     = 'entrenamiento' | 'partido' | 'concentracion' | 'otro'
export type ObligacionEstado  = 'pendiente' | 'presentado' | 'vencido' | 'no_aplica'
export type ObligacionFrecuencia = 'mensual' | 'trimestral' | 'semestral' | 'anual' | 'puntual'
export type SubvencionEstado  = 'identificada' | 'solicitud' | 'documentacion' | 'justificacion' | 'cobrado' | 'denegada'
export type EjercicioEstado   = 'abierto' | 'cerrado'
export type InteraccionTipo   = 'reunion' | 'email' | 'llamada' | 'visita' | 'otro'
export type SemaforoColor     = 'verde' | 'amarillo' | 'rojo'
export type PersonaTipo       = 'jugador' | 'entrenador' | 'directivo' | 'socio' | 'staff' | 'arbitro'
export type PersonaEstado     = 'activo' | 'inactivo' | 'suspendido'
export type TareaEstado       = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada'
export type TareaPrioridad    = 'baja' | 'media' | 'alta' | 'urgente'

// ─── Rows (lectura) ──────────────────────────────────────────
export interface Profile {
  id:         string
  email:      string
  full_name:  string | null
  avatar_url: string | null
  role:       UserRole
  created_at: string
  updated_at: string
}

export interface Club {
  id:         string
  nombre:     string
  cif:        string | null
  direccion:  string | null
  logo_url:   string | null
  settings:   Json
  created_at: string
  updated_at: string
}

export interface ClubMember {
  id:         string
  club_id:    string
  profile_id: string
  role:       ClubMemberRole
  created_at: string
}

export interface AsesorAssignment {
  id:         string
  asesor_id:  string
  club_id:    string
  created_at: string
}

export interface Persona {
  id:               string
  club_id:          string
  nombre:           string
  apellidos:        string
  dni:              string | null
  fecha_nacimiento: string | null
  email:            string | null
  telefono:         string | null
  foto_url:         string | null
  tipo:             PersonaTipo
  estado:           PersonaEstado
  numero_licencia:  string | null
  qr_code:          string | null
  metadata:         Json
  created_at:       string
  updated_at:       string
}

export interface Temporada {
  id:           string
  club_id:      string
  nombre:       string
  fecha_inicio: string | null
  fecha_fin:    string | null
  activa:       boolean
  created_at:   string
}

export interface Equipo {
  id:           string
  club_id:      string
  temporada_id: string | null
  nombre:       string
  categoria:    string
  color_eq:     string | null
  created_at:   string
  updated_at:   string
}

export interface EquipoPersona {
  id:         string
  equipo_id:  string
  persona_id: string
  dorsal:     string | null
  posicion:   string | null
  created_at: string
}

export interface Jornada {
  id:         string
  club_id:    string
  equipo_id:  string
  fecha:      string
  rival:      string | null
  tipo:       JornadaTipo
  lugar:      string | null
  notas:      string | null
  created_at: string
  updated_at: string
}

export interface Asistencia {
  id:         string
  jornada_id: string
  persona_id: string
  estado:     AsistenciaEstado
  lat_lng:    string | null    // representado como string "lat,lng"
  fichado_en: string | null
  notas:      string | null
  created_at: string
}

export interface RegistroOficial {
  id:               string
  club_id:          string
  tipo:             RegistroTipo
  numero_registro:  string
  extracto:         string
  fecha:            string
  remitente:        string | null
  destinatario:     string | null
  file_url:         string | null
  registrado_por:   string | null
  created_at:       string
}

export interface Tarea {
  id:                string
  club_id:           string
  titulo:            string
  descripcion:       string | null
  estado:            TareaEstado
  prioridad:         TareaPrioridad
  asignado_a:        string | null
  fecha_vencimiento: string | null
  orden:             number
  created_at:        string
  updated_at:        string
}

export interface EjercicioFiscal {
  id:         string
  club_id:    string
  anio:       number
  estado:     EjercicioEstado
  notas:      string | null
  created_at: string
  updated_at: string
}

export interface ObligacionFiscal {
  id:                 string
  club_id:            string
  ejercicio_id:       string | null
  nombre:             string
  descripcion:        string | null
  fecha_vencimiento:  string
  estado:             ObligacionEstado
  frecuencia:         ObligacionFrecuencia
  importe:            number | null
  file_url:           string | null
  recordatorio_dias:  number
  created_at:         string
  updated_at:         string
}

export interface Subvencion {
  id:                  string
  club_id:             string
  nombre:              string
  organismo:           string | null
  descripcion:         string | null
  importe_solicitado:  number
  importe_concedido:   number | null
  estado:              SubvencionEstado
  fecha_limite:        string | null
  fecha_solicitud:     string | null
  fecha_resolucion:    string | null
  documentos:          Json
  notas:               string | null
  created_at:          string
  updated_at:          string
}

export interface InteraccionCRM {
  id:          string
  club_id:     string
  asesor_id:   string
  tipo:        InteraccionTipo
  resumen:     string
  fecha:       string
  seguimiento: string | null
  created_at:  string
}

// ─── Vista club_dashboard_360 ────────────────────────────────
export interface ClubDashboard360 {
  id:                    string
  nombre:                string
  logo_url:              string | null
  cif:                   string | null
  total_personas:        number
  tareas_pendientes:     number
  obligaciones_vencidas: number
  obligaciones_proximas: number
  subvenciones_activas:  number
  semaforo:              SemaforoColor
}

// ─── Insert helpers (omit server-generated fields) ───────────
export type ProfileInsert    = Omit<Profile,    'id' | 'created_at' | 'updated_at'>
export type ClubInsert       = Omit<Club,       'id' | 'created_at' | 'updated_at'>
export type ClubUpdate       = Partial<ClubInsert>
export type PersonaInsert    = Omit<Persona,    'id' | 'created_at' | 'updated_at'>
export type PersonaUpdate    = Partial<PersonaInsert>
export type EquipoInsert     = Omit<Equipo,     'id' | 'created_at' | 'updated_at'>
export type JornadaInsert    = Omit<Jornada,    'id' | 'created_at' | 'updated_at'>
export type TareaInsert      = Omit<Tarea,      'id' | 'created_at' | 'updated_at'>
export type TareaUpdate      = Partial<TareaInsert>
export type ObligacionInsert = Omit<ObligacionFiscal, 'id' | 'created_at' | 'updated_at'>
export type ObligacionUpdate = Partial<ObligacionInsert>
export type SubvencionInsert = Omit<Subvencion, 'id' | 'created_at' | 'updated_at'>
export type SubvencionUpdate = Partial<SubvencionInsert>
export type InteraccionInsert = Omit<InteraccionCRM, 'id' | 'created_at'>

// ─── Database interface para el cliente Supabase ─────────────
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row:    Profile
        Insert: ProfileInsert
        Update: Partial<ProfileInsert>
      }
      clubes: {
        Row:    Club
        Insert: ClubInsert
        Update: ClubUpdate
      }
      club_members: {
        Row:    ClubMember
        Insert: Omit<ClubMember, 'id' | 'created_at'>
        Update: Partial<Omit<ClubMember, 'id' | 'created_at'>>
      }
      asesor_assignments: {
        Row:    AsesorAssignment
        Insert: Omit<AsesorAssignment, 'id' | 'created_at'>
        Update: Partial<Omit<AsesorAssignment, 'id' | 'created_at'>>
      }
      personas: {
        Row:    Persona
        Insert: PersonaInsert
        Update: PersonaUpdate
      }
      temporadas: {
        Row:    Temporada
        Insert: Omit<Temporada, 'id' | 'created_at'>
        Update: Partial<Omit<Temporada, 'id' | 'created_at'>>
      }
      equipos: {
        Row:    Equipo
        Insert: EquipoInsert
        Update: Partial<EquipoInsert>
      }
      equipo_personas: {
        Row:    EquipoPersona
        Insert: Omit<EquipoPersona, 'id' | 'created_at'>
        Update: Partial<Omit<EquipoPersona, 'id' | 'created_at'>>
      }
      jornadas: {
        Row:    Jornada
        Insert: JornadaInsert
        Update: Partial<JornadaInsert>
      }
      asistencias: {
        Row:    Asistencia
        Insert: Omit<Asistencia, 'id' | 'created_at'>
        Update: Partial<Omit<Asistencia, 'id' | 'created_at'>>
      }
      registro_oficial: {
        Row:    RegistroOficial
        Insert: Omit<RegistroOficial, 'id' | 'created_at'>
        Update: Partial<Omit<RegistroOficial, 'id' | 'created_at'>>
      }
      tareas: {
        Row:    Tarea
        Insert: TareaInsert
        Update: TareaUpdate
      }
      ejercicios_fiscales: {
        Row:    EjercicioFiscal
        Insert: Omit<EjercicioFiscal, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<EjercicioFiscal, 'id' | 'created_at' | 'updated_at'>>
      }
      obligaciones_fiscales: {
        Row:    ObligacionFiscal
        Insert: ObligacionInsert
        Update: ObligacionUpdate
      }
      subvenciones: {
        Row:    Subvencion
        Insert: SubvencionInsert
        Update: SubvencionUpdate
      }
      interacciones_crm: {
        Row:    InteraccionCRM
        Insert: InteraccionInsert
        Update: Partial<InteraccionInsert>
      }
    }
    Views: {
      club_dashboard_360: {
        Row: ClubDashboard360
      }
    }
    Functions: {
      get_user_role: {
        Args:    { uid?: string }
        Returns: UserRole
      }
      is_club_member: {
        Args:    { uid: string; cid: string }
        Returns: boolean
      }
      generate_numero_registro: {
        Args:    { cid: string; t: RegistroTipo }
        Returns: string
      }
    }
    Enums: {
      user_role:             UserRole
      club_member_role:      ClubMemberRole
      asistencia_estado:     AsistenciaEstado
      registro_tipo:         RegistroTipo
      jornada_tipo:          JornadaTipo
      obligacion_estado:     ObligacionEstado
      obligacion_frecuencia: ObligacionFrecuencia
      subvencion_estado:     SubvencionEstado
      ejercicio_estado:      EjercicioEstado
      interaccion_tipo:      InteraccionTipo
    }
  }
}
