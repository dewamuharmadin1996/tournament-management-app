import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PublicNav } from "@/components/public/public-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserCircle, Users } from "lucide-react"
import Link from "next/link"
import { ChampionBadge } from "@/components/champion-badge"

export default async function PublicPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: person } = await supabase.from("people").select("*").eq("id", id).single()

  if (!person) {
    notFound()
  }

  // Check privacy
  if (person.is_private && !user) {
    notFound()
  }

  const { data: teamMemberships } = await supabase
    .from("team_members")
    .select("*, teams(*)")
    .eq("person_id", id)
    .order("created_at")

  const teamIds = teamMemberships?.map((tm) => tm.team_id) || []

  const { data: achievements } = teamIds.length
    ? await supabase
        .from("standings")
        .select(
          `
        *,
        team:team_id(id, name, is_private),
        season:season_id(
          id,
          name,
          show_champion,
          show_loser,
          champion_label,
          loser_label,
          tournament:tournament_id(id, name)
        )
      `,
        )
        .in("team_id", teamIds)
    : { data: null }

  // Determine which achievements to show
  const championAchievements: any[] = []
  const loserAchievements: any[] = []

  if (achievements) {
    for (const achievement of achievements) {
      // Get all standings for this season to determine position
      const { data: seasonStandings } = await supabase
        .from("standings")
        .select("team_id, points, goal_difference")
        .eq("season_id", achievement.season_id)
        .order("points", { ascending: false })
        .order("goal_difference", { ascending: false })

      if (seasonStandings && seasonStandings.length > 0) {
        const isChampion = seasonStandings[0].team_id === achievement.team_id
        const isLoser = seasonStandings[seasonStandings.length - 1].team_id === achievement.team_id

        if (isChampion && achievement.season.show_champion) {
          championAchievements.push(achievement)
        }
        if (isLoser && achievement.season.show_loser && seasonStandings.length > 1) {
          loserAchievements.push(achievement)
        }
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav user={user} />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="glass-card p-8 mb-8">
          <div className="flex items-start gap-4">
            <div className="h-24 w-24 rounded-full bg-muted/20 flex items-center justify-center overflow-hidden">
              {person.avatar_url ? (
                <img
                  src={person.avatar_url || "/placeholder.svg"}
                  alt={person.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserCircle className="h-16 w-16 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold tracking-tight mb-2">{person.name}</h1>
              {person.role && <p className="text-muted-foreground text-lg">{person.role}</p>}
            </div>
          </div>
        </div>

        {(championAchievements.length > 0 || loserAchievements.length > 0) && (
          <Card className="glass-card mb-8">
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {championAchievements.map((achievement) => (
                <ChampionBadge
                  key={achievement.id}
                  type="champion"
                  label={achievement.season.champion_label || "Champion"}
                  teamName={achievement.team.name}
                  teamId={achievement.team.id}
                  seasonName={achievement.season.name}
                  seasonId={achievement.season.id}
                  tournamentId={achievement.season.tournament.id}
                  isLoggedIn={!!user}
                  isPrivate={achievement.team.is_private}
                />
              ))}
              {loserAchievements.map((achievement) => (
                <ChampionBadge
                  key={achievement.id}
                  type="loser"
                  label={achievement.season.loser_label || "Last Place"}
                  teamName={achievement.team.name}
                  teamId={achievement.team.id}
                  seasonName={achievement.season.name}
                  seasonId={achievement.season.id}
                  tournamentId={achievement.season.tournament.id}
                  isLoggedIn={!!user}
                  isPrivate={achievement.team.is_private}
                />
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Teams</CardTitle>
          </CardHeader>
          <CardContent>
            {teamMemberships && teamMemberships.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teamMemberships
                  .filter((tm) => !tm.teams.is_private || user)
                  .map((tm) => (
                    <Link key={tm.id} href={`/teams/${tm.teams.id}`}>
                      <Card className="glass-card hover:border-primary/50 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            {tm.teams.logo_url ? (
                              <img
                                src={tm.teams.logo_url || "/placeholder.svg"}
                                alt={tm.teams.name}
                                className="h-12 w-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-muted/20 flex items-center justify-center">
                                <Users className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{tm.teams.name}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p>Not a member of any team yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
