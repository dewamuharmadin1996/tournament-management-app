import { createClient } from "@/lib/supabase/server"
import { TournamentForm } from "@/components/admin/tournament-form"
import { notFound } from "next/navigation"

export default async function EditTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: tournament } = await supabase.from("tournaments").select("*").eq("id", id).single()

  if (!tournament) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Tournament</h1>
        <p className="text-muted-foreground mt-1">Update tournament information</p>
      </div>

      <TournamentForm tournament={tournament} />
    </div>
  )
}
