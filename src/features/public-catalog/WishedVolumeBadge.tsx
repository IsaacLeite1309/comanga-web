import { Heart } from "lucide-react";

export function WishedVolumeBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      aria-hidden="true"
      title="Na lista de desejos"
      className={`pointer-events-none absolute top-0 z-10 flex -translate-y-1/4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-background ${compact ? "-left-1 h-6 w-6 ring-1" : "left-0 h-8 w-8 -translate-x-1/4 ring-2"}`}
    >
      <Heart className="h-4 w-4" fill="currentColor" strokeWidth={2.5} />
    </span>
  );
}
