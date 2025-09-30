import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { TeamsList } from "@/components/admin/teams-list"

export default async function TeamsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: teams } = await supabase
    .from("teams")
    .select("*, team_members(count)")
    .eq("created_by", user?.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Master</h1>
          <p className="text-muted-foreground mt-1">Manage your teams</p>
        </div>
        <Link href="/admin/teams/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Team
          </Button>
        </Link>
      </div>

      <TeamsList teams={teams || []} />
    </div>
  )
}
