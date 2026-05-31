import { useState } from "react"
import { NavLink } from "react-router-dom"
import {
  LayoutDashboard, Users, Shield, CheckSquare, FileText,
  Briefcase, ChevronDown, LogOut, Bell, Moon, Sun, Building2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/AuthProvider"
import { useClub } from "@/providers/ClubProvider"
import { useDarkMode } from "@/hooks/useDarkMode"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Club } from "@/types/database.types"

const navMain = [
  { to: "/",          icon: LayoutDashboard, label: "Dashboard",   end: true },
  { to: "/personas",  icon: Users,           label: "Personas",    end: false },
  { to: "/equipos",   icon: Shield,          label: "Equipos",     end: false },
  { to: "/tareas",    icon: CheckSquare,     label: "Tareas",      end: false },
  { to: "/fiscal",    icon: FileText,        label: "Fiscal",      end: false },
]

const navAsesoria = [
  { to: "/asesoria",               icon: Briefcase,  label: "Panel Asesor",  end: true },
  { to: "/asesoria/subvenciones",  icon: Building2,  label: "Subvenciones",  end: false },
  { to: "/asesoria/checklists",    icon: CheckSquare,label: "Checklists",    end: false },
]

function NavItem({ to, icon: Icon, label, end }: { to: string; icon: React.ElementType; label: string; end: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
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
  )
}

export function Sidebar() {
  const { role, signOut } = useAuth()
  const { currentClub, clubs, setCurrentClub } = useClub()
  const { dark, toggle } = useDarkMode()
  const [signingOut, setSigningOut] = useState(false)

  const initials = currentClub?.nombre
    ?.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() ?? "CM"

  async function handleSignOut() {
    setSigningOut(true)
    try { await signOut() } finally { setSigningOut(false) }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <aside className="flex flex-col h-screen w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">

        {/* ── Club selector ── */}
        <div className="p-4 border-b border-sidebar-border">
          {clubs.length > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full rounded-lg p-2 hover:bg-sidebar-accent transition-colors text-left">
                  <ClubAvatar club={currentClub} initials={initials} />
                  <span className="flex-1 text-sm font-semibold truncate">
                    {currentClub?.nombre ?? "Sin club"}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start" sideOffset={4}>
                {clubs.map((club) => (
                  <DropdownMenuItem
                    key={club.id}
                    onSelect={() => setCurrentClub(club)}
                    className={cn("gap-2", currentClub?.id === club.id && "font-semibold")}
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {club.nombre}
                    {currentClub?.id === club.id && (
                      <span className="ml-auto text-xs text-primary">Activo</span>
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                  {clubs.length} clubes asignados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-3 p-2">
              <ClubAvatar club={currentClub} initials={initials} />
              <span className="flex-1 text-sm font-semibold truncate">
                {currentClub?.nombre ?? "ClubManager Pro"}
              </span>
            </div>
          )}
        </div>

        {/* ── Navegación principal ── */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navMain.map((item) => <NavItem key={item.to} {...item} />)}

          {/* Sección asesoría — solo para rol asesor o admin */}
          {(role === "asesor" || role === "admin") && (
            <>
              <div className="pt-4 pb-1 px-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                  Asesoría
                </p>
              </div>
              {navAsesoria.map((item) => <NavItem key={item.to} {...item} />)}
            </>
          )}
        </nav>

        {/* ── Footer: alertas + dark mode + cerrar sesión ── */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          {/* Alertas pendientes */}
          <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
            <Bell className="h-4 w-4 shrink-0" />
            <span>Alertas</span>
            <Badge className="ml-auto bg-danger text-destructive-foreground text-xs px-1.5 py-0">3</Badge>
          </button>

          {/* Dark mode toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggle}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
              >
                {dark ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
                <span>{dark ? "Modo claro" : "Modo oscuro"}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Cambiar tema</TooltipContent>
          </Tooltip>

          {/* Cerrar sesión */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {signingOut ? "Cerrando…" : "Cerrar sesión"}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}

function ClubAvatar({ club, initials }: { club: Club | null; initials: string }) {
  return (
    <Avatar className="h-9 w-9 shrink-0">
      <AvatarImage src={club?.logo_url ?? undefined} />
      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
