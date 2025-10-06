"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, MessageCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { MatchCard } from "./match-card"

interface Match {
  id: string
  round: number
  match_number: number
  bracket_position: string | null
  team1_id: string | null
  team2_id: string | null
  team1_score: number | null
  team2_score: number | null
  winner_id: string | null
  status: string
  team1: { name: string } | null
  team2: { name: string } | null
  winner: { name: string } | null
  scheduled_at?: string // added scheduled_at field
}

interface SeasonTeam {
  id: string
  teams: {
    id: string
    name: string
  }
}

export function MatchesView({
  seasonId,
  matches,
  format,
  seasonTeams,
  tournamentName,
  seasonName,
  hasStandingsPoints = false,
}: {
  seasonId: string
  matches: Match[]
  format: string
  seasonTeams: SeasonTeam[]
  tournamentName?: string
  seasonName?: string
  hasStandingsPoints?: boolean
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [showBulkWA, setShowBulkWA] = useState(false) // toggle for bulk WhatsApp panel
  const [bulkPeople, setBulkPeople] = useState<
    Array<{ id: string; name: string; whatsapp: string | null; team_id: string }>
  >([]) // store people with team
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false) // toggle to hide completed matches
  const [showOngoingOnly, setShowOngoingOnly] = useState(false) // toggle for ongoing-only filter
  const router = useRouter()
  const supabase = createClient()

  const handleGenerateMatches = async () => {
    setIsGenerating(true)

    try {
      if (format === "league") {
        await generateLeagueMatches()
      } else if (format === "cup") {
        await generateCupMatches()
      } else if (format === "double_elimination") {
        await generateDoubleEliminationMatches()
      }

      // ask server to create calendar events for all newly scheduled matches
      try {
        await fetch(`/api/seasons/${seasonId}/calendar/sync`, { method: "POST" })
      } catch (e) {
        // ignore sync error; UI still updates
      }

      router.refresh()
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerateMatches = async () => {
    const msg = hasStandingsPoints
      ? "Standings points have already been updated from completed matches. Regenerating will DELETE all current matches for this season. This does not automatically reset standings. Continue?"
      : "This will DELETE all current matches for this season and regenerate the schedule. Continue?"

    if (!window.confirm(msg)) return

    setIsGenerating(true)
    try {
      await supabase.from("matches").delete().eq("season_id", seasonId)

      if (format === "league") {
        // Avoid re-inserting standings; they already exist (unique constraint)
        await generateLeagueMatches(false)
      } else if (format === "cup") {
        await generateCupMatches()
      } else if (format === "double_elimination") {
        await generateDoubleEliminationMatches()
      }

      try {
        await fetch(`/api/seasons/${seasonId}/calendar/sync`, { method: "POST" })
      } catch {}
      router.refresh()
    } finally {
      setIsGenerating(false)
    }
  }

  const generateLeagueMatches = async (insertStandings = true) => {
    const teams = seasonTeams.map((st) => st.teams.id)
    const matchesToCreate = []

    // Round robin: each team plays every other team once
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matchesToCreate.push({
          season_id: seasonId,
          round: 1,
          match_number: matchesToCreate.length + 1,
          team1_id: teams[i],
          team2_id: teams[j],
          status: "scheduled",
        })
      }
    }

    await supabase.from("matches").insert(matchesToCreate)

    if (insertStandings) {
      const standingsToCreate = teams.map((teamId) => ({
        season_id: seasonId,
        team_id: teamId,
      }))
      await supabase.from("standings").insert(standingsToCreate)
    }
  }

  const generateCupMatches = async () => {
    const teams = seasonTeams.map((st) => st.teams.id)
    const matchesToCreate = []

    // Single elimination bracket
    const numTeams = teams.length
    const numRounds = Math.ceil(Math.log2(numTeams))

    // First round
    for (let i = 0; i < teams.length; i += 2) {
      if (i + 1 < teams.length) {
        matchesToCreate.push({
          season_id: seasonId,
          round: 1,
          match_number: Math.floor(i / 2) + 1,
          team1_id: teams[i],
          team2_id: teams[i + 1],
          status: "scheduled",
        })
      }
    }

    await supabase.from("matches").insert(matchesToCreate)
  }

  const generateDoubleEliminationMatches = async () => {
    const teams = seasonTeams.map((st) => st.teams.id)
    const matchesToCreate = []

    // Upper bracket first round
    for (let i = 0; i < teams.length; i += 2) {
      if (i + 1 < teams.length) {
        matchesToCreate.push({
          season_id: seasonId,
          round: 1,
          match_number: Math.floor(i / 2) + 1,
          bracket_position: "upper",
          team1_id: teams[i],
          team2_id: teams[i + 1],
          status: "scheduled",
        })
      }
    }

    await supabase.from("matches").insert(matchesToCreate)
  }

  const loadBulkPeople = async () => {
    setShowBulkWA((v) => !v)
    if (bulkPeople.length || seasonTeams.length === 0) return
    const teamIds = seasonTeams.map((t) => t.teams.id)
    // Supabase query for all members across teamIds
    const { data } = await supabase
      .from("team_members")
      .select("team_id, people:person_id(id, name, whatsapp)")
      .in("team_id", teamIds)

    const list = (data || [])
      .map((row: any) => ({ team_id: row.team_id, ...row.people }))
      .filter((p: any) => p && p.id) as Array<{ id: string; name: string; whatsapp: string | null; team_id: string }>

    // Deduplicate by person id (keep first team_id)
    const seen = new Set<string>()
    const unique: Array<{ id: string; name: string; whatsapp: string | null; team_id: string }> = []
    for (const p of list) {
      if (!seen.has(p.id)) {
        seen.add(p.id)
        unique.push(p)
      }
    }
    setBulkPeople(unique)
  }

  const buildScheduleText = (person: { id: string; name: string; team_id: string }) => {
    const myTeamId = person.team_id
    const myMatches = matches.filter((m) => m.team1_id === myTeamId || m.team2_id === myTeamId)
    const lines = myMatches.map((m) => {
      const opponentName = m.team1_id === myTeamId ? m.team2?.name || "TBD" : m.team1?.name || "TBD"
      const when = m["scheduled_at" as keyof typeof m]
        ? new Date(String(m["scheduled_at" as keyof typeof m])).toLocaleString()
        : "TBD"
      return `- ${when}: ${m.team1?.name || "TBD"} vs ${m.team2?.name || "TBD"} (Opp: ${opponentName})`
    })
    const headerPrefix = [tournamentName, seasonName].filter(Boolean).join(" - ")
    const header = headerPrefix
      ? `Schedule Reminder (${headerPrefix}) for ${person.name}`
      : `Schedule Reminder for ${person.name}`
    return `${header}\n${lines.join("\n")}`.trim()
  }

  const visibleMatches = showOngoingOnly
    ? matches.filter((m) => m.status === "in_progress")
    : showUpcomingOnly
      ? matches.filter((m) => m.status !== "completed")
      : matches

  const now = Date.now()
  const nonCompleted = visibleMatches.filter((m) => m.status !== "completed")
  const futureWithDates = nonCompleted
    .filter((m) => !!m.scheduled_at)
    .sort((a, b) => new Date(a.scheduled_at as string).getTime() - new Date(b.scheduled_at as string).getTime())
  const nextFuture = futureWithDates.find((m) => new Date(m.scheduled_at as string).getTime() >= now)
  const fallbackByDate = futureWithDates[0]
  const fallbackByNumber = nonCompleted.slice().sort((a, b) => a.match_number - b.match_number)[0]
  const nextMatchId = (nextFuture || fallbackByDate || fallbackByNumber)?.id

  const groupedMatches = visibleMatches.reduce(
    (acc, match) => {
      const key = match.bracket_position || "main"
      if (!acc[key]) acc[key] = {}
      if (!acc[key][match.round]) acc[key][match.round] = []
      acc[key][match.round].push(match)
      return acc
    },
    {} as Record<string, Record<number, Match[]>>,
  )

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Matches</CardTitle>
          <div className="flex items-center gap-2">
            {matches.length > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUpcomingOnly((v) => {
                      const next = !v
                      if (next) setShowOngoingOnly(false)
                      return next
                    })
                  }}
                >
                  {showUpcomingOnly ? "Show All" : "Upcoming Only"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setShowOngoingOnly((v) => {
                      const next = !v
                      if (next) setShowUpcomingOnly(false)
                      return next
                    })
                  }}
                >
                  {showOngoingOnly ? "Show All" : "Ongoing Only"}
                </Button>
              </>
            )}
            {matches.length === 0 && seasonTeams.length >= 2 && (
              <Button onClick={handleGenerateMatches} disabled={isGenerating}>
                <Zap className="mr-2 h-4 w-4" />
                {isGenerating ? "Generating..." : "Generate Matches"}
              </Button>
            )}
            {matches.length > 0 && seasonTeams.length >= 2 && (
              <Button onClick={handleRegenerateMatches} disabled={isGenerating}>
                <Zap className="mr-2 h-4 w-4" />
                {isGenerating ? "Regenerating..." : "Regenerate Matches"}
              </Button>
            )}
            {matches.length > 0 && (
              <Button variant="outline" onClick={loadBulkPeople}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Bulk WhatsApp Reminders
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {showBulkWA && (
          <div className="mb-6 rounded-md border border-border p-4 bg-background/60">
            <h4 className="font-medium mb-2">Send reminders to players</h4>
            {bulkPeople.length === 0 ? (
              <p className="text-sm text-muted-foreground">Loading players or none with WhatsApp saved.</p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {bulkPeople.map((p) => {
                  const num = (p.whatsapp || "").replace(/[^\d+]/g, "")
                  const text = encodeURIComponent(buildScheduleText(p))
                  const href = num ? `https://wa.me/${encodeURIComponent(num)}?text=${text}` : undefined
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-2">
                      <span className="truncate">{p.name}</span>
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
        {matches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>
              {seasonTeams.length < 2
                ? "Add at least 2 teams to generate matches"
                : "Click Generate Matches to create the schedule"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMatches).map(([bracket, rounds]) => (
              <div key={bracket}>
                {bracket !== "main" && <h3 className="text-lg font-semibold mb-3 capitalize">{bracket} Bracket</h3>}
                {Object.entries(rounds).map(([round, roundMatches]) => (
                  <div key={round} className="mb-6">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Round {round}</h4>
                    <div className="grid gap-3 md:grid-cols-2">
                      {roundMatches.map((match) => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          tournamentName={tournamentName}
                          seasonName={seasonName}
                          isNextMatch={match.id === nextMatchId}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
