"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ImageUpload } from "./image-upload"

interface TournamentFormProps {
  tournament?: {
    id: string
    name: string
    description: string | null
    logo_url: string | null
    banner_url: string | null
    is_private: boolean
    show_champion?: boolean
    show_loser?: boolean
    champion_label?: string
    loser_label?: string
  }
}

export function TournamentForm({ tournament }: TournamentFormProps) {
  const [name, setName] = useState(tournament?.name || "")
  const [description, setDescription] = useState(tournament?.description || "")
  const [logoUrl, setLogoUrl] = useState(tournament?.logo_url || "")
  const [bannerUrl, setBannerUrl] = useState(tournament?.banner_url || "")
  const [isPrivate, setIsPrivate] = useState(tournament?.is_private || false)
  const [showChampion, setShowChampion] = useState(tournament?.show_champion ?? true)
  const [showLoser, setShowLoser] = useState(tournament?.show_loser ?? false)
  const [championLabel, setChampionLabel] = useState(tournament?.champion_label || "Champion")
  const [loserLabel, setLoserLabel] = useState(tournament?.loser_label || "Last Place")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const tournamentData = {
        name,
        description: description || null,
        logo_url: logoUrl || null,
        banner_url: bannerUrl || null,
        is_private: isPrivate,
        show_champion: showChampion,
        show_loser: showLoser,
        champion_label: championLabel,
        loser_label: loserLabel,
        created_by: user.id,
      }

      if (tournament) {
        const { error } = await supabase.from("tournaments").update(tournamentData).eq("id", tournament.id)
        if (error) throw error
        router.push(`/admin/tournaments/${tournament.id}`)
      } else {
        const { data, error } = await supabase.from("tournaments").insert(tournamentData).select().single()
        if (error) throw error
        router.push(`/admin/tournaments/${data.id}`)
      }

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
            <Label htmlFor="name">Tournament Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter tournament name"
              required
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter tournament description"
              rows={3}
              className="bg-background/50"
            />
          </div>

          <ImageUpload label="Logo" value={logoUrl} onChange={setLogoUrl} aspectRatio="square" />

          <ImageUpload label="Banner" value={bannerUrl} onChange={setBannerUrl} aspectRatio="video" />

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="private">Private Tournament</Label>
              <p className="text-sm text-muted-foreground">Private tournaments are only visible to logged-in users</p>
            </div>
            <Switch id="private" checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>

          <div className="space-y-4 rounded-lg border border-border p-4">
            <h3 className="font-semibold">Champion & Loser Display</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-champion">Show Last Season Champion</Label>
                <p className="text-sm text-muted-foreground">
                  Display the champion from the most recent completed season
                </p>
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
                  placeholder="e.g., Champion, Winner, Gold Medal"
                  className="bg-background/50"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-loser">Show Last Season Loser</Label>
                <p className="text-sm text-muted-foreground">
                  Display the last place team from the most recent completed season
                </p>
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
                  placeholder="e.g., Last Place, Wooden Spoon, Relegated"
                  className="bg-background/50"
                />
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Saving..." : tournament ? "Update Tournament" : "Create Tournament"}
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
