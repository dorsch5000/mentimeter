import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { QRCodeSVG } from 'qrcode.react'
import type { Session } from '../types'

export default function AdminPage() {
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createdSession, setCreatedSession] = useState<Session | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    loadSessions()
  }, [])

  async function loadSessions() {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setSessions(data)
  }

  async function handleCreate() {
    if (!name.trim()) return
    setCreating(true)

    const { data } = await supabase
      .from('sessions')
      .insert({ name: name.trim() })
      .select()
      .single()

    if (data) {
      setCreatedSession(data)
      setName('')
      loadSessions()
    }
    setCreating(false)
  }

  const origin = window.location.origin

  return (
    <div className="min-h-dvh bg-gray-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Live Feedback – Admin
        </h1>

        {/* Create Session */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Neue Session erstellen
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="z.B. AI × Design Meetup Vol. 5"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button
              onClick={handleCreate}
              disabled={!name.trim() || creating}
              className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium
                disabled:opacity-30 disabled:cursor-not-allowed
                hover:bg-gray-800 transition-colors cursor-pointer shrink-0"
            >
              {creating ? 'Erstellen...' : 'Session erstellen'}
            </button>
          </div>
        </div>

        {/* Created Session Details */}
        {createdSession && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border-2 border-green-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {'\u2705'} Session erstellt: {createdSession.name}
            </h2>

            <div className="space-y-3 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Voting-Link (für Teilnehmende)
                </label>
                <code className="block bg-gray-100 rounded-lg p-3 text-sm text-gray-800 break-all">
                  {origin}/vote/{createdSession.id}
                </code>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Dashboard-Link (für Presenter)
                </label>
                <code className="block bg-gray-100 rounded-lg p-3 text-sm text-gray-800 break-all">
                  {origin}/dashboard/{createdSession.id}
                </code>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-xl border border-gray-200">
                <QRCodeSVG
                  value={`${origin}/vote/${createdSession.id}`}
                  size={256}
                />
              </div>
            </div>
            <p className="text-center text-sm text-gray-500 mt-3">
              QR-Code scannen zum Voten
            </p>
          </div>
        )}

        {/* Session List */}
        {sessions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Alle Sessions
            </h2>
            <div className="divide-y divide-gray-100">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-900">{s.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(s.created_at).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`/vote/${s.id}`}
                      className="text-sm px-3 py-1.5 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      Vote
                    </a>
                    <a
                      href={`/dashboard/${s.id}`}
                      className="text-sm px-3 py-1.5 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      Dashboard
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
