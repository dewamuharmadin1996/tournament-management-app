"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { CreateTeamDialog } from "./create-team-dialog"

interface Team {
  id: string
  name: string
  logo_url: string | null
}

export function AddTeamDialog({
  open,
  onOpenChange,
  seasonId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  seasonId: string
}) {
  const [teams, setTeams] = useState<Team[]>([])
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([])
  const [search, setSearch] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      loadTeams()
    }
  }, [open])

  useEffect(() => {
    if (search) {
      setFilteredTeams(teams.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())))
    } else {
      setFilteredTeams(teams)
    }
  }, [search, teams])

  const loadTeams = async () => {
    const { data: existingTeams } = await supabase.from("season_teams").select("team_id").eq("season_id", seasonId)

    const existingTeamIds = existingTeams?.map((st) => st.team_id) || []

    const { data } = await supabase.from("teams").select("*").order("name")

    setTeams(data?.filter((t) => !existingTeamIds.includes(t.id)) || [])
  }

  const handleAddTeam = async (teamId: string) => {
    await supabase.from("season_teams").insert({ season_id: seasonId, team_id: teamId })
    onOpenChange(false)
    router.refresh()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team to Season</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search Teams</Label>
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {filteredTeams.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">No teams available</p>
                  <Button onClick={() => setShowCreateDialog(true)} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Team
                  </Button>
                </div>
              ) : (
                filteredTeams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => handleAddTeam(team.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left"
                  >
                    <div className="h-10 w-10 rounded-full bg-muted/20 flex items-center justify-center overflow-hidden">
                      {team.logo_url ? (
                        <img
                          src={team.logo_url || "/placeholder.svg"}
                          alt={team.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold">{team.name.substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="font-medium">{team.name}</span>
                  </button>
                ))
              )}
            </div>

            <Button variant="outline" onClick={() => setShowCreateDialog(true)} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Create New Team
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CreateTeamDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          loadTeams()
          setShowCreateDialog(false)
        }}
      />
    </>
  )
}
