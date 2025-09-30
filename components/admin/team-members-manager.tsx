"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, X, User } from "lucide-react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AddPersonDialog } from "./add-person-dialog"

interface TeamMember {
  id: string
  people: {
    id: string
    name: string
    role: string | null
    avatar_url: string | null
  }
}

export function TeamMembersManager({ teamId, teamMembers }: { teamId: string; teamMembers: TeamMember[] }) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRemoveMember = async (teamMemberId: string) => {
    await supabase.from("team_members").delete().eq("id", teamMemberId)
    router.refresh()
  }

  return (
    <>
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Team Members</CardTitle>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No members added yet. Add people to build your team.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {teamMembers.map((tm) => (
                <div key={tm.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/20">
                  <div className="h-10 w-10 rounded-full bg-muted/20 flex items-center justify-center overflow-hidden">
                    {tm.people.avatar_url ? (
                      <img
                        src={tm.people.avatar_url || "/placeholder.svg"}
                        alt={tm.people.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{tm.people.name}</p>
                    {tm.people.role && <p className="text-xs text-muted-foreground truncate">{tm.people.role}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(tm.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddPersonDialog open={showAddDialog} onOpenChange={setShowAddDialog} teamId={teamId} />
    </>
  )
}
