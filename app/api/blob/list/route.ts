import { NextResponse } from "next/server"
import { list } from "@vercel/blob"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const prefix = searchParams.get("prefix") || undefined
    const { blobs } = await list({ prefix })
    const files = blobs.map((b) => ({
      url: b.url,
      pathname: b.pathname,
      size: b.size,
      uploadedAt: b.uploadedAt,
    }))
    return NextResponse.json({ files })
  } catch (err) {
    console.error("[v0] List error:", err)
    return NextResponse.json({ error: "List failed" }, { status: 500 })
  }
}
