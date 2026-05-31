import type { ReactNode } from "react"

interface PageWrapperProps {
  title: ReactNode
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function PageWrapper({ title, description, actions, children }: PageWrapperProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0 p-6 gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  )
}
