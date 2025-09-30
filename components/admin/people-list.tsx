"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, UserCircle, EyeOff } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus } from "lucide-react"

interface Person {
  id: string
  name: string
  role: string | null
  avatar_url: string | null
  is_private: boolean
}

export function PeopleList({ people }: { people: Person[] }) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    if (!deleteId) return

    await supabase.from("people").delete().eq("id", deleteId)
    setDeleteId(null)
    router.refresh()
  }

  if (people.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <UserCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No people yet</h3>
          <p className="text-muted-foreground text-center mb-4">Get started by adding your first person</p>
          <Link href="/admin/people/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Person
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {people.map((person) => (
          <Card key={person.id} className="glass-card overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-square bg-muted/20 flex items-center justify-center relative">
                {person.avatar_url ? (
                  <img
                    src={person.avatar_url || "/placeholder.svg"}
                    alt={person.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserCircle className="h-16 w-16 text-muted-foreground" />
                )}
                {person.is_private && (
                  <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 text-xs">
                    <EyeOff className="h-3 w-3" />
                    Private
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1">{person.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{person.role || "No role"}</p>
                <div className="flex gap-2">
                  <Link href={`/admin/people/${person.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <Edit className="mr-2 h-3 w-3" />
                      Edit
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => setDeleteId(person.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Person</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this person? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
