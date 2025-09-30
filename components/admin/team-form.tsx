"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ImageUpload } from "./image-upload"

interface TeamFormProps {
  team?: {
    id: string
    name: string
    logo_url: string | null
    banner_url: string | null
    is_private: boolean
  }
}

export function TeamForm({ team }: TeamFormProps) {
  const [name, setName] = useState(team?.name || "")
  const [logoUrl, setLogoUrl] = useState(team?.logo_url || "")
  const [bannerUrl, setBannerUrl] = useState(team?.banner_url || "")
  const [isPrivate, setIsPrivate] = useState(team?.is_private || false)
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

      const teamData = {
        name,
        logo_url: logoUrl || null,
        banner_url: bannerUrl || null,
        is_private: isPrivate,
        created_by: user.id,
      }

      if (team) {
        const { error } = await supabase.from("teams").update(teamData).eq("id", team.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("teams").insert(teamData)
        if (error) throw error
      }

      router.push("/admin/teams")
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
            <Label htmlFor="name">Team Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter team name"
              required
              className="bg-background/50"
            />
          </div>

          <ImageUpload label="Logo" value={logoUrl} onChange={setLogoUrl} aspectRatio="square" />

          <ImageUpload label="Banner" value={bannerUrl} onChange={setBannerUrl} aspectRatio="video" />

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="private">Private Team</Label>
              <p className="text-sm text-muted-foreground">
                Private teams are only visible within tournaments they participate in
              </p>
            </div>
            <Switch id="private" checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Saving..." : team ? "Update Team" : "Create Team"}
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
