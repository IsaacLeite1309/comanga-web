import { Eye } from "lucide-react";

export function ReadVolumeBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      aria-hidden="true"
      title="Lido"
      className={`pointer-events-none z-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-background ${compact ? "relative h-6 w-6 ring-1" : "absolute left-0 top-9 h-8 w-8 -translate-x-1/4 -translate-y-1/4 ring-2"}`}
    >
      <Eye className={compact ? "h-4 w-4" : "h-5 w-5"} strokeWidth={2.5} />
    </span>
  );
}
