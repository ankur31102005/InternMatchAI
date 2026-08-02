// Shared front-end types mirroring the backend Pydantic response schemas.

export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  is_active: boolean
  is_verified: boolean
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface InternshipSkill {
  skill_id: string
  name: string
  is_required: boolean
  importance_weight: number
}

export interface Internship {
  id: string
  title: string
  company: string
  description: string
  location?: string | null
  is_remote: boolean
  duration_weeks?: number | null
  stipend_amount?: number | null
  stipend_currency?: string
  start_date?: string | null
  end_date?: string | null
  application_deadline?: string | null
  is_pm_scheme: boolean
  sector?: string | null
  ministry?: string | null
  min_gpa?: number | null
  required_degree?: string | null
  total_seats?: number | null
  is_active: boolean
  seats_filled: number
  created_at: string
  skills: InternshipSkill[]
}

export interface InternshipListResponse {
  total: number
  page: number
  per_page: number
  items: Internship[]
}

export interface Recommendation {
  id: string
  user_id: string
  internship_id: string
  match_score: number
  skill_match_score?: number | null
  semantic_score?: number | null
  eligibility_score?: number | null
  rank?: number | null
  explanation?: string | null
  matched_skills?: string | null
  missing_skills?: string | null
  model_version?: string | null
  is_viewed: boolean
  internship?: Internship | null
  created_at: string
}

export interface RecommendationListResponse {
  total: number
  items: Recommendation[]
}

export type ApplicationStatus =
  | "pending"
  | "under_review"
  | "shortlisted"
  | "accepted"
  | "rejected"
  | "withdrawn"

export interface Application {
  id: string
  user_id: string
  internship_id: string
  status: ApplicationStatus | string
  cover_letter?: string | null
  created_at: string
  updated_at: string
  internship?: Internship | null
}

export interface ApplicationListResponse {
  total: number
  items: Application[]
}

export interface AdminApplication {
  id: string
  status: string
  cover_letter?: string | null
  created_at: string
  updated_at: string
  applicant_id: string
  applicant_name: string
  applicant_email: string
  internship?: Internship | null
}

export interface AdminApplicationListResponse {
  total: number
  items: AdminApplication[]
}

export interface Skill {
  id: string
  name: string
  category?: string | null
  confidence?: number | null
}

export interface Resume {
  id: string
  user_id: string
  filename: string
  original_filename: string
  file_size: number
  mime_type: string
  is_processed: boolean
  is_active: boolean
  created_at: string
  skills: Skill[]
}

export interface SavedInternship {
  id: string
  user_id: string
  internship_id: string
  created_at: string
  internship?: Internship | null
}

export interface SavedInternshipListResponse {
  total: number
  items: SavedInternship[]
}

export interface AppNotification {
  id: string
  user_id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export interface NotificationListResponse {
  total: number
  items: AppNotification[]
}

export interface UnreadCountResponse {
  count: number
}

export interface EducationItem {
  id?: string
  institution: string
  degree: string
  year: string
}

export interface ExperienceItem {
  id?: string
  role: string
  org: string
  period: string
}

export interface CertificateItem {
  id?: string
  name: string
  issuer: string
}

export interface StudentProfileData {
  id: string
  user_id: string
  full_name?: string | null
  email?: string | null
  phone?: string | null
  location?: string | null
  university?: string | null
  degree?: string | null
  major?: number | string | null
  graduation_year?: number | null
  gpa?: string | null
  bio?: string | null
  education: EducationItem[]
  experience: ExperienceItem[]
  certificates: CertificateItem[]
  skills: string[]
  is_onboarding_completed?: boolean
}
