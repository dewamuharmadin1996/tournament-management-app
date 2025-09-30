"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface SeasonFormProps {
  tournamentId: string
  season?: {
    id: string
    name: string
    format: string
    points_win: number
    points_draw: number
    points_loss: number
    priority_mode: string | null
    status: string
    show_champion?: boolean
    show_loser?: boolean
    champion_label?: string
    loser_label?: string
  }
}

export function SeasonForm({ tournamentId, season }: SeasonFormProps) {
  const [name, setName] = useState(season?.name || "")
  const [format, setFormat] = useState(season?.format || "cup")
  const [pointsWin, setPointsWin] = useState(season?.points_win?.toString() || "3")
  const [pointsDraw, setPointsDraw] = useState(season?.points_draw?.toString() || "1")
  const [pointsLoss, setPointsLoss] = useState(season?.points_loss?.toString() || "0")
  const [priorityMode, setPriorityMode] = useState(season?.priority_mode || "none")
  const [status, setStatus] = useState(season?.status || "draft")
  const [showChampion, setShowChampion] = useState(season?.show_champion ?? true)
  const [showLoser, setShowLoser] = useState(season?.show_loser ?? false)
  const [championLabel, setChampionLabel] = useState(season?.champion_label || "Champion")
  const [loserLabel, setLoserLabel] = useState(season?.loser_label || "Last Place")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const seasonData = {
        tournament_id: tournamentId,
        name,
        format,
        points_win: Number.parseInt(pointsWin),
        points_draw: Number.parseInt(pointsDraw),
        points_loss: Number.parseInt(pointsLoss),
        priority_mode: priorityMode === "none" ? null : priorityMode,
        status,
        show_champion: showChampion,
        show_loser: showLoser,
        champion_label: championLabel,
        loser_label: loserLabel,
      }

      if (season) {
        const { error } = await supabase.from("seasons").update(seasonData).eq("id", season.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("seasons").insert(seasonData)
        if (error) throw error
      }

      router.push(`/admin/tournaments/${tournamentId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="glass-card">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Season Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Spring 2024"
              required
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="format">Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card">
                <SelectItem value="cup">Cup (Single Elimination)</SelectItem>
                <SelectItem value="league">League (Round Robin)</SelectItem>
                <SelectItem value="double_elimination">Double Elimination</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {format === "league" && (
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="points-win">Points for Win</Label>
                <Input
                  id="points-win"
                  type="number"
                  value={pointsWin}
                  onChange={(e) => setPointsWin(e.target.value)}
                  min="0"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="points-draw">Points for Draw</Label>
                <Input
                  id="points-draw"
                  type="number"
                  value={pointsDraw}
                  onChange={(e) => setPointsDraw(e.target.value)}
                  min="0"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="points-loss">Points for Loss</Label>
                <Input
                  id="points-loss"
                  type="number"
                  value={pointsLoss}
                  onChange={(e) => setPointsLoss(e.target.value)}
                  min="0"
                  className="bg-background/50"
                />
              </div>
            </div>
          )}

          {(format === "cup" || format === "double_elimination") && (
            <div className="space-y-2">
              <Label htmlFor="priority">Priority Mode</Label>
              <Select value={priorityMode} onValueChange={setPriorityMode}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select priority mode" />
                </SelectTrigger>
                <SelectContent className="glass-card">
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="highest">Highest Points (favor top teams)</SelectItem>
                  <SelectItem value="lowest">Lowest Points (favor bottom teams)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Priority mode biases decisive matches toward teams with highest or lowest points
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card">
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 rounded-lg border border-border p-4">
            <h3 className="font-semibold">Champion & Loser Display</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-champion">Show Current Champion</Label>
                <p className="text-sm text-muted-foreground">Display the current leading team in this season</p>
              </div>
              <Switch id="show-champion" checked={showChampion} onCheckedChange={setShowChampion} />
            </div>

            {showChampion && (
              <div className="space-y-2">
                <Label htmlFor="champion-label">Champion Label</Label>
                <Input
                  id="champion-label"
                  value={championLabel}
                  onChange={(e) => setChampionLabel(e.target.value)}
                  placeholder="e.g., Champion, Winner, Leader"
                  className="bg-background/50"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-loser">Show Current Last Place</Label>
                <p className="text-sm text-muted-foreground">Display the current last place team in this season</p>
              </div>
              <Switch id="show-loser" checked={showLoser} onCheckedChange={setShowLoser} />
            </div>

            {showLoser && (
              <div className="space-y-2">
                <Label htmlFor="loser-label">Loser Label</Label>
                <Input
                  id="loser-label"
                  value={loserLabel}
                  onChange={(e) => setLoserLabel(e.target.value)}
                  placeholder="e.g., Last Place, Bottom Team"
                  className="bg-background/50"
                />
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Saving..." : season ? "Update Season" : "Create Season"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
