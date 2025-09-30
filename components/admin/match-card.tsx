"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"

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
}

export function MatchCard({ match }: { match: Match }) {
  const [team1Score, setTeam1Score] = useState(match.team1_score?.toString() || "")
  const [team2Score, setTeam2Score] = useState(match.team2_score?.toString() || "")
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleUpdateScore = async () => {
    setIsUpdating(true)

    try {
      const score1 = Number.parseInt(team1Score) || 0
      const score2 = Number.parseInt(team2Score) || 0

      let winnerId = null
      if (score1 > score2) winnerId = match.team1_id
      else if (score2 > score1) winnerId = match.team2_id

      await supabase
        .from("matches")
        .update({
          team1_score: score1,
          team2_score: score2,
          winner_id: winnerId,
          status: "completed",
        })
        .eq("id", match.id)

      router.refresh()
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className="bg-card/20 border-border">
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

        <Button onClick={handleUpdateScore} disabled={isUpdating} size="sm" className="w-full mt-3">
          {isUpdating ? "Updating..." : "Update Score"}
        </Button>
      </CardContent>
    </Card>
  )
}
