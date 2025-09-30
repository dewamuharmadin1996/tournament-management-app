import { TournamentForm } from "@/components/admin/tournament-form"

export default function NewTournamentPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Tournament</h1>
        <p className="text-muted-foreground mt-1">Set up a new tournament</p>
      </div>

      <TournamentForm />
    </div>
  )
}
