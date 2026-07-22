import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

/** Standard public/content page: sticky navbar + footer. */
export function PageShell({
  children,
  footer = true,
}: {
  children: React.ReactNode
  footer?: boolean
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      {footer && <Footer />}
    </div>
  )
}
