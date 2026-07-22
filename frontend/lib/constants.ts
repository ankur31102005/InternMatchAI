import {
  Cpu,
  Landmark,
  HeartPulse,
  Leaf,
  Banknote,
  GraduationCap,
  Scale,
  Radio,
  type LucideIcon,
} from "lucide-react"

export const SECTORS = [
  "Technology",
  "Finance",
  "Policy",
  "Healthcare",
  "Education",
  "Energy",
  "Agriculture",
  "Media",
] as const

export const DURATIONS = [
  { label: "Any duration", value: "" },
  { label: "Up to 8 weeks", value: "0-8" },
  { label: "9 – 16 weeks", value: "9-16" },
  { label: "17 – 24 weeks", value: "17-24" },
  { label: "24+ weeks", value: "25-999" },
]

export const STIPEND_RANGES = [
  { label: "Any stipend", value: "" },
  { label: "Unpaid", value: "0-0" },
  { label: "Up to ₹10,000", value: "1-10000" },
  { label: "₹10,000 – ₹25,000", value: "10000-25000" },
  { label: "₹25,000+", value: "25000-9999999" },
]

export const SORT_OPTIONS = [
  { label: "Most recent", value: "recent" },
  { label: "Stipend: high to low", value: "stipend_desc" },
  { label: "Stipend: low to high", value: "stipend_asc" },
  { label: "Duration: shortest", value: "duration_asc" },
]

export interface Category {
  name: string
  icon: LucideIcon
  sector: string
  color: string
  blurb: string
}

export const CATEGORIES: Category[] = [
  { name: "Technology & IT", icon: Cpu, sector: "Technology", color: "#0F4C81", blurb: "Software, data & AI roles" },
  { name: "Public Policy", icon: Landmark, sector: "Policy", color: "#138808", blurb: "Governance & research" },
  { name: "Healthcare", icon: HeartPulse, sector: "Healthcare", color: "#E67E00", blurb: "Public health & biotech" },
  { name: "Energy & Environment", icon: Leaf, sector: "Energy", color: "#0E7C86", blurb: "Sustainability & power" },
  { name: "Finance & Banking", icon: Banknote, sector: "Finance", color: "#7A3E9D", blurb: "Fintech & economics" },
  { name: "Education", icon: GraduationCap, sector: "Education", color: "#1B6CB3", blurb: "EdTech & skilling" },
  { name: "Law & Justice", icon: Scale, sector: "Policy", color: "#8A5A00", blurb: "Legal & compliance" },
  { name: "Media & Comms", icon: Radio, sector: "Media", color: "#B23A48", blurb: "Content & outreach" },
]

export interface HowStep {
  title: string
  description: string
}

export const HOW_IT_WORKS: HowStep[] = [
  {
    title: "Create your profile",
    description: "Sign up in seconds and tell us about your education and interests.",
  },
  {
    title: "Upload your resume",
    description: "Our AI extracts your skills, certifications and experience automatically.",
  },
  {
    title: "Get matched",
    description: "Receive internships ranked by a transparent AI compatibility score.",
  },
  {
    title: "Apply with confidence",
    description: "See matched & missing skills, then apply to the right roles in one click.",
  },
]

export interface Stat {
  label: string
  value: string
}

export const STATS: Stat[] = [
  { label: "Active internships", value: "12,400+" },
  { label: "Partner organisations", value: "850+" },
  { label: "Students matched", value: "2.1L+" },
  { label: "Avg. match accuracy", value: "94%" },
]

export const TOP_COMPANIES = [
  "Ministry of Electronics & IT",
  "NITI Aayog",
  "ISRO",
  "State Bank of India",
  "Bharat Electronics",
  "NTPC Limited",
  "Indian Oil Corporation",
  "AICTE",
  "DRDO",
  "Reserve Bank of India",
  "Power Grid Corporation",
  "GAIL India",
]

export interface Testimonial {
  name: string
  role: string
  quote: string
}

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Priya Sharma",
    role: "B.Tech, IIIT Delhi",
    quote:
      "The AI match score showed exactly which skills I was missing. I upskilled and landed a MeitY internship within a month.",
  },
  {
    name: "Arjun Verma",
    role: "M.A. Economics, DU",
    quote:
      "Instead of scrolling endless listings, InternMatch surfaced three policy roles that genuinely fit my background.",
  },
  {
    name: "Fatima Khan",
    role: "B.Sc. Data Science",
    quote:
      "Uploading my resume once and getting ranked recommendations felt effortless. The eligibility checks saved me hours.",
  },
]

export interface Faq {
  question: string
  answer: string
}

export const FAQS: Faq[] = [
  {
    question: "Is InternMatch AI free for students?",
    answer:
      "Yes. Creating a profile, uploading your resume and receiving AI-powered recommendations is completely free for students.",
  },
  {
    question: "How does the AI match score work?",
    answer:
      "We combine skill overlap, semantic similarity between your resume and the role, and eligibility criteria to produce a single transparent compatibility score, along with your matched and missing skills.",
  },
  {
    question: "Which file formats can I upload?",
    answer: "You can upload your resume as a PDF or DOCX file up to 10 MB in size.",
  },
  {
    question: "Are these official government internships?",
    answer:
      "The platform aggregates opportunities including PM Internship Scheme, PSU and public-sector roles. Always verify final details on the hiring organisation's official portal before applying.",
  },
  {
    question: "Can I update my skills after uploading a resume?",
    answer:
      "Absolutely. Re-upload an updated resume any time and your recommendations will be recalculated automatically.",
  },
]

export const APPLICATION_STAGES = [
  { key: "pending", label: "Applied" },
  { key: "under_review", label: "Under review" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "accepted", label: "Decision" },
]
