import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Session, Vote, VoteStats } from '../types'

const EMOJIS: Record<number, string> = {
  1: '\u{1F621}',
  2: '\u{1F615}',
  3: '\u{1F610}',
  4: '\u{1F642}',
  5: '\u{1F929}',
}

const BAR_COLORS: Record<number, string> = {
  1: 'bg-red-500',
  2: 'bg-orange-400',
  3: 'bg-yellow-400',
  4: 'bg-lime-400',
  5: 'bg-green-500',
}

function getEmojiForAverage(avg: number): string {
  if (avg === 0) return '\u{1F610}'
  const rounded = Math.round(avg)
  return EMOJIS[Math.min(5, Math.max(1, rounded))]
}

function calculateStats(votes: Vote[]): VoteStats {
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let sum = 0

  for (const vote of votes) {
    distribution[vote.rating] = (distribution[vote.rating] || 0) + 1
    sum += vote.rating
  }

  return {
    total: votes.length,
    average: votes.length > 0 ? sum / votes.length : 0,
    distribution,
  }
}

export default function DashboardPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<Session | null>(null)
  const [votes, setVotes] = useState<Vote[]>([])
  const [stats, setStats] = useState<VoteStats>({
    total: 0,
    average: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [sessionRes, votesRes] = await Promise.all([
        supabase.from('sessions').select('*').eq('id', sessionId).single(),
        supabase
          .from('votes')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false }),
      ])

      if (sessionRes.data) setSession(sessionRes.data)
      if (votesRes.data) {
        setVotes(votesRes.data)
        setStats(calculateStats(votesRes.data))
      }
      setLoading(false)
    }
    load()
  }, [sessionId])

  useEffect(() => {
    const channel = supabase
      .channel('votes-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newVote = payload.new as Vote
          setVotes((prev) => {
            const updated = [newVote, ...prev]
            setStats(calculateStats(updated))
            return updated
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-dvh bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400 text-xl">Laden...</p>
      </div>
    )
  }

  const maxCount = Math.max(...Object.values(stats.distribution), 1)
  const feedbacks = votes.filter((v) => v.feedback).slice(0, 20)

  return (
    <div className="min-h-dvh bg-slate-950 text-white p-6 md:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-2xl md:text-3xl font-bold truncate">
          {session?.name}
        </h1>
        <div className="text-slate-400 text-lg md:text-xl shrink-0 ml-4">
          <span className="font-mono text-white">{stats.total}</span> Stimmen
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Left: Average + Bars */}
        <div className="lg:col-span-2">
          {/* Hero: Average */}
          <div className="flex items-center justify-center gap-6 mb-12">
            <span className="text-8xl md:text-9xl font-bold font-mono leading-none">
              {stats.total > 0 ? stats.average.toFixed(1) : '–'}
            </span>
            <span className="text-7xl md:text-8xl">
              {getEmojiForAverage(stats.average)}
            </span>
          </div>

          {/* Bar chart */}
          <div className="space-y-4">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.distribution[rating] || 0
              const pct = maxCount > 0 ? (count / maxCount) * 100 : 0

              return (
                <div key={rating} className="flex items-center gap-4">
                  <span className="text-3xl w-12 text-center">
                    {EMOJIS[rating]}
                  </span>
                  <div className="flex-1 bg-slate-800 rounded-full h-10 overflow-hidden">
                    <div
                      className={`h-full ${BAR_COLORS[rating]} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-slate-300 font-mono text-lg w-10 text-right">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Live Feed */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-slate-400 mb-4">
            Letzte Feedbacks
          </h2>
          {feedbacks.length === 0 ? (
            <p className="text-slate-600 italic">Noch keine Kommentare.</p>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {feedbacks.map((vote) => (
                <div
                  key={vote.id}
                  className="bg-slate-900 rounded-xl p-4 border border-slate-800"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{EMOJIS[vote.rating]}</span>
                    <span className="text-slate-500 text-sm">
                      {new Date(vote.created_at).toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-slate-200 text-sm leading-relaxed">
                    {vote.feedback}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
