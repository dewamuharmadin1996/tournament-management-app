import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { TournamentsList } from "@/components/admin/tournaments-list"

export default async function TournamentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*, seasons(count)")
    .eq("created_by", user?.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Tournaments</h1>
          <p className="text-muted-foreground mt-1">Manage your tournaments and their seasons</p>
        </div>
        <Link href="/admin/tournaments/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Tournament
          </Button>
        </Link>
      </div>

      <TournamentsList tournaments={tournaments || []} />
    </div>
  )
}
