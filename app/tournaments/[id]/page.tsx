import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PublicNav } from "@/components/public/public-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ChampionBadge } from "@/components/champion-badge"

export default async function PublicTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: tournament } = await supabase.from("tournaments").select("*").eq("id", id).single()

  if (!tournament) {
    notFound()
  }

  // Check privacy
  if (tournament.is_private && !user) {
    notFound()
  }

  const { data: seasons } = await supabase
    .from("seasons")
    .select("*, season_teams(count)")
    .eq("tournament_id", id)
    .order("created_at", { ascending: false })

  const { data: lastCompletedSeason } = await supabase
    .from("seasons")
    .select("id, name")
    .eq("tournament_id", id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  let championData = null
  let loserData = null

  if (lastCompletedSeason) {
    // Get champion (highest points)
    if (tournament.show_champion) {
      const { data: champion } = await supabase
        .from("standings")
        .select("*, team:team_id(id, name, is_private)")
        .eq("season_id", lastCompletedSeason.id)
        .order("points", { ascending: false })
        .order("goal_difference", { ascending: false })
        .limit(1)
        .single()

      if (champion) {
        championData = {
          teamName: champion.team.name,
          teamId: champion.team.id,
          isPrivate: champion.team.is_private,
          seasonName: lastCompletedSeason.name,
          seasonId: lastCompletedSeason.id,
        }
      }
    }

    // Get loser (lowest points)
    if (tournament.show_loser) {
      const { data: loser } = await supabase
        .from("standings")
        .select("*, team:team_id(id, name, is_private)")
        .eq("season_id", lastCompletedSeason.id)
        .order("points", { ascending: true })
        .order("goal_difference", { ascending: true })
        .limit(1)
        .single()

      if (loser) {
        loserData = {
          teamName: loser.team.name,
          teamId: loser.team.id,
          isPrivate: loser.team.is_private,
          seasonName: lastCompletedSeason.name,
          seasonId: lastCompletedSeason.id,
        }
      }
    }
  }

  const formatLabels: Record<string, string> = {
    cup: "Cup",
    league: "League",
    double_elimination: "Double Elimination",
  }

  const statusColors: Record<string, "default" | "secondary" | "outline"> = {
    draft: "outline",
    active: "default",
    completed: "secondary",
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav user={user} />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="glass-card p-8 mb-8">
          {tournament.banner_url && (
            <div className="aspect-video mb-6 rounded-lg overflow-hidden">
              <img
                src={tournament.banner_url || "/placeholder.svg"}
                alt={tournament.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
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

          {(championData || loserData) && (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {championData && (
                <ChampionBadge
                  type="champion"
                  label={tournament.champion_label || "Champion"}
                  teamName={championData.teamName}
                  teamId={championData.teamId}
                  seasonName={championData.seasonName}
                  seasonId={championData.seasonId}
                  tournamentId={id}
                  isLoggedIn={!!user}
                  isPrivate={championData.isPrivate}
                />
              )}
              {loserData && (
                <ChampionBadge
                  type="loser"
                  label={tournament.loser_label || "Last Place"}
                  teamName={loserData.teamName}
                  teamId={loserData.teamId}
                  seasonName={loserData.seasonName}
                  seasonId={loserData.seasonId}
                  tournamentId={id}
                  isLoggedIn={!!user}
                  isPrivate={loserData.isPrivate}
                />
              )}
            </div>
          )}
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Seasons</h2>
        </div>

        {seasons && seasons.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {seasons.map((season) => (
              <Link key={season.id} href={`/tournaments/${id}/seasons/${season.id}`}>
                <Card className="glass-card hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{season.name}</h3>
                        <p className="text-sm text-muted-foreground">{formatLabels[season.format]}</p>
                      </div>
                      <Badge variant={statusColors[season.status]}>{season.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {season.season_teams[0]?.count || 0} team{season.season_teams[0]?.count !== 1 ? "s" : ""}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No seasons yet</h3>
              <p className="text-muted-foreground text-center">Seasons will appear here when they are created</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
