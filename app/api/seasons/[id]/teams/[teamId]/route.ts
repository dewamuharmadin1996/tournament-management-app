import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCalendar, getCalendarId } from "@/lib/google/calendar"

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; teamId: string } }) {
  const seasonId = params.id
  const teamId = params.teamId
  const supabase = await createClient()
  console.log("[v0] DELETE /api/seasons/:id/teams/:teamId start", { seasonId, teamId })

  const { data: matches, error } = await supabase
    .from("matches")
    .select("id, calendar_event_id")
    .eq("season_id", seasonId)
    .or(`team1_id.eq.${teamId},team2_id.eq.${teamId}`)
  if (error) {
    console.log("[v0] Fetch affected matches failed", { seasonId, teamId, error: error.message })
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const calendar = getCalendar()
  const calendarId = getCalendarId()
  for (const m of matches || []) {
    if (!m.calendar_event_id) continue
    try {
      await calendar.events.delete({ calendarId, eventId: m.calendar_event_id, sendUpdates: "all" })
      console.log("[v0] Deleted calendar event (team removal)", { matchId: m.id, eventId: m.calendar_event_id })
    } catch (e: any) {
      console.log("[v0] Failed to delete calendar event (team removal)", {
        matchId: m.id,
        eventId: m.calendar_event_id,
        error: e?.message,
      })
    }
  }

  const { error: delMatchesErr } = await supabase
    .from("matches")
    .delete()
    .eq("season_id", seasonId)
    .or(`team1_id.eq.${teamId},team2_id.eq.${teamId}`)
  if (delMatchesErr) {
    console.log("[v0] Delete matches failed (team removal)", { seasonId, teamId, error: delMatchesErr.message })
    return NextResponse.json({ error: delMatchesErr.message }, { status: 400 })
  }

  const { error: delLinkErr } = await supabase
    .from("season_teams")
    .delete()
    .match({ season_id: seasonId, team_id: teamId })
  if (delLinkErr) {
    console.log("[v0] Delete season_teams link failed", { seasonId, teamId, error: delLinkErr.message })
    return NextResponse.json({ error: delLinkErr.message }, { status: 400 })
  }

  console.log("[v0] Team removed from season and matches cleaned", {
    seasonId,
    teamId,
    removedMatches: matches?.length || 0,
  })
  return NextResponse.json({ ok: true, removedMatches: matches?.length || 0 })
}
