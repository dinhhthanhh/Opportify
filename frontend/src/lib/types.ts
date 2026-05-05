export interface Job {
  id: string
  title: string
  company: string
  location: string
  salary_min?: number
  salary_max?: number
  salary_currency: string
  description: string
  requirements?: string
  benefits?: string
  company_info?: string
  job_level?: string
  experience_years?: number
  industry?: string
  working_time?: string
  skills: string[]
  job_type: "fulltime" | "parttime" | "remote" | "internship"
  experience: "fresher" | "junior" | "mid" | "senior"
  url: string
  source: string
  posted_at: string
  match_score?: number
}

export interface Scholarship {
  id: string
  title: string
  organization: string
  country: string
  level: "bachelor" | "master" | "phd" | "postdoc"
  field: string
  coverage: string
  amount: string
  deadline: string
  description: string
  requirements?: string
  benefits?: string
  application_process?: string
  gender_requirement?: string
  nationality_requirement?: string
  website_url?: string
  url: string
  match_score?: number
}

export interface Message {
  role: "user" | "assistant"
  content: string
}

export interface JobsResponse {
  results: Job[];
  total: number;
}

export interface ScholarshipsResponse {
  results: Scholarship[];
  total: number;
}

export interface SearchResults {
  jobs: Job[];
  scholarships: Scholarship[];
  total: number;
}

// ── Hồ sơ năng lực cá nhân ───────────────────────────────────────────────────

export interface UserProfile {
  id: string
  email: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  skills: string[]
  experience_years: number
  experience_level: "fresher" | "junior" | "mid" | "senior" | null
  education_level: "bachelor" | "master" | "phd" | null
  education_field: string | null
  university: string | null
  preferred_locations: string[]
  preferred_job_types: string[]
  interest_fields: string[]
  created_at: string | null
}

export interface RecommendedJob extends Job {
  match_score: number
  match_reasons: string[]
}

export interface RecommendedScholarship extends Scholarship {
  match_score: number
  match_reasons: string[]
}

export interface RecommendResponse<T> {
  user_id: string
  username: string
  full_name: string | null
  total_candidates: number
  results: T[]
}

