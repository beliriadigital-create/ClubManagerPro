import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import "./index.css"
import { QueryProvider } from "@/providers/QueryProvider"
import { AuthProvider } from "@/providers/AuthProvider"
import { ClubProvider } from "@/providers/ClubProvider"
import { router } from "@/router"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <AuthProvider>
        <ClubProvider>
          <RouterProvider router={router} />
        </ClubProvider>
      </AuthProvider>
    </QueryProvider>
  </StrictMode>
)
