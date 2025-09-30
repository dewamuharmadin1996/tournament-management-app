import { SeasonForm } from "@/components/admin/season-form"

export default async function NewSeasonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Season</h1>
        <p className="text-muted-foreground mt-1">Add a new season to this tournament</p>
      </div>

      <SeasonForm tournamentId={id} />
    </div>
  )
}
