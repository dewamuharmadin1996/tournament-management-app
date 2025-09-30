import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import Link from "next/link"
import { SeasonTeamsManager } from "@/components/admin/season-teams-manager"
import { MatchesView } from "@/components/admin/matches-view"
import { StandingsView } from "@/components/admin/standings-view"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function SeasonDetailPage({
  params,
}: {
  params: Promise<{ id: string; seasonId: string }>
}) {
  const { id, seasonId } = await params
  const supabase = await createClient()

  const { data: season } = await supabase.from("seasons").select("*").eq("id", seasonId).single()

  if (!season) {
    notFound()
  }

  const { data: seasonTeams } = await supabase
    .from("season_teams")
    .select("*, teams(*)")
    .eq("season_id", seasonId)
    .order("created_at")

  const { data: matches } = await supabase
    .from("matches")
    .select("*, team1:team1_id(name), team2:team2_id(name), winner:winner_id(name)")
    .eq("season_id", seasonId)
    .order("round")
    .order("match_number")

  const { data: standings } = await supabase
    .from("standings")
    .select("*, team:team_id(name, logo_url)")
    .eq("season_id", seasonId)
    .order("points", { ascending: false })
    .order("goal_difference", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{season.name}</h1>
            <p className="text-muted-foreground mt-1">
              {season.format === "cup" && "Cup (Single Elimination)"}
              {season.format === "league" && "League (Round Robin)"}
              {season.format === "double_elimination" && "Double Elimination"}
            </p>
          </div>
          <Link href={`/admin/tournaments/${id}/seasons/${seasonId}/edit`}>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="teams" className="space-y-6">
        <TabsList className="glass-card">
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          {season.format === "league" && <TabsTrigger value="standings">Standings</TabsTrigger>}
        </TabsList>

        <TabsContent value="teams" className="space-y-4">
          <SeasonTeamsManager seasonId={seasonId} seasonTeams={seasonTeams || []} />
        </TabsContent>

        <TabsContent value="matches" className="space-y-4">
          <MatchesView
            seasonId={seasonId}
            matches={matches || []}
            format={season.format}
            seasonTeams={seasonTeams || []}
          />
        </TabsContent>

        {season.format === "league" && (
          <TabsContent value="standings" className="space-y-4">
            <StandingsView standings={standings || []} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
