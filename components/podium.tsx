import Link from "next/link"
import { Medal } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

type Entry = {
  teamId: string
  teamName: string
  count: number
  isPrivate?: boolean
  logoUrl?: string | null // added logo support
  personId?: string // allow person entries to enable photo click-through to person page
}

export function Podium({
  title,
  entries,
  accent = "fame",
}: {
  title: string
  entries: Entry[]
  accent?: "fame" | "shame"
}) {
  const colors =
    accent === "fame"
      ? { bar: "bg-primary/20 border-primary/30", text: "text-primary" }
      : { bar: "bg-red-500/20 border-red-500/30", text: "text-red-500" }

  // ensure up to 4 items and map to podium positions
  const top = entries.slice(0, 4)
  const first = top[0]
  const second = top[1]
  const third = top[2]
  const fourth = top[3]

  // visual heights
  const H = {
    first: "h-56",
    second: "h-44",
    third: "h-36",
    fourth: "h-28",
  }

  function Bar({
    position,
    item,
    heightClass,
    accent,
  }: {
    position: number
    item?: Entry
    heightClass: string
    accent: "fame" | "shame"
  }) {
    const rectAlign = "items-end"
    const contentJustify = "justify-end"
    const positionLabel = accent === "shame" ? `#Last ${position}` : `#${position}`

    const medalColor =
      position === 1
        ? "text-yellow-400"
        : position === 2
          ? "text-slate-300"
          : position === 3
            ? "text-amber-700"
            : "text-neutral-400"

    const isTopWinner = accent === "fame" && position === 1
    const isTopLoser = accent === "shame" && position === 1
    const isHoverOnly = position >= 2
    const fameHover = accent === "fame" && isHoverOnly
    const shameHover = accent === "shame" && isHoverOnly

    return (
      <div className="flex flex-col items-center">
        <div
          className={[
            "group w-full rounded-xl border backdrop-blur",
            "glass-card",
            colors.bar,
            heightClass,
            "flex",
            rectAlign,
            "justify-center",
            "p-3",
            "relative overflow-hidden transition-shadow",
            isTopWinner ? "ring-2 ring-yellow-400/50 shadow-[0_0_30px_rgba(250,204,21,0.25)]" : "",
            isTopLoser ? "ring-2 ring-red-500/40" : "",
            fameHover ? "hover:ring-1 hover:ring-yellow-400/40 hover:shadow-[0_0_20px_rgba(250,204,21,0.15)]" : "",
            shameHover ? "hover:ring-1 hover:ring-red-500/40" : "",
          ].join(" ")}
          aria-label={`Position ${position}`}
        >
          <div className="absolute top-2 left-2 rounded-md px-2 py-1 text-xs font-bold bg-background/70">
            {positionLabel}
          </div>

          <Medal
            className={[
              "absolute top-2 right-2 h-4 w-4 opacity-90",
              medalColor,
              isTopWinner ? "animate-bounce" : "",
              fameHover ? "group-hover:animate-bounce" : "",
              shameHover ? "group-hover:animate-pulse" : "",
            ].join(" ")}
            aria-hidden="true"
          />

          {isTopWinner && (
            <>
              <span
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-24 w-24 rounded-full bg-yellow-400/20 blur-sm animate-ping"
                aria-hidden="true"
              />
              <span
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-28 w-28 rounded-full bg-yellow-400/10 blur-md"
                aria-hidden="true"
              />
              <span className="sr-only">Top winner animation</span>
            </>
          )}

          {isTopLoser && (
            <>
              <span
                className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-red-500/20 to-transparent animate-pulse"
                aria-hidden="true"
              />
              <span className="sr-only">Top loser animation</span>
            </>
          )}

          {fameHover && (
            <span
              className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400/15 blur-sm opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              aria-hidden="true"
            />
          )}
          {shameHover && (
            <span
              className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-red-500/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              aria-hidden="true"
            />
          )}

          <div className={["flex w-full flex-col items-center", contentJustify, "gap-2"].join(" ")}>
            {(() => {
              const avatarClasses = [
                "h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center overflow-hidden border border-white/20",
                isTopLoser ? "grayscale" : "",
                shameHover ? "group-hover:grayscale" : "",
                item?.personId ? "transition-transform duration-300 group-hover:scale-110 will-change-transform" : "",
                item?.personId ? "cursor-pointer" : "",
              ]
                .filter(Boolean)
                .join(" ")

              const avatarInner = item?.logoUrl ? (
                <img
                  src={item.logoUrl || "/placeholder.svg?height=48&width=48&query=profile-avatar"}
                  alt={`${item?.teamName || "Profile"} avatar`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold">{item?.teamName?.substring(0, 2).toUpperCase() || "NA"}</span>
              )

              if (!item) {
                return <div className={avatarClasses}>{avatarInner}</div>
              }

              const infoRow = (
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md overflow-hidden border border-white/20">
                    {item.logoUrl ? (
                      <img
                        src={item.logoUrl || "/placeholder.svg?height=36&width=36&query=profile-avatar"}
                        alt={`${item.teamName} avatar`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full grid place-items-center bg-muted/30 text-xs font-semibold">
                        {(item.teamName || "NA").substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold leading-5">{item.teamName}</div>
                    <div
                      className={[
                        "text-xs mt-0.5 flex items-center",
                        accent === "fame" ? "text-primary" : "text-red-500",
                      ].join(" ")}
                    >
                      <Medal className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                      {accent === "fame" ? "Fame" : "Shame"}: {item.count} {item.count === 1 ? "time" : "times"}
                    </div>
                  </div>
                </div>
              )

              return (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {item.personId ? (
                        <Link
                          href={`/people/${item.personId}`}
                          aria-label={`View ${item.teamName}`}
                          className="inline-block"
                        >
                          <div className={avatarClasses}>{avatarInner}</div>
                        </Link>
                      ) : (
                        <div className={avatarClasses}>{avatarInner}</div>
                      )}
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" className="w-56">
                      {infoRow}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })()}

            <div
              className={[
                "rounded-full text-xs font-semibold px-2 py-1 flex items-center",
                "bg-background/70 text-foreground",
                isTopLoser ? "text-red-500" : "",
                shameHover ? "group-hover:text-red-500" : "",
              ].join(" ")}
            >
              <Medal className="mr-1 h-3.5 w-3.5 text-foreground/70" aria-hidden="true" />
              {item ? `${item.count} ${item.count === 1 ? "time" : "times"}` : "—"}
            </div>
          </div>
        </div>

        <div className="mt-3 text-center">{/* intentionally blank to not show team name for Hall */}</div>
      </div>
    )
  }

  return (
    <section className="container mx-auto px-4 py-10">
      <h2 className="text-3xl font-bold tracking-tight mb-6 text-balance text-center">{title}</h2>
      {/* mobile: stacked */}
      <div className="grid gap-6 md:hidden">
        <Bar position={1} item={first} heightClass={H.first} accent={accent} />
        <Bar position={2} item={second} heightClass={H.second} accent={accent} />
        <Bar position={3} item={third} heightClass={H.third} accent={accent} />
        <Bar position={4} item={fourth} heightClass={H.fourth} accent={accent} />
      </div>
      {/* desktop: 2 - 1 - 3 - 4 */}
      <div className={`hidden md:grid md:grid-cols-4 gap-6 ${accent === "shame" ? "items-start" : "items-end"}`}>
        <Bar position={2} item={second} heightClass={H.second} accent={accent} />
        <Bar position={1} item={first} heightClass={H.first} accent={accent} />
        <Bar position={3} item={third} heightClass={H.third} accent={accent} />
        <Bar position={4} item={fourth} heightClass={H.fourth} accent={accent} />
      </div>
    </section>
  )
}
