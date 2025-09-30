"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"
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
}: {
  seasonId: string
  matches: Match[]
  format: string
  seasonTeams: SeasonTeam[]
}) {
  const [isGenerating, setIsGenerating] = useState(false)
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

      router.refresh()
    } finally {
      setIsGenerating(false)
    }
  }

  const generateLeagueMatches = async () => {
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

    // Initialize standings
    const standingsToCreate = teams.map((teamId) => ({
      season_id: seasonId,
      team_id: teamId,
    }))

    await supabase.from("standings").insert(standingsToCreate)
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

  const groupedMatches = matches.reduce(
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
          {matches.length === 0 && seasonTeams.length >= 2 && (
            <Button onClick={handleGenerateMatches} disabled={isGenerating}>
              <Zap className="mr-2 h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate Matches"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
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
                        <MatchCard key={match.id} match={match} />
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
