import Link from "next/link"
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BrainCircuit,
  Target,
  Star,
} from "lucide-react"
import { PageShell } from "@/components/layout/PageShell"
import { HeroSearch } from "@/components/home/HeroSearch"
import { FeaturedInternships } from "@/components/home/FeaturedInternships"
import { Reveal, SectionHeading } from "@/components/ui/Reveal"
import { Accordion } from "@/components/ui/Accordion"
import { Button } from "@/components/ui/Button"
import { Avatar } from "@/components/ui/Avatar"
import {
  CATEGORIES,
  STATS,
  HOW_IT_WORKS,
  TOP_COMPANIES,
  TESTIMONIALS,
  FAQS,
} from "@/lib/constants"
import { companyAccent } from "@/lib/format"

export default function HomePage() {
  return (
    <PageShell>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="grid-backdrop absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_60%,transparent_100%)]" />
        <div className="container-page relative py-20 text-center sm:py-28">
          <Reveal>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-4 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AI-powered matching for PM Internship Scheme &amp; PSU roles
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mx-auto max-w-4xl text-balance font-heading text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Find the internship that{" "}
              <span className="text-primary">actually fits</span> your skills
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground">
              Upload your resume once. Our AI extracts your skills, verifies
              eligibility and ranks government &amp; public-sector internships by a
              transparent compatibility score.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-9">
              <HeroSearch />
            </div>
          </Reveal>
          <Reveal delay={0.2}>
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
          <Reveal delay={0.25}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-success" /> Eligibility verified
              </span>
              <span className="flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-primary" /> Explainable AI scores
              </span>
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4 text-brand-saffron-dark" /> Skill-gap insights
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
                <p className="font-heading text-3xl font-extrabold text-primary sm:text-4xl">
                  {stat.value}
                </p>
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
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {TOP_COMPANIES.map((company, i) => (
              <Reveal key={company} delay={(i % 4) * 0.04}>
                <div className="flex h-full items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-soft">
                  <Avatar name={company} size={38} color={companyAccent(company)} />
                  <span className="text-sm font-medium leading-tight text-foreground">
                    {company}
                  </span>
                </div>
              </Reveal>
            ))}
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
