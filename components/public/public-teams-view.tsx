import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, EyeOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface SeasonTeam {
  id: string
  teams: {
    id: string
    name: string
    logo_url: string | null
    is_private: boolean
  }
}

export function PublicTeamsView({ seasonTeams, isLoggedIn }: { seasonTeams: SeasonTeam[]; isLoggedIn: boolean }) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Teams</CardTitle>
      </CardHeader>
      <CardContent>
        {seasonTeams.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p>No teams in this season yet</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {seasonTeams.map((st) => {
              const teamCard = (
                <Card key={st.teams.id} className="bg-card/20 border-border hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center overflow-hidden">
                        {st.teams.logo_url ? (
                          <img
                            src={st.teams.logo_url || "/placeholder.svg"}
                            alt={st.teams.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold">{st.teams.name.substring(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{st.teams.name}</h3>
                        {st.teams.is_private && isLoggedIn && (
                          <Badge variant="outline" className="text-xs mt-1">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Private
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )

              return !st.teams.is_private || isLoggedIn ? (
                <Link key={st.id} href={`/teams/${st.teams.id}`}>
                  {teamCard}
                </Link>
              ) : (
                <div key={st.id}>{teamCard}</div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
