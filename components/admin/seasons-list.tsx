"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Calendar, Plus } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"

interface Season {
  id: string
  name: string
  format: string
  status: string
  season_teams: { count: number }[]
}

export function SeasonsList({ seasons, tournamentId }: { seasons: Season[]; tournamentId: string }) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    if (!deleteId) return

    await fetch(`/api/seasons/${deleteId}`, { method: "DELETE" })
    setDeleteId(null)
    router.refresh()
  }

  const formatLabels: Record<string, string> = {
    cup: "Cup (Single Elimination)",
    league: "League (Round Robin)",
    double_elimination: "Double Elimination",
  }

  const statusColors: Record<string, "default" | "secondary" | "outline"> = {
    draft: "outline",
    active: "default",
    completed: "secondary",
  }

  if (seasons.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No seasons yet</h3>
          <p className="text-muted-foreground text-center mb-4">Add a season to get started</p>
          <Link href={`/admin/tournaments/${tournamentId}/seasons/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Season
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {seasons.map((season) => (
          <Card key={season.id} className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{season.name}</h3>
                  <p className="text-sm text-muted-foreground">{formatLabels[season.format]}</p>
                </div>
                <Badge variant={statusColors[season.status]}>{season.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {season.season_teams[0]?.count || 0} team{season.season_teams[0]?.count !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-2">
                <Link href={`/admin/tournaments/${tournamentId}/seasons/${season.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    <Edit className="mr-2 h-3 w-3" />
                    Manage
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => setDeleteId(season.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Season</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this season? This will also delete all associated matches. This action
              cannot be undone.
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
