import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, GraduationCap, CalendarClock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { todayStr, type Availability, type Profile } from "@/lib/db";
import { getStudyStyle, formatHourBlock } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StudentAvatar } from "@/components/StudentAvatar";
import { StarRating } from "@/components/StarRating";

export const Route = createFileRoute("/_authenticated/profile/$userId")({
  component: ProfilePage,
});

function ProfilePage() {
  const { userId } = Route.useParams();
  const { user } = useSession();
  const navigate = useNavigate();
  const isMe = user?.id === userId;

  const query = useQuery({
    queryKey: ["profile-detail", userId, todayStr()],
    queryFn: async () => {
      const [{ data: profile }, { data: availability }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase
          .from("daily_availability")
          .select("*")
          .eq("user_id", userId)
          .eq("date", todayStr())
          .maybeSingle(),
      ]);
      return { profile: profile as Profile | null, availability: availability as Availability | null };
    },
  });

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const profile = query.data?.profile;
  const availability = query.data?.availability;

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-xl font-semibold">Student not found</h1>
        <Button asChild variant="ghost" className="mt-4">
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to billboard
          </Link>
        </Button>
      </div>
    );
  }

  const name = `${profile.first_name ?? "Student"}${profile.last_initial ? ` ${profile.last_initial}.` : ""}`;
  const style = getStudyStyle(availability?.study_style);
  const StyleIcon = style?.icon;

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <Button asChild variant="ghost" size="sm" className="mb-4 gap-1.5 text-muted-foreground">
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4" /> Billboard
        </Link>
      </Button>

      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary to-accent" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex items-end justify-between">
            <StudentAvatar name={profile.first_name} avatarUrl={profile.avatar_url} seed={profile.id} className="h-24 w-24 text-3xl" />
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">{name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="h-4 w-4" />
            <span>
              {profile.degree ?? "—"}
              {profile.year_of_study ? ` · Year ${profile.year_of_study}` : ""}
            </span>
          </div>
          <div className="mt-3">
            <StarRating value={Number(profile.average_rating) || 0} count={profile.total_reviews} size={18} />
          </div>

          {profile.bio && <p className="mt-4 text-sm leading-relaxed text-foreground/90">{profile.bio}</p>}

          <div className="mt-5 rounded-xl border border-border bg-secondary/40 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <CalendarClock className="h-4 w-4 text-primary" /> Available today
            </div>
            {availability && (availability.available_hours?.length ?? 0) > 0 ? (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {availability.available_hours.map((h) => (
                    <span key={h} className="rounded-md bg-card px-2 py-1 text-xs font-medium shadow-sm">
                      {formatHourBlock(h)}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {style && (
                    <Badge variant="secondary" className="gap-1">
                      {StyleIcon && <StyleIcon className="h-3 w-3" />}
                      {style.label}
                    </Badge>
                  )}
                  {availability.subject && <Badge variant="outline">{availability.subject}</Badge>}
                </div>
                {availability.optional_note && (
                  <p className="mt-2 text-sm text-muted-foreground">“{availability.optional_note}”</p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No availability posted for today.</p>
            )}
          </div>

          {!isMe && (
            <Button
              className="mt-5 w-full gap-2"
              size="lg"
              onClick={() => navigate({ to: "/chat/$userId", params: { userId: profile.id } })}
            >
              <MessageCircle className="h-4 w-4" /> Message {profile.first_name}
            </Button>
          )}
          {isMe && (
            <p className="mt-5 text-center text-sm text-muted-foreground">This is your profile.</p>
          )}
        </div>
      </Card>
    </main>
  );
}
