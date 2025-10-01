import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Trophy, Users, Calendar, Shield } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Podium } from "@/components/podium"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: seasons } = await supabase.from("seasons").select("id").eq("status", "completed")
  const seasonIds = (seasons || []).map((s) => s.id)

  async function getTopByOrder(direction: "top" | "bottom") {
    const queries = seasonIds.map(async (sid) => {
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

      // Fetch members of the selected team and map to people
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
      // Respect person privacy for logged-out users
      if (!user && p.is_private) continue

      const key = p.id
      const current = map.get(key)
      if (current) {
        current.count += 1
      } else {
        map.set(key, {
          teamId: p.id,
          personId: p.id,
          teamName: p.name,
          count: 1,
          isPrivate: !!p.is_private,
          logoUrl: p.avatar_url || null,
        })
      }
    }

    const list = Array.from(map.values())
    list.sort((a, b) => b.count - a.count || a.teamName.localeCompare(b.teamName))
    return list.slice(0, 4)
  }

  const [allTimeShame, allTimeFame] = await Promise.all([getTopByOrder("bottom"), getTopByOrder("top")])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass-nav sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src="/images/tournament-manager-logo.png" alt="" className="h-8 w-8 rounded-md" />
            <span className="sr-only">Tournament Manager</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/tournaments">
              <Button variant="ghost">Tournaments</Button>
            </Link>
            <Link href="/teams">
              <Button variant="ghost">Teams</Button>
            </Link>
            {user ? (
              <Link href="/admin">
                <Button>My Dashboard</Button>
              </Link>
            ) : (
              <Link href="/auth/login">
                <Button>Login</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Podium title="All-Time Hall of Shame" entries={allTimeShame} accent="shame" />

        <Podium title="All-Time Hall of Fame" entries={allTimeFame} accent="fame" />

        <section className="container mx-auto px-4 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-5xl font-bold tracking-tight text-balance">Manage Your Tournaments with Style</h2>
            <p className="mb-8 text-xl text-muted-foreground text-pretty">
              Create and manage tournaments with Cup, League, and Double Elimination formats. Track teams, players, and
              standings with ease. Full privacy controls and file upload support.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/tournaments">
                <Button size="lg">View Tournaments</Button>
              </Link>
              {user ? (
                <Link href="/admin">
                  <Button size="lg" variant="outline">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signup">
                  <Button size="lg" variant="outline">
                    Sign Up
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Add Subscribe to Calendar buttons using GOOGLE_CALENDAR_ID */}
        {(() => {
          const calendarId = process.env.GOOGLE_CALENDAR_ID
          if (!calendarId) return null
          const encoded = encodeURIComponent(calendarId)
          const googleLink = `https://calendar.google.com/calendar/r?cid=${encoded}`
          const icsLink = `https://calendar.google.com/calendar/ical/${encoded}/public/basic.ics`
          return (
            <section className="container mx-auto px-4 pb-8">
              <div className="mx-auto max-w-3xl rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                <h3 className="mb-2 text-2xl font-bold">Subscribe to Our Public Calendar</h3>
                <p className="mb-6 text-muted-foreground">
                  Stay up to date with upcoming matches. Add the league calendar to your favorite app.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <a href={googleLink} target="_blank" rel="noopener noreferrer">
                    <Button size="lg">Add to Google Calendar</Button>
                  </a>
                  <a href={icsLink} target="_blank" rel="noopener noreferrer">
                    <Button size="lg" variant="outline">
                      Subscribe via ICS
                    </Button>
                  </a>
                </div>
              </div>
            </section>
          )
        })()}

        <section className="container mx-auto px-4 py-16">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="glass-card p-6 text-center">
              <Trophy className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-xl font-bold">Multiple Formats</h3>
              <p className="text-muted-foreground text-sm">
                Support for Cup, League, and Double Elimination tournaments
              </p>
            </div>
            <div className="glass-card p-6 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-xl font-bold">Team Management</h3>
              <p className="text-muted-foreground text-sm">Manage teams and players with master data organization</p>
            </div>
            <div className="glass-card p-6 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-xl font-bold">Auto Scheduling</h3>
              <p className="text-muted-foreground text-sm">Automatic bracket and schedule generation for all formats</p>
            </div>
            <div className="glass-card p-6 text-center">
              <Shield className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-xl font-bold">Privacy Controls</h3>
              <p className="text-muted-foreground text-sm">
                Granular privacy settings for tournaments, teams, and people
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="glass-nav border-t border-white/10 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Tournament Manager - Built with Next.js, Supabase, and Vercel Blob</p>
        </div>
      </footer>
    </div>
  )
}
