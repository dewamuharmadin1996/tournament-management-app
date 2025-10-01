import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCalendar, getCalendarId } from "@/lib/google/calendar"

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const seasonId = params.id

  const { data: matches, error } = await supabase
    .from("matches")
    .select(
      "*, team1:teams!matches_team1_id_fkey(id,name), team2:teams!matches_team2_id_fkey(id,name), seasons(*, tournaments:tournament_id(name))",
    )
    .eq("season_id", seasonId)
    .is("calendar_event_id", null)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!matches || matches.length === 0) return NextResponse.json({ synced: 0 })

  const calendar = getCalendar()
  const calendarId = getCalendarId()

  async function getAttendeeEmails(team1_id: string | null, team2_id: string | null) {
    const teamIds = [team1_id, team2_id].filter(Boolean) as string[]
    if (teamIds.length === 0) return []
    const { data } = await supabase.from("team_members").select("people:person_id(email)").in("team_id", teamIds)
    const emails = (data || [])
      .map((r: any) => r.people?.email)
      .filter((e: any) => typeof e === "string" && e.includes("@")) as string[]
    return Array.from(new Set(emails))
  }

  let count = 0
  for (const m of matches as any[]) {
    try {
      const attendeeEmails = await getAttendeeEmails(m.team1_id, m.team2_id)
      const tournamentName = m.seasons?.tournaments?.name
      const seasonName = m.seasons?.name
      const team1Name = m.team1?.name || "TBD"
      const team2Name = m.team2?.name || "TBD"
      const summaryPrefix = [tournamentName, seasonName].filter(Boolean).join(" - ")
      const summary = summaryPrefix ? `${summaryPrefix}: ${team1Name} vs ${team2Name}` : `${team1Name} vs ${team2Name}`

      const requestBody: any = {
        summary,
        description: `Match: ${team1Name} vs ${team2Name}
Tournament: ${tournamentName || "-"}
Season: ${seasonName || "-"}
Status: ${m.status}${m.scheduled_at ? "" : "\nSchedule: TBD"}`,
        attendees: (attendeeEmails || []).map((email) => ({ email })),
      }

      if (m.scheduled_at) {
        const start = new Date(m.scheduled_at).toISOString()
        const end = new Date(new Date(m.scheduled_at).getTime() + 2 * 60 * 60 * 1000).toISOString()
        requestBody.start = { dateTime: start }
        requestBody.end = { dateTime: end }
      } else {
        const today = new Date()
        const startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
        const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000)
        const toDate = (d: Date) => d.toISOString().slice(0, 10)
        requestBody.start = { date: toDate(startDate) }
        requestBody.end = { date: toDate(endDate) }
      }

      const res = await calendar.events.insert({
        calendarId,
        requestBody,
        sendUpdates: "all",
      })

      const eventId = res.data.id || null
      if (eventId) {
        await supabase
          .from("matches")
          .update({ calendar_event_id: eventId, calendar_provider: "google" })
          .eq("id", m.id)
        count++
      }
    } catch (e) {
      // continue on error to process remaining
    }
  }

  return NextResponse.json({ synced: count })
}
