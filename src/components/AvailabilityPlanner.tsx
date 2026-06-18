import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, CalendarClock } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HOUR_BLOCKS, STUDY_STYLES, formatHourBlock } from "@/lib/constants";
import { todayStr, type Availability } from "@/lib/db";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  existing?: Availability | null;
  onSaved?: () => void;
};

export function AvailabilityPlanner({ open, onOpenChange, userId, existing, onSaved }: Props) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("");
  const [style, setStyle] = useState<string>("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const dragging = useRef(false);
  const dragValue = useRef(false);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set(existing?.available_hours ?? []));
    setSubject(existing?.subject ?? "");
    setStyle(existing?.study_style ?? "");
    setNote(existing?.optional_note ?? "");
  }, [open, existing]);

  function applyBlock(block: string, value: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (value) next.add(block);
      else next.delete(block);
      return next;
    });
  }

  function onPointerDown(block: string) {
    dragging.current = true;
    dragValue.current = !selected.has(block);
    applyBlock(block, dragValue.current);
  }
  function onPointerEnter(block: string) {
    if (dragging.current) applyBlock(block, dragValue.current);
  }

  useEffect(() => {
    const stop = () => (dragging.current = false);
    window.addEventListener("pointerup", stop);
    return () => window.removeEventListener("pointerup", stop);
  }, []);

  async function handleSave() {
    if (selected.size === 0) {
      toast.error("Select at least one free hour");
      return;
    }
    if (!style) {
      toast.error("Pick a study style");
      return;
    }
    setSaving(true);
    const hours = HOUR_BLOCKS.filter((b) => selected.has(b));
    const { error } = await supabase.from("daily_availability").upsert(
      {
        user_id: userId,
        date: todayStr(),
        available_hours: hours,
        subject: subject.trim() || null,
        study_style: style,
        optional_note: note.trim() || null,
      },
      { onConflict: "user_id,date" },
    );
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries();
    toast.success("Availability posted for today! 🎯");
    onSaved?.();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 font-display">
            <CalendarClock className="h-5 w-5 text-primary" /> Today's availability
          </DialogTitle>
          <DialogDescription>Tap or drag to mark the hours you're free to study.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[55vh]">
          <div className="space-y-4 px-5 py-4">
            <div className="select-none rounded-xl border border-border p-1.5" style={{ touchAction: "none" }}>
              {HOUR_BLOCKS.map((block) => {
                const active = selected.has(block);
                return (
                  <button
                    key={block}
                    type="button"
                    onPointerDown={() => onPointerDown(block)}
                    onPointerEnter={() => onPointerEnter(block)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    <span>{formatHourBlock(block)}</span>
                    {active && <Check className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject / course (optional)</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Calculus 2, Intro to CS"
                maxLength={60}
              />
            </div>

            <div className="space-y-2">
              <Label>Study style</Label>
              <div className="grid grid-cols-2 gap-2">
                {STUDY_STYLES.map((s) => {
                  const Icon = s.icon;
                  const active = style === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStyle(s.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-medium transition-colors",
                        active
                          ? "border-primary bg-secondary text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "")} />
                      <span className="leading-tight">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Prefer the Aranne library, ground floor"
                maxLength={140}
                rows={2}
              />
            </div>
          </div>
        </ScrollArea>

        <div className="border-t border-border px-5 py-4">
          <Button onClick={handleSave} className="w-full" size="lg" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post my availability"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
