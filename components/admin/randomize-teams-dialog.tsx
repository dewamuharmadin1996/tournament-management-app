"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Person = {
  id: string
  name: string
  role: string | null
  avatar_url: string | null
}

type SelectablePerson = Person & {
  selected: boolean
  lockTeam: number | "auto" // team index starting from 1, or "auto"
}

export function RandomizeTeamsDialog({
  open,
  onOpenChange,
  seasonId,
  onDone,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  seasonId: string
  onDone?: () => void
}) {
  const supabase = createClient()
  const router = useRouter()

  const [people, setPeople] = useState<SelectablePerson[]>([])
  const [search, setSearch] = useState("")
  const [teamCount, setTeamCount] = useState(2)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [preview, setPreview] = useState<Record<number, SelectablePerson[]>>({})
  const [existingByName, setExistingByName] = useState<Record<string, string>>({})
  const [duplicateNames, setDuplicateNames] = useState<string[]>([])

  // Load all people when dialog opens
  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("people").select("*").order("name")
      const base: SelectablePerson[] = (data || []).map((p) => ({ ...p, selected: false, lockTeam: "auto" })) || []
      setPeople(base)
    }
    if (open) load()
  }, [open, supabase])

  const filtered = useMemo(() => {
    if (!search) return people
    const q = search.toLowerCase()
    return people.filter((p) => p.name.toLowerCase().includes(q))
  }, [people, search])

  function toggleSelect(id: string, value: boolean) {
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, selected: value } : p)))
    clearPreview()
  }

  function setLockTeam(id: string, v: "auto" | number) {
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, lockTeam: v } : p)))
    clearPreview()
  }

  function shuffle<T>(arr: T[]): T[] {
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }

  async function handleRandomizeAndCreate() {
    const selected = people.filter((p) => p.selected)
    if (teamCount < 1) return
    if (selected.length === 0) return

    setIsSubmitting(true)
    try {
      // Build team buckets by index (1..teamCount)
      const buckets: Record<number, string[]> = {}
      for (let i = 1; i <= teamCount; i++) buckets[i] = []

      // Apply locks first
      const locked = selected.filter((p) => p.lockTeam !== "auto") as Array<SelectablePerson & { lockTeam: number }>
      for (const lp of locked) {
        const idx = Math.min(Math.max(lp.lockTeam, 1), teamCount)
        buckets[idx].push(lp.id)
      }

      // Remaining to assign
      const remaining = selected.filter((p) => p.lockTeam === "auto")
      const shuffled = shuffle(remaining)

      // Assign remaining in a balanced way (smallest bucket wins)
      for (const p of shuffled) {
        let minSize = Number.POSITIVE_INFINITY
        let target = 1
        for (let i = 1; i <= teamCount; i++) {
          const size = buckets[i].length
          if (size < minSize) {
            minSize = size
            target = i
          }
        }
        buckets[target].push(p.id)
      }

      // Create teams first
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const newTeamsPayload = Array.from({ length: teamCount }, (_, i) => ({
        name: `Team ${i + 1}`,
        logo_url: null,
        created_by: user?.id,
      }))

      const { data: createdTeams, error: createTeamsError } = await supabase
        .from("teams")
        .insert(newTeamsPayload)
        .select("id, name")

      if (createTeamsError || !createdTeams) {
        throw createTeamsError || new Error("Failed to create teams")
      }

      // Link teams to season
      const seasonTeamsPayload = createdTeams.map((t) => ({
        season_id: seasonId,
        team_id: t.id,
      }))

      const { error: seasonTeamsError } = await supabase.from("season_teams").insert(seasonTeamsPayload)
      if (seasonTeamsError) throw seasonTeamsError

      // Insert team members per bucket
      const teamIdByIndex: Record<number, string> = {}
      createdTeams.forEach((t, idx) => {
        teamIdByIndex[idx + 1] = t.id
      })

      const teamMembersPayload: { team_id: string; person_id: string }[] = []
      for (let i = 1; i <= teamCount; i++) {
        const teamId = teamIdByIndex[i]
        for (const personId of buckets[i]) {
          teamMembersPayload.push({ team_id: teamId, person_id: personId })
        }
      }

      if (teamMembersPayload.length > 0) {
        const { error: membersError } = await supabase.from("team_members").insert(teamMembersPayload)
        if (membersError) throw membersError
      }

      onOpenChange(false)
      onDone?.()
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  function clearPreview() {
    setPreview({})
    setExistingByName({})
    setDuplicateNames([])
  }

  function computePreviewName(idx: number, buckets?: Record<number, SelectablePerson[]>) {
    const source = buckets ?? preview
    const members = source[idx] || []
    return members.length > 0 ? members.map((m) => m.name).join(" - ") : `Team ${idx}`
  }

  async function refreshDuplicatesFromBuckets(buckets: Record<number, SelectablePerson[]>) {
    const names = Array.from({ length: teamCount }, (_, i) => computePreviewName(i + 1, buckets))
    const nonEmptyNames = names.filter((n) => n && n.trim().length > 0)
    if (nonEmptyNames.length === 0) {
      setExistingByName({})
      setDuplicateNames([])
      return
    }
    const { data, error } = await supabase.from("teams").select("id, name").in("name", nonEmptyNames)
    if (error) {
      console.log("[v0] refreshDuplicatesFromBuckets error:", error.message)
      setExistingByName({})
      setDuplicateNames([])
      return
    }
    const map: Record<string, string> = {}
    const dups: string[] = []
    for (const row of data || []) {
      map[row.name] = row.id
      dups.push(row.name)
    }
    setExistingByName(map)
    setDuplicateNames(dups)
  }

  function handleGeneratePreview() {
    const selected = people.filter((p) => p.selected)
    if (teamCount < 1 || selected.length === 0) {
      setPreview({})
      setExistingByName({})
      setDuplicateNames([])
      return
    }
    const buckets = buildPreviewBuckets()
    setPreview(buckets)
    void refreshDuplicatesFromBuckets(buckets)
  }

  async function handleCreateFromPreview() {
    const hasPreview = Object.keys(preview).length > 0
    if (!hasPreview) return

    const namesByIndex: Record<number, string> = {}
    for (let i = 1; i <= teamCount; i++) {
      namesByIndex[i] = computePreviewName(i)
    }
    const existingNameList = Object.values(namesByIndex).filter((n) => Boolean(existingByName[n]))
    if (existingNameList.length > 0) {
      const proceed = window.confirm(
        `The following team name(s) already exist and will be reused instead of creating new teams:\n\n${existingNameList.join(
          ", ",
        )}\n\nContinue?`,
      )
      if (!proceed) return
    }

    setIsSubmitting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const toInsert: number[] = []
      const toReuse: number[] = []
      for (let i = 1; i <= teamCount; i++) {
        const name = namesByIndex[i]
        if (existingByName[name]) toReuse.push(i)
        else toInsert.push(i)
      }

      let createdTeams: { id: string; name: string }[] = []
      if (toInsert.length > 0) {
        const newTeamsPayload = toInsert.map((i) => ({
          name: namesByIndex[i],
          logo_url: null,
          created_by: user?.id,
        }))
        const { data, error: createTeamsError } = await supabase
          .from("teams")
          .insert(newTeamsPayload)
          .select("id, name")
        if (createTeamsError) throw createTeamsError
        createdTeams = data || []
      }

      const teamIdByIndex: Record<number, string> = {}
      let createdPtr = 0
      for (const idx of toInsert) {
        teamIdByIndex[idx] = createdTeams[createdPtr++]?.id
      }
      for (const idx of toReuse) {
        const name = namesByIndex[idx]
        teamIdByIndex[idx] = existingByName[name]
      }

      const seasonTeamsPayload = Object.keys(teamIdByIndex).map((k) => ({
        season_id: seasonId,
        team_id: teamIdByIndex[Number(k)],
      }))
      if (seasonTeamsPayload.length > 0) {
        const { error: seasonTeamsError } = await supabase
          .from("season_teams")
          .upsert(seasonTeamsPayload, { onConflict: "season_id,team_id", ignoreDuplicates: true })
        if (seasonTeamsError) throw seasonTeamsError
      }

      const teamMembersPayload: { team_id: string; person_id: string }[] = []
      for (let i = 1; i <= teamCount; i++) {
        const teamId = teamIdByIndex[i]
        const members = preview[i] || []
        for (const person of members) {
          teamMembersPayload.push({ team_id: teamId, person_id: person.id })
        }
      }
      if (teamMembersPayload.length > 0) {
        const { error: membersError } = await supabase
          .from("team_members")
          .upsert(teamMembersPayload, { onConflict: "team_id,person_id", ignoreDuplicates: true })
        if (membersError) throw membersError
      }

      onOpenChange(false)
      onDone?.()
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  function buildPreviewBuckets(): Record<number, SelectablePerson[]> {
    const selected = people.filter((p) => p.selected)
    const buckets: Record<number, SelectablePerson[]> = {}
    for (let i = 1; i <= teamCount; i++) buckets[i] = []

    const locked = selected.filter((p) => p.lockTeam !== "auto") as Array<SelectablePerson & { lockTeam: number }>
    for (const lp of locked) {
      const idx = Math.min(Math.max(lp.lockTeam, 1), teamCount)
      buckets[idx].push(lp)
    }

    const remaining = selected.filter((p) => p.lockTeam === "auto")
    const shuffled = shuffle(remaining)

    for (const p of shuffled) {
      let minSize = Number.POSITIVE_INFINITY
      let target = 1
      for (let i = 1; i <= teamCount; i++) {
        const size = buckets[i].length
        if (size < minSize) {
          minSize = size
          target = i
        }
      }
      buckets[target].push(p)
    }

    return buckets
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Randomize Teams</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 overflow-y-auto max-h-[70vh] pr-1">
          <div className="grid gap-2">
            <Label htmlFor="search">Search People</Label>
            <Input
              id="search"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-background/50"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="team-count">Number of Teams</Label>
            <Input
              id="team-count"
              type="number"
              min={1}
              value={teamCount}
              onChange={(e) => setTeamCount(Math.max(1, Number.parseInt(e.target.value || "1")))}
              className="bg-background/50 w-32"
            />
          </div>

          <div className="border rounded-md overflow-hidden">
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {filtered.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">No people found</div>
              ) : (
                filtered.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3">
                    <Checkbox
                      checked={p.selected}
                      onCheckedChange={(v) => toggleSelect(p.id, Boolean(v))}
                      aria-label={`Select ${p.name}`}
                    />
                    <div className="h-10 w-10 rounded-full bg-muted/20 flex items-center justify-center overflow-hidden">
                      {p.avatar_url ? (
                        <img
                          src={p.avatar_url || "/placeholder.svg"}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold">{p.name.substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{p.name}</p>
                      {p.role && <p className="text-xs text-muted-foreground truncate">{p.role}</p>}
                    </div>
                    <div className="w-36">
                      <Label className="sr-only" htmlFor={`lock-${p.id}`}>
                        Locked Team for {p.name}
                      </Label>
                      <Select
                        value={String(p.lockTeam)}
                        onValueChange={(v) =>
                          setLockTeam(p.id, v === "auto" ? "auto" : Math.max(1, Number.parseInt(v)))
                        }
                      >
                        <SelectTrigger id={`lock-${p.id}`} className="bg-background/50">
                          <SelectValue placeholder="Auto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto</SelectItem>
                          {Array.from({ length: teamCount }, (_, i) => i + 1).map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              Team {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {Object.keys(preview).length > 0 && (
            <div className="grid gap-3">
              {duplicateNames.length > 0 && (
                <div className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
                  <span>
                    Some team name(s) already exist: <span className="font-medium">{duplicateNames.join(", ")}</span>.
                    They will be reused if you continue.
                  </span>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleGeneratePreview}
                    disabled={isSubmitting}
                    aria-label="Regenerate preview"
                  >
                    Regenerate
                  </Button>
                </div>
              )}
              <div className="grid gap-3 md:grid-cols-2">
                {Array.from({ length: teamCount }, (_, i) => i + 1).map((idx) => {
                  const members = preview[idx] || []
                  const name = computePreviewName(idx)
                  const exists = Boolean(existingByName[name])
                  return (
                    <div
                      key={idx}
                      className={`rounded-lg border p-3 ${
                        exists ? "border-destructive/50 bg-destructive/5" : "border-border bg-card/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-pretty">{name}</div>
                        {exists && (
                          <span className="text-xs font-semibold text-destructive" aria-label="Existing team">
                            Existing
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {members.length === 0 ? (
                          <span className="text-sm text-muted-foreground">No members</span>
                        ) : (
                          members.map((m) => (
                            <div key={m.id} className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full overflow-hidden bg-muted/30 flex items-center justify-center">
                                {m.avatar_url ? (
                                  <img
                                    src={m.avatar_url || "/placeholder.svg?height=32&width=32&query=avatar"}
                                    alt={m.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-bold">{m.name.substring(0, 2).toUpperCase()}</span>
                                )}
                              </div>
                              <span className="text-sm">{m.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleGeneratePreview} disabled={isSubmitting}>
              Generate Preview
            </Button>
            <Button onClick={handleCreateFromPreview} disabled={isSubmitting || Object.keys(preview).length === 0}>
              {isSubmitting ? "Creating..." : "Create Teams"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
