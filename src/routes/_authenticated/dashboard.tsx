import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  CalendarPlus,
  Users,
  CheckCircle2,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { upcomingDays, formatDateLabel, type Availability, type Profile } from "@/lib/db";
import { STUDY_STYLES } from "@/lib/constants";
import { getMeetupState } from "@/lib/meetup";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StudentCard, type AvailableStudent } from "@/components/StudentCard";
import { AvailabilityPlanner } from "@/components/AvailabilityPlanner";
import { RatingDialog } from "@/components/RatingDialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function Dashboard() {
  const { user } = useSession();
  const userId = user?.id;
  const today = todayStr();

  const [search, setSearch] = useState("");
  const [styles, setStyles] = useState<Set<string>>(new Set());
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<{ id: string; name: string } | null>(null);

  const myAvailability = useQuery({
    queryKey: ["my-availability", userId, today],
    enabled: !!userId,
    queryFn: async (): Promise<Availability | null> => {
      const { data } = await supabase
        .from("daily_availability")
        .select("*")
        .eq("user_id", userId!)
        .eq("date", today)
        .maybeSingle();
      return data;
    },
  });

  const blocks = useQuery({
    queryKey: ["my-blocks", userId],
    enabled: !!userId,
    queryFn: async (): Promise<string[]> => {
      const { data } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", userId!);
      return (data ?? []).map((b) => b.blocked_id);
    },
  });

  const students = useQuery({
    queryKey: ["available", today],
    enabled: !!userId,
    queryFn: async (): Promise<AvailableStudent[]> => {
      const { data: avails } = await supabase
        .from("daily_availability")
        .select("*")
        .eq("date", today);
      if (!avails?.length) return [];
      const ids = [...new Set(avails.map((a) => a.user_id))];
      const { data: profs } = await supabase
        .from("profiles")
        .select("*")
        .in("id", ids)
        .eq("profile_completed", true);
      const map = new Map<string, Profile>((profs ?? []).map((p) => [p.id, p]));
      return avails
        .filter((a) => map.has(a.user_id))
        .map((a) => ({ availability: a, profile: map.get(a.user_id)! }));
    },
  });

  // First availability prompt of the day.
  useEffect(() => {
    if (myAvailability.isSuccess && myAvailability.data === null) {
      const key = `sb_planner_prompted_${today}`;
      if (sessionStorage.getItem(key) !== "true") {
        sessionStorage.setItem(key, "true");
        setPlannerOpen(true);
      }
    }
  }, [myAvailability.isSuccess, myAvailability.data, today]);

  // Rating prompt: chatted >1h ago today, before 20:00, not yet reviewed.
  useEffect(() => {
    if (!userId) return;
    const hour = new Date().getHours();
    if (hour >= 20) return;
    (async () => {
      const { data: msgs } = await supabase
        .from("messages")
        .select("receiver_id, created_at")
        .eq("sender_id", userId)
        .gte("created_at", startOfTodayISO())
        .order("created_at", { ascending: true });
      if (!msgs?.length) return;
      const earliest = new Map<string, string>();
      for (const m of msgs) if (!earliest.has(m.receiver_id)) earliest.set(m.receiver_id, m.created_at);
      const now = Date.now();
      const candidates = [...earliest.entries()].filter(
        ([, ts]) => now - new Date(ts).getTime() >= 60 * 60 * 1000,
      );
      if (!candidates.length) return;
      const ids = candidates.map(([id]) => id);
      const { data: reviewed } = await supabase
        .from("reviews")
        .select("reviewed_user_id")
        .eq("reviewer_id", userId)
        .in("reviewed_user_id", ids);
      const reviewedSet = new Set((reviewed ?? []).map((r) => r.reviewed_user_id));
      const dismissed = new Set(JSON.parse(sessionStorage.getItem("sb_rating_dismissed") || "[]"));
      const pick = ids.find((id) => !reviewedSet.has(id) && !dismissed.has(id));
      if (!pick) return;
      const { data: prof } = await supabase
        .from("profiles")
        .select("first_name, last_initial")
        .eq("id", pick)
        .maybeSingle();
      setRatingTarget({
        id: pick,
        name: prof ? `${prof.first_name ?? "your partner"}${prof.last_initial ? ` ${prof.last_initial}.` : ""}` : "your partner",
      });
    })();
  }, [userId]);

  const filtered = useMemo(() => {
    const blocked = new Set(blocks.data ?? []);
    return (students.data ?? []).filter((s) => {
      if (s.profile.id === userId) return false;
      if (blocked.has(s.profile.id)) return false;
      if (styles.size > 0 && !styles.has(s.availability.study_style ?? "")) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${s.availability.subject ?? ""} ${s.profile.degree ?? ""} ${s.profile.first_name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [students.data, blocks.data, styles, search, userId]);

  function toggleStyle(id: string) {
    setStyles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const hasAvailability = !!myAvailability.data;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Today's billboard</h1>
          <p className="text-sm text-muted-foreground">Students free to study today.</p>
        </div>
        <Button onClick={() => setPlannerOpen(true)} size="lg" className="gap-2">
          <CalendarPlus className="h-4 w-4" />
          {hasAvailability ? "Update my availability" : "Set my availability"}
        </Button>
      </div>

      {hasAvailability && (
        <Card className="mb-5 flex items-center gap-3 border-primary/30 bg-secondary/60 p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm">
            You're on the billboard today with{" "}
            <span className="font-semibold">{myAvailability.data?.available_hours?.length ?? 0} free hours</span>. Nice!
          </p>
        </Card>
      )}

      <div className="mb-5 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject, program or name…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Style:
          </span>
          {STUDY_STYLES.map((s) => {
            const Icon = s.icon;
            const active = styles.has(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggleStyle(s.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {students.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-52 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState onSet={() => setPlannerOpen(true)} hasAvailability={hasAvailability} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <StudentCard key={s.availability.id} student={s} />
          ))}
        </div>
      )}

      {userId && (
        <AvailabilityPlanner
          open={plannerOpen}
          onOpenChange={setPlannerOpen}
          userId={userId}
        />
      )}

      {userId && ratingTarget && (
        <RatingDialog
          open={!!ratingTarget}
          onOpenChange={(open) => {
            if (!open && ratingTarget) {
              const dismissed = JSON.parse(sessionStorage.getItem("sb_rating_dismissed") || "[]");
              sessionStorage.setItem("sb_rating_dismissed", JSON.stringify([...dismissed, ratingTarget.id]));
              setRatingTarget(null);
            }
          }}
          reviewerId={userId}
          reviewedUserId={ratingTarget.id}
          reviewedName={ratingTarget.name}
          onDone={() => setRatingTarget(null)}
        />
      )}
    </main>
  );
}

function EmptyState({ onSet, hasAvailability }: { onSet: () => void; hasAvailability: boolean }) {
  return (
    <Card className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
        <Users className="h-7 w-7" />
      </div>
      <h3 className="font-display text-lg font-semibold">No study partners yet</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        {hasAvailability
          ? "Nobody else has posted availability today — check back soon, or invite a friend!"
          : "Be the first! Post your free hours so others can find you."}
      </p>
      {!hasAvailability && (
        <Button onClick={onSet} className="mt-2 gap-2">
          <CalendarPlus className="h-4 w-4" /> Set my availability
        </Button>
      )}
    </Card>
  );
}
