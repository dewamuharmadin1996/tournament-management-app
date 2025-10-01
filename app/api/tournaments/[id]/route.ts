import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCalendar, getCalendarId } from "@/lib/google/calendar"

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const tournamentId = params.id
  const supabase = await createClient()
  console.log("[v0] DELETE /api/tournaments/:id start", { tournamentId })

  // Fetch seasons first
  const { data: seasons, error: seasonsErr } = await supabase
    .from("seasons")
    .select("id")
    .eq("tournament_id", tournamentId)
  if (seasonsErr) {
    console.log("[v0] Fetch seasons failed", { tournamentId, error: seasonsErr.message })
    return NextResponse.json({ error: seasonsErr.message }, { status: 400 })
  }
  const seasonIds = (seasons || []).map((s) => s.id)
  if (seasonIds.length > 0) {
    // Fetch matches across these seasons
    const { data: matches, error: matchesErr } = await supabase
      .from("matches")
      .select("id, calendar_event_id")
      .in("season_id", seasonIds)
    if (matchesErr) {
      console.log("[v0] Fetch matches failed", { tournamentId, error: matchesErr.message })
      return NextResponse.json({ error: matchesErr.message }, { status: 400 })
    }

    // Delete calendar events
    const calendar = getCalendar()
    const calendarId = getCalendarId()
    for (const m of matches || []) {
      if (!m.calendar_event_id) continue
      try {
        await calendar.events.delete({ calendarId, eventId: m.calendar_event_id, sendUpdates: "all" })
        console.log("[v0] Deleted calendar event (tournament delete)", { matchId: m.id, eventId: m.calendar_event_id })
      } catch (e: any) {
        console.log("[v0] Failed to delete calendar event (tournament delete)", {
          matchId: m.id,
          eventId: m.calendar_event_id,
          error: e?.message,
        })
      }
    }
  }

  // Delete the tournament (cascades to seasons, matches, etc.)
  const { error: delErr } = await supabase.from("tournaments").delete().eq("id", tournamentId)
  if (delErr) {
    console.log("[v0] Delete tournament failed", { tournamentId, error: delErr.message })
    return NextResponse.json({ error: delErr.message }, { status: 400 })
  }

  console.log("[v0] Tournament deleted", { tournamentId })
  return NextResponse.json({ ok: true })
}
