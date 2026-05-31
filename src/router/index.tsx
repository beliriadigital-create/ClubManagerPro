import { createBrowserRouter, Navigate } from "react-router-dom"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { Sidebar } from "@/components/layout/Sidebar"

// Auth pages
import { Login } from "@/pages/auth/Login"
import { Register } from "@/pages/auth/Register"

// App pages
import { Dashboard } from "@/pages/dashboard/Dashboard"
import { Personas } from "@/pages/personas/Personas"
import { PersonaDetalle } from "@/pages/personas/PersonaDetalle"
import { Equipos } from "@/pages/equipos/Equipos"
import { Tareas } from "@/pages/tareas/Tareas"
import { Fiscal } from "@/pages/fiscal/Fiscal"
import { Obligaciones } from "@/pages/fiscal/Obligaciones"
import { DashboardAsesor } from "@/pages/asesoria/DashboardAsesor"
import { Club360 } from "@/pages/asesoria/Club360"
import { Subvenciones } from "@/pages/asesoria/Subvenciones"
import { Checklists } from "@/pages/asesoria/Checklists"

function AppLayout() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <ProtectedRoute />
      </main>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "personas", element: <Personas /> },
      { path: "personas/:id", element: <PersonaDetalle /> },
      { path: "equipos", element: <Equipos /> },
      { path: "tareas", element: <Tareas /> },
      { path: "fiscal", element: <Fiscal /> },
      { path: "fiscal/obligaciones", element: <Obligaciones /> },
      {
        path: "asesoria",
        children: [
          { index: true, element: <DashboardAsesor /> },
          { path: "club/:id", element: <Club360 /> },
          { path: "subvenciones", element: <Subvenciones /> },
          { path: "checklists", element: <Checklists /> },
        ],
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
])
