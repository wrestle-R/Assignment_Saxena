import { LogOut, MoonStar, SunMedium } from "lucide-react"
import { motion, useMotionValueEvent, useScroll } from "framer-motion"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

type FloatingNavbarProps = {
  title: string
  eyebrow: string
  primaryActionLabel?: string
  onPrimaryAction?: () => void
  onLogout?: () => void
}

export function FloatingNavbar({
  title,
  eyebrow,
  primaryActionLabel,
  onPrimaryAction,
  onLogout,
}: FloatingNavbarProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const { theme, setTheme } = useTheme()
  const [compact, setCompact] = useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, "change", (latest) => {
    setCompact(latest > 48)
  })

  const nextTheme = theme === "dark" ? "light" : "dark"

  return (
    <motion.div ref={ref} className="sticky top-4 z-40">
      <motion.div
        animate={{
          y: compact ? 6 : 0,
          width: compact ? "min(72rem, 92vw)" : "min(78rem, 96vw)",
          backdropFilter: compact ? "blur(18px)" : "blur(10px)",
        }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="mx-auto flex items-center justify-between gap-4 rounded-full border border-white/10 bg-[color-mix(in_oklch,var(--color-card),transparent_18%)] px-4 py-3 shadow-2xl shadow-black/8 sm:px-6"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
            {eyebrow}
          </p>
          <h1 className="truncate text-sm font-semibold tracking-wide sm:text-base">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {primaryActionLabel && onPrimaryAction ? (
            <Button onClick={onPrimaryAction} size="sm" variant="outline">
              {primaryActionLabel}
            </Button>
          ) : null}
          {onLogout ? (
            <Button onClick={onLogout} size="icon-sm" variant="outline" aria-label="Log out">
              <LogOut className="size-4" />
            </Button>
          ) : null}
          <Button
            onClick={() => setTheme(nextTheme)}
            size="icon-sm"
            variant="outline"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <SunMedium className="size-4" /> : <MoonStar className="size-4" />}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
