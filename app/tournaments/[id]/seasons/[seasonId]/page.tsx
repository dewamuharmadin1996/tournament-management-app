import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PublicNav } from "@/components/public/public-nav"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PublicMatchesView } from "@/components/public/public-matches-view"
import { PublicStandingsView } from "@/components/public/public-standings-view"
import { PublicTeamsView } from "@/components/public/public-teams-view"
import { ChampionBadge } from "@/components/champion-badge"

export default async function PublicSeasonPage({
  params,
}: {
  params: Promise<{ id: string; seasonId: string }>
}) {
  const { id, seasonId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: tournament } = await supabase.from("tournaments").select("*").eq("id", id).single()

  if (!tournament || (tournament.is_private && !user)) {
    notFound()
  }

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
    .select(
      "*, team1:team1_id(id, name, logo_url, is_private), team2:team2_id(id, name, logo_url, is_private), winner:winner_id(name)",
    )
    .eq("season_id", seasonId)
    .order("round")
    .order("match_number")

  const { data: standings } = await supabase
    .from("standings")
    .select("*, team:team_id(id, name, logo_url, is_private)")
    .eq("season_id", seasonId)
    .order("points", { ascending: false })
    .order("goal_difference", { ascending: false })

  let championData = null
  let loserData = null

  if (standings && standings.length > 0) {
    if (season.show_champion) {
      const champion = standings[0]
      championData = {
        teamName: champion.team.name,
        teamId: champion.team.id,
        isPrivate: champion.team.is_private,
      }
    }

    if (season.show_loser) {
      const loser = standings[standings.length - 1]
      loserData = {
        teamName: loser.team.name,
        teamId: loser.team.id,
        isPrivate: loser.team.is_private,
      }
    }
  }

  const formatLabels: Record<string, string> = {
    cup: "Cup (Single Elimination)",
    league: "League (Round Robin)",
    double_elimination: "Double Elimination",
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav user={user} />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="glass-card p-6 mb-8">
          <div className="flex items-start gap-4 mb-4">
            {tournament.logo_url && (
              <img
                src={tournament.logo_url || "/placeholder.svg"}
                alt={tournament.name}
                className="h-16 w-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h1 className="text-4xl font-bold tracking-tight mb-2">{tournament.name}</h1>
              {tournament.description && <p className="text-muted-foreground text-lg">{tournament.description}</p>}
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{season.name}</h1>
          <p className="text-muted-foreground mt-1">{formatLabels[season.format]}</p>

          {(championData || loserData) && (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {championData && (
                <ChampionBadge
                  type="champion"
                  label={season.champion_label || "Champion"}
                  teamName={championData.teamName}
                  teamId={championData.teamId}
                  isLoggedIn={!!user}
                  isPrivate={championData.isPrivate}
                />
              )}
              {loserData && (
                <ChampionBadge
                  type="loser"
                  label={season.loser_label || "Last Place"}
                  teamName={loserData.teamName}
                  teamId={loserData.teamId}
                  isLoggedIn={!!user}
                  isPrivate={loserData.isPrivate}
                />
              )}
            </div>
          )}
        </div>

        <Tabs defaultValue="matches" className="space-y-6">
          <TabsList className="glass-card">
            <TabsTrigger value="matches">Matches</TabsTrigger>
            {season.format === "league" && <TabsTrigger value="standings">Standings</TabsTrigger>}
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>

          <TabsContent value="matches">
            <PublicMatchesView matches={matches || []} format={season.format} isLoggedIn={!!user} />
          </TabsContent>

          {season.format === "league" && (
            <TabsContent value="standings">
              <PublicStandingsView standings={standings || []} isLoggedIn={!!user} />
            </TabsContent>
          )}

          <TabsContent value="teams">
            <PublicTeamsView seasonTeams={seasonTeams || []} isLoggedIn={!!user} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
