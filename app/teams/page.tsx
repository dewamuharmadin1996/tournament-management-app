import { createClient } from "@/lib/supabase/server"
import { PublicNav } from "@/components/public/public-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Users, EyeOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default async function TeamsHistoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: teams } = await supabase
    .from("teams")
    .select("*, team_members(count)")
    .or(user ? "is_private.eq.false,is_private.eq.true" : "is_private.eq.false")
    .order("name")

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav user={user} />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Team History</h1>
          <p className="text-muted-foreground mt-2">Browse all teams across tournaments</p>
        </div>

        {teams && teams.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {teams.map((team) => (
              <Card key={team.id} className="glass-card">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center overflow-hidden mb-4">
                      {team.logo_url ? (
                        <img
                          src={team.logo_url || "/placeholder.svg"}
                          alt={team.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Users className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{team.name}</h3>
                    {team.is_private && user && (
                      <Badge variant="outline" className="mb-2">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Private
                      </Badge>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {team.team_members[0]?.count || 0} member{team.team_members[0]?.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No teams available</h3>
              <p className="text-muted-foreground text-center">Teams will appear here when they are created</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
