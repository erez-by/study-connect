import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const PALETTE = [
  "oklch(0.69 0.2 42)",
  "oklch(0.7 0.16 65)",
  "oklch(0.62 0.16 30)",
  "oklch(0.66 0.15 140)",
  "oklch(0.6 0.16 250)",
  "oklch(0.62 0.18 330)",
  "oklch(0.64 0.14 200)",
];

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

type Props = {
  name?: string | null;
  avatarUrl?: string | null;
  seed?: string;
  className?: string;
};

export function StudentAvatar({ name, avatarUrl, seed, className }: Props) {
  const initials = (name || "?").trim().charAt(0).toUpperCase();
  const bg = colorFor(seed || name || "?");
  return (
    <Avatar className={cn("border-2 border-card shadow-sm", className)}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name || "Student"} /> : null}
      <AvatarFallback style={{ backgroundColor: bg, color: "white" }} className="font-display font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
