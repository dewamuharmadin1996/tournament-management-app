import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const supabase = await createClient()

  const { data: match } = await supabase
    .from("matches")
    .select(
      `
      id,
      scheduled_at,
      season:season_id(
        name,
        tournament:tournament_id(name)
      ),
      team1:team1_id(name),
      team2:team2_id(name)
    `,
    )
    .eq("id", id)
    .single()

  if (!match) {
    return new Response("Not found", { status: 404 })
  }

  const tName = match.season?.tournament?.name ? String(match.season.tournament.name) : undefined
  const sName = match.season?.name ? String(match.season.name) : undefined
  const prefix = [tName, sName].filter(Boolean).join(" - ")
  const base = `${match.team1?.name || "TBD"} vs ${match.team2?.name || "TBD"}`
  const title = prefix ? `${prefix}: ${base}` : base
  const description = title

  const start = match.scheduled_at ? new Date(match.scheduled_at) : new Date()
  const end = new Date(start.getTime() + 90 * 60 * 1000) // default 90 minutes

  const toICS = (d: Date) => {
    // UTC format YYYYMMDDTHHMMSSZ
    const pad = (n: number) => `${n}`.padStart(2, "0")
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(
      d.getUTCMinutes(),
    )}${pad(d.getUTCSeconds())}Z`
  }

  const uid = `match-${match.id}@tournament-app`
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tournament Management//Match Invite//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toICS(new Date())}`,
    `DTSTART:${toICS(start)}`,
    `DTEND:${toICS(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="match-${id}.ics"`,
      "Cache-Control": "no-store",
    },
  })
}
