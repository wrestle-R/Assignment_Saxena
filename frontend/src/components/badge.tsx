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
        "inline-flex items-center border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em]",
        tone === "high" && "border-destructive/20 bg-destructive/8 text-destructive",
        tone === "medium" && "border-primary/20 bg-primary/8 text-primary",
        tone === "success" && "border-emerald-500/20 bg-emerald-500/8 text-emerald-600",
        tone === "warning" && "border-amber-500/20 bg-amber-500/8 text-amber-700",
        tone === "neutral" && "border-border bg-muted/50 text-muted-foreground"
      )}
    >
      {children}
    </span>
  )
}
