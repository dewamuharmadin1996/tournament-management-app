import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCalendar, getCalendarId } from "@/lib/google/calendar"

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const seasonId = params.id
  const supabase = await createClient()
  console.log("[v0] DELETE /api/seasons/:id start", { seasonId })

  // Collect all matches with calendar events
  const { data: matches, error } = await supabase
    .from("matches")
    .select("id, calendar_event_id")
    .eq("season_id", seasonId)

  if (error) {
    console.log("[v0] Fetch matches for season failed", { seasonId, error: error.message })
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Delete calendar events first
  const calendar = getCalendar()
  const calendarId = getCalendarId()
  for (const m of matches || []) {
    if (!m.calendar_event_id) continue
    try {
      await calendar.events.delete({ calendarId, eventId: m.calendar_event_id, sendUpdates: "all" })
      console.log("[v0] Deleted calendar event (season delete)", { matchId: m.id, eventId: m.calendar_event_id })
    } catch (e: any) {
      console.log("[v0] Failed to delete calendar event (season delete)", {
        matchId: m.id,
        eventId: m.calendar_event_id,
        error: e?.message,
      })
    }
  }

  // Delete season row (will cascade other relations per schema)
  const { error: delErr } = await supabase.from("seasons").delete().eq("id", seasonId)
  if (delErr) {
    console.log("[v0] Delete season failed", { seasonId, error: delErr.message })
    return NextResponse.json({ error: delErr.message }, { status: 400 })
  }

  console.log("[v0] Season deleted", { seasonId })
  return NextResponse.json({ ok: true })
}
