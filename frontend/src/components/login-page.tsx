import { LockKeyhole } from "lucide-react"
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
    <div className="min-h-screen bg-background">
      <FloatingNavbar eyebrow="Saxena" />

      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center justify-center px-4 py-12 sm:px-6">
        <section className="w-full max-w-md border border-border bg-card p-8 sm:p-10">
          <div className="mb-8 flex items-center gap-4">
            <div className="rounded-full border border-border/80 p-3 text-primary">
              <LockKeyhole className="size-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Sign in</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Use your credentials to continue.
              </p>
            </div>
          </div>

          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault()
              void onSubmit({ username, password })
            }}
          >
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Username
              </span>
              <input
                className="h-12 w-full border border-border bg-transparent px-3 outline-none transition focus:border-primary"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Password
              </span>
              <input
                className="h-12 w-full border border-border bg-transparent px-3 outline-none transition focus:border-primary"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {errorMessage ? (
              <p className="border-l-2 border-destructive pl-4 text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}

            <div className="pt-3">
              <Button
                className="h-12 w-full rounded-md px-6 text-base"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
