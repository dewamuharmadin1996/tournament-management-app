import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Users, UserCircle, Calendar } from "lucide-react"

export default async function AdminDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ count: tournamentsCount }, { count: teamsCount }, { count: peopleCount }, { count: seasonsCount }] =
    await Promise.all([
      supabase.from("tournaments").select("*", { count: "exact", head: true }).eq("created_by", user?.id),
      supabase.from("teams").select("*", { count: "exact", head: true }).eq("created_by", user?.id),
      supabase.from("people").select("*", { count: "exact", head: true }).eq("created_by", user?.id),
      supabase
        .from("seasons")
        .select("*, tournaments!inner(created_by)", { count: "exact", head: true })
        .eq("tournaments.created_by", user?.id),
    ])

  const stats = [
    {
      title: "Tournaments",
      value: tournamentsCount || 0,
      icon: Trophy,
      description: "Your tournaments",
    },
    {
      title: "Teams",
      value: teamsCount || 0,
      icon: Users,
      description: "Your teams",
    },
    {
      title: "People",
      value: peopleCount || 0,
      icon: UserCircle,
      description: "Your people",
    },
    {
      title: "Seasons",
      value: seasonsCount || 0,
      icon: Calendar,
      description: "Your seasons",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome to your tournament management system</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/admin/tournaments/new"
              className="block p-3 rounded-lg hover:bg-accent transition-colors border border-border"
            >
              <div className="font-medium">Create Tournament</div>
              <div className="text-sm text-muted-foreground">Start a new tournament</div>
            </a>
            <a
              href="/admin/teams"
              className="block p-3 rounded-lg hover:bg-accent transition-colors border border-border"
            >
              <div className="font-medium">Manage Teams</div>
              <div className="text-sm text-muted-foreground">Add or edit teams</div>
            </a>
            <a
              href="/admin/people"
              className="block p-3 rounded-lg hover:bg-accent transition-colors border border-border"
            >
              <div className="font-medium">Manage People</div>
              <div className="text-sm text-muted-foreground">Add or edit people</div>
            </a>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Follow these steps to set up your first tournament</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                1
              </div>
              <div>
                <div className="font-medium">Add Teams</div>
                <div className="text-sm text-muted-foreground">Create teams in the Team Master</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                2
              </div>
              <div>
                <div className="font-medium">Add People</div>
                <div className="text-sm text-muted-foreground">Add team members in People Master</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                3
              </div>
              <div>
                <div className="font-medium">Create Tournament</div>
                <div className="text-sm text-muted-foreground">Set up a tournament with seasons</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
