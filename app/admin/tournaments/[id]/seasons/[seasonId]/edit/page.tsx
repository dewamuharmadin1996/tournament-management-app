import { createClient } from "@/lib/supabase/server"
import { SeasonForm } from "@/components/admin/season-form"
import { notFound } from "next/navigation"

export default async function EditSeasonPage({
  params,
}: {
  params: Promise<{ id: string; seasonId: string }>
}) {
  const { id, seasonId } = await params
  const supabase = await createClient()

  const { data: season } = await supabase.from("seasons").select("*").eq("id", seasonId).single()

  if (!season) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Season</h1>
        <p className="text-muted-foreground mt-1">Update season information</p>
      </div>

      <SeasonForm tournamentId={id} season={season} />
    </div>
  )
}
