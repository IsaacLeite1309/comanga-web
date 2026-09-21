import { useState } from "react";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type CatalogCoverProps = {
  src?: string | null;
  alt: string;
  className?: string;
  eager?: boolean;
  emptyLabel?: string;
};

export function CatalogCover({ src, alt, className, eager = false, emptyLabel = "Sem capa" }: CatalogCoverProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn("aspect-[2/3] overflow-hidden rounded-lg border border-border bg-input shadow-sm", className)}>
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-center text-sm font-semibold text-muted-foreground">
          <BookOpen className="h-8 w-8" aria-hidden="true" />
          <span>{emptyLabel}</span>
        </div>
      )}
    </div>
  );
}
