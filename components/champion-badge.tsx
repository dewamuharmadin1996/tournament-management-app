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
  const isWin = type === "champion"
  const iconColor = isWin ? "text-yellow-500" : "text-red-500"

  return (
    <div
      className={[
        "relative group overflow-hidden",
        // container visual states
        "rounded-lg border bg-card/50 transition-all duration-300",
        isWin
          ? "border-yellow-400/40 hover:shadow-[0_0_20px_rgba(250,204,21,0.25)] hover:scale-[1.01]"
          : "border-red-500/30 hover:ring-1 hover:ring-red-500/40 hover:scale-[0.99]",
      ].join(" ")}
    >
      {/* win glow / lose gloom overlays */}
      {isWin ? (
        <>
          {/* subtle gold glow on hover */}
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400/15 blur-md opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden="true"
          />
          <span className="sr-only">Champion celebration effect</span>
        </>
      ) : (
        <>
          {/* red bottom gloom that pulses on hover */}
          <span
            className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-red-500/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden="true"
          />
          <span className="sr-only">Last place gloomy effect</span>
        </>
      )}

      <div className="flex items-center gap-2 p-3">
        <Icon
          className={[
            "h-5 w-5",
            iconColor,
            // icon motions
            isWin ? "group-hover:animate-bounce" : "group-hover:animate-pulse",
          ].join(" ")}
          aria-hidden="true"
        />
        <div className="flex-1">
          <p className={["text-sm font-medium", isWin ? "text-foreground" : "text-foreground"].join(" ")}>{label}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {teamId && (!isPrivate || isLoggedIn) ? (
              <Link
                href={`/teams/${teamId}`}
                className={[
                  "text-sm hover:underline transition-colors",
                  isWin ? "text-primary hover:text-primary" : "text-muted-foreground hover:text-red-500",
                ].join(" ")}
              >
                {teamName}
              </Link>
            ) : (
              <span
                className={["text-sm transition-colors", isWin ? "text-foreground" : "text-muted-foreground"].join(" ")}
              >
                {teamName}
              </span>
            )}
            {seasonName && seasonId && tournamentId && (
              <>
                <span className="text-sm text-muted-foreground">•</span>
                <Link
                  href={`/tournaments/${tournamentId}/seasons/${seasonId}`}
                  className={[
                    "text-sm hover:underline transition-colors",
                    isWin ? "text-muted-foreground hover:text-primary" : "text-muted-foreground hover:text-red-500",
                  ].join(" ")}
                >
                  {seasonName}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
