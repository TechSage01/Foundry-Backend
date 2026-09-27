export interface Opportunity {
  id: string,
  user_id: string,
  category: string,
  title: string,
  description: string,
  required_skills: string[],
  work_arrangement: string,
  location_range: string,
  compensation: string,
  deadline_at: Date,
  fast_apply_enabled: boolean,
  external_apply_url: string,
  screening_prompt: string,
  created_at: Date,
  updated_at: Date
}