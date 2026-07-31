import Link from "next/link"
import {
  ArrowRight,
  ShieldCheck,
  BrainCircuit,
  Landmark,
  BadgeCheck,
  Star,
} from "lucide-react"
import { PageShell } from "@/components/layout/PageShell"
import { HeroSearch } from "@/components/home/HeroSearch"
import { FeaturedInternships } from "@/components/home/FeaturedInternships"
import { CompanyMarquee } from "@/components/home/CompanyMarquee"
import { Reveal, SectionHeading } from "@/components/ui/Reveal"
import { Accordion } from "@/components/ui/Accordion"
import { Button } from "@/components/ui/Button"
import { Avatar } from "@/components/ui/Avatar"
import { CountUp } from "@/components/ui/CountUp"
import {
  CATEGORIES,
  STATS,
  HOW_IT_WORKS,
  TESTIMONIALS,
  FAQS,
} from "@/lib/constants"
import { companyAccent } from "@/lib/format"

export default function HomePage() {
  return (
    <PageShell>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Official tricolor top edge — national-portal cue */}
        <div className="tricolor-bar h-1 w-full" />
        <div className="grid-backdrop absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_55%,transparent_100%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 left-1/2 h-80 w-[38rem] -translate-x-1/2 rounded-full bg-brand-blue/[0.06] blur-3xl" />
        </div>
        <div className="container-page relative py-16 text-center sm:py-24">
          {/* Institutional trust ribbon */}
          <Reveal>
            <div className="mx-auto mb-7 flex w-fit items-center gap-2.5 rounded-full border border-border bg-card px-3.5 py-1.5 shadow-card">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                <Landmark className="h-3.5 w-3.5 text-primary" />
              </span>
              <span className="text-xs font-medium text-foreground">
                Government, PSU &amp; PM Internship Scheme opportunities
              </span>
              <span className="hidden h-3.5 w-px bg-border sm:block" />
              <span className="hidden items-center gap-1 text-xs font-semibold text-success sm:flex">
                <BadgeCheck className="h-3.5 w-3.5" /> Free for students
              </span>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mx-auto max-w-4xl text-balance font-heading text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Find the internship that{" "}
              <span className="text-primary">actually fits</span> your skills
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground">
              Upload your resume once. We extract your skills, verify eligibility
              and rank government &amp; public-sector internships by a transparent
              compatibility score — so you apply where you truly fit.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-9">
              <HeroSearch />
            </div>
          </Reveal>
          {/* Popular searches — real-portal quick access */}
          <Reveal delay={0.18}>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-muted-foreground">Popular:</span>
              {["Data Analyst", "Policy Research", "Software", "Finance"].map(
                (term) => (
                  <Link
                    key={term}
                    href={`/internships?search=${encodeURIComponent(term)}`}
                    className="rounded-full border border-border bg-card px-3 py-1 font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {term}
                  </Link>
                )
              )}
            </div>
          </Reveal>
          <Reveal delay={0.22}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href="/register" variant="primary" size="lg">
                Get started free
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button href="/internships" variant="outline" size="lg">
                Browse internships
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.28}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-success" /> Eligibility auto-verified
              </span>
              <span className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-brand-saffron-dark" /> Ministry, PSU &amp; DPSU roles
              </span>
              <span className="flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-primary" /> Transparent match scores
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-b border-border bg-surface">
        <div className="container-page grid grid-cols-2 gap-6 py-12 md:grid-cols-4">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.05}>
              <div className="text-center">
                <CountUp
                  value={stat.value}
                  className="block font-heading text-3xl font-extrabold text-primary sm:text-4xl"
                />
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="container-page py-20">
        <Reveal>
          <SectionHeading
            eyebrow="Explore by sector"
            title="Internships across every domain"
            description="From technology and public policy to healthcare and clean energy — discover roles aligned to your field."
          />
        </Reveal>
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {CATEGORIES.map((cat, i) => (
            <Reveal key={cat.name} delay={(i % 4) * 0.05}>
              <Link
                href={`/internships?sector=${encodeURIComponent(cat.sector)}`}
                className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-card-hover"
              >
                <span
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white transition-transform group-hover:scale-105"
                  style={{ background: cat.color }}
                >
                  <cat.icon className="h-6 w-6" />
                </span>
                <h3 className="font-heading text-base font-semibold text-foreground">
                  {cat.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{cat.blurb}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Featured internships ── */}
      <section className="border-y border-border bg-surface py-20">
        <div className="container-page">
          <Reveal>
            <div className="mb-12 flex flex-col items-end justify-between gap-4 sm:flex-row">
              <SectionHeading
                center={false}
                eyebrow="Fresh opportunities"
                title="Featured internships"
                description="A snapshot of currently active roles from partner organisations."
              />
              <Button href="/internships" variant="outline" className="shrink-0">
                View all
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Reveal>
          <FeaturedInternships />
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="container-page scroll-mt-24 py-20">
        <Reveal>
          <SectionHeading
            eyebrow="Simple process"
            title="How InternMatch works"
            description="Four steps from sign-up to a shortlist of internships built around you."
          />
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.08}>
              <div className="relative h-full rounded-2xl border border-border bg-card p-6 shadow-card">
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary font-heading text-lg font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <h3 className="mb-2 font-heading text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Organisations ── */}
      <section
        id="companies"
        className="scroll-mt-24 border-y border-border bg-surface py-20"
      >
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Trusted network"
              title="Leading organisations onboard"
              description="Ministries, PSUs and public-sector leaders offering internships on the platform."
            />
          </Reveal>
          <div className="mt-12">
            <CompanyMarquee />
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="container-page scroll-mt-24 py-20">
        <Reveal>
          <SectionHeading
            eyebrow="Student stories"
            title="Loved by students across India"
          />
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <figure className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-current text-brand-saffron" />
                  ))}
                </div>
                <blockquote className="flex-1 text-sm leading-relaxed text-foreground">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                  <Avatar name={t.name} size={40} color={companyAccent(t.name)} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section
        id="faq"
        className="scroll-mt-24 border-t border-border bg-surface py-20"
      >
        <div className="container-page max-w-3xl">
          <Reveal>
            <SectionHeading eyebrow="Questions" title="Frequently asked questions" />
          </Reveal>
          <div className="mt-10">
            <Accordion items={FAQS} />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="container-page py-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center shadow-card-hover sm:px-12">
            <div className="tricolor-bar absolute inset-x-0 top-0 h-1.5" />
            <h2 className="mx-auto max-w-2xl font-heading text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Ready to discover your best-fit internship?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              Create a free account, upload your resume and get AI-ranked
              recommendations in minutes.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href="/register" variant="saffron" size="lg">
                Create free account
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button
                href="/internships"
                size="lg"
                className="border border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                Explore internships
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </PageShell>
  )
}
