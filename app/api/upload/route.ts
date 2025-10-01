import { NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const path = (formData.get("path") as string | null) || null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const name = path || file.name
    const blob = await put(name, file, { access: "public" })

    return NextResponse.json({ url: blob.url })
  } catch (err) {
    console.error("[v0] Upload error:", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
