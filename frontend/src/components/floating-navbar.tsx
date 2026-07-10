import { LogOut, MoonStar, SunMedium } from "lucide-react"
import { motion } from "framer-motion"
import { useRef } from "react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

type FloatingNavbarProps = {
  title?: string
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
  const { theme, setTheme } = useTheme()
  const themeToggleRef = useRef<HTMLButtonElement | null>(null)
  const nextTheme = theme === "dark" ? "light" : "dark"

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="sticky top-0 z-40 border-b border-border/70 bg-background/88 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.34em] text-muted-foreground sm:text-base">
            {eyebrow}
          </p>
          {title ? (
            <h1 className="mt-1 truncate text-2xl leading-none font-semibold sm:text-[2rem]">
              {title}
            </h1>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {primaryActionLabel && onPrimaryAction ? (
            <Button
              onClick={onPrimaryAction}
              size="sm"
              variant="ghost"
              className="rounded-full px-4"
            >
              {primaryActionLabel}
            </Button>
          ) : null}
          {onLogout ? (
            <Button
              onClick={onLogout}
              size="icon-sm"
              variant="ghost"
              aria-label="Log out"
              className="rounded-full"
            >
              <LogOut className="size-4" />
            </Button>
          ) : null}
          <Button
            ref={themeToggleRef}
            onClick={() => {
              const bounds = themeToggleRef.current?.getBoundingClientRect()

              setTheme(nextTheme, {
                origin: bounds
                  ? {
                      x: bounds.left + bounds.width / 2,
                      y: bounds.top + bounds.height / 2,
                    }
                  : undefined,
              })
            }}
            size="icon-sm"
            variant="ghost"
            aria-label="Toggle theme"
            className="rounded-full"
          >
            {theme === "dark" ? (
              <SunMedium className="size-4" />
            ) : (
              <MoonStar className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </motion.header>
  )
}
