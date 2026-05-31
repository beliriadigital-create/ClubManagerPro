import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { queryClient } from "@/lib/queryClient"
import { useAuth } from "./AuthProvider"
import type { Club } from "@/types/database.types"

const ACTIVE_CLUB_KEY = "clubmanager_active_club"

interface ClubContextValue {
  currentClub: Club | null
  clubs:       Club[]
  loading:     boolean
  setCurrentClub: (club: Club) => void
}

const ClubContext = createContext<ClubContextValue | null>(null)

export function ClubProvider({ children }: { children: React.ReactNode }) {
  const { user, role } = useAuth()
  const [clubs, setClubs]                   = useState<Club[]>([])
  const [currentClub, setCurrentClubState]  = useState<Club | null>(null)
  const [loading, setLoading]               = useState(true)

  useEffect(() => {
    if (!user) {
      setClubs([])
      setCurrentClubState(null)
      setLoading(false)
      return
    }
    loadClubs()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, role])

  async function loadClubs() {
    setLoading(true)
    try {
      let data: Club[] = []

      if (role === "admin") {
        // Admin ve todos los clubes
        const { data: all } = await supabase
          .from("clubes")
          .select("*")
          .order("nombre")
        data = (all ?? []) as Club[]

      } else if (role === "asesor") {
        // Asesor ve los clubes asignados via asesor_assignments
        const { data: asignaciones } = await supabase
          .from("asesor_assignments")
          .select("club_id, clubes(*)")
          .eq("asesor_id", user!.id)
        data = ((asignaciones ?? []) as any[])
          .map((r) => r.clubes)
          .filter(Boolean) as Club[]

      } else {
        // Cliente: ve solo el club al que pertenece via club_members
        const { data: membership } = await supabase
          .from("club_members")
          .select("club_id, clubes(*)")
          .eq("profile_id", user!.id)
          .limit(1)
          .single()
        const m = membership as any
        if (m?.clubes) data = [m.clubes as Club]
      }

      setClubs(data)

      // Restaurar club activo desde localStorage
      const savedId = localStorage.getItem(ACTIVE_CLUB_KEY)
      const saved   = data.find((c) => c.id === savedId)
      setCurrentClubState(saved ?? data[0] ?? null)

    } finally {
      setLoading(false)
    }
  }

  function setCurrentClub(club: Club) {
    setCurrentClubState(club)
    localStorage.setItem(ACTIVE_CLUB_KEY, club.id)
    // REGLA CRÍTICA: limpiar caché al cambiar de club para evitar fuga de datos
    queryClient.removeQueries()
  }

  return (
    <ClubContext.Provider value={{ currentClub, clubs, loading, setCurrentClub }}>
      {children}
    </ClubContext.Provider>
  )
}

export function useClub() {
  const ctx = useContext(ClubContext)
  if (!ctx) throw new Error("useClub must be used within ClubProvider")
  return ctx
}
