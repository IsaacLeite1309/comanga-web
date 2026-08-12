import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  message: string;
  fullPage?: boolean;
};

export function LoadingState({ message, fullPage = false }: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-12 text-muted-foreground",
        fullPage && "min-h-[calc(100dvh-5rem)] flex-1"
      )}
      role="status"
    >
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      {message}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <div className="px-4 py-12 text-center text-sm font-semibold text-muted-foreground">{message}</div>;
}
