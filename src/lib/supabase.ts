import { createClient } from "@supabase/supabase-js"

const supabaseUrl      = import.meta.env.VITE_SUPABASE_URL      as string
const supabaseAnonKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY")
}

// El cliente no lleva el genérico Database intencionalmente:
// la seguridad de tipos viene de las interfaces de retorno en cada hook.
// Usar el genérico con la versión actual de supabase-js resuelve algunas
// tablas como `never` por incompatibilidades de overloads.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession:   true,
    autoRefreshToken: true,
  },
})
