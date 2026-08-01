import { Navbar } from "@/components/layout/Navbar"
import { Sidebar } from "@/components/layout/Sidebar"
import { MobileNav } from "@/components/layout/MobileNav"
import { AuthGuard } from "@/components/layout/AuthGuard"

/** Authenticated area layout: navbar + sidebar + guarded content + mobile nav. */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <Navbar />
      <AuthGuard>
        <div className="container-page flex flex-1 gap-8 py-8">
          <Sidebar />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </AuthGuard>
      <MobileNav />
    </div>
  )
}
