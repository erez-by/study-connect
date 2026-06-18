import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  value: number;
  count?: number;
  size?: number;
  showNumber?: boolean;
  className?: string;
};

export function StarRating({ value, count, size = 16, showNumber = true, className }: StarRatingProps) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = rounded >= i ? 1 : rounded >= i - 0.5 ? 0.5 : 0;
          return (
            <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
              <Star size={size} className="absolute inset-0 text-border" />
              {fill > 0 && (
                <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                  <Star size={size} className="text-gold" fill="currentColor" />
                </span>
              )}
            </span>
          );
        })}
      </div>
      {showNumber && (
        <span className="text-sm font-medium text-muted-foreground">
          {value > 0 ? value.toFixed(1) : "New"}
          {typeof count === "number" && count > 0 ? ` (${count})` : ""}
        </span>
      )}
    </div>
  );
}
