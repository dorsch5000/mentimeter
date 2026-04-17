export interface Session {
  id: string
  name: string
  created_at: string
  is_active: boolean
}

export interface Vote {
  id: string
  session_id: string
  rating: number
  feedback: string | null
  created_at: string
}

export interface VoteStats {
  total: number
  average: number
  distribution: Record<number, number>
}
