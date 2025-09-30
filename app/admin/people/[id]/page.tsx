import { createClient } from "@/lib/supabase/server"
import { PersonForm } from "@/components/admin/person-form"
import { notFound } from "next/navigation"

export default async function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: person } = await supabase.from("people").select("*").eq("id", id).single()

  if (!person) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Person</h1>
        <p className="text-muted-foreground mt-1">Update person information</p>
      </div>

      <PersonForm person={person} />
    </div>
  )
}
