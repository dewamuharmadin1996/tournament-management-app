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

interface PersonFormProps {
  person?: {
    id: string
    name: string
    role: string | null
    avatar_url: string | null
    is_private: boolean
    email?: string | null
    whatsapp?: string | null
  }
}

export function PersonForm({ person }: PersonFormProps) {
  const [name, setName] = useState(person?.name || "")
  const [role, setRole] = useState(person?.role || "")
  const [avatarUrl, setAvatarUrl] = useState(person?.avatar_url || "")
  const [isPrivate, setIsPrivate] = useState(person?.is_private || false)
  const [email, setEmail] = useState(person?.email || "")
  const [whatsapp, setWhatsapp] = useState(person?.whatsapp || "")
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

      const personData = {
        name,
        role: role || null,
        avatar_url: avatarUrl || null,
        is_private: isPrivate,
        created_by: user.id,
        email: email || null,
        whatsapp: whatsapp || null,
      }

      if (person) {
        const { error } = await supabase.from("people").update(personData).eq("id", person.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("people").insert(personData)
        if (error) throw error
      }

      router.push("/admin/people")
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
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter person name"
              required
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Player, Coach, Manager"
              className="bg-background/50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <Input
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+15551234567"
                className="bg-background/50"
              />
            </div>
          </div>

          <ImageUpload label="Avatar" value={avatarUrl} onChange={setAvatarUrl} aspectRatio="square" />

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="private">Private Person</Label>
              <p className="text-sm text-muted-foreground">
                Private people are only visible within tournaments they participate in
              </p>
            </div>
            <Switch id="private" checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Saving..." : person ? "Update Person" : "Create Person"}
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
