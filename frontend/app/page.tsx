import Link from "next/link"
import Navbar from "@/components/Navbar"
import { Sparkles, BrainCircuit, ShieldAlert, Award, FileSearch, ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 flex flex-col justify-center relative">
        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10" />

        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 pt-20 pb-16 text-center select-none">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full glass border-white/10 text-xs text-primary mb-6 animate-fade-in-up">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI recommendation engine for PM Internship Scheme</span>
          </div>

          <h1 className="font-outfit text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-5xl mx-auto leading-[1.1] mb-6 animate-fade-in-up">
            Match Your Resume With The Best{" "}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-emerald-400 bg-clip-text text-transparent">
              PM Scheme Internships
            </span>
          </h1>

          <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up">
            Upload your resume, parse technical skills instantly, verify eligibility criteria, and find matching government & PSU internship positions automatically.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up">
            <Link
              href="/register"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-medium px-8 py-4 rounded-full text-base transition-all flex items-center justify-center space-x-2 glow-primary"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto glass hover:bg-white/10 text-white font-medium px-8 py-4 rounded-full text-base transition-colors"
            >
              Sign In to Account
            </Link>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="container mx-auto px-4 sm:px-6 py-20 border-t border-white/5">
          <h2 className="font-outfit text-3xl sm:text-4xl font-bold text-center mb-12">
            Powerful features built for students
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass-card rounded-2xl p-6 glass-card-hover">
              <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400 border border-violet-500/20 mb-6">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="font-outfit text-xl font-semibold mb-3">AI Skill Extraction</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Extract hidden skills, technologies, and certifications from your resume pdf/docx automatically.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card rounded-2xl p-6 glass-card-hover">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20 mb-6">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="font-outfit text-xl font-semibold mb-3">Eligibility Verifier</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Instantly check alignment with minimum graduation thresholds, degree fields, and PM Internship directives.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card rounded-2xl p-6 glass-card-hover">
              <div className="w-12 h-12 rounded-xl bg-fuchsia-600/20 flex items-center justify-center text-fuchsia-400 border border-fuchsia-500/20 mb-6">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-outfit text-xl font-semibold mb-3">Smart Ranking</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                View customized compatibility match scores with a detailed SHAP feature importance breakdown.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-8 text-center text-muted-foreground text-sm glass">
        <p>© 2026 InternMatch AI. Supporting the PM Internship Scheme.</p>
      </footer>
    </div>
  )
}
