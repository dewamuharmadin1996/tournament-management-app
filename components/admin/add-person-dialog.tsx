"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Plus, User } from "lucide-react"
import { CreatePersonDialog } from "./create-person-dialog"

interface Person {
  id: string
  name: string
  role: string | null
  avatar_url: string | null
}

export function AddPersonDialog({
  open,
  onOpenChange,
  teamId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: string
}) {
  const [people, setPeople] = useState<Person[]>([])
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([])
  const [search, setSearch] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      loadPeople()
    }
  }, [open])

  useEffect(() => {
    if (search) {
      setFilteredPeople(people.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())))
    } else {
      setFilteredPeople(people)
    }
  }, [search, people])

  const loadPeople = async () => {
    const { data: existingMembers } = await supabase.from("team_members").select("person_id").eq("team_id", teamId)

    const existingPersonIds = existingMembers?.map((tm) => tm.person_id) || []

    const { data } = await supabase.from("people").select("*").order("name")

    setPeople(data?.filter((p) => !existingPersonIds.includes(p.id)) || [])
  }

  const handleAddPerson = async (personId: string) => {
    await supabase.from("team_members").insert({ team_id: teamId, person_id: personId })
    onOpenChange(false)
    router.refresh()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader>
            <DialogTitle>Add Member to Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search People</Label>
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {filteredPeople.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">No people available</p>
                  <Button onClick={() => setShowCreateDialog(true)} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Person
                  </Button>
                </div>
              ) : (
                filteredPeople.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => handleAddPerson(person.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left"
                  >
                    <div className="h-10 w-10 rounded-full bg-muted/20 flex items-center justify-center overflow-hidden">
                      {person.avatar_url ? (
                        <img
                          src={person.avatar_url || "/placeholder.svg"}
                          alt={person.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{person.name}</p>
                      {person.role && <p className="text-xs text-muted-foreground truncate">{person.role}</p>}
                    </div>
                  </button>
                ))
              )}
            </div>

            <Button variant="outline" onClick={() => setShowCreateDialog(true)} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Create New Person
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CreatePersonDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          loadPeople()
          setShowCreateDialog(false)
        }}
      />
    </>
  )
}
