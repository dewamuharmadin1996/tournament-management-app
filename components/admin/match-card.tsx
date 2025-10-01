"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

interface Match {
  id: string
  team1_id: string | null
  team2_id: string | null
  team1_score: number | null
  team2_score: number | null
  winner_id: string | null
  status: string
  team1: { name: string } | null
  team2: { name: string } | null
  scheduled_at?: string | null
}

export function MatchCard({
  match,
  tournamentName,
  seasonName,
  isNextMatch,
}: {
  match: Match
  tournamentName?: string
  seasonName?: string
  isNextMatch?: boolean
}) {
  const [team1Score, setTeam1Score] = useState(match.team1_score?.toString() || "")
  const [team2Score, setTeam2Score] = useState(match.team2_score?.toString() || "")
  const [scheduledAt, setScheduledAt] = useState<string>(() => {
    const toLocalInput = (d: Date) => {
      const pad = (n: number) => `${n}`.padStart(2, "0")
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`
    }
    if (!match.scheduled_at) {
      const inOneHour = new Date(Date.now() + 60 * 60 * 1000)
      return toLocalInput(inOneHour)
    }
    const d = new Date(match.scheduled_at)
    return toLocalInput(d)
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const [showWaList, setShowWaList] = useState(false)
  const [waPeople, setWaPeople] = useState<Array<{ id: string; name: string; whatsapp: string | null }>>([])

  const handleUpdateScore = async () => {
    setIsUpdating(true)

    try {
      const score1 = Number.parseInt(team1Score) || 0
      const score2 = Number.parseInt(team2Score) || 0

      let winnerId = null
      if (score1 > score2) winnerId = match.team1_id
      else if (score2 > score1) winnerId = match.team2_id

      await fetch(`/api/matches/${match.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team1_score: score1,
          team2_score: score2,
          winner_id: winnerId,
          status: "completed",
          // calendar will be updated too, but time likely unchanged
        }),
      })

      router.refresh()
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSaveSchedule = async () => {
    setIsUpdating(true)
    try {
      const iso = scheduledAt ? new Date(scheduledAt).toISOString() : null
      await fetch(`/api/matches/${match.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduled_at: iso, status: match.status }),
      })
      router.refresh()
    } finally {
      setIsUpdating(false)
    }
  }

  const loadPeople = async () => {
    setShowWaList((v) => !v)
    if (waPeople.length || (!match.team1_id && !match.team2_id)) return
    const { data: teamMembers1 } = await supabase
      .from("team_members")
      .select("people:person_id(id,name,whatsapp)")
      .eq("team_id", match.team1_id)
    const { data: teamMembers2 } = await supabase
      .from("team_members")
      .select("people:person_id(id,name,whatsapp)")
      .eq("team_id", match.team2_id)
    const list = [...(teamMembers1 || []), ...(teamMembers2 || [])].map((m: any) => m.people).filter(Boolean) as Array<{
      id: string
      name: string
      whatsapp: string | null
    }>
    setWaPeople(list)
  }

  const icsUrl = `/api/matches/${match.id}/calendar`
  const summary = `${match.team1?.name || "TBD"} vs ${match.team2?.name || "TBD"}`
  const dateText = scheduledAt ? new Date(scheduledAt).toLocaleString() : "TBD"

  return (
    <Card className={`bg-card/20 border-border ${isNextMatch ? "ring-2 ring-primary/60 bg-primary/10" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Badge variant={match.status === "completed" ? "secondary" : "outline"}>{match.status}</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex-1 font-medium">{match.team1?.name || "TBD"}</span>
            <Input
              type="number"
              value={team1Score}
              onChange={(e) => setTeam1Score(e.target.value)}
              className="w-16 text-center bg-background/50"
              min="0"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="flex-1 font-medium">{match.team2?.name || "TBD"}</span>
            <Input
              type="number"
              value={team2Score}
              onChange={(e) => setTeam2Score(e.target.value)}
              className="w-16 text-center bg-background/50"
              min="0"
            />
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <Label className="text-sm">Match Date & Time</Label>
          <div className="flex gap-2">
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="bg-background/50"
            />
            <Button size="sm" variant="outline" onClick={handleSaveSchedule} disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        <Button onClick={handleUpdateScore} disabled={isUpdating} size="sm" className="w-full mt-3">
          {isUpdating ? "Updating..." : "Update Score"}
        </Button>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button asChild variant="secondary" size="sm">
            <a href={icsUrl} target="_blank" rel="noopener noreferrer">
              Add Calendar Invite
            </a>
          </Button>
          <div>
            <Button size="sm" variant="outline" className="w-full bg-transparent" onClick={loadPeople}>
              WhatsApp Reminder
            </Button>
            {showWaList && (
              <div className="mt-2 rounded-md border border-border p-2 bg-background/60">
                {waPeople.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No team members found or no WhatsApp saved.</p>
                ) : (
                  <div className="space-y-1">
                    {waPeople.map((p) => {
                      const num = (p.whatsapp || "").replace(/[^\d+]/g, "")
                      const titlePrefix = [tournamentName, seasonName].filter(Boolean).join(" - ")
                      const title = titlePrefix ? `Reminder (${titlePrefix}):` : "Reminder:"
                      const text = encodeURIComponent(`${title} ${summary} on ${dateText}. Please be on time.`)
                      const href = num ? `https://wa.me/${encodeURIComponent(num)}?text=${text}` : undefined
                      return (
                        <div key={p.id} className="flex items-center justify-between gap-2">
                          <span className="text-sm truncate">{p.name}</span>
                          <Button asChild size="xs" variant="secondary" disabled={!href}>
                            <a href={href} target="_blank" rel="noopener noreferrer">
                              Send
                            </a>
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
