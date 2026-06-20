import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LegalFooter } from "@/components/LegalFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Study Buddy" },
      {
        name: "description",
        content:
          "How Study Buddy collects, stores, and processes the personal data of Ben-Gurion University students, in line with the Israeli Protection of Privacy Law.",
      },
      { property: "og:title", content: "Privacy Policy — Study Buddy" },
      {
        property: "og:description",
        content:
          "How Study Buddy collects, stores, and processes student data under the Israeli Protection of Privacy Law.",
      },
    ],
  }),
  component: PrivacyPage,
});

const LAST_UPDATED = "June 20, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </Link>
          <span className="flex items-center gap-2 font-display font-bold tracking-tight">
            <GraduationCap className="h-5 w-5 text-primary" />
            Study<span className="text-primary">Buddy</span>
          </span>
        </div>

        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </header>

        <div className="space-y-7">
          <Section title="1. Who we are">
            <p>
              Study Buddy is a study-partner matching service for Ben-Gurion University students. This
              policy explains what personal data we collect and how we store and process it, in line
              with the Israeli Protection of Privacy Law, 5741-1981.
            </p>
          </Section>

          <Section title="2. Data we collect">
            <p>
              When you register we collect your first and last name, your university email
              (@post.bgu.ac.il), degree program, year of study, gender, an optional profile photo, and
              an optional short bio. We also store the study availability, messages, and ratings you
              create while using the service.
            </p>
          </Section>

          <Section title="3. How we use your data">
            <p>
              We use your data to operate the service: to show you on the daily billboard, to help
              other students find a study partner, to enable chat, and to compute session ratings. We
              process this data based on your consent, given at registration, and our legitimate
              interest in running the service.
            </p>
          </Section>

          <Section title="4. Marketing communications">
            <p>
              We will only send you promotional updates, future invites, or sponsor offers if you
              actively opt in at registration, in line with the Communications Law (Amendment 40 — the
              "Spam Law"). You can withdraw this consent at any time, and every marketing email
              includes an unsubscribe option.
            </p>
          </Section>

          <Section title="5. Who can see your data">
            <p>
              Other signed-in students can see your first name, last initial, program, photo, bio,
              availability, and rating. Your full last name, email address, and PIN are never shown to
              other users. Reports and safety reviews may be shared with university authorities as
              described in our Terms of Service.
            </p>
          </Section>

          <Section title="6. Storage and security">
            <p>
              Your data is stored on secure, access-controlled cloud infrastructure. Your login PIN is
              stored only as a salted cryptographic hash — never in plain text — and repeated incorrect
              attempts temporarily lock the account.
            </p>
          </Section>

          <Section title="7. Your rights">
            <p>
              Under Israeli privacy law you have the right to review the personal data we hold about
              you, to request corrections, and to request deletion of your account and associated data.
              To exercise these rights, contact us through the app.
            </p>
          </Section>

          <Section title="8. Retention">
            <p>
              We keep your data for as long as your account is active. If you delete your account, we
              remove your personal profile data, subject to any records we must retain for legal or
              safety reasons.
            </p>
          </Section>

          <Section title="9. Contact">
            <p>
              Questions about your privacy or this policy? Reach out through the app and the Study Buddy
              team will respond.
            </p>
          </Section>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center">
          <Link to="/auth">
            <Button>Back to sign in</Button>
          </Link>
        </div>

        <LegalFooter />
      </div>
    </div>
  );
}
