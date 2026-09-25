export interface UserProfileData {
  target_role?: string | null
  target_location?: string | null
  experience_level?: string | null
  preferred_work_mode?: string | null
  career_interests?: string | null
  bio?: string | null
}

export interface User {
  id: number
  full_name: string
  email: string
  is_verified: boolean
  created_at?: string | null
  last_login_at?: string | null
  profile?: UserProfileData | null
}

export interface Resume {
  id: number
  file_name: string
  parsed_data?: {
    skills: string[]
    tools?: string[]
    education?: string[]
    experience?: string[]
    projects?: string[]
    certifications?: string[]
    roles?: string[]
    summary?: string | null
  } | null
  raw_preview?: string | null
  created_at?: string | null
}

export type AnalysisStatus = 'queued' | 'processing' | 'completed' | 'failed'

export interface AnalysisListItem {
  id: number
  title?: string | null
  target_role: string
  location?: string | null
  experience_level?: string | null
  status: AnalysisStatus
  current_stage?: string | null
  progress: number
  overall_match?: number | null
  jobs_count: number
  created_at?: string | null
  completed_at?: string | null
}

export interface MarketSkill {
  name: string
  category?: string | null
  market_frequency: number
  market_percentage: number
  market_rank: number
  user_has_skill: boolean
  skill_gap_level: 'strong' | 'partial' | 'missing'
  priority: 'high' | 'medium' | 'low'
  reason?: string | null
}

export interface Job {
  id: number
  analysis_id: number
  title: string
  company?: string | null
  location?: string | null
  description?: string | null
  source?: string | null
  salary?: string | null
  employment_type?: string | null
  experience?: string | null
  url?: string | null
  apply_via?: string | null
  posted_text?: string | null
  posted_at?: string | null
  remote_type?: string | null
  is_saved: boolean
}

export interface RoadmapItem {
  id: number
  week_number: number
  title: string
  description?: string | null
  learning_objective?: string | null
  why_it_matters?: string | null
  what_to_learn?: string | null
  practice?: string | null
  project_task?: string | null
  interview_prep?: string | null
  skills: string[]
  resources: string[]
  status: 'pending' | 'in_progress' | 'completed'
}

export interface Roadmap {
  id: number
  analysis_id: number
  title?: string | null
  duration: number
  items: RoadmapItem[]
}

export interface Source {
  source_type: string
  label?: string | null
  count?: number | null
  query?: string | null
  url?: string | null
  links?: Array<{
    title?: string | null
    url: string
    company?: string | null
    source_type?: string | null
  }>
}

export interface AnalysisDetail {
  id: number
  title?: string | null
  target_role: string
  location?: string | null
  experience_level?: string | null
  employment_type?: string | null
  status: AnalysisStatus
  current_stage?: string | null
  completed_stages: string[]
  progress: number
  summary?: string | null
  overall_match?: number | null
  market_overview?: MarketOverview | null
  insights?: Insights | null
  error_message?: string | null
  created_at?: string | null
  completed_at?: string | null
  resume?: {
    id: number
    file_name: string
    parsed_data?: Resume['parsed_data']
  } | null
  skills: MarketSkill[]
  jobs: Job[]
  market_stats?: MarketOverview | null
  roadmap?: Roadmap | null
  sources: Source[]
}

export interface MarketOverview {
  [key: string]: unknown
}

export interface Insights {
  market_overview?: string
  current_position?: string
  strengths?: string[]
  critical_gaps?: string[]
  opportunities?: string[]
  next_steps?: string[]
  summary?: string
  score_explanation?: string
}

export interface MarketStatsShape {
  total_jobs: number
  processed_jobs?: number
  top_skills?: MarketSkill[]
  employment_types?: Record<string, number>
  remote?: Record<string, number>
  locations?: Array<{ location: string; count: number }>
  top_companies?: Array<{ name: string; count: number }>
  top_industries?: Array<{ name: string; count: number }>
  experience_distribution?: Record<string, number>
  avg_experience?: number | null
  salary?: { mentioned: number; examples: string[] } | null
  sources?: Source[]
}

export interface MarketResponse {
  analysis_id: number
  target_role: string
  location?: string | null
  status: AnalysisStatus
  market_stats?: MarketStatsShape | null
  jobs: Job[]
  sources: Source[]
}

export interface SkillsResponse {
  analysis_id: number
  status: AnalysisStatus
  skills: MarketSkill[]
  gap_distribution: { strong: number; partial: number; missing: number }
  resume_skills: string[]
}

export interface SavedJobEntry {
  saved_at?: string | null
  job: Job
}

export interface SavedJobsResponse {
  saved_jobs: SavedJobEntry[]
  total: number
}

export interface ProfileOut {
  full_name: string
  email: string
  target_role?: string | null
  target_location?: string | null
  experience_level?: string | null
  preferred_work_mode?: string | null
  career_interests?: string | null
  bio?: string | null
  created_at?: string | null
}

export interface ProfileStats {
  analyses_count: number
  saved_jobs_count: number
  roadmap_progress: number
  resumes_count: number
  last_analysis_date?: string | null
}

export interface ProfileResponse {
  profile: ProfileOut
  stats: ProfileStats
}

export interface DashboardResponse {
  profile: ProfileOut
  stats: {
    analyses_count: number
    completed_analyses_count: number
    jobs_analyzed: number
    saved_jobs_count: number
    resumes_count: number
    roadmap_progress: number
    roadmap_completed_items: number
    roadmap_total_items: number
    last_analysis_date?: string | null
    current_overall_match?: number | null
    skill_gaps_count: number
    target_role?: string | null
    target_location?: string | null
  }
  skill_demand: MarketSkill[]
  match_chart: Array<{ name: string; market: number; user: number }>
  gap_distribution: { strong: number; partial: number; missing: number }
  market_overview?: MarketOverview | null
  recent_analyses: AnalysisListItem[]
}