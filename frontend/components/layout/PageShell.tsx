import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { MobileNav } from "@/components/layout/MobileNav"
import { ScrollToTop } from "@/components/ui/ScrollToTop"

/** Standard public/content page: sticky navbar + footer + mobile nav. */
export function PageShell({
  children,
  footer = true,
}: {
  children: React.ReactNode
  footer?: boolean
}) {
  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <Navbar />
      <main className="flex-1">{children}</main>
      {footer && <Footer />}
      <ScrollToTop />
      <MobileNav />
    </div>
  )
}
