import { google } from "googleapis"

const calendarScopes = ["https://www.googleapis.com/auth/calendar"]

function getJwtClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY
  if (!clientEmail || !privateKeyRaw) {
    throw new Error("Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY")
  }
  // Support keys stored with literal \n
  const privateKey = privateKeyRaw.includes("\\n") ? privateKeyRaw.replace(/\\n/g, "\n") : privateKeyRaw

  console.log("[v0] Google key sanity", {
    hasHeader: privateKey.startsWith("-----BEGIN"),
    hasFooter: privateKey.trim().endsWith("END PRIVATE KEY-----"),
    containsEscapes: privateKeyRaw.includes("\\n"),
    emailSet: !!clientEmail,
  })

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: calendarScopes,
  })
}

export function getCalendar() {
  const auth = getJwtClient()
  return google.calendar({ version: "v3", auth })
}

export function getCalendarId() {
  const id = process.env.GOOGLE_CALENDAR_ID
  if (!id) throw new Error("Missing GOOGLE_CALENDAR_ID")
  return id
}
