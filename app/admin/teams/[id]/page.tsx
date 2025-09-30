import { createClient } from "@/lib/supabase/server"
import { TeamForm } from "@/components/admin/team-form"
import { TeamMembersManager } from "@/components/admin/team-members-manager"
import { notFound } from "next/navigation"

export default async function EditTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: team } = await supabase.from("teams").select("*").eq("id", id).single()

  if (!team) {
    notFound()
  }

  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("id, people(id, name, role, avatar_url)")
    .eq("team_id", id)
    .order("created_at", { ascending: true })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Team</h1>
        <p className="text-muted-foreground mt-1">Update team information</p>
      </div>

      <TeamForm team={team} />

      <TeamMembersManager teamId={id} teamMembers={teamMembers || []} />
    </div>
  )
}
