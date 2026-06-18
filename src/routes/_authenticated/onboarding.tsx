import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { uploadAvatar } from "@/lib/db";
import { DEGREE_PROGRAMS, GENDERS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { StudentAvatar } from "@/components/StudentAvatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

const schema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(40),
  last_initial: z.string().trim().min(1, "Last initial is required").max(2),
  gender: z.string().min(1, "Please select"),
  degree: z.string().min(1, "Please select your program"),
  year_of_study: z.number().int().min(1).max(10),
  bio: z.string().trim().max(280).optional(),
});

function Onboarding() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastInitial, setLastInitial] = useState("");
  const [gender, setGender] = useState("");
  const [degree, setDegree] = useState("");
  const [year, setYear] = useState("1");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Prefill if a profile already partially exists.
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        if (data.profile_completed) {
          navigate({ to: "/dashboard", replace: true });
          return;
        }
        setFirstName(data.first_name ?? "");
        setLastInitial(data.last_initial ?? "");
        setGender(data.gender ?? "");
        setDegree(data.degree ?? "");
        setYear(data.year_of_study ? String(data.year_of_study) : "1");
        setBio(data.bio ?? "");
        setAvatarUrl(data.avatar_url ?? null);
      });
  }, [user, navigate]);

  async function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadAvatar(user.id, file);
      setAvatarUrl(url);
      toast.success("Photo uploaded!");
    } catch {
      toast.error("Upload failed. Try another image.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({
      first_name: firstName,
      last_initial: lastInitial,
      gender,
      degree,
      year_of_study: Number(year),
      bio,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        ...parsed.data,
        avatar_url: avatarUrl,
        email: user.email,
        profile_completed: true,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries();
    toast.success("Welcome to Study Buddy! 🎉");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight">Set up your profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A real photo and a friendly bio help others trust you as a study partner.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group relative"
              aria-label="Upload profile photo"
            >
              <StudentAvatar name={firstName || "?"} avatarUrl={avatarUrl} seed={user?.id} className="h-24 w-24 text-3xl" />
              <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </span>
            </button>
            <p className="text-xs text-muted-foreground">
              {avatarUrl ? "Looking good! Tap to change." : "Tap to add a real photo — it builds trust ✨"}
            </p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePickFile} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="first">First name</Label>
              <Input id="first" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Maya" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last">Last initial</Label>
              <Input id="last" value={lastInitial} onChange={(e) => setLastInitial(e.target.value)} placeholder="L" maxLength={2} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year of study</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      Year {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Degree / Program</Label>
            <Select value={degree} onValueChange={setDegree}>
              <SelectTrigger>
                <SelectValue placeholder="Select your program" />
              </SelectTrigger>
              <SelectContent>
                {DEGREE_PROGRAMS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Short bio (optional)</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. I love group study sessions and explaining tricky concepts!"
              maxLength={280}
              rows={3}
            />
            <p className="text-right text-xs text-muted-foreground">{bio.length}/280</p>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={saving || uploading}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                <Sparkles className="mr-2 h-4 w-4" /> Start finding study partners
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
