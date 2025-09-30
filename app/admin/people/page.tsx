import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { PeopleList } from "@/components/admin/people-list"

export default async function PeoplePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: people } = await supabase
    .from("people")
    .select("*")
    .eq("created_by", user?.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">People Master</h1>
          <p className="text-muted-foreground mt-1">Manage your people</p>
        </div>
        <Link href="/admin/people/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Person
          </Button>
        </Link>
      </div>

      <PeopleList people={people || []} />
    </div>
  )
}
