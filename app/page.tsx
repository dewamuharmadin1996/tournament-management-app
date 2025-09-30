import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Trophy, Users, Calendar, Shield } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass-nav sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">Tournament Manager</h1>
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
