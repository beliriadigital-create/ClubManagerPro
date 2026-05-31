import { useState } from "react"
import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Shield,
  CheckSquare,
  FileText,
  Briefcase,
  ChevronDown,
  LogOut,
  Bell,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/AuthProvider"
import { useClub } from "@/providers/ClubProvider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navMain = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/personas", icon: Users, label: "Personas" },
  { to: "/equipos", icon: Shield, label: "Equipos" },
  { to: "/tareas", icon: CheckSquare, label: "Tareas" },
  { to: "/fiscal", icon: FileText, label: "Fiscal" },
]

const navAsesoria = [
  { to: "/asesoria", icon: Briefcase, label: "Panel Asesor" },
  { to: "/asesoria/subvenciones", icon: FileText, label: "Subvenciones" },
  { to: "/asesoria/checklists", icon: CheckSquare, label: "Checklists" },
]

export function Sidebar() {
  const { role, signOut } = useAuth()
  const { currentClub, clubs, setCurrentClub } = useClub()
  const [signingOut, setSigningOut] = useState(false)

  const initials = currentClub?.nombre
    ?.split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() ?? "CM"

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <aside className="flex flex-col h-screen w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
      {/* Club selector */}
      <div className="p-4 border-b border-sidebar-border">
        {clubs.length > 1 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 w-full rounded-lg p-2 hover:bg-sidebar-accent transition-colors">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={currentClub?.logo_url ?? undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 text-left text-sm font-semibold truncate">
                  {currentClub?.nombre ?? "Sin club"}
                </span>
                <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              {clubs.map((club) => (
                <DropdownMenuItem
                  key={club.id}
                  onClick={() => setCurrentClub(club)}
                  className={cn(currentClub?.id === club.id && "font-semibold")}
                >
                  {club.nombre}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-3 p-2">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={currentClub?.logo_url ?? undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 text-sm font-semibold truncate">
              {currentClub?.nombre ?? "ClubManager Pro"}
            </span>
          </div>
        )}
      </div>

      {/* Nav principal */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navMain.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}

        {/* Sección asesoría solo para asesores */}
        {(role === "asesor" || role === "admin") && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                Asesoría
              </p>
            </div>
            {navAsesoria.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/asesoria"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Footer: alertas + cerrar sesión */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
          <Bell className="h-4 w-4 shrink-0" />
          <span>Alertas</span>
          <Badge className="ml-auto bg-danger text-destructive-foreground text-xs px-1.5">3</Badge>
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {signingOut ? "Cerrando..." : "Cerrar sesión"}
        </Button>
      </div>
    </aside>
  )
}
