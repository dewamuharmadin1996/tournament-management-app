import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, EyeOff } from "lucide-react"
import Link from "next/link"
import { PublicNav } from "@/components/public/public-nav"

export default async function PublicTournamentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Show public tournaments, or all if user is logged in
  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*, seasons(count)")
    .or(user ? "is_private.eq.false,is_private.eq.true" : "is_private.eq.false")
    .order("created_at", { ascending: false })

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav user={user} />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Tournaments</h1>
          <p className="text-muted-foreground mt-2">Browse all active tournaments</p>
        </div>

        {tournaments && tournaments.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => (
              <Link key={tournament.id} href={`/tournaments/${tournament.id}`}>
                <Card className="glass-card overflow-hidden hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-0">
                    <div className="aspect-video bg-muted/20 flex items-center justify-center relative">
                      {tournament.logo_url ? (
                        <img
                          src={tournament.logo_url || "/placeholder.svg"}
                          alt={tournament.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Trophy className="h-12 w-12 text-muted-foreground" />
                      )}
                      {tournament.is_private && (
                        <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 text-xs">
                          <EyeOff className="h-3 w-3" />
                          Private
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1">{tournament.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {tournament.description || "No description"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {tournament.seasons[0]?.count || 0} season{tournament.seasons[0]?.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tournaments available</h3>
              <p className="text-muted-foreground text-center">Check back later for upcoming tournaments</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
