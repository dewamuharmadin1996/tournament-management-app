"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AddTeamDialog } from "./add-team-dialog"
import { RandomizeTeamsDialog } from "./randomize-teams-dialog"

interface SeasonTeam {
  id: string
  teams: {
    id: string
    name: string
    logo_url: string | null
  }
}

export function SeasonTeamsManager({ seasonId, seasonTeams }: { seasonId: string; seasonTeams: SeasonTeam[] }) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showRandomizeDialog, setShowRandomizeDialog] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRemoveTeam = async (seasonTeamId: string) => {
    await supabase.from("season_teams").delete().eq("id", seasonTeamId)
    router.refresh()
  }

  return (
    <>
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Teams in Season</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowRandomizeDialog(true)} size="sm">
                Randomize Teams
              </Button>
              <Button onClick={() => setShowAddDialog(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Team
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {seasonTeams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No teams added yet. Add teams to start the season.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {seasonTeams.map((st) => (
                <div key={st.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/20">
                  <div className="h-10 w-10 rounded-full bg-muted/20 flex items-center justify-center overflow-hidden">
                    {st.teams.logo_url ? (
                      <img
                        src={st.teams.logo_url || "/placeholder.svg"}
                        alt={st.teams.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold">{st.teams.name.substring(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="flex-1 font-medium">{st.teams.name}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveTeam(st.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddTeamDialog open={showAddDialog} onOpenChange={setShowAddDialog} seasonId={seasonId} />
      <RandomizeTeamsDialog
        open={showRandomizeDialog}
        onOpenChange={setShowRandomizeDialog}
        seasonId={seasonId}
        onDone={() => {
          setShowRandomizeDialog(false)
          router.refresh()
        }}
      />
    </>
  )
}
