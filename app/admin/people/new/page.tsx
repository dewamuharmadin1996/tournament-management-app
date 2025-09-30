import { PersonForm } from "@/components/admin/person-form"

export default function NewPersonPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Person</h1>
        <p className="text-muted-foreground mt-1">Create a new person in the master database</p>
      </div>

      <PersonForm />
    </div>
  )
}
