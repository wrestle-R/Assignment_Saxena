/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"

type Theme = "dark" | "light" | "system"
type ResolvedTheme = "dark" | "light"
type ThemeToggleOrigin = {
  x: number
  y: number
}
type ThemeSetOptions = {
  origin?: ThemeToggleOrigin
}

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  disableTransitionOnChange?: boolean
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme, options?: ThemeSetOptions) => void
}

const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)"
const THEME_VALUES: Theme[] = ["dark", "light", "system"]
const THEME_TRANSITION_MS = 780
const THEME_SWITCH_DELAY_MS = 280
const THEME_SURFACE = {
  dark: "oklch(0.1904 0.0040 106.7692)",
  light: "oklch(0.9755 0.0067 97.3510)",
} as const

const ThemeProviderContext = React.createContext<
  ThemeProviderState | undefined
>(undefined)

function isTheme(value: string | null): value is Theme {
  if (value === null) {
    return false
  }

  return THEME_VALUES.includes(value as Theme)
}

function getSystemTheme(): ResolvedTheme {
  if (window.matchMedia(COLOR_SCHEME_QUERY).matches) {
    return "dark"
  }

  return "light"
}

function disableTransitionsTemporarily() {
  const style = document.createElement("style")
  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{-webkit-transition:none!important;transition:none!important}"
    )
  )
  document.head.appendChild(style)

  return () => {
    window.getComputedStyle(document.body)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        style.remove()
      })
    })
  }
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.isContentEditable) {
    return true
  }

  const editableParent = target.closest(
    "input, textarea, select, [contenteditable='true']"
  )
  if (editableParent) {
    return true
  }

  return false
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  disableTransitionOnChange = true,
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    const storedTheme = localStorage.getItem(storageKey)
    if (isTheme(storedTheme)) {
      return storedTheme
    }

    return defaultTheme
  })
  const [transitionState, setTransitionState] = React.useState<{
    key: number
    origin: ThemeToggleOrigin
    resolvedTheme: ResolvedTheme
    radius: number
  } | null>(null)
  const switchTimeoutRef = React.useRef<number | null>(null)
  const cleanupTimeoutRef = React.useRef<number | null>(null)

  const setTheme = React.useCallback(
    (nextTheme: Theme, options?: ThemeSetOptions) => {
      const resolvedTheme =
        nextTheme === "system" ? getSystemTheme() : nextTheme

      if (options?.origin) {
        const { innerWidth, innerHeight } = window
        const { x, y } = options.origin
        const radius = Math.hypot(
          Math.max(x, innerWidth - x),
          Math.max(y, innerHeight - y)
        )

        if (switchTimeoutRef.current) {
          window.clearTimeout(switchTimeoutRef.current)
        }

        if (cleanupTimeoutRef.current) {
          window.clearTimeout(cleanupTimeoutRef.current)
        }

        setTransitionState({
          key: Date.now(),
          origin: options.origin,
          resolvedTheme,
          radius,
        })

        switchTimeoutRef.current = window.setTimeout(() => {
          localStorage.setItem(storageKey, nextTheme)
          setThemeState(nextTheme)
        }, THEME_SWITCH_DELAY_MS)

        cleanupTimeoutRef.current = window.setTimeout(() => {
          setTransitionState(null)
        }, THEME_TRANSITION_MS)

        return
      }

      localStorage.setItem(storageKey, nextTheme)
      setThemeState(nextTheme)
    },
    [storageKey]
  )

  const applyTheme = React.useCallback(
    (nextTheme: Theme) => {
      const root = document.documentElement
      const resolvedTheme =
        nextTheme === "system" ? getSystemTheme() : nextTheme
      const restoreTransitions = disableTransitionOnChange
        ? disableTransitionsTemporarily()
        : null

      root.classList.remove("light", "dark")
      root.classList.add(resolvedTheme)

      if (restoreTransitions) {
        restoreTransitions()
      }
    },
    [disableTransitionOnChange]
  )

  React.useEffect(() => {
    applyTheme(theme)

    if (theme !== "system") {
      return undefined
    }

    const mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY)
    const handleChange = () => {
      applyTheme("system")
    }

    mediaQuery.addEventListener("change", handleChange)

    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [theme, applyTheme])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (isEditableTarget(event.target)) {
        return
      }

      if (event.key.toLowerCase() !== "d") {
        return
      }

      setThemeState((currentTheme) => {
        const nextTheme =
          currentTheme === "dark"
            ? "light"
            : currentTheme === "light"
              ? "dark"
              : getSystemTheme() === "dark"
                ? "light"
                : "dark"

        localStorage.setItem(storageKey, nextTheme)
        return nextTheme
      })
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [storageKey])

  React.useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea !== localStorage) {
        return
      }

      if (event.key !== storageKey) {
        return
      }

      if (isTheme(event.newValue)) {
        setThemeState(event.newValue)
        return
      }

      setThemeState(defaultTheme)
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [defaultTheme, storageKey])

  React.useEffect(() => {
    return () => {
      if (switchTimeoutRef.current) {
        window.clearTimeout(switchTimeoutRef.current)
      }

      if (cleanupTimeoutRef.current) {
        window.clearTimeout(cleanupTimeoutRef.current)
      }
    }
  }, [])

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
    }),
    [theme, setTheme]
  )

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
      <AnimatePresence>
        {transitionState ? (
          <motion.div
            key={transitionState.key}
            className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: "linear" }}
            aria-hidden="true"
          >
            <motion.div
              className="absolute rounded-full"
              style={{
                backgroundColor: THEME_SURFACE[transitionState.resolvedTheme],
                left: transitionState.origin.x,
                top: transitionState.origin.y,
                width: 24,
                height: 24,
                translateX: "-50%",
                translateY: "-50%",
              }}
              initial={{ scale: 0 }}
              animate={{ scale: transitionState.radius / 12 }}
              transition={{
                duration: THEME_TRANSITION_MS / 1000,
                ease: [0.55, 0.02, 0.98, 0.7],
              }}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext)

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  return context
}
