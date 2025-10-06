import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCalendar, getCalendarId } from "@/lib/google/calendar"

type UpdatePayload = {
  team1_score?: number | null
  team2_score?: number | null
  winner_id?: string | null
  status?: string
  scheduled_at?: string | null
  team1_id?: string | null
  team2_id?: string | null
}

async function loadMatchContext(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
  const { data: match, error } = await supabase
    .from("matches")
    .select(
      "*, team1:teams!matches_team1_id_fkey(id,name), team2:teams!matches_team2_id_fkey(id,name), seasons(*, tournaments:tournament_id(name))",
    )
    .eq("id", id)
    .single()

  if (error || !match) throw new Error(error?.message || "Match not found")
  return match as any
}

async function getAttendeeEmails(
  supabase: Awaited<ReturnType<typeof createClient>>,
  team1_id: string | null,
  team2_id: string | null,
): Promise<string[]> {
  const teamIds = [team1_id, team2_id].filter(Boolean) as string[]
  if (teamIds.length === 0) return []
  const { data, error } = await supabase.from("team_members").select("people:person_id(email)").in("team_id", teamIds)

  if (error) throw new Error(error.message)
  const emails = (data || [])
    .map((r: any) => r.people?.email)
    .filter((e: any) => typeof e === "string" && e.includes("@")) as string[]
  return Array.from(new Set(emails))
}

