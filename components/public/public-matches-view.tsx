"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EyeOff } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface Match {
  id: string
  round: number
  match_number: number
  bracket_position: string | null
  team1_score: number | null
  team2_score: number | null
  status: string
  team1: { id: string; name: string; logo_url: string | null; is_private: boolean } | null
  team2: { id: string; name: string; logo_url: string | null; is_private: boolean } | null
  scheduled_at?: string | null
}

export function PublicMatchesView({
  matches,
  format,
  isLoggedIn,
}: {
  matches: Match[]
  format: string
  isLoggedIn: boolean
}) {
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false)

  const visibleMatches = showUpcomingOnly ? matches.filter((m) => m.status !== "completed") : matches

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

  const renderTeam = (team: Match["team1"], score: number | null) => {
    if (!team) return <span className="text-muted-foreground">TBD</span>

    const showPrivateBadge = team.is_private && isLoggedIn
    const teamContent = (
      <>
        {team.logo_url && (
          <img src={team.logo_url || "/placeholder.svg"} alt="" className="h-6 w-6 rounded-full object-cover" />
        )}
        <span className="font-medium">{team.name}</span>
        {showPrivateBadge && (
          <Badge variant="outline" className="text-xs">
            <EyeOff className="h-3 w-3 mr-1" />
            Private
          </Badge>
        )}
        {score !== null && <span className="ml-auto text-lg font-bold">{score}</span>}
      </>
    )

    return (
      <div className="flex items-center gap-2 flex-1">
        {!team.is_private || isLoggedIn ? (
          <Link href={`/teams/${team.id}`} className="flex items-center gap-2 flex-1 hover:underline">
            {teamContent}
          </Link>
        ) : (
          teamContent
        )}
      </div>
    )
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Matches</CardTitle>
        {matches.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setShowUpcomingOnly((v) => !v)}>
            {showUpcomingOnly ? "Show All" : "Upcoming Only"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No matches scheduled yet</p>
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
                      {roundMatches.map((match) => {
                        const label =
                          match.status === "scheduled"
                            ? "upcoming"
                            : match.status === "in_progress"
                              ? "ongoing"
                              : "finished"
                        const variant =
                          match.status === "completed"
                            ? "secondary"
                            : match.status === "in_progress"
                              ? "default"
                              : "outline"
                        return (
                          <Card
                            key={match.id}
                            className={`bg-card/20 border-border ${
                              match.id === nextMatchId ? "ring-2 ring-primary/60 bg-primary/10" : ""
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <Badge variant={variant}>{label}</Badge>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  {renderTeam(match.team1, match.team1_score)}
                                </div>
                                <div className="flex items-center gap-2">
                                  {renderTeam(match.team2, match.team2_score)}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
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
