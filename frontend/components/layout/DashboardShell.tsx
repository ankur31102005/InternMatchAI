import { Navbar } from "@/components/layout/Navbar"
import { Sidebar } from "@/components/layout/Sidebar"
import { AuthGuard } from "@/components/layout/AuthGuard"

/** Authenticated area layout: navbar + sidebar + guarded content. */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <AuthGuard>
        <div className="container-page flex flex-1 gap-8 py-8">
          <Sidebar />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </AuthGuard>
    </div>
  )
}
