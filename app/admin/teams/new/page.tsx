import { TeamForm } from "@/components/admin/team-form"

export default function NewTeamPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Team</h1>
        <p className="text-muted-foreground mt-1">Create a new team in the master database</p>
      </div>

      <TeamForm />
    </div>
  )
}
