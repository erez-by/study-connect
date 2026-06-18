import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewerId: string;
  reviewedUserId: string;
  reviewedName: string;
  onDone?: () => void;
};

export function RatingDialog({
  open,
  onOpenChange,
  reviewerId,
  reviewedUserId,
  reviewedName,
  onDone,
}: Props) {
  const queryClient = useQueryClient();
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (stars < 1) {
      toast.error("Pick a star rating");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("reviews").upsert(
      { reviewer_id: reviewerId, reviewed_user_id: reviewedUserId, stars },
      { onConflict: "reviewer_id,reviewed_user_id" },
    );
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries();
    toast.success("Thanks for the feedback! ⭐");
    onDone?.();
    onOpenChange(false);
    setStars(0);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="text-center">
          <DialogTitle className="font-display">How was your session?</DialogTitle>
          <DialogDescription>Rate your study session with {reviewedName}.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-1.5 py-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setStars(i)}
              className="transition-transform hover:scale-110"
              aria-label={`${i} stars`}
            >
              <Star
                className={cn("h-9 w-9", (hover || stars) >= i ? "text-gold" : "text-border")}
                fill={(hover || stars) >= i ? "currentColor" : "none"}
              />
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
          <Button className="flex-1" onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
