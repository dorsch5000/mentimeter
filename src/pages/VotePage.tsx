import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Session } from '../types'

const EMOJIS: Record<number, string> = {
  1: '\u{1F621}',
  2: '\u{1F615}',
  3: '\u{1F610}',
  4: '\u{1F642}',
  5: '\u{1F929}',
}

export default function VotePage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rating, setRating] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    async function loadSession() {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error || !data) {
        setError('Diese Session existiert nicht.')
      } else if (!data.is_active) {
        setError('Diese Session ist nicht mehr aktiv.')
      } else {
        setSession(data)
      }
      setLoading(false)
    }
    loadSession()
  }, [sessionId])

  async function handleSubmit() {
    if (!rating || !sessionId) return
    setSubmitting(true)

    await supabase.from('votes').insert({
      session_id: sessionId,
      rating,
      feedback: feedback.trim() || null,
    })

    setSubmitting(false)
    setSubmitted(true)
  }

  function handleReset() {
    setRating(null)
    setFeedback('')
    setSubmitted(false)
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Laden...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-dvh bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <p className="text-6xl mb-4">{'\u{1F614}'}</p>
          <p className="text-gray-700 text-lg">{error}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-dvh bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center animate-[fadeIn_0.4s_ease-out]">
          <p className="text-6xl mb-4">{'\u2705'}</p>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Danke für dein Feedback!
          </h2>
          <p className="text-gray-500 mb-6">Deine Stimme wurde gezählt.</p>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gray-900 text-white rounded-xl text-lg font-medium hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Nochmal abstimmen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full">
        <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
          {session?.name}
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Wie war's? Gib dein Feedback ab.
        </p>

        <div className="flex justify-center gap-3 mb-8">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => setRating(value)}
              className={`w-[72px] h-[72px] text-4xl rounded-2xl transition-all cursor-pointer
                ${
                  rating === value
                    ? 'bg-gray-900 scale-110 shadow-lg'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
            >
              {EMOJIS[value]}
            </button>
          ))}
        </div>

        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Was möchtest du uns mitteilen?"
          rows={3}
          className="w-full border border-gray-200 rounded-xl p-4 text-gray-700 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 mb-6"
        />

        <button
          onClick={handleSubmit}
          disabled={!rating || submitting}
          className="w-full py-4 bg-gray-900 text-white rounded-xl text-lg font-medium
            disabled:opacity-30 disabled:cursor-not-allowed
            hover:bg-gray-800 transition-colors cursor-pointer"
        >
          {submitting ? 'Wird gesendet...' : 'Feedback abschicken'}
        </button>
      </div>
    </div>
  )
}
