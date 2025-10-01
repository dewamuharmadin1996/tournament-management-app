import { NextResponse } from "next/server"
import { del } from "@vercel/blob"

export async function POST(req: Request) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 })
    await del(url)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[v0] Delete error:", err)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
