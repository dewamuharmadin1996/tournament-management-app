import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCalendar, getCalendarId } from "@/lib/google/calendar"

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const seasonId = params.id
  const supabase = await createClient()

  console.log("[v0] POST /api/seasons/:id/matches/reset start", { seasonId })

  // Load matches for the season with any calendar_event_id
  const { data: matches, error } = await supabase
    .from("matches")
    .select("id, calendar_event_id")
    .eq("season_id", seasonId)

  if (error) {
    console.log("[v0] Load matches failed", { seasonId, error: error.message })
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const calendar = getCalendar()
  const calendarId = getCalendarId()

  // Delete calendar events
  for (const m of matches || []) {
    if (!m.calendar_event_id) continue
    try {
      await calendar.events.delete({ calendarId, eventId: m.calendar_event_id, sendUpdates: "all" })
      console.log("[v0] Deleted calendar event (reset)", { matchId: m.id, eventId: m.calendar_event_id })
    } catch (e: any) {
      console.log("[v0] Failed to delete calendar event (reset)", {
        matchId: m.id,
        eventId: m.calendar_event_id,
        error: e?.message,
      })
    }
  }

  // Delete matches
  const { error: delErr } = await supabase.from("matches").delete().eq("season_id", seasonId)
  if (delErr) {
    console.log("[v0] Delete matches failed", { seasonId, error: delErr.message })
    return NextResponse.json({ error: delErr.message }, { status: 400 })
  }

  console.log("[v0] Matches reset complete", { seasonId, deletedCount: matches?.length || 0 })
  return NextResponse.json({ ok: true, deletedCount: matches?.length || 0 })
}
