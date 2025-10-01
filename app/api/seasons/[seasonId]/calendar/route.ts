import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(_req: NextRequest, { params }: { params: { seasonId: string } }) {
  const { seasonId } = params
  const supabase = await createClient()

  const { data: matches } = await supabase
    .from("matches")
    .select(
      `
      id,
      season_id,
      scheduled_at,
      team1:team1_id(name),
      team2:team2_id(name)
    `,
    )
    .eq("season_id", seasonId)
    .not("scheduled_at", "is", null)
    .order("scheduled_at", { ascending: true })

  const { data: season } = await supabase
    .from("seasons")
    .select("id, name, tournament:tournament_id(name)")
    .eq("id", seasonId)
    .single()

  const tName = season?.tournament?.name ? String(season.tournament.name) : undefined
  const sName = season?.name ? String(season.name) : undefined
  const prefix = [tName, sName].filter(Boolean).join(" - ")

  const pad = (n: number) => `${n}`.padStart(2, "0")
  const toICS = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(
      d.getUTCMinutes(),
    )}${pad(d.getUTCSeconds())}Z`

  const now = new Date()
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tournament Management//Season Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ]

  for (const m of matches || []) {
    const base = `${m.team1?.name || "TBD"} vs ${m.team2?.name || "TBD"}`
    const title = prefix ? `${prefix}: ${base}` : base
    const start = new Date(m.scheduled_at as string)
    const end = new Date(start.getTime() + 90 * 60 * 1000)
    const uid = `match-${m.id}@tournament-app`

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${toICS(now)}`,
      `DTSTART:${toICS(start)}`,
      `DTEND:${toICS(end)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${title}`,
      "END:VEVENT",
    )
  }

  lines.push("END:VCALENDAR")

  return new Response(lines.join("\r\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="season-${seasonId}.ics"`,
      "Cache-Control": "no-store",
    },
  })
}
