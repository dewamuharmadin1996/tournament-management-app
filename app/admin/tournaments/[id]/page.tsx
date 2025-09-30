import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, Settings } from "lucide-react"
import Link from "next/link"
import { SeasonsList } from "@/components/admin/seasons-list"

export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: tournament } = await supabase.from("tournaments").select("*").eq("id", id).single()

  if (!tournament) {
    notFound()
  }

  const { data: seasons } = await supabase
    .from("seasons")
    .select("*, season_teams(count)")
    .eq("tournament_id", id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{tournament.name}</h1>
            {tournament.description && <p className="text-muted-foreground mt-2">{tournament.description}</p>}
          </div>
          <Link href={`/admin/tournaments/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Seasons</h2>
          <p className="text-muted-foreground text-sm">Manage seasons for this tournament</p>
        </div>
        <Link href={`/admin/tournaments/${id}/seasons/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Season
          </Button>
        </Link>
      </div>

      <SeasonsList seasons={seasons || []} tournamentId={id} />
    </div>
  )
}
