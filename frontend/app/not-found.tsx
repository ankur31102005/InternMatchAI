import Link from "next/link"
import { Compass, ArrowLeft, Search } from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { Button } from "@/components/ui/Button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container-page flex flex-1 items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent text-primary">
            <Compass className="h-10 w-10" />
          </div>
          <p className="font-heading text-6xl font-extrabold text-primary">404</p>
          <h1 className="mt-2 font-heading text-2xl font-bold text-foreground">
            Page not found
          </h1>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or may have been
            moved. Let&apos;s get you back on track.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/" variant="primary">
              <ArrowLeft className="h-4 w-4" /> Back home
            </Button>
            <Button href="/internships" variant="outline">
              <Search className="h-4 w-4" /> Browse internships
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
