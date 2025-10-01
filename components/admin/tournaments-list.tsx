"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Trophy, EyeOff, Plus } from "lucide-react"
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

interface Tournament {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  is_private: boolean
  seasons: { count: number }[]
}

export function TournamentsList({ tournaments }: { tournaments: Tournament[] }) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    if (!deleteId) return

    await supabase.from("tournaments").delete().eq("id", deleteId)
    setDeleteId(null)
    router.refresh()
  }

  if (tournaments.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tournaments yet</h3>
          <p className="text-muted-foreground text-center mb-4">Get started by creating your first tournament</p>
          <Link href="/admin/tournaments/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Tournament
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tournaments.map((tournament) => (
          <Card key={tournament.id} className="glass-card overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-video bg-muted/20 flex items-center justify-center relative">
                {tournament.banner_url ? (
                  <img
                    src={tournament.banner_url || "/placeholder.svg"}
                    alt={tournament.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Trophy className="h-12 w-12 text-muted-foreground" />
                )}
                {tournament.is_private && (
                  <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 text-xs">
                    <EyeOff className="h-3 w-3" />
                    Private
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{tournament.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {tournament.description || "No description"}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  {tournament.seasons[0]?.count || 0} season{tournament.seasons[0]?.count !== 1 ? "s" : ""}
                </p>
                <div className="flex gap-2">
                  <Link href={`/admin/tournaments/${tournament.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <Edit className="mr-2 h-3 w-3" />
                      Manage
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => setDeleteId(tournament.id)}>
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
            <AlertDialogTitle>Delete Tournament</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tournament? This will also delete all associated seasons and matches.
              This action cannot be undone.
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
