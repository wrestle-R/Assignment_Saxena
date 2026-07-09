import { LockKeyhole, Sparkles } from "lucide-react"
import { useState } from "react"

import { FloatingNavbar } from "@/components/floating-navbar"
import { Button } from "@/components/ui/button"

export function LoginPage({
  errorMessage,
  isSubmitting,
  onSubmit,
}: {
  errorMessage: string | null
  isSubmitting: boolean
  onSubmit: (credentials: { username: string; password: string }) => Promise<void>
}) {
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("123456")

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--color-primary)/0.18,_transparent_26%),linear-gradient(180deg,var(--color-background),color-mix(in_oklch,var(--color-background),white_32%))] px-4 py-6 sm:px-6">
      <FloatingNavbar eyebrow="Destila Assignment" title="Mini Exception Inbox" />

      <div className="mx-auto mt-10 grid max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <section className="space-y-6 rounded-[36px] border border-white/10 bg-card/85 p-8 shadow-2xl shadow-black/8">
          <BadgeRow />
          <div className="space-y-4">
            <h2 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Mini Exception Inbox
            </h2>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Review deficit exceptions, inspect the 7-day production trend, and
              isolate data-quality breaks before they distort the operational
              picture.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FeatureCard label="Exception-first" value="Timeline inbox" />
            <FeatureCard label="Data quality" value="Separate issue mode" />
            <FeatureCard label="Actions" value="Acknowledge or resolve" />
          </div>
        </section>

        <section className="rounded-[36px] border border-white/10 bg-card/92 p-8 shadow-2xl shadow-black/10">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-primary/12 p-3 text-primary">
              <LockKeyhole className="size-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Operator sign-in</h3>
              <p className="text-sm text-muted-foreground">
                Use the seeded assignment account to enter the dashboard.
              </p>
            </div>
          </div>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              void onSubmit({ username, password })
            }}
          >
            <label className="block space-y-2">
              <span className="text-sm font-medium">Username</span>
              <input
                className="h-12 w-full rounded-2xl border border-border bg-background/75 px-4 outline-none transition focus:border-primary"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Password</span>
              <input
                className="h-12 w-full rounded-2xl border border-border bg-background/75 px-4 outline-none transition focus:border-primary"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {errorMessage ? (
              <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}

            <Button className="h-12 w-full rounded-2xl text-base" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </section>
      </div>
    </div>
  )
}

function BadgeRow() {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-full bg-primary/14 p-2 text-primary">
        <Sparkles className="size-4" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
        Factory ops review workspace
      </p>
    </div>
  )
}

function FeatureCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <article className="rounded-[28px] border border-border/70 bg-background/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </article>
  )
}
