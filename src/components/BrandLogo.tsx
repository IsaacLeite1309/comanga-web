import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <div className={cn("h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0", className)}>
      <span className="text-white font-bold text-2xl leading-none select-none">
        伯
      </span>
    </div>
  );
}