function buildEventPayload(match: any, attendeeEmails: string[]) {
  const tournamentName = match.seasons?.tournaments?.name
  const seasonName = match.seasons?.name
  const team1Name = match.team1?.name || "TBD"
  const team2Name = match.team2?.name || "TBD"
  const summaryPrefix = [tournamentName, seasonName].filter(Boolean).join(" - ")
  const summary = summaryPrefix ? `${summaryPrefix}: ${team1Name} vs ${team2Name}` : `${team1Name} vs ${team2Name}`

  // Only create a timed event if scheduled_at is available
  const start = match.scheduled_at ? new Date(match.scheduled_at).toISOString() : null
  const end = match.scheduled_at
    ? new Date(new Date(match.scheduled_at).getTime() + 2 * 60 * 60 * 1000).toISOString()
    : null

  const description = `Match: ${team1Name} vs ${team2Name}
Tournament: ${tournamentName || "-"}
Season: ${seasonName || "-"}
Status: ${match.status}
`

  const attendees = attendeeEmails.map((email) => ({ email }))
  return { summary, description, start, end, attendees }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const id = params.id

  const payload = (await req.json()) as UpdatePayload
  console.log("[v0] PUT /api/matches/:id start", { id, payload })

  // Guard: load current match BEFORE update to validate score updates by status
  let current
  try {
    current = await loadMatchContext(supabase, id)
  } catch (e: any) {
    console.log("[v0] loadMatchContext error (pre-update)", { id, error: e?.message })
    return NextResponse.json({ error: e?.message || "Failed to load match" }, { status: 500 })
  }

  // Normalize legacy status "ongoing" -> "in_progress"
  if (payload.status === "ongoing") {
    payload.status = "in_progress"
  }

  const wantsScoreChange =
    Object.prototype.hasOwnProperty.call(payload, "team1_score") ||
    Object.prototype.hasOwnProperty.call(payload, "team2_score")

  // Only allow score updates when match is in progress or being finished/started in same request
  const nextStatus = payload.status ?? current.status
  const scoreAllowed = nextStatus === "in_progress" || nextStatus === "completed"

  if (wantsScoreChange && !scoreAllowed) {
    console.log("[v0] Score update blocked by status", { id, currentStatus: current.status, nextStatus })
    return NextResponse.json(
      { error: "Cannot update score unless match is in progress or being finished." },
      { status: 400 },
    )
  }

  // Update the match
  const { data: updated, error: updateErr } = await supabase
    .from("matches")
    .update(payload)
    .eq("id", id)
    .select()
    .single()
  if (updateErr) {
    console.log("[v0] Match update error", { id, error: updateErr.message })
    return NextResponse.json({ error: updateErr.message }, { status: 400 })
  }
  console.log("[v0] Match updated", { id, updatedId: updated?.id })

  // Load enriched context for calendar
  let match
  try {
    match = await loadMatchContext(supabase, id)
  } catch (e: any) {
    console.log("[v0] loadMatchContext error", { id, error: e?.message })
    return NextResponse.json({ error: e?.message || "Failed to load match" }, { status: 500 })
  }
  console.log("[v0] Loaded match context", {
    id,
    scheduled_at: match?.scheduled_at,
    calendar_event_id: match?.calendar_event_id,
    team1: match?.team1?.name,
    team2: match?.team2?.name,
    season: match?.seasons?.name,
    tournament: match?.seasons?.tournaments?.name,
  })

  const calendar = getCalendar()
  const calendarId = getCalendarId()
  console.log("[v0] Calendar info", { calendarId })

  // If no scheduled time, skip calendar create/update (remove any existing event if present)
  if (!match.scheduled_at) {
    console.log("[v0] No scheduled_at. Ensuring no calendar event exists.", {
      id,
      existingEventId: match.calendar_event_id,
    })
    if (match.calendar_event_id) {
      try {
        await calendar.events.delete({
          calendarId,
          eventId: match.calendar_event_id,
          sendUpdates: "all",
        })
        console.log("[v0] Deleted existing calendar event", { id, eventId: match.calendar_event_id })
      } catch (err: any) {
        console.log("[v0] Failed to delete existing calendar event", {
          id,
          eventId: match.calendar_event_id,
          error: err?.message,
        })
      }
      await supabase.from("matches").update({ calendar_event_id: null, calendar_provider: null }).eq("id", id)
      console.log("[v0] Cleared calendar_event_id in DB", { id })
    }
    return NextResponse.json({ match })
  }

  // Build payload but ignore attendees entirely
  const ev = buildEventPayload(match, [])
  const eventResource: any = {
    summary: ev.summary,
    description: ev.description,
    start: { dateTime: ev.start },
    end: { dateTime: ev.end },
  }
  console.log("[v0] Event payload", {
    id,
    summary: eventResource.summary,
    start: eventResource.start?.dateTime,
    end: eventResource.end?.dateTime,
  })

  try {
    let eventId = match.calendar_event_id as string | null
    if (eventId) {
      console.log("[v0] Updating existing event", { id, eventId })
      const res = await calendar.events.update({
        calendarId,
        eventId,
        requestBody: eventResource,
        sendUpdates: "all",
      })
      eventId = res.data.id || eventId
      console.log("[v0] Update event success", { id, eventId })
    } else {
      console.log("[v0] Creating new event", { id })
      const res = await calendar.events.insert({
        calendarId,
        requestBody: eventResource,
        sendUpdates: "all",
      })
      eventId = res.data.id || null
      console.log("[v0] Create event success", { id, eventId })
    }

    if (eventId) {
      await supabase.from("matches").update({ calendar_event_id: eventId, calendar_provider: "google" }).eq("id", id)
      console.log("[v0] Saved event id to DB", { id, eventId })
    }

    return NextResponse.json({ matchId: id, calendar_event_id: eventId })
  } catch (e: any) {
    console.log("[v0] Calendar sync failed", { id, error: e?.message, stack: e?.stack })
    return NextResponse.json({ error: e.message || "Calendar sync failed" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const id = params.id
  console.log("[v0] DELETE /api/matches/:id start", { id })

  let match
  try {
    match = await loadMatchContext(supabase, id)
  } catch (e: any) {
    console.log("[v0] loadMatchContext error (delete)", { id, error: e?.message })
    return NextResponse.json({ error: e?.message || "Failed to load match" }, { status: 500 })
  }

  // Delete event if present
  if (match.calendar_event_id) {
    try {
      const calendar = getCalendar()
      await calendar.events.delete({
        calendarId: getCalendarId(),
        eventId: match.calendar_event_id,
        sendUpdates: "all",
      })
      console.log("[v0] Deleted calendar event for match", { id, eventId: match.calendar_event_id })
    } catch (err: any) {
      console.log("[v0] Failed to delete calendar event for match", {
        id,
        eventId: match.calendar_event_id,
        error: err?.message,
      })
    }
  }

  const { error } = await supabase.from("matches").delete().eq("id", id)
  if (error) {
    console.log("[v0] Supabase delete error", { id, error: error.message })
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  console.log("[v0] Match deleted", { id })
  return NextResponse.json({ ok: true })
}
