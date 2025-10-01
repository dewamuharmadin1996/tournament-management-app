import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PublicNav } from "@/components/public/public-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ChampionBadge } from "@/components/champion-badge"
import { Podium } from "@/components/podium"

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

  const seasonIdsCompleted = (seasons || []).filter((s: any) => s.status === "completed").map((s: any) => s.id)

  async function getTopByOrder(direction: "top" | "bottom") {
    if (!seasonIdsCompleted.length) return []

    // Fetch all standings sorted DESC, then pick index 0 for "top" and last index for "bottom".
    const queries = seasonIdsCompleted.map(async (sid) => {
      const { data: seasonStandings } = await supabase
        .from("standings")
        .select("team_id, team:team_id(id, is_private)")
        .eq("season_id", sid)
        .order("points", { ascending: false })
        .order("goal_difference", { ascending: false })

      if (!seasonStandings || seasonStandings.length === 0)
        return [] as Array<{ id: string; name: string; avatar_url: string | null; is_private: boolean }>

      const standing = direction === "top" ? seasonStandings[0] : seasonStandings[seasonStandings.length - 1]

      if (!standing?.team)
        return [] as Array<{ id: string; name: string; avatar_url: string | null; is_private: boolean }>

      // Respect team privacy for logged-out users
      if (!user && standing.team.is_private) return []

      const { data: members } = await supabase
        .from("team_members")
        .select("person:person_id(id, name, avatar_url, is_private)")
        .eq("team_id", standing.team_id)

      const people = (members || []).map((m: any) => m.person).filter(Boolean) as Array<{
        id: string
        name: string
        avatar_url: string | null
        is_private: boolean
      }>

      return people
    })

    const peopleArrays = await Promise.all(queries)
    const people = peopleArrays.flat()

    const map = new Map<
      string,
      { teamId: string; teamName: string; personId: string; count: number; isPrivate: boolean; logoUrl: string | null }
    >()

    for (const p of people) {
      if (!p) continue
      if (!user && p.is_private) continue

      const current = map.get(p.id)
      if (current) current.count += 1
      else
        map.set(p.id, {
          teamId: p.id,
          personId: p.id,
          teamName: p.name,
          count: 1,
          isPrivate: !!p.is_private,
          logoUrl: p.avatar_url || null,
        })
    }

    const list = Array.from(map.values())
    list.sort((a, b) => b.count - a.count || a.teamName.localeCompare(b.teamName))
    return list.slice(0, 4)
  }

  const [tourShame, tourFame] = await Promise.all([getTopByOrder("bottom"), getTopByOrder("top")])

  const { data: lastCompletedSeason } = await supabase
    .from("seasons")
    .select("id, name")
    .eq("tournament_id", id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  let championData = null
  let loserData = null

  if (lastCompletedSeason) {
    // Get champion (highest points)
    if (tournament.show_champion) {
      const { data: champion } = await supabase
        .from("standings")
        .select("*, team:team_id(id, name, is_private, logo_url)") // added logo_url
        .eq("season_id", lastCompletedSeason.id)
        .order("points", { ascending: false })
        .order("goal_difference", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (champion) {
        championData = {
          teamName: champion.team.name,
          teamId: champion.team.id,
          isPrivate: champion.team.is_private,
          seasonName: lastCompletedSeason.name,
          seasonId: lastCompletedSeason.id,
          logoUrl: champion.team.logo_url || null,
        }
      }
    }

    // Get loser (lowest points)
    if (tournament.show_loser) {
      const { data: loser } = await supabase
        .from("standings")
        .select("*, team:team_id(id, name, is_private, logo_url)") // added logo_url
        .eq("season_id", lastCompletedSeason.id)
        .order("points", { ascending: true })
        .order("goal_difference", { ascending: true })
        .limit(1)
        .maybeSingle()

      if (loser) {
        loserData = {
          teamName: loser.team.name,
          teamId: loser.team.id,
          isPrivate: loser.team.is_private,
          seasonName: lastCompletedSeason.name,
          seasonId: lastCompletedSeason.id,
          logoUrl: loser.team.logo_url || null,
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

        <Podium title="Tournament Hall of Shame" entries={tourShame} accent="shame" />
        <Podium title="Tournament Hall of Fame" entries={tourFame} accent="fame" />

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
