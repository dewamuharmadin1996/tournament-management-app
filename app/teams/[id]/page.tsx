import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PublicNav } from "@/components/public/public-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, User } from "lucide-react"
import Link from "next/link"
import { ChampionBadge } from "@/components/champion-badge"

export default async function PublicTeamPage({ params }: { params: { id: string } }) {
  const { id } = params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: team } = await supabase.from("teams").select("*").eq("id", id).single()

  if (!team) {
    notFound()
  }

  // Check privacy
  if (team.is_private && !user) {
    notFound()
  }

  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("*, people(*)")
    .eq("team_id", id)
    .order("created_at")

  const { data: achievements } = await supabase
    .from("standings")
    .select(
      `
      *,
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
    .eq("team_id", id)

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
        const isChampion = seasonStandings[0].team_id === id
        const isLoser = seasonStandings[seasonStandings.length - 1].team_id === id

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
            {team.logo_url && (
              <img
                src={team.logo_url || "/placeholder.svg"}
                alt={team.name}
                className="h-24 w-24 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h1 className="text-4xl font-bold tracking-tight mb-2">{team.name}</h1>
              <p className="text-muted-foreground">
                {teamMembers?.length || 0} member{teamMembers?.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {team.banner_url && (
          <div className="aspect-video mb-8 rounded-lg overflow-hidden glass-card">
            <img src={team.banner_url || "/placeholder.svg"} alt={team.name} className="w-full h-full object-cover" />
          </div>
        )}

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
                  teamName={team.name}
                  seasonName={achievement.season.name}
                  seasonId={achievement.season.id}
                  tournamentId={achievement.season.tournament.id}
                  isLoggedIn={!!user}
                />
              ))}
              {loserAchievements.map((achievement) => (
                <ChampionBadge
                  key={achievement.id}
                  type="loser"
                  label={achievement.season.loser_label || "Last Place"}
                  teamName={team.name}
                  seasonName={achievement.season.name}
                  seasonId={achievement.season.id}
                  tournamentId={achievement.season.tournament.id}
                  isLoggedIn={!!user}
                />
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            {teamMembers && teamMembers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teamMembers.map((tm) => {
                  const memberCard = (
                    <div
                      key={tm.id}
                      className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card/20 hover:border-primary/50 transition-colors"
                    >
                      <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center overflow-hidden">
                        {tm.people.avatar_url ? (
                          <img
                            src={tm.people.avatar_url || "/placeholder.svg"}
                            alt={tm.people.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{tm.people.name}</p>
                        {tm.people.role && <p className="text-sm text-muted-foreground truncate">{tm.people.role}</p>}
                      </div>
                    </div>
                  )

                  return !tm.people.is_private || user ? (
                    <Link key={tm.id} href={`/people/${tm.people.id}`}>
                      {memberCard}
                    </Link>
                  ) : (
                    memberCard
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p>No members in this team yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
