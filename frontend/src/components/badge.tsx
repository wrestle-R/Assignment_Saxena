import { cn } from "@/lib/utils"

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode
  tone?: "neutral" | "high" | "medium" | "success" | "warning"
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        tone === "high" && "bg-destructive/12 text-destructive",
        tone === "medium" && "bg-primary/15 text-primary",
        tone === "success" && "bg-emerald-500/12 text-emerald-600",
        tone === "warning" && "bg-amber-500/12 text-amber-700",
        tone === "neutral" && "bg-muted text-muted-foreground"
      )}
    >
      {children}
    </span>
  )
}
