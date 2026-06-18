import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { GraduationCap, Users, CalendarClock, Star, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Study Buddy — Find your study partner at BGU" },
      {
        name: "description",
        content:
          "Study Buddy helps Ben-Gurion University students find study partners, share daily availability, and coordinate study sessions.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            Study<span className="text-primary">Buddy</span>
          </span>
        </div>
        <Button asChild size="sm">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        <section className="grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" /> For Ben-Gurion University students
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
              Never study <span className="text-primary">alone</span> again.
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Post your free hours, browse who's available today, and find the perfect study partner — all
              with your <span className="font-semibold text-foreground">@post.bgu.ac.il</span> email.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="text-base">
                <Link to="/auth">Get started — it's free</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-accent/50 blur-2xl" />
            <div className="grid gap-4 sm:grid-cols-2">
              <FeatureCard icon={<CalendarClock className="h-6 w-6" />} title="Daily availability" desc="Tap your free hours on a quick day planner." />
              <FeatureCard icon={<Users className="h-6 w-6" />} title="Live billboard" desc="See who's free to study right now." />
              <FeatureCard icon={<MessageCircle className="h-6 w-6" />} title="Quick chat" desc="Message to coordinate when & where." />
              <FeatureCard icon={<Star className="h-6 w-6" />} title="Trusted ratings" desc="Rate sessions and build reputation." />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-transform hover:-translate-y-1">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">{icon}</div>
      <h3 className="mt-3 font-display text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
