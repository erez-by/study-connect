import { Link, useNavigate } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StudentAvatar } from "@/components/StudentAvatar";
import { StarRating } from "@/components/StarRating";
import { getStudyStyle, formatHourBlock } from "@/lib/constants";
import type { Availability, Profile } from "@/lib/db";

export type AvailableStudent = { profile: Profile; availability: Availability };

export function StudentCard({ student }: { student: AvailableStudent }) {
  const { profile, availability } = student;
  const navigate = useNavigate();
  const style = getStudyStyle(availability.study_style);
  const StyleIcon = style?.icon;
  const name = `${profile.first_name ?? "Student"}${profile.last_initial ? ` ${profile.last_initial}.` : ""}`;
  const hours = availability.available_hours ?? [];

  return (
    <Card className="group flex flex-col gap-3 p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      <Link
        to="/profile/$userId"
        params={{ userId: profile.id }}
        className="flex items-start gap-3"
      >
        <StudentAvatar name={profile.first_name} avatarUrl={profile.avatar_url} seed={profile.id} className="h-14 w-14 text-xl" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base font-semibold leading-tight">{name}</h3>
          <p className="truncate text-sm text-muted-foreground">{profile.degree ?? "—"}</p>
          <div className="mt-1">
            <StarRating value={Number(profile.average_rating) || 0} count={profile.total_reviews} size={14} />
          </div>
        </div>
      </Link>

      <div className="flex flex-wrap gap-1.5">
        {style && (
          <Badge variant="secondary" className="gap-1 font-medium">
            {StyleIcon && <StyleIcon className="h-3 w-3" />}
            {style.label}
          </Badge>
        )}
        {availability.subject && (
          <Badge variant="outline" className="font-medium">
            {availability.subject}
          </Badge>
        )}
      </div>

      {hours.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {hours.slice(0, 5).map((h) => (
            <span key={h} className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {formatHourBlock(h)}
            </span>
          ))}
          {hours.length > 5 && (
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              +{hours.length - 5}
            </span>
          )}
        </div>
      )}

      {availability.optional_note && (
        <p className="line-clamp-2 text-sm text-muted-foreground">“{availability.optional_note}”</p>
      )}

      <Button
        className="mt-auto w-full gap-1.5"
        onClick={() => navigate({ to: "/chat/$userId", params: { userId: profile.id } })}
      >
        <MessageCircle className="h-4 w-4" /> Message
      </Button>
    </Card>
  );
}
