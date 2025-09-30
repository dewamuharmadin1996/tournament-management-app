import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { UserCircle } from "lucide-react"
import Link from "next/link"
import { PublicNav } from "@/components/public/public-nav"

export default async function PublicPeoplePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Show public people, or all if user is logged in
  const { data: people } = await supabase
    .from("people")
    .select("*")
    .or(user ? "is_private.eq.false,is_private.eq.true" : "is_private.eq.false")
    .order("name")

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav user={user} />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">People</h1>
          <p className="text-muted-foreground mt-2">Browse all players and staff</p>
        </div>

        {people && people.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {people.map((person) => (
              <Link key={person.id} href={`/people/${person.id}`}>
                <Card className="glass-card overflow-hidden hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-0">
                    <div className="aspect-square bg-muted/20 flex items-center justify-center">
                      {person.avatar_url ? (
                        <img
                          src={person.avatar_url || "/placeholder.svg"}
                          alt={person.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserCircle className="h-16 w-16 text-muted-foreground" />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-1">{person.name}</h3>
                      <p className="text-sm text-muted-foreground">{person.role || "No role"}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No people available</h3>
              <p className="text-muted-foreground text-center">Check back later</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
