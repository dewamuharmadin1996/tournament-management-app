import { Trophy, Award } from "lucide-react"
import Link from "next/link"

interface ChampionBadgeProps {
  type: "champion" | "loser"
  label: string
  teamName: string
  teamId?: string
  seasonName?: string
  seasonId?: string
  tournamentId?: string
  isLoggedIn?: boolean
  isPrivate?: boolean
}

export function ChampionBadge({
  type,
  label,
  teamName,
  teamId,
  seasonName,
  seasonId,
  tournamentId,
  isLoggedIn,
  isPrivate,
}: ChampionBadgeProps) {
  const Icon = type === "champion" ? Trophy : Award
  const colorClass = type === "champion" ? "text-yellow-500" : "text-muted-foreground"

  const content = (
    <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card/50">
      <Icon className={`h-5 w-5 ${colorClass}`} />
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {teamId && (!isPrivate || isLoggedIn) ? (
            <Link href={`/teams/${teamId}`} className="text-sm text-primary hover:underline">
              {teamName}
            </Link>
          ) : (
            <span className="text-sm text-foreground">{teamName}</span>
          )}
          {seasonName && seasonId && tournamentId && (
            <>
              <span className="text-sm text-muted-foreground">•</span>
              <Link
                href={`/tournaments/${tournamentId}/seasons/${seasonId}`}
                className="text-sm text-muted-foreground hover:text-primary hover:underline"
              >
                {seasonName}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )

  return content
}
