import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
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
import { Checkbox } from "@/components/ui/checkbox";
import { StudentAvatar } from "@/components/StudentAvatar";
import { LegalFooter } from "@/components/LegalFooter";
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
  last_name: z.string().trim().min(1, "Last name is required").max(60),
  gender: z.string().min(1, "Please select your gender"),
  degree: z.string().min(1, "Please select your program"),
  year_of_study: z.number().int().min(1).max(10),
  bio: z.string().trim().max(280).optional(),
});

type FieldErrors = Partial<Record<"first_name" | "last_name" | "gender" | "degree" | "terms", string>>;

const BIO_MAX = 280;

function Onboarding() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [degree, setDegree] = useState("");
  const [year, setYear] = useState("1");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

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
        setLastName(data.last_name ?? "");
        setGender(data.gender ?? "");
        setDegree(data.degree ?? "");
        setYear(data.year_of_study ? String(data.year_of_study) : "1");
        setBio(data.bio ?? "");
        setAvatarUrl(data.avatar_url ?? null);
        setMarketingOptIn(data.marketing_opt_in ?? false);
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
      last_name: lastName,
      gender,
      degree,
      year_of_study: Number(year),
      bio,
    });

    const nextErrors: FieldErrors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      }
    }
    if (!agreedToTerms) {
      nextErrors.terms = "You must accept the Terms of Use and Privacy Policy to continue.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setErrors({});

    const data = parsed.data!;
    const lastInitial = data.last_name.charAt(0).toUpperCase();

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: data.first_name,
        last_name: data.last_name,
        last_initial: lastInitial,
        gender: data.gender,
        degree: data.degree,
        year_of_study: data.year_of_study,
        bio: data.bio,
        avatar_url: avatarUrl,
        email: user.email,
        marketing_opt_in: marketingOptIn,
        profile_completed: true,
        accepted_terms_at: new Date().toISOString(),
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
        <h1 className="font-display text-2xl font-bold tracking-tight">Create your profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A real photo and a friendly bio help others trust you as a study partner.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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

          <fieldset className="space-y-4">
            <legend className="mb-1 text-sm font-semibold text-foreground">Your details</legend>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first">
                  First name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="first"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Maya"
                  required
                  aria-required="true"
                  aria-invalid={!!errors.first_name}
                  aria-describedby={errors.first_name ? "first-error" : undefined}
                  maxLength={40}
                />
                {errors.first_name && (
                  <p id="first-error" role="alert" className="text-xs font-medium text-destructive">
                    {errors.first_name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last">
                  Last name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Levi"
                  required
                  aria-required="true"
                  aria-invalid={!!errors.last_name}
                  aria-describedby={errors.last_name ? "last-error" : undefined}
                  maxLength={60}
                />
                {errors.last_name && (
                  <p id="last-error" role="alert" className="text-xs font-medium text-destructive">
                    {errors.last_name}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">University email</Label>
              <Input id="email" type="email" value={user?.email ?? ""} readOnly disabled aria-readonly="true" />
              <p className="text-xs text-muted-foreground">
                Verified at sign-up — only other students' first name and last initial are shown publicly.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gender">
                  Gender <span className="text-destructive">*</span>
                </Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger
                    id="gender"
                    aria-required="true"
                    aria-invalid={!!errors.gender}
                    aria-describedby={errors.gender ? "gender-error" : undefined}
                  >
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
                {errors.gender && (
                  <p id="gender-error" role="alert" className="text-xs font-medium text-destructive">
                    {errors.gender}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year of study</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger id="year">
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
              <Label htmlFor="degree">
                Degree / Program <span className="text-destructive">*</span>
              </Label>
              <Select value={degree} onValueChange={setDegree}>
                <SelectTrigger
                  id="degree"
                  aria-required="true"
                  aria-invalid={!!errors.degree}
                  aria-describedby={errors.degree ? "degree-error" : undefined}
                >
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
              {errors.degree && (
                <p id="degree-error" role="alert" className="text-xs font-medium text-destructive">
                  {errors.degree}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Short bio (optional)</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                placeholder="e.g. I love group study sessions and explaining tricky concepts!"
                maxLength={BIO_MAX}
                rows={3}
                aria-describedby="bio-count"
              />
              <p id="bio-count" className="text-right text-xs text-muted-foreground" aria-live="polite">
                {bio.length}/{BIO_MAX}
              </p>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="mb-1 text-sm font-semibold text-foreground">Consent</legend>

            <div className="flex items-start gap-2.5">
              <Checkbox
                id="accept-terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                aria-required="true"
                aria-invalid={!!errors.terms}
                aria-describedby={errors.terms ? "terms-error" : undefined}
                className="mt-0.5"
              />
              <Label htmlFor="accept-terms" className="text-xs font-normal leading-relaxed text-muted-foreground">
                I have read and agree to the{" "}
                <Link to="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-2">
                  Terms of Use
                </Link>{" "}
                and{" "}
                <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-2">
                  Privacy Policy
                </Link>{" "}
                regarding the storage and processing of my data. <span className="text-destructive">*</span>
              </Label>
            </div>
            {errors.terms && (
              <p id="terms-error" role="alert" className="text-xs font-medium text-destructive">
                {errors.terms}
              </p>
            )}

            <div className="flex items-start gap-2.5">
              <Checkbox
                id="marketing"
                checked={marketingOptIn}
                onCheckedChange={(checked) => setMarketingOptIn(checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="marketing" className="text-xs font-normal leading-relaxed text-muted-foreground">
                I agree to receive promotional updates, future invites, and sponsor offers via email. (Optional)
              </Label>
            </div>
          </fieldset>

          <Button type="submit" className="w-full" size="lg" disabled={saving || uploading}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" /> Start finding study partners
              </>
            )}
          </Button>
        </form>
      </Card>

      <LegalFooter />
    </div>
  );
}
